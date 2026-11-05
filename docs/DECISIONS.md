# Decision log

| Date       | Decision                                                | Reason                                                                                                             |
| ---------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 2026-11-05 | Astro static output with TypeScript and Tailwind 4      | Empty repository; marketing scope needs no backend or hydrated UI framework                                        |
| 2026-11-05 | Node 24 runtime, exact package versions                 | Current Astro requirements exceed the machine's original Node 22.19; isolated runtime avoids changing system tools |
| 2026-11-05 | Gold Desktop 2 as primary reference                     | Most developed supplied gold variant; equal ZIP timestamps prevent chronological proof                             |
| 2026-11-05 | Shared Arabic/English component tree                    | Searchable static routes with consistent behavior and maintainable translations                                    |
| 2026-11-05 | Preserve enhanced real photos and original 3D logo      | Owner-supplied media with provenance; no imaginary facilities or rebuilt mark                                      |
| 2026-11-05 | Publish five privacy-safe supplied certificate copies   | Owner requested display; redact registration numbers, preserve documents, and do not infer current employment      |
| 2026-11-05 | Replace prototype form/tiers with real actions/packages | No booking backend; PDF supports only two packages and six durations                                               |
| 2026-11-05 | Show provisional hours with call-to-confirm note        | Historical supplied data is not independently reverified; status is explicitly based on listed hours               |
| 2026-11-05 | Noindex until domain/release confirmation               | Avoid invented production URLs and premature indexing                                                              |
| 2026-11-05 | Maps link without embed/address                         | Supplied short link exists, but exact embed/address could not be independently verified                            |
| 2026-11-05 | Override minimatch to 11.0.1                            | Resolve reported globparts amplification advisory in lint tooling; validate lint/build/tests after override        |
| 2026-11-05 | Empty protected main baseline and draft PR              | Enable the authorized review workflow while keeping all website code off main and preserving feature history       |

Revisit decisions when new owner evidence arrives. Keep source-specific publishing constraints separate from implementation progress.

2026-11-05 motion follow-up: use one native Web Animations/IntersectionObserver system, with CSS micro-interactions and no added motion library. Keep server-rendered content visible, animate each element once on viewport entry, and preserve LCP opacity. Tokens and lifecycle are documented in `MOTION_SYSTEM.md`; per-section evidence is in `MOTION_COVERAGE_MATRIX.md`.

2026-11-05 follow-up: the owner explicitly requested visible certificates and a professional Pinterest hero. Use reviewed redacted supplied documents and distinguish the male-athlete promotional image from real TOP GYM photos. A visible WhatsApp QR was added using the supplied group URL (default destination stated while awaiting the optional destination preference).

2026-11-05 navigation/membership follow-up: replace the duration dropdown with six responsive tabs and EN/AR labels; add a gold active link/underline synchronized across desktop and mobile navigation. Use one dedicated section observer because active navigation must continue tracking after the motion observer unobserves revealed items. The owner explicitly requested publishing the supplied official pricing PDF, authorizing this specific byte-identical copy and its preview images; other source documents remain private.

2026-11-05 owner follow-ups: replace the desktop active underline with a subtle overhead gold spotlight while retaining the mobile underline and the existing header layout. Reuse the section observer, debounce boundary selection and hold clicked anchors through smooth scrolling. Replace the location photo/card with a full-width map linked across its entire surface, exactly as requested. The supplied short link resolved to a specific Google feature/CID, and its live embed was visually verified; no search-based replacement location or inferred coordinates were used.

- Calm motion prioritizes visible-content continuity: start fades just outside the viewport; settle already-visible anchors/dynamic content immediately. CSS owns the first-paint opaque hero, native animations own reveals/dialogs, and hover uses independent `translate`.
- The final CTA is reused as the pre-footer panel rather than duplicated. Footer hours group consecutive identical configuration rows, preserving midnight semantics and the provisional note. Back to Top remains a native link for no-JavaScript reliability.
- Vercel's public 404 corresponds to its empty-main deployment. Feature push and protected preview creation remain separate from owner-authorized production release. Explicit build/output configuration is committed; no protection bypass or production promotion is attempted.

2026-11-05 authorized release: the owner explicitly approved merging PR #11 and publishing to Vercel. Protected-main merge and deployment succeeded; public routes and assets now return HTTP 200. Business verification and indexing remain separate follow-ups. The owner also requested an invariant browser-tab name: use `business.name` in both the shared layout and custom 404, while retaining localized descriptions and social metadata.
