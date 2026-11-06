# Implementation progress — 2026-11-05

## Cinematic living Hero — 2026-11-06

Implemented the latest scoped Hero motion brief on `feat/cinematic-hero`, isolated from the in-progress customer-feedback worktree. The approved image/embedded emblem and text remain intact. A dedicated camera wrapper owns a 30-second CSS path; a separate low-opacity gold layer owns a 22-second cycle. Desktop/tablet/mobile amplitudes are centralized. The existing observer and lifecycle handle offscreen/hidden pauses; a localized keyboard toggle freezes/resumes the current frame, and reduced motion disables continuous effects.

Final local validation passed TypeScript, lint, formatting, build, SEO, 19 unit tests and all 103 browser tests without retries. A real 63-second/two-loop observation found no uncovered edges or transparent frames. Twelve before/after captures, a short actual recording, a steady-state trace and paired throttled lab metrics are retained. The paired measurement found unchanged existing CLS and mixed LCP results; no unsupported performance guarantee is made. The initial run exposed a navbar test's live-selector focus race, corrected without changing navigation behavior and documented in QA. See `CINEMATIC_HERO.md`, `MOTION_COVERAGE_MATRIX.md` and the latest QA entry. The latest explicit instruction requires a reviewable PR, with no merge or production deployment.

## Full-width Hero — 2026-11-06

Replaced the boxed split Hero with one edge-to-edge responsive background and a reading-edge content overlay. The owner explicitly supplied `Luxury Gym with Golden Top Gym Emblem.png`; ten AVIF/WebP derivatives preserve the original and use a separate documented mobile crop. The short supplied personal-training/membership invitation replaces the long service list in Arabic and English. Existing business configuration, original logo, all CTA targets, navbar, footer, pricing, gallery and certificate behavior remain intact.

Reused shared first-paint motion with no additional script, observer or dependency. Twenty focused Hero/navigation browser cases passed across 320–1920px, including axe, reduced motion, first-screen CTA visibility and header-boundary behavior. Twenty-eight actual before/after screenshots and throttled performance evidence are in `docs/evidence/hero-fullbleed-*`; see `HERO_REDESIGN.md`, `CONTENT_INVENTORY.md` and the latest `QA_CHECKLIST.md` entry for provenance, composition and measured limitations.

Local TypeScript, lint, formatting, 18 unit tests, build and SEO validation passed. The full browser run passed 87/89 cases; two stale expectations for the previous Hero filename were updated and both affected cases passed on rerun. No application regression was found. Work is on `feat/full-width-hero`; required remote checks and actual protected-PR/Vercel publication results are recorded in the release PR. The owner's standing push/merge/deploy authorization applies.

## Premium certificate showcase — 2026-11-06

Implemented the requested scoped redesign on `feat/premium-certificates`: centered bilingual introduction and documented name, larger document-first cards, three-plus-two centered desktop grid, two-column tablet and intrinsic-ratio single-column mobile. Original titles, issuers, training periods and privacy redactions remain intact. Ten resize-only responsive derivatives supplement the unchanged full-size and 680px files.

Cards use the existing motion architecture with smooth 280ms lift, gold border/static-glow fade, protected 1.025 image emphasis, and keyboard/touch-visible actions. The existing native lightbox adds certificate-only natural-size zoom, native pan, fit and safe focus return; normal photo-gallery behavior remains covered. No animation dependency or observer was added.

Full local validation passed: 56-file typecheck with zero diagnostics, lint, formatting, 18 unit tests, production build, SEO fixture and 89 Chromium tests without retries. Twenty before/after captures cover Arabic/English at 320/390/768/1440/1920px. Details, source limitations, motion coverage and actual measurements are in `CREDENTIALS_PRESENTATION.md`, `MOTION_COVERAGE_MATRIX.md` and the latest `QA_CHECKLIST.md` entry.

