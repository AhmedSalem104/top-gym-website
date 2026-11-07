# Backend installation and activation history — 7 November 2026

> Current production state is recorded in [CHALLENGE_LIVE_STATUS.md](CHALLENGE_LIVE_STATUS.md). The service was activated after the later owner instruction; the initial closed-admissions notes below are historical baseline evidence.

The owner asked to continue after the missing backend configuration was diagnosed. This authorizes the isolated backend installation, secure Vercel connection and acceptance work. It does **not** supply commercial coupon terms or attest that draft questions have been reviewed.

## Installed infrastructure

- A dedicated `top-gym-challenge` container now runs on the authorized VPS, separate from the existing applications. Native Linux tests run during the image build. The official Node 24.21.0 base is pinned by digest.
- Runtime limits: one CPU, 512 MiB, 100 PIDs; UID/GID 1000, read-only root, no capabilities, no privilege escalation, loopback-only port 4400 and bounded container logs. The initial observed idle footprint was 32.62 MiB / 0.22% CPU; this is one observation, not a capacity benchmark.
- Private configuration is in `/etc/top-gym-challenge/production.env`; SQLite is `/var/lib/top-gym-challenge/challenge.sqlite`. Bank/policy directories are mounted read-only. No draft bank, invented terms, test administrator or public answer key was deployed.
- The service starts with admissions explicitly closed and no bank file. Only an absent file is tolerated in this state. Enabling admissions without a bank still fails startup; supplied corrupt/unreviewed files still fail even with admissions closed. `/health` indicates process health; signed `/v1/challenge/info` truthfully reports `available:false`.
- A separate, additive Caddy site handles the VPS IP. Existing application/storage configurations are byte-identical and their health remained successful. Caddy was gracefully reloaded, not upgraded or stopped.
- A publicly trusted Let's Encrypt IP certificate was issued after a successful staging issuance. TLS validation is enabled end to end. A six-hour systemd renewal timer is installed; its first normal check succeeded. Certificate management uses a pinned Certbot 5.4.0 image and a dedicated webroot, without stopping port 80/443 services.
- The three server-only Vercel variables are configured: `CHALLENGE_BACKEND_URL`, `CHALLENGE_ORIGIN`, `CHALLENGE_GATEWAY_KEY`. PR #24 deployed them successfully. The subsequent [visibility correction](CHALLENGE_VISIBILITY.md) enables the public interface independently of admissions; content/business inputs below still control participation.

IP certificates require short lifetimes and automated renewal; see [Let's Encrypt's Certbot instructions](https://letsencrypt.org/2026/03/11/shorter-certs-certbot). The shared Caddy instance reads the managed certificate files, and the renewal wrapper validates/reloads Caddy only after the certificate changes. A dedicated DNS hostname can replace the IP later without changing the browser's same-origin API.

## Private operations handoff

The later owner request changes normal access to a five-click logo password dialog. [Current access and rotation procedure](ADMIN_ACCESS.md) supersedes required-authenticator instructions in the original installation record below. Other service configuration remains unchanged.

An owner account uses a newly generated strong password and TOTP seed. No bootstrap values are retained in the service environment or Git. The private administrator enrollment and separate service-key backup are in the owner's restricted local `Documents/TOP GYM Private/activation-20261107` directory. Never attach these files to an issue/PR or a public page. The administrator must enroll the seed in their authenticator before normal use. Participant OTP remains removed.

Existing authorized Gmail configuration was transferred through encrypted SSH into the private service environment without printing it. One clearly labeled technical test was sent from the VPS using the real notification template, with no participant/coupon creation. SMTP acceptance and exactly one INBOX match were independently confirmed using read-only IMAP and the exact Message-ID. No unrelated mail was fetched or marked read. Gmail visual rendering was not newly inspected.

An online SQLite snapshot was made, reopened independently, integrity/foreign keys checked and the encrypted administrator seed successfully decrypted with the existing key. Participant, challenge-session and coupon counts were all zero. An AES-256-GCM encrypted copy was also saved in the restricted local handoff directory, with its separate random backup key outside the `backups` subdirectory. This is an initial recovery copy, not a claim of a completed recurring disaster recovery policy. The server snapshot lives under `/var/backups/top-gym-challenge`; retention, recurring encrypted off-host storage and owner recovery procedures still need final policy.

## Acceptance evidence

- Local typecheck: 91 files, zero diagnostics; lint, build and 62 website/BFF unit tests passed.
- Backend: 48 local tests passed. Linux container build: 47 passed, one skipped because the private question bank is intentionally absent. Native SQLite, Argon2, persistence, concurrent redemption and the new closed-startup tests passed.
- Real trusted HTTPS and signed API requests passed; unsigned requests returned 403. Enrollment remains 503 while closed, and no identity/coupon is created.
- Real owner password + TOTP login, authenticated summary, CSRF-protected logout and rejection after logout passed. Unauthorized administration was denied.
- SMTP acceptance, exactly one matching Gmail inbox message and the initial restore drill passed.
- Protected CI, final Vercel deployment and public API results belong in the release PR; do not infer them from these local/backend checks.

No frontend layout or business content changed in this infrastructure release. The local opt-in challenge preview remains available for design review; it is not a production promotion target.

## Still required for participation

1. Owner's coupon rules: eligible packages and durations, expiry, new-customer restriction and whether offers combine. The owner has been asked; no answer has been assumed.
2. Scientific and bilingual review of all 300 private draft questions, with real sources and reviewer provenance. No review status was falsely promoted. See [QUESTION_BANK.md](QUESTION_BANK.md).
3. Owner operational acceptance: password-only owner access, privacy/retention and backup destinations, and the documented timed-question accessibility/latency tradeoff (now ten seconds at the owner’s request).

After those inputs: install the actual private reviewed bank and policy; run isolated final journey/restore checks; restart only this service with admissions enabled; verify an authorized real end-to-end submission and monitor. `PUBLIC_CHALLENGE_ENABLED=true` exposes the interface, not permission to issue coupons. Deployment permission already exists; do not request it again.

## Rollback

Keep the public UI disabled and admissions closed if acceptance fails. Preserve the database and all three keys. To undo this first installation, stop only `top-gym-challenge` and remove only its added Caddy site after validating the resulting configuration; keep private data and certificates for recovery. Do not modify other application files, remove shared Docker volumes, or restore an older database over redeemed coupons. Keep the pinned image and source release for reproducible recovery.
