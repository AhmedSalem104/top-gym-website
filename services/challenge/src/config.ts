import { z } from 'zod';
import { readFileSync } from 'node:fs';

export const policySchema = z
  .object({
    version: z.string().min(1).max(80),
    approved: z.literal(true),
    approvedAt: z.iso.datetime(),
    validDays: z.number().int().min(1).max(366),
    packages: z.array(z.enum(['gym', 'gym-cardio'])).min(1),
    durations: z
      .array(z.enum(['half-month', 'month', 'two-months', 'three-months', 'six-months', 'year']))
      .min(1),
    newCustomersOnly: z.boolean(),
    combinable: z.boolean(),
    terms: z.object({ ar: z.string().min(20).max(2000), en: z.string().min(20).max(2000) }),
  })
  .strict();
export type Policy = z.infer<typeof policySchema>;
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CHALLENGE_HOST: z.string().default('127.0.0.1'),
  CHALLENGE_PORT: z.coerce.number().int().min(1024).max(65535).default(4400),
  CHALLENGE_DB: z.string().default('.local/challenge.sqlite'),
  CHALLENGE_ORIGIN: z.url(),
  CHALLENGE_ENABLED: z.enum(['true', 'false']).default('false'),
  CHALLENGE_DATA_KEY: z.string().regex(/^[a-f0-9]{64}$/i),
  CHALLENGE_HASH_KEY: z.string().regex(/^[a-f0-9]{64}$/i),
  CHALLENGE_GATEWAY_KEY: z.string().regex(/^[a-f0-9]{64}$/i),
  CHALLENGE_POLICY_FILE: z.string().optional(),
  CHALLENGE_BANK_FILE: z.string().default('../../content/challenge/questions.json'),
  CHALLENGE_ALLOW_DRAFT_BANK: z.enum(['true', 'false']).default('false'),
  SMTP_HOST: z.literal('smtp.gmail.com').default('smtp.gmail.com'),
  SMTP_PORT: z.enum(['465', '587']).default('465'),
  SMTP_USER: z.union([z.email().max(254), z.literal('')]).optional(),
  SMTP_APP_PASSWORD: z.string().optional(),
  CHALLENGE_ADMIN_EMAIL: z.union([z.email().max(254), z.literal('')]).optional(),
  // Explicit owner opt-in; the password hash stays in the private database.
  CHALLENGE_PASSWORD_ADMIN_EMAIL: z.union([z.email().max(254), z.literal('')]).optional(),
});
export type Config = z.infer<typeof envSchema> & { policy?: Policy };
export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success)
    throw new Error(
      'Invalid challenge configuration: ' +
        result.error.issues.map((x) => x.path.join('.')).join(', '),
    );
  const c = result.data;
  const url = new URL(c.CHALLENGE_ORIGIN);
  if (url.pathname !== '/' || url.username || url.password || url.search || url.hash)
    throw new Error('Invalid origin');
  if (
    c.NODE_ENV === 'production' &&
    (url.protocol !== 'https:' || c.CHALLENGE_ALLOW_DRAFT_BANK === 'true')
  )
    throw new Error('Unsafe production configuration');
  if (
    new Set(
      [c.CHALLENGE_DATA_KEY, c.CHALLENGE_HASH_KEY, c.CHALLENGE_GATEWAY_KEY].map((key) =>
        key.toLowerCase(),
      ),
    ).size !== 3
  )
    throw new Error('Independent keys required');
  const policy = c.CHALLENGE_POLICY_FILE
    ? policySchema.parse(JSON.parse(readFileSync(c.CHALLENGE_POLICY_FILE, 'utf8')))
    : undefined;
  return { ...c, policy };
}
