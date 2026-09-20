import { defineConfig } from 'astro/config';
import { mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPokemon } from './src/lib/pokemonData.js';
import { POC_SLUGS, repositoryRoot } from './src/lib/routes.js';

export default defineConfig({
  site: 'https://pokelore.net',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [{
    name: 'poc-local-artwork',
    hooks: {
      'astro:build:done': ({ dir }) => {
        // Copy only the four referenced images, never the production public tree.
        for (const slug of POC_SLUGS) {
          const { artwork } = loadPokemon(slug);
          const target = join(fileURLToPath(dir), artwork);
          mkdirSync(dirname(target), { recursive: true });
          copyFileSync(join(repositoryRoot, 'public', artwork), target);
        }
      }
    }
  }]
});