The new reference image was not supplied or found; its file path was requested and comparison remains pending. This work follows the explicit written brief. The owner subsequently authorized merging/publishing [PR #16](https://github.com/AhmedSalem104/top-gym-website/pull/16), and gave standing publishing permission after future verified changes. The final follow-up removes the flexed-arm emoji from the Hero label and its unused size rule while preserving TOP GYM's enlarged gold text. Release validation and the actual deployment/live-check outcome are recorded in the PR; no successful deployment is inferred merely from authorization.

## Hero brand legibility — 2026-11-06

Increased the existing TOP GYM label from 12px to 20–26px and the decorative flexed-arm emoji to 24–28px, retaining gold, Chivo, the original reading order and shared motion. Removed the old mobile/RTL size overrides. Typecheck (55 files, zero diagnostics), lint, formatting and production build passed; all 20 existing Hero/navigation browser checks passed without retries across both locales and 320–1920px. Four actual screenshots are retained as `evidence/hero-brand-after-{ar,en}-{390,1440}.webp`; Arabic mobile/desktop were visually compared with the prior `hero-copy-after-*` captures. No new performance measurement is claimed.

## Hero copy and certificate presentation — 2026-11-06

- Removed the requested visible promotional-photo caption and About paragraph in both languages. Accurate photo alternative text and source/license provenance remain.
- Replaced the Hero wording with the owner's TOP GYM / nine years of experience and trust, four service statements and closing invitation. Arabic wording is preserved with an English translation; central `business.hero` holds the supplied facts. The existing photograph, three actions, first-paint motion, navbar and pricing remain intact.
- Integrated the credentials introduction with the five document cards in a three/two/one-column gallery. Clear titles, complete uncropped previews, training dates and enlargement controls preserve every original published document, redaction, issuer and the supplied holder name.
- Full local `npm run test:all` passed after the final Hero update: typecheck (55 files, zero diagnostics), lint, formatting, 18 unit tests, production build, isolated SEO fixture and **81 Chromium tests with no retries**. Six new certificate scenarios cover every document, keyboard opening/Escape/focus return, loaded images and accessibility in Arabic/English at 390/768/1440px. The 14 existing Hero layout/action scenarios also check the new services across 320–1920px.
- Captured 24 actual before/after screenshots for Hero copy and credentials at 390/768/1440px in both locales. Representative mobile/tablet/desktop results were visually inspected. No new Lighthouse or frame-rate measurement is claimed; earlier performance evidence remains historical.
- The owner explicitly requested finishing and publishing these changes. [PR #14](https://github.com/AhmedSalem104/top-gym-website/pull/14) merged at `082fa568b0e59e0d0f0e51888f088090ec5ba0fd` after both required quality runs passed. Vercel production completed and 15 live Chromium checks passed without retries; release evidence is recorded in the PR.

## Hero and navigation follow-ups

Completed the asymmetric Hero with a new licensed spacious-gym photograph by Risen Wang, two-line bilingual headline, membership/Maps/gallery actions and responsive AVIF/WebP media. Shared motion remains visible at first paint. Added Home / الرئيسية and shortened half-month/two-month labels without changing prices or the official PDF. After the entire Hero leaves the viewport, the existing sticky header changes to #FFAD26 with black links and adapted active/focus indicators; returning restores the original palette.

Actual browser testing corrected fast-jump boundary detection, premature Home selection release and the language switch label/name mismatch. The shared observer watches the whole Hero; no new observer, scroll listener, animation package or hydration was added. Other page sections are unchanged.

Complete local test:all passed: 18 unit / 75 Chromium tests plus build, typecheck, lint, formatting and SEO fixture. Forty before/after/viewport screenshots and throttled motion measurements are in evidence. CLS was zero in both lab runs; Arabic throttled LCP was 4.172s and full-page scrolling still included long tasks. See QA_CHECKLIST.md for exact results/limitations and HERO_REDESIGN.md for composition/provenance.

The preceding title/contact PR #12 is merged and verified on production. The owner subsequently authorized publication on 6 November: PR #13 merged at ddd9bc871d83440d8bb15902a16f2531acac2a1b, Vercel production became Ready, and 13 live Chromium checks passed. Current hours and certificate-source/holder-role confirmation remain unresolved as previously recorded.

## Current state

The website is live at https://top-gym-website.vercel.app following the owner's explicit approval and PR #11 merge into main. It uses Astro 7.3.8, TypeScript 6.0.3, Tailwind 4.3.4, local Fontsource typography, and small browser scripts. Node 24.22.2 was used for application validation. Earlier entries below retain their historical review-stage state; the latest production record is in `VERCEL_DIAGNOSIS.md`.

## Latest release and browser-title follow-up

- Explicit owner authorization received; PR #11 merged at `4a762f148701676d9589ac4f367178f4a55f451e`. Vercel production and main Quality checks succeeded. The public home page, both locales, logo and official PDF return HTTP 200; the empty-main 404 is resolved.
- Public Chromium validation: 54/55 passed on the first complete run, followed by three passing isolated repetitions of the English navbar focus assertion that failed. No application change was made between those runs. See `VERCEL_DIAGNOSIS.md` for the exact limitation.
- Owner requested the same browser-tab title in every language. Both the shared page layout and custom 404 now use central `business.name` (`TOP GYM`); localized descriptions and social-sharing titles remain intact. The existing language-switching test checks the title before/after switching and after root-route preference navigation.
- Owner requested the contact-name prefix: display `C. Ahmed` / `C. Karim` in English and `كابتن أحمد` / `كابتن كريم` in Arabic through central business configuration. Phone numbers and documentary certificate-holder names remain unchanged.
- Production indexing/canonical configuration and the outstanding business-content confirmations remain follow-ups; release approval does not verify those facts.

## Completed with evidence

| Feature                                                | Evidence                                                                                                              |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Source audit, originals preserved                      | `source-provenance.json`, 32-file `asset-manifest.json`, source/duplicate review                                      |
| Gold design with original logo and five real photos    | `DESIGN_SYSTEM.md`, `CONTENT_INVENTORY.md`, responsive screenshots                                                    |
| Shared Arabic RTL / English LTR                        | Static routes and Playwright language/direction/preference checks                                                     |
| Two memberships, six durations, twelve accurate prices | Visual PDF comparison; unit fixture; browser selector/comparison tests                                                |
| Real contact/location/group links                      | Configuration fixture and browser href checks; external destination access remains unverified                         |
| Gallery/menu/keyboard dialog                           | Playwright open/close/arrows/focus-cycle/focus-return/menu tests                                                      |
| Cairo hours and current-day state                      | 12 unit boundary/DST cases; browser current-day status check                                                          |
| Accessibility and responsive layout                    | Chromium at 320/390/768/1440/1920 for both locales; axe mobile scans; reduced-motion check                            |
| SEO preparation                                        | Localized metadata, conditional canonical/hreflang/social, schema, robots, sitemap; default noindex browser assertion |
| Quality infrastructure                                 | TypeScript, ESLint, Prettier, Vitest, Playwright, GitHub Actions and templates                                        |
| GitHub organization                                    | Project 2, ten issues and ten milestones verified through GitHub API                                                  |

## Validation record

- Unit tests: **18 passed**.
- Browser tests: **32 passed**, including ten viewport/language combinations and two axe scans with zero violations in the configured WCAG rules.
- Production build: passed, four HTML pages plus robots/sitemap.
- `npm run test:all`: passed end-to-end locally (typecheck, lint, format, 18 unit tests, production build, isolated production-metadata checks, 32 browser tests). Typecheck: zero errors, warnings or hints.
- Production metadata was validated against a reserved `.invalid` test origin in ignored `.local/seo-fixture/`; the actual `dist/` review output remains domain-free and noindex. Real-domain acceptance is still a release gate.
- Remote CI status is recorded in the final Git handoff entry below.
- `npm audit`: zero reported vulnerabilities after the scoped minimatch patch override; no forced upgrades.
- Initial QA found 320px contact-card overflow and lightbox focus cycling. Both were corrected; the complete browser suite then passed.
- Initial font loading caused CLS. Preloading the actual local fonts removed the measured shift; final performance numbers are in `evidence/lighthouse-summary.json`.

## Review artifacts

- [Arabic desktop](evidence/ar-1440.webp), [English desktop](evidence/en-1440.webp).
- [Arabic tablet](evidence/ar-768.webp), [English tablet](evidence/en-768.webp).
- [Arabic mobile](evidence/ar-390.webp), [English mobile](evidence/en-390.webp).
- All five-width PNG screenshots are generated by Playwright in ignored test output and uploaded as CI artifacts. Curated WebP copies above are committed.

## Remaining gates

Five reviewed enhanced certificates are now displayed at the owner’s request with registration-number redactions in every derivative. Original comparison and trainer role confirmation remain outstanding. The replacement Pinterest hero is promotional and labeled; reuse rights require confirmation before production launch. Hours remain explicitly provisional. No owner-approved written address/domain has been supplied. The supplied Maps listing and embed were verified during the later location follow-up below. Phone-link correctness does not prove call reachability. Social/Maps/group destinations need an owner/device check.

The review is available in [draft PR #11](https://github.com/AhmedSalem104/top-gym-website/pull/11). See `ROADMAP.md` for actionable owner inputs and open issue links. Implementation merging and production deployment still require explicit authorization.

## Verified GitHub handoff

- Implementation commit: `0f3e0ca`; source/evidence documentation commit: `450b8855bb1fc75a906d106f963378ff333c6035`.
- Both commits were pushed to `origin/feat/top-gym-website`; the working tree was clean after the push.
- [GitHub Actions run 42043311915](https://github.com/AhmedSalem104/top-gym-website/actions/runs/42043311915) completed successfully on that exact documentation commit, including dependency installation, all static checks, unit tests, production build, isolated SEO validation, Chromium tests and uploaded QA artifacts.
- The repository was initially empty. An empty `main` baseline (`3bc80acb7e91890edfc0e147d70a9c6e4c6aed96`, no files) was created for the authorized PR workflow. It was connected into the feature branch by merge commit `c95506fb5aadf17236320091d6097a41107d1a71`; the feature tree was verified unchanged and every existing implementation commit was preserved. No website code was merged into main.
- `main` is now the default branch. Its verified protection requires a PR, successful `quality` check, an up-to-date branch and resolved conversations; it includes administrators and forbids force pushes and deletion. Required approval count is zero so the sole owner is not locked out; the explicit owner authorization requirement still governs implementation merge.
- [Draft PR #11](https://github.com/AhmedSalem104/top-gym-website/pull/11) contains the complete implementation against the empty main baseline. It remains a draft while business release gates are unresolved.
- Seven implementation phases are complete. Content verification (#5), production-domain SEO (#8), and release approval (#10) remain open in the linked GitHub Project.
- No production deployment or main merge was performed. This is a verified review build with the remaining business release gates stated above.

## Owner-requested content follow-up — 2026-11-05

- Enabled five distinct supplied certificate copies with bilingual titles, exact training periods and keyboard-accessible enlargement. Reviewed all five full-size derivatives after baking opaque registration-number redactions into the image pixels. Unredacted sources, overlapping identity cards and duplicate variants remain private.
- Replaced the hero with the requested Pinterest male-athlete photograph, labeled promotional. Real facility/gallery photos remain separate. Source hash/URL and unconfirmed reuse-rights status are recorded in `promotional-media.json`.
- Added a visible WhatsApp-group QR with a same-device join button. The PNG is generated locally from central business configuration at build time. Browser tests decode it and compare the exact invitation URL in both languages.
- Browser coverage increased to 21 passing tests. A first assertion expected a relative dialog URL although the DOM correctly resolves it to an absolute URL; the assertion was corrected and both language cases then passed. Isolated production preview testing uses `PLAYWRIGHT_PORT` so the owner's development preview stays running.
- Updated desktop/mobile hero, certificate and QR screenshots are in `docs/evidence/`. Section-only captures hide fixed navigation overlays to show the complete section; normal viewport captures retain navigation.
- Original-document comparison, current trainer role, current hours, external destination validity, production domain and promotional image reuse rights remain release checks. No generated certificate, main merge or production deployment was performed.

## Site-wide motion and source-navbar follow-up — 2026-11-05

- Audited the actual Astro tree, native interactions, CSS and primary Gold Desktop 2 export. Added a central native motion system with one reveal/header observer, one dynamic-content observer, bounded 80 ms staggers, explicit variants, cleanup and progressive fallback. No animation dependencies or scroll loops were added.
- Applied motion to every major section, heading hierarchy, image/card grid, hours rows, final CTA and footer. Kept LCP heading/image fully painted and contact/price updates immediate. Preserved original section order, targets, supplied business data and media during this motion change.
- Corrected the separately requested navbar against the source: dark contact action, gold group CTA, segmented languages and single-column mobile disclosure. Preserved the real logo and omitted the unverified men-only business tagline.
- Added interruptible menu/dialog transitions, focus-safe keyboard behavior, hover/press feedback and live reduced-motion cancellation. Full QA caught a stylesheet-order conflict in reduced-motion scrolling; the explicit reduced-motion override fixed it. A regression assertion also verifies the menu entrance survives initial focus placement.
- Final local validation: 18 unit and 32 Chromium tests; typecheck/lint/format/build/isolated SEO checks. Six motion coverage cases traverse every marked element in Arabic/English at 390/768/1440; existing five-width and axe tests remain in the suite.
- Architecture, reusable examples and coverage live in `MOTION_SYSTEM.md` and `MOTION_COVERAGE_MATRIX.md`. Recordings, before/after screenshots, frame sequences, 6× CPU scroll measurements and both Lighthouse runs are retained in `docs/evidence/`. See `QA_CHECKLIST.md` for numerical results and the unresolved Arabic startup timing variation.
- Physical mobile devices/Safari/screen readers and original business release gates remain outside this local Chromium review. No main merge or production deployment was performed.

The implementation was pushed as `7679d03ce31573d9143e1248f0062cd8c3559cb7`. [Push CI](https://github.com/AhmedSalem104/top-gym-website/actions/runs/42070998288) passed all 32 browser tests directly; the parallel [PR run](https://github.com/AhmedSalem104/top-gym-website/actions/runs/42071008646) retried one Arabic contrast scan captured during an opacity entrance. The follow-up test correction measures contrast at rest with reduced-motion emulation, retaining every axe rule and separate normal-motion interaction/coverage tests. This avoids treating a transient animation frame as the final palette. Both locale scans then passed five consecutive local repetitions each (10 tests, retries disabled), with lint and formatting checks passing. The production application and measured performance were unchanged by this test-only correction.

## Membership, location and active spotlight follow-up — 2026-11-05

- Changed the visible Arabic language option to AR while retaining its accessible Arabic name. Replaced the dropdown with six responsive duration tabs, RTL-aware arrow keys, Home/End, one active tab and immediate updates of both existing prices. The full table remains usable without JavaScript.
- Published the explicitly requested official pricing PDF byte-for-byte (453,139 bytes, SHA-256 recorded in central configuration/provenance), with two WebP previews, a view link and a real download action. Visually rechecked all twelve prices against the original. Only this specific PDF is exempted from the private-source policy.
- Added a single desktop overhead gold spotlight to the existing nav: 28 × 2 px line, subtle gradient beam, 280 ms transform/opacity transitions and lighter inactive hover preview. Mobile/tablet disclosure retains a clean gold underline. One dedicated section observer shares state across both menus; 110 ms stability and clicked-anchor holding prevent boundary flicker and intermediate selection during smooth scroll.
- Resolved the supplied Maps short URL to the exact Top Gym listing and visually verified its pin in Arabic/English embeds. Replaced the location photo/card with the requested full-width map, clickable anywhere to open the unchanged original URL. Its native link also works by keyboard and if the map provider fails. No business coordinates or written address were invented.
- `npm run test:all` passed: zero typecheck diagnostics, lint, formatting, 18 unit tests, production build, isolated SEO fixture and all 45 Chromium tests (no retries). Coverage includes both languages at 320/390/768/1440/1920, all eight nav anchors, up/down scrolling, boundary jitter, deep links, resize, keyboard, reduced motion, observer failure, accurate prices and byte-identical downloads. Axe scans have zero configured-rule violations.
- Test development exposed two measurement issues: hidden mobile pseudo-elements have no rendered transform, and Playwright's automatic sticky-control scrolling can move the document before its simulated click. Visual assertions now target the visible nav; a pointer click at the visible trigger verifies that actual opening preserves scroll. Keyboard focus is tested using actual Tab/Shift+Tab input. No production workaround for a test-only scroll artifact was introduced.
- Curated production screenshots: `memberships-{ar,en}-{390,768,1440}.webp`, `navigation-{ar,en}-{390,768,1440}.webp`, `map-{ar,en}-{390,768,1440}.webp`, and `spotlight-{ar,en}.webp` in `docs/evidence/`. Section-only captures hide sticky navigation/contact overlays to show the entire section; viewport/nav captures retain them. Google map tiles and the Top Gym pin were visibly reviewed; these are not mocked map screenshots.
- Current lab results and limitations are recorded below and in `QA_CHECKLIST.md`. This remains a review branch: no main merge or production deployment.

## Calm motion, premium footer and Vercel investigation — 2026-11-05

- Implemented the requested pre-footer journey CTA, membership/call/directions buttons and four logical footer groups. The original logo, seven section links, international phone numbers, clearly labeled WhatsApp group, Facebook, configured hours/location and native Back to Top are preserved and functional. Layout is four columns at desktop, two on tablet and one on mobile with compact quick links.
- Fixed visible opacity resets, first-position spotlight travel, competing hover/reveal transforms and discontinuous menu reversals. Hero motion starts in CSS from first paint while remaining opaque; edge-triggered reveals skip already-painted content. Timings are 540–580ms entrances, 80ms stagger capped at 240ms, 200ms micro feedback and 340ms spotlight. No dependency was added.
- Full `npm run test:all` passed: TypeScript (52 files, zero errors/warnings/hints), ESLint, Prettier, 18 unit tests, production build, isolated production-metadata fixture and **55 Chromium browser tests, with no retries**. The new tests include actual near-edge activation, fast-anchor/no-flash fallback, initial spotlight alignment, menu interruption continuity and six footer layout/link/keyboard/axe checks. Existing prices, PDF hash/download, certificates, QR, map, no-JS and reduced-motion tests remain passing. Production dependency audit: zero reported vulnerabilities.
- Before/after motion audit: 80–81 starts from zero opacity on already-visible elements before; **zero afterward in all six Arabic/English × 390/768/1440 scenarios**. This checks a concrete source of flashing, not all possible frame drops. All applicable sections are covered in `MOTION_COVERAGE_MATRIX.md`.
- Footer and CTA before/after screenshots captured for both languages at 390/768/1440 and manually reviewed. Desktop motion recordings are retained for both languages. No layout overflow was detected across the broader 320–1920px browser suite. Captures exclude sticky chrome; the unfocused skip link was verified at top −100px in a real viewport before excluding its full-element screenshot artifact.
- Vercel public `/` and `/ar/` return 404. GitHub reports a successful deployment of the **empty main baseline**; website code is still on the feature branch. Feature previews are Ready but require Vercel authentication. Added explicit Astro/build/output settings in `vercel.json`. No main merge, production promotion or authentication/protection change was performed. Dashboard inspection was unavailable; details and exact release steps are in `VERCEL_DIAGNOSIS.md`.

Review: [Arabic footer desktop](evidence/footer-after-ar-1440.webp), [Arabic footer mobile](evidence/footer-after-ar-390.webp), [English footer tablet](evidence/footer-after-en-768.webp), [English CTA](evidence/footer-cta-after-en-1440.webp), [Arabic before recording](evidence/calm-before-ar-1440.webm), [Arabic after recording](evidence/calm-after-ar-1440.webm).
