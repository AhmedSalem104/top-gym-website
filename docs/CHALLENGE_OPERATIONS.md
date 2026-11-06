# Challenge operations and release gates

## Environment and isolation

Gate 1 local implementation only is authorized. No VPS container, database, DNS, certificate, user, package or directory was created. Gate 2 requires an isolated staging target and state-changing test approval; Gate 3 is separate. Earlier standing website publication authorization does not override these gates.

Proposed live data location: `/var/lib/top-gym-challenge/challenge.sqlite`, on local ext4 outside web roots and separate from LogicFit. Staging needs different storage, keys, origin, OTP service and recipient inbox. Do not use production customer data or implicitly repair unrelated services/backups.

## Packaging

`services/challenge` has its own npm lockfile. The Docker template compiles native SQLite/Argon2 on Linux, builds TypeScript, prunes dev dependencies and runs as UID/GID 1000. Compose proposes a read-only root, dropped capabilities, no privilege escalation, private writable data, read-only policy/bank, one CPU, 512 MiB RAM, 100 PIDs and rotated logs. These are initial limits, not measured campaign capacity.

The Docker CLI exists locally but its Linux daemon was unavailable. **Docker/Compose/Caddy templates were not executed or validated on Linux.** Build/scan and pin approved base/release digests in staging. Verify native-module startup. Private reviewed questions are mounted at runtime and never baked into a public image. Unreviewed banks fail startup intentionally.

## Configuration

Frontend build uses `PUBLIC_CHALLENGE_ENABLED=false` by default. Opt in only for approved previews/releases. Admin routes are omitted when false.

Vercel server-only settings: `CHALLENGE_BACKEND_URL` (approved HTTPS origin), `CHALLENGE_ORIGIN` (exact frontend origin), `CHALLENGE_GATEWAY_KEY` (shared private 32-byte hex signing key). No backend database or SMTP credential is needed in this BFF.

The VPS `.env.example` documents:

- Runtime: `NODE_ENV=production`, host `0.0.0.0` inside the isolated container, port 4400, private DB/bank/policy paths.
- `CHALLENGE_ENABLED`: admission switch; false stops new attempts while existing verified sessions may recover/finalize.
- `CHALLENGE_ALLOW_DRAFT_BANK=false`; production rejects mock OTP and drafts regardless of flags.
- Three different random 32-byte hex `CHALLENGE_DATA_KEY`, `CHALLENGE_HASH_KEY`, `CHALLENGE_GATEWAY_KEY`. Keep keys separately backed up; loss makes protected data unrecoverable.
- Rotate encryption/lookup keys only through an explicitly reviewed data migration. Blind replacement would break decryption and canonical phone uniqueness; do not treat it as an ordinary environment edit.
- `OTP_PROVIDER=disabled` until approved. Twilio Verify is an implemented option, with private account/auth/service configuration. No account, SMS purchase or live verification occurred.
- Gmail host `smtp.gmail.com`, port 465 TLS or 587 STARTTLS, private `SMTP_USER`, `SMTP_APP_PASSWORD`, `CHALLENGE_ADMIN_EMAIL`. Customer email stays disabled until approved.

Use a private secret manager or mode-0600 file outside checkout. Never paste secrets into chat/PRs, print environment values or use `PUBLIC_` for private settings. Existing feedback secrets were not copied; configure the new service securely when approved.

The policy example intentionally fails validation. Required commercial choices: version/approval date, expiry, packages, durations, first-time status, combining offers and bilingual terms. Allowed expiry bounds of 1–366 days are validation limits, not an owner-approved offer.

## HTTPS and administrator access

Prefer an approved DNS hostname with a publicly trusted certificate and additive Caddy reverse proxy to loopback port 4400. The template assumes the observed host-network Caddy topology; adapt if topology changes. Never overwrite the shared Caddy configuration or expose the backend port publicly. No DNS/certificate action is authorized yet. Raw-IP HTTPS needs a trusted certificate for the exact IP plus reliable renewal; none was verified.

