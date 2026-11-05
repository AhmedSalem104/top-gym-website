# Vercel diagnosis — 2026-11-05

## Observed evidence

- GitHub repository homepage points to `https://top-gym-website.vercel.app`.
- Anonymous HTTP requests to `/`, `/ar/`, `/media/top-gym-logo.webp` and `/package.json` return HTTP 404 with Vercel `NOT_FOUND`. This is a hosting response, not the site's Astro 404 page.
- The default `main` branch is commit `3bc80acb7e91890edfc0e147d70a9c6e4c6aed96`; `git ls-tree -r origin/main --name-only` returns no files. The implementation has always lived on `feat/top-gym-website`, pending the owner's explicit merge/release approval.
- GitHub's Vercel status on that main commit says "Deployment has completed" and links to [production deployment](https://vercel.com/ahmedsalem104s-projects/top-gym-website/4xRhZqdLRueW6JnEZ6EHg5FWFW7X). A successful deployment status does not imply that the empty artifact contains a home page.
- Vercel also reports the feature branch deployment as Ready in [PR #11](https://github.com/AhmedSalem104/top-gym-website/pull/11). Its [branch preview](https://top-gym-website-git-feat-top-gym-1f636c-ahmedsalem104s-projects.vercel.app) redirects anonymous requests to Vercel login. That final login page's HTTP 200 is **not** a successful website check.

## Diagnosis and prepared correction

The empty main deployment explains the public 404; the implementation branch has not been promoted into production. Preview authentication is a separate issue, not evidence of an Astro build error. Dashboard settings/build logs could not be independently inspected: Vercel CLI has no authenticated session, and native browser tooling stopped because it could not reliably identify the current URL. No credentials were extracted and no protection was disabled.

`vercel.json` now declares the actual Astro framework, `npm ci`, `npm run build`, `dist`, and trailing slashes. Node 24 is pinned by `package.json` engines. These per-deployment overrides remove ambiguity if the project was initially detected as "Other" while main was empty; the prior dashboard preset remains unverified. This static website does not require a Vercel adapter or serverless functions. [Vercel build configuration documentation](https://vercel.com/docs/builds/configure-a-build) describes the framework/build/output overrides.

## Release steps requiring owner authorization

1. Review the feature PR and resolve the existing business release gates.
2. Authorize merging the implementation into protected main and publishing production, as required by the owner's project instructions.
3. Confirm the Vercel project root is the repository root, the production branch is main, Node is 24, and the effective build/output match `vercel.json`. Review the new deployment logs.
4. Set `SITE_URL` to the owner-approved production HTTPS origin. Keep `PUBLIC_INDEXABLE=false` until public indexing is approved.
5. After the approved production deployment, verify `/`, `/ar/`, `/en/`, assets, the original downloadable PDF, real map, metadata and external links on the public host.

Pushing the authorized feature branch can create a protected Vercel preview. It does not merge main, promote a preview, change production-branch settings or authorize public production release. A local production build and a Ready check alone are not a verified production fix.
