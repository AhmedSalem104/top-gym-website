# Deployment preparation

**Latest status (7 November 2026):** production challenge admissions are active. See [live status and evidence](CHALLENGE_LIVE_STATUS.md). Closed-admission and pending-input statements in dated sections below are historical.

## Ten-second timer and rapid logo entry — 7 November 2026

The owner requested ten seconds per question and reported that the logo entry did not work. See [implementation, migration, reproduction and release checks](CHALLENGE_TIMER_UPDATE.md). Earlier five-second records describe the previous release. The closing state described in this historical entry was superseded; see [current production status](CHALLENGE_LIVE_STATUS.md).

## Logo password access — 7 November 2026

For the owner-requested password-only login, publish the tested backend first and configure only the private CHALLENGE_PASSWORD_ADMIN_EMAIL selector; rotate the database hash and revoke owner sessions after a backup. Then release the BFF/dialog through protected main. See [deployment, rollback and credentials handling](ADMIN_ACCESS.md).

## Challenge visibility correction — 7 November 2026

See [production visibility](CHALLENGE_VISIBILITY.md) for how the launcher and authenticated admin shell were exposed. Current admissions are active; the older closed-state behavior is historical. See [live status](CHALLENGE_LIVE_STATUS.md) for the running configuration.

## Challenge backend installed — 7 November 2026

See [CHALLENGE_ACTIVATION.md](CHALLENGE_ACTIVATION.md): the isolated VPS service, trusted IP certificate/renewal, private SMTP/admin setup and server-only Vercel configuration are installed. Public admission is active; earlier closed-state notes below are historical.

## Direct-entry update — 7 November 2026

The owner requested a stronger animated invitation, compact membership-discount dialog, name-only personal details after the quiz, removal of participant OTP, and production publication. See [CHALLENGE_SIMPLE_ENTRY.md](CHALLENGE_SIMPLE_ENTRY.md) for the current contract and residual risks. One attempt is tied to an **entered, unverified** canonical number; recovery requires the original secret session, never the phone alone. Admin MFA is unchanged. OTP approval is no longer required.

## Challenge code publication ? 7 November 2026

This paragraph records the pre-activation publication state. The challenge is currently live; see [CHALLENGE_LIVE_STATUS.md](CHALLENGE_LIVE_STATUS.md). Preserve the private Vercel/VPS configuration, SQLite data, backups, and rollback image; never publish the local harness or private bank.

## Current publishing authorization — 6 November 2026

The owner explicitly requested merging and publishing PR #16, then instructed: after every completed modification, push and publish. This is standing authorization for the normal protected-PR/Vercel workflow after successful validation; do not repeatedly request permission. A later explicit review-only instruction overrides this preference. Preserve required checks, source integrity and post-deployment verification. Deployment permission does not verify unresolved business facts or enable search indexing automatically.

The owner explicitly authorized merging PR #11 and publishing to Vercel on November 5, 2026. Main merge `4a762f148701676d9589ac4f367178f4a55f451e` triggered the successful production deployment at [TOP GYM](https://top-gym-website.vercel.app/). Anonymous requests to the home page, both languages, logo and pricing PDF return HTTP 200. See [Vercel diagnosis and resolution](VERCEL_DIAGNOSIS.md).

GitHub Actions validates; the Vercel Git integration publishes main and creates protected feature previews. The website remains `noindex, nofollow`, with no canonical origin configured in the deployed build. The supplied production origin is now known; configure `SITE_URL=https://top-gym-website.vercel.app` and deliberately enable indexing after the outstanding content/SEO checks. Deployment authorization does not independently confirm certificate originals, trainer role, image rights or current hours.

1. Complete the content and privacy gates in `QA_CHECKLIST.md`.
2. Obtain owner confirmation of the real HTTPS production origin and hosting destination.
3. Use Node 24, run `npm ci`, and configure `SITE_URL` and the intended indexing policy. Never invent a domain.
4. Run `npm run test:all` and review generated screenshots. Run a production-domain metadata check separately before release.
5. Apply the current publishing authorization above. Confirm that no later instruction restricts the change to review only; keep protected-main checks in place.
6. Build with `PUBLIC_INDEXABLE=true` only when launch is approved. Upload only `dist/` to a static host with support for directory indexes (`/ar/`, `/en/`) and the generated 404 page.
7. Confirm HTTPS, final redirects/canonical URLs, both locales, sitemap, robots, image/font delivery, phone actions and actual external destinations. Do not infer that a passing localhost test proves external link availability.

## Host settings

- Feedback was activated on production on 6 November 2026 by completing private Gmail/Redis configuration and redeploying main. A real form submission and exactly one Gmail INBOX receipt were verified; see CUSTOMER_FEEDBACK.md. Environment-variable changes require another deployment to affect running functions. Keep these secrets configured on the existing production project, never in Git or static build assets.
- Build command: `npm run build`; output directory: `dist`; runtime: Node 24.
- Private feedback requires `api/feedback.ts`, Gmail server secrets and a shared Redis REST store. See `CUSTOMER_FEEDBACK.md` for the exact configuration, readiness contract and acceptance checks. Other landing-page features remain static. A `dist/`-only deployment has no mail API.
- Cache hashed `/_astro/` files as immutable. Give HTML short cache lifetimes. Version media filenames if using long immutable caching for `/media/`.
- Use host-level security headers appropriate for a static site: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, restrictive camera/microphone/geolocation permissions. Validate a CSP against the built Astro assets before enforcing it.
- Serve the supplied social JPEG with the correct content type and allow sharing crawlers once public.

## Rollback

Keep the prior verified static artifact and commit SHA in the hosting release record. Roll back through the host's previous-deployment mechanism; do not rewrite Git history. No database migration is involved.

## First PR in an empty repository — historical setup

The remote initially had no commits or main branch. An empty main baseline supported the PR workflow while preserving feature history. [PR #11](https://github.com/AhmedSalem104/top-gym-website/pull/11) is now merged with explicit owner authorization, after both quality runs passed. Main contains the implementation and remains protected; no history was rewritten or protection bypassed.

The official pricing PDF must be served as `application/pdf` at its configured `/documents/` path. If enforcing CSP, allow `frame-src https://www.google.com` for the verified lazy Maps embed and test the provider redirect on the host. No Google API key is required. Network/content blocking can prevent tiles; the full-area link still opens the unchanged supplied Maps URL.

`vercel.json` explicitly declares Astro, `npm ci`, `npm run build`, `dist` and trailing slashes. Node 24 is required by package engines. These settings are now used by the successful production deployment.

An independently configured GitHub Pages/Jekyll workflow failed on the main merge because it interpreted Astro front matter as YAML. That workflow does not serve the Vercel URL and was not changed or used for this release. The application's Quality checks workflow and Vercel deployment both succeeded.
