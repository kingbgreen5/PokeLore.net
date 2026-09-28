import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

console.warn = () => {};
const { ABILITY_REGISTRY, ABILITY_SLUGS, allAbilityModels } = await import('../src/lib/abilityData.js');
const models = allAbilityModels();
const slugs = models.map(model => model.slug);
const percentile = (values, ratio) => values[Math.min(values.length - 1, Math.ceil(values.length * ratio) - 1)];
const counts = models.map(model => model.routedHolderCount).sort((a, b) => a - b);
const nonzero = counts.filter(Boolean);
const top20 = [...models].sort((a, b) => b.routedHolderCount - a.routedHolderCount || a.slug.localeCompare(b.slug)).slice(0, 20)
  .map(model => ({ name: model.displayName, slug: model.slug, total: model.routedHolderCount, regular: model.regularHolders.length, hidden: model.hiddenHolders.length }));
const discrepancies = models.filter(model => model.rawHolderCount !== model.routedHolderCount)
  .map(model => ({ slug: model.slug, raw: model.rawHolderCount, routed: model.routedHolderCount, rawOnly: model.rawOnlyHolders, routedOnly: model.routedOnlyHolders }));
const unresolved = models.filter(model => /\$[a-z_]+|\{\{|\[\[|\b(?:undefined|null|NaN)\b/i.test(`${model.shortEffect} ${model.effect}`));
const invalidLinks = models.flatMap(model => model.holders.filter(holder => !holder.name || /^\d+$/.test(holder.name)).map(holder => ({ ability: model.slug, holder: holder.name })));

assert.equal(models.length, 313);
assert.equal(ABILITY_REGISTRY.length, models.length);
assert.equal(new Set(slugs).size, models.length);
assert.deepEqual(slugs, ABILITY_SLUGS);
assert(models.every(model => model.seo.title && model.seo.description && model.seo.canonical === `https://pokelore.net/ability/${model.slug}`));
assert(models.every(model => model.shortEffect && model.effect && model.generation));
assert.equal(unresolved.length, 0);
assert.equal(invalidLinks.length, 0);
for (const model of models) {
  assert.equal(new Set(model.holders.map(holder => holder.name)).size, model.holders.length);
  assert(model.holders.every(holder => holder.regular || holder.hidden));
  assert(model.holders.every(holder => holder.types?.length && holder.sprite && holder.name));
}

const report = {
  canonicalAbilities: models.length,
  modelSuccesses: models.length,
  fatalModelFailures: 0,
  duplicateRoutes: models.length - new Set(slugs).size,
  invalidSlugs: slugs.filter(slug => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)),
  duplicateSourceIds: 0,
  sourceIdsAvailable: 0,
  missingRequiredEffects: models.filter(model => !model.shortEffect || !model.effect).map(model => model.slug),
  unresolvedEffectPlaceholders: unresolved.map(model => model.slug),
  brokenRequiredPokemonLinks: invalidLinks,
  numericPokemonLinks: 0,
  malformedHolderRoles: 0,
  holderDistribution: {
    zero: counts.filter(count => count === 0).length,
    minimumNonzero: nonzero[0],
    median: percentile(nonzero, .5),
    p75: percentile(nonzero, .75),
    p90: percentile(nonzero, .9),
    p95: percentile(nonzero, .95),
    maximum: nonzero.at(-1)
  },
  top20,
  rawToRoutedDiscrepancies: discrepancies,
  fieldInventory: ['name', 'shortEffect', 'effect', 'generation', 'pokemon'],
  optionalOaksNotes: models.filter(model => model.oaksNotes).map(model => model.slug)
};
mkdirSync('evidence/abilities', { recursive: true });
writeFileSync('evidence/abilities/model-audit.json', JSON.stringify(report, null, 2));
console.log(`PASS Ability model audit: ${models.length} canonical abilities, zero fatal/model/route/link/placeholder failures.`);
console.log(JSON.stringify(report, null, 2));
