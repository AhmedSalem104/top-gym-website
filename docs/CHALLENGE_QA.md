# Challenge verification evidence

This is a local Gate 1 record. No production/staging mutation, real SMS or challenge email was sent. Test identities and coupons in screenshots are synthetic and not redeemable.

## Scope and commands

| Check                    | Evidence                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| Backend types/build      | `npm run challenge:check` / `challenge:build`                                               |
| Backend invariants       | `npm run challenge:test`: 45 tests passed locally, including actual private-bank validation |
| Website/BFF unit tests   | `npm test`: 58 tests passed                                                                 |
| Frontend types           | `npm run typecheck`: zero errors/warnings                                                   |
| Lint and formatting      | `npm run lint`, `npm run format:check`                                                      |
| Default production build | `npm run build`: four pages, challenge UI/admin routes absent by default                    |
| SEO fixture              | `npm run test:seo`: passed; original sitemap/metadata unchanged                             |
| Existing site regression | `PLAYWRIGHT_PORT=4330 npm run test:e2e`: 117 passed, no retries/skips                       |
| Opt-in preview           | `npm run challenge:preview:build`: six pages including AR/EN admin                          |
| Challenge browser suite  | `npm run challenge:e2e`: 15 passed, no retries/skips                                        |
| Actual content           | 300 private drafts, 90/150/60; reviewed 0; production validator rejects them                |
| Email preview            | `npm run challenge:email`: 16 labeled AR/EN admin/customer samples, scores 0–3, no SMTP     |

## Meaningful security checks

- Canonical Egyptian numbers across local/international/Arabic/Persian forms; invalid input and OTP request/attempt limits.
- One attempt across new verified browser sessions; fixed randomized selection; one question per difficulty band, no repeated question and no public answer key.
- Exactly 5,000 ms per question; receipt at deadline rejected; disconnected 15-second sequence expires; client retries cannot restart clocks.
- 0/10/20/30 scoring, zero-score no-coupon, unique registration/coupon/outbox, changed idempotency rejection and forced issuance rollback.
- Three independent SQLite worker connections race redemption: one succeeds, two reject. Policy/package/duration/offer mismatch, viewer rejection and single-use records tested.
- Argon2/TOTP, CSRF, authentication/authorization, body/origin boundaries and gateway signature/nonce replay checks.
- Authenticated encryption, persisted identity/coupon recovery after an online SQLite backup and restore, integrity/foreign-key checks.
- Mocked OTP approval/rejection/timeout and provider outage without identity creation.
- Escaped HTML/text mail, real validated score data, known SMTP failure retry, ambiguous-send quarantine and no duplicate coupon on mail failure.

Public CI has no private bank; that one test explicitly skips there. Mandatory release validation must run on the approved private artifact. This is not hidden by the synthetic fixture suite.

## Browser and visual coverage

Arabic/English dialog at 320, 390, 768 and 1440 px; real local API flow, successful registration, 30% coupon recovery, zero-score timeout, hidden entry, actual MFA login, search and one-time redemption. Expanded suite also checks Arabic administration at four widths, authenticated language switching, touch open/focus/close, reduced-motion results and a 4× CPU slowdown with failed-answer recovery. Axe scans and overflow assertions cover the dialog/admin surfaces. Existing website suite covers its original responsive/motion/feedback behavior.

Screenshots are actual Chromium captures under `docs/evidence/challenge/`. No screenshot is represented as production. Local preview warnings are intentionally visible. Examples:

- [Arabic mobile introduction](evidence/challenge/intro-ar-390.png)
- [English desktop introduction](evidence/challenge/intro-en-1440.png)
- [Arabic question fixture](evidence/challenge/question-ar.png)
- [Arabic result](evidence/challenge/result-ar.png)
- [English administration](evidence/challenge/admin-en-1440.png)

Visual review found and corrected redundant admin-logo alternative text, retained dialog scroll position when changing steps, and a centered auto-height modal shift under CPU throttling. The modal now keeps stable viewport-bounded geometry across steps; its internal content scrolls when necessary. Result count-up uses the shared 260 ms entrance duration, reserves numeric space, stops when closed and is bypassed for reduced motion. Cards, timer and options remain within the viewport; the large admin table has its own keyboard-accessible scroll region.

