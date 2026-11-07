# Logo entry and owner password — 7 November 2026

The owner explicitly requested five consecutive clicks on the logo, a password-only popup, a newly generated password delivered to them, and then the customer-data screen. This supersedes the footer-dot discovery and required email/TOTP user interface. Existing publication authorization applies.

## User experience

Click/tap the **header TOP GYM logo five times**, with no gap longer than 2.5 seconds. Ordinary clicks still navigate Home; an intervening click elsewhere resets the sequence. Keyboard Enter supports the same interaction. The fifth click opens a compact Arabic/English black-and-gold dialog, focuses the password field and makes the background inert. Backdrop clicks do not dismiss this password prompt: an extra tap in the rapid logo gesture otherwise lands outside the newly opened dialog and immediately closes it. Escape/close restore focus and clear entered credentials. Motion uses the shared entrance and reduced-motion behavior.

The shared password form has a visible label, show/hide control, loading/disabled state, localized error and retry. A successful server response sets a private cookie before navigating to the localized dashboard. No email or authenticator code is requested. The dashboard's signed-out screen uses the same form; direct access still requires authentication. Closing a pending dialog cannot trigger a late redirect.

## Authentication contract

`POST /api/challenge/v1/admin/access` accepts exactly `{ "password": "<provided privately>" }`. The Vercel BFF signs and forwards the request to the HTTPS backend. There is no browser password comparison and no hardcoded administrator password.

Private backend setting `CHALLENGE_PASSWORD_ADMIN_EMAIL` selects one existing **enabled owner** account. An absent setting returns unavailable. Non-owner/disabled accounts cannot use this method. Argon2id verifies the existing private database hash. The password is not placed in an environment variable or static assets.

Success returns the existing `{ csrf, role }` contract and a Secure, HttpOnly, SameSite=Lax session cookie in production. Authorization, 8-hour maximum session, 30-minute idle expiry, logout invalidation, CSRF-protected writes, signed gateway/origin checks and audit logging remain unchanged. Both login methods share the 5-account-attempt / 15-minute and 10-IP-attempt / 15-minute limits and two-verification concurrency ceiling. Invalid input is rejected before authentication. Logs contain no password or request body.

The legacy email/TOTP backend endpoint remains for accounts that are not opted into this owner-specific mode. It cannot bypass shared rate limits. Password-only access deliberately removes the second authentication factor for the selected owner; secrecy of five clicks provides no security. The owner requested this tradeoff. Use a cryptographically generated strong password and keep private configuration/rotation restricted.

## Operations

Generate the new owner password using a cryptographic random source. Store its handoff in the existing restricted private directory, never the repository, screenshots, traces, CI or PR. Hash with the existing Argon2id parameters; atomically update the enabled owner's record and revoke that owner's existing sessions. Preserve the prior database backup and deployment for recovery. Keep all other users and business records intact.

Deploy the tested backend before the frontend. Add only `CHALLENGE_PASSWORD_ADMIN_EMAIL` to private configuration; keep admissions, policy, questions, Gmail and service keys unchanged. The BFF route and interface become active after the protected frontend merge. Confirm a real logo/password/dashboard/logout production journey without recording credential fields.

To disable this method, remove the private owner email setting and restart only the challenge service; revoke sessions as appropriate. The old image and retained TOTP enrollment support recovery. Never roll back business data over new participants/redemptions.

## Validation

Backend tests cover disabled configuration/accounts, owner-role restriction, wrong credentials, input/origin/body limits, private sessions, CSRF/logout, shared throttling, other-account MFA and expiry. BFF tests verify the access route and cookie forwarding. Browser tests cover five-click/keyboard/touch entry, Arabic/English at 320/390/768/1440px, focus containment/restoration, accessibility, reduced motion, password visibility, invalid input, real local authentication and late-response cancellation. Exact local, Linux and production outcomes are recorded in the release PR.

Local verification: 53 backend tests, 63 website/BFF tests, ten focused dialog browser cases, typecheck (95 files, zero diagnostics), lint, formatting, build and SEO checks passed. The Linux production image passed 52 tests; one private-bank check is skipped because the bank is intentionally excluded from the image. Real signed HTTPS checks confirmed owner password-only login, dashboard access, CSRF logout, session revocation and rejection of unsigned/unauthenticated access after the isolated backend release. Database backup integrity and the existing application's health passed.

Actual empty-dialog screenshots: [Arabic mobile](evidence/admin-access/dialog-ar-390.webp), [Arabic desktop](evidence/admin-access/dialog-ar-1440.webp), [English desktop](evidence/admin-access/dialog-en-1440.webp). No real credentials or participant records appear in the evidence.

This change does **not** activate the fitness challenge. Coupon terms and private-question review remain separate outstanding inputs.
