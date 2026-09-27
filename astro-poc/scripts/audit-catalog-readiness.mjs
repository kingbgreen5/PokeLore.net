// Read-only source audit for the full registry. It does not add routes or write source data.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePokeloreAnalysis } from '../../src/utils/pokeloreAnalysis.js';
import { getLearnsetCandidateIds, hasLearnsetMoves } from '../../src/utils/learnsetDisplay.js';
import { buildEvolutionDisplayModel } from '../../src/utils/evolutionDisplay.js';
import { getFormSemantics, getEvolutionIdentity } from '../src/lib/formSemantics.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const dataDir = join(root, 'public', 'data');
const read = name => JSON.parse(readFileSync(join(dataDir, name), 'utf8'));
const routes = read('pokemonRoutes.json');
const abilities = read('abilities.json');
const analyses = read('PokeloreAnalysis.json');
const artwork = read('pokemonArtworkManifest.json').artwork ?? {};
const bounds = read('pokemonSpriteBounds.json').sprites ?? {};
const evolutionOverrides = read('evolutionMethodOverrides.json');
const findings = {
  fatal: [],
  missingFormSpecificAnalysis: [],
  missingLocalArtworkUsingSpriteFallback: [],
  noEncounterLocations: [],
  missingSpriteBounds: [],
  missingDirectAbilities: [],
  missingWeight: [],
  missingBaseExperience: [],
  unresolvedFormSemantics: [],
  unsafeFormInheritance: [],
  battleFormsInsertedAsEvolutionStages: [],
  modelFailures: []
};
const models = [];

