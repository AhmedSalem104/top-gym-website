# feat: implement the bilingual TOP GYM marketing website

The repository had no website. This change adds a static Arabic/English landing page based on the supplied Apex Gold Stitch design, with the real logo and five gym photographs, PDF-verified membership prices, phone/directions/group actions, gallery, and provisional Cairo hours.

The implementation uses shared Astro components, typed business data and localized copy. It replaces prototype claims/forms with verified content and real links. Five supplied certificate copies are visible with baked-in registration-number redactions and accessible enlargement. The owner-requested Pinterest promotional hero is labeled separately from genuine gym photography; the WhatsApp panel includes a static, scannable group QR. No generated certificates or personal registration identifiers are published.

Native, reusable motion now covers every section, with actual-viewport triggers, capped RTL-aware staggers, reduced-motion/failure fallbacks and accessible menu/dialog transitions. The navbar restores the approved source's dark call/gold group actions and segmented language control. Motion configuration and coverage are documented in `docs/MOTION_SYSTEM.md` and `docs/MOTION_COVERAGE_MATRIX.md`.

## Validation

- `npm run test:all`: typecheck/lint/format/build and production-metadata fixture passed; 18 unit tests and 32 Chromium tests passed.
- Arabic/English screenshots at 320, 390, 768, 1440 and 1920px; axe scans report no configured-rule violations.
- Lighthouse local lab: 97 Arabic mobile / 99 English mobile / 100 desktop performance; accessibility/best practices 100. Review SEO is 66 because indexing is intentionally disabled.
- A 6× CPU/network-throttled scroll lab recorded CLS 0 in both languages, 16.7 ms median / 33.3 ms p95 rAF intervals, and no long scroll tasks or console errors. This is emulation, not a device FPS guarantee. The first Arabic Lighthouse run scored 91 / 300 ms TBT; the repeat scored 97 / 150 ms TBT. Both are retained for review.
- Actual screenshots, source hashes, performance summary, decisions and launch checklist are in `docs/`.
- Screenshots: [Arabic desktop](https://github.com/AhmedSalem104/top-gym-website/blob/feat/top-gym-website/docs/evidence/ar-1440.webp), [Arabic mobile](https://github.com/AhmedSalem104/top-gym-website/blob/feat/top-gym-website/docs/evidence/ar-390.webp), [English desktop](https://github.com/AhmedSalem104/top-gym-website/blob/feat/top-gym-website/docs/evidence/en-1440.webp), [English mobile](https://github.com/AhmedSalem104/top-gym-website/blob/feat/top-gym-website/docs/evidence/en-390.webp).
- Current commit CI is visible in this PR’s checks; earlier handoff runs are recorded chronologically in `docs/PROGRESS.md`.
- Motion recordings: [Arabic mobile](https://github.com/AhmedSalem104/top-gym-website/blob/feat/top-gym-website/docs/evidence/motion-ar-390.webm), [English desktop](https://github.com/AhmedSalem104/top-gym-website/blob/feat/top-gym-website/docs/evidence/motion-en-1440.webm).

## Outstanding review gates

Original certificate comparison and trainer role, promotional hero reuse rights, current hours, verified external destinations, written address/domain, and owner-approved production release. Main merging/deployment are not part of this change.

The initially empty repository now has an empty protected `main` baseline for review. Its empty history was connected into the feature branch without changing the website tree or rewriting existing commits. This draft contains all implementation files; no website code has been merged into main and no deployment has occurred.
