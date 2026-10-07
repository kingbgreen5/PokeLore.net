import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { VERSION_GROUP_ORDER } from '../src/constants/versionOrder.js';

const directory = join(process.cwd(), 'public', 'data', 'teamCoverage');
const indexPath = join(directory, 'index.json');
const index = JSON.parse(readFileSync(indexPath, 'utf8'));
const entries = Object.entries(index.versionGroups ?? {});
const keys = entries.map(([key]) => key);
assert.deepEqual(keys, VERSION_GROUP_ORDER, 'Team Coverage index keys must exactly follow the canonical version-group order');
assert.equal(new Set(keys).size, keys.length, 'Team Coverage index has no duplicate version keys');
const expectedFiles = new Set(['index.json']);
let totalBytes = statSync(indexPath).size;
const summary = [];
for (const [key, entry] of entries) {
  assert.equal(entry.path, `/data/teamCoverage/${key}.json`, `${key}: canonical dataset path`);
  const fileName = basename(entry.path);
  expectedFiles.add(fileName);
  const path = join(directory, fileName);
  const data = JSON.parse(readFileSync(path, 'utf8'));
  const pokemon = data.pokemon ?? [];
  assert.equal(data.versionGroup, key, `${key}: payload version matches index`);
  assert(Array.isArray(pokemon), `${key}: pokemon is an array`);
  assert.equal(data.availablePokemonCount, entry.availablePokemonCount, `${key}: availability count matches index`);
  assert.equal(data.recommendationCount, entry.recommendationCount, `${key}: recommendation count matches index`);
  assert.equal(pokemon.length, entry.recommendationCount, `${key}: payload length matches recommendation count`);
  assert.equal(new Set(pokemon.map(candidate => candidate.id)).size, pokemon.length, `${key}: recommendation IDs are unique`);
  totalBytes += statSync(path).size;
  summary.push({ key, availablePokemonCount: entry.availablePokemonCount, recommendationCount: entry.recommendationCount, bytes: statSync(path).size });
}
assert.deepEqual(new Set(readdirSync(directory).filter(file => file.endsWith('.json'))), expectedFiles, 'No unindexed Team Coverage dataset files exist');
console.log(JSON.stringify({ versions: summary.length, totalBytes, emptyVersionGroups: summary.filter(entry => entry.recommendationCount === 0).map(entry => entry.key), largest: [...summary].sort((a, b) => b.bytes - a.bytes)[0] }, null, 2));
console.log('PASS Team Coverage data audit: canonical versions, indexed payloads, counts, identity uniqueness, and dataset boundaries.');