for (const [slug, id] of Object.entries(routes.byName)) {
  const file = `pokemonData/${id}.json`;
  if (!existsSync(join(dataDir, file))) { findings.fatal.push(`${slug}: missing ${file}`); continue; }
  const pokemon = read(file);
  const variety = pokemon.varieties?.find(candidate => candidate.name === slug);
  if (pokemon.id !== id || !variety) findings.fatal.push(`${slug}: registry identity mismatch`);
  const routedPokemon = pokemon.name === slug ? pokemon : {
    ...pokemon, name: slug, isDefaultForm: Boolean(variety?.isDefault),
    sprite: variety?.spriteFallback ?? variety?.sprite,
    types: variety?.types ?? pokemon.types
  };
  const semantics = getFormSemantics(slug, routedPokemon);
  if (!semantics) findings.unresolvedFormSemantics.push(slug);
  for (const stat of ['hp','attack','defense','specialAttack','specialDefense','speed']) {
    if (!Number.isFinite(pokemon.stats?.[stat])) findings.fatal.push(`${slug}: missing stat ${stat}`);
  }
  for (const ability of pokemon.abilities ?? []) {
    const key = ability.name.toLowerCase().replaceAll(' ', '-');
    if (!abilities[key]?.shortEffect?.trim()) findings.fatal.push(`${slug}: missing ability description ${key}`);
  }
  if (!(routedPokemon.abilities?.length > 0)) findings.missingDirectAbilities.push(slug);
  if (!(routedPokemon.weight > 0)) findings.missingWeight.push(slug);
  if (!Number.isFinite(routedPokemon.baseExperience)) findings.missingBaseExperience.push(slug);
  if (!(pokemon.dexEntries?.length > 0)) findings.fatal.push(`${slug}: no Pokédex entries`);
  if (!existsSync(join(dataDir, `evolutionChains/${pokemon.evolutionChainId}.json`))) findings.fatal.push(`${slug}: missing evolution chain`);
  const hasLearnset = getLearnsetCandidateIds(pokemon).some(candidate => {
    const candidateFile = join(dataDir, 'pokemonLearnsets', `${candidate}.json`);
    return existsSync(candidateFile) && hasLearnsetMoves(JSON.parse(readFileSync(candidateFile, 'utf8')));
  });
  if (!hasLearnset) findings.fatal.push(`${slug}: no usable learnset`);
  const analysis = resolvePokeloreAnalysis(analyses, routedPokemon);
  const completeAnalysis = ['description','playthrough','competitive','nuzlocke','biologyAndBehavior']
    .every(key => typeof analysis?.[key] === 'string' && analysis[key].trim());
  if (!completeAnalysis || (!routedPokemon.isDefaultForm && !analysis?.form)) findings.missingFormSpecificAnalysis.push(slug);
  const localArtwork = artwork[id]?.detail;
  if (!localArtwork || !existsSync(join(root, 'public', localArtwork))) findings.missingLocalArtworkUsingSpriteFallback.push(slug);
  const encounterFile = join(dataDir, 'pokemonEncounters', `${id}.json`);
  const encounters = existsSync(encounterFile) ? JSON.parse(readFileSync(encounterFile, 'utf8')) : null;
  if (!(encounters?.locations?.length > 0)) findings.noEncounterLocations.push(slug);
  if (!bounds[id]) findings.missingSpriteBounds.push(slug);
  if (semantics?.material) {
    const unsafe = Object.entries(semantics.inheritance).filter(([, policy]) => policy === 'unsafe').map(([field]) => field);
    if (unsafe.length) findings.unsafeFormInheritance.push(`${slug}: omitted ${unsafe.join(', ')}`);
  }
  try {
    const chain = read(`evolutionChains/${pokemon.evolutionChainId}.json`);
    const identity = semantics ? getEvolutionIdentity(semantics, routedPokemon) : { currentPokemonName: slug, activeFormKey: null };
    const evolution = buildEvolutionDisplayModel(chain.root, { ...identity, evolutionMethodOverrides: evolutionOverrides });
    const displayedNames = [];
    const collect = node => { displayedNames.push(node.pokemon.name); node.children.forEach(collect); };
    collect(evolution);
    if (semantics?.evolutionBehavior === 'base-relationship' && displayedNames.includes(slug)) findings.battleFormsInsertedAsEvolutionStages.push(slug);
    models.push({
      slug, canonicalUrl: `/pokemon/${slug}`, modelSuccess: true,
      formCategory: semantics?.category ?? null, evolutionBehavior: semantics?.evolutionBehavior ?? null,
      types: routedPokemon.types?.length ?? 0, abilities: routedPokemon.abilities?.length ?? 0,
      stats: Object.keys(routedPokemon.stats ?? {}).length, evolutionNodes: displayedNames,
      learnsetAvailable: hasLearnset, analysisHandling: completeAnalysis ? 'direct' : 'omit-incomplete',
      dexEntries: routedPokemon.dexEntries?.length ?? 0, encounters: encounters?.locations?.length ?? 0,
      artworkResolution: localArtwork && existsSync(join(root, 'public', localArtwork)) ? 'local' : 'sprite-fallback',
      inheritancePolicy: semantics?.inheritance ?? null
    });
  } catch (error) {
    findings.modelFailures.push(`${slug}: ${error.message}`);
    models.push({ slug, canonicalUrl: `/pokemon/${slug}`, modelSuccess: false, error: error.message });
  }
}

mkdirSync('evidence/stress', { recursive: true });
writeFileSync('evidence/stress/catalog-readiness.json', JSON.stringify({ routeCount: Object.keys(routes.byName).length, findings, models }, null, 2));
console.log(JSON.stringify({ routeCount: Object.keys(routes.byName).length,
  counts: Object.fromEntries(Object.entries(findings).map(([key, value]) => [key, value.length])),
  fatalExamples: findings.fatal.slice(0, 20),
  analysisExamples: findings.missingFormSpecificAnalysis.slice(0, 20),
  artworkExamples: findings.missingLocalArtworkUsingSpriteFallback.slice(0, 20)
}, null, 2));
if (findings.fatal.length || findings.unresolvedFormSemantics.length || findings.battleFormsInsertedAsEvolutionStages.length || findings.modelFailures.length) process.exitCode = 1;
