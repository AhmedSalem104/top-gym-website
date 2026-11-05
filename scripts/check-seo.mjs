import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { join } from 'node:path';

// Reserved .invalid test origin. Never used in dist/ or represented as a business domain.
const origin = 'https://top-gym.test.invalid';
const astroPackage = JSON.parse(await readFile('node_modules/astro/package.json', 'utf8'));
const result = spawnSync(
  process.execPath,
  [join('node_modules/astro', astroPackage.bin.astro), 'build', '--outDir', '.local/seo-fixture'],
  {
    env: { ...process.env, SITE_URL: origin, PUBLIC_INDEXABLE: 'true' },
    stdio: 'inherit',
  },
);
assert.equal(result.status, 0, 'SEO fixture build must pass');
for (const locale of ['ar', 'en']) {
  const html = await readFile(`.local/seo-fixture/${locale}/index.html`, 'utf8');
  assert.ok(html.includes(`rel="canonical" href="${origin}/${locale}/"`));
  assert.ok(html.includes('name="robots" content="index, follow"'));
  assert.equal((html.match(/rel="alternate"/g) ?? []).length, 3);
  assert.ok(html.includes(`property="og:image" content="${origin}/media/social-share.jpg"`));
  assert.ok(html.includes('"@type":"ExerciseGym"'));
  assert.ok(!html.includes('openingHoursSpecification'));
}
const robots = await readFile('.local/seo-fixture/robots.txt', 'utf8');
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
const sitemap = await readFile('.local/seo-fixture/sitemap.xml', 'utf8');
assert.ok(sitemap.includes(`${origin}/ar/`) && sitemap.includes(`${origin}/en/`));
const normalBuild = await readFile('dist/ar/index.html', 'utf8');
assert.ok(
  !normalBuild.includes(origin),
  'Review output must remain separate from test-origin output',
);
console.log('Production-metadata fixture checks passed; dist/ unchanged.');
