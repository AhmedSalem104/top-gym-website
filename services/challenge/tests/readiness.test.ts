import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadRuntimeBank } from '../src/bank.ts';
import { createApp } from '../src/app.ts';
import { config, fixtureBank } from './fixtures.ts';

const directories: string[] = [];
afterEach(() => {
  for (const dir of directories.splice(0)) rmSync(dir, { recursive: true });
});
function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'top-gym-bank-readiness-'));
  directories.push(dir);
  return config({
    NODE_ENV: 'production',
    CHALLENGE_ENABLED: 'false',
    CHALLENGE_ALLOW_DRAFT_BANK: 'false',
    CHALLENGE_ORIGIN: 'https://top-gym-website.vercel.app',
    CHALLENGE_BANK_FILE: join(dir, 'questions.json'),
    policy: undefined,
  });
}

describe('closed infrastructure readiness', () => {
  it('boots without an absent private bank only with admissions explicitly closed', async () => {
    const c = setup();
    const bank = loadRuntimeBank(c);
    expect(bank).toEqual({ questions: [], version: 'unconfigured' });
    const { app, engine, store } = createApp(c, bank);
    try {
      expect((await app.inject('/health')).json()).toEqual({ status: 'ok' });
      expect(engine.available()).toBe(false);
      expect(() => engine.enroll('01012345678', 'test', crypto.randomUUID())).toThrow(
        'unavailable',
      );
      expect(
        store.get<{ count: number }>('SELECT COUNT(*) count FROM phone_identities')?.count,
      ).toBe(0);
      expect((await app.inject('/v1/challenge/info')).statusCode).toBe(403);
    } finally {
      await app.close();
    }
  });

  it('fails startup with an absent bank if admissions are enabled', () => {
    expect(() => loadRuntimeBank({ ...setup(), CHALLENGE_ENABLED: 'true' })).toThrow();
  });

  it('does not silently accept a draft or corrupt bank even while closed', () => {
    const c = setup();
    writeFileSync(c.CHALLENGE_BANK_FILE, JSON.stringify(fixtureBank.questions));
    expect(() => loadRuntimeBank(c)).toThrow('Question review required');
    writeFileSync(c.CHALLENGE_BANK_FILE, '{invalid');
    expect(() => loadRuntimeBank(c)).toThrow();
  });
});
