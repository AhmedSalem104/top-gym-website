import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFeedbackConfig, type FeedbackConfig } from '../../src/server/feedback/config';
import { createFeedbackHandler } from '../../src/server/feedback/handler';
import { feedbackEmail } from '../../src/server/feedback/email';
import { feedbackSchema } from '../../src/server/feedback/schema';
import type { DeliveryState, FeedbackStore } from '../../src/server/feedback/store';

const config = readFeedbackConfig({
  SMTP_USER: 'sender@example.test',
  SMTP_APP_PASSWORD: 'sample-only-not-a-real-password',
  FEEDBACK_RECIPIENT_EMAIL: 'recipient@example.test',
  UPSTASH_REDIS_REST_URL: 'https://redis.example.test',
  UPSTASH_REDIS_REST_TOKEN: 'sample-token-not-a-credential',
  FEEDBACK_HASH_SECRET: 'sample-hmac-key-for-isolated-tests-only',
}) as FeedbackConfig;
const input = {
  rating: 4,
  categories: ['equipment'],
  message: 'The equipment is well maintained.',
  locale: 'en',
  name: '',
  email: '',
  replyRequested: false,
  website: '',
};
class MemoryStore implements FeedbackStore {
  counts = new Map<string, number>();
  records = new Map<string, { fingerprint: string; state: DeliveryState; createdAt: number }>();
  async limit(key: string, maximum: number) {
    const count = (this.counts.get(key) || 0) + 1;
    this.counts.set(key, count);
    return count <= maximum;
  }
  async claim(key: string, fingerprint: string) {
    const old = this.records.get(key);
    if (old) return { fresh: false, ...old };
    const record = { fingerprint, state: 'pending' as const, createdAt: Date.now() };
    this.records.set(key, record);
    return { fresh: true, ...record };
  }
  async finish(key: string, fingerprint: string, state: DeliveryState) {
    const record = this.records.get(key)!;
    if (record.fingerprint !== fingerprint) throw new Error('mismatch');
    this.records.set(key, { ...record, state });
  }
}
const request = (body: unknown = input, key = randomUUID(), headers = {}) =>
  new Request(config.FEEDBACK_ORIGIN + '/api/feedback/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: config.FEEDBACK_ORIGIN,
      'Idempotency-Key': key,
      'x-forwarded-for': '192.0.2.1',
      ...headers,
    },
    body: JSON.stringify(body),
  });
const setup = () => {
  const store = new MemoryStore();
  const send = vi.fn(async () => {});
  return { store, send, handler: createFeedbackHandler({ config, store, send }) };
};
afterEach(() => vi.restoreAllMocks());

