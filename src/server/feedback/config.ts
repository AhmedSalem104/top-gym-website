import { z } from 'zod';

const environment = z.object({
  SMTP_HOST: z.literal('smtp.gmail.com').default('smtp.gmail.com'),
  SMTP_PORT: z.enum(['465', '587']).default('465'),
  SMTP_USER: z.email(),
  SMTP_APP_PASSWORD: z.string().min(16).max(128),
  FEEDBACK_RECIPIENT_EMAIL: z.email(),
  FEEDBACK_FROM_NAME: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[^\r\n]+$/)
    .default('TOP GYM Website'),
  FEEDBACK_ORIGIN: z.url().default('https://top-gym-website.vercel.app'),
  UPSTASH_REDIS_REST_URL: z.url().refine((value) => new URL(value).protocol === 'https:'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(20),
  FEEDBACK_HASH_SECRET: z.string().min(32),
});
export type FeedbackConfig = z.infer<typeof environment>;
export function readFeedbackConfig(
  env: Record<string, string | undefined> = process.env,
): FeedbackConfig | undefined {
  const parsed = environment.safeParse(env);
  if (!parsed.success) return;
  const origin = new URL(parsed.data.FEEDBACK_ORIGIN);
  if (origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash)
    return;
  if (origin.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(origin.hostname)) return;
  return parsed.data;
}
