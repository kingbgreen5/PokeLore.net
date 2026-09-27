import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { parseHTML } from 'linkedom';
import { STRESS_SLUGS } from '../src/lib/links.js';

const bundles = Object.fromEntries(readdirSync('dist/_astro').filter(file => file.endsWith('.js')).map(file => [file, statSync(join('dist/_astro', file)).size]));
const pages = STRESS_SLUGS.map(slug => {
  const bytes = readFileSync(`dist/pokemon/${slug}.html`);
  const document = parseHTML(bytes.toString()).document;
  const componentBundles = [...new Set([...document.querySelectorAll('astro-island')]
    .map(island => basename(island.getAttribute('component-url') ?? ''))
    .filter(Boolean))];
  const learnsetIsland = [...document.querySelectorAll('astro-island')]
    .find(island => island.getAttribute('component-url')?.includes('LearnsetCard'));
  return {
    slug,
    htmlBytes: bytes.length,
    htmlGzipBytes: gzipSync(bytes).length,
    hydratedIslands: document.querySelectorAll('astro-island').length,
    componentBundles,
    componentBundleBytes: componentBundles.reduce((sum, file) => sum + (bundles[file] ?? 0), 0),
    learnsetHydrationPropBytes: (learnsetIsland?.getAttribute('props') ?? '').length,
    onDemandLearnsetPayloadBytes: statSync(join('dist', 'data', 'learnsets', `${slug}.json`)).size
  };
}).sort((a, b) => b.htmlBytes - a.htmlBytes);
const largestBundles = Object.entries(bundles).map(([file, bytes]) => ({ file, bytes })).sort((a, b) => b.bytes - a.bytes).slice(0, 8);
mkdirSync('evidence/stress', { recursive: true });
writeFileSync('evidence/stress/performance.json', JSON.stringify({ pages, largestBundles }, null, 2));
console.log(JSON.stringify({ largestPages: pages.slice(0, 6), largestBundles }, null, 2));
