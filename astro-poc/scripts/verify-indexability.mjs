import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseHTML } from 'linkedom';
import { PRODUCTION, deploymentEnvironment, deploymentHeaders } from './deployment.mjs';

const environment = deploymentEnvironment();
const dist = join(process.cwd(), 'dist');
const publicPages = [
  'index.html', 'moves.html', 'abilities.html', 'items.html', 'locations.html',
  'types.html', 'dex-entries.html', 'tools.html', 'topics.html', 'news.html',
  'pokemon/pikachu.html', 'move/thunderbolt.html', 'ability/levitate.html',
  'item/potion.html', 'location/pokeathlon-dome.html', 'type/fire.html',
  'topic/catching-feebas-every-generation.html'
];
for (const file of publicPages) {
  const document = parseHTML(readFileSync(join(dist, file), 'utf8')).document;
  const robots = document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '';
  assert(!/noindex/i.test(robots), `${file}: public page must be indexable in ${environment}`);
  assert.equal(document.querySelectorAll('link[rel="canonical"]').length, 1, `${file}: one canonical`);
}
for (const file of ['404.html', 'dev.html', 'dev/team-coverage-scoring.html', 'dev/single-type-coverage-scoring.html']) {
  const document = parseHTML(readFileSync(join(dist, file), 'utf8')).document;
  assert.match(document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '', /noindex/i, `${file}: non-public page stays noindex`);
}
const headers = readFileSync(join(dist, '_headers'), 'utf8');
assert.equal(headers, deploymentHeaders(environment), `${environment}: generated HTTP header policy`);
if (environment === PRODUCTION) assert(!/X-Robots-Tag/i.test(headers), 'production has no blanket HTTP noindex');
else assert.match(headers, /X-Robots-Tag:\s*noindex/i, 'staging keeps HTTP noindex');
console.log(`PASS indexability: ${publicPages.length} representative public pages indexable; private/404 pages protected; ${environment} headers verified.`);

