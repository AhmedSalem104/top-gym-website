# Customer feedback

## Production activation — 6 November 2026

The production form is enabled. The owner supplied the sender/recipient address and accepted the free Upstash integration terms. Gmail credentials, the hash secret and the mapped Redis REST values are private production environment variables. Automatic Redis plan upgrades remain disabled. Redeploying main picked up the completed configuration; no application-code or public business-data change was needed.

Live verification passed: Gmail TLS/authentication; Redis atomic limits, claims and completion; public readiness available:true; six Arabic/English browser cases at 390/768/1440px; one clearly labeled test submitted through the real Arabic form; HTTP 200 accepted and the localized success state. Repeating the same idempotency key returned the stored acceptance. A read-only IMAP search for that exact test Message-ID found exactly one message in the configured Gmail INBOX. No unrelated mail was fetched and no message was marked read.

This confirms delivery of that test, not a guarantee of future inbox placement. Actual Gmail visual rendering remains unreviewed. See [activation evidence](evidence/feedback-activation.json), [live Arabic mobile form](evidence/feedback-live-ar-390.png) and [live English desktop form](evidence/feedback-live-en-1440.png). Section captures hide fixed page chrome; production interactions used the normal page.

## Design and delivery decision

Purpose: let a visitor privately tell management how a visit felt in under a minute. Direction: a refined black-and-gold conversation, with a large five-star rating as the signature, compact selectable topic chips and a generous writing area. Keep the current Cairo / Barlow Condensed / Chivo typography. Tokens: gold #E59500, canvas #0B0D0F, surface #17191C, ink #F8F9FA, muted #A6ABB2, border #34383D; spacing 8/16/24/32/48px. Reuse existing motion; semantic native controls remain visible without animations.

```text
Desktop: [ title / private-feedback explanation ] [ stars + rating description ]
                                                  [ topic chips / message      ]
                                                  [ optional contact / submit  ]
Mobile:  title → stars → topics → message → optional contact → privacy / submit
Email:   dark branded header → gold rating → light message card → optional details
```

Placement: after Contact and before the final CTA. Footer and mobile navigation link to the section; the already dense desktop navbar stays unchanged. All other sections and business facts remain intact.

Architecture: Astro pages remain static. One native Vercel Node function at `api/feedback.ts` handles `/api/feedback`; no second application or UI framework. Nodemailer sends through Gmail with a fixed authenticated sender. A shared Redis REST store supplies atomic rate limits and idempotency across function instances. It retains only keyed hashes, counters and delivery state with expiration, never feedback text, names, email addresses or raw IPs. Missing configuration/storage fails closed.

Success contract: HTTP 200 `accepted` means SMTP accepted the message for the configured recipient. It does **not** prove inbox placement. An uncertain SMTP outcome is not retried automatically; the same idempotency key cannot start a second delivery. The message is private and is never turned into a public testimonial.

The owner subsequently explicitly requested finishing and publishing this feature. Use protected PRs, successful checks and post-release verification. Publication does not prove Gmail readiness: sender/recipient addresses, private SMTP configuration and the shared store are separate requirements. Never copy a password from conversation into code or logs. Inbox receipt and Gmail rendering must be verified separately from mocks or SMTP acceptance.

## Files and local development

- UI: src/sections/Feedback.astro, src/styles/feedback.css, src/scripts/feedback.ts.
- Shared limits/categories: src/config/feedback.ts; language copy: src/i18n/feedback.ts.
- Server: api/feedback.ts delegates to src/server/feedback/{config,schema,handler,store,delivery,email}.ts.
- Tests: tests/unit/feedback*.test.ts and tests/e2e/feedback.spec.ts.
- Run **npm run build** and **npm run test:e2e** for production-HTML browser checks. The test server combines Astro preview with the real handler in an explicitly unconfigured mode and never reads SMTP secrets. Browser scenarios intercept the API to simulate defined outcomes.
- Run **vercel dev** against the linked project for actual local integration, with ignored development environment values and FEEDBACK_ORIGIN set to the exact local origin. Astro dev/preview alone serve pages, not the Vercel API.
- Run **npm run preview:email** to generate .local/feedback-email/{ar,en}.{html,txt}. All sample content is labeled and uses reserved .test addresses. Nothing is sent.

