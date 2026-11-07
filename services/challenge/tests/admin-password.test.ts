import { afterEach, expect, it } from 'vitest';
import { createApp } from '../src/app.ts';
import { config, clock, fixtureBank } from './fixtures.ts';
import { totp } from '../src/security.ts';
const email = 'owner@example.test';
const password = 'Local-owner-password-only!';
const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
const instances: ReturnType<typeof createApp>[] = [];
afterEach(async () => {
  for (const instance of instances.splice(0)) await instance.app.close();
});
async function setup(enabled = true, role: 'owner' | 'viewer' = 'owner') {
  const time = clock();
  const c = config({ CHALLENGE_PASSWORD_ADMIN_EMAIL: enabled ? email : undefined });
  const a = createApp(c, fixtureBank, () => time.now());
  instances.push(a);
  await a.admin.create(email, password, secret, role);
  const post = (body: unknown, origin = c.CHALLENGE_ORIGIN) =>
    a.app.inject({
      method: 'POST',
      url: '/v1/admin/access',
      headers: { origin },
      payload: body,
    });
  return { ...a, c, time, post };
}
it('requires explicit server configuration and an enabled owner account', async () => {
  const off = await setup(false);
  expect((await off.post({ password })).statusCode).toBe(503);
  const viewer = await setup(true, 'viewer');
  expect((await viewer.post({ password })).statusCode).toBe(401);
  const disabled = await setup();
  disabled.store.run('UPDATE admin_users SET disabled=1');
  expect((await disabled.post({ password })).statusCode).toBe(401);
});
it('issues a private session without email/TOTP, with CSRF and logout enforcement', async () => {
  const a = await setup();
  expect((await a.app.inject('/v1/admin/summary')).statusCode).toBe(401);
  const response = await a.post({ password });
  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({ csrf: expect.any(String), role: 'owner' });
  expect(response.headers['cache-control']).toBe('no-store');
  const cookie = String(response.headers['set-cookie']);
  expect(cookie).toContain('HttpOnly');
  expect(cookie).toContain('SameSite=Lax');
  expect(cookie).not.toContain(password);
  const headers = { cookie: cookie.split(';')[0], origin: a.c.CHALLENGE_ORIGIN };
  expect((await a.app.inject({ url: '/v1/admin/summary', headers })).statusCode).toBe(200);
  expect(
    (await a.app.inject({ method: 'POST', url: '/v1/admin/logout', headers, payload: {} }))
      .statusCode,
  ).toBe(403);
  expect(
    (
      await a.app.inject({
        method: 'POST',
        url: '/v1/admin/logout',
        headers: { ...headers, 'x-csrf-token': response.json().csrf },
        payload: {},
      })
    ).statusCode,
  ).toBe(200);
  expect((await a.app.inject({ url: '/v1/admin/summary', headers })).statusCode).toBe(401);
});
it('rejects wrong passwords, extra identity fields, cross-origin and oversized input', async () => {
  const a = await setup();
  expect((await a.post({ password: 'incorrect' })).statusCode).toBe(401);
  expect((await a.post({ password, email: 'other@example.test' })).statusCode).toBe(422);
  expect((await a.post({ password }, 'https://other.example.test')).statusCode).toBe(403);
  expect((await a.post({ password: 'x'.repeat(9000) })).statusCode).toBe(413);
  expect(a.store.all('SELECT * FROM admin_sessions')).toHaveLength(0);
  expect(JSON.stringify(a.store.all('SELECT * FROM audit_logs'))).not.toContain(password);
});
it('shares account limits with legacy MFA and cannot bypass them by changing IP', async () => {
  const a = await setup();
  for (let i = 0; i < 5; i++)
    await expect(a.admin.loginOwner('incorrect', 'ip-' + i)).rejects.toThrow('invalid_login');
  await expect(a.admin.loginOwner(password, 'new-ip')).rejects.toThrow('rate_limited');
  await expect(
    a.admin.login(email, password, totp(secret, a.time.now()), 'another-ip'),
  ).rejects.toThrow('rate_limited');
  a.time.advance(900001);
  const session = await a.admin.loginOwner(password, 'new-ip');
  expect(a.admin.authenticate(session.token).role).toBe('owner');
});
it('does not bypass MFA for another account and retains idle expiry', async () => {
  const a = await setup();
  await a.admin.create('other@example.test', password, secret);
  await expect(a.admin.login('other@example.test', password, undefined, 'ip')).rejects.toThrow(
    'invalid_login',
  );
  const session = await a.admin.loginOwner(password, 'owner-ip');
  a.time.advance(1800001);
  expect(() => a.admin.authenticate(session.token)).toThrow('authentication_required');
});
