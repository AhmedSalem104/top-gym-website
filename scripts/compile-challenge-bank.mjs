// Authoring conversion only. Never marks scientific review complete.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { format } from 'prettier';
const source = await readFile(
  new URL('../content/challenge/questions.txt', import.meta.url),
  'utf8',
);
try {
  const existing = JSON.parse(
    await readFile(new URL('../content/challenge/questions.json', import.meta.url), 'utf8'),
  );
  if (existing.some((q) => q.review === 'reviewed'))
    throw new Error('Refusing to overwrite reviewed content with a draft compile');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const localized = (value) => {
  const [ar, en, ...rest] = value.trim().split('~');
  if (!ar || !en || rest.length) throw new Error('Invalid bilingual field');
  return { ar: ar.trim(), en: en.trim() };
};
const questions = source
  .split(/\r?\n/)
  .filter((l) => l.trim() && !l.startsWith('#'))
  .map((line, index) => {
    const [topic, difficulty, question, ...rest] = line.split('|');
    if (rest.length !== 5)
      throw new Error('Expected four options and explanation on row ' + (index + 1));
    const options = rest.slice(0, 4).map(localized),
      rotation = index % 4;
    return {
      id: 'TG-' + String(index + 1).padStart(3, '0'),
      topic: topic.trim(),
      difficulty: { M: 'medium', H: 'medium-advanced', A: 'advanced' }[difficulty.trim()],
      question: localized(question),
      options: [...options.slice(rotation), ...options.slice(0, rotation)],
      correct: (4 - rotation) % 4,
      explanation: localized(rest[4]),
      sources: [],
      review: 'draft',
    };
  });
if (questions.length !== 300)
  throw new Error(`Expected 300 authored questions, found ${questions.length}`);
const compiled = JSON.stringify(questions, null, 2) + '\n';
await writeFile(new URL('../content/challenge/questions.json', import.meta.url), compiled);
await writeFile(
  new URL('../content/challenge/manifest.json', import.meta.url),
  await format(
    JSON.stringify(
      {
        count: questions.length,
        difficulty: { medium: 90, 'medium-advanced': 150, advanced: 60 },
        locales: ['ar', 'en'],
        reviewed: 0,
        draft: 300,
        sha256: createHash('sha256').update(compiled).digest('hex'),
        source: 'Private local original-authoring draft; not a public answer bank',
        productionEligible: false,
      },
      null,
      2,
    ),
    { parser: 'json' },
  ),
);
console.log(
  'Compiled 300 draft questions. Independent source review is required before activation.',
);
