import { defineConfig } from 'astro/config';
import { mkdirSync, copyFileSync, writeFileSync, existsSync } from 'node:fs';
import react from '@astrojs/react';
import { createSearchRecords } from './src/lib/searchRecords.js';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPokemon, readData } from './src/lib/pokemonData.js';
import { POC_SLUGS, repositoryRoot } from './src/lib/routes.js';

export default defineConfig({
  site: 'https://pokelore.net',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  vite: { resolve: { dedupe: ['react', 'react-dom'] } },
  integrations: [react(), {
    name: 'poc-local-artwork',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const assets = new Set(['/images/etsy/Viridian Forest Two Gildans.jpg']);
        function addPokemon(p) {
          const entries = readData('pokemonArtworkManifest.json').artwork?.[p.id];
          if (entries) Object.values(entries).forEach(src => assets.add(src));
        }
        function addEvolution(model) { addPokemon(model.pokemon); model.children.forEach(addEvolution); }
        for (const slug of POC_SLUGS) {
          const data = loadPokemon(slug);
          addPokemon(data.p); addEvolution(data.evolution);
          data.p.varieties?.forEach(addPokemon);
        }
        for (const asset of assets) {
          const source = join(repositoryRoot, 'public', asset);
          if (!existsSync(source)) throw new Error(`Missing parity asset: ${asset}`);
          const target = join(fileURLToPath(dir), asset);
          mkdirSync(dirname(target), { recursive: true });
          copyFileSync(source, target);
        }
        const search = createSearchRecords({ pokemonIndex: readData('pokemonIndex.json'),
          moves: Object.fromEntries(readData('movesIndex.json').map(m=>[m.name,m])),
          abilities: readData('abilities.json'), items: readData('itemsIndex.json'),
          locations: readData('locationsIndex.json'), tmMaterialDetails: readData('tmMaterialDetails.json') });
        mkdirSync(join(fileURLToPath(dir), 'data'), { recursive: true });
        writeFileSync(join(fileURLToPath(dir), 'data/search.json'), JSON.stringify(search));
      }
    }
  }]
});
