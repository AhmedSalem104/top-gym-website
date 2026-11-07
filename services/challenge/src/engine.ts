import { randomInt, randomUUID, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { Store } from './db.ts';
import { Fault, phone, seal, unseal, text } from './security.ts';
import type { Question } from './bank.ts';
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
    consent: z.literal(true),
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
export class Engine {
  constructor(
    readonly store: Store,
    readonly bank: { questions: Question[]; version: string },
  ) {}
  available() {
    const c = this.store.config;
    return (
      c.CHALLENGE_ENABLED === 'true' &&
      Boolean(c.policy) &&
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
  enroll(input: string, ip: string, key: string) {
    this.enabled();
    const p = phone(input),
      s = this.store;
    // A retry key is a random browser secret, never the phone number itself.
    if (!/^[a-f0-9-]{36}$/i.test(key)) throw new Fault('invalid_request', 422);
    s.limit('enroll-ip:' + ip, 12, 3600000);
    s.limit('enroll-phone:' + p, 8, 3600000);
    s.limit('enroll-global', 200, 3600000);
    const token = s.hash('enroll-token:' + key),
      tokenHash = s.hash(token),
      phoneHash = s.hash(p);
    return s.atomic(() => {
      const previous = s.get<{ phone_id: string; phone_hash: string; expires: number }>(
        'SELECT b.phone_id,i.phone_hash,b.expires FROM phone_entry_claims b JOIN phone_identities i ON i.id=b.phone_id WHERE b.token_hash=?',
        tokenHash,
      );
      if (previous) {
        if (
          previous.phone_hash !== phoneHash ||
          previous.expires <= s.now() ||
          !s.get(
            'SELECT token_hash FROM browser_sessions WHERE token_hash=? AND expires>?',
            tokenHash,
            s.now(),
          )
        )
          throw new Fault('entry_unavailable', 409);
        return { token, identity: previous.phone_id };
      }
      if (s.get('SELECT id FROM phone_identities WHERE phone_hash=?', phoneHash))
        throw new Fault('entry_unavailable', 409);
      const identity = randomUUID();
      s.run(
        'INSERT INTO phone_identities(id,phone_hash,phone_cipher,registered_at,ownership_verified) VALUES(?,?,?,?,0)',
        identity,
        phoneHash,
        seal(s.config.CHALLENGE_DATA_KEY, p),
        s.now(),
      );
      s.run('INSERT INTO browser_sessions VALUES(?,?,?)', tokenHash, identity, s.now() + 86400000);
      // Retain the spent retry secret hash after session cleanup; it must never
      // become a new identity's token when a browser reuses an expired key.
      s.run(
        'INSERT INTO phone_entry_claims VALUES(?,?,?)',
        tokenHash,
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
    if (!found) throw new Fault('session_required', 401);
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
      'SELECT phone_cipher FROM phone_identities WHERE id=?',
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
    s.run('DELETE FROM browser_sessions WHERE expires<?', now);
    s.run('DELETE FROM admin_sessions WHERE expires<? OR touched<?', now, now - 1800000);
  }
}
