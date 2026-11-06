import { mkdir, writeFile } from 'node:fs/promises';
import { feedbackEmail } from '../src/server/feedback/email.ts';
import { feedbackSchema } from '../src/server/feedback/schema.ts';

await mkdir('.local/feedback-email', { recursive: true });
for (const locale of ['ar', 'en'] as const) {
  const sample = feedbackSchema.parse({
    locale,
    rating: 4,
    categories: ['equipment', 'suggestions'],
    name: 'SAMPLE CUSTOMER — NOT A REAL SUBMISSION',
    email: 'sample@example.test',
    replyRequested: true,
    message:
      locale === 'ar'
        ? 'بيانات تجريبية للمعاينة فقط — هذه ليست رسالة عميل حقيقية.\nتجربة تدريب جيدة، وأقترح إضافة شرح واضح لطريقة استخدام الأجهزة.\nTOP GYM — sample feedback.'
        : 'SAMPLE DATA — NOT A REAL CUSTOMER SUBMISSION.\nA good training experience. I suggest adding clear equipment instructions.\nTOP GYM — تجربة تجريبية فقط.',
  });
  const email = feedbackEmail(sample, new Date('2026-11-06T12:00:00Z'));
  await writeFile('.local/feedback-email/' + locale + '.html', email.html);
  await writeFile('.local/feedback-email/' + locale + '.txt', email.text);
}
console.log('Sample email previews created in .local/feedback-email; nothing was sent.');