describe('Private feedback boundary', () => {
  it('fails closed without configuration and reveals no server details', async () => {
    const send = vi.fn();
    const handler = createFeedbackHandler({ send });
    expect(await (await handler(new Request(config.FEEDBACK_ORIGIN))).json()).toEqual({
      available: false,
    });
    expect((await handler(request())).status).toBe(503);
    expect(send).not.toHaveBeenCalled();
    expect(readFeedbackConfig({})).toBeUndefined();
    expect(
      readFeedbackConfig({ ...config, FEEDBACK_FROM_NAME: 'Gym\r\nBcc: other@example.test' }),
    ).toBeUndefined();
    expect(
      readFeedbackConfig({ ...config, FEEDBACK_ORIGIN: 'https://example.test/path' }),
    ).toBeUndefined();
  });
  it('waits for SMTP acceptance and never sends concurrent/retried requests twice', async () => {
    const { store, send } = setup();
    let release!: () => void;
    send.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const handler = createFeedbackHandler({ config, store, send });
    const key = randomUUID();
    const first = handler(request(input, key));
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    expect(await (await handler(request(input, key))).json()).toEqual({ code: 'in_progress' });
    release();
    expect(await (await first).json()).toEqual({ status: 'accepted' });
    expect(await (await handler(request(input, key))).json()).toEqual({ status: 'accepted' });
    expect((await handler(request({ ...input, message: 'A different message' }, key))).status).toBe(
      409,
    );
    expect(send).toHaveBeenCalledTimes(1);
    const stored = JSON.stringify([...store.records, ...store.counts]);
    expect(stored).not.toContain(input.message);
    expect(stored).not.toContain('192.0.2.1');
  });
  it.each([
    { rating: 0 },
    { rating: 6 },
    { rating: 1.5 },
    { categories: [] },
    { categories: ['unknown'] },
    { categories: ['cardio', 'cardio'] },
    { message: 'short' },
    { message: 'x'.repeat(2001) },
    { message: ' '.repeat(20) },
    { email: 'not-an-email' },
    { email: 'a@example.test\r\nBcc: b@example.test' },
    { name: 'x'.repeat(81) },
    { replyRequested: true },
    { extra: 'unrecognized' },
  ])('validates untrusted fields: %j', async (change) => {
    const { handler, send } = setup();
    expect((await handler(request({ ...input, ...change }))).status).toBe(422);
    expect(send).not.toHaveBeenCalled();
  });
  it('checks origin, JSON type, body size, honeypot and allowed methods', async () => {
    const { handler, send } = setup();
    expect(
      (await handler(request(input, randomUUID(), { Origin: 'https://evil.example' }))).status,
    ).toBe(403);
    expect(
      (await handler(request(input, randomUUID(), { 'Sec-Fetch-Site': 'cross-site' }))).status,
    ).toBe(403);
    expect(
      (await handler(request(input, randomUUID(), { 'Content-Type': 'text/plain' }))).status,
    ).toBe(415);
    expect((await handler(request({ message: 'x'.repeat(17000) }))).status).toBe(413);
    expect(await (await handler(request({ ...input, website: 'spam' }))).json()).toEqual({
      code: 'blocked',
    });
    expect((await handler(new Request(config.FEEDBACK_ORIGIN, { method: 'PUT' }))).status).toBe(
      405,
    );
    expect(send).not.toHaveBeenCalled();
  });
  it('enforces a shared IP request limit before delivering more mail', async () => {
    const { handler, send } = setup();
    for (let i = 0; i < 10; i++) expect((await handler(request())).status).toBe(200);
    const response = await handler(request());
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('900');
    expect(send).toHaveBeenCalledTimes(10);
  });
  it.each([
    ['EAUTH', 'rejected'],
    ['EREJECTED', 'rejected'],
    ['ETIMEDOUT', 'uncertain'],
    ['ECONNRESET', 'uncertain'],
  ])('handles %s safely without repeated delivery', async (code, result) => {
    const { handler, send } = setup();
    const logs = vi.spyOn(console, 'warn').mockImplementation(() => {});
    send.mockRejectedValue(Object.assign(new Error('private provider response'), { code }));
    const key = randomUUID();
    expect(await (await handler(request(input, key))).json()).toEqual({ code: result });
    expect(await (await handler(request(input, key))).json()).toEqual({ code: result });
    expect(send).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(logs.mock.calls)).not.toContain('private');
  });
  it('fails closed on storage failure and preserves uncertainty after acceptance', async () => {
    const { handler, store, send } = setup();
    vi.spyOn(store, 'limit').mockRejectedValueOnce(new Error('storage'));
    expect((await handler(request())).status).toBe(503);
    expect(send).not.toHaveBeenCalled();
    vi.spyOn(store, 'finish').mockRejectedValue(new Error('storage'));
    const key = randomUUID();
    expect(await (await handler(request(input, key))).json()).toEqual({ code: 'uncertain' });
    expect(await (await handler(request(input, key))).json()).toEqual({ code: 'in_progress' });
    expect(send).toHaveBeenCalledTimes(1);
  });
});

describe('Branded transactional email', () => {
  for (const locale of ['ar', 'en'] as const) {
    it.each([1, 3, 5])(
      'renders actual score %i, full escaped text and optional fields in ' + locale,
      (rating) => {
        const message =
          'تجربة رائعة — Great gym!\n<script>alert("x")</script> & details\n' +
          'Long comment. '.repeat(100);
        const feedback = feedbackSchema.parse({ ...input, locale, rating, message });
        const email = feedbackEmail(feedback, new Date('2026-11-06T12:00:00Z'));
        expect(email.subject).toBe('[TOP GYM WEBSITE] Customer Feedback — ' + rating + '/5');
        expect(email.html).toContain('★'.repeat(rating) + '☆'.repeat(5 - rating));
        expect(email.html).toContain('&lt;script&gt;');
        expect(email.html).not.toContain('<script>');
        expect(email.html).toContain('<br>');
        expect(email.text).toContain(message.trim());
        expect(email.html).not.toContain('mailto:');
        expect(email.html).not.toContain('<img');
        expect(email.html).toContain('SOURCE: TOP GYM WEBSITE');
        expect(email.html).toContain('dir="auto"');
        expect(email.text).toContain('Africa/Cairo');
      },
    );
  }
  it('includes supplied details safely and creates a valid reply action', () => {
    const feedback = feedbackSchema.parse({
      ...input,
      name: '<A & B>',
      email: 'customer@example.test',
      replyRequested: true,
    });
    const email = feedbackEmail(feedback);
    expect(email.html).toContain('&lt;A &amp; B&gt;');
    expect(email.html).toContain('mailto:customer%40example.test');
    expect(email.text).toContain('Reply requested: Yes');
  });
});
