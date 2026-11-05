# TOP GYM contributor instructions

Build a static bilingual marketing site for the real TOP GYM. Preserve the supplied Apex Gold Stitch direction and business facts. This is not a membership application.

- Stack: Astro, TypeScript, Tailwind 4/CSS, small DOM scripts. Node 24, npm lockfile.
- Business facts: `src/config/business.ts`; translations: `src/i18n/index.ts`; media descriptions: `src/content/media.ts`.
- Shared components: `src/components`; page sections: `src/sections`; tokens/layout: `src/styles/global.css`.
- Validate: `npm ci`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, `npm run build`, `npm run test:e2e`. Install Chromium with `npx playwright install chromium`.
- Use gold #E59500 on the approved dark palette. Preserve Barlow Condensed/Chivo and use Cairo for Arabic. No lime UI, fabricated logo, invented facilities or promotional claims.
- Check Arabic RTL and English LTR at 320, 390, 768, 1440, 1920px. Keep visible focus, 44px targets, semantic controls, reduced motion and keyboard-accessible dialogs.
- All photographic human imagery must be male only. Inspect photos, posters and reflections manually. This is not evidence that the business is men-only.
- Keep source archives, original certificates and PDFs outside Git. Never overwrite originals. Update `docs/asset-manifest.json` for every derivative. Do not publish certificate identifiers or claim unverified qualifications/identity.
- Prices must match the official 2026-11-05 PDF. Hours are provisional; do not silently mark them verified. WhatsApp is a group invitation, never a private support chat.
- Work on feature branches with conventional commits. Preserve existing work. No force push, reset, main merge, or production deployment without explicit owner authorization.
- Done means implemented, validated, visually reviewed against source, documented with actual evidence, and free of unresolved launch blockers. Never present targets as measurements.

Read `docs/PROJECT.md`, `docs/DECISIONS.md`, `docs/PROGRESS.md`, and `docs/QA_CHECKLIST.md` before resuming. See `docs/CONTENT_INVENTORY.md` for withheld content and `docs/DEPLOYMENT.md` before release.
