import { afterEach, describe, it, expect, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { Worker } from 'node:worker_threads';
import Database from 'better-sqlite3';
import { Store } from '../src/db.ts';
import { Engine, type Round } from '../src/engine.ts';
import { createApp } from '../src/app.ts';
import { createOtp } from '../src/otp.ts';
import { Admin, type AdminUser } from '../src/admin.ts';
import { digest } from '../src/security.ts';
import { loadBank } from '../src/bank.ts';
import { config, fixtureBank, clock } from './fixtures.ts';
const root = resolve('.local/test-storage');
mkdirSync(root, { recursive: true });
const directories: string[] = [];
afterEach(() => {
  vi.unstubAllGlobals();
  for (const path of directories.splice(0)) {
    if (dirname(resolve(path)) !== root) throw new Error('Unsafe test cleanup');
    rmSync(path, { recursive: true });
  }
});
function persistent() {
  const dir = mkdtempSync(resolve(root, 'case-'));
  directories.push(dir);
  const c = config({ CHALLENGE_DB: resolve(dir, 'challenge.sqlite') });
  return { dir, c };
}
async function complete(s: Store) {
  const engine = new Engine(s, fixtureBank, createOtp(s.config));
  const v = await engine.requestVerification('01012345678', 'local');
  const p = await engine.confirmVerification(v.verification, '246810', 'local');
  engine.start(p.identity, 'en', {});
  for (let i = 0; i < 3; i++) {
    const state = engine.sync(p.identity),
      q = s.get<Round>('SELECT * FROM challenge_session_questions WHERE ordinal=?', i + 1)!;
    const option = (JSON.parse(q.option_order) as { id: string; index: number }[]).find(
      (x) => x.index === 0,
    )!;
    engine.answer(p.identity, { question: state.question!.id, option: option.id }, randomUUID());
  }
  const result = engine.finalize(
    p.identity,
    { name: 'Local persisted test', consent: true, marketingConsent: false },
    randomUUID(),
  );
  return { engine, p, result };
}
describe('persistence and adversarial boundaries', () => {
  it.skipIf(!existsSync('../../content/challenge/questions.json'))(
    'validates the PRIVATE authored bank; requires private artifact outside public CI',
    () => {
      const bank = loadBank('../../content/challenge/questions.json', true);
      expect(bank.questions).toHaveLength(300);
      expect(bank.questions.every((q) => q.topic !== 'test-only')).toBe(true);
      expect(() => loadBank('../../content/challenge/questions.json', false)).toThrow('review');
    },
  );
  it('reopens persisted identity/result and restores an online SQLite snapshot', async () => {
    const { dir, c } = persistent();
    const s = new Store(c);
    const { p, result } = await complete(s);
    await s.db.backup(resolve(dir, 'backup.sqlite'));
    s.close();
    const restored = new Store({ ...c, CHALLENGE_DB: resolve(dir, 'backup.sqlite') });
    try {
      expect(restored.db.pragma('integrity_check', { simple: true })).toBe('ok');
      expect(restored.db.pragma('foreign_key_check')).toEqual([]);
      const engine = new Engine(restored, fixtureBank, createOtp(c));
      expect(engine.identity(p.token)).toBe(p.identity);
      expect(engine.start(p.identity, 'ar', {}).coupon?.code).toBe(result.coupon!.code);
      expect(restored.all('SELECT * FROM participants')).toHaveLength(1);
    } finally {
      restored.close();
    }
    const source = new Database(c.CHALLENGE_DB, { readonly: true });
    expect(source.prepare('SELECT count(*) n FROM coupons').get()).toEqual({ n: 1 });
    source.close();
  });
  it('enforces one redemption across independent worker connections', async () => {
    const { c } = persistent(),
      s = new Store(c),
      { result } = await complete(s),
      admin = new Admin(s);
    await admin.create(
      'race@example.test',
      'Local-race-password-only!',
      'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
    );
    const user = s.get<AdminUser>('SELECT * FROM admin_users')!;
    const signal = new SharedArrayBuffer(4);
    const control = new Int32Array(signal);
    const workers: Worker[] = [];
    const promises: Promise<string>[] = [];
    try {
      for (let i = 0; i < 3; i++) {
        const worker = new Worker(
          `const {parentPort,workerData}=require('node:worker_threads');(async()=>{const {Store}=await import(workerData.db);const {Admin}=await import(workerData.admin);const s=new Store(workerData.config);parentPort.postMessage('ready');Atomics.wait(new Int32Array(workerData.signal),0,0);try{new Admin(s).redeem(workerData.user,workerData.code,workerData.key,{package:'gym',duration:'month',newCustomer:false,otherOffer:false});parentPort.postMessage('redeemed');}catch(e){parentPort.postMessage(e.code||'error');}finally{s.close();}})();`,
          {
            eval: true,
            workerData: {
              db: new URL('../dist/db.js', import.meta.url).href,
              admin: new URL('../dist/admin.js', import.meta.url).href,
              config: c,
              user,
              code: result.coupon!.code,
              key: randomUUID(),
              signal,
            },
          },
        );
        workers.push(worker);
        await new Promise<void>((resolve, reject) => {
          worker.once('message', () => resolve());
          worker.once('error', reject);
        });
        promises.push(
          new Promise((resolve, reject) => {
            worker.once('message', resolve);
            worker.once('error', reject);
          }),
        );
      }
      Atomics.store(control, 0, 1);
      Atomics.notify(control, 0);
      const outcomes = await Promise.all(promises);
      expect(outcomes.filter((x) => x === 'redeemed')).toHaveLength(1);
      expect(outcomes.filter((x) => x === 'coupon_unavailable')).toHaveLength(2);
      expect(s.all('SELECT * FROM coupon_redemptions')).toHaveLength(1);
    } finally {
      await Promise.all(workers.map((w) => w.terminate()));
      s.close();
    }
  }, 15000);
  it('requires valid fresh gateway signature and rejects nonce replay', async () => {
    const time = clock(),
      c = config({
        NODE_ENV: 'production',
        CHALLENGE_ORIGIN: 'https://site.example.test',
        OTP_PROVIDER: 'disabled',
        CHALLENGE_ALLOW_DRAFT_BANK: 'false',
      });
    const { app } = createApp(c, fixtureBank, createOtp(c), () => time.value);
    try {
      const path = '/v1/challenge/info',
        timestamp = String(time.value),
        nonce = '1'.repeat(32),
        ip = '203.0.113.1';
      const headers = {
        'x-tg-time': timestamp,
        'x-tg-nonce': nonce,
        'x-tg-client': ip,
        'x-tg-signature': digest(
          c.CHALLENGE_GATEWAY_KEY,
          ['GET', path, timestamp, nonce, ip, ''].join('\n'),
        ),
      };
      expect((await app.inject(path)).statusCode).toBe(403);
      expect((await app.inject({ url: path, headers })).statusCode).toBe(200);
      expect((await app.inject({ url: path, headers })).statusCode).toBe(403);
      time.advance(31000);
      expect((await app.inject({ url: path, headers })).statusCode).toBe(403);
    } finally {
      await app.close();
    }
  });
  it('handles OTP outage without issuing an identity or leaking provider text', async () => {
    const c = config(),
      s = new Store(c);
    const engine = new Engine(s, fixtureBank, {
      request: async () => {
        throw new Error('private gateway message');
      },
      confirm: async () => false,
    });
    try {
      await expect(engine.requestVerification('01012345678', 'client')).rejects.toThrow(
        'verification_unavailable',
      );
      expect(s.all('SELECT * FROM verified_phone_identities')).toHaveLength(0);
      expect(s.get<{ state: string }>('SELECT state FROM phone_verifications')!.state).toBe(
        'failed',
      );
    } finally {
      s.close();
    }
  });
  it.each(['rejected', 'timeout', 'approved'])(
    'exercises configured OTP adapter with mocked %s transport',
    async (mode) => {
      const c = config({
        OTP_PROVIDER: 'twilio',
        TWILIO_ACCOUNT_SID: 'AC' + '1'.repeat(32),
        TWILIO_VERIFY_SERVICE_SID: 'VA' + '2'.repeat(32),
        TWILIO_AUTH_TOKEN: 'test-only',
      });
      const fetch = vi.fn(async () => {
        if (mode === 'timeout') throw new Error('timeout');
        return Response.json({ status: 'approved' }, { status: mode === 'rejected' ? 503 : 200 });
      });
      vi.stubGlobal('fetch', fetch);
      const otp = createOtp(c);
      if (mode === 'approved') expect(await otp.confirm('+201012345678', '123456')).toBe(true);
      else
        await expect(otp.confirm('+201012345678', '123456')).rejects.toThrow(
          'verification_unavailable',
        );
      expect(fetch).toHaveBeenCalledTimes(1);
    },
  );
});
