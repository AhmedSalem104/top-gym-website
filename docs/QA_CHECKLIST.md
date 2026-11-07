# QA and release checklist

**Latest status — 7 November 2026:** production readiness and the bilingual entry UI have been verified; a live participant transaction was deliberately not created. See [CHALLENGE_LIVE_STATUS.md](CHALLENGE_LIVE_STATUS.md) for exact checks and limitations. Earlier closed-admission entries are historical.

## Ten-second timer and rapid logo entry — 7 November 2026

The owner requested ten seconds per question and reported that the logo entry did not work. See [implementation, migration, reproduction and release checks](CHALLENGE_TIMER_UPDATE.md). Earlier five-second records describe the previous release. The prior closed state was superseded; see [current production status](CHALLENGE_LIVE_STATUS.md).

## Logo password access — 7 November 2026

Verify five-click/keyboard/touch entry, a single password field, wrong-password errors, session authorization/logout, shared throttling, reduced motion and both languages. Preserve participant/coupon records during password rotation. See [administrator access](ADMIN_ACCESS.md) and the release PR for measured results.

## Challenge visibility correction — 7 November 2026

See [production visibility](CHALLENGE_VISIBILITY.md): enable the production build flag to expose the launcher and authenticated admin shell independently of backend admissions. Closed admissions display honest availability with real membership/contact actions. Existing backend/TLS/SMTP are installed; draft questions and unapproved coupon terms remain excluded. Earlier disabled-UI/no-backend entries below describe previous releases.

## Backend activation preparation — 7 November 2026

Actual Linux, TLS, signed API, real owner MFA, SMTP/inbox and restore results: [CHALLENGE_ACTIVATION.md](CHALLENGE_ACTIVATION.md). The closed-startup tests require an absent bank plus explicit admissions-off; corrupt/unreviewed supplied content and enabled-without-bank still fail. Public live participation is outstanding, not a passing test. No existing frontend layout changed.

## Direct-entry update — 7 November 2026

The owner requested a stronger animated invitation, compact membership-discount dialog, name-only personal details after the quiz, removal of participant OTP, and production publication. See [CHALLENGE_SIMPLE_ENTRY.md](CHALLENGE_SIMPLE_ENTRY.md) for the current contract and residual risks. One attempt is tied to an **entered, unverified** canonical number; recovery requires the original secret session, never the phone alone. Admin MFA is unchanged. OTP approval is no longer required. The later production and review checks are recorded in [CHALLENGE_LIVE_STATUS.md](CHALLENGE_LIVE_STATUS.md).

## Fitness challenge release gate

Use [CHALLENGE_QA.md](CHALLENGE_QA.md) for local evidence. Public CI uses synthetic questions, never the private answer bank. Before activation: qualified review of every real question; approved OTP/budget and successful staging verification; approved discount policy; isolated HTTPS/BFF; real authorized inbox/Gmail rendering; Linux container/backup/restore/load tests; retention and five-second accessibility decision; separate Gate 2 and Gate 3 approvals. Existing website checks must continue to pass. Local results are not deployment evidence.

## Feedback activation — 6 November 2026

- Production configuration is complete and redeployed. Public readiness returns HTTP 200 with available:true.
- Live Gmail TLS authentication and Redis atomic limit/claim/deduplication/completion checks pass; exact temporary test keys were removed.
- Six unmocked production browser cases pass: Arabic/English at 390/768/1440px, enabled submission, expected direction, no horizontal overflow, no page errors and preserved reduced motion.
- One labeled test sent through the real Arabic mobile form returned HTTP 200 accepted and a focused localized success state. Same-key replay returned stored acceptance. A read-only exact Message-ID search found exactly one copy in Gmail INBOX; unrelated messages were not fetched or marked read.
- This resolves the earlier configuration and real-delivery gates below. Gmail visual rendering, physical-device checks and unrelated business-source follow-ups remain separate. Evidence: [activation record](evidence/feedback-activation.json), [Arabic mobile](evidence/feedback-live-ar-390.png), [English desktop](evidence/feedback-live-en-1440.png).
- Subsequent desktop feedback-link request: 12 local Arabic/English checks at 320/390/768/1360/1440/1920px passed keyboard anchor navigation, shared active state and overflow/overlap checks. Desktop navigation retains its 80px header and existing spotlight; mobile behavior is preserved.
- The 27 existing feedback, membership/navigation and spotlight browser cases all pass without retries, including every desktop anchor and reduced motion. Typecheck (74 files, zero diagnostics), lint, formatting and build pass. [Arabic Navbar](evidence/feedback-navbar-ar.png), [English Navbar](evidence/feedback-navbar-en.png), [twelve-width/locale checks](evidence/feedback-navbar-verification.json).

## Feedback and stronger Hero — 6 November 2026

