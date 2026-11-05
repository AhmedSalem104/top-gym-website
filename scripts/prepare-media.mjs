import { readFile, mkdir, writeFile, readdir } from 'node:fs/promises';
import { resolve, relative, extname, join } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/prepare-media.mjs <extracted-source-root>');
const root = resolve(source);
const output = resolve('public/media');
await mkdir(output, { recursive: true });
const images = [
  ['01_chest_press.jpg', 'chest-press'],
  ['02_cardio_room.jpg', 'cardio-room'],
  ['03_cable_machine.jpg', 'cable-machine'],
  ['04_leg_machine.jpg', 'leg-machine'],
  ['05_leg_extension.jpg', 'leg-extension'],
];
const destinations = new Map();
for (const [file, id] of images) {
  const input = join(root, 'media/gym_photos', file);
  const outputs = [];
  for (const width of [480, 960, 1440]) {
    for (const format of ['webp', 'avif']) {
      const name = `${id}-${width}.${format}`;
      await sharp(input)
        .rotate()
        .resize({ width })
        .toFormat(format, { quality: format === 'avif' ? 42 : 80 })
        .toFile(join(output, name));
      outputs.push(`public/media/${name}`);
    }
  }
  if (id === 'cable-machine') {
    for (const width of [960, 1440]) {
      for (const format of ['avif', 'webp']) {
        const name = `hero-wide-${width}.${format}`;
        await sharp(input)
          .rotate()
          .resize(width, Math.round(width * 0.625), { fit: 'cover', position: 'centre' })
          .toFormat(format, { quality: format === 'avif' ? 42 : 80 })
          .toFile(join(output, name));
        outputs.push(`public/media/${name}`);
      }
    }
  }
  destinations.set(`media/gym_photos/${file}`, outputs);
}
const logo = join(root, 'media/brand/top_gym_logo_original.jpg');
await sharp(logo)
  .resize(128, 128, { fit: 'contain', background: '#0B0D0F' })
  .webp({ quality: 90 })
  .toFile(join(output, 'top-gym-logo.webp'));
await sharp(logo)
  .resize(64, 64, { fit: 'contain', background: '#0B0D0F' })
  .png()
  .toFile(join(output, 'favicon.png'));
await sharp(logo)
  .resize(1200, 630, { fit: 'contain', background: '#0B0D0F' })
  .jpeg({ quality: 88 })
  .toFile(join(output, 'social-share.jpg'));
destinations.set('media/brand/top_gym_logo_original.jpg', [
  'public/media/top-gym-logo.webp',
  'public/media/favicon.png',
  'public/media/social-share.jpg',
]);
const inventory = [];
async function walk(folder) {
  for (const item of await readdir(folder, { withFileTypes: true })) {
    const path = join(folder, item.name);
    if (item.isDirectory()) {
      await walk(path);
      continue;
    }
    const rel = relative(root, path).replaceAll('\\', '/');
    const buffer = await readFile(path);
    const media = ['.jpg', '.png'].includes(extname(path)) ? await sharp(buffer).metadata() : null;
    inventory.push({
      source: rel,
      bytes: buffer.length,
      sha256: createHash('sha256').update(buffer).digest('hex'),
      ...(media ? { width: media.width, height: media.height } : {}),
      destinations: destinations.get(rel) ?? [],
      decision: destinations.has(rel)
        ? 'Published optimized derivative; original preserved outside repository'
        : rel.includes('certificates/')
          ? 'Withheld: original comparison, privacy review and trainer role confirmation pending'
          : 'Reference only; never published as authentic gym or certificate media',
    });
  }
}
await walk(join(root, 'media'));
await walk(join(root, 'stitch'));
const hashes = new Map();
for (const asset of inventory) {
  const group = hashes.get(asset.sha256) ?? [];
  group.push(asset.source);
  hashes.set(asset.sha256, group);
}
await mkdir('docs', { recursive: true });
await writeFile(
  'docs/asset-manifest.json',
  JSON.stringify(
    {
      generated: '2026-11-05',
      sourceArchives: [
        'Top_Gym_Enhanced_Photos_and_Certificates.zip',
        'stitch_top_gym_landing_page.zip',
      ],
      policy:
        'Source archives and certificate photographs stay outside the repository. No original overwritten.',
      duplicates: [...hashes.values()].filter((group) => group.length > 1),
      assets: inventory,
    },
    null,
    2,
  ) + '\n',
);
console.log(
  `Prepared ${destinations.size} source assets. Manifest records ${inventory.length} files.`,
);
