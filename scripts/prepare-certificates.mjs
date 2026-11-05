import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const source = process.argv[2];
if (!source)
  throw new Error('Usage: node scripts/prepare-certificates.mjs <extracted-source-root>');
const records = [
  ['02_tass_nutrition.jpg', 'tass-nutrition', [17, 1394, 190, 34]],
  ['03_pbls_personal_trainer.jpg', 'pbls-personal-trainer', [24, 1015, 112, 43]],
  ['04_tass_fitness_trainer.jpg', 'tass-fitness-trainer', [24, 1370, 192, 35]],
  ['05_pbls_nutrition.jpg', 'pbls-nutrition', [29, 1000, 126, 45]],
  ['06_titanium_certificate.jpg', 'titanium-training', [130, 1394, 230, 43]],
];
const output = resolve('public/media/certificates');
await mkdir(output, { recursive: true });
const manifest = JSON.parse(await readFile('docs/asset-manifest.json', 'utf8'));
for (const [filename, id, [left, top, width, height]] of records) {
  const original = await readFile(join(resolve(source), 'media/certificates', filename));
  const entry = manifest.assets.find((asset) => asset.source === `media/certificates/${filename}`);
  if (!entry || createHash('sha256').update(original).digest('hex') !== entry.sha256)
    throw new Error(`Source differs from reviewed copy: ${filename}`);
  // A visible opaque redaction replaces only the registration-number region.
  // No generative processing, recoloring, reconstruction, or source overwrites.
  const redacted = await sharp(original)
    .composite([
      { input: { create: { width, height, channels: 4, background: '#17191C' } }, left, top },
    ])
    .png()
    .toBuffer();
  await sharp(redacted)
    .webp({ lossless: true })
    .toFile(join(output, `${id}.webp`));
  await sharp(redacted)
    .resize({ width: 680, withoutEnlargement: true })
    .webp({ quality: 88 })
    .toFile(join(output, `${id}-preview.webp`));
  entry.destinations = [
    `public/media/certificates/${id}.webp`,
    `public/media/certificates/${id}-preview.webp`,
  ];
  entry.decision =
    'Owner requested visible certificates; publish supplied enhanced copy with opaque registration-number redaction. Original comparison and current trainer role remain unconfirmed.';
  entry.redaction = {
    left,
    top,
    width,
    height,
    method: 'Opaque pixels baked into every derivative before resizing; metadata stripped',
  };
}
for (const entry of manifest.assets.filter(
  (asset) => asset.source.includes('certificates/') && !asset.destinations.length,
)) {
  entry.decision = entry.source.includes('01_')
    ? 'Retained privately: overlapping identification cards duplicate published certificate subjects and contain extra personal data'
    : 'Retained privately: alternate version of a published PBLS subject; not counted as an additional qualification';
}
manifest.policy =
  'Original archives and unredacted certificates stay outside Git. Published certificate copies contain baked-in registration-number redactions. No original overwritten.';
await writeFile('docs/asset-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`Prepared ${records.length} privacy-safe certificate pairs; sources unchanged.`);
