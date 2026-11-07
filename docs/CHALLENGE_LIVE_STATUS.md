# Fitness challenge production status — 7 November 2026

## Current state

The TOP GYM challenge is active on the production website at [top-gym-website.vercel.app](https://top-gym-website.vercel.app/). The public readiness endpoint reports `available: true`, three questions per attempt, ten seconds per question, and the configured 0%, 10%, 20%, and 30% discounts. The Arabic and English entry forms were opened in a real browser at 390px and 1440px; each showed the phone-entry step without page errors.

The dedicated VPS service is healthy behind the existing signed Vercel API gateway. The private SQLite database was preserved. A verified pre-activation snapshot was taken; it contained zero participants, challenge sessions, and coupons. No test participant, quiz attempt, or coupon was created in production. The previous admissions-closed container remains available for rollback.

## Active offer settings

- Eligible packages: Gym and Gym + Cardio.
- Eligible durations: all six published membership durations.
- Coupon life: 30 days from issue.
- Eligibility: new customers only.
- Combining offers: not allowed.
- Scoring: 0/3 = 0%; 1/3 = 10%; 2/3 = 20%; 3/3 = 30%.
- Participation: three questions, ten seconds each, with server-side deadlines.

The policy file and complete question bank are stored only in the VPS's private, read-only mounts. Neither is committed to the public repository or included in Vercel assets.

## Question review limitation

The runtime bank has 300 bilingual questions distributed 90 medium, 150 medium-advanced, and 60 advanced. It passed the production structural validator for count, IDs, options, translations, difficulty, dates, and nonempty source references. The installed artifact records an AI-assisted editorial/source review and includes a reviewer description that explicitly says it is **not independent qualified human review**.

The sources were selected by topic; they are not a signed item-by-item scientific review. No fitness, nutrition, medical, or professional Arabic-language reviewer approved the bank. Therefore, do not describe the questions as expert-certified or medically reviewed. A qualified human review remains recommended. The user-visible challenge is informational and should not be treated as exercise or medical advice.

## Verification performed

- Strict production question-bank validation: 300 questions, 300 runtime review records, 0 drafts; required 90/150/60 distribution.
- Backend suite: 55 tests passed; isolated browser suite: 38/38 tests passed.
- Isolated production-image canary: signed readiness passed without using the production customer database or sending email.
- Production backend: signed readiness passed; HTTPS health passed; existing application/storage configuration checksums remained unchanged.
- Public Vercel API: `available: true`, `questions: 3`, `seconds: 10`, discounts `[0, 10, 20, 30]`, terms present.
- Browser: Arabic and English at 390px and 1440px; launch button, dialog, phone field, and rules visible; zero page errors and no horizontal overflow.
- No production enrollment, answer submission, registration, email, or redemption was attempted because that would create real participation data.

## Operational notes

The app password, bank, policy, and database remain private on their authorized systems. The business terms above are the active configuration; change them only through a reviewed policy update and a private backend release. Admin entry remains the existing five logo clicks followed by the configured password. The dashboard itself still requires authenticated access.

The production API's readiness response is the simplest check that the challenge is open. If it reports `available: false`, check the challenge container health and private bank/policy mounts; do not toggle the browser UI flag to mask a backend readiness issue.
