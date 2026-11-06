import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/prepare-wide-hero.mjs <downloaded-master>');
const bytes = await readFile(source);
const sha256 = createHash('sha256').update(bytes).digest('hex');
if (sha256 !== '009364cec6bd757dd8912c32e51349c9cbc7c5a794f0d9836422aee6c0500f7d')
  throw new Error('Source hash differs from the reviewed Risen Wang master.');
const metadata = await sharp(bytes).metadata();
if (metadata.width !== 4000 || metadata.height !== 2997)
  throw new Error('Expected the reviewed 4000 × 2997 Risen Wang photograph.');
const destinations = [];
for (const width of [480, 800, 1200, 1600]) {
  for (const format of ['avif', 'webp']) {
    const path = `public/media/promotional-gym-${width}.${format}`;
    const output = await sharp(bytes)
      .resize({ width, withoutEnlargement: true })
      .toFormat(format, { quality: format === 'avif' ? 62 : 88 })
      .toFile(path);
    destinations.push({ path, width: output.width, height: output.height, bytes: output.size });
  }
}
const provenance = {
  selectedAt: '2026-11-05',
  requestedByOwner:
    'Use a new high-quality photograph of a spacious real gym from an external source.',
  author: 'Risen Wang',
  source: 'https://unsplash.com/photos/gym-equipment-inside-room-20jX9b35r_M',
  download: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?fm=jpg&q=95&w=4000',
  license: 'https://unsplash.com/license',
  licenseReviewedAt: '2026-11-05',
  licenseSummary: 'Unsplash License permits free commercial use; no endorsement is implied.',
  master: { sha256, bytes: bytes.length, width: metadata.width, height: metadata.height },
  review:
    'Real gym photograph; no people observed, including windows/reflections. Promotional imagery, not the TOP GYM premises. The monochrome appearance is present in the downloaded source.',
  processing:
    'Resize and AVIF/WebP encoding only. No crop, recoloring, generative editing or equipment changes. Master is preserved privately.',
  destinations,
};
await writeFile('docs/hero-media.json', JSON.stringify(provenance, null, 2) + '\n');
const manifestPath = 'docs/asset-manifest.json';
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
manifest.assets = manifest.assets.filter((asset) => asset.source !== provenance.source);
manifest.assets.push({
  source: provenance.source,
  ...provenance.master,
  destinations: destinations.map((item) => item.path),
  decision:
    'Owner-requested external promotional hero. Reviewed Unsplash License; separate from real TOP GYM photography. Owner removed the visible caption on 2026-11-06; promotional alternative text and provenance remain. See hero-media.json.',
});
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(provenance));
