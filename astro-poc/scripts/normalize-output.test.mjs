import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeOutput } from './normalize-output.mjs';

mkdirSync('evidence', { recursive: true });
function fixture() { return mkdtempSync(join('evidence', 'normalize-')); }
function put(root, file, body) {
  const target = join(root, file);
  mkdirSync(join(target, '..'), { recursive: true });
  writeFileSync(target, body);
}
function html(path) {
  return `<!doctype html><html><head><link rel="canonical" href="https://pokelore.net${path}"><script type="application/ld+json">{"name":"Pokémon"}</script></head><body><h1>Pokémon</h1><a href="/other/page">Link</a></body></html>`;
}

test('renames generic self-canonical pages without changing any bytes; preserves special files and assets', () => {
  const root = fixture();
  const originals = {
    'pokemon/example.html': html('/pokemon/example'),
    'other-family/nested/example-form.html': html('/other-family/nested/example-form'),
    'about.html': html('/about'),
    'index.html': html('/'),
    '404.html': '<h1>Page not found</h1>',
    'nested/index.html': html('/nested/'),
    'alias.html': html('/about'),
    'foreign.html': html('/foreign').replace('pokelore.net', 'example.com'),
    'plain.html': '<p>Noncanonical document</p>',
    '_astro/style.css': 'body { color: red; }',
    '_astro/app.js': 'console.log("hi")',
    'data/search.json': '[]',
    'images/image.webp': Buffer.from([0, 1, 255, 15])
  };
  for (const [file, bytes] of Object.entries(originals)) put(root, file, bytes);
  const changes = normalizeOutput(root);
  assert.equal(changes.length, 3);
  const mapping = new Map(changes.map(c => [c.from, c.to]));
  for (const [file, bytes] of Object.entries(originals)) {
    assert(readFileSync(join(root, mapping.get(file) ?? file)).equals(Buffer.from(bytes)), file);
    if (mapping.has(file)) assert(!existsSync(join(root, file)), file);
  }
  assert.deepEqual(normalizeOutput(root), [], 'Repeat normalization is safe');
});

test('a collision stops the complete plan before any page is renamed', () => {
  const root = fixture();
  put(root, 'a.html', html('/a'));
  put(root, 'z.html', html('/z'));
  put(root, 'z', 'existing resource');
  assert.throws(() => normalizeOutput(root), /already exists/);
  assert(existsSync(join(root, 'a.html')));
  assert(!existsSync(join(root, 'a')));
  assert.equal(readFileSync(join(root, 'z'), 'utf8'), 'existing resource');
});

test('ambiguous canonicals fail before renaming; asset-shaped canonical files remain untouched', () => {
  const root = fixture();
  put(root, 'archive.xml.html', html('/archive.xml'));
  assert.deepEqual(normalizeOutput(root), []);
  put(root, 'page.html', html('/page').replace('</head>', '<link rel="canonical" href="https://pokelore.net/page"></head>'));
  assert.throws(() => normalizeOutput(root), /Multiple canonicals/);
  assert(existsSync(join(root, 'page.html')));
});