- 54 unit tests pass, including real schema validation, mocked SMTP options/acceptance/rejection/deadline, safe template output, idempotent concurrency and storage failures. Typecheck reports 74 files and zero errors/warnings/hints; lint/build/SEO fixture checks pass.
- Browser coverage adds native stars/topics, optional details, keyboard, honest server-confirmed success, unavailable configuration, uncertain outcomes and retry identity. AR/EN form layouts are checked at 320/390/768/1440 with zero axe violations in the configured scans. The whole site's existing 320–1920px coverage remains.
- Initial full browser run: 112 passed, three stale test assumptions failed. Pricing selectors now target their own disclosure; the no-fake-form assertion excludes the intentional feedback form and verifies its API action. Corrected cases passed. Final protected CI provides the complete release run.
- Curated before/after form/Hero screenshots and sample email previews are in evidence/feedback-*.webp. Section screenshots hide fixed chrome; complete browser tests retain it. Form preview GET was mocked available solely for UI screenshots; no email was sent. Email previews are Chromium rendering, not Gmail.
- Two-cycle pose inspection confirms no uncovered image edges and identical loop endpoints. Fourteen cinematic cases preserve real CSS progress, stationary text/CTA geometry, observer/visibility/bfcache/resize and OS reduced-motion behavior after removing the control.

| Locale / width / CPU | Before local LCP | After local LCP | Before / after CLS | After rAF p95 |
| -------------------- | ---------------: | --------------: | -----------------: | ------------: |
| Arabic / 390 / 6×    |            728ms |           684ms |              0 / 0 |        16.7ms |
| Arabic / 1440 / 1×   |            296ms |           192ms |              0 / 0 |        16.8ms |
| English / 390 / 6×   |            428ms |           416ms |              0 / 0 |        16.8ms |
| English / 1440 / 1×  |            160ms |           188ms |              0 / 0 |        16.7ms |

These are single local Chromium observations without network throttling, not Lighthouse scores or field Web Vitals. The 12-second steady-state windows after fonts/entrance settle have zero CLS, no intervals over 34ms, moving camera transforms and stable heading geometry. rAF cadence does not measure GPU frame throughput; startup long tasks remain in the raw record. Some static checks ran during the end of collection, so this is not an isolated performance benchmark. No INP or universal 60fps claim is made. [Raw observations](evidence/feedback-hero-performance.json), [14-second recording](evidence/feedback-hero-motion.webm).

- Actual Vercel preview function returns HTTP 200 unavailable readiness after fixing .ts import emission; production credentials are never used by CI.
- Outstanding integration gates: owner-provided Gmail sender/recipient addresses, Upstash terms/configuration, real SMTP acceptance and inbox receipt, actual Gmail light/dark rendering. No successful email delivery is claimed.
- Accessibility limitation: the owner explicitly removed the visible pause control. OS reduced motion disables continuous effects; full WCAG 2.2.2 compliance is not claimed. Physical devices/Safari/screen readers remain outside this Chromium lab run.

## Cinematic Hero — 6 November 2026

- Final `npm run test:all` passed: TypeScript (58 files, zero errors/warnings/hints), ESLint, formatting, **19 unit tests**, production build, isolated SEO fixture checks and **all 103 Chromium cases without retries** (3.1 minutes). The 14 new camera/lifecycle cases and 20 existing Hero/navigation cases cover Arabic/English widths 320/375/390/768/1440/1920, keyboard pause/resume without reset, stable text/CTA geometry, offscreen pause, simulated hidden-document/bfcache events, resize, observer failure, reduced motion, loop endpoints, exact CTA targets and existing axe scans. The rest of the full suite checks the unchanged site sections and interactions.
- Actual 63-second desktop observation covered two 30-second loops and 3,719 samples: **zero uncovered image edges**, **zero transparent-image samples**, maximum sampled translation step **0.0564px**. Both loop boundaries returned to scale 1.025 and equivalent translations. See `evidence/cinematic-real-loops.json`. This is a real-time sampled observation, separate from automated timeline seeking.
- Twelve actual before/after screenshots cover both locales at 390/768/1440px, with normal motion and the visible pause control. Representative mobile/tablet/desktop images were inspected. `evidence/cinematic-hero-desktop.webm` records approximately 13 seconds of actual initial load and continuous motion; no video ships as website content.
- Paired cold local lab, Chromium 156, 390×844, 6× CPU, 1.6Mbps/150ms; one run per locale/variant. LCP before→after: Arabic **4,744→4,120ms**, English **2,340→2,664ms**. CLS is identical before/after: Arabic **0.00568**, English **0.17691**. These initial-load layout shifts already occur in the baseline; the English score remains a follow-up. Neither universal zero CLS nor a statistically established LCP improvement is claimed.
- Three-second settled-Hero rAF samples: median **16.7ms** in all runs; p95 before/after **16.7/16.7ms** Arabic and **16.7/16.8ms** English; **zero intervals over 34ms**. Pause-button Event Timing entries measured **72ms** Arabic / **88ms** English under 6× CPU; these are individual lab interactions, **not field INP**. See `evidence/cinematic-performance.json`.
- An eight-second desktop Chromium trace of the settled running Hero recorded **zero Layout/Paint/UpdateLayoutTree events** and **no RunTask events over 50ms**. The compressed trace and summary are `evidence/cinematic-trace.json.gz` and `evidence/cinematic-trace-summary.json`. These event counts describe this steady-state sample, not physical GPU frame delivery or field Core Web Vitals.
- The initial full run passed 101/103 cases; two existing navigation focus assertions followed a live `aria-current` selector after native focus scrolling had changed the active section. The failure screenshot shows keyboard focus correctly on Facilities while ScrollSpy correctly identifies the now-visible About section. Both isolated baseline and changed-build reruns passed. The test now retains the actual focused link for its Tab/Shift+Tab and outline assertions; all section-tracking assertions remain. No navbar code changed. The obsolete, now-zero-duration picture entrance CSS was also removed so the camera wrapper is the only image transform owner.
- Physical low-end devices, real tab switching across browser/OS combinations and Safari rendering remain unverified. No pointer parallax is implemented; it is optional in the brief. No source image, original logo, business data or unrelated application flow changed. The feedback branch remains separate and its SMTP integration is not claimed as complete.

