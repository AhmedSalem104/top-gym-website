import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');
const origin = process.env.SITE_URL;
if (
  origin &&
  (new URL(origin).protocol !== 'https:' ||
    new URL(origin).pathname !== '/' ||
    new URL(origin).username ||
    new URL(origin).password ||
    new URL(origin).search ||
    new URL(origin).hash)
) {
  throw new Error('SITE_URL must be an HTTPS origin without a path.');
}
export default defineConfig({
  site: origin,
  output: 'static',
  trailingSlash: 'always',
  vite: { plugins: [tailwindcss()] },
});
