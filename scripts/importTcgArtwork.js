import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const root = path.resolve(import.meta.dirname, '..');
const sources = JSON.parse(await fs.readFile(path.join(root, 'src/tcg/artworkSources.json'), 'utf8'));
const output = path.join(root, 'public/images/tcg');
const cache = path.join(root, '.tcg-cache/artwork');
await fs.mkdir(output, { recursive: true });
await fs.mkdir(cache, { recursive: true });
async function importImage(asset, name) {
  const cached = path.join(cache, `${name}.original`);
  let buffer;
  try { buffer = await fs.readFile(cached); } catch {
    const response = await fetch(asset.url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`${asset.url}: HTTP ${response.status}`);
    buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(cached, buffer);
  }
  await sharp(buffer).resize({ width: 400, withoutEnlargement: true }).webp({ quality: 88 }).toFile(path.join(output, `${name}.webp`));
  return { ...asset, image: `/images/tcg/${name}.webp` };
}
const manifest = { cardBack: await importImage(sources.cardBack, 'card-back'), sets: {} };
for (const [set, assets] of Object.entries(sources.sets)) {
  manifest.sets[set] = [];
  for (let index = 0; index < assets.length; index++) manifest.sets[set].push(await importImage(assets[index], `${set}-booster-${index + 1}`));
  console.log(`${set}: ${assets.length} original wrapper scans`);
}
await fs.writeFile(path.join(root, 'public/data/tcg/artwork.json'), JSON.stringify(manifest));
console.log('Imported local card back and wrapper artwork with source attribution.');
