import { readConfig } from './config.ts';
import { loadBank } from './bank.ts';
import { createApp } from './app.ts';
import { deliverNext, smtpSender } from './mail.ts';

process.umask(0o077);
const config = readConfig();
const bank = loadBank(
  config.CHALLENGE_BANK_FILE,
  config.NODE_ENV !== 'production' && config.CHALLENGE_ALLOW_DRAFT_BANK === 'true',
);
const { app, engine, store } = createApp(config, bank);
let busy = false;
let pending: Promise<unknown> = Promise.resolve();
const timer = setInterval(() => {
  if (busy) return;
  busy = true;
  try {
    engine.sweep();
  } catch {
    console.warn('challenge_maintenance_failed');
  }
  pending = deliverNext(store, smtpSender(store))
    .catch(() => console.warn('challenge_worker_failed'))
    .finally(() => {
      busy = false;
    });
}, 1000);
timer.unref();
for (const signal of ['SIGTERM', 'SIGINT'])
  process.once(signal, () => {
    clearInterval(timer);
    void pending.finally(() => app.close());
  });
await app.listen({ port: config.CHALLENGE_PORT, host: config.CHALLENGE_HOST });
console.log(
  'Challenge API started; production activation requires approved policy, reviewed bank and verified delivery.',
);
