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
  assert.ok(html.includes('name="robots" content="index, follow, max-image-preview:large"'));
  assert.equal((html.match(/rel="alternate"/g) ?? []).length, 3);
  assert.ok(html.includes(`property="og:image" content="${origin}/media/social-share.jpg"`));
  assert.ok(html.includes('property="og:image:type" content="image/jpeg"'));
  assert.ok(html.includes('name="twitter:image:alt"'));
  const jsonLd = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)?.[1];
  assert.ok(jsonLd, `${locale} page should include JSON-LD`);
  const graph = JSON.parse(jsonLd)['@graph'];
  assert.equal(graph.find((entity) => entity['@type'] === 'ExerciseGym')?.telephone.length, 2);
  assert.ok(graph.some((entity) => entity['@type'] === 'WebSite'));
  assert.equal(
    graph.find((entity) => entity['@type'] === 'WebPage')?.inLanguage,
    locale === 'ar' ? 'ar-EG' : 'en',
  );
  assert.ok(!html.includes('openingHoursSpecification'));
  assert.ok(!html.includes('"address"'), 'Do not publish an unverified address');
}
const robots = await readFile('.local/seo-fixture/robots.txt', 'utf8');
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
assert.ok(robots.includes('User-agent: *\nAllow: /\nDisallow: /api/'));
const sitemap = await readFile('.local/seo-fixture/sitemap.xml', 'utf8');
assert.ok(sitemap.includes(`${origin}/ar/`) && sitemap.includes(`${origin}/en/`));
assert.ok(sitemap.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'));
assert.ok(sitemap.includes('hreflang="ar-EG"') && sitemap.includes('hreflang="en"'));
assert.ok(sitemap.includes('hreflang="x-default"'));
assert.equal((sitemap.match(/<url>/g) ?? []).length, 2);
const indexNowKey = (await readFile('public/8f90ecc66028569f5c45b31c5b8253c2.txt', 'utf8')).trim();
assert.match(indexNowKey, /^[a-f0-9]{32}$/);
assert.equal(await readFile(`.local/seo-fixture/${indexNowKey}.txt`, 'utf8'), `${indexNowKey}\n`);
const normalBuild = await readFile('dist/ar/index.html', 'utf8');
assert.ok(
  !normalBuild.includes(origin),
  'Review output must remain separate from test-origin output',
);
assert.ok(normalBuild.includes('name="robots" content="noindex, nofollow"'));
assert.match(await readFile('dist/robots.txt', 'utf8'), /Disallow: \/\n/);
console.log('Production-metadata fixture checks passed; dist/ unchanged.');
