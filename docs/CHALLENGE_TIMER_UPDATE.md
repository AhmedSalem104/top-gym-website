# Ten-second questions and persistent logo entry — 7 November 2026

The owner explicitly requested increasing each question from five to ten seconds. This changes the server deadline, public information contract, Arabic/English instructions and browser progress together. It does not change scores, discounts, prices, contact data or participation eligibility.

## Timing and storage

`services/challenge/src/timing.ts` defines 10,000 ms for new attempts. Three rounds are persisted at the start. Early answers start the next round at server receipt; timeouts start it at the previous deadline. The browser derives progress from `deadlineAt - startsAt`, with a bounded scale, and cannot change backend time. The 30-second unanswered sequence survives refresh/disconnection. Receipt exactly at the deadline is rejected.

Schema v3 rebuilds the selected-question table inside an immediate transaction, retaining all rows and dependent indexes/triggers. Foreign keys are disabled outside the transaction, checked before commit and restored afterward. Both old 5,000 ms and new 10,000 ms rows remain valid; active historical attempts keep their original duration. No recorded answers, participants, coupons or deadlines are rewritten. The migration follows [SQLite's documented table-rebuild procedure](https://www.sqlite.org/lang_altertable.html#making_other_kinds_of_table_schema_changes).

Before backend release, make and validate an online snapshot. Deploy the tested image to only the existing challenge container; keep admissions closed and all private configuration intact. Verify schema version, integrity, foreign keys, unchanged business-row counts and public `seconds:10`. Retain the previous image/container. If rollback is required, preserve the live database: do not restore an old snapshot over new records. The former engine must not serve new ten-second attempts; keep admissions closed until the forward fix is verified.

## Logo failure reproduced

Production tests with exactly five coordinate clicks/taps passed on `/`, `/ar/`, `/en/`, before/after scrolling, at 390/1440px. A rapid sixth tap reproducibly closed the newly opened password dialog because it landed on the backdrop. This can make entry appear to do nothing. Both mouse and emulated touch reproduced the issue; this does not prove every reported browser failure has the same cause.

The password prompt now stays open on backdrop clicks. Explicit Close and Escape still clear entered credentials and restore logo focus; server authentication is unchanged. Regression tests send eight rapid clicks at fixed screen coordinates, not relocating locator clicks that conceal the issue. No new password or authentication bypass is introduced.

## Validation and availability

Focused checks cover ten-second API metadata, acceptance at 9,999 ms, rejection at 10,000 ms, persistent retry/refresh deadlines, a 30-second timeout, legacy database migration with child answers/coupons, restored foreign keys and repeat startup. Browser checks cover localized instructions, bounded timer progress, rapid mouse/touch entry, deliberate close and existing authentication/keyboard/reduced-motion behavior. Exact release results are recorded in the PR after execution.

Live diagnosis before this release: the public API returned HTTP 200 with `available:false`, `terms:null`, `mode:live`, and `seconds:5`. The frontend is connected to the backend. Admissions are deliberately closed because no approved commercial policy or reviewed private question bank is installed. Publishing the UI or changing the timer does not activate a coupon campaign. No test fixtures or invented terms may substitute for those inputs.

Local verification passed: 55 backend tests, 63 website/BFF unit tests, 38 challenge/admin browser tests, typecheck (95 files, zero diagnostics), lint, formatting, build and SEO. The Linux image passed 54 tests with one private-bank test intentionally skipped. The opt-in local screenshots contain synthetic content, not a live offer: [Arabic mobile](evidence/challenge-timer/intro-ar-390.webp), [English desktop](evidence/challenge-timer/intro-en-1440.webp). Protected CI and production verification are recorded separately in the release PR.

The isolated backend release `top-gym-challenge:20261107-ten-second` passed the online snapshot, schema-v3 migration, integrity and foreign-key checks. Existing session/participant/coupon counts remained zero, and the other application health/configuration checks passed. The public Vercel gateway now reports `seconds:10` with admissions still closed. The previous backend container and validated snapshot are retained; no password rotation or business-data deletion occurred.
