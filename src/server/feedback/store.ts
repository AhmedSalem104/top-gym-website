import type { FeedbackConfig } from './config.ts';

export type DeliveryState = 'pending' | 'accepted' | 'failed' | 'uncertain';
export interface FeedbackStore {
  limit(key: string, maximum: number, seconds: number): Promise<boolean>;
  claim(
    key: string,
    fingerprint: string,
  ): Promise<{ fresh: boolean; fingerprint: string; state: DeliveryState; createdAt: number }>;
  finish(key: string, fingerprint: string, state: DeliveryState): Promise<void>;
}
// Atomic counters and claims across serverless instances. No message/email/IP is stored.
const limitScript =
  "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n";
const claimScript =
  "local v=redis.call('GET',KEYS[1]); if v then return v end; redis.call('SET',KEYS[1],ARGV[1],'EX',86400); return 'new'";
const finishScript =
  "local v=redis.call('GET',KEYS[1]); if v then local o=cjson.decode(v); if o.fingerprint==ARGV[1] and o.state=='pending' then o.state=ARGV[2]; redis.call('SET',KEYS[1],cjson.encode(o),'EX',86400); return 1 end end; return 0";
export function redisStore(config: FeedbackConfig): FeedbackStore {
  const command = async (args: (string | number)[]) => {
    const response = await fetch(config.UPSTASH_REDIS_REST_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + config.UPSTASH_REDIS_REST_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error('storage_unavailable');
    const result = (await response.json()) as { result?: unknown; error?: string };
    if (result.error) throw new Error('storage_unavailable');
    return result.result;
  };
  return {
    async limit(key, maximum, seconds) {
      const count = await command(['EVAL', limitScript, 1, key, seconds]);
      if (typeof count !== 'number') throw new Error('storage_unavailable');
      return count <= maximum;
    },
    async claim(key, fingerprint) {
      const createdAt = Date.now();
      const value = await command([
        'EVAL',
        claimScript,
        1,
        key,
        JSON.stringify({ fingerprint, state: 'pending', createdAt }),
      ]);
      if (value === 'new') return { fresh: true, fingerprint, state: 'pending', createdAt };
      if (typeof value !== 'string') throw new Error('storage_unavailable');
      const record = JSON.parse(value) as {
        fingerprint: string;
        state: DeliveryState;
        createdAt: number;
      };
      if (
        !record.fingerprint ||
        !Number.isFinite(record.createdAt) ||
        !['pending', 'accepted', 'failed', 'uncertain'].includes(record.state)
      )
        throw new Error('storage_unavailable');
      return { fresh: false, ...record };
    },
    async finish(key, fingerprint, state) {
      const result = await command(['EVAL', finishScript, 1, key, fingerprint, state]);
      if (result !== 1) throw new Error('storage_unavailable');
    },
  };
}
