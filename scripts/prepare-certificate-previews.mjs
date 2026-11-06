import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const sourceRoot = process.argv[2];
if (!sourceRoot)
  throw new Error('Usage: node scripts/prepare-certificate-previews.mjs <source-root>');
const manifest = JSON.parse(await readFile('docs/asset-manifest.json', 'utf8'));
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex');
const entries = manifest.assets.filter((asset) => asset.redaction);
for (const entry of entries) {
  const original = await readFile(join(resolve(sourceRoot), entry.source));
  if (hash(original) !== entry.sha256) throw new Error(`Unreviewed source: ${entry.source}`);
  const fullPath = entry.destinations.find(
    (path) => path.endsWith('.webp') && !path.includes('-preview'),
  );
  const full = await readFile(fullPath);
  const derivatives = [];
  for (const width of [320, 960]) {
    const path = fullPath.replace('.webp', `-${width}.webp`);
    const { data, info } = await sharp(full)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 86, effort: 5 })
      .toBuffer({ resolveWithObject: true });
    await writeFile(path, data);
    derivatives.push({
      path,
      width: info.width,
      height: info.height,
      bytes: data.length,
      sha256: hash(data),
    });
    entry.destinations = [...new Set([...entry.destinations, path])];
  }
  entry.responsivePreviews = {
    source: fullPath,
    sourceSha256: hash(full),
    processing:
      'Resize and WebP encoding only, from the existing privacy-redacted lossless copy. No cropping, perspective changes, generative edits or overwritten source files.',
    derivatives,
  };
}
await writeFile('docs/asset-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(
  `Prepared responsive previews for ${entries.length} certificates; originals and full-size copies unchanged.`,
);
