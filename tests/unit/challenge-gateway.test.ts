import { afterEach, describe, it, expect, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { challengeGateway } from '../../src/server/challenge-gateway';
const origin = 'https://website.example.test';
const env = {
  CHALLENGE_ORIGIN: origin,
  CHALLENGE_BACKEND_URL: 'https://api.example.test',
  CHALLENGE_GATEWAY_KEY: 'a'.repeat(64),
};
const request = (
  path = 'challenge/start',
  body: unknown = { locale: 'ar' },
  headers: Record<string, string> = {},
) =>
  new Request(`${origin}/api/challenge/v1/${path}`, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
afterEach(() => vi.unstubAllGlobals());
describe('challenge BFF security boundary', () => {
  it('allows direct phone enrollment and refuses removed verification routes', async () => {
    const fetch = vi.fn(async () => Response.json({ status: 'eligible' }));
    vi.stubGlobal('fetch', fetch);
    expect(
      (await challengeGateway(request('challenge/enroll', { phone: '01012345678' }), env)).status,
    ).toBe(200);
    expect((await challengeGateway(request('verification/request'), env)).status).toBe(404);
    expect((await challengeGateway(request('verification/confirm'), env)).status).toBe(404);
    expect(fetch).toHaveBeenCalledOnce();
  });
  it.each([
    '/api/challenge/?__tg_route=v1/admin/participants&__tg_path=admin/participants&page=2',
    '/api/challenge/v1/admin/participants/?__tg_route=v1/admin/secrets&__tg_path=admin/secrets&page=2',
  ])('preserves the canonical allowlisted path through Vercel rewrites: %s', async (path) => {
    const fetch = vi.fn(async (url: URL, options: RequestInit) => {
      expect(url.href).toBe('https://api.example.test/v1/admin/participants?page=2');
      const h = options.headers as Record<string, string>;
      const signature = createHmac('sha256', Buffer.from(env.CHALLENGE_GATEWAY_KEY, 'hex'))
        .update(
          [
            'GET',
            '/v1/admin/participants?page=2',
            h['x-tg-time'],
            h['x-tg-nonce'],
            'unknown',
            '',
          ].join('\n'),
        )
        .digest('hex');
      expect(h['x-tg-signature']).toBe(signature);
      return Response.json({ items: [] });
    });
    vi.stubGlobal('fetch', fetch);
    expect((await challengeGateway(new Request(origin + path), env)).status).toBe(200);
    expect(fetch).toHaveBeenCalledOnce();
  });
  it('rejects ambiguous or unapproved rewritten routes without contacting the backend', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    for (const query of [
      '__tg_route=v1/admin/secrets',
      '__tg_route=v1/challenge/info&__tg_route=v1/admin/me',
    ])
      expect(
        (await challengeGateway(new Request(origin + '/api/challenge?' + query), env)).status,
      ).toBeGreaterThanOrEqual(400);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('fails closed without configuration or with non-TLS backend', async () => {
    expect((await challengeGateway(request(), {})).status).toBe(503);
    expect(
      (await challengeGateway(request(), { ...env, CHALLENGE_BACKEND_URL: 'http://127.0.0.1' }))
        .status,
    ).toBe(503);
  });
  it('rejects cross-origin, wrong content, unknown routes and large requests before upstream', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    expect(
      (
        await challengeGateway(
          request('challenge/start', {}, { Origin: 'https://evil.example' }),
          env,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await challengeGateway(
          request('challenge/start', {}, { 'Content-Type': 'text/plain' }),
          env,
        )
      ).status,
    ).toBe(415);
    expect((await challengeGateway(request('admin/secrets'), env)).status).toBe(404);
    expect(
      (await challengeGateway(request('challenge/start', { huge: 'x'.repeat(9000) }), env)).status,
    ).toBe(413);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('signs exact payload, strips unrelated cookies, preserves secure sessions and never returns secrets', async () => {
    const fetch = vi.fn(async (_url: unknown, options: RequestInit) => {
      const h = options.headers as Record<string, string>;
      const expected = createHmac('sha256', Buffer.from(env.CHALLENGE_GATEWAY_KEY, 'hex'))
        .update(
          [
            'POST',
            '/v1/challenge/start',
            h['x-tg-time'],
            h['x-tg-nonce'],
            '203.0.113.7',
            options.body,
          ].join('\n'),
        )
        .digest('hex');
      expect(h['x-tg-signature']).toBe(expected);
      expect(h.Cookie).toBe(' __Host-tg_player=token');
      expect(options.redirect).toBe('error');
      return Response.json(
        { status: 'active' },
        {
          headers: {
            'Set-Cookie': '__Host-tg_player=next; Path=/; Secure; HttpOnly; SameSite=Lax',
          },
        },
      );
    });
    vi.stubGlobal('fetch', fetch);
    const response = await challengeGateway(
      request(
        'challenge/start',
        { locale: 'ar' },
        { cookie: 'unrelated=secret; __Host-tg_player=token', 'x-forwarded-for': '203.0.113.7' },
      ),
      env,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('Set-Cookie')).toContain('HttpOnly');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.text()).not.toContain(env.CHALLENGE_GATEWAY_KEY);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('reports safe unavailable state for provider/network errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('private provider message');
      }),
    );
    const r = await challengeGateway(request(), env);
    expect(r.status).toBe(503);
    expect(await r.text()).toBe('{"code":"unavailable"}');
  });
});