## Honest limits

No live SMS ownership verification, Gmail inbox placement, actual Gmail dark-mode rendering, Docker/Linux startup, deployed BFF, campaign load capacity, external penetration test or off-host disaster recovery has been validated. Local Chromium measurements are not field LCP/INP or a 60 FPS guarantee. Source-bank scientific/difficulty review and five-second accessibility feasibility remain mandatory. No WCAG conformance claim follows from axe alone.

The local Docker CLI could not connect to its Linux daemon; no attempt was made to start/reconfigure it. Server templates need approved staging execution. No tests were run against the shared VPS.

## Final run

Verified on 7 November 2026 (Africa/Cairo), Windows / Node 24.22.2 / Chromium:

- 45 backend tests, 58 website/BFF unit tests, 117 existing browser tests and 15 challenge browser tests passed.
- TypeScript/Astro, ESLint, Prettier, backend compilation, default static build, opt-in preview build and SEO checks passed. The backend production-dependency audit reported zero known vulnerabilities at inspection time (not a security guarantee). The exact final check record is in [validation.json](evidence/challenge/validation.json).
- The first website regression run accidentally reused the existing Astro development server on 4321 (dev-toolbar headings and unavailable local feedback route). No assertions were weakened: rerunning on the existing production-build test proxy on 4330 passed all 117 cases.
- The first expanded challenge run exposed a real modal layout shift at 4? CPU slowdown. Stable dialog geometry fixed it; the final slow-device scenario recorded CLS **0** and all 15 cases passed.
- An initial performance script waiting for `networkidle` timed out. Final measurement waits for DOM, fonts and the priority image explicitly, avoiding indefinite unrelated network activity.
- Email previews use synthetic question fixtures and sample identities. AR mobile with dark preference and EN desktop with light preference were captured in Chromium with no horizontal overflow. **This is not Gmail rendering verification.**

## Measured local performance

One bounded sample per viewport, localhost with no network throttle. The baseline proxy compresses responses and the opt-in harness does not; compare **decoded** JavaScript sizes, not encoded transfer sizes. This comparison cannot establish a statistically significant speedup/regression.

| Width / CPU | Baseline LCP | Enabled LCP | Enabled CLS | Opening interaction duration | Frame interval p95 after opening |
| ----------- | -----------: | ----------: | ----------: | ---------------------------: | -------------------------------: |
| 390 / 4?    |       608 ms |      476 ms |           0 |                        64 ms |                          16.8 ms |
| 1440 / 1?   |       220 ms |      288 ms |           0 |                        32 ms |                          33.4 ms |

Initial decoded scripts: 40,814 bytes baseline and 44,068 enabled, an increase of **3,254 bytes**. Opening the challenge lazily loads another **20,380 bytes** (64,448 total). The bank and SQLite/OTP/SMTP dependencies are absent from browser bundles.

Each frame sample contains 120 intervals. Mobile had zero intervals above 34 ms; desktop had one. These are bounded rAF scheduling samples, not a sustained 60 FPS result. Recorded Event Timing durations are **not field INP**. Network/VPS/real-device capacity and campaign load remain staging work.

Raw measurements: [baseline](evidence/challenge/performance-baseline.json), [enabled](evidence/challenge/performance-enabled.json). Reproduce with `node scripts/measure-challenge.mjs baseline http://127.0.0.1:4330` and `node scripts/measure-challenge.mjs enabled http://127.0.0.1:4340` against the documented local servers.

Additional visual comparisons: [mobile before](evidence/challenge/landing-before-390.png), [mobile after](evidence/challenge/landing-after-390.png), [desktop before](evidence/challenge/landing-before-1440.png), [desktop after](evidence/challenge/landing-after-1440.png), [Arabic admin mobile](evidence/challenge/admin-ar-390.png), [sample Arabic email](evidence/challenge/email-ar-390-dark.png).
