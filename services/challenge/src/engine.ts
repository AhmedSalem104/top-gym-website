import { randomInt, randomUUID, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { Store } from './db.ts';
import { Fault, opaque, phone, seal, unseal, text, email } from './security.ts';
import type { Question } from './bank.ts';
import type { OtpProvider } from './otp.ts';
import type { Policy } from './config.ts';

export const attributionSchema = z
  .object({
    source: text(0, 120).optional(),
    medium: text(0, 120).optional(),
    campaign: text(0, 160).optional(),
    content: text(0, 160).optional(),
    landing: z
      .string()
      .max(200)
      .regex(/^\/[a-zA-Z0-9/_-]*$/)
      .optional(),
    entry: z.enum(['floating', 'footer', 'direct']).optional(),
  })
  .strict();
export const registrationSchema = z
  .object({
    name: text(2, 100),
    email,
    consent: z.literal(true),
    marketingConsent: z.boolean().default(false),
  })
  .strict();
export type Details = z.infer<typeof registrationSchema>;
export interface Session {
  id: string;
  phone_id: string;
  policy_version: string;
  bank_version: string;
  locale: 'ar' | 'en';
  status: 'active' | 'completed' | 'registered';
  score: number;
  started_at: number;
  completed_at: number | null;
  registered_at: number | null;
  attribution: string;
}
export interface Round {
  session_id: string;
  ordinal: number;
  question_id: string;
  snapshot: string;
  option_order: string;
  starts: number;
  deadline: number;
}
export interface Coupon {
  id: string;
  participant_id: string;
  session_id: string;
  code_hash: string;
  code_cipher: string;
  discount: number;
  state: 'issued' | 'redeemed' | 'voided';
  created_at: number;
  expires: number;
}
interface Verification {
  id: string;
  phone_hash: string;
  phone_cipher: string;
  expires: number;
  attempts: number;
  state: string;
}
export class Engine {
  constructor(
    readonly store: Store,
    readonly bank: { questions: Question[]; version: string },
    readonly otp: OtpProvider,
  ) {}
  available() {
    const c = this.store.config;
    return (
      c.CHALLENGE_ENABLED === 'true' &&
      Boolean(c.policy) &&
      c.OTP_PROVIDER !== 'disabled' &&
      (c.OTP_PROVIDER !== 'twilio' ||
        Boolean(c.TWILIO_ACCOUNT_SID && c.TWILIO_AUTH_TOKEN && c.TWILIO_VERIFY_SERVICE_SID)) &&
      this.bank.questions.length === 300 &&
      (c.NODE_ENV !== 'production' ||
        (Boolean(c.SMTP_USER && c.SMTP_APP_PASSWORD && c.CHALLENGE_ADMIN_EMAIL) &&
          this.bank.questions.every(
            (q) => q.review === 'reviewed' && q.reviewer && q.reviewedAt && q.sources.length,
          )))
    );
  }
  private enabled() {
    if (!this.available()) throw new Fault('unavailable', 503);
  }
  async requestVerification(input: string, ip: string) {
    this.enabled();
    const p = phone(input);
    const s = this.store;
    s.limit('otp-ip:' + ip, 10, 3600000);
    s.limit('otp-phone:' + p, 3, 600000);
    s.limit('otp-day:' + p, 6, 86400000);
    s.limit('otp-global', 100, 3600000);
    const id = opaque();
    const hash = s.hash(id);
    const now = s.now();
    s.run(
      'INSERT INTO phone_verifications VALUES(?,?,?,?,0,?)',
      hash,
      s.hash(p),
      seal(s.config.CHALLENGE_DATA_KEY, p),
      now + 600000,
      'pending',
    );
    try {
      await this.otp.request(p);
    } catch {
      s.run("UPDATE phone_verifications SET state='failed' WHERE id=?", hash);
      throw new Fault('verification_unavailable', 503);
    }
    return { verification: id, expiresAt: now + 600000 };
  }
  async confirmVerification(id: string, code: string, ip: string) {
    const s = this.store;
    s.limit('verify-ip:' + ip, 25, 600000);
    const hash = s.hash(id);
    const v = s.atomic(() => {
      const v = s.get<Verification>('SELECT * FROM phone_verifications WHERE id=?', hash);
      if (!v || v.expires <= s.now() || v.state !== 'pending' || v.attempts >= 5)
        throw new Fault('invalid_verification', 422);
      s.run('UPDATE phone_verifications SET attempts=attempts+1 WHERE id=?', hash);
      return v;
    });
    if (!(await this.otp.confirm(unseal(s.config.CHALLENGE_DATA_KEY, v.phone_cipher), code)))
      throw new Fault('invalid_verification', 422);
    return s.atomic(() => {
      if (
        s.run(
          "UPDATE phone_verifications SET state='verified' WHERE id=? AND state='pending' AND expires>?",
          hash,
          s.now(),
        ).changes !== 1
      )
        throw new Fault('invalid_verification', 422);
      const identity =
        s.get<{ id: string }>(
          'SELECT id FROM verified_phone_identities WHERE phone_hash=?',
          v.phone_hash,
        )?.id || randomUUID();
      s.run(
        'INSERT INTO verified_phone_identities VALUES(?,?,?,?) ON CONFLICT(phone_hash) DO UPDATE SET verified_at=excluded.verified_at',
        identity,
        v.phone_hash,
        v.phone_cipher,
        s.now(),
      );
      const token = opaque();
      s.run(
        'INSERT INTO browser_sessions VALUES(?,?,?)',
        s.hash(token),
        identity,
        s.now() + 86400000,
      );
      return { token, identity };
    });
  }
  identity(token: string) {
    const found = this.store.get<{ phone_id: string }>(
      'SELECT phone_id FROM browser_sessions WHERE token_hash=? AND expires>?',
      this.store.hash(token),
      this.store.now(),
    );
    if (!found) throw new Fault('verification_required', 401);
    return found.phone_id;
  }
  private own(identity: string) {
    return this.store.get<Session>('SELECT * FROM challenge_sessions WHERE phone_id=?', identity);
  }
  start(identity: string, locale: 'ar' | 'en', attribution: z.infer<typeof attributionSchema>) {
    const s = this.store;
    return s.atomic(() => {
      const existing = this.own(identity);
      if (existing) {
        this.reconcile(existing.id);
        return this.view(identity);
      }
      this.enabled();
      const p = s.config.policy!;
      const serialized = JSON.stringify(p);
      const previous = s.get<{ body: string }>(
        'SELECT body FROM discount_policy_versions WHERE version=?',
        p.version,
      );
      if (previous && previous.body !== serialized) throw new Fault('policy_conflict', 503);
      s.run('INSERT OR IGNORE INTO discount_policy_versions VALUES(?,?)', p.version, serialized);
      const id = randomUUID(),
        now = s.now(),
        attr = JSON.stringify(attribution);
      s.run(
        "INSERT INTO challenge_sessions(id,phone_id,policy_version,bank_version,locale,status,started_at,attribution) VALUES(?,?,?,?,?,'active',?,?)",
        id,
        identity,
        p.version,
        this.bank.version,
        locale,
        now,
        attr,
      );
      // One random question from each band gives comparable difficulty exposure.
      const bands = ['medium', 'medium-advanced', 'advanced'] as const;
      const selected = bands.map((band) => {
        const pool = this.bank.questions.filter((q) => q.difficulty === band);
        return pool[randomInt(pool.length)];
      });
      for (let i = 1; i <= 3; i++) {
        const q = selected.splice(randomInt(selected.length), 1)[0];
        const indices = [0, 1, 2, 3];
        const order = Array.from({ length: 4 }, () => ({
          id: randomBytes(12).toString('hex'),
          index: indices.splice(randomInt(indices.length), 1)[0],
        }));
        const start = i === 1 ? now : 0;
        s.run(
          'INSERT INTO challenge_session_questions VALUES(?,?,?,?,?,?,?)',
          id,
          i,
          q.id,
          JSON.stringify(q),
          JSON.stringify(order),
          start,
          start + 5000,
        );
      }
      s.event(id + ':started', 'challenge_started', id, attr);
      return this.view(identity);
    });
  }
  private current(session: string) {
    return this.store.get<Round>(
      'SELECT q.* FROM challenge_session_questions q LEFT JOIN challenge_answers a ON a.session_id=q.session_id AND a.ordinal=q.ordinal WHERE q.session_id=? AND a.ordinal IS NULL ORDER BY q.ordinal LIMIT 1',
      session,
    );
  }
  private advance(session: string, round: Round, at: number) {
    const s = this.store;
    if (round.ordinal === 3) {
      s.run(
        "UPDATE challenge_sessions SET status='completed',completed_at=? WHERE id=? AND status='active'",
        at,
        session,
      );
      s.event(session + ':completed', 'challenge_completed', session);
    } else
      s.run(
        'UPDATE challenge_session_questions SET starts=?,deadline=? WHERE session_id=? AND ordinal=?',
        at,
        at + 5000,
        session,
        round.ordinal + 1,
      );
  }
  reconcile(session: string) {
    const s = this.store;
    for (let i = 0; i < 3; i++) {
      const q = this.current(session);
      if (!q || q.deadline > s.now()) break;
      s.run(
        'INSERT INTO challenge_answers VALUES(?,?,NULL,0,1,?,NULL)',
        session,
        q.ordinal,
        q.deadline,
      );
      this.advance(session, q, q.deadline);
    }
  }
  sync(identity: string) {
    return this.store.atomic(() => {
      const session = this.own(identity);
      if (session) this.reconcile(session.id);
      return this.view(identity);
    });
  }
  answer(identity: string, body: { question: string; option: string }, key: string) {
    const s = this.store;
    return s.atomic(() => {
      const session = this.own(identity);
      if (!session) throw new Fault('not_started', 409);
      const scope = 'answer:' + session.id,
        fingerprint = s.hash(JSON.stringify(body));
      const previous = s.get<{ fingerprint: string }>(
        'SELECT fingerprint FROM idempotency_records WHERE scope=? AND key=?',
        scope,
        key,
      );
      if (previous) {
        if (previous.fingerprint !== fingerprint) throw new Fault('idempotency_conflict', 409);
        this.reconcile(session.id);
        return this.view(identity);
      }
      this.reconcile(session.id);
      const q = this.current(session.id);
      if (!q || q.question_id !== body.question) return this.view(identity);
      const choices = JSON.parse(q.option_order) as { id: string; index: number }[];
      const choice = choices.find((x) => x.id === body.option);
      if (!choice) throw new Fault('invalid_answer', 422);
      const question = JSON.parse(q.snapshot) as Question;
      const correct = Number(choice.index === question.correct);
      const now = s.now();
      if (now >= q.deadline) {
        this.reconcile(session.id);
        return this.view(identity);
      }
      s.run(
        'INSERT INTO challenge_answers VALUES(?,?,?,?,0,?,?)',
        session.id,
        q.ordinal,
        body.option,
        correct,
        now,
        key,
      );
      s.run('UPDATE challenge_sessions SET score=score+? WHERE id=?', correct, session.id);
      s.run('INSERT INTO idempotency_records VALUES(?,?,?,?)', scope, key, fingerprint, '{}');
      if (q.ordinal === 1) s.event(session.id + ':first', 'first_question_answered', session.id);
      this.advance(session.id, q, now);
      return this.view(identity);
    });
  }
  view(identity: string) {
    const s = this.store;
    const session = this.own(identity);
    const p = s.get<{ phone_cipher: string }>(
      'SELECT phone_cipher FROM verified_phone_identities WHERE id=?',
      identity,
    )!;
    const maskedPhone = '•••• ' + unseal(s.config.CHALLENGE_DATA_KEY, p.phone_cipher).slice(-4);
    if (!session) return { status: 'eligible' as const, maskedPhone, serverNow: s.now() };
    const q = this.current(session.id);
    if (q) {
      const question = JSON.parse(q.snapshot) as Question;
      const order = JSON.parse(q.option_order) as { id: string; index: number }[];
      return {
        status: 'active' as const,
        maskedPhone,
        serverNow: s.now(),
        question: {
          id: q.question_id,
          ordinal: q.ordinal,
          total: 3,
          startsAt: q.starts,
          deadlineAt: q.deadline,
          text: question.question,
          options: order.map((o) => ({ id: o.id, text: question.options[o.index] })),
        },
      };
    }
    const coupon = s.get<Coupon>('SELECT * FROM coupons WHERE session_id=?', session.id);
    const policy = JSON.parse(
      s.get<{ body: string }>(
        'SELECT body FROM discount_policy_versions WHERE version=?',
        session.policy_version,
      )!.body,
    ) as Policy;
    return {
      status: session.status,
      maskedPhone,
      serverNow: s.now(),
      score: session.score,
      total: 3,
      discount: session.score * 10,
      terms: policy.terms,
      coupon: coupon
        ? {
            code: unseal(s.config.CHALLENGE_DATA_KEY, coupon.code_cipher),
            discount: coupon.discount,
            expiresAt: coupon.expires,
            state:
              coupon.state === 'issued' && coupon.expires <= s.now() ? 'expired' : coupon.state,
          }
        : null,
    };
  }
  finalize(identity: string, input: Details, key: string) {
    const details = registrationSchema.parse(input),
      s = this.store;
    return s.atomic(() => {
      const session = this.own(identity);
      if (!session) throw new Fault('not_started', 409);
      this.reconcile(session.id);
      if (this.current(session.id)) throw new Fault('not_completed', 409);
      const scope = 'registration:' + session.id,
        fingerprint = s.hash(JSON.stringify(details));
      const previous = s.get<{ fingerprint: string }>(
        'SELECT fingerprint FROM idempotency_records WHERE scope=?',
        scope,
      );
      if (previous) {
        if (previous.fingerprint !== fingerprint) throw new Fault('already_registered', 409);
        return this.view(identity);
      }
      const id = randomUUID(),
        now = s.now();
      s.run(
        'INSERT INTO participants VALUES(?,?,?,?,?,?)',
        id,
        session.id,
        identity,
        seal(s.config.CHALLENGE_DATA_KEY, JSON.stringify(details)),
        s.hash(details.name.toLocaleLowerCase()),
        now,
      );
      if (session.score > 0) {
        const policy = JSON.parse(
          s.get<{ body: string }>(
            'SELECT body FROM discount_policy_versions WHERE version=?',
            session.policy_version,
          )!.body,
        ) as Policy;
        const code = 'TOP-' + randomBytes(10).toString('hex').toUpperCase();
        s.run(
          "INSERT INTO coupons VALUES(?,?,?,?,?,?,'issued',?,?)",
          randomUUID(),
          id,
          session.id,
          s.hash(code),
          seal(s.config.CHALLENGE_DATA_KEY, code),
          session.score * 10,
          now,
          now + policy.validDays * 86400000,
        );
        s.event(session.id + ':coupon', 'coupon_issued', session.id);
      }
      s.run(
        "UPDATE challenge_sessions SET status='registered',registered_at=? WHERE id=?",
        now,
        session.id,
      );
      s.run(
        "INSERT INTO email_delivery_jobs VALUES(?,?,'admin','queued',0,?,NULL,NULL)",
        randomUUID(),
        session.id,
        now,
      );
      if (details.email && s.config.CHALLENGE_CUSTOMER_EMAIL_ENABLED === 'true')
        s.run(
          "INSERT INTO email_delivery_jobs VALUES(?,?,'customer','queued',0,?,NULL,NULL)",
          randomUUID(),
          session.id,
          now,
        );
      s.run('INSERT INTO idempotency_records VALUES(?,?,?,?)', scope, key, fingerprint, '{}');
      s.event(
        session.id + ':registered',
        'participant_registered',
        session.id,
        session.attribution,
      );
      return this.view(identity);
    });
  }
  sweep() {
    const s = this.store;
    for (const row of s.all<{ id: string }>(
      "SELECT id FROM challenge_sessions WHERE status='active' ORDER BY started_at LIMIT 100",
    ))
      s.atomic(() => this.reconcile(row.id));
    const now = s.now();
    s.run('DELETE FROM rate_limits WHERE expires<?', now);
    s.run('DELETE FROM gateway_nonces WHERE expires<?', now);
    s.run('DELETE FROM phone_verifications WHERE expires<?', now - 3600000);
    s.run('DELETE FROM browser_sessions WHERE expires<?', now);
    s.run('DELETE FROM admin_sessions WHERE expires<? OR touched<?', now, now - 1800000);
  }
}
