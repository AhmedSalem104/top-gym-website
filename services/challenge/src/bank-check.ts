import { loadBank } from './bank.ts';
const bank = loadBank(
  process.argv.slice(2).find((value) => !value.startsWith('--')) ||
    '../../content/challenge/questions.json',
  !process.argv.includes('--production'),
);
console.log(
  JSON.stringify({
    count: bank.questions.length,
    version: bank.version,
    reviewed: bank.questions.filter((q) => q.review === 'reviewed').length,
    draft: bank.questions.filter((q) => q.review === 'draft').length,
  }),
);
