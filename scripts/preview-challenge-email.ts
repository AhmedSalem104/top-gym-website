// Clearly labeled samples; no SMTP import, credentials or network requests.
import { mkdir, writeFile } from 'node:fs/promises';
import { challengeEmail, type MailData } from '../services/challenge/src/mail.ts';
import { fixtureBank } from '../services/challenge/tests/fixtures.ts';
const questions = fixtureBank.questions.slice(0, 3);
await mkdir('.local/challenge-email', { recursive: true });
for (const locale of ['ar', 'en'] as const)
  for (const score of [0, 1, 2, 3]) {
    const data: MailData = {
      name:
        locale === 'ar'
          ? 'بيانات تجريبية — ليست مشاركًا حقيقيًا'
          : 'SAMPLE DATA — not a real participant',
      phone: '+201000000000',
      email: 'sample@example.test',
      score,
      completed: Date.UTC(2026, 10, 7, 12),
      locale,
      terms: {
        ar: 'معاينة فقط؛ الكوبون غير صالح للاستخدام.',
        en: 'Preview only; this coupon is not redeemable.',
      },
      attribution: { campaign: 'LOCAL-PREVIEW' },
      questions: questions.map((q, i) => ({
        question: q,
        answer: i < score ? q.correct : (q.correct + 1) % 4,
        timedOut: false,
        correct: i < score,
      })),
      coupon: score
        ? { code: 'SAMPLE-NOT-REDEEMABLE', state: 'issued', expires: Date.UTC(2026, 10, 8, 12) }
        : undefined,
    };
    for (const audience of ['admin', 'customer'] as const) {
      const mail = challengeEmail(data, audience),
        path = `.local/challenge-email/${locale}-${score}-${audience}`;
      await writeFile(path + '.html', mail.html);
      await writeFile(path + '.txt', mail.subject + '\n\n' + mail.text);
    }
  }
console.log('16 labeled sample emails generated in .local/challenge-email; no email sent.');
