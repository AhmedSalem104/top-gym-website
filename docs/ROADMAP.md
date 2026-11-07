# Delivery roadmap

## Fitness challenge backlog

Local implementation now covers backend/schema, API, OTP adapter, timing/scoring, coupons, challenge UI/results/registration, mail outbox, protected admin, redemption, attribution, localization and automated tests. The 300 original draft questions exist privately; qualified content review remains open. Staging/production phases are not complete. Pending owner decisions and release checks are in [CHALLENGE.md](CHALLENGE.md) and [CHALLENGE_OPERATIONS.md](CHALLENGE_OPERATIONS.md). No new GitHub issues/project changes or remote deployment are claimed for this gated phase.

[GitHub Project: TOP GYM — Website delivery](https://github.com/users/AhmedSalem104/projects/2) is an actual private owner project with ten linked issues and ten milestones. The tracker inventory is in `github-tracker.json`.

Phases 0, 1, 2, 3, 5, 6 and 8 are complete with local and GitHub Actions evidence. Phases 4, 7 and 9 remain in progress for the owner inputs below.

| Phase                       | Issue                                                             | Implementation state / remaining work                                                                                           |
| --------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Audit/inventory         | [#1](https://github.com/AhmedSalem104/top-gym-website/issues/1)   | Repository and all supplied assets audited; missing originals explicitly inventoried                                            |
| 1 — Foundation/docs         | [#2](https://github.com/AhmedSalem104/top-gym-website/issues/2)   | Astro, typed data, localizations, tooling and project memory implemented                                                        |
| 2 — Design/responsive       | [#3](https://github.com/AhmedSalem104/top-gym-website/issues/3)   | Gold design, real logo and five-width bilingual screenshots implemented/reviewed                                                |
| 3 — Core page               | [#4](https://github.com/AhmedSalem104/top-gym-website/issues/4)   | Shared landing sections implemented; five certificate cards and their lightbox are visible                                      |
| 4 — Real content            | [#5](https://github.com/AhmedSalem104/top-gym-website/issues/5)   | Photos/logo/prices integrated; redacted certificates added; original comparison/role, hero rights and current facts remain open |
| 5 — Interactions/prices     | [#6](https://github.com/AhmedSalem104/top-gym-website/issues/6)   | Six durations, contact links, menu/dialog and Cairo status tested                                                               |
| 6 — Languages/accessibility | [#7](https://github.com/AhmedSalem104/top-gym-website/issues/7)   | Both locales, RTL/LTR, keyboard behavior and axe checks implemented                                                             |
| 7 — SEO/performance         | [#8](https://github.com/AhmedSalem104/top-gym-website/issues/8)   | Production domain supplied; deployed canonical configuration and indexing remain open                                           |
| 8 — QA/visual               | [#9](https://github.com/AhmedSalem104/top-gym-website/issues/9)   | Local automated/visual evidence collected; remote GitHub Actions passed                                                         |
| 9 — Release preparation     | [#10](https://github.com/AhmedSalem104/top-gym-website/issues/10) | Owner approved PR #11 merge and Vercel publication; public 404 resolved; business follow-ups remain open                        |

## Next owner inputs

1. Provide original certificate/gym photograph paths (enhanced images are available).
2. Confirm trainer holder/current role and whether he is contact Ahmed. Review the published copies with baked-in registration-number redactions; confirm the original-document comparison and hero reuse rights before launch.
3. Confirm current hours and supply a written address when known. The production domain is `https://top-gym-website.vercel.app`.
4. Check Facebook, Maps and the WhatsApp invitation on an owner's device; the real Maps pin/embed is now verified; Facebook/group availability still needs an owner-device check.
5. Complete production SEO and indexing review after the remaining business confirmations. [PR #11](https://github.com/AhmedSalem104/top-gym-website/pull/11) was merged and published with explicit owner approval.

## Release gate

Do not close real-content follow-ups as complete while certificates and business confirmation remain unresolved. Main now contains the published implementation and remains protected by required PR/check/conversation rules, including administrators, with force pushes and deletion disabled.

Latest implementation follow-up: membership tabs/PDF, active spotlight, verified map, calm motion and premium footer are complete with 18 unit / 55 browser tests passing locally and in CI. Vercel production is live. See `VERCEL_DIAGNOSIS.md` for the public verification record, including the isolated focus-style test failure and passing repetitions.
