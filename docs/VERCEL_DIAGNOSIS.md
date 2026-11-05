# Vercel diagnosis — 2026-11-05

## Resolved after owner approval

The owner explicitly approved merging and publishing PR #11. Both required quality runs passed before the PR was merged at `4a762f148701676d9589ac4f367178f4a55f451e` on 2026-11-05 at 21:01:28 UTC. Vercel completed [production deployment HkNF5KFVGH9fKPzU4tfTonpR789g](https://vercel.com/ahmedsalem104s-projects/top-gym-website/HkNF5KFVGH9fKPzU4tfTonpR789g).

Anonymous HTTPS requests to `/`, `/ar/`, `/en/`, the original logo, and the pricing PDF now return HTTP 200 on [the public domain](https://top-gym-website.vercel.app/). HTML contains the actual TOP GYM site; the PDF is served as `application/pdf` with its original 453,139 bytes. The previous Vercel `NOT_FOUND` response is resolved. Main's [Quality checks](https://github.com/AhmedSalem104/top-gym-website/actions/runs/42108784323) also passed after merging.

The complete live Chromium run passed 54 of 55 tests. One English navbar keyboard-outline assertion observed `none`; all three isolated repetitions of that same test then passed without application changes. The failure was in focus-style verification, not spotlight alignment or hosting. Its exact cause remains unconfirmed; do not describe the first run as an unconditional 55/55 pass. Mobile/tablet/desktop rendering, all prices, PDF download/hash, both languages, menu, gallery/certificates, QR and footer checks passed on the public host. Local and GitHub CI previously passed all 55 tests.

Search indexing remains disabled and deployed canonical metadata is not yet configured. Original-document comparison, trainer role, promotional-image rights and hours confirmation remain tracked separately. The old dashboard-access limitation below did not prevent deployment through the authenticated GitHub integration and anonymous production verification.

## Initial observed evidence — before the authorized merge

- GitHub repository homepage points to `https://top-gym-website.vercel.app`.
- Anonymous HTTP requests to `/`, `/ar/`, `/media/top-gym-logo.webp` and `/package.json` return HTTP 404 with Vercel `NOT_FOUND`. This is a hosting response, not the site's Astro 404 page.
- The default `main` branch is commit `3bc80acb7e91890edfc0e147d70a9c6e4c6aed96`; `git ls-tree -r origin/main --name-only` returns no files. The implementation has always lived on `feat/top-gym-website`, pending the owner's explicit merge/release approval.
- GitHub's Vercel status on that main commit says "Deployment has completed" and links to [production deployment](https://vercel.com/ahmedsalem104s-projects/top-gym-website/4xRhZqdLRueW6JnEZ6EHg5FWFW7X). A successful deployment status does not imply that the empty artifact contains a home page.
- Vercel also reports the feature branch deployment as Ready in [PR #11](https://github.com/AhmedSalem104/top-gym-website/pull/11). Its [branch preview](https://top-gym-website-git-feat-top-gym-1f636c-ahmedsalem104s-projects.vercel.app) redirects anonymous requests to Vercel login. That final login page's HTTP 200 is **not** a successful website check.

## Diagnosis and prepared correction

The empty main deployment explains the public 404; the implementation branch has not been promoted into production. Preview authentication is a separate issue, not evidence of an Astro build error. Dashboard settings/build logs could not be independently inspected: Vercel CLI has no authenticated session, and native browser tooling stopped because it could not reliably identify the current URL. No credentials were extracted and no protection was disabled.

`vercel.json` now declares the actual Astro framework, `npm ci`, `npm run build`, `dist`, and trailing slashes. Node 24 is pinned by `package.json` engines. These per-deployment overrides remove ambiguity if the project was initially detected as "Other" while main was empty; the prior dashboard preset remains unverified. This static website does not require a Vercel adapter or serverless functions. [Vercel build configuration documentation](https://vercel.com/docs/builds/configure-a-build) describes the framework/build/output overrides.

## Original release procedure

1. Review the feature PR and resolve the existing business release gates.
2. Authorize merging the implementation into protected main and publishing production, as required by the owner's project instructions.
3. Confirm the Vercel project root is the repository root, the production branch is main, Node is 24, and the effective build/output match `vercel.json`. Review the new deployment logs.
4. Set `SITE_URL` to the owner-approved production HTTPS origin. Keep `PUBLIC_INDEXABLE=false` until public indexing is approved.
5. After the approved production deployment, verify `/`, `/ar/`, `/en/`, assets, the original downloadable PDF, real map, metadata and external links on the public host.

Feature pushes create protected Vercel previews. The later explicit owner approval authorized the production merge described above. Successful anonymous HTTP and live browser checks, rather than a Ready label alone, verify the resolved public 404.
