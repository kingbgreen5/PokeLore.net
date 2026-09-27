import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { routes, repositoryRoot } from '../src/lib/routes.js';
import { FORM_CATEGORIES, getFormSemantics } from '../src/lib/formSemantics.js';

const dataDir = join(repositoryRoot, 'public', 'data');
const read = name => JSON.parse(readFileSync(join(dataDir, name), 'utf8'));
const records = [];

for (const [slug, id] of Object.entries(routes.byName)) {
  const source = read(`pokemonData/${id}.json`);
  const variety = source.varieties?.find(candidate => candidate.name === slug);
  if (!variety || variety.isDefault) continue;
  const pokemon = source.name === slug ? source : {
    ...source,
    name: slug,
    isDefaultForm: false,
    sprite: variety.spriteFallback ?? variety.sprite,
    types: variety.types ?? source.types
  };
  const semantics = getFormSemantics(slug, pokemon);
  records.push({
    slug,
    id,
    sourceRecord: source.name,
    sharedIdAlias: source.name !== slug,
    resolved: Boolean(semantics),
    category: semantics?.category ?? null,
    evolutionBehavior: semantics?.evolutionBehavior ?? null,
    classificationSource: semantics?.classificationSource ?? null,
    unsafeInheritance: semantics
      ? Object.entries(semantics.inheritance).filter(([, policy]) => policy === 'unsafe').map(([field]) => field)
      : []
  });
}

const countBy = key => Object.fromEntries([...new Set(records.map(record => record[key]).filter(Boolean))]
  .sort().map(value => [value, records.filter(record => record[key] === value).length]));
const unresolved = records.filter(record => !record.resolved);
const report = {
  registryRouteCount: Object.keys(routes.byName).length,
  nonDefaultCanonicalRoutes: records.length,
  distinctNonDefaultDataRecords: new Set(records.map(record => record.id)).size,
  sourceRecordsFlaggedNonDefault: records.filter(record => !record.sharedIdAlias).length,
  sharedIdAliases: records.filter(record => record.sharedIdAlias).map(record => record.slug),
  automaticallyClassified: records.filter(record => record.classificationSource !== 'explicit-override' && record.resolved).length,
  explicitlyOverridden: records.filter(record => record.classificationSource === 'explicit-override').length,
  unresolved: unresolved.length,
  categoryCounts: countBy('category'),
  evolutionBehaviorCounts: countBy('evolutionBehavior'),
  specialEvolutionRoutes: records.filter(record => record.evolutionBehavior !== 'participates').map(({ slug, evolutionBehavior }) => ({ slug, evolutionBehavior })),
  unsafeInheritanceRoutes: records.filter(record => record.unsafeInheritance.length).map(({ slug, unsafeInheritance }) => ({ slug, fields: unsafeInheritance })),
  records
};

for (const record of records) {
  if (record.category && !FORM_CATEGORIES.includes(record.category)) throw new Error(`${record.slug}: unknown category ${record.category}`);
}
mkdirSync('evidence/stress', { recursive: true });
writeFileSync('evidence/stress/form-semantics-audit.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  nonDefaultCanonicalRoutes: report.nonDefaultCanonicalRoutes,
  distinctNonDefaultDataRecords: report.distinctNonDefaultDataRecords,
  sourceRecordsFlaggedNonDefault: report.sourceRecordsFlaggedNonDefault,
  sharedIdAliases: report.sharedIdAliases,
  automaticallyClassified: report.automaticallyClassified,
  explicitlyOverridden: report.explicitlyOverridden,
  unresolved: report.unresolved,
  categoryCounts: report.categoryCounts,
  evolutionBehaviorCounts: report.evolutionBehaviorCounts,
  unresolvedRoutes: unresolved.map(record => record.slug)
}, null, 2));
if (unresolved.length) process.exitCode = 1;
