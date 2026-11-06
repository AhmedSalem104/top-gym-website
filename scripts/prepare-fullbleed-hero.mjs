import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/prepare-fullbleed-hero.mjs <owner-supplied-png>');
const bytes = await readFile(source);
const hash = (data) => createHash('sha256').update(data).digest('hex');
const sha256 = hash(bytes);
if (sha256 !== '9c2e10b706f96a854bdcec9cf6fc65ed6793bdc7b6b0e8e94c58d0c8f7579b9a')
  throw new Error('Source differs from the reviewed owner-supplied Hero image.');
const metadata = await sharp(bytes).metadata();
if (metadata.width !== 1672 || metadata.height !== 940)
  throw new Error('Expected the reviewed 1672 × 940 image.');
const mobileCrop = { left: 350, top: 0, width: 704, height: 940 };
const destinations = [];
for (const variant of ['wide', 'mobile']) {
  for (const width of variant === 'wide' ? [768, 1200, 1672] : [360, 704]) {
    for (const format of ['avif', 'webp']) {
      const path = `public/media/top-gym-hero-${variant}-${width}.${format}`;
      let pipeline = sharp(bytes);
      if (variant === 'mobile') pipeline = pipeline.extract(mobileCrop);
      const { data, info } = await pipeline
        .resize({ width, withoutEnlargement: true })
        .toFormat(format, { quality: format === 'avif' ? 58 : 84 })
        .toBuffer({ resolveWithObject: true });
      await writeFile(path, data);
      destinations.push({
        path,
        width: info.width,
        height: info.height,
        bytes: data.length,
        sha256: hash(data),
      });
    }
  }
}
const provenance = {
  selectedAt: '2026-11-06',
  source: 'Luxury Gym with Golden Top Gym Emblem.png',
  authorization:
    'Owner explicitly supplied this local image as the Hero background during the full-width redesign.',
  master: { sha256, bytes: bytes.length, width: metadata.width, height: metadata.height },
  review:
    'Owner-supplied promotional gym visual with an embedded gold TOP GYM emblem. No people observed. Not independently verified as a photograph of TOP GYM premises; do not describe it as authentic facility photography. The separate original brand logo remains unchanged.',
  processing:
    'Resize/AVIF/WebP encoding and the documented mobile crop only. No generative edits, retouching, recoloring, equipment changes, logo reconstruction or source overwrite. Master remains in the owner Downloads directory outside Git.',
  mobileCrop,
  destinations,
};
await writeFile('docs/hero-fullbleed-media.json', JSON.stringify(provenance, null, 2) + '\n');
const manifestPath = 'docs/asset-manifest.json';
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
manifest.assets = manifest.assets.filter((asset) => asset.source !== provenance.source);
manifest.assets.push({
  source: provenance.source,
  ...provenance.master,
  destinations: destinations.map((item) => item.path),
  decision:
    'Owner-authorized promotional Hero background. Original preserved privately; mobile crop and output hashes recorded in hero-fullbleed-media.json. No claim that the visual depicts actual TOP GYM premises.',
});
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ master: provenance.master, destinations }));