This change requires review before merge/production under the owner's latest explicit instruction. Remote checks and the review URL are recorded in the pull request; no production release is implied by a successful local build.

## Full-width Hero — 6 November 2026

- All 20 focused Hero/navigation Chromium cases passed without retries. Arabic/English composition and actions were checked at 320/375/390/768/1366/1440/1920px, including 320×740 and 390×844 mobile viewports. The Hero image covers every section edge; headings fit, the primary CTA is above the fold, exact Maps/anchor links work, reduced motion disables Hero animations and axe reports no Hero violations. Header inversion/Home behavior passes in both languages at 390/768/1440px.
- Captured 28 actual before/after screenshots at the seven widths in both locales: `evidence/hero-fullbleed-{before,after}-{ar,en}-{width}.webp`. Captures show the section with fixed chrome hidden only for capture. Representative Arabic/English mobile, tablet and desktop images were visually inspected for crop, typography, contrast and reading-edge alignment. The image is no longer boxed; mobile Hero height is approximately 520px Arabic / 618px English at 390px width, versus 936px / 1058px before (900px-tall capture viewport).
- The first test draft compared section width with `clientWidth`, which includes Chromium's reserved scrollbar gutter. Measuring against the actual root layout rectangle correctly checks both page edges without changing application layout or removing the existing gutter.
- `evidence/hero-fullbleed-performance.json`: Chromium 156, 390×844 DPR1, 6× CPU slowdown, 1.6Mbps down/750Kbps up/150ms latency, one run per language. Arabic/English LCP **3,136 / 2,088ms**, CLS **0 / 0**, median sampled frame interval **16.7 / 16.7ms**, p95 **33.4 / 33.4ms**. Slow-down/fast-up/fast-down full-page traversal produced **19 / 24** intervals over 34ms and **10 / 17** long tasks. No console errors, broken images, unrevealed elements or continuing animations remained after settling.
- These are local lab measurements, not Lighthouse scores, field Core Web Vitals or a physical-device FPS guarantee. Arabic throttled LCP remains above 2.5s and full-page long tasks remain a performance follow-up. No claim of universal 60fps or a statistically established improvement is made.
- The supplied PNG remains unchanged; its reviewed SHA-256 and ten optimized derivatives are recorded in `hero-fullbleed-media.json`. The largest AVIF is 103,580 bytes; mobile 704px AVIF is 44,291 bytes. No new JS, library, font, third-party request or observer was introduced.

Final local validation: TypeScript (57 files, zero errors/warnings/hints), ESLint, formatting, 18 unit tests, production build and the isolated SEO fixture passed. The complete browser run passed 87/89 cases; the other two still expected the previous Hero asset filename inside the certificate/QR scenario. Updating that exact source assertion to the approved new image made both affected cases pass on the focused rerun (2/2, no retries); application code did not change. Protected remote checks and the actual Vercel/live-browser outcome are recorded in the release PR. Existing business/source/indexing limitations remain unchanged.

## Premium certificate showcase — 6 November 2026

