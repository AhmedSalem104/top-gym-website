import { z } from 'zod';
import { feedbackCategories, feedbackLimits } from '../../config/feedback.ts';

// Remove invisible bidi overrides; direction is set by markup, never user controls.
export const cleanText = (text: string) =>
  text
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    // Deliberate removal of non-printing controls from submitted text.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, '')
    .trim();
const optionalEmail = z
  .string()
  .max(feedbackLimits.emailMax)
  .trim()
  .refine((value) => value === '' || z.email().safeParse(value).success);
export const feedbackSchema = z
  .strictObject({
    rating: z.number().int().min(1).max(5),
    categories: z
      .array(z.enum(feedbackCategories))
      .min(1)
      .max(6)
      .refine((items) => new Set(items).size === items.length),
    message: z
      .string()
      .max(feedbackLimits.messageMax)
      .transform(cleanText)
      .pipe(z.string().min(feedbackLimits.messageMin).max(feedbackLimits.messageMax)),
    name: z.string().max(feedbackLimits.nameMax).transform(cleanText).default(''),
    email: optionalEmail.default(''),
    replyRequested: z.boolean().default(false),
    locale: z.enum(['ar', 'en']),
    website: z.string().max(200).default(''),
  })
  .superRefine((value, context) => {
    if (value.replyRequested && !value.email)
      context.addIssue({ code: 'custom', path: ['replyRequested'], message: 'email_required' });
  });
export type Feedback = z.infer<typeof feedbackSchema>;
export const idempotencySchema = z.uuid();
