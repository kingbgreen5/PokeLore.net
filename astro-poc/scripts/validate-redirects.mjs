import assert from 'node:assert/strict';

// Parse the artifact independently of the generator. Check every registry row,
// rather than trusting a reported count or comparing two generated strings.
export function validateRedirects(text, registry) {
  assert(!text.startsWith('\uFEFF'), 'Redirect file must not contain a UTF-8 BOM');
  const sources = new Map();
  const numeric = [];
  const dynamic = new Set([
    '/pokemon/:slug/ /pokemon/:slug 301',
    '/pokemon/:slug.html /pokemon/:slug 301'
  ]);
  let dynamicCount = 0;
  let reachedDynamic = false;
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (line === '' || line.startsWith('#')) continue;
    const lineNumber = index + 1;
    assert(Buffer.byteLength(line, 'utf8') <= 1000, `Line ${lineNumber}: exceeds Cloudflare line limit`);
    const match = line.match(/^(\S+) (\S+) (301)$/);
    assert(match, `Malformed redirect line ${lineNumber}: ${line}`);
    const [, source, destination] = match;
    assert(!sources.has(source), `Duplicate redirect source ${source} at line ${lineNumber}`);
    sources.set(source, destination);
    if (source.includes(':')) {
      assert(dynamic.has(line), `Unexpected dynamic rule at line ${lineNumber}`);
      reachedDynamic = true;
      dynamicCount++;
      continue;
    }
    assert(!reachedDynamic, `Static rule after dynamic rules at line ${lineNumber}`);
    const id = source.match(/^\/pokemon\/([1-9]\d*)$/)?.[1];
    assert(id && Object.hasOwn(registry.byId, id), `Unknown numeric source at line ${lineNumber}`);
    assert.equal(destination, `/pokemon/${registry.byId[id]}`, `Wrong destination for ${source}`);
    assert(!/^\/pokemon\/\d+$/.test(destination), `Numeric destination for ${source}`);
    assert(/^\/pokemon\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(destination), `Invalid destination for ${source}`);
    assert.equal(registry.byName[registry.byId[id]], Number(id), `Conflicting registry for ${source}`);
    numeric.push({ id, source, destination, status: 301, line: lineNumber });
  }
  for (const [id, slug] of Object.entries(registry.byId)) {
    assert.equal(sources.get(`/pokemon/${id}`), `/pokemon/${slug}`, `Missing or incorrect mapping for /pokemon/${id}`);
  }
  assert.equal(numeric.length, Object.keys(registry.byId).length, 'Numeric count differs from registry');
  assert(numeric.length < 2000 && dynamicCount <= 100, 'Cloudflare redirect budget exceeded');
  assert.equal(sources.get('/pokemon/:slug/'), '/pokemon/:slug', 'Missing slash normalization');
  return { numeric, dynamicCount };
}