Publishing follow-up: the owner subsequently authorized merge/deployment and requested removing the Hero flexed-arm emoji. After that two-file presentation change, typecheck (56 files, zero diagnostics), lint, formatting, production build and all 20 existing Hero/navigation browser tests passed without retries. Six additional live-DOM checks on the local production preview confirmed no flexed-arm emoji, unchanged 20–26px TOP GYM text, no wrapping defect and no overflow in Arabic/English at 390/768/1440px. Required remote checks and actual post-deployment results are recorded in PR #16; the earlier review-only status below is historical.

- Full local `npm run test:all` passed: typecheck **56 files, zero errors/warnings/hints**, ESLint, Prettier, **18 unit tests**, production build, isolated SEO fixture and **89 Chromium tests without retries** (2.8 minutes). This includes all existing Hero, navbar, footer, membership, PDF, map, photo-gallery, language and motion regression checks.
- Fourteen focused certificate cases cover both languages at 320/390/768/1440/1920px, five unchanged titles/issuers/training periods, every document loading/opening, centered remainder rows, equal desktop/tablet card heights, no horizontal overflow, original-size zoom/fit, next/previous, keyboard panning, Escape and focus return. Section and modal axe scans report zero configured-rule violations. Touch actions stay visible and closing releases the body scroll lock.
- Eight rapid hover-in/out reversals per locale retain stable card layout offsets. Settled hover is 4px upward, gold border and 1.025 image scale with all document edges inside the padded frame; keyboard focus gets equivalent feedback. Live reduced-motion switching leaves zero card animations and removes movement. Existing full-motion checks verify actual viewport entry, no replay, dynamic content, observer failure and cleanup.
- Actual browser review caught an initially unscoped desktop remainder selector that created narrow mobile columns; its breakpoint scope was corrected. Axe also caught an old short `aria-label` overriding the newly expanded card content; the native visible-content accessible name now includes the complete label. Both fixes are covered by the passing cases above.
- Twenty before/after screenshots cover both locales and all five required widths. Representative Arabic desktop/mobile and English tablet/wide-desktop captures were visually inspected. Mobile frames follow intrinsic document ratios; larger layouts retain aligned contain-fit frames. Fixed chrome is hidden only in section captures; screenshot motion is settled separately from interaction testing.
- The five existing full-size redacted documents and 680px previews, all business configuration, logo and other sections are unchanged. Ten new responsive copies add 320px/960px variants, with source/derivative hashes recorded in `asset-manifest.json`. No document text, dates, signature, stamp or registration redaction was altered.
- The requested new visual-reference image remains unavailable; its path has been requested. This implementation follows the written brief, and reference-image matching is pending. Supplied enhanced sources were reviewed; archival originals, independent credential verification and physical mobile/Safari/screen-reader acceptance remain unavailable. No fresh Lighthouse score is claimed. This is a review branch, with no main merge or production deployment.

Visual comparison: [desktop before](evidence/credentials-premium-before-ar-1440.webp), [desktop after](evidence/credentials-premium-after-ar-1440.webp), [mobile before](evidence/credentials-premium-before-ar-390.webp), [mobile after](evidence/credentials-premium-after-ar-390.webp), [English tablet](evidence/credentials-premium-after-en-768.webp).

Normal-motion evidence: [hover state](evidence/credentials-premium-hover-ar.webp), [full-document viewer](evidence/credentials-premium-viewer-ar-1440.webp), [hover/zoom/navigation recording](evidence/credentials-premium-interactions-ar.webm). The viewer and hover captures were visually inspected; the automated reversal samples verify stable layout rather than relying on screenshots to prove motion.

Bounded local certificate-scroll lab: Chromium 156, 390×844 touch, 6× CPU slowdown, 1.6Mbps down / 750Kbps up / 150ms latency, cold context per language and no substituted resources. Both languages measured **CLS 0**, median rAF interval **16.7ms**, p95 **33.3ms**, no long tasks during the section traversal, no pending cards/broken images/overflow/page errors. Arabic recorded **3** intervals above 34ms; English recorded **0**. This is a narrow section sample, not whole-site field performance, GPU frame time or a physical-device 60fps guarantee. Earlier full-page map/startup costs remain applicable. Raw method/results: [credentials-premium-performance.json](evidence/credentials-premium-performance.json).

## Hero copy and credentials presentation — 6 November 2026

