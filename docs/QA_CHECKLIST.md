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
- [x] Static production build and 15 unit / 19 browser tests pass.
- [x] Default noindex policy verified; no fake domain, address, ratings or coordinates.
- [x] Dependency audit reports zero vulnerabilities after patching lint-tool dependency.

## Performance measurement method

Lighthouse 13.6.0 through local Playwright Chromium, mobile emulation at 412×823 / DPR 1.75 and actual desktop config at 1350×940 / DPR 1. The script stores the form factor and viewport in `evidence/lighthouse-summary.json`. Use `npm run preview`, then `node scripts/measure-performance.mjs` to reproduce. Lab scores fluctuate; no production field data is claimed. SEO scores are reduced by intentional noindex/disallow behavior during review.

Font preloads target the actual visible Arabic/English families. Desktop hero crops avoid downloading unused portrait pixels, while gallery originals remain uncropped in the lightbox. Optimized AVIF variants reduce photo transfer size. See the recorded summary for final numeric results.

Final local measurements on 2026-11-05:

| Locale / mode   | Performance | Accessibility | Best practices | SEO | LCP  | CLS   |
| --------------- | ----------: | ------------: | -------------: | --: | ---- | ----- |
| Arabic mobile   |          95 |           100 |            100 |  66 | 2.9s | 0     |
| Arabic desktop  |         100 |           100 |            100 |  66 | 0.6s | 0     |
| English mobile  |          95 |           100 |            100 |  66 | 2.6s | 0     |
| English desktop |         100 |           100 |            100 |  66 | 0.6s | 0.003 |

The intentional noindex policy is retained despite the SEO score. Mobile LCP remains slightly above the 2.5s good threshold; production hosting/caching and real-device measurement should guide further optimization. The bundled browser JavaScript is approximately 15.5 KB before compression. No claim of deployed-domain performance is made.

## Visual review scope and limits

Desktop and mobile screenshots were inspected for hierarchy, heading wrapping, consistent dark/gold palette, Arabic shaping, CTA visibility, image crops and section spacing. Excessively tall about/location images found in the first pass were corrected. Five-width overflow checks passed. This is source-informed manual comparison, not a claimed pixel-identical rendering: source photos/content were deliberately corrected as detailed in `DESIGN_SYSTEM.md`.

No physical iOS/Android device testing, Safari/WebKit screen-reader testing, or real call placement was performed. The source mobile screenshot is malformed at 37px wide. No claim of comprehensive WCAG conformance is made from automated checks alone.

## Must complete before public launch

- [ ] Obtain and compare original certificate photographs with enhanced copies.
- [ ] Confirm exact holder/current trainer role and contact identity.
- [ ] Approve and inspect privacy-safe certificate derivatives; test real certificate previews in both languages.
- [ ] Confirm current operating hours (historical listing approximately four years old).
- [ ] Verify external destinations and WhatsApp invitation validity on an owner device.
- [ ] Supply written address and verify any future map embed before enabling it.
- [ ] Supply production domain; validate canonical/hreflang/social metadata against the real origin.
- [x] Establish an empty protected main baseline and draft PR while preserving feature history.
- [ ] Review draft PR #11 and explicitly authorize implementation merge/deployment.
- [ ] Enable indexing only after release approval and recheck robots/sitemap/SEO on the actual host.
- [ ] Test real mobile devices and assistive technology as part of release acceptance.
