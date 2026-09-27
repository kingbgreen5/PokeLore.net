import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateRedirects } from './validate-redirects.mjs';
const registry=JSON.parse(readFileSync('../public/data/pokemonRoutes.json','utf8'));
const source=readFileSync('public/_redirects','utf8');
const last='/pokemon/10325 /pokemon/baxcalibur-mega 301';

test('source and final artifacts contain every exact mapping, including final ID',()=>{
  for(const path of ['public/_redirects','dist/_redirects']) {
    const result=validateRedirects(readFileSync(path,'utf8'),registry);
    assert.equal(result.numeric.length,1350);
    assert.equal(result.numeric.at(-1).source,'/pokemon/10325');
    assert.equal(result.numeric.at(-1).destination,'/pokemon/baxcalibur-mega');
  }
});
test('a missing rule cannot hide behind the count',()=>{
  assert.throws(()=>validateRedirects(source.replace(last,''),registry),/Missing or incorrect/);
});
test('duplicates fail even when their destination is identical',()=>{
  assert.throws(()=>validateRedirects(source.replace(last,`${last}\n${last}`),registry),/Duplicate/);
});
test('wrong destinations, status, partial lines and numeric destinations fail',()=>{
  for(const replacement of ['/pokemon/10325 /pokemon/kakuna 301','/pokemon/10325 /pokemon/baxcalibur-mega 302','/pokemon/10325','/pokemon/10325 /pokemon/14 301']) {
    assert.throws(()=>validateRedirects(source.replace(last,replacement),registry));
  }
});
test('CRLF is accepted; hidden whitespace, BOM and invalid bytes are rejected',()=>{
  assert.equal(validateRedirects(source.replace(/\r?\n/g,'\r\n'),registry).numeric.length,1350);
  for(const replacement of [` ${last}`,last.replace(' ','\t'),last+'\u200B']) {
    assert.throws(()=>validateRedirects(source.replace(last,replacement),registry));
  }
  assert.throws(()=>validateRedirects('\uFEFF'+source,registry),/BOM/);
});
