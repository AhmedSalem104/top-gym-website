import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const source = process.argv[2];
if (!source)
  throw new Error('Usage: node scripts/prepare-promotional-hero.mjs <downloaded-pinterest-image>');
const bytes = await readFile(source);
const dimensions = await sharp(bytes).metadata();
const destinations = [];
for (const width of [480, 736]) {
  for (const format of ['avif', 'webp']) {
    const destination = `public/media/promotional-hero-${width}.${format}`;
    await sharp(bytes)
      .resize({ width, withoutEnlargement: true })
      .toFormat(format, { quality: format === 'avif' ? 55 : 88 })
      .toFile(destination);
    destinations.push(destination);
  }
}
await writeFile(
  'docs/promotional-media.json',
  JSON.stringify(
    {
      selectedAt: '2026-11-05',
      requestedByOwner: 'Replace the hero with a professional different photograph from Pinterest',
      pin: 'https://www.pinterest.com/pin/fotos-na-academia-masculina--844636105109617078/',
      download: 'https://i.pinimg.com/736x/6b/9c/b4/6b9cb4996970e16480ca7cccc9ca939a.jpg',
      sha256: createHash('sha256').update(bytes).digest('hex'),
      width: dimensions.width,
      height: dimensions.height,
      review:
        'Single adult male athlete in black sportswear; no women observed. Promotional imagery, not the TOP GYM facility or a named TOP GYM trainer.',
      rights:
        'Pinterest source selected at owner request; photographer and reuse license have not been independently established. Confirm rights before public production launch.',
      derivatives: 'Format/size optimization only; no AI generation or compositing. No upscaling.',
      destinations,
    },
    null,
    2,
  ) + '\n',
);
console.log('Prepared responsive Pinterest promotional hero and source provenance.');
