// Local/CI build only: opt-in public shell; no remote service or deployment.
import { spawnSync } from 'node:child_process';
const result = spawnSync(
  process.execPath,
  ['node_modules/astro/bin/astro.mjs', 'build', '--outDir', '.local/challenge-preview'],
  {
    stdio: 'inherit',
    env: { ...process.env, PUBLIC_CHALLENGE_ENABLED: 'true' },
  },
);
process.exit(result.status ?? 1);
