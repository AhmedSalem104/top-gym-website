# Direct phone entry and compact invitation — 7 November 2026

Infrastructure follow-up: the authorized backend is now installed with trusted HTTPS, private Gmail configuration and an owner account. See [CHALLENGE_ACTIVATION.md](CHALLENGE_ACTIVATION.md). Actual coupon terms and reviewed content remain outstanding; the public challenge is not yet active.

The owner explicitly requested removal of participant OTP and post-quiz email collection, a clearer animated invitation, a smaller dialog, and production publication. This supersedes the earlier OTP requirement. Administrator password/TOTP authentication is unrelated and remains intact.

## Experience

- Filled brand-gold invitation, trophy, two-line membership-discount label and an explicit **up to 30%** cap. A compositor-only light sweep runs twice for 4.4 seconds total, then stops; hover/press remain responsive. Reduced motion disables it. Hidden tabs and an open dialog pause the invitation.
- Dialog maximum width reduced from 680 to 560 px and height from 820 to 620 px. Stable bounded geometry prevents question-to-question shifts; small screens and long results scroll inside the dialog. The title explicitly says the discount applies to the membership price in Arabic and English.
- Enter an Egyptian mobile number, continue, then deliberately start the three-question/ten-second challenge (duration increased by the owner on 7 November 2026). There is no SMS, provider dependency or participant verification endpoint.
- After questions, the only personal-information field is the name. Participation consent remains; optional marketing consent and email are removed. The server rejects extra email fields and creates only an administration notification job for new registrations.

## Identity and recovery

A typed number is **not proof of ownership**. Duplicate canonical numbers still cannot create a second identity or attempt, but anyone knowing a number could claim it first. Changing numbers remains a residual abuse risk; IP limits cannot identify an individual. Do not describe this policy as verified participation.

`POST /v1/challenge/enroll` takes `{phone}` plus a random UUID `Idempotency-Key`. The browser retains only that random retry secret in sessionStorage, never the phone or name. The server derives an opaque session token using its private HMAC key, stores only its hash and atomically creates the unique phone identity. Same-key retries recover the same enrollment for at most the original 24-hour session lifetime; neither retries nor changing the phone extend it. Different-key claims for an existing number return a generic `entry_unavailable` without a cookie, result or coupon.

Normal recovery uses the existing HttpOnly cookie. A phone number alone cannot retrieve a result. Another browser/device, cleared storage or expired sessions require contacting management; no new self-service phone-only recovery bypass was added. No automatic reset of attempts is provided.

Enrollment limits are 12/IP/hour, 8/number/hour and 200 globally/hour, in addition to the general API limit. They are initial configurable-in-code operational defaults, not a capacity or anti-abuse guarantee.

## Database compatibility

Schema version 2 renames the legacy `verified_phone_identities` table to `phone_identities` and `verified_at` to `registered_at`. Historical identities are marked `ownership_verified=1`; new direct entries explicitly use `0`. Foreign-key references follow the SQLite rename. Existing encrypted records, coupons, administrator credentials, session expiry and one-use redemption remain intact. Legacy verification rows, if present, are not destructively deleted and have no active route. A migration/foreign-key test covers the legacy shape.

Customer mail rendering is retained only for backward compatibility with already queued historical data; no new customer delivery job or customer-email collection can be created. The existing separate public feedback form is unchanged.

## Publication and activation status

The owner repeatedly authorized production activation. The feature is now live; current service checks and active terms are recorded in [CHALLENGE_LIVE_STATUS.md](CHALLENGE_LIVE_STATUS.md). The deployed question bank has an AI-assisted editorial/source review only, not qualified human review. OTP is not used for participants. New phone entries are unverified, as explicitly reflected in the application contract.

Production is active. Never deploy the local test harness, synthetic coupons or test administrator credentials. Preview at `http://127.0.0.1:4340/ar/` uses local-only data and sends no SMS or email.

## Verification

Focused backend coverage checks unique canonical phone entry, generic duplicate rejection, idempotent retry, non-extension of expiry, session secrecy, unverified provenance, historical migration, rejection of email/removed OTP routes, scoring and atomic redemption. Browser coverage checks no OTP/email fields, the complete entry-to-coupon flow, mobile/tablet/desktop RTL/LTR, keyboard/reduced motion and the smaller dialog. Before/after captures are in `evidence/challenge-entry/`; updated dialog/result captures remain in `evidence/challenge/`. Actual final test and deployment results are recorded in the release PR and progress log.

A persistent phone_entry_claims row retains the hashed retry token after browser-session cleanup. Expired keys cannot be recycled into another phone identity; the original expiry is immutable.
