import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Anchor to the POC working directory, including when bundled by Astro.
export const repositoryRoot = resolve(process.cwd(), '..');
export const POC_SLUGS = Object.freeze(['kakuna', 'pikachu', 'charizard', 'raichu-alola']);
export const routes = JSON.parse(readFileSync(join(repositoryRoot, 'public/data/pokemonRoutes.json'), 'utf8'));
export function pokemonPath(slug) {
  if (!routes.byName[slug] || /^\d+$/.test(slug)) throw new Error(`Unregistered Pokémon slug: ${slug}`);
  return `/pokemon/${slug}`;
}
// Non-POC references go to the existing canonical site, not missing staging pages.
export function referenceHref(path) {
  if (path === '/' || POC_SLUGS.some(slug => path === pokemonPath(slug))) return path;
  return `https://pokelore.net${path}`;
}
