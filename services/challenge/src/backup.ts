import { resolve } from 'node:path';
import { existsSync, chmodSync } from 'node:fs';
import Database from 'better-sqlite3';
import { readConfig } from './config.ts';
process.umask(0o077);
const c = readConfig();
const destination = process.argv[2];
if (!destination || existsSync(destination) || resolve(destination) === resolve(c.CHALLENGE_DB))
  throw new Error('Supply a new private backup destination');
const db = new Database(c.CHALLENGE_DB, { readonly: true, fileMustExist: true });
try {
  await db.backup(destination);
  chmodSync(destination, 0o600);
  const copy = new Database(destination, { readonly: true, fileMustExist: true });
  try {
    if (copy.pragma('integrity_check', { simple: true }) !== 'ok')
      throw new Error('Backup integrity failed');
  } finally {
    copy.close();
  }
  console.log(
    'Snapshot verified locally. Encryption, off-host storage and restore testing are separate required steps.',
  );
} finally {
  db.close();
}