The browser uses same-origin Vercel; the backend validates signed requests, freshness, nonce replay and payload. Direct browser CORS access is not enabled. Never disable TLS verification or trust arbitrary forwarded IP headers outside this path.

`admin:create` reads bootstrap email/password/TOTP from the private environment and prints no credential. Run as the service account after approval, then remove bootstrap variables. Password minimum is 14 characters. Enroll a securely generated TOTP seed privately. Never deploy local test credentials. Roles are viewer/redeemer/owner; role changes, account disable and identity-checked MFA recovery are controlled operational actions, not public self-service APIs. The five-click link grants no authorization.

## Notifications

Registration stores unique outbox jobs atomically. One guarded worker sends outside DB transactions. Fixed authenticated sender, optional validated Reply-To, TLS verification, escaped HTML, plain text, Cairo time and no trackers are enforced.

States: queued → sending → accepted; definitive failures retry with bounded backoff up to five attempts. Ambiguous timeout/interrupted sends become **uncertain**, never blindly resent. Review authorized inbox/provider evidence before any manually approved retry. Dashboard exposes queue/failure counts. Accepted means SMTP accepted, not confirmed inbox delivery. A mail outage never rolls back a valid coupon.

Real Gmail acceptance, inbox placement and Gmail light/dark rendering remain staging checks. `npm run challenge:email` generates 16 labeled samples without sending. Customer emails require both approval/configuration and an actually provided address.

## Backup, restore and retention

SQLite WAL needs local storage and still has one writer; see [SQLite WAL](https://sqlite.org/wal.html). Use the [online backup API](https://sqlite.org/backup.html), not a copy of a live database that ignores its WAL.

1. Run `node dist/backup.js /private/backup/new-name.sqlite` in the private backend environment. It refuses overwrite/source replacement, applies private permissions and checks integrity.
2. Encrypt snapshots and transfer to an approved off-host destination. Back up keys separately with access control. Approve retention/rotation and alert on backup failure/age.
3. Restore to a **new isolated directory**; check integrity and foreign keys, decrypt synthetic records and verify existing attempts/redemptions. Never overwrite a live database for a test.
4. Measure RPO/RTO in an actual drill. Local tests verified online snapshot and restored identity/coupon recovery, not off-host disaster recovery.

Expired temporary sessions/nonces/rate limits are cleaned. Participant/audit retention and erasure require approved policy. Deleting identity history conflicts with permanent one-attempt enforcement; do not promise both without a defined permitted retention mechanism. AES-GCM protects sensitive columns, not the whole database. Encrypt off-host copies; metadata and admin email remain readable to a database-file holder.

## Monitoring, capacity and rollback

Monitor health, p95/p99 request latency, status/error counts, SQLite busy events, event-loop delay, memory/CPU, disk/WAL, NTP, OTP failure/spending, email queue age/failures and backup age. Logs must not contain headers, cookies, OTPs, bodies, URL search PII or customer messages. Request logging is disabled; operational errors use stable codes.

No throughput or campaign-size guarantee is claimed. Staging must test finite bursts with synthetic participants and mocked paid providers under the proposed limits. If write contention grows, control admissions or plan a server database; never share WAL over NFS or add uncoordinated hosts.

Release sequence:

1. Approve Gate 2 target, cost controls, policy, reviewed bank, privacy/retention and operators.
2. Build/scan immutable Linux image, provision isolated secrets/mounts, add only approved DNS/TLS/proxy configuration.
3. Verify HTTPS/BFF/cookies, MFA, real OTP and authorized email, backups/restore, bursts, accessibility and website regressions.
4. Present evidence and a concrete Gate 3 release proposal; do not merge automatically.
5. After Gate 3, back up, deploy backend with admissions off, verify, publish approved frontend, enable admissions and monitor.
6. Roll back by disabling admissions and restoring the previous compatible image/frontend. Preserve DB, keys, results and redemptions. Never recreate the DB or blindly restore an old backup that could re-enable spent coupons. Future schema changes need tested migrations and rollback/forward-recovery plans.

A public branch push may trigger Vercel Preview. Until Gate 2 scope is approved, keep the verified commit local rather than implicitly deploying a remote preview.
