# Private question-bank boundary

This repository is public. `questions.txt`, `questions.json` and `reviews.json` are deliberately ignored, excluded from Vercel and excluded from Docker build context. **Never add them with `git add -f`, attach them to a public PR, or upload them as a public CI artifact.**

The original 300-question bilingual authoring draft is available locally to the owner at these ignored paths. `manifest.json` records counts and a checksum only; it does not expose questions or answers. Public tests use clearly synthetic fixture questions with no value for the real challenge.

A fresh clone needs the private artifact from the approved private content store to run `npm run challenge:bank`, real-question preview or a real backend. Default local browser tests still work without it. Release validation must run against the **actual reviewed private artifact**; passing public CI is insufficient.

Use `scripts/compile-challenge-bank.mjs` for initial draft conversion only. It resets review metadata and must not overwrite an approved bank. Keep reviewed releases in an access-controlled, versioned private store. Review procedure: [QUESTION_BANK.md](../../docs/QUESTION_BANK.md).
