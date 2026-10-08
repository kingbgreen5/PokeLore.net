import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const routes = JSON.parse(readFileSync(join('public', 'data', 'pokemonRoutes.json'), 'utf8'));
const redirects = Object.entries(routes.byId)
  .sort(([left], [right]) => Number(left) - Number(right))
  .map(([id, slug]) => `/pokemon/${id} /pokemon/${slug} 301`);

// Static Assets evaluates explicit redirects before asset lookup and SPA fallback.
// Keep React's routing fallback in wrangler.react-preview.jsonc, not here.
redirects.push('/DexEntries /dex-entries 301');
mkdirSync('dist', { recursive: true });
writeFileSync(join('dist', '_redirects'), `# Generated from public/data/pokemonRoutes.json\n${redirects.join('\n')}\n`);
console.log(`Generated ${redirects.length - 1} React Cloudflare numeric redirects.`);
