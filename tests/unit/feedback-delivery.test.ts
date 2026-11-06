import { afterEach, expect, it, vi } from 'vitest';
import nodemailer from 'nodemailer';
import { deliverFeedback } from '../../src/server/feedback/delivery';
import { feedbackSchema } from '../../src/server/feedback/schema';
import { readFeedbackConfig } from '../../src/server/feedback/config';
import { redisStore } from '../../src/server/feedback/store';

vi.mock('nodemailer', () => ({ default: { createTransport: vi.fn() } }));
const config = readFeedbackConfig({
  SMTP_USER: 'sender@example.test',
  SMTP_APP_PASSWORD: 'sample-only-not-a-real-password',
  FEEDBACK_RECIPIENT_EMAIL: 'recipient@example.test',
  UPSTASH_REDIS_REST_URL: 'https://redis.example.test',
  UPSTASH_REDIS_REST_TOKEN: 'sample-token-not-a-credential',
  FEEDBACK_HASH_SECRET: 'sample-hmac-key-for-isolated-tests-only',
})!;
const feedback = feedbackSchema.parse({
  rating: 3,
  categories: ['other'],
  message: 'A helpful suggestion.',
  locale: 'en',
  email: 'customer@example.test',
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each(['465', '587'] as const)(
  'uses an authenticated fixed sender and encrypted SMTP on %s',
  async (port) => {
    const sendMail = vi.fn().mockResolvedValue({ accepted: [config.FEEDBACK_RECIPIENT_EMAIL] });
    const close = vi.fn();
    vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail, close } as never);
    await deliverFeedback({ ...config, SMTP_PORT: port }, feedback, 'sample-key');
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.gmail.com',
        port: Number(port),
        secure: port === '465',
        requireTLS: true,
        logger: false,
        debug: false,
        disableFileAccess: true,
        disableUrlAccess: true,
      }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: { name: 'TOP GYM Website', address: 'sender@example.test' },
        to: 'recipient@example.test',
        replyTo: 'customer@example.test',
        subject: '[TOP GYM WEBSITE] Customer Feedback — 3/5',
        html: expect.any(String),
        text: expect.any(String),
      }),
    );
    expect(close).toHaveBeenCalled();
  },
);
it('does not treat provider rejection as success', async () => {
  vi.mocked(nodemailer.createTransport).mockReturnValue({
    sendMail: vi.fn().mockResolvedValue({ accepted: [] }),
    close: vi.fn(),
  } as never);
  await expect(deliverFeedback(config, feedback, 'key')).rejects.toMatchObject({
    code: 'EREJECTED',
  });
});
it('bounds stalled SMTP and closes the transport', async () => {
  vi.useFakeTimers();
  try {
    const close = vi.fn();
    vi.mocked(nodemailer.createTransport).mockReturnValue({
      sendMail: () => new Promise(() => {}),
      close,
    } as never);
    const pending = expect(deliverFeedback(config, feedback, 'key')).rejects.toMatchObject({
      code: 'ETIMEDOUT',
    });
    await vi.advanceTimersByTimeAsync(20000);
    await pending;
    expect(close).toHaveBeenCalled();
  } finally {
    vi.useRealTimers();
  }
});
it('uses atomic Redis scripts, expiry and fails closed on invalid storage responses', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ result: 1 }))
    .mockResolvedValueOnce(Response.json({ result: 'new' }))
    .mockResolvedValueOnce(Response.json({ result: 1 }))
    .mockResolvedValueOnce(Response.json({ error: 'private storage failure' }));
  vi.stubGlobal('fetch', fetcher);
  const store = redisStore(config);
  expect(await store.limit('hash-only', 10, 900)).toBe(true);
  expect(await store.claim('hash-only', 'digest')).toMatchObject({ fresh: true, state: 'pending' });
  await store.finish('hash-only', 'digest', 'accepted');
  await expect(store.limit('hash-only', 10, 900)).rejects.toThrow('storage_unavailable');
  const commands = fetcher.mock.calls.map((call) => JSON.parse(call[1].body));
  expect(commands.every((command) => command[0] === 'EVAL')).toBe(true);
  expect(commands[1][1]).toContain('86400');
});
