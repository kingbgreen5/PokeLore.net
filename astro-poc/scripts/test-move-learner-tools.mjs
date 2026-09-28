import assert from 'node:assert/strict';
import { STAT_OPTIONS, allMoveLearners, compareLearners, filterAndSortGroups, formatHeight, sizeChartLearners } from '../src/lib/moveLearnerTools.js';

const make = (name, id, values, height = 10) => ({ name, id, displayName: name, baseStatTotal: values.reduce((a,b)=>a+b,0), stats: Object.fromEntries(['hp','attack','defense','specialAttack','specialDefense','speed'].map((key,index)=>[key,values[index]])), height });
const facts = {
  alpha: make('alpha', 2, [50,60,70,80,90,100], 15),
  beta: make('beta', 1, [50,70,60,90,80,100], 5),
  'beta-form': make('beta-form', 1, [100,90,80,70,60,50], 20)
};
const groups = [{ method: 'level-up', pokemon: Object.values(facts).map(({id,name,displayName})=>({id,name,displayName})) }, { method: 'machine', pokemon: [{id:2,name:'alpha',displayName:'alpha'}] }];
for (const [stat] of STAT_OPTIONS) {
  const desc = [...Object.values(facts)].sort((a,b)=>compareLearners(a,b,stat,'desc'));
  const asc = [...Object.values(facts)].sort((a,b)=>compareLearners(a,b,stat,'asc'));
  assert.deepEqual(asc.map(p=>p.name), [...desc].sort((a,b)=>compareLearners(a,b,stat,'asc')).map(p=>p.name), `${stat}: deterministic asc`);
  assert(desc.every((item,index) => !index || (stat === 'baseStatTotal' ? desc[index-1].baseStatTotal : desc[index-1].stats[stat]) >= (stat === 'baseStatTotal' ? item.baseStatTotal : item.stats[stat])), `${stat}: desc`);
}
const tied = [facts.alpha, {...facts.alpha,name:'alpha-form',id:2}].sort((a,b)=>compareLearners(a,b,'hp','desc'));
assert.deepEqual(tied.map(p=>p.name), ['alpha','alpha-form'], 'stable canonical tie break');
const filtered = filterAndSortGroups(groups,facts,{method:'level-up',stat:'attack',direction:'desc',minimum:'65',maximum:'95'});
assert.deepEqual(filtered[0].pokemon.map(p=>p.name), ['beta-form','beta']);
assert.deepEqual(sizeChartLearners(filtered).map(p=>p.name), ['beta-form','beta']);
assert.equal(formatHeight(17), '5\' 7"');
assert.deepEqual(allMoveLearners({one:groups},facts).map(p=>p.name), ['alpha','beta','beta-form'], 'all-generation chart union');
console.log('PASS Move learner tools: seven stat fields, both directions, stable ties, method/range filters, form identity, size order and height labels.');