## Environment and Gmail setup

All values are **server-only**. Configure the appropriate Vercel environment, then rebuild/redeploy. Running deployments do not inherit subsequently edited variables. Keep real values in Vercel's encrypted/sensitive environment store or ignored local files, never command arguments, screenshots, build output, issues or commits.

| Variable                 | Meaning                                                               |
| ------------------------ | --------------------------------------------------------------------- |
| SMTP_HOST                | Fixed to smtp.gmail.com                                               |
| SMTP_PORT                | 465 for implicit TLS, or 587 for required STARTTLS                    |
| SMTP_USER                | Authenticated Gmail/Workspace sender address                          |
| SMTP_APP_PASSWORD        | App password for that same account; never the normal account password |
| FEEDBACK_RECIPIENT_EMAIL | Management inbox authorized by the owner                              |
| FEEDBACK_FROM_NAME       | Defaults to TOP GYM Website                                           |
| FEEDBACK_ORIGIN          | Exact allowed origin; defaults to https://top-gym-website.vercel.app  |
| UPSTASH_REDIS_REST_URL   | HTTPS REST endpoint for shared rate/idempotency storage               |
| UPSTASH_REDIS_REST_TOKEN | Private read/write REST token                                         |
| FEEDBACK_HASH_SECRET     | At least 32 random characters for keyed hashes                        |

Enable Google's two-step verification and create a dedicated app password where supported. Store it privately; do not paste secrets into chat. Use the authenticated account as From, never the customer's address. Workspace policies can restrict app passwords; resolve that with the administrator rather than disabling TLS.

For Upstash's Vercel integration, choose the free plan and disable automatic upgrade unless the owner separately approves charges. Provider terms require the owner's account interaction. If it supplies KV_REST_API_URL / KV_REST_API_TOKEN, map those server-side values to the UPSTASH_REDIS_REST_* names above. Preview/test deployments should use separate test credentials/resources, not production inbox traffic.

