import Fastify from 'fastify';
import { z } from 'zod';
import { Store } from './db.ts';
import { Engine, attributionSchema, registrationSchema } from './engine.ts';
import { Admin, redemptionSchema } from './admin.ts';
import { Fault, digest, equal } from './security.ts';
import type { Config } from './config.ts';
import type { Question } from './bank.ts';

declare module 'fastify' {
  interface FastifyRequest {
    rawText?: string;
    trustedIp?: string;
  }
}
const id = z
  .string()
  .min(16)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/);
const cookie = (value: string | undefined, name: string) =>
  value
    ?.split(';')
    .map((x) => x.trim())
    .find((x) => x.startsWith(name + '='))
    ?.slice(name.length + 1) || '';
export function createApp(
  c: Config,
  bank: { questions: Question[]; version: string },
  now?: () => number,
) {
  const store = new Store(c, now),
    engine = new Engine(store, bank),
    admin = new Admin(store);
  const app = Fastify({
    logger: false,
    bodyLimit: 8192,
    requestTimeout: 10000,
    connectionTimeout: 15000,
    trustProxy: false,
  });
  const secure = c.NODE_ENV === 'production';
  const prefix = secure ? '__Host-' : '';
  const setCookie = (name: string, token: string, age: number) =>
    `${prefix}tg_${name}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure ? '; Secure' : ''}`;
  const token = (headers: { cookie?: string }, kind = 'player') =>
    cookie(headers.cookie, `${prefix}tg_${kind}`);
  app.removeContentTypeParser('application/json');
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    req.rawText = String(body);
    try {
      done(null, JSON.parse(req.rawText));
    } catch {
      done(new Fault('invalid_request', 400));
    }
  });
  app.addHook('onRequest', async (req, reply) => {
    reply.headers({
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'Referrer-Policy': 'no-referrer',
    });
    if (req.url === '/health') return;
    if (req.method === 'POST' && req.headers.origin !== new URL(c.CHALLENGE_ORIGIN).origin)
      throw new Fault('blocked', 403);
    if (req.headers['sec-fetch-site'] === 'cross-site') throw new Fault('blocked', 403);
    if (
      req.method === 'POST' &&
      !String(req.headers['content-type']).startsWith('application/json')
    )
      throw new Fault('invalid_request', 415);
  });
  app.addHook('preHandler', async (req) => {
    if (req.url === '/health') return;
    if (c.NODE_ENV === 'production') {
      const timestamp = String(req.headers['x-tg-time'] || ''),
        nonce = String(req.headers['x-tg-nonce'] || ''),
        ip = String(req.headers['x-tg-client'] || '');
      if (
        !/^\d{13}$/.test(timestamp) ||
        Math.abs(store.now() - Number(timestamp)) > 30000 ||
        !/^[a-f0-9]{32}$/.test(nonce) ||
        ip.length > 80
      )
        throw new Fault('blocked', 403);
      const message = [req.method, req.url, timestamp, nonce, ip, req.rawText || ''].join('\n');
      if (
        !equal(
          digest(c.CHALLENGE_GATEWAY_KEY, message),
          String(req.headers['x-tg-signature'] || ''),
        )
      )
        throw new Fault('blocked', 403);
      const accepted = store.run(
        'INSERT OR IGNORE INTO gateway_nonces VALUES(?,?)',
        nonce,
        store.now() + 60000,
      ).changes;
      if (!accepted) throw new Fault('blocked', 403);
      req.trustedIp = ip;
    } else {
      if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.ip))
        throw new Fault('blocked', 403);
      req.trustedIp = req.ip;
    }
    store.limit('api:' + req.trustedIp, 180, 60000);
  });
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof Fault) return reply.code(error.status).send({ code: error.code });
    if (error instanceof z.ZodError) return reply.code(422).send({ code: 'invalid_request' });
    const code = (error as { code?: string }).code;
    if (code === 'FST_ERR_CTP_BODY_TOO_LARGE')
      return reply.code(413).send({ code: 'request_too_large' });
    if (code === 'SQLITE_BUSY') return reply.code(503).send({ code: 'busy' });
    return reply.code(500).send({ code: 'unavailable' });
  });
  const own = (h: { cookie?: string }) => engine.identity(token(h));
  const key = (h: Record<string, unknown>) => id.parse(h['idempotency-key']);
  app.get('/health', async () => ({ status: 'ok' }));
  app.get('/v1/challenge/info', async () => ({
    available: engine.available(),
    questions: 3,
    seconds: 5,
    discounts: [0, 10, 20, 30],
    terms: c.policy?.terms || null,
    mode: c.NODE_ENV === 'production' ? 'live' : 'local',
  }));
  app.post('/v1/challenge/enroll', async (req, reply) => {
    const b = z
      .object({ phone: z.string().max(40) })
      .strict()
      .parse(req.body);
    const r = engine.enroll(
      b.phone,
      req.trustedIp!,
      z.uuid().parse(req.headers['idempotency-key']),
    );
    reply.header('Set-Cookie', setCookie('player', r.token, 86400));
    return engine.sync(r.identity);
  });
  app.post('/v1/challenge/start', async (req) => {
    const b = z
      .object({ locale: z.enum(['ar', 'en']), attribution: attributionSchema.default({}) })
      .strict()
      .parse(req.body);
    return engine.start(own(req.headers), b.locale, b.attribution);
  });
  app.get('/v1/challenge/session', async (req) => engine.view(own(req.headers)));
  app.post('/v1/challenge/sync', async (req) => {
    z.object({}).strict().parse(req.body);
    return engine.sync(own(req.headers));
  });
  app.post('/v1/challenge/answer', async (req) =>
    engine.answer(
      own(req.headers),
      z
        .object({
          question: z.string().regex(/^TG-\d{3}$/),
          option: z.string().regex(/^[a-f0-9]{24}$/),
        })
        .strict()
        .parse(req.body),
      key(req.headers),
    ),
  );
  app.post('/v1/challenge/finalize', async (req) =>
    engine.finalize(own(req.headers), registrationSchema.parse(req.body), key(req.headers)),
  );
  app.get('/v1/challenge/result', async (req) => engine.view(own(req.headers)));
  app.post('/v1/challenge/event', async (req) => {
    const b = z
      .object({
        event: z.enum(['challenge_viewed', 'challenge_opened']),
        key: id,
        attribution: attributionSchema,
      })
      .strict()
      .parse(req.body);
    store.limit('event:' + req.trustedIp, 20, 60000);
    store.event(store.hash(b.key + ':' + b.event), b.event, null, JSON.stringify(b.attribution));
    return { accepted: true };
  });
  app.post('/v1/admin/login', async (req, reply) => {
    const b = z
      .object({
        email: z.email().max(254),
        password: z.string().min(1).max(128),
        code: z.string().regex(/^\d{6}$/),
      })
      .strict()
      .parse(req.body);
    const r = await admin.login(b.email, b.password, b.code, req.trustedIp!);
    reply.header('Set-Cookie', setCookie('admin', r.token, 28800));
    return { csrf: r.csrf, role: r.role };
  });
  app.get('/v1/admin/me', async (req) => {
    const t = token(req.headers, 'admin');
    const user = admin.authenticate(t);
    return { role: user.role, csrf: admin.refreshCsrf(t) };
  });
  app.post('/v1/admin/logout', async (req, reply) => {
    const t = token(req.headers, 'admin');
    admin.authenticate(t, String(req.headers['x-csrf-token'] || ''));
    admin.logout(t);
    reply.header('Set-Cookie', setCookie('admin', '', 0));
    return { ok: true };
  });
  app.get('/v1/admin/summary', async (req) => {
    admin.authenticate(token(req.headers, 'admin'));
    return admin.summary();
  });
  app.get('/v1/admin/participants', async (req) => {
    const user = admin.authenticate(token(req.headers, 'admin'));
    const q = z
      .object({
        page: z.coerce.number().int().min(1).max(100000).default(1),
        search: z.literal('').default(''),
        status: z.enum(['all', 'issued', 'redeemed', 'expired', 'voided', 'zero']).default('all'),
        sort: z.enum(['newest', 'oldest', 'score']).default('newest'),
      })
      .strict()
      .parse(req.query);
    store.audit(user.id, 'participant_list', String(q.page));
    return admin.participants(q);
  });
  app.get('/v1/admin/participants/:id', async (req) => {
    const user = admin.authenticate(token(req.headers, 'admin'));
    const p = z.object({ id: z.uuid() }).parse(req.params);
    store.audit(user.id, 'participant_view', p.id);
    return admin.detail(p.id);
  });
  app.post('/v1/admin/participants/search', async (req) => {
    const user = admin.authenticate(
      token(req.headers, 'admin'),
      String(req.headers['x-csrf-token'] || ''),
    );
    const q = z
      .object({
        page: z.number().int().min(1).max(100000),
        search: z.string().max(100),
        status: z.enum(['all', 'issued', 'redeemed', 'expired', 'voided', 'zero']),
        sort: z.enum(['newest', 'oldest', 'score']),
      })
      .strict()
      .parse(req.body);
    store.audit(user.id, 'participant_list', String(q.page));
    return admin.participants(q);
  });
  app.post('/v1/admin/coupons/lookup', async (req) => {
    const user = admin.authenticate(
      token(req.headers, 'admin'),
      String(req.headers['x-csrf-token'] || ''),
    );
    const b = z
      .object({ code: z.string().max(40) })
      .strict()
      .parse(req.body);
    store.limit('coupon-search:' + user.id, 30, 60000);
    const result = admin.lookup(b.code);
    store.audit(user.id, 'coupon_lookup', result.id);
    return result;
  });
  app.post('/v1/admin/coupons/redeem', async (req) => {
    const user = admin.authenticate(
      token(req.headers, 'admin'),
      String(req.headers['x-csrf-token'] || ''),
    );
    const b = z
      .object({ code: z.string().max(40), confirm: z.literal(true), eligibility: redemptionSchema })
      .strict()
      .parse(req.body);
    return admin.redeem(user, b.code, key(req.headers), b.eligibility);
  });
  app.get('/v1/admin/audit', async (req) => {
    const user = admin.authenticate(token(req.headers, 'admin'));
    if (user.role !== 'owner') throw new Fault('forbidden', 403);
    const q = z
      .object({ before: z.coerce.number().int().positive().default(Number.MAX_SAFE_INTEGER) })
      .parse(req.query);
    return {
      items: store.all(
        'SELECT id,actor,action,reference,created_at FROM audit_logs WHERE id<? ORDER BY id DESC LIMIT 50',
        q.before,
      ),
    };
  });
  app.addHook('onClose', async () => {
    store.close();
  });
  return { app, store, engine, admin };
}
