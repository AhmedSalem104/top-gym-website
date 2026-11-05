# feat: implement the bilingual TOP GYM marketing website

The repository had no website. This change adds a static Arabic/English landing page based on the supplied Apex Gold Stitch design, with the real logo and five gym photographs, PDF-verified membership prices, phone/directions/group actions, gallery, and provisional Cairo hours.

The implementation uses shared Astro components, typed business data and localized copy. It replaces prototype claims/forms with verified content and real links. Five supplied certificate copies are visible with baked-in registration-number redactions and accessible enlargement. The owner-requested Pinterest promotional hero is labeled separately from genuine gym photography; the WhatsApp panel includes a static, scannable group QR. No generated certificates or personal registration identifiers are published.

Native, reusable motion now covers every section, with actual-viewport triggers, capped RTL-aware staggers, reduced-motion/failure fallbacks and accessible menu/dialog transitions. The navbar restores the approved source's dark call/gold group actions and segmented language control. Motion configuration and coverage are documented in `docs/MOTION_SYSTEM.md` and `docs/MOTION_COVERAGE_MATRIX.md`.

## Validation

- `npm run test:all`: typecheck/lint/format/build and production-metadata fixture passed; 18 unit tests and 55 Chromium tests passed.
- Arabic/English screenshots at 320, 390, 768, 1440 and 1920px; axe scans report no configured-rule violations.
- Final Lighthouse: both desktops 100; English mobile 99; Arabic mobile 86 initially and 99 on an isolated repeat with unchanged code. CLS 0 throughout. Accessibility/best practices 100, review SEO 66 (intentional noindex). Both measurements are retained.
- Six-times CPU/network-throttled scrolling: median rAF 16.7ms, p95 33.4ms, CLS 0, no errors/broken images. The live Google map still introduces long tasks; this is not full-site 60fps proof. See the final QA record for raw numbers and variability.
- Actual screenshots, source hashes, performance summary, decisions and launch checklist are in `docs/`.
- Screenshots: [Arabic desktop](https://github.com/AhmedSalem104/top-gym-website/blob/feat/top-gym-website/docs/evidence/ar-1440.webp), [Arabic mobile](https://github.com/AhmedSalem104/top-gym-website/blob/feat/top-gym-website/docs/evidence/ar-390.webp), [English desktop](https://github.com/AhmedSalem104/top-gym-website/blob/feat/top-gym-website/docs/evidence/en-1440.webp), [English mobile](https://github.com/AhmedSalem104/top-gym-website/blob/feat/top-gym-website/docs/evidence/en-390.webp).
- Current commit CI is visible in this PR’s checks; earlier handoff runs are recorded chronologically in `docs/PROGRESS.md`.
- Motion recordings: [Arabic mobile](https://github.com/AhmedSalem104/top-gym-website/blob/feat/top-gym-website/docs/evidence/motion-ar-390.webm), [English desktop](https://github.com/AhmedSalem104/top-gym-website/blob/feat/top-gym-website/docs/evidence/motion-en-1440.webm).

## Outstanding review gates

Original certificate comparison and trainer role, promotional hero reuse rights, current hours, verified external destinations, written address/domain, and owner-approved production release. Main merging/deployment are not part of this change.

The initially empty repository now has an empty protected `main` baseline for review. Its empty history was connected into the feature branch without changing the website tree or rewriting existing commits. This draft contains all implementation files; no website code has been merged into main or promoted to production. The existing Vercel integration creates protected feature previews; its empty-main public deployment returns 404.

## Requested navigation, pricing and map improvements

The current header has a shared 340 ms gold overhead spotlight on desktop and a clean mobile active indicator, with stable scroll tracking and clicked-anchor handling. Language options display EN/AR. Six accessible duration tabs replace the dropdown; the original official PDF is visible, downloadable and hash-verified. The verified full-width Google map opens the owner's exact location when any part is selected. Contacts, prices, hours and certificate contents are unchanged.

See [spotlight](https://github.com/AhmedSalem104/top-gym-website/blob/feat/top-gym-website/docs/evidence/spotlight-ar.webp), [membership/PDF](https://github.com/AhmedSalem104/top-gym-website/blob/feat/top-gym-website/docs/evidence/memberships-ar-390.webp), [live map](https://github.com/AhmedSalem104/top-gym-website/blob/feat/top-gym-website/docs/evidence/map-ar-390.webp), and `docs/QA_CHECKLIST.md` for full evidence and the Google embed's measured slow-device cost.

## Calm motion and premium footer

The old observer restarted opacity at zero after content was visible. Near-edge activation now avoids that reset and fast anchors settle immediately. Initial spotlight geometry is established before transitions, native disclosure reversals resume their painted frame, and CSS hover translation no longer competes with reveal transforms. The measured visible-reset count falls from 80–81 per scenario to zero across both locales and all three target widths.

The requested journey CTA leads into a four-group footer with the actual logo, seven section links, real contact/social actions, configured hours/location and native Back to Top. New footer/motion tests cover responsive columns, all destinations, exact hour boundaries, keyboard/reduced motion, axe, first indicator placement and menu reversal continuity.

[Desktop footer](https://github.com/AhmedSalem104/top-gym-website/blob/feat/top-gym-website/docs/evidence/footer-after-ar-1440.webp) · [Mobile footer](https://github.com/AhmedSalem104/top-gym-website/blob/feat/top-gym-website/docs/evidence/footer-after-ar-390.webp) · [CTA](https://github.com/AhmedSalem104/top-gym-website/blob/feat/top-gym-website/docs/evidence/footer-cta-after-en-1440.webp) · [After motion recording](https://github.com/AhmedSalem104/top-gym-website/blob/feat/top-gym-website/docs/evidence/calm-after-ar-1440.webm).

## Vercel

The public URL returns Vercel NOT_FOUND while main contains no files. Protected feature previews are reported Ready; their rendering/build logs could not be inspected with the available authentication. `vercel.json` explicitly declares Astro, npm ci, npm run build, dist and trailing slashes. See `docs/VERCEL_DIAGNOSIS.md`. Production approval/merge is still required; this PR does not claim the public site is repaired or deployed.
