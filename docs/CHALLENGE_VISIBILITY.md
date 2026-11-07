# Production challenge visibility — 7 November 2026

The owner's repeated report that nothing appeared was correct: the deployed HTML omitted the launcher, modal and administrator routes because the Astro build-time `PUBLIC_CHALLENGE_ENABLED` flag was not enabled. PR #24 had installed and connected the real backend, but a healthy backend does not include an opt-in component in the static frontend.

## Release behavior

- Set **production** `PUBLIC_CHALLENGE_ENABLED=true` and rebuild the main-branch Vercel deployment. This is a public boolean, never a credential. Preserve the server-only BFF configuration.
- The existing gold animated invitation and compact bilingual modal become visible; administrator routes and the five-click footer entry are included. Real administrator password/TOTP remains required.
- API readiness is authoritative. With admissions closed, show a concise, branded unavailable state, real membership and configured call links, and an availability retry. Do not collect a phone number or promise a coupon in this state.
- Existing authorized sessions can still restore their result when new admissions close. No result is recovered using a phone number alone.
- Initial network-error retry now reloads readiness instead of calling session recovery without a session. Late requests cannot overwrite a closed/reopened dialog, and retry preserves the original launcher for Escape focus restoration.
- No commercial policy, reviewed question status, SMTP settings, business values or backend admission flags are changed by this release.

## Validation

Ten focused browser cases cover closed readiness in Arabic/English at 320, 390, 768 and 1440px; compact sizing, overflow, axe checks, keyboard/focus, real action destinations, readiness retry and existing-result recovery. The existing 16 challenge browser cases remain required, including active synthetic journeys, timing, phone-only enrollment, name-only registration and protected administration. Local fixtures never reach production.

Final local run: all **26 challenge browser tests passed** (1.4 minutes), along with 62 unit tests, typecheck (92 files, no diagnostics), lint, formatting, build and SEO fixture checks. The first browser pass identified native-dialog stretching and anchor focus placement; both were corrected. One intermediate run overlapped a preview rebuild and was discarded; the final run used a fixed completed build. No performance score is inferred from these checks.

Actual evidence: [production before, mobile](evidence/challenge-visibility/before-production-ar-390.webp), [production before, desktop](evidence/challenge-visibility/before-production-ar-1440.webp), [local closed state, Arabic mobile](evidence/challenge-visibility/closed-ar-390.webp), [local closed state, English desktop](evidence/challenge-visibility/closed-en-1440.webp). Local images show the closed state, not a live earning attempt.

Protected CI and post-deployment browser evidence are recorded in the release PR. Confirm the actual public launcher and modal, not merely Vercel's Ready status. Verify `/ar/challenge-admin/` and `/en/challenge-admin/`, both languages, existing feedback readiness, prices and media. An `available:false` result is an honest closed campaign, not a successful live participation test.

## Remaining participation inputs

Approved coupon eligibility/expiry/combination terms and factual bilingual review of the private 300-question bank remain outstanding. See [activation and operational handoff](CHALLENGE_ACTIVATION.md). Do not turn on draft content or substitute a demo service to make a button appear functional.

## Rollback

Revert this release through the protected Git workflow or rebuild with the public flag false to hide the interface. Keep the private database, service keys and backend intact. Closing admissions remains a separate backend control and must not invalidate existing coupons.
