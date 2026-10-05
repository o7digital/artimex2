import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { mkdir, stat } from 'node:fs/promises';
import { breadImageSources } from '../src/data/breadImageSources.mjs';
const output = new URL('../public/images/breads/', import.meta.url);
await mkdir(output, { recursive: true });
await Promise.all(Object.entries(breadImageSources).map(async ([id, filename]) => {
  const source = new URL(`../public/fotos/${filename}`, import.meta.url);
  const original = await stat(source);
  for (const width of [375, 750]) {
    const destination = new URL(`${id}-${width}.webp`, output);
    const cached = await stat(destination).catch(() => null);
    if (cached && cached.mtimeMs >= original.mtimeMs) continue;
    await sharp(fileURLToPath(source)).rotate().resize(width, width * 3 / 5).webp({ quality: 82 }).toFile(fileURLToPath(destination));
  }
}));
console.log(`${Object.keys(breadImageSources).length} bread photos optimized in WebP (375px and 750px).`);
