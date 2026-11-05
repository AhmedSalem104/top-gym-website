# Delivery roadmap

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
| 7 — SEO/performance         | [#8](https://github.com/AhmedSalem104/top-gym-website/issues/8)   | SEO infrastructure and lab measurements implemented; confirmed production domain/indexing remains open                          |
| 8 — QA/visual               | [#9](https://github.com/AhmedSalem104/top-gym-website/issues/9)   | Local automated/visual evidence collected; remote GitHub Actions passed                                                         |
| 9 — Release preparation     | [#10](https://github.com/AhmedSalem104/top-gym-website/issues/10) | Draft PR #11 and protected empty main prepared; business gates and merge/deployment authorization remain open                   |

## Next owner inputs

1. Provide original certificate/gym photograph paths (enhanced images are available).
2. Confirm trainer holder/current role and whether he is contact Ahmed. Review the published copies with baked-in registration-number redactions; confirm the original-document comparison and hero reuse rights before launch.
3. Confirm current hours; supply a written address and production domain when known.
4. Check Facebook, Maps and the WhatsApp invitation on an owner's device; the real Maps pin/embed is now verified; Facebook/group availability still needs an owner-device check.
5. Review [draft PR #11](https://github.com/AhmedSalem104/top-gym-website/pull/11). Implementation merge and production deployment require separate explicit authorization after the business gates are resolved.

## Release gate

Do not close the real-content/release work as complete while certificates and business confirmation remain unresolved. Opening a PR or passing checks is not production acceptance. The empty default `main` branch is protected by required PR/check/conversation rules, including administrators, with force pushes and deletion disabled. Website code remains only on the feature branch.

Latest implementation follow-up: membership tabs/PDF, active spotlight, verified map, calm motion and premium footer are complete with 18 unit / 55 browser tests. Vercel release remains open; see `VERCEL_DIAGNOSIS.md` for the empty-main 404 and protected preview.
