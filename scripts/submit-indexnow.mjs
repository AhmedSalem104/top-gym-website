import { readFile } from 'node:fs/promises';

const productionOrigin = 'https://top-gym-website.vercel.app';
const configuredOrigin = process.env.SITE_URL || productionOrigin;
const origin = new URL(configuredOrigin);
if (origin.origin !== productionOrigin || origin.pathname !== '/') {
  throw new Error(`IndexNow is restricted to ${productionOrigin}`);
}

const key = (await readFile('public/8f90ecc66028569f5c45b31c5b8253c2.txt', 'utf8')).trim();
const response = await globalThis.fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: origin.host,
    key,
    keyLocation: `${origin.href}${key}.txt`,
    urlList: [`${origin.href}ar/`, `${origin.href}en/`],
  }),
});

if (!response.ok) {
  throw new Error(`IndexNow rejected the URL notification (HTTP ${response.status})`);
}

console.log(`IndexNow accepted the Arabic and English TOP GYM URLs (HTTP ${response.status}).`);
