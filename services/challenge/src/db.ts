import Database from 'better-sqlite3';
import { mkdirSync, chmodSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Config } from './config.ts';
import { digest, Fault } from './security.ts';

// Retain historical five-second rounds without rewriting deadlines or results.
const questionTable = (name: string) => `CREATE TABLE ${name} (
  session_id TEXT NOT NULL REFERENCES challenge_sessions(id),
  ordinal INTEGER NOT NULL CHECK(ordinal BETWEEN 1 AND 3),
  question_id TEXT NOT NULL, snapshot TEXT NOT NULL, option_order TEXT NOT NULL,
  starts INTEGER NOT NULL, deadline INTEGER NOT NULL,
  PRIMARY KEY(session_id, ordinal), UNIQUE(session_id,question_id),
  CHECK(deadline - starts IN (5000, 10000))
)`;

export class Store {
  readonly db: Database.Database;
  constructor(
    readonly config: Config,
    readonly now = () => Date.now(),
  ) {
    if (config.CHALLENGE_DB !== ':memory:')
      mkdirSync(dirname(config.CHALLENGE_DB), { recursive: true, mode: 0o700 });
    this.db = new Database(config.CHALLENGE_DB);
    if (config.CHALLENGE_DB !== ':memory:') chmodSync(config.CHALLENGE_DB, 0o600);
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('busy_timeout = 150');
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = FULL');
    this.db
      .transaction(() => {
        const legacy = this.db
          .prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='verified_phone_identities'",
          )
          .get();
        if (legacy) {
          this.db.exec('ALTER TABLE verified_phone_identities RENAME TO phone_identities');
          this.db.exec('ALTER TABLE phone_identities RENAME COLUMN verified_at TO registered_at');
          this.db.exec(
            'ALTER TABLE phone_identities ADD COLUMN ownership_verified INTEGER NOT NULL DEFAULT 1 CHECK(ownership_verified IN (0,1))',
          );
        }
      })
      .immediate();
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY);
      INSERT OR IGNORE INTO schema_version VALUES (2);
      CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS gateway_nonces (nonce TEXT PRIMARY KEY, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS phone_identities (id TEXT PRIMARY KEY, phone_hash TEXT UNIQUE NOT NULL, phone_cipher TEXT NOT NULL, registered_at INTEGER NOT NULL, ownership_verified INTEGER NOT NULL DEFAULT 0 CHECK(ownership_verified IN (0,1)));
      CREATE TABLE IF NOT EXISTS browser_sessions (token_hash TEXT PRIMARY KEY, phone_id TEXT NOT NULL REFERENCES phone_identities(id), expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS phone_entry_claims (token_hash TEXT PRIMARY KEY, phone_id TEXT UNIQUE NOT NULL REFERENCES phone_identities(id), expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS discount_policy_versions (version TEXT PRIMARY KEY, body TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS challenge_sessions (id TEXT PRIMARY KEY, phone_id TEXT UNIQUE NOT NULL REFERENCES phone_identities(id), policy_version TEXT NOT NULL REFERENCES discount_policy_versions(version), bank_version TEXT NOT NULL, locale TEXT NOT NULL CHECK(locale IN ('ar','en')), status TEXT NOT NULL CHECK(status IN ('active','completed','registered')), score INTEGER NOT NULL DEFAULT 0 CHECK(score BETWEEN 0 AND 3), started_at INTEGER NOT NULL, completed_at INTEGER, registered_at INTEGER, attribution TEXT NOT NULL);
      ${questionTable('IF NOT EXISTS challenge_session_questions')};
      CREATE TABLE IF NOT EXISTS challenge_answers (session_id TEXT NOT NULL, ordinal INTEGER NOT NULL, option_id TEXT, correct INTEGER NOT NULL CHECK(correct IN (0,1)), timed_out INTEGER NOT NULL CHECK(timed_out IN (0,1)), received_at INTEGER NOT NULL, request_key TEXT, PRIMARY KEY(session_id,ordinal), FOREIGN KEY(session_id,ordinal) REFERENCES challenge_session_questions(session_id,ordinal));
      CREATE TABLE IF NOT EXISTS participants (id TEXT PRIMARY KEY, session_id TEXT UNIQUE NOT NULL REFERENCES challenge_sessions(id), phone_id TEXT UNIQUE NOT NULL REFERENCES phone_identities(id), details_cipher TEXT NOT NULL, name_search TEXT NOT NULL, consent_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS coupons (id TEXT PRIMARY KEY, participant_id TEXT UNIQUE NOT NULL REFERENCES participants(id), session_id TEXT UNIQUE NOT NULL REFERENCES challenge_sessions(id), code_hash TEXT UNIQUE NOT NULL, code_cipher TEXT NOT NULL, discount INTEGER NOT NULL CHECK(discount IN (10,20,30)), state TEXT NOT NULL CHECK(state IN ('issued','redeemed','voided')), created_at INTEGER NOT NULL, expires INTEGER NOT NULL, CHECK(expires > created_at));
      CREATE TABLE IF NOT EXISTS admin_users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, totp_cipher TEXT NOT NULL, last_totp INTEGER NOT NULL DEFAULT -1, role TEXT NOT NULL CHECK(role IN ('viewer','redeemer','owner')), disabled INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY, admin_id TEXT NOT NULL REFERENCES admin_users(id), csrf_hash TEXT NOT NULL, expires INTEGER NOT NULL, touched INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS coupon_redemptions (coupon_id TEXT PRIMARY KEY REFERENCES coupons(id), admin_id TEXT NOT NULL REFERENCES admin_users(id), redeemed_at INTEGER NOT NULL, request_key TEXT UNIQUE NOT NULL, eligibility TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY, actor TEXT NOT NULL, action TEXT NOT NULL, reference TEXT NOT NULL, created_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS email_delivery_jobs (id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES challenge_sessions(id), audience TEXT NOT NULL CHECK(audience IN ('admin','customer')), state TEXT NOT NULL CHECK(state IN ('queued','sending','accepted','uncertain','failed')), attempts INTEGER NOT NULL DEFAULT 0, available_at INTEGER NOT NULL, locked_at INTEGER, last_code TEXT, UNIQUE(session_id,audience));
      CREATE TABLE IF NOT EXISTS conversion_events (id INTEGER PRIMARY KEY, event_key TEXT UNIQUE NOT NULL, type TEXT NOT NULL, session_id TEXT, attribution TEXT NOT NULL, created_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS idempotency_records (scope TEXT NOT NULL, key TEXT NOT NULL, fingerprint TEXT NOT NULL, response TEXT NOT NULL, PRIMARY KEY(scope,key));
      CREATE INDEX IF NOT EXISTS session_status ON challenge_sessions(status,started_at);
      CREATE INDEX IF NOT EXISTS coupon_status ON coupons(state,expires);
      CREATE INDEX IF NOT EXISTS participant_date ON participants(consent_at,id);
      CREATE INDEX IF NOT EXISTS participant_search ON participants(name_search);
      CREATE INDEX IF NOT EXISTS mail_due ON email_delivery_jobs(state,available_at);
      CREATE INDEX IF NOT EXISTS event_type ON conversion_events(type,created_at);
    `);
    try {
      this.migrateQuestionTiming();
    } catch (error) {
      this.db.close();
      throw error;
    }
  }
  private migrateQuestionTiming() {
    if (this.get('SELECT version FROM schema_version WHERE version=3')) return;
    // SQLite's table-rebuild migration: disable FKs outside the transaction,
    // retain all rows and child references, then validate before committing.
    this.db.pragma('foreign_keys = OFF');
    try {
      this.atomic(() => {
        if (this.get('SELECT version FROM schema_version WHERE version=3')) return;
        const dependencies = this.all<{ sql: string }>(
          "SELECT sql FROM sqlite_master WHERE tbl_name='challenge_session_questions' AND type IN ('index','trigger') AND sql IS NOT NULL",
        );
        this.db.exec(`
          ${questionTable('challenge_session_questions_v3')};
          INSERT INTO challenge_session_questions_v3 SELECT * FROM challenge_session_questions;
          DROP TABLE challenge_session_questions;
          ALTER TABLE challenge_session_questions_v3 RENAME TO challenge_session_questions;
        `);
        for (const dependency of dependencies) this.db.exec(dependency.sql);
        if (this.all('PRAGMA foreign_key_check').length)
          throw new Error('Question timing migration failed foreign-key validation');
        this.run('INSERT INTO schema_version VALUES(3)');
      });
    } finally {
      this.db.pragma('foreign_keys = ON');
    }
  }
  get<T>(sql: string, ...args: unknown[]): T | undefined {
    return this.db.prepare(sql).get(...args) as T | undefined;
  }
  all<T>(sql: string, ...args: unknown[]): T[] {
    return this.db.prepare(sql).all(...args) as T[];
  }
  run(sql: string, ...args: unknown[]) {
    return this.db.prepare(sql).run(...args);
  }
  atomic<T>(fn: () => T): T {
    return this.db.transaction(fn).immediate();
  }
  hash(value: string) {
    return digest(this.config.CHALLENGE_HASH_KEY, value);
  }
  limit(key: string, maximum: number, duration: number) {
    const now = this.now();
    const hashed = this.hash(key);
    const allowed = this.atomic(() => {
      this.run('DELETE FROM rate_limits WHERE key=? AND expires<=?', hashed, now);
      this.run(
        'INSERT INTO rate_limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1',
        hashed,
        now + duration,
      );
      return (
        this.get<{ count: number }>('SELECT count FROM rate_limits WHERE key=?', hashed)!.count <=
        maximum
      );
    });
    if (!allowed) throw new Fault('rate_limited', 429);
  }
  audit(actor: string, action: string, reference: string) {
    this.run(
      'INSERT INTO audit_logs(actor,action,reference,created_at) VALUES(?,?,?,?)',
      actor,
      action,
      reference,
      this.now(),
    );
  }
  event(key: string, type: string, session: string | null, attribution = '{}') {
    this.run(
      'INSERT OR IGNORE INTO conversion_events(event_key,type,session_id,attribution,created_at) VALUES(?,?,?,?,?)',
      key,
      type,
      session,
      attribution,
      this.now(),
    );
  }
  close() {
    this.db.close();
  }
}
