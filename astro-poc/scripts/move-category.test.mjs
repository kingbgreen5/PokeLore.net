import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getLearnsetMoveDisplay as display } from '../src/lib/moveCategory.js';
function move(name) {
  const data = JSON.parse(readFileSync(new URL(`../../public/data/moves/${name}.json`, import.meta.url)));
  return { ...data, pastTypes: data.pastValues.filter(v => v.type) };
}

test('all 17 types use the historical split across every legacy game group', () => {
  const physical = ['normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel'];
  const special = ['fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark'];
  for (const version of ['red-green-japan','blue-japan','red-blue','yellow','gold-silver','crystal','ruby-sapphire','emerald','firered-leafgreen','colosseum','xd']) {
    for (const type of physical) assert.equal(display({type,category:'special'}, version).category, 'physical');
    for (const type of special) assert.equal(display({type,category:'physical'}, version).category, 'special');
    for (const type of [...physical,...special]) assert.equal(display({type,category:'status'}, version).category, 'status');
  }
});

test('Bite uses historical type and respects the Gen II and Gen IV boundaries', () => {
  assert.deepEqual(display(move('bite'), 'red-blue'), {type:'normal',category:'physical'});
  assert.deepEqual(display(move('bite'), 'gold-silver'), {type:'dark',category:'special'});
  assert.equal(display(move('bite'), 'firered-leafgreen').category, 'special');
  assert.equal(display(move('bite'), 'diamond-pearl').category, 'physical');
});

test('status, fixed-damage and variable-type moves are not confused', () => {
  assert.deepEqual(display(move('charm'), 'gold-silver'), {type:'normal',category:'status'});
  assert.equal(display(move('night-shade'), 'emerald').category, 'physical');
  assert.equal(display(move('sonic-boom'), 'red-blue').category, 'physical');
  for (const name of ['hidden-power','weather-ball']) {
    assert.equal(display(move(name), 'emerald').category, 'variable');
    assert.equal(display(move(name), 'diamond-pearl').category, 'special');
  }
});

test('historical type changes use the existing source data', () => {
  for (const name of ['gust','karate-chop']) {
    assert.deepEqual(display(move(name),'yellow'), {type:'normal',category:'physical'});
  }
  assert.equal(display(move('gust'),'gold-silver').type,'flying');
});

test('All Generations, remakes, later games and unknown versions retain source categories', () => {
  for (const version of ['all','diamond-pearl','heartgold-soulsilver','omega-ruby-alpha-sapphire','lets-go-pikachu-lets-go-eevee','scarlet-violet','unknown',undefined]) {
    assert.equal(display(move('shadow-ball'), version).category,'special');
    assert.equal(display(move('fire-punch'), version).category,'physical');
  }
  assert.deepEqual(display(undefined,'emerald'), {type:undefined,category:undefined});
  const original = move('bite');
  const before = JSON.stringify(original);
  display(original,'red-blue');
  assert.equal(JSON.stringify(original),before);
});
