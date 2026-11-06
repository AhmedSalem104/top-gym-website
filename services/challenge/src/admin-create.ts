import { z } from 'zod';
import { readConfig } from './config.ts';
import { Store } from './db.ts';
import { Admin } from './admin.ts';
process.umask(0o077);
const email = z.email().parse(process.env.CHALLENGE_BOOTSTRAP_EMAIL);
const password = z.string().min(14).max(128).parse(process.env.CHALLENGE_BOOTSTRAP_PASSWORD);
const secret = z
  .string()
  .regex(/^[A-Z2-7]{32,64}$/)
  .parse(process.env.CHALLENGE_BOOTSTRAP_TOTP);
const store = new Store(readConfig());
try {
  await new Admin(store).create(email, password, secret);
  console.log(
    'Administrator created. Remove bootstrap environment values. No credentials were printed.',
  );
} finally {
  store.close();
}