References: [Vercel Node functions](https://vercel.com/docs/functions/runtimes/node-js), [Nodemailer SMTP](https://nodemailer.com/smtp), [Upstash REST API](https://upstash.com/docs/redis/features/restapi). TypeScript's [relative import rewrite](https://www.typescriptlang.org/tsconfig/rewriteRelativeImportExtensions.html) is enabled so Vercel's emitted JavaScript imports emitted .js modules rather than missing .ts files.

## API contract

GET /api/feedback/ returns HTTP 200 with only an available boolean and Cache-Control: no-store. This means configuration is complete, not a live SMTP/inbox probe. No addresses, secrets or provider errors are exposed.

POST /api/feedback/ accepts JSON with a UUID Idempotency-Key header, exact same-site Origin and:

| Field          | Validation                                                   |
| -------------- | ------------------------------------------------------------ |
| rating         | Integer 1–5                                                  |
| categories     | 1–6 unique values from the shared category list              |
| message        | 10–2,000 characters after normalization; source also bounded |
| name           | Optional, at most 80 characters                              |
| email          | Optional valid email, at most 254 characters                 |
| replyRequested | Boolean; requires email when true                            |
| locale         | ar or en                                                     |
| website        | Empty honeypot; filled values are rejected                   |

Unknown fields are rejected. Body size is capped at 16 KiB with a bounded read deadline. Text is NFC-normalized, trimmed and stripped of non-printing controls/bidi overrides; line breaks are retained. Zod validates every request, irrespective of browser validation.

Responses: 200 accepted; 400 malformed/bot; 403 disallowed origin; 405 wrong method; 413 oversized body; 415 wrong content type; 422 invalid fields; 429 request limit; 409 pending/conflicting idempotency key; 503 unavailable or uncertain delivery. Localized UI messages never show raw SMTP responses.

## Abuse prevention and duplicate handling

- Atomic Lua counters: 10 requests per trusted client IP per 15 minutes, plus 60 new claims globally per 15 minutes. Host/provider firewall rules remain useful against distributed abuse.
- Vercel supplies the trusted forwarded client address. Adapt the boundary before deploying behind an untrusted forwarding chain.
- HMAC hashes identify clients, payloads and UUIDs. Redis stores counters and fingerprint/state/createdAt only, expiring in 15 minutes or 24 hours. No raw IP, name, email or message is retained there.
- An atomic claim precedes sending. A repeated key/payload cannot send twice across function instances; a changed payload with the same key is rejected.
- Network retries retain the original key and exact payload. Concurrent requests return in_progress; accepted retries return the stored result. SMTP timeout/unknown outcomes remain uncertain and cannot automatically resend.
- A missing/failing store fails closed. SMTP has connection/socket and overall deadlines; the Vercel function has a 45-second budget.
- Origin checking prevents browser cross-site posts; it does not authenticate arbitrary clients. The public form has no login/session and is not a general mail relay.

## Email and privacy

Subject always starts **[TOP GYM WEBSITE]** and includes Customer Feedback plus the actual score. Management can filter that prefix in Gmail and apply the label **Top Gym Feedback**.

The template produces a 600px table-based, inline-CSS HTML notification and a plain-text alternative: TOP GYM wordmark, dark header, actual gold rating, light full-message card, localized topics, optional details, Africa/Cairo timestamp and source label. Submitted HTML is escaped; there is no JavaScript, remote CSS, tracking pixel or external image. Valid customer email is Reply-To only; the fixed recipient never comes from user input.

Messages remain private in the management inbox. No public reviews, analytics, CRM records or browser storage are created. The owner controls Gmail retention/access. Logs contain generic outcome categories, never content, addresses, credentials or raw SMTP errors.

## Verification and troubleshooting

Automated checks cover validation, bot/origin/body limits, shared limiting, concurrency, retries, SMTP rejection/auth failure/timeouts, uncertainty, HTML escaping, scores 1/3/5, bilingual/mixed multiline text, omitted details, fixed From/Reply-To/TLS and mocked transport. Browser tests cover 320/390/768/1440px, keyboard stars/topics, validation, server-confirmed success, unavailable configuration, network retry, reduced motion and axe.

The first Vercel preview exposed ERR_MODULE_NOT_FOUND for emitted TypeScript imports. Enabling rewriteRelativeImportExtensions fixed the function: the next hosted request returned HTTP 200 with available:false instead of crashing. This was a real hosted API check, not mocked delivery.

If unavailable, check private variables, exact origin and store access. For SMTP failures check the sender/app-password pairing, account policy and TLS port without logging credentials. SMTP acceptance does not prove inbox placement: inspect Inbox/Spam and confirm the subject in Gmail. Never automatically retry uncertain deliveries.

See the activation record above and PROGRESS.md for current configuration/release status. One real Gmail inbox delivery is verified; actual Gmail light/dark rendering remains unreviewed. Chromium sample previews are visual evidence only:

- [Arabic desktop form](evidence/feedback-after-ar-1440.webp), [Arabic mobile](evidence/feedback-after-ar-390.webp).
- [English desktop form](evidence/feedback-after-en-1440.webp), [English mobile](evidence/feedback-after-en-390.webp).
- [Before: contact area without feedback](evidence/feedback-before-ar-1440.webp).
- [Sample Arabic email](evidence/feedback-email-ar-390-light.webp), [sample English email](evidence/feedback-email-en-768-dark.webp).
