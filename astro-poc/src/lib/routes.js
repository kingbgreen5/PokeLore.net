import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Anchor to the POC working directory, including when bundled by Astro.
export const repositoryRoot = resolve(process.cwd(), '..');
import { POC_SLUGS, publicHref } from './links.js';
export { POC_SLUGS };
export const routes = JSON.parse(readFileSync(join(repositoryRoot, 'public/data/pokemonRoutes.json'), 'utf8'));
export function pokemonPath(slug) {
  if (!routes.byName[slug] || /^\d+$/.test(slug)) throw new Error(`Unregistered Pokémon slug: ${slug}`);
  return `/pokemon/${slug}`;
}
// Pokémon links are relative, including unmigrated Pokémon (404 on the POC).
// Other route families continue to the existing production reference pages.
export function referenceHref(path) {
  return publicHref(path);
}
