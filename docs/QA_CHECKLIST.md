# QA and release checklist

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

The separately approved title/contact production release was verified: root, Arabic, English, 404 document, logo and PDF returned 200; TOP GYM tab title and captain-prefixed names passed at 390/1440px in both languages, including language/hash preference behavior. The new Hero/header branch has not been merged or deployed to production.

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
