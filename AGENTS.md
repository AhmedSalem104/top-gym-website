# TOP GYM contributor instructions

Build a bilingual marketing site for the real TOP GYM. Preserve the supplied Apex Gold Stitch direction and business facts. Static Astro pages have private feedback and a gated challenge BFF; this is not a membership/payment application.

**Fitness challenge release authorization:** on 7 November 2026 the owner explicitly instructed "???? ????? ???" after the local implementation handoff. Pushing, protected-PR merging and Vercel publication are now authorized. Keep the challenge disabled because the live OTP provider, API hostname, approved discount policy, reviewed bank and operational configuration are still missing. Publication authorization does not supply those decisions or allow mock verification/draft questions to run in production. Read `docs/CHALLENGE.md`, `docs/CHALLENGE_API.md`, `docs/CHALLENGE_OPERATIONS.md`, `docs/QUESTION_BANK.md` and `docs/CHALLENGE_QA.md`.

- Challenge backend: `services/challenge` (Node 24/Fastify/SQLite/Argon2/TOTP); run `npm run challenge:install`, `challenge:check`, `challenge:test`, `challenge:preview:build`, `challenge:e2e`. All real OTP/mail/campaign tests require approved staging; local harness uses mock OTP and no email.
- This GitHub repository is PUBLIC. Never commit `content/challenge/questions.txt`, `questions.json`, private review ledgers, DBs or secrets. Public fixtures are synthetic. Actual 300-question drafts are ignored local artifacts; no production activation before qualified review, approved policy/OTP/domain and retention decisions. Public CI cannot substitute for private-bank release validation.

- Stack: Astro, TypeScript, Tailwind 4/CSS, small DOM scripts. Node 24, npm lockfile.
- Business facts: `src/config/business.ts`; translations: `src/i18n/index.ts`; media descriptions: `src/content/media.ts`.
- Shared components: `src/components`; page sections: `src/sections`; tokens/layout: `src/styles/global.css`.
- Motion: `src/config/motion.ts`, `src/scripts/motion.ts`, `src/styles/motion.css`. Reuse `data-motion` primitives; no hidden SSR content, duplicate observers, scroll loops or animation dependencies. Read `docs/MOTION_SYSTEM.md` and update `docs/MOTION_COVERAGE_MATRIX.md` with verification when adding sections.
- Validate: `npm ci`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, `npm run build`, `npm run test:e2e`. Install Chromium with `npx playwright install chromium`.
- Use gold #E59500 on the approved dark palette. Preserve Barlow Condensed/Chivo and use Cairo for Arabic. No lime UI, fabricated logo, invented facilities or promotional claims.
- Check Arabic RTL and English LTR at 320, 390, 768, 1440, 1920px. Keep visible focus, 44px targets, semantic controls, reduced motion and keyboard-accessible dialogs.
- All photographic human imagery must be male only. Inspect photos, posters and reflections manually. This is not evidence that the business is men-only.
- Keep source archives, original certificates and unapproved PDFs outside Git. The owner explicitly approved the official pricing PDF under `public/documents/`; preserve its byte-identical source and narrow `.gitignore` exception. Never overwrite originals. Update `docs/asset-manifest.json` for every derivative. Do not publish certificate identifiers or claim unverified qualifications/identity.
- Prices must match the official 2026-11-05 PDF. Hours are provisional; do not silently mark them verified. WhatsApp is a group invitation, never a private support chat.
- Work on feature branches with conventional commits. Preserve existing work; never force push or reset. On 2026-11-06 the owner explicitly authorized merging/publishing this update and gave standing authorization to push, merge through the protected PR workflow and publish subsequent verified changes. Do not ask again unless a later instruction limits a change to review only or an essential blocker requires input. Keep required checks and post-deployment verification.
- Done means implemented, validated, visually reviewed against source, documented with actual evidence, and free of unresolved launch blockers. Never present targets as measurements.

Read `docs/PROJECT.md`, `docs/DECISIONS.md`, `docs/PROGRESS.md`, and `docs/QA_CHECKLIST.md` before resuming. See `docs/CONTENT_INVENTORY.md` for withheld content and `docs/DEPLOYMENT.md` before release.

Navigation state lives in `src/scripts/navigation.ts`; share desktop/mobile `aria-current="location"`. Membership tabs require RTL arrow keys, Home/End, immediate prices and the no-JavaScript comparison table. See `docs/ARCHITECTURE.md`.

Footer groups and the pre-footer CTA reuse shared `footer` motion. Never restart an opacity entrance on content already painted in the viewport; preserve the offscreen-edge trigger and fast-anchor fallback. Keep first-paint hero CSS separate from observer ownership. See `docs/MOTION_SYSTEM.md` for the diagnosed discontinuities and `docs/DEPLOYMENT.md` for the Vercel/main-branch investigation.

Current Hero composition, media provenance and post-Hero header inversion: `docs/HERO_REDESIGN.md`. Keep Home mapped to the Hero in ScrollSpy; never observe the full body as a section.

Cinematic Hero: `docs/CINEMATIC_HERO.md`. Camera and lighting own separate CSS transforms; text remains one-time motion. Reuse the existing Hero observer, pause offscreen/hidden documents and disable continuous effects for reduced motion. The owner explicitly requested stronger movement, removal of the visible pause control, and publication of this update. Keep the accessibility tradeoff documented.

Private feedback: `docs/CUSTOMER_FEEDBACK.md`; `src/sections/Feedback.astro`, `src/scripts/feedback.ts`, `src/server/feedback/`, `api/feedback.ts`. Keep secrets server-only and ignored. Use mocked SMTP in CI, never real customer messages. Success means SMTP acceptance, not confirmed inbox placement. Preserve atomic rate limits/idempotency, fixed sender, validation and fail-closed configuration. `npm run preview:email` generates labeled samples without sending mail.

Credentials layout, responsive derivatives and certificate-only zoom: `docs/CREDENTIALS_PRESENTATION.md`. Keep document files, redactions, issuer names and training dates intact. Card hover uses independent `translate`; do not compete with shared reveal transforms. The requested new visual-reference image is still pending; the owner subsequently authorized publishing the implemented written-brief design.
