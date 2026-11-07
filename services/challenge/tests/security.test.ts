import { afterEach, describe, it, expect, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { Worker } from 'node:worker_threads';
import Database from 'better-sqlite3';
import { Store } from '../src/db.ts';
import { Engine, type Round } from '../src/engine.ts';
import { createApp } from '../src/app.ts';
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
  const engine = new Engine(s, fixtureBank);
  const p = engine.enroll('01012345678', 'local', randomUUID());
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
    { name: 'Local persisted test', consent: true },
    randomUUID(),
  );
  return { engine, p, result };
}
describe('persistence and adversarial boundaries', () => {
  it('migrates five-second storage without changing saved answers, coupons or active deadlines', async () => {
    const { c } = persistent(),
      time = clock();
    const original = new Store(c, () => time.value);
    const { engine, result } = await complete(original);
    const active = engine.enroll('01012345679', 'local', randomUUID());
    engine.start(active.identity, 'en', {});
    const oldSchema = original
      .get<{ sql: string }>(
        "SELECT sql FROM sqlite_master WHERE name='challenge_session_questions'",
      )!
      .sql.replace('challenge_session_questions', 'legacy_questions')
      .replace('deadline - starts IN (5000, 10000)', 'deadline = starts + 5000');
    original.db.pragma('foreign_keys = OFF');
    original.db.exec(`${oldSchema};
      INSERT INTO legacy_questions SELECT session_id,ordinal,question_id,snapshot,option_order,starts,starts+5000 FROM challenge_session_questions;
      DROP TABLE challenge_session_questions;
      ALTER TABLE legacy_questions RENAME TO challenge_session_questions;
      DELETE FROM schema_version WHERE version=3;
      CREATE INDEX legacy_question_time ON challenge_session_questions(starts);
    `);
    original.db.pragma('foreign_keys = ON');
    const tables = [
      'challenge_session_questions',
      'challenge_answers',
      'participants',
      'coupons',
      'email_delivery_jobs',
    ];
    const before = tables.map((table) => original.all(`SELECT * FROM ${table}`));
    const legacyRound = engine.sync(active.identity).question!;
    original.close();
    const migrated = new Store(c, () => time.value);
    try {
      expect(tables.map((table) => migrated.all(`SELECT * FROM ${table}`))).toEqual(before);
      expect(migrated.db.pragma('foreign_key_check')).toEqual([]);
      expect(migrated.db.pragma('foreign_keys', { simple: true })).toBe(1);
      expect(migrated.db.pragma('integrity_check', { simple: true })).toBe('ok');
      expect(migrated.get('SELECT version FROM schema_version WHERE version=3')).toBeTruthy();
      expect(
        migrated.get("SELECT name FROM sqlite_master WHERE name='legacy_question_time'"),
      ).toBeTruthy();
      const current = new Engine(migrated, fixtureBank);
      expect(current.sync(active.identity).question).toEqual(legacyRound);
      time.advance(5000);
      const nextLegacy = current.sync(active.identity).question!;
      expect(nextLegacy.ordinal).toBe(2);
      expect(nextLegacy.deadlineAt - nextLegacy.startsAt).toBe(5000);
      const fresh = current.enroll('01012345670', 'local', randomUUID());
      const q = current.start(fresh.identity, 'en', {}).question!;
      expect(q.deadlineAt - q.startsAt).toBe(10000);
      expect(() =>
        migrated.run('UPDATE challenge_session_questions SET deadline=starts+11000'),
      ).toThrow();
      expect(migrated.all('SELECT * FROM coupons')).toHaveLength(result.coupon ? 1 : 0);
    } finally {
      migrated.close();
    }
    const reopened = new Store(c, () => time.value);
    try {
      expect(reopened.db.pragma('foreign_key_check')).toEqual([]);
      expect(reopened.all('SELECT * FROM challenge_session_questions')).toHaveLength(9);
    } finally {
      reopened.close();
    }
  });
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
      const engine = new Engine(restored, fixtureBank);
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
        CHALLENGE_ALLOW_DRAFT_BANK: 'false',
      });
    const { app } = createApp(c, fixtureBank, () => time.value);
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
  it('migrates legacy verified identities without falsely verifying new entries', () => {
    const { c } = persistent();
    const old = new Database(c.CHALLENGE_DB);
    old.exec(`CREATE TABLE verified_phone_identities(id TEXT PRIMARY KEY,phone_hash TEXT UNIQUE NOT NULL,phone_cipher TEXT NOT NULL,verified_at INTEGER NOT NULL);
      INSERT INTO verified_phone_identities VALUES('old','old-hash','old-cipher',123);
      CREATE TABLE browser_sessions(token_hash TEXT PRIMARY KEY,phone_id TEXT NOT NULL REFERENCES verified_phone_identities(id),expires INTEGER NOT NULL);
      INSERT INTO browser_sessions VALUES('old-session','old',9999999999999);`);
    old.close();
    const store = new Store(c);
    try {
      expect(
        store.get(
          'SELECT registered_at,ownership_verified FROM phone_identities WHERE id=?',
          'old',
        ),
      ).toEqual({ registered_at: 123, ownership_verified: 1 });
      new Engine(store, fixtureBank).enroll('01012345678', 'client', randomUUID());
      expect(
        store.get('SELECT ownership_verified FROM phone_identities WHERE id<>?', 'old'),
      ).toEqual({ ownership_verified: 0 });
      expect(store.db.pragma('foreign_key_check')).toEqual([]);
      expect(
        store.get('SELECT phone_id FROM browser_sessions WHERE token_hash=?', 'old-session'),
      ).toEqual({ phone_id: 'old' });
    } finally {
      store.close();
    }
  });
  it('rejects repeated concurrent phone claims and never exposes the first session', async () => {
    const { c } = persistent(),
      first = new Store(c),
      second = new Store(c);
    try {
      const a = new Engine(first, fixtureBank),
        b = new Engine(second, fixtureBank);
      const owner = a.enroll('01012345678', 'client-a', randomUUID());
      expect(() => b.enroll('+201012345678', 'client-b', randomUUID())).toThrow(
        'entry_unavailable',
      );
      expect(second.all('SELECT * FROM browser_sessions')).toHaveLength(1);
      expect(a.identity(owner.token)).toBe(owner.identity);
    } finally {
      first.close();
      second.close();
    }
  });
});