- Final `npm run test:all`: **18 unit / 81 Chromium tests passed, without retries**, plus typecheck (55 files, no errors/warnings/hints), ESLint, Prettier, production build and isolated SEO checks.
- Arabic/English Hero at 320/375/390/768/1366/1440/1920px: all four owner-supplied service statements appear; headline fits without image overlap or horizontal overflow; membership/gallery anchors and verified Maps link are preserved. The primary CTA remains above 750px in the test's 900px-high viewport.
- Arabic/English credentials at 390/768/1440px: correct 1/2/3-column layout, five loaded uncropped documents, unchanged titles/issuers/dates/URLs, every certificate opens with Enter, Escape closes it and focus returns. Axe checks report zero configured-rule violations. Reduced-motion, no-JavaScript, observer failure and full motion cleanup/regression checks pass.
- Certificate files, logo, gym photographs, membership PDF, prices, contact numbers, hours and destination links are unchanged. New marketing statements come from the owner's supplied text, not an inference from certificates. The supplied certificate-holder name is preserved.
- 24 real before/after screenshots: `evidence/credentials-{before,after}-{ar,en}-{390,768,1440}.webp` and `evidence/hero-copy-{before,after}-{ar,en}-{390,768,1440}.webp`. Fixed chrome is hidden only for section capture. Representative Arabic desktop/mobile and English tablet views were visually reviewed.
- Test-development correction: the native lightbox resolves its image URL to an absolute URL; the new assertion now compares with `new URL(source, page.url()).href`. No production image workaround was introduced.
- No fresh Lighthouse, CLS or frame-performance number is claimed for this content/layout revision. Physical-device/Safari/assistive-technology acceptance and the existing business-source/hour checks remain outstanding. Publication is owner-authorized; the PR release note will record actual GitHub/Vercel/live-check results.

Visual review: [Hero desktop](evidence/hero-copy-after-ar-1440.webp), [Hero mobile](evidence/hero-copy-after-ar-390.webp), [certificates desktop](evidence/credentials-after-ar-1440.webp), [certificates mobile](evidence/credentials-after-ar-390.webp), [English certificates](evidence/credentials-after-en-768.webp).

## Hero / Home / inverted navigation — 5 November 2026

- Full local Node 24 `npm run test:all` passed: typecheck (54 files, zero diagnostics), lint, formatting, 18 unit tests, production build, isolated SEO fixture and **75 Chromium browser tests** (2.2 minutes, no retries).
- Both languages: Hero checked at 320/375/390/768/1366/1440/1920px. No horizontal overflow, headline/image overlap or clipped heading; primary CTA stays within the initial 900px viewport. Membership, Maps and gallery actions passed.
- Header checked at 390/768/1440px, including touch emulation at 390px. Height stayed 77px mobile / 81px tablet and desktop. Boundary crossing, fast jumps, Home, every navigation link, keyboard focus, language switching and reduced motion passed. Axe scan of the visible gold header/menu: zero violations.
- Fixed findings: Home's anchor lock released while a sliver of Hero remained visible; a one-pixel boundary could miss fast jumps; language accessible names omitted visible AR/EN abbreviations. Browser harness now clicks sticky controls in-place and prevents programmatic focus-scroll competing with the anchor under test.
- Forty actual screenshots: `hero-authentic-{before,after}-{ar,en}-{320,375,390,768,1366,1440,1920}.webp` and `hero-navigation-{ar,en}-{390,768,1440}-{top,gold}.webp` in `evidence/`. Section captures hide fixed chrome; navigation captures retain it. Representative desktop, tablet and small-mobile results were visually inspected.
- Price fixture, PDF download/hash, contacts, dialogs, no-JavaScript content, observer failure and motion cleanup passed. Business configuration and official PDF bytes have no diff.

### Actual throttled local measurement

Production preview, Chromium 156, 390×844 DPR1 with touch, 6× CPU slowdown, 1.6Mbps download / 750Kbps upload / 150ms latency. One cold-context run per language; bounded slow/fast/down/up scrolling. Raw evidence: [hero-motion-performance.json](evidence/hero-motion-performance.json).

| Locale  |    LCP | CLS | Median / p95 rAF interval | Scroll long tasks |
| ------- | -----: | --: | ------------------------: | ----------------: |
| Arabic  | 4172ms |   0 |             16.7 / 49.9ms |                16 |
| English | 2320ms |   0 |             16.7 / 33.4ms |                12 |

Both runs: zero console errors, broken images, unrevealed items or animations left running after settling. Arabic throttled LCP exceeds the 2.5s goal; full-page scrolling still includes long tasks, whose attribution was not profiled in this scoped update. These are local lab samples, not real-user Core Web Vitals, GPU frame timings or a 60fps guarantee. No new Lighthouse score is claimed.

The separately approved title/contact production release was verified: root, Arabic, English, 404 document, logo and PDF returned 200; TOP GYM tab title and captain-prefixed names passed at 390/1440px in both languages, including language/hash preference behavior. The owner subsequently authorized publication on 6 November: PR #13 merged at ddd9bc871d83440d8bb15902a16f2531acac2a1b. Vercel production returned the new Hero, and 13 live Chromium checks passed.

## Verified in the local implementation

