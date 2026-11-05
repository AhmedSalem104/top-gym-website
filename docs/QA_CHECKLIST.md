# QA and release checklist

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
- [x] Static production build and 18 unit / 32 browser tests pass.
- [x] Default noindex policy verified; no fake domain, address, ratings or coordinates.
- [x] Dependency audit reports zero vulnerabilities after patching lint-tool dependency.

## Performance measurement method

Lighthouse 13.6.0 through local Playwright Chromium, mobile emulation at 412×823 / DPR 1.75 and actual desktop config at 1350×940 / DPR 1. The script stores the form factor and viewport in `evidence/lighthouse-summary.json`. Use `npm run preview`, then `node scripts/measure-performance.mjs` to reproduce. Lab scores fluctuate; no production field data is claimed. SEO scores are reduced by intentional noindex/disallow behavior during review.

Font preloads target the actual visible Arabic/English families. The promotional hero uses responsive 480/736px derivatives without upscaling the source, while gallery photographs remain uncropped in the lightbox. Certificate thumbnails load lazily; full-size lossless copies load only when opened. Optimized AVIF variants reduce photo transfer size. See the recorded summary for final numeric results.

Final local measurements on 2026-11-05:

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

Desktop and mobile screenshots were inspected for hierarchy, heading wrapping, consistent dark/gold palette, Arabic shaping, CTA visibility, image crops and section spacing. Excessively tall about/location images found in the first pass were corrected. Five-width overflow checks passed. This is source-informed manual comparison, not a claimed pixel-identical rendering: source photos/content were deliberately corrected as detailed in `DESIGN_SYSTEM.md`.

No physical iOS/Android device testing, Safari/WebKit screen-reader testing, or real call placement was performed. The source mobile screenshot is malformed at 37px wide. No claim of comprehensive WCAG conformance is made from automated checks alone.

## Must complete before public launch

- [ ] Obtain and compare original certificate photographs with enhanced copies.
- [ ] Confirm exact holder/current trainer role and contact identity.
- [x] Owner requested certificate display; inspect all five privacy-safe derivatives and test previews in both languages.
- [ ] Confirm photographer/reuse rights for the owner-requested Pinterest promotional hero before launch.
- [ ] Confirm current operating hours (historical listing approximately four years old).
- [ ] Verify external destinations and WhatsApp invitation validity on an owner device.
- [ ] Supply written address and verify any future map embed before enabling it.
- [ ] Supply production domain; validate canonical/hreflang/social metadata against the real origin.
- [x] Establish an empty protected main baseline and draft PR while preserving feature history.
- [ ] Review draft PR #11 and explicitly authorize implementation merge/deployment.
- [ ] Enable indexing only after release approval and recheck robots/sitemap/SEO on the actual host.
- [ ] Test real mobile devices and assistive technology as part of release acceptance.
