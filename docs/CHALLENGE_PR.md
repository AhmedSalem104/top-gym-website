# Draft PR: feat(challenge): add gated bilingual fitness challenge and secure coupon service

TOP GYM currently has no server-authoritative challenge or coupon workflow. This change adds an opt-in bilingual challenge, separate Fastify/SQLite backend, same-origin signed Vercel BFF, verified-phone adapter, persisted five-second questions, atomic 0/10/20/30% scoring/coupons, private lead capture, MFA-protected administration, single-use redemption and durable branded email notifications.

The public feature remains disabled. The public repository intentionally excludes the actual 300-question/answer artifact; its local draft requires qualified review. No membership/payment portal or unrelated section redesign is included.

Validation and screenshots: [CHALLENGE_QA.md](CHALLENGE_QA.md). Architecture, secure configuration, remaining business decisions and operations: [CHALLENGE.md](CHALLENGE.md).

Only Gate 1 local implementation was approved. Do not merge/deploy. A branch push may trigger Vercel Preview, so the remote branch/PR must wait for approved Gate 2 scope. Gate 3 production requires separate explicit authorization.