- [x] Gold design reviewed against the source desktop screenshot; source differences documented.
- [x] Original logo proportions/background preserved; no invented symbol.
- [x] All five gym photos inspected, including mirrors/posters; no prohibited female imagery observed.
- [x] All twelve prices visually verified from the supplied one-page PDF.
- [x] Arabic and English routes, RTL/LTR, translations and language persistence tested.
- [x] Membership selector updates both prices; complete table works without JavaScript.
- [x] Both supplied telephone values and all three external URLs tested for exact link integrity.
- [x] Mobile menu and all section anchors work; no broken internal targets.
- [x] Gallery opens/enlarges/navigates/closes; keyboard focus is contained and restored.
- [x] Cairo weekday and open/closed calculations cover midnight, Friday boundaries and DST.
- [x] Chromium checks at 320, 390, 768, 1440 and 1920px in both languages: no document horizontal overflow, missing images or browser console errors.
- [x] Mobile axe scans for WCAG 2 A/AA and 2.1 AA: zero reported violations.
- [x] Reduced-motion behavior verified; main content and prices available without JavaScript.
- [x] No booking form, fake purchase flow or success simulation.
- [x] Static production build and 18 unit / 45 browser tests pass.
- [x] Default noindex policy verified; no fake domain, address, ratings or coordinates.
- [x] Dependency audit reports zero vulnerabilities after patching lint-tool dependency.

## Performance measurement method

Lighthouse 13.6.0 through local Playwright Chromium, mobile emulation at 412×823 / DPR 1.75 and actual desktop config at 1350×940 / DPR 1. The script stores the form factor and viewport in `evidence/lighthouse-summary.json`. Use `npm run preview`, then `node scripts/measure-performance.mjs` to reproduce. Lab scores fluctuate; no production field data is claimed. SEO scores are reduced by intentional noindex/disallow behavior during review.

Font preloads target the actual visible Arabic/English families. The promotional hero uses responsive 480/736px derivatives without upscaling the source, while gallery photographs remain uncropped in the lightbox. Certificate thumbnails load lazily; full-size lossless copies load only when opened. Optimized AVIF variants reduce photo transfer size. See the recorded summary for final numeric results.

Earlier motion-build measurements on 2026-11-05 (before the membership/PDF/map/spotlight follow-up):

| Locale / mode   | Performance | Accessibility | Best practices | SEO | LCP    | CLS | TBT     |
| --------------- | ----------: | ------------: | -------------: | --: | ------ | --- | ------- |
| Arabic mobile   |          97 |           100 |            100 |  66 | 2.2Â s | 0   | 150Â ms |
| Arabic desktop  |         100 |           100 |            100 |  66 | 0.5Â s | 0   | 20Â ms  |
| English mobile  |          99 |           100 |            100 |  66 | 2.0Â s | 0   | 0Â ms   |
| English desktop |         100 |           100 |            100 |  66 | 0.5Â s | 0   | 0Â ms   |

The intentional noindex policy is retained despite the SEO score. Pre-motion measurements were 99 mobile / 100 desktop performance; the final repeated measurement is 97 Arabic mobile / 99 English mobile / 100 desktop, with unchanged mobile LCP (2.2 / 2.0 seconds) and CLS 0. The first post-motion Arabic mobile run scored 91 with 300 ms TBT; the repeat measured 150 ms TBT. Both runs are retained in `evidence/motion-first-lighthouse.json` and `evidence/lighthouse-summary.json`; the cause of this startup timing variation was not conclusively isolated. No non-composited animations were reported. Arabic startup work remains a real-device validation item, not an omitted result. Browser JavaScript totals 23,078 bytes (8,594 bytes gzip); see `evidence/browser-bundle.json`. No animation library was added.

The separate 390×844 motion lab uses a 6× CPU slowdown and 1.6 Mbps/150 ms network emulation. Arabic/English both recorded CLS 0, median rAF intervals 16.7 ms, p95 33.3 ms, zero intervals above 34 ms, no long tasks during the scripted scroll, no pending unseen items after traversal, no remaining running animations, no broken images and no console errors. This is local headless instrumentation, not sustained-60fps certification or physical-device evidence. See `evidence/motion-performance.json`.

## Motion evidence

See [motion system](MOTION_SYSTEM.md) and [coverage matrix](MOTION_COVERAGE_MATRIX.md). Captured [Arabic mobile recording](evidence/motion-ar-390.webm) and [English desktop recording](evidence/motion-en-1440.webm); visually inspected the [mobile menu](evidence/motion-ar-mobile-menu.webp) and [stagger sequence](evidence/motion-en-sequence.webp) frames. Before-motion hero captures and Lighthouse results are retained alongside the updated evidence. Sequence panels show approximately 80 / 320 / 1120 ms after the scroll request, plus screenshot capture overhead.

## Visual review scope and limits

Settled full-page and section screenshots use reduced-motion emulation so viewport expansion during capture cannot start a new entrance mid-screenshot. Normal-motion recording/sequence captures and the dedicated motion tests retain animation. The local development server was restarted after Vite cached a missing import while the new stylesheet was being created; both live locale routes were subsequently smoke-tested again.

