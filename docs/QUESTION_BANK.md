# Private question bank and review status

> **Production status (7 November 2026):** a private 300-question bank is active. It passed the production structural validator and its runtime metadata records an AI-assisted editorial/source review. This is **not** an independent qualified fitness, nutrition, medical, or Arabic-language review. Source references are topic-level and are not a signed per-question approval. See [CHALLENGE_LIVE_STATUS.md](CHALLENGE_LIVE_STATUS.md). Do not describe the bank as expert-certified.

The original authoring draft contains exactly 300 bilingual questions: 90 medium, 150 medium-advanced and 60 advanced. Each has an ID, topic, Arabic/English stem, four translated choices, one correct index, explanation and review status. The local files are `content/challenge/questions.txt` and `questions.json`; a public checksum/count manifest contains no answers.

A checksum-verified private local backup was also placed under the owner's `Documents/TOP GYM Private/challenge-bank-24a76f89` folder, with Windows access restricted to the current user and SYSTEM. This is a local preservation copy, not an off-host backup or approved private content repository.

The repository copy remains a draft and is not the production bank. The private runtime copy is a separate artifact. Its automated production validator reports all entries as reviewed because runtime readiness requires review metadata; that metadata explicitly identifies an AI-assisted review and does not establish expert approval. The difficulty allocation is not empirical calibration. Scientific accuracy, difficulty, translation quality, and suitability under the timer still need a qualified human review.

## Private artifact boundary

GitHub visibility was verified PUBLIC. Actual questions, answer keys and review records are ignored by Git, excluded from Vercel and Docker context, and must never be attached to a public PR/CI artifact. Obtain an approved private content store and named reviewers before release. No private store was invented or created.

Public tests use clearly synthetic questions. The real-bank test explicitly skips on a fresh clone without the private artifact. Release validation must separately inspect the actual reviewed artifact. The backend mounts it read-only; neither a public image nor Vercel includes it.

## Authoring

One line uses `topic|M/H/A|stem|correct choice|choice|choice|choice|explanation`, with Arabic and English separated by `~`. The compiler rotates the correct index; runtime shuffles again with opaque IDs. This is authoring convenience, not a security boundary. `npm run challenge:bank` compiles initial drafts only and refuses to overwrite reviewed entries.

Validation enforces 300 records, 90/150/60, unique IDs/normalized stems, four distinct options per language, one answer index, bilingual bounds and URL syntax. Production additionally requires `review:reviewed`, a real reviewer, ISO review timestamp and nonempty sources for every item.

## Mandatory review workflow

1. Assign a competent fitness/nutrition reviewer and Arabic/English reviewer; record actual identities privately.
2. Verify each stem, explanation and distractor against appropriate primary evidence; exactly one choice must be defensible.
3. Check semantic duplicates, difficulty, units, translation equivalence and no dangerous exercise advice, diagnoses or unsupported health claims.
4. Pilot both languages on mobile under five server seconds and realistic latency. Rewrite long items or obtain an approved timing-policy change; do not secretly extend time.
5. Add exact source URLs, reviewer and date only after checking that item. Retain approval notes privately.
6. Run `node src/bank-check.ts /private/approved/questions.json --production` from `services/challenge`; archive checksum/version and encrypted rollback copy privately.

No AI-generated reviewer identity or false review flag is acceptable. Do not copy restricted commercial textbook assessments. The questions were originally authored; citations are for factual review, not permission to reproduce source text.

Review starting points include [NIH ODS exercise and athletic performance](https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/), its primary references, [CDC adult activity guidance](https://www.cdc.gov/physical-activity-basics/guidelines/adults.html), and relevant primary anatomy/physiology/training research. These are resources, **not a claim that they support every draft entry**.

The strict time limit needs accessibility approval. [WCAG Timing Adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html) describes adjustment options and narrowly defined exceptions. Axe success cannot certify this policy. An appropriate accessible alternative or justified exception remains a launch decision.
