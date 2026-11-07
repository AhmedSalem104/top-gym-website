# Challenge API, persisted state and invariants

Browser prefix: `/api/challenge/v1`. Backend prefix: `/v1`. All responses use `Cache-Control: no-store`; errors expose stable codes, not provider messages, submitted data or secrets. JSON only for POST; maximum 8 KiB. Dates are UTC Unix milliseconds unless otherwise stated. Display uses `Africa/Cairo` through Intl.

## Vercel routing

The static Astro deployment uses an explicit `vercel.json` rewrite from `/api/challenge/v1/:__tg_path*/` to the native `api/challenge.ts` function. The gateway normalizes the allowlisted original/rewritten route, removes the internal `__tg_route` and Vercel-added `__tg_path` parameters, rejects ambiguity and signs the canonical backend path/query. Preview inspection caught a platform 404 with the previous framework-style catch-all filename; a successful function build alone did not verify routing. The source/destination explicitly retain the trailing slash required by this project; nested calls must reach the function after the canonical redirect. See [Vercel rewrites](https://vercel.com/docs/routing/rewrites).

## Public contracts

| Method / backend path           | Request                                              | Result / authorization                                                                                |
| ------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| GET `/health`                   | none                                                 | Minimal process liveness; no secrets or dependency diagnostics                                        |
| GET `/v1/challenge/info`        | none                                                 | `available`, `questions:3`, `seconds:5`, `discounts:[0,10,20,30]`, bilingual terms, `mode:local/live` |
| POST `/v1/verification/request` | `{phone}`                                            | Opaque `verification`, `expiresAt`; no disclosure of prior participation                              |
| POST `/v1/verification/confirm` | `{verification,code}`                                | Sets player session cookie; returns own eligible/active/completed/registered state                    |
| POST `/v1/challenge/start`      | `{locale,attribution?}`                              | Requires verified player cookie; returns existing attempt or creates exactly one                      |
| GET `/v1/challenge/session`     | cookie                                               | Own persisted state without forcing a timeout transition                                              |
| POST `/v1/challenge/sync`       | `{}`                                                 | Reconciles deadlines atomically and returns own state                                                 |
| POST `/v1/challenge/answer`     | `{question,option}` + `Idempotency-Key`              | Current selected question only; authoritative evaluation and next state                               |
| POST `/v1/challenge/finalize`   | `{name,email?,consent:true,marketingConsent?}` + key | Atomic registration, eligible coupon and outbox jobs                                                  |
| GET `/v1/challenge/result`      | cookie                                               | Own state/result; never another participant's data                                                    |
| POST `/v1/challenge/event`      | `{event,key,attribution}`                            | Only `challenge_viewed` or `challenge_opened`; deduplicated, rate-limited                             |

Attribution accepts bounded `source`, `medium`, `campaign`, `content`, path-only `landing`, and `entry` (`floating`, `footer`, `direct`). Browser fields map from the corresponding UTM parameters. No full referral URL or query-string PII is saved. Do not place personal information in UTMs.

Example active response (illustrative data, not an actual participant):

```json
{
  "status": "active",
  "maskedPhone": "••••5678",
  "serverNow": 1794052801000,
  "question": {
    "id": "TG-123",
    "ordinal": 1,
    "total": 3,
    "startsAt": 1794052800000,
    "deadlineAt": 1794052805000,
    "text": { "ar": "نص السؤال", "en": "Question text" },
    "options": [{ "id": "opaque-random-option-id", "text": { "ar": "اختيار", "en": "Option" } }]
  }
}
```

There are always four options in real responses. No `correct`, explanation, option-index map or future question appears in a public response. State/result includes localized policy terms, score/discount only after completion and the coupon only after registration. Phone ownership is recovered by re-verifying the same canonical number; name submission cannot replace it.

Names: trimmed 2–100 characters; no controls or directional overrides. Email: optional, valid syntax, at most 254. OTP: six ASCII digits; use keyboard numeric input. Egyptian/Persian numerals in telephone input are normalized. Supported mobiles normalize to `+201[0125]xxxxxxxx`; this establishes syntactic validity, not ownership until OTP succeeds.

## Five-second timer protocol

- Start transaction selects one random question from each difficulty band, shuffles their order, and randomizes opaque option IDs. This keeps difficulty exposure comparable without predictable questions. Snapshots freeze each question/version for this attempt.
- Question 1 starts at authoritative server time; `deadline = starts + 5000` is a database check constraint.
- An answer is accepted only when the current question matches, its option belongs to the stored mapping and receipt time is strictly **before** the deadline.
- Early completion starts the next question at server receipt time. A timeout starts the next at the expired question's deadline, not at reconnection time.
- An indexed maintenance sweep runs once a second; POST sync/start/answer also reconciles. Thus worker restart, background tabs, offline periods and page refresh cannot reset the clock. After a 15-second complete disconnect, all unanswered questions can be timed out.
- A browser countdown uses `performance.now()` only for display. It cannot extend the persisted deadline. Latency means less than five seconds may be visible; the UI discloses this before starting.
- Idempotency keys bind to a request fingerprint. Reusing a key with changed content is rejected. Transaction constraints enforce one answer per ordinal even with different keys or concurrent tabs.

The synchronous SQLite transaction never includes OTP or SMTP network activity. Five seconds is preserved exactly; fairness alternatives such as readiness handshakes, increased time or a non-timed alternative require explicit approval, not an implementation shortcut.

## Administration

| Method / backend path                | Request / behavior                                                                                                   |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| POST `/v1/admin/login`               | `{email,password,code}`; password + TOTP; secure cookie, CSRF token, role                                            |
| GET `/v1/admin/me`                   | Auth required; renew CSRF token, return role. Another tab may need reload after token rotation                       |
| POST `/v1/admin/logout`              | Auth + CSRF; invalidate session                                                                                      |
| GET `/v1/admin/summary`              | Participants, completions, 0/10/20/30 distribution, coupon lifecycle counts, email jobs, events                      |
| POST `/v1/admin/participants/search` | Auth + CSRF; `{page,search,status,sort}`; 25 rows/page                                                               |
| GET `/v1/admin/participants`         | Auth; non-sensitive pagination/filter only; nonempty query-string search rejected                                    |
| GET `/v1/admin/participants/:id`     | Auth; own admin permission to inspect original questions, selected/correct options and timeouts                      |
| POST `/v1/admin/coupons/lookup`      | Auth + CSRF; `{code}`; terms, policy, participant and current redemption status                                      |
| POST `/v1/admin/coupons/redeem`      | Redeemer/owner + CSRF + idempotency key; `{code,confirm:true,eligibility:{package,duration,newCustomer,otherOffer}}` |
| GET `/v1/admin/audit?before=ID`      | Owner only; 50 entries, descending cursor                                                                            |

Search supports exact full name (case folded), canonical phone or coupon. Prefix/substring name search is intentionally not provided because names are encrypted and lookup tokens keyed. Filters: all, issued, redeemed, expired, voided, zero. Sorting: newest, oldest, score. No export or bulk/void control is exposed without a separate requirement.

Redemption checks the immutable policy snapshot, expiration and state. Staff attest customer/new-offer facts; no membership database exists to verify them automatically. SQL conditional update plus unique redemption row permits one winner. Repeat identical requests return the already stored result; a new conflicting request fails. This does **not** create a membership or financial transaction.

## Database schema

Schema version 1 is a new, isolated database. No existing database is migrated. The service must use a private local disk, never a public/static directory or network filesystem.

| Table                            | Purpose and principal constraint                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| `schema_version`                 | Explicit schema version; future changes require reviewed migration/rollback                |
| `verified_phone_identities`      | Unique keyed phone hash, encrypted number, latest verification                             |
| `phone_verifications`            | Hashed opaque ID, encrypted number, ten-minute expiry, five code attempts                  |
| `browser_sessions`               | Hashed token, identity FK, 24-hour expiry                                                  |
| `discount_policy_versions`       | Immutable JSON per version; changing existing version rejected                             |
| `challenge_sessions`             | Unique phone identity, bank/policy version, status, score 0–3, attribution                 |
| `challenge_session_questions`    | PK(session,ordinal 1–3), unique(session,question), frozen document/options, deadline check |
| `challenge_answers`              | PK(session,ordinal), FK to selected question, accepted choice or timeout                   |
| `participants`                   | Unique session and phone; encrypted name/email/consent, keyed exact-name search            |
| `coupons`                        | Unique participant/session/code hash; encrypted code; 10/20/30 only; issue/expiry/state    |
| `coupon_redemptions`             | Unique coupon and request key; administrator FK, timestamp, eligibility attestation        |
| `admin_users`                    | Unique email, Argon2id, encrypted TOTP, replay step, role/disabled flag                    |
| `admin_sessions`                 | Hashed session/CSRF, absolute expiry and idle timestamp                                    |
| `audit_logs`                     | Actor, action, opaque reference and time; no raw submitted content                         |
| `email_delivery_jobs`            | Unique(session,audience), queued/sending/accepted/uncertain/failed, bounded retries        |
| `conversion_events`              | Unique event key; typed internal event and bounded attribution                             |
| `rate_limits` / `gateway_nonces` | Durable abuse controls / signed-request replay prevention                                  |
| `idempotency_records`            | Scoped unique key, payload fingerprint, response marker                                    |

The reviewed question bank is a versioned backend JSON artifact, rather than a mutable `challenge_questions` table. Attempts persist selected snapshots, so a later content update cannot alter an existing result. Versioned content is easier to review and never distributed as a browser bundle.

SQLite uses foreign keys, WAL, `synchronous=FULL`, 150 ms busy timeout and short `BEGIN IMMEDIATE` transactions. Indexed session, coupon, participant, email and event lookups bound normal work. One database writer remains the scaling constraint. `SQLITE_BUSY` produces a safe retryable 503; no writes are silently discarded.

## Abuse limits and safe errors

OTP request: 3/phone/10 min, 6/phone/day, 10/IP/hour, 100 globally/hour. Verify: 25/IP/10 min and five attempts per verification. Login: 5/account and 10/IP per 15 min; two concurrent password checks. API: 180/IP/min. Event: 20/IP/min. Admin coupon lookup: 30/admin/min. Limits are application defaults, not an approved SMS spending budget or DDoS guarantee.

Errors include `invalid_request`, `invalid_phone`, `invalid_verification`, `verification_unavailable`, `verification_required`, `invalid_login`, `authentication_required`, `forbidden`, `blocked`, `rate_limited`, `busy`, `idempotency_conflict`, `already_registered`, `coupon_not_found`, `coupon_unavailable`, `policy_mismatch`, and `unavailable`. Retries never create extra attempts, participants or coupons.