Axe contrast scans also settle motion before measurement; all WCAG rules remain enabled. Normal-motion keyboard/menu tests run before that step, and viewport/reduced-motion/cleanup tests run separately. The first PR CI run retried an Arabic contrast scan taken during a reveal; the parallel push run passed directly. See the chronological CI record in `PROGRESS.md`.

Desktop and mobile screenshots were inspected for hierarchy, heading wrapping, consistent dark/gold palette, Arabic shaping, CTA visibility, image crops and section spacing. Excessively tall about/location images found in the first pass were corrected. Five-width overflow checks passed. This is source-informed manual comparison, not a claimed pixel-identical rendering: source photos/content were deliberately corrected as detailed in `DESIGN_SYSTEM.md`.

No physical iOS/Android device testing, Safari/WebKit screen-reader testing, or real call placement was performed. The source mobile screenshot is malformed at 37px wide. No claim of comprehensive WCAG conformance is made from automated checks alone.

## Must complete before public launch

- [ ] Obtain and compare original certificate photographs with enhanced copies.
- [ ] Confirm exact holder/current trainer role and contact identity.
- [x] Owner requested certificate display; inspect all five privacy-safe derivatives and test previews in both languages.
- [ ] Confirm photographer/reuse rights for the owner-requested Pinterest promotional hero before launch.
- [ ] Confirm current operating hours (historical listing approximately four years old).
- [ ] Verify external destinations and WhatsApp invitation validity on an owner device.
- [ ] Supply owner-approved written address. The supplied Google listing and live embed are verified in `map-verification.json`.
- [x] Owner supplied `https://top-gym-website.vercel.app`; public production routes/assets/PDF return HTTP 200 after the authorized merge.
- [ ] Configure and validate canonical/hreflang/social metadata against that origin; indexing remains disabled.
- [x] Establish an empty protected main baseline and draft PR while preserving feature history.
- [x] Owner explicitly authorized implementation merge/deployment; PR #11 merged and Vercel production succeeded.
- [ ] Enable indexing only after release approval and recheck robots/sitemap/SEO on the actual host.
- [ ] Test real mobile devices and assistive technology as part of release acceptance.

## Latest follow-up verification and performance

All 45 browser tests and 18 unit tests passed with the full validation pipeline. New focused suites are `membership-navigation.spec.ts` and `navigation-spotlight.spec.ts`. They check all nav targets, exact light alignment, stable near-boundary selection, keyboard/modality, desktop/mobile/RTL, original PDF bytes/download filename and whole-map pointer/keyboard links. External destination navigation is isolated in the map-link test; separate live map screenshots and `map-verification.json` establish the actual Google pin.

Current Lighthouse: Arabic mobile 99, English mobile 90 on first run and 97 on repeat, both desktops 100. CLS is 0 throughout. Mobile LCP is 2.2 s Arabic / 2.1 s English; mobile TBT is 20 ms Arabic and 310 / 150 ms English. The repeat did not change source code. English startup variability remains unresolved; the first run attributes its longest task to the application script and contains no Google Maps request. Both results are retained in `evidence/followup-lighthouse-summary.json` and `evidence/followup-lighthouse-repeat.json`.

The complete live-map scroll run at 390×844, 6× CPU and 1.6 Mbps/150 ms network records CLS 0, no errors/broken images, median rAF 16.7 ms, and p95 33.4 ms Arabic / 33.3 ms English. It also records 12 Arabic / 10 English long tasks (largest 538 / 371 ms) while the embedded map loads, and 24 / 15 frame intervals above 34 ms. These are a material third-party cost, not omitted evidence. The map is lazy-loaded and keeps its dimensions reserved; its full-area link works independently of rendering.

A controlled attribution run with only Google's iframe response replaced by empty HTML records no long scroll tasks, CLS 0 and median rAF 16.7 ms in both languages; p95 is 33.3 / 16.8 ms. This comparison supports attribution of the scroll slowdown to the embed, but does not represent the complete live-map experience or certify real-device performance. Results are in `evidence/navigation-pricing-map-performance.json` and `evidence/spotlight-isolated-performance.json`. Physical low-end mobile/Safari testing remains necessary.

The application JavaScript is 27,552 bytes raw / 10,091 gzip (`evidence/followup-browser-bundle.json`), with no animation dependency. Google's iframe resources are separate and not included in that bundle figure. Previous motion-only measurements above remain historical evidence.

Visual review: [Arabic spotlight](evidence/spotlight-ar.webp), [English spotlight](evidence/spotlight-en.webp), [Arabic membership tabs/PDF](evidence/memberships-ar-390.webp), [English memberships](evidence/memberships-en-1440.webp), [Arabic map](evidence/map-ar-390.webp), [English map](evidence/map-en-1440.webp).

