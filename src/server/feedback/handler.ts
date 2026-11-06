import { createHmac } from 'node:crypto';
import { feedbackLimits } from '../../config/feedback.ts';
import { feedbackSchema, idempotencySchema, type Feedback } from './schema.ts';
import type { FeedbackConfig } from './config.ts';
import type { FeedbackStore } from './store.ts';

export interface FeedbackDependencies {
  config?: FeedbackConfig;
  store?: FeedbackStore;
  send: (feedback: Feedback, key: string) => Promise<void>;
}
const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex',
};
const reply = (status: number, code: string, fields?: string[]) =>
  Response.json(
    code === 'accepted' ? { status: 'accepted' } : { code, ...(fields ? { fields } : {}) },
    { status, headers: { ...headers, ...(status === 429 ? { 'Retry-After': '900' } : {}) } },
  );

async function readBody(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > feedbackLimits.bodyBytes)
    throw new Error('too_large');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid');
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        const chunks: Uint8Array[] = [];
        let length = 0;
        for (;;) {
          const result = await reader.read();
          if (result.done) break;
          length += result.value.byteLength;
          if (length > feedbackLimits.bodyBytes) throw new Error('too_large');
          chunks.push(result.value);
        }
        return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('invalid')), 8000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => {});
  }
}

export function createFeedbackHandler(deps: FeedbackDependencies) {
  return async (request: Request): Promise<Response> => {
    const { config, store } = deps;
    if (request.method === 'GET')
      return Response.json({ available: Boolean(config && store) }, { headers });
    if (request.method !== 'POST')
      return new Response(null, { status: 405, headers: { ...headers, Allow: 'GET, POST' } });
    if (!config || !store) return reply(503, 'unavailable');
    if (
      request.headers.get('origin') !== new URL(config.FEEDBACK_ORIGIN).origin ||
      request.headers.get('sec-fetch-site') === 'cross-site'
    )
      return reply(403, 'blocked');
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json')
      return reply(415, 'invalid');
    const key = idempotencySchema.safeParse(request.headers.get('idempotency-key'));
    if (!key.success) return reply(400, 'invalid');
    const hash = (value: string) =>
      createHmac('sha256', config.FEEDBACK_HASH_SECRET).update(value).digest('hex');
    // Vercel replaces this header at its trusted proxy. Other hosts must supply a trusted IP.
    const client = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    const rateKey = 'feedback:rate:' + hash(client);
    try {
      if (!(await store.limit(rateKey, 10, 900))) return reply(429, 'rate_limited');
    } catch {
      return reply(503, 'unavailable');
    }
    let body: unknown;
    try {
      body = await readBody(request);
    } catch (error) {
      return reply(error instanceof Error && error.message === 'too_large' ? 413 : 400, 'invalid');
    }
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success)
      return reply(422, 'invalid', [
        ...new Set(parsed.error.issues.map((issue) => String(issue.path[0] || 'invalid'))),
      ]);
    if (parsed.data.website) return reply(400, 'blocked');
    const fingerprint = hash(JSON.stringify(parsed.data));
    const deliveryKey = 'feedback:delivery:' + hash(key.data);
    try {
      const claim = await store.claim(deliveryKey, fingerprint);
      if (claim.fingerprint !== fingerprint) return reply(409, 'conflict');
      if (!claim.fresh) {
        if (claim.state === 'accepted') return reply(200, 'accepted');
        if (claim.state === 'pending')
          return reply(409, Date.now() - claim.createdAt > 90_000 ? 'uncertain' : 'in_progress');
        return reply(503, claim.state === 'uncertain' ? 'uncertain' : 'rejected');
      }
      if (!(await store.limit('feedback:global', 60, 900))) {
        await store.finish(deliveryKey, fingerprint, 'failed');
        return reply(429, 'rate_limited');
      }
      try {
        await deps.send(parsed.data, key.data);
      } catch (error) {
        const code = (error as { code?: string }).code;
        const definitive = ['EAUTH', 'EENVELOPE', 'EREJECTED'].includes(code || '');
        // Do not log SMTP responses, credentials, customer text or identifying fields.
        console.warn('feedback_delivery_failed', definitive ? 'rejected' : 'uncertain');
        try {
          await store.finish(deliveryKey, fingerprint, definitive ? 'failed' : 'uncertain');
        } catch {
          return reply(503, 'uncertain');
        }
        return reply(503, definitive ? 'rejected' : 'uncertain');
      }
      try {
        await store.finish(deliveryKey, fingerprint, 'accepted');
      } catch {
        // SMTP may have accepted the message: preserve the pending claim and never send twice.
        return reply(503, 'uncertain');
      }
      return reply(200, 'accepted');
    } catch {
      return reply(503, 'unavailable');
    }
  };
}
