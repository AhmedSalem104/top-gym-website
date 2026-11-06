import { randomBytes } from 'node:crypto';
import type { Config } from '../src/config.ts';
import type { Question } from '../src/bank.ts';
export const clock = () => ({
  value: Date.UTC(2026, 10, 7, 12),
  now() {
    return this.value;
  },
  advance(ms: number) {
    this.value += ms;
  },
});
export function config(overrides: Partial<Config> = {}): Config {
  return {
    NODE_ENV: 'test',
    CHALLENGE_HOST: '127.0.0.1',
    CHALLENGE_PORT: 4400,
    CHALLENGE_DB: ':memory:',
    CHALLENGE_ORIGIN: 'http://127.0.0.1:4321',
    CHALLENGE_ENABLED: 'true',
    CHALLENGE_DATA_KEY: randomBytes(32).toString('hex'),
    CHALLENGE_HASH_KEY: randomBytes(32).toString('hex'),
    CHALLENGE_GATEWAY_KEY: randomBytes(32).toString('hex'),
    CHALLENGE_BANK_FILE: 'unused',
    CHALLENGE_ALLOW_DRAFT_BANK: 'true',
    OTP_PROVIDER: 'mock',
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: '465',
    CHALLENGE_CUSTOMER_EMAIL_ENABLED: 'false',
    policy: {
      version: 'TEST-NOT-REDEEMABLE',
      approved: true,
      approvedAt: '2026-11-07T00:00:00Z',
      validDays: 7,
      packages: ['gym', 'gym-cardio'],
      durations: ['month'],
      newCustomersOnly: false,
      combinable: false,
      terms: {
        ar: 'شروط تجريبية للاختبار المحلي فقط، ليست عرضًا تجاريًا.',
        en: 'Local test policy only. Not a real commercial offer.',
      },
    },
    ...overrides,
  };
}
export const fixtureBank = {
  version: 'test-fixtures-not-production',
  questions: Array.from({ length: 300 }, (_, i): Question => ({
    id: `TG-${String(i + 1).padStart(3, '0')}`,
    topic: 'test-only',
    difficulty: i < 90 ? 'medium' : i < 240 ? 'medium-advanced' : 'advanced',
    question: { ar: `سؤال اختبار ${i + 1}`, en: `Test question ${i + 1}` },
    options: [
      { ar: 'صحيح', en: 'Correct' },
      { ar: 'ثان', en: 'Second' },
      { ar: 'ثالث', en: 'Third' },
      { ar: 'رابع', en: 'Fourth' },
    ],
    correct: 0,
    explanation: { ar: 'بيانات اختبار فقط.', en: 'Test data only.' },
    sources: ['https://example.org/test-fixture'],
    review: 'draft',
  })),
};
