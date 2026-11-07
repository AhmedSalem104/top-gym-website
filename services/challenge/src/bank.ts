import { z } from 'zod';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { Config } from './config.ts';
const localized = z
  .object({ ar: z.string().min(1).max(500), en: z.string().min(1).max(500) })
  .strict();
export const questionSchema = z
  .object({
    id: z.string().regex(/^TG-\d{3}$/),
    topic: z.string().min(2),
    difficulty: z.enum(['medium', 'medium-advanced', 'advanced']),
    question: localized,
    options: z.array(localized).length(4),
    correct: z.number().int().min(0).max(3),
    explanation: localized,
    sources: z.array(z.url()),
    review: z.enum(['draft', 'reviewed']),
    reviewer: z.string().optional(),
    reviewedAt: z.iso.datetime().optional(),
  })
  .strict();
export type Question = z.infer<typeof questionSchema>;
export function validateBank(input: unknown, allowDraft = false) {
  const questions = z.array(questionSchema).length(300).parse(input);
  const ids = new Set<string>();
  const stems = { ar: new Set<string>(), en: new Set<string>() };
  const counts = { medium: 0, 'medium-advanced': 0, advanced: 0 };
  for (const q of questions) {
    if (ids.has(q.id)) throw new Error('Duplicate question ID');
    ids.add(q.id);
    counts[q.difficulty]++;
    for (const locale of ['ar', 'en'] as const) {
      const stem = q.question[locale]
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[\p{P}\p{Z}]/gu, '');
      if (stems[locale].has(stem)) throw new Error('Duplicate question stem: ' + q.id);
      stems[locale].add(stem);
      if (new Set(q.options.map((x) => x[locale].trim().toLowerCase())).size !== 4)
        throw new Error('Duplicate options: ' + q.id);
    }
    if (
      !allowDraft &&
      (q.review !== 'reviewed' || !q.reviewer || !q.reviewedAt || !q.sources.length)
    )
      throw new Error('Question review required: ' + q.id);
  }
  if (counts.medium !== 90 || counts['medium-advanced'] !== 150 || counts.advanced !== 60)
    throw new Error('Invalid difficulty distribution');
  return questions;
}
export function loadBank(path: string, allowDraft: boolean) {
  const raw = readFileSync(path, 'utf8');
  return {
    questions: validateBank(JSON.parse(raw), allowDraft),
    version: createHash('sha256').update(raw).digest('hex'),
  };
}

// Infrastructure can be installed with admissions closed before private content
// is approved. A missing bank is the only tolerated error, and only while off.
// Invalid, unreadable and unreviewed supplied files must still fail startup.
export function loadRuntimeBank(config: Config) {
  try {
    return loadBank(
      config.CHALLENGE_BANK_FILE,
      config.NODE_ENV !== 'production' && config.CHALLENGE_ALLOW_DRAFT_BANK === 'true',
    );
  } catch (error) {
    if (config.CHALLENGE_ENABLED === 'false' && (error as NodeJS.ErrnoException).code === 'ENOENT')
      return { questions: [] as Question[], version: 'unconfigured' };
    throw error;
  }
}
