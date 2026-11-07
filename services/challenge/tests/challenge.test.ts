import { afterEach, describe, it, expect, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/app.ts';
import { config, fixtureBank, clock } from './fixtures.ts';
import { phone, totp, seal, unseal } from '../src/security.ts';
import { readConfig } from '../src/config.ts';
import { validateBank } from '../src/bank.ts';
import { deliverNext, mailData, challengeEmail } from '../src/mail.ts';
import type { Round } from '../src/engine.ts';

const running: ReturnType<typeof createApp>[] = [];
function setup() {
  const time = clock(),
    c = config();
  const a = createApp(c, fixtureBank, () => time.value);
  running.push(a);
  return { ...a, c, time };
}
afterEach(async () => {
  for (const a of running.splice(0)) await a.app.close();
});
async function player(a: ReturnType<typeof setup>, number = '01012345678') {
  return a.engine.enroll(number, '127.0.0.1', randomUUID());
}
function answer(a: ReturnType<typeof setup>, identity: string, right = true, key = randomUUID()) {
  const state = a.engine.sync(identity);
  if (!state.question) throw new Error('Expected question');
  const q = a.store.get<Round>(
    'SELECT * FROM challenge_session_questions WHERE question_id=? AND ordinal=?',
    state.question.id,
    state.question.ordinal,
  )!;
  const options = JSON.parse(q.option_order) as { id: string; index: number }[];
  return a.engine.answer(
    identity,
    {
      question: q.question_id,
      option: options.find((o) => (right ? o.index === 0 : o.index !== 0))!.id,
    },
    key,
  );
}
const details = {
  name: 'Test Customer',
  consent: true as const,
};
const eligibility = {
  package: 'gym' as const,
  duration: 'month' as const,
  newCustomer: false,
  otherOffer: false,
};
describe('challenge invariants', () => {
  it.each([
    '01012345678',
    '+201012345678',
    '00201012345678',
    '201012345678',
    '٠١٠١٢٣٤٥٦٧٨',
    '۰۱۰۱۲۳۴۵۶۷۸',
  ])('normalizes %s', (p) => expect(phone(p)).toBe('+201012345678'));
  it.each(['010123', '+441012345678', '0123456789012', '01123456789x', '0201234567'])(
    'rejects %s',
    (p) => expect(() => phone(p)).toThrow(),
  );
  it('uses authenticated encryption', () => {
    const key = config().CHALLENGE_DATA_KEY,
      encrypted = seal(key, 'private');
    expect(unseal(key, encrypted)).toBe('private');
    expect(encrypted).not.toContain('private');
    expect(() => unseal(config().CHALLENGE_DATA_KEY, encrypted)).toThrow();
  });
  it('checks the RFC 6238 SHA1 vector', () =>
    expect(totp('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 59000)).toBe('287082'));
  it('validates exactly 300 unique questions and the approved distribution', () => {
    expect(validateBank(fixtureBank.questions, true)).toHaveLength(300);
    expect(() => validateBank(fixtureBank.questions)).toThrow('review');
    expect(() => validateBank(fixtureBank.questions.slice(1), true)).toThrow();
    const duplicate = structuredClone(fixtureBank.questions);
    duplicate[1].question = duplicate[0].question;
    expect(() => validateBank(duplicate, true)).toThrow('Duplicate');
  });
  it('never accepts HTTP or drafts in production config', () => {
    const c = config();
    expect(() =>
      readConfig({ ...c, NODE_ENV: 'production' } as unknown as NodeJS.ProcessEnv),
    ).toThrow();
  });
  it('requires a secret session and marks entered numbers as unverified', async () => {
    const a = setup();
    expect(() => a.engine.identity('forged')).toThrow('session_required');
    const p = await player(a);
    expect(a.engine.identity(p.token)).toBe(p.identity);
    expect(
      a.store.get<{ ownership_verified: number }>('SELECT ownership_verified FROM phone_identities')
        ?.ownership_verified,
    ).toBe(0);
  });
  it('limits enrollment retries without contacting an OTP provider', () => {
    const a = setup(),
      key = randomUUID();
    for (let i = 0; i < 8; i++) a.engine.enroll('01012345678', 'client', key);
    expect(() => a.engine.enroll('+201012345678', 'other-device', key)).toThrow('rate_limited');
  });
  it('retries the same enrollment without issuing another identity, and never extends expiry', () => {
    const a = setup(),
      key = randomUUID(),
      p = a.engine.enroll('01012345678', 'client', key);
    a.time.advance(1000);
    expect(a.engine.enroll('+201012345678', 'client', key)).toEqual(p);
    expect(a.store.all('SELECT * FROM phone_identities')).toHaveLength(1);
    expect(() => a.engine.enroll('01012345679', 'client', key)).toThrow('entry_unavailable');
    a.time.advance(86400000);
    a.engine.sweep();
    expect(() => a.engine.enroll('01012345678', 'client', key)).toThrow('entry_unavailable');
    expect(() => a.engine.identity(p.token)).toThrow('session_required');
    expect(() => a.engine.enroll('01012345679', 'client', key)).toThrow('entry_unavailable');
  });
  it('starts once across devices, hides answer keys and fixes selection', async () => {
    const a = setup(),
      p = await player(a);
    const one = a.engine.start(p.identity, 'ar', {});
    a.time.advance(1000);
    const two = a.engine.start(p.identity, 'en', {});
    expect(two.question).toEqual(one.question);
    await expect(player(a, '+201012345678')).rejects.toThrow('entry_unavailable');
    const rows = a.store.all<Round>('SELECT * FROM challenge_session_questions');
    expect(rows).toHaveLength(3);
    expect(new Set(rows.map((r) => r.question_id)).size).toBe(3);
    expect(
      new Set(rows.map((r) => (JSON.parse(r.snapshot) as { difficulty: string }).difficulty)).size,
    ).toBe(3);
    expect(JSON.stringify(one)).not.toMatch(/correct|explanation|snapshot|option_order/);
    expect(one.question!.deadlineAt - one.question!.startsAt).toBe(10000);
  });
  it('rejects an answer at the deadline and advances without timer reset', async () => {
    const a = setup(),
      p = await player(a);
    const q = a.engine.start(p.identity, 'en', {}).question!;
    a.time.advance(10000);
    const result = a.engine.answer(
      p.identity,
      { question: q.id, option: q.options[0].id },
      randomUUID(),
    );
    expect(result.question?.ordinal).toBe(2);
    expect(result.question?.startsAt).toBe(q.deadlineAt);
    expect(result.question!.deadlineAt - result.question!.startsAt).toBe(10000);
    expect(
      a.store.get<{ timed_out: number }>('SELECT timed_out FROM challenge_answers')?.timed_out,
    ).toBe(1);
  });
  it('advertises ten seconds and accepts an answer just before the deadline after refresh', async () => {
    const a = setup(),
      p = await player(a);
    expect((await a.app.inject('/v1/challenge/info')).json().seconds).toBe(10);
    const first = a.engine.start(p.identity, 'en', {}).question!;
    a.time.advance(6000);
    expect(a.engine.sync(p.identity).question).toEqual(first);
    expect(a.engine.start(p.identity, 'ar', {}).question).toEqual(first);
    a.time.advance(3999);
    const next = answer(a, p.identity);
    expect(next.question?.ordinal).toBe(2);
    expect(next.question!.deadlineAt - next.question!.startsAt).toBe(10000);
    expect(a.store.get<{ correct: number }>('SELECT correct FROM challenge_answers')?.correct).toBe(
      1,
    );
  });
  it('finishes all timeouts when disconnected and does not give another attempt', async () => {
    const a = setup(),
      p = await player(a);
    const q = a.engine.start(p.identity, 'ar', {}).question!;
    a.time.advance(60000);
    a.engine.sweep();
    const s = a.engine.sync(p.identity);
    expect(s.status).toBe('completed');
    expect(s.score).toBe(0);
    expect(
      a.store.get<{ completed_at: number }>('SELECT completed_at FROM challenge_sessions')!
        .completed_at,
    ).toBe(q.startsAt + 30000);
    expect(a.engine.start(p.identity, 'ar', {}).status).toBe('completed');
  });
  it.each([0, 1, 2, 3])(
    'calculates %i correct, exactly one participant/outbox and eligible coupon',
    async (score) => {
      const a = setup(),
        p = await player(a);
      a.engine.start(p.identity, 'en', {});
      for (let i = 0; i < 3; i++) {
        a.time.advance(200);
        answer(a, p.identity, i < score);
      }
      const key = randomUUID();
      const result = a.engine.finalize(p.identity, details, key);
      expect(result.discount).toBe(score * 10);
      expect(Boolean(result.coupon)).toBe(score > 0);
      expect(a.engine.finalize(p.identity, details, key)).toEqual(result);
      expect(a.engine.finalize(p.identity, details, randomUUID())).toEqual(result);
      expect(a.store.all('SELECT * FROM participants')).toHaveLength(1);
      expect(a.store.all('SELECT * FROM coupons')).toHaveLength(score ? 1 : 0);
      expect(a.store.all('SELECT * FROM email_delivery_jobs')).toHaveLength(1);
      expect(() =>
        a.engine.finalize(p.identity, { ...details, name: 'Changed' }, randomUUID()),
      ).toThrow('already_registered');
    },
  );
  it('cannot race two answers into two advances', async () => {
    const a = setup(),
      p = await player(a);
    const q = a.engine.start(p.identity, 'en', {}).question!;
    const results = await Promise.all(
      [1, 2, 3].map(() =>
        Promise.resolve().then(() =>
          a.engine.answer(p.identity, { question: q.id, option: q.options[0].id }, randomUUID()),
        ),
      ),
    );
    expect(results.every((r) => r.question?.ordinal === 2)).toBe(true);
    expect(a.store.all('SELECT * FROM challenge_answers')).toHaveLength(1);
  });
  it('guards idempotency fingerprints', async () => {
    const a = setup(),
      p = await player(a);
    const q = a.engine.start(p.identity, 'en', {}).question!,
      key = randomUUID();
    a.engine.answer(p.identity, { question: q.id, option: q.options[0].id }, key);
    expect(() =>
      a.engine.answer(p.identity, { question: q.id, option: q.options[1].id }, key),
    ).toThrow('idempotency_conflict');
  });
  it('rejects finishing early and malformed or forged registration', async () => {
    const a = setup(),
      p = await player(a);
    a.engine.start(p.identity, 'en', {});
    expect(() => a.engine.finalize(p.identity, details, randomUUID())).toThrow('not_completed');
    expect(() =>
      a.engine.finalize(
        p.identity,
        { ...details, email: 'x\r\nBcc:bad' } as unknown as typeof details,
        randomUUID(),
      ),
    ).toThrow();
  });
  it('restores all writes when coupon issuance fails', async () => {
    const a = setup(),
      p = await player(a);
    a.engine.start(p.identity, 'en', {});
    for (let i = 0; i < 3; i++) answer(a, p.identity);
    a.store.db.exec(
      "CREATE TRIGGER prevent_coupon BEFORE INSERT ON coupons BEGIN SELECT RAISE(ABORT,'test failure'); END",
    );
    expect(() => a.engine.finalize(p.identity, details, randomUUID())).toThrow('test failure');
    expect(a.store.all('SELECT * FROM participants')).toHaveLength(0);
    expect(a.store.all('SELECT * FROM email_delivery_jobs')).toHaveLength(0);
    expect(a.engine.sync(p.identity).status).toBe('completed');
  });
});
describe('HTTP and administrative boundaries', () => {
  it('enrolls without OTP, protects duplicate entries and rejects email collection', async () => {
    const a = setup(),
      key = randomUUID();
    const headers = { origin: a.c.CHALLENGE_ORIGIN, 'idempotency-key': key };
    const entry = await a.app.inject({
      method: 'POST',
      url: '/v1/challenge/enroll',
      headers,
      payload: { phone: '01012345678' },
    });
    expect(entry.statusCode).toBe(200);
    expect(entry.json()).toMatchObject({ status: 'eligible' });
    expect(entry.headers['set-cookie']).toContain('HttpOnly');
    const retry = await a.app.inject({
      method: 'POST',
      url: '/v1/challenge/enroll',
      headers,
      payload: { phone: '+201012345678' },
    });
    expect(retry.headers['set-cookie']).toBe(entry.headers['set-cookie']);
    const duplicate = await a.app.inject({
      method: 'POST',
      url: '/v1/challenge/enroll',
      headers: { ...headers, 'idempotency-key': randomUUID() },
      payload: { phone: '01012345678' },
    });
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json()).toEqual({ code: 'entry_unavailable' });
    expect(duplicate.headers['set-cookie']).toBeUndefined();
    const cookie = String(entry.headers['set-cookie']).split(';')[0];
    const rejected = await a.app.inject({
      method: 'POST',
      url: '/v1/challenge/finalize',
      headers: { ...headers, cookie },
      payload: { name: 'Example', email: 'test@example.test', consent: true },
    });
    expect(rejected.statusCode).toBe(422);
    for (const route of ['request', 'confirm'])
      expect(
        (
          await a.app.inject({
            method: 'POST',
            url: '/v1/verification/' + route,
            headers,
            payload: {},
          })
        ).statusCode,
      ).toBe(404);
  });
  it('blocks missing origin, oversized bodies, unverified sessions and unauthorized administration', async () => {
    const a = setup();
    expect(
      (
        await a.app.inject({
          method: 'POST',
          url: '/v1/challenge/enroll',
          payload: { phone: '01012345678' },
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await a.app.inject({
          method: 'POST',
          url: '/v1/challenge/enroll',
          headers: { origin: a.c.CHALLENGE_ORIGIN },
          payload: { phone: 'a'.repeat(9000) },
        })
      ).statusCode,
    ).toBe(413);
    expect((await a.app.inject('/v1/admin/summary')).statusCode).toBe(401);
    expect((await a.app.inject('/v1/challenge/result')).statusCode).toBe(401);
  });
  it('uses MFA, CSRF, role checks, one-time redemption and safe retry', async () => {
    const a = setup(),
      p = await player(a);
    a.engine.start(p.identity, 'ar', {});
    for (let i = 0; i < 3; i++) answer(a, p.identity);
    const result = a.engine.finalize(p.identity, details, randomUUID());
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
    await a.admin.create('admin@example.test', 'A-long-test-password!', secret);
    await expect(a.admin.login('admin@example.test', 'wrong', '000000', 'client')).rejects.toThrow(
      'invalid_login',
    );
    const login = await a.admin.login(
      'admin@example.test',
      'A-long-test-password!',
      totp(secret, a.time.value),
      'client',
    );
    const user = a.admin.authenticate(login.token, login.csrf);
    expect(() => a.admin.authenticate(login.token, 'wrong')).toThrow('blocked');
    expect(() =>
      a.admin.redeem({ ...user, role: 'viewer' }, result.coupon!.code, randomUUID(), eligibility),
    ).toThrow('forbidden');
    const key = randomUUID();
    expect(() =>
      a.admin.redeem(user, result.coupon!.code, randomUUID(), { ...eligibility, otherOffer: true }),
    ).toThrow('policy_mismatch');
    expect(() =>
      a.admin.redeem(user, result.coupon!.code, randomUUID(), { ...eligibility, duration: 'year' }),
    ).toThrow('policy_mismatch');
    expect(a.admin.redeem(user, result.coupon!.code, key, eligibility).state).toBe('redeemed');
    expect(a.admin.redeem(user, result.coupon!.code, key, eligibility).state).toBe('redeemed');
    expect(() => a.admin.redeem(user, result.coupon!.code, randomUUID(), eligibility)).toThrow(
      'coupon_unavailable',
    );
    expect(a.store.all('SELECT * FROM coupon_redemptions')).toHaveLength(1);
    a.admin.logout(login.token);
    expect(() => a.admin.authenticate(login.token)).toThrow('authentication_required');
  });
  it('never accepts expired coupons', async () => {
    const a = setup(),
      p = await player(a);
    a.engine.start(p.identity, 'en', {});
    for (let i = 0; i < 3; i++) answer(a, p.identity);
    const r = a.engine.finalize(p.identity, details, randomUUID());
    a.time.advance(8 * 86400000);
    expect(a.admin.lookup(r.coupon!.code).state).toBe('expired');
    expect(a.engine.sync(p.identity).coupon?.state).toBe('expired');
    const session = a.store.get<{ id: string }>('SELECT id FROM challenge_sessions')!;
    expect(mailData(a.store, session.id).coupon?.state).toBe('expired');
  });
});
describe('durable notifications', () => {
  async function completed() {
    const a = setup(),
      p = await player(a);
    a.engine.start(p.identity, 'ar', { campaign: 'local-test' });
    for (let i = 0; i < 3; i++) answer(a, p.identity);
    a.engine.finalize(p.identity, { ...details, name: '<b>أحمد & Test</b>' }, randomUUID());
    return a;
  }
  it('sends actual result data with escaped HTML and plain text', async () => {
    const a = await completed();
    const session = a.store.get<{ id: string }>('SELECT id FROM challenge_sessions')!;
    const data = mailData(a.store, session.id),
      mail = challengeEmail(data, 'admin');
    expect(mail.subject).toBe('[TOP GYM WEBSITE] New Fitness Challenge Participant — 30% Discount');
    expect(mail.html).toContain('&lt;b&gt;أحمد &amp; Test&lt;/b&gt;');
    expect(mail.html).not.toContain('<b>أحمد');
    expect(mail.text).toContain(data.phone);
    expect(challengeEmail(data, 'customer').text).not.toContain('Correct:');
    const send = vi.fn(async () => {});
    await deliverNext(a.store, send);
    await deliverNext(a.store, send);
    expect(send).toHaveBeenCalledTimes(1);
    expect(a.store.get<{ state: string }>('SELECT state FROM email_delivery_jobs')!.state).toBe(
      'accepted',
    );
  });
  it.each(['EAUTH', 'ENOCONFIG', 'EREJECTED'])(
    'retries definitive %s failures without recreating coupons',
    async (code) => {
      const a = await completed();
      const send = vi.fn(async () => {
        throw Object.assign(new Error('private provider data'), { code });
      });
      await deliverNext(a.store, send);
      expect(a.store.get<{ state: string }>('SELECT state FROM email_delivery_jobs')!.state).toBe(
        'queued',
      );
      expect(a.store.all('SELECT * FROM coupons')).toHaveLength(1);
      a.time.advance(61000);
      await deliverNext(a.store, async () => {});
      expect(a.store.get<{ state: string }>('SELECT state FROM email_delivery_jobs')!.state).toBe(
        'accepted',
      );
    },
  );
  it.each(['ETIMEDOUT', 'ECONNECTION'])(
    'quarantines ambiguous %s instead of silently resending',
    async (code) => {
      const a = await completed();
      await deliverNext(a.store, async () => {
        throw Object.assign(new Error('interrupted send'), { code });
      });
      expect(a.store.get<{ state: string }>('SELECT state FROM email_delivery_jobs')!.state).toBe(
        'uncertain',
      );
      const send = vi.fn(async () => {});
      await deliverNext(a.store, send);
      expect(send).not.toHaveBeenCalled();
    },
  );
});