## Calm motion, premium footer and Vercel investigation — 2026-11-05

- Implemented the requested pre-footer journey CTA, membership/call/directions buttons and four logical footer groups. The original logo, seven section links, international phone numbers, clearly labeled WhatsApp group, Facebook, configured hours/location and native Back to Top are preserved and functional. Layout is four columns at desktop, two on tablet and one on mobile with compact quick links.
- Fixed visible opacity resets, first-position spotlight travel, competing hover/reveal transforms and discontinuous menu reversals. Hero motion starts in CSS from first paint while remaining opaque; edge-triggered reveals skip already-painted content. Timings are 540–580ms entrances, 80ms stagger capped at 240ms, 200ms micro feedback and 340ms spotlight. No dependency was added.
- Full `npm run test:all` passed: TypeScript (52 files, zero errors/warnings/hints), ESLint, Prettier, 18 unit tests, production build, isolated production-metadata fixture and **55 Chromium browser tests, with no retries**. The new tests include actual near-edge activation, fast-anchor/no-flash fallback, initial spotlight alignment, menu interruption continuity and six footer layout/link/keyboard/axe checks. Existing prices, PDF hash/download, certificates, QR, map, no-JS and reduced-motion tests remain passing. Production dependency audit: zero reported vulnerabilities.
- Before/after motion audit: 80–81 starts from zero opacity on already-visible elements before; **zero afterward in all six Arabic/English × 390/768/1440 scenarios**. This checks a concrete source of flashing, not all possible frame drops. All applicable sections are covered in `MOTION_COVERAGE_MATRIX.md`.
- Footer and CTA before/after screenshots captured for both languages at 390/768/1440 and manually reviewed. Desktop motion recordings are retained for both languages. No layout overflow was detected across the broader 320–1920px browser suite. Captures exclude sticky chrome; the unfocused skip link was verified at top −100px in a real viewport before excluding its full-element screenshot artifact.
- Vercel public `/` and `/ar/` return 404. GitHub reports a successful deployment of the **empty main baseline**; website code is still on the feature branch. Feature previews are Ready but require Vercel authentication. Added explicit Astro/build/output settings in `vercel.json`. No main merge, production promotion or authentication/protection change was performed. Dashboard inspection was unavailable; details and exact release steps are in `VERCEL_DIAGNOSIS.md`.

Review: [Arabic footer desktop](evidence/footer-after-ar-1440.webp), [Arabic footer mobile](evidence/footer-after-ar-390.webp), [English footer tablet](evidence/footer-after-en-768.webp), [English CTA](evidence/footer-cta-after-en-1440.webp), [Arabic before recording](evidence/calm-before-ar-1440.webm), [Arabic after recording](evidence/calm-after-ar-1440.webm).

## Final calm-motion lab measurements

| Locale / mode                                  | Performance |  LCP |   TBT | CLS |
| ---------------------------------------------- | ----------: | ---: | ----: | --: |
| Arabic mobile, first run                       |          86 | 2.2s | 400ms |   0 |
| Arabic mobile, isolated repeat, unchanged code |          99 | 2.2s |  10ms |   0 |
| English mobile                                 |          99 | 2.0s |   0ms |   0 |
| Arabic desktop                                 |         100 | 0.5s |  40ms |   0 |
| English desktop                                |         100 | 0.5s |   0ms |   0 |

Accessibility and best-practices scores are 100 in all runs. Review SEO remains 66 because indexing is intentionally disabled. The first Arabic run attributes long tasks to the application script; the isolated repeat improves without a source change. This variance is retained rather than reporting only the best score. Other local QA/browser work was not fully isolated during the first measurement window; causation is not established. Results: `evidence/calm-lighthouse-summary.json` and `evidence/calm-lighthouse-repeat-summary.json`. These are local Chromium lab results, not field metrics.

The complete live-map 6× CPU / 1.6Mbps / 150ms scroll run at 390×844 reports median rAF intervals 16.7ms and p95 33.4ms for both languages, CLS 0, no pending/running motion after settling, no broken images and no console errors. It still records 11 Arabic / 9 English long scroll tasks, largest 381 / 349ms, and 18 / 25 frame intervals above 34ms. Google's embedded map remains a material cost on emulated slow hardware. No claim of consistent real-device 60fps or elimination of all performance variance is made. `evidence/calm-motion-performance.json` retains the raw observations; the earlier controlled map-isolation comparison remains available as historical attribution evidence.

Physical mobile/Safari/screen-reader acceptance, original certificate comparison, trainer role, hero reuse rights, provisional hours and production release approval remain open. Vercel dashboard/build logs and protected preview rendering could not be inspected without a usable authenticated session.
