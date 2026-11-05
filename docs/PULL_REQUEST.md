# feat: implement the bilingual TOP GYM marketing website

The repository had no website. This change adds a static Arabic/English landing page based on the supplied Apex Gold Stitch design, with the real logo and five gym photographs, PDF-verified membership prices, phone/directions/group actions, gallery, and provisional Cairo hours.

The implementation uses shared Astro components, typed business data and localized copy. It replaces prototype claims/forms with verified content and real links. Certificate cards/lightbox are implemented but hidden pending original-document, role and privacy review. No generated certificates or personal identifiers are published.

## Validation

- `npm run test:all`: typecheck/lint/format/build and production-metadata fixture passed; 15 unit tests and 19 Chromium tests passed.
- Arabic/English screenshots at 320, 390, 768, 1440 and 1920px; axe scans report no configured-rule violations.
- Lighthouse local lab: 95 mobile / 100 desktop performance in both languages; accessibility/best practices 100. Review SEO is 66 because indexing is intentionally disabled.
- Actual screenshots, source hashes, performance summary, decisions and launch checklist are in `docs/`.
- [GitHub Actions passed](https://github.com/AhmedSalem104/top-gym-website/actions/runs/42043311915) on pushed commit `450b8855bb1fc75a906d106f963378ff333c6035`.

## Outstanding review gates

Original certificates/privacy and trainer role, current hours, verified external destinations, written address/domain, and owner-approved production release. Main merging/deployment are not part of this change.

This prepared PR description is ready for an approved base branch. The initially empty repository has no main baseline; GitHub selected `feat/top-gym-website` as its default after the first push. No PR is claimed until a distinct approved base exists.
