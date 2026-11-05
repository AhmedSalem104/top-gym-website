# Deployment preparation

No deployment is authorized or performed by this implementation. GitHub Actions validates but does not publish.

1. Complete the content and privacy gates in `QA_CHECKLIST.md`.
2. Obtain owner confirmation of the real HTTPS production origin and hosting destination.
3. Use Node 24, run `npm ci`, and configure `SITE_URL` and the intended indexing policy. Never invent a domain.
4. Run `npm run test:all` and review generated screenshots. Run a production-domain metadata check separately before release.
5. Request explicit authorization for merging into main and for the exact production deployment. These are separate from feature-branch push permission.
6. Build with `PUBLIC_INDEXABLE=true` only when launch is approved. Upload only `dist/` to a static host with support for directory indexes (`/ar/`, `/en/`) and the generated 404 page.
7. Confirm HTTPS, final redirects/canonical URLs, both locales, sitemap, robots, image/font delivery, phone actions and actual external destinations. Do not infer that a passing localhost test proves external link availability.

## Host settings

- Build command: `npm run build`; output directory: `dist`; runtime: Node 24.
- No serverless functions, database, secrets or payment keys are required.
- Cache hashed `/_astro/` files as immutable. Give HTML short cache lifetimes. Version media filenames if using long immutable caching for `/media/`.
- Use host-level security headers appropriate for a static site: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, restrictive camera/microphone/geolocation permissions. Validate a CSP against the built Astro assets before enforcing it.
- Serve the supplied social JPEG with the correct content type and allow sharing crawlers once public.

## Rollback

Keep the prior verified static artifact and commit SHA in the hosting release record. Roll back through the host's previous-deployment mechanism; do not rewrite Git history. No database migration is involved.

## First PR in an empty repository

The remote initially had no commits or main branch. To support the requested PR workflow, an empty main baseline was created and its history connected into the feature branch without changing the implementation tree or rewriting existing commits. [Draft PR #11](https://github.com/AhmedSalem104/top-gym-website/pull/11) now presents the full change. Main is protected by required PR and quality checks; it contains no website files. Do not merge implementation or deploy without explicit owner authorization.
