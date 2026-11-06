import nodemailer from 'nodemailer';
import type { FeedbackConfig } from './config.ts';
import type { Feedback } from './schema.ts';
import { feedbackEmail } from './email.ts';

export async function deliverFeedback(config: FeedbackConfig, feedback: Feedback, key: string) {
  const transport = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: Number(config.SMTP_PORT),
    secure: config.SMTP_PORT === '465',
    requireTLS: true,
    auth: { user: config.SMTP_USER, pass: config.SMTP_APP_PASSWORD },
    tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12_000,
    dnsTimeout: 5000,
    logger: false,
    debug: false,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const email = feedbackEmail(feedback);
    const result = await Promise.race([
      transport.sendMail({
        ...email,
        from: { name: config.FEEDBACK_FROM_NAME, address: config.SMTP_USER },
        to: config.FEEDBACK_RECIPIENT_EMAIL,
        replyTo: feedback.email || undefined,
        messageId: '<topgym-feedback-' + key + '@' + config.SMTP_USER.split('@')[1] + '>',
        headers: { 'X-Auto-Response-Suppress': 'All', 'Auto-Submitted': 'auto-generated' },
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          transport.close();
          reject(Object.assign(new Error('delivery_timeout'), { code: 'ETIMEDOUT' }));
        }, 20_000);
      }),
    ]);
    if (
      !result.accepted.some(
        (address) =>
          String(address).toLowerCase() === config.FEEDBACK_RECIPIENT_EMAIL.toLowerCase(),
      )
    )
      throw Object.assign(new Error('delivery_rejected'), { code: 'EREJECTED' });
  } finally {
    clearTimeout(timer);
    transport.close();
  }
}
