import argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { Store } from './db.ts';
import { Fault, opaque, seal, unseal, equal, matchTotp, phone } from './security.ts';
import type { Coupon, Details, Session, Round } from './engine.ts';
import type { Question } from './bank.ts';
import { z } from 'zod';
import type { Policy } from './config.ts';

export const redemptionSchema = z
  .object({
    package: z.enum(['gym', 'gym-cardio']),
    duration: z.enum(['half-month', 'month', 'two-months', 'three-months', 'six-months', 'year']),
    newCustomer: z.boolean(),
    otherOffer: z.boolean(),
  })
  .strict();
export type Redemption = z.infer<typeof redemptionSchema>;

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  totp_cipher: string;
  last_totp: number;
  role: 'viewer' | 'redeemer' | 'owner';
  disabled: number;
}
export class Admin {
  private logins = 0;
  private dummy: Promise<string> | undefined;
  constructor(readonly s: Store) {}
  async create(email: string, password: string, secret: string, role: AdminUser['role'] = 'owner') {
    if (password.length < 14 || password.length > 128 || !/^[A-Z2-7]{32,64}$/.test(secret))
      throw new Error('Strong password and TOTP secret required');
    const hash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });
    this.s.run(
      'INSERT INTO admin_users(id,email,password_hash,totp_cipher,role) VALUES(?,?,?,?,?)',
      randomUUID(),
      email.toLowerCase(),
      hash,
      seal(this.s.config.CHALLENGE_DATA_KEY, secret),
      role,
    );
  }
  async login(email: string, password: string, code: string, ip: string) {
    const s = this.s;
    s.limit('admin-ip:' + ip, 10, 900000);
    s.limit('admin-account:' + email.toLowerCase(), 5, 900000);
    const user = s.get<AdminUser>('SELECT * FROM admin_users WHERE email=?', email.toLowerCase());
    if (this.logins >= 2) throw new Fault('busy', 503);
    this.logins++;
    let valid: boolean;
    try {
      const hash =
        user?.password_hash ||
        (await (this.dummy ??= argon2.hash('not-an-account', {
          type: argon2.argon2id,
          memoryCost: 65536,
          timeCost: 3,
          parallelism: 1,
        })));
      valid = await argon2.verify(hash, password);
    } finally {
      this.logins--;
    }
    const step = user
      ? matchTotp(unseal(s.config.CHALLENGE_DATA_KEY, user.totp_cipher), code, s.now())
      : -1;
    if (!user || !valid || user.disabled || step < 0) {
      s.audit('anonymous', 'login_failed', s.hash(email.toLowerCase()));
      throw new Fault('invalid_login', 401);
    }
    return s.atomic(() => {
      if (
        s.run('UPDATE admin_users SET last_totp=? WHERE id=? AND last_totp<?', step, user.id, step)
          .changes !== 1
      )
        throw new Fault('invalid_login', 401);
      const token = opaque(),
        csrf = opaque();
      s.run(
        'INSERT INTO admin_sessions VALUES(?,?,?,?,?)',
        s.hash(token),
        user.id,
        s.hash(csrf),
        s.now() + 28800000,
        s.now(),
      );
      s.audit(user.id, 'login', user.id);
      return { token, csrf, role: user.role };
    });
  }
  authenticate(token: string, csrf?: string) {
    const s = this.s;
    const row = s.get<AdminUser & { csrf_hash: string }>(
      'SELECT u.*, a.csrf_hash FROM admin_sessions a JOIN admin_users u ON u.id=a.admin_id WHERE a.token_hash=? AND a.expires>? AND a.touched>? AND u.disabled=0',
      s.hash(token),
      s.now(),
      s.now() - 1800000,
    );
    if (!row) throw new Fault('authentication_required', 401);
    if (csrf !== undefined && !equal(row.csrf_hash, s.hash(csrf))) throw new Fault('blocked', 403);
    s.run('UPDATE admin_sessions SET touched=? WHERE token_hash=?', s.now(), s.hash(token));
    return row;
  }
  refreshCsrf(token: string) {
    this.authenticate(token);
    const csrf = opaque();
    this.s.run(
      'UPDATE admin_sessions SET csrf_hash=? WHERE token_hash=?',
      this.s.hash(csrf),
      this.s.hash(token),
    );
    return csrf;
  }
  logout(token: string) {
    this.s.run('DELETE FROM admin_sessions WHERE token_hash=?', this.s.hash(token));
  }
  summary() {
    const s = this.s;
    const now = s.now();
    return {
      participants: s.get<{ n: number }>('SELECT count(*) n FROM participants')!.n,
      completed: s.get<{ n: number }>(
        "SELECT count(*) n FROM challenge_sessions WHERE status!='active'",
      )!.n,
      scores: s.all<{ score: number; count: number }>(
        "SELECT score,count(*) count FROM challenge_sessions WHERE status!='active' GROUP BY score",
      ),
      coupons: s.all<{ discount: number; count: number }>(
        'SELECT discount,count(*) count FROM coupons GROUP BY discount',
      ),
      issued: s.get<{ n: number }>('SELECT count(*) n FROM coupons')!.n,
      redeemed: s.get<{ n: number }>("SELECT count(*) n FROM coupons WHERE state='redeemed'")!.n,
      unredeemed: s.get<{ n: number }>(
        "SELECT count(*) n FROM coupons WHERE state='issued' AND expires>?",
        now,
      )!.n,
      expired: s.get<{ n: number }>(
        "SELECT count(*) n FROM coupons WHERE state='issued' AND expires<=?",
        now,
      )!.n,
      email: s.all<{ state: string; count: number }>(
        'SELECT state,count(*) count FROM email_delivery_jobs GROUP BY state',
      ),
      conversions: s.all<{ type: string; count: number }>(
        'SELECT type,count(*) count FROM conversion_events GROUP BY type',
      ),
    };
  }
  participants(query: { page: number; search: string; status: string; sort: string }) {
    const s = this.s;
    const args: unknown[] = [];
    const clauses: string[] = [];
    if (query.search) {
      let value = query.search.trim();
      let field = 'p.name_search';
      if (/^TOP-/i.test(value)) {
        field = 'c.code_hash';
        value = value.toUpperCase();
      } else {
        try {
          value = phone(value);
          field = 'i.phone_hash';
        } catch {
          value = value.toLocaleLowerCase();
        }
      }
      clauses.push(field + '=?');
      args.push(s.hash(value));
    }
    if (query.status === 'expired') {
      clauses.push("c.state='issued' AND c.expires<=?");
      args.push(s.now());
    } else if (query.status === 'issued') {
      clauses.push("c.state='issued' AND c.expires>?");
      args.push(s.now());
    } else if (['redeemed', 'voided'].includes(query.status)) {
      clauses.push('c.state=?');
      args.push(query.status);
    } else if (query.status === 'zero') clauses.push('s.score=0');
    const from =
      ' FROM participants p JOIN challenge_sessions s ON s.id=p.session_id JOIN verified_phone_identities i ON i.id=p.phone_id LEFT JOIN coupons c ON c.participant_id=p.id LEFT JOIN coupon_redemptions r ON r.coupon_id=c.id';
    const where = clauses.length ? ' WHERE ' + clauses.join(' AND ') : '';
    const total = s.get<{ n: number }>('SELECT count(*) n' + from + where, ...args)!.n;
    const order =
      query.sort === 'oldest'
        ? 'p.consent_at ASC,p.id ASC'
        : query.sort === 'score'
          ? 's.score DESC,p.consent_at DESC,p.id'
          : 'p.consent_at DESC,p.id';
    const rows = s.all<{
      id: string;
      session_id: string;
      details_cipher: string;
      phone_cipher: string;
      consent_at: number;
      score: number;
      attribution: string;
      state: string | null;
      expires: number | null;
      code_cipher: string | null;
      redeemed_at: number | null;
    }>(
      'SELECT p.id,p.session_id,p.details_cipher,i.phone_cipher,p.consent_at,s.score,s.attribution,c.state,c.expires,c.code_cipher,r.redeemed_at' +
        from +
        where +
        ' ORDER BY ' +
        order +
        ' LIMIT 25 OFFSET ?',
      ...args,
      (query.page - 1) * 25,
    );
    return {
      total,
      page: query.page,
      pageSize: 25,
      items: rows.map((r) => ({
        id: r.id,
        sessionId: r.session_id,
        ...(JSON.parse(unseal(s.config.CHALLENGE_DATA_KEY, r.details_cipher)) as Details),
        phone: unseal(s.config.CHALLENGE_DATA_KEY, r.phone_cipher),
        createdAt: r.consent_at,
        score: r.score,
        discount: r.score * 10,
        attribution: JSON.parse(r.attribution) as Record<string, string>,
        coupon: r.code_cipher ? unseal(s.config.CHALLENGE_DATA_KEY, r.code_cipher) : null,
        status: r.state === 'issued' && r.expires! <= s.now() ? 'expired' : r.state,
        redeemedAt: r.redeemed_at,
      })),
    };
  }
  detail(id: string) {
    const s = this.s;
    const session = s.get<Session>(
      'SELECT s.* FROM challenge_sessions s JOIN participants p ON p.session_id=s.id WHERE p.id=?',
      id,
    );
    if (!session) throw new Fault('not_found', 404);
    return {
      session,
      questions: s
        .all<Round & { option_id: string | null; correct: number; timed_out: number }>(
          'SELECT q.*,a.option_id,a.correct,a.timed_out FROM challenge_session_questions q JOIN challenge_answers a ON a.session_id=q.session_id AND a.ordinal=q.ordinal WHERE q.session_id=? ORDER BY q.ordinal',
          session.id,
        )
        .map((r) => {
          const q = JSON.parse(r.snapshot) as Question;
          const options = JSON.parse(r.option_order) as { id: string; index: number }[];
          return {
            ordinal: r.ordinal,
            question: q.question,
            answer: options.find((o) => o.id === r.option_id)?.index ?? null,
            correctAnswer: q.correct,
            options: q.options,
            timedOut: Boolean(r.timed_out),
            correct: Boolean(r.correct),
            explanation: q.explanation,
          };
        }),
    };
  }
  lookup(code: string) {
    const s = this.s;
    const coupon = s.get<Coupon>(
      'SELECT * FROM coupons WHERE code_hash=?',
      s.hash(code.trim().toUpperCase()),
    );
    if (!coupon) throw new Fault('coupon_not_found', 404);
    const p = s.get<{ details_cipher: string; phone_cipher: string }>(
      'SELECT p.details_cipher,i.phone_cipher FROM participants p JOIN verified_phone_identities i ON i.id=p.phone_id WHERE p.id=?',
      coupon.participant_id,
    )!;
    const policy = s.get<{ body: string }>(
      'SELECT v.body FROM discount_policy_versions v JOIN challenge_sessions s ON s.policy_version=v.version WHERE s.id=?',
      coupon.session_id,
    )!;
    return {
      id: coupon.id,
      code: unseal(s.config.CHALLENGE_DATA_KEY, coupon.code_cipher),
      discount: coupon.discount,
      state: coupon.state === 'issued' && coupon.expires <= s.now() ? 'expired' : coupon.state,
      expiresAt: coupon.expires,
      participant: JSON.parse(unseal(s.config.CHALLENGE_DATA_KEY, p.details_cipher)) as Details,
      phone: unseal(s.config.CHALLENGE_DATA_KEY, p.phone_cipher),
      terms: (JSON.parse(policy.body) as Policy).terms,
      policy: JSON.parse(policy.body) as Policy,
      redemption:
        s.get('SELECT redeemed_at,admin_id FROM coupon_redemptions WHERE coupon_id=?', coupon.id) ||
        null,
    };
  }
  redeem(user: AdminUser, code: string, key: string, input: Redemption) {
    const s = this.s;
    if (user.role === 'viewer') throw new Fault('forbidden', 403);
    return s.atomic(() => {
      const coupon = this.lookup(code);
      const eligibility = redemptionSchema.parse(input);
      const fingerprint = JSON.stringify(eligibility);
      const prior = s.get<{ coupon_id: string; admin_id: string; eligibility: string }>(
        'SELECT coupon_id,admin_id,eligibility FROM coupon_redemptions WHERE request_key=?',
        key,
      );
      if (prior) {
        if (
          prior.coupon_id !== coupon.id ||
          prior.admin_id !== user.id ||
          prior.eligibility !== fingerprint
        )
          throw new Fault('idempotency_conflict', 409);
        return coupon;
      }
      const policy = coupon.policy;
      if (
        !policy.packages.includes(eligibility.package) ||
        !policy.durations.includes(eligibility.duration) ||
        (policy.newCustomersOnly && !eligibility.newCustomer) ||
        (!policy.combinable && eligibility.otherOffer)
      )
        throw new Fault('policy_mismatch', 422);
      if (
        s.run(
          "UPDATE coupons SET state='redeemed' WHERE id=? AND state='issued' AND expires>?",
          coupon.id,
          s.now(),
        ).changes !== 1
      )
        throw new Fault('coupon_unavailable', 409);
      s.run(
        'INSERT INTO coupon_redemptions VALUES(?,?,?,?,?)',
        coupon.id,
        user.id,
        s.now(),
        key,
        fingerprint,
      );
      s.audit(user.id, 'coupon_redeemed', coupon.id);
      const session = s.get<{ session_id: string }>(
        'SELECT session_id FROM coupons WHERE id=?',
        coupon.id,
      )!.session_id;
      s.event(session + ':redeemed', 'coupon_redeemed', session);
      return this.lookup(code);
    });
  }
}
