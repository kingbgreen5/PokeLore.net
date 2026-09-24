import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRedirects, registryRedirects } from './generate-redirects.mjs';
import { publicHref } from '../src/lib/links.js';
const valid = () => ({byId:{'14':'kakuna','10100':'raichu-alola'},byName:{kakuna:14,'raichu-alola':10100}});

test('complete real registry produces one unique canonical 301 per ID', () => {
  const result = registryRedirects();
  assert.equal(result.count,1350);
  const rows = result.text.split('\n').filter(line=>line.startsWith('/pokemon/') && !line.includes(':'));
  assert.equal(rows.length,result.count);
  assert.equal(new Set(rows.map(row=>row.split(' ')[0])).size,rows.length);
  assert(rows.includes('/pokemon/14 /pokemon/kakuna 301'));
  assert(rows.includes('/pokemon/10100 /pokemon/raichu-alola 301'));
  assert(rows.includes('/pokemon/10325 /pokemon/baxcalibur-mega 301'));
});

test('duplicate IDs, including repeated identical entries, fail before JSON overwrites them', () => {
  for (const extra of ['kakuna','pikachu']) {
    assert.throws(()=>generateRedirects(`{"byId":{"14":"kakuna","14":"${extra}"},"byName":{"kakuna":14,"pikachu":25}}`), /Duplicate/);
  }
});

test('malformed IDs, numeric destinations and conflicting reverse mappings fail', () => {
  for (const bad of ['014','slug','0','-1']) {
    const r=valid();r.byId[bad]='kakuna';
    assert.throws(()=>generateRedirects(JSON.stringify(r)), /Invalid numeric ID/);
  }
  for (const bad of ['14','../kakuna','kakuna/','kakuna.html','https://example.com']) {
    const r=valid();r.byId['14']=bad;
    assert.throws(()=>generateRedirects(JSON.stringify(r)), /Invalid canonical slug/);
  }
  const r=valid();r.byName.kakuna=25;
  assert.throws(()=>generateRedirects(JSON.stringify(r)), /Conflicting/);
});

test('static redirect budget fails closed at the configured boundary', () => {
  const r={byId:{},byName:{}};
  for(let id=1;id<=2000;id++){r.byId[id]=`pokemon-${id}`;r.byName[`pokemon-${id}`]=id;}
  assert.throws(()=>generateRedirects(JSON.stringify(r)), /below 2,000/);
});

test('Pokémon links stay relative; unmigrated families stay on production', () => {
  for(const slug of ['kakuna','weedle','beedrill','raichu-alola']) assert.equal(publicHref(`/pokemon/${slug}`),`/pokemon/${slug}`);
  assert.equal(publicHref('/move/tackle'),'https://pokelore.net/move/tackle');
  assert.equal(publicHref('/pokemon/kakuna#learnset'),'/pokemon/kakuna#learnset');
});
