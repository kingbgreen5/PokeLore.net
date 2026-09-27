import overrides from '../data/formSemanticsOverrides.json' with { type: 'json' };

export const FORM_CATEGORIES = Object.freeze([
  'default', 'regional', 'mega', 'gmax', 'battle-state', 'stance',
  'gender', 'cosmetic', 'item-form', 'environment-form',
  'permanent-alternate', 'totem'
]);

export const EVOLUTION_BEHAVIORS = Object.freeze([
  'participates', 'replace-node', 'regional-branch', 'base-relationship'
]);

// Form records directly supply these values. Editorial prose is the important
// exception: species prose must never be presented as though it describes a form.
const FIELD_POLICY = Object.freeze({
  analysis: 'unsafe',
  biology: 'unsafe',
  dexEntries: 'conditional',
  abilities: 'safe',
  types: 'safe',
  stats: 'safe',
  evolution: 'conditional',
  learnset: 'conditional',
  encounters: 'safe',
  height: 'safe',
  weight: 'safe',
  gender: 'safe',
  sizeComparison: 'safe',
  artwork: 'conditional'
});

const battleStateFamilies = new Set([
  'cramorant', 'darmanitan', 'eiscue', 'greninja', 'koraidon', 'meloetta',
  'mimikyu', 'miraidon', 'morpeko', 'palafin', 'terapagos', 'wishiwashi',
  'zygarde'
]);
const itemFormFamilies = new Set([
  'calyrex', 'dialga', 'giratina', 'groudon', 'hoopa', 'kyogre', 'kyurem',
  'landorus', 'necrozma', 'ogerpon', 'palkia', 'rotom', 'thundurus', 'tornadus',
  'enamorus', 'zacian', 'zamazenta'
]);
const environmentFamilies = new Set(['castform', 'shaymin']);
const cosmeticFamilies = new Set([
  'floette', 'magearna', 'minior', 'pikachu', 'squawkabilly', 'tatsugiri', 'zarude'
]);
const permanentFamilies = new Set([
  'basculegion', 'basculin', 'deoxys', 'dudunsparce', 'gimmighoul', 'gourgeist',
  'indeedee', 'keldeo', 'lycanroc', 'maushold', 'meowstic', 'oinkologne',
  'oricorio', 'pumpkaboo', 'rockruff', 'toxtricity', 'ursaluna', 'urshifu',
  'wormadam'
]);

function baseSpeciesSlug(pokemon, slug) {
  return pokemon?.species || pokemon?.varieties?.find(v => v.isDefault)?.name || slug.split('-')[0];
}

function automaticClassification(slug, pokemon) {
  const species = baseSpeciesSlug(pokemon, slug);
  if (pokemon?.isDefaultForm) return { category: 'default', evolutionBehavior: 'participates', rule: 'default-record' };
  if (/(?:^|-)mega(?:-[xyz])?$/.test(slug)) return { category: 'mega', evolutionBehavior: 'base-relationship', rule: 'mega-identifier' };
  if (/-gmax$/.test(slug)) return { category: 'gmax', evolutionBehavior: 'base-relationship', rule: 'gmax-identifier' };
  if (/(?:^|-)(?:alola|galar|hisui|paldea)(?:-|$)/.test(slug)) return { category: 'regional', evolutionBehavior: 'regional-branch', rule: 'regional-identifier' };
  if (/-totem(?:-|$)/.test(slug)) return { category: 'totem', evolutionBehavior: 'base-relationship', rule: 'totem-identifier' };
  if (slug.endsWith('-female') || slug.endsWith('-male')) return { category: 'gender', evolutionBehavior: 'replace-node', rule: 'gender-identifier' };
  if (slug === 'eevee-starter') return { category: 'permanent-alternate', evolutionBehavior: 'base-relationship', rule: 'starter-form-identifier' };
  if (slug === 'eternatus-eternamax') return { category: 'battle-state', evolutionBehavior: 'base-relationship', rule: 'battle-state-identifier' };
  if (slug === 'aegislash-blade') return { category: 'stance', evolutionBehavior: 'base-relationship', rule: 'stance-identifier' };
  if (battleStateFamilies.has(species)) return { category: 'battle-state', evolutionBehavior: 'base-relationship', rule: 'battle-state-family' };
  if (itemFormFamilies.has(species)) return { category: 'item-form', evolutionBehavior: 'base-relationship', rule: 'item-form-family' };
  if (environmentFamilies.has(species)) return { category: 'environment-form', evolutionBehavior: 'base-relationship', rule: 'environment-family' };
  if (cosmeticFamilies.has(species)) return { category: 'cosmetic', evolutionBehavior: 'base-relationship', rule: 'cosmetic-family' };
  if (permanentFamilies.has(species)) return { category: 'permanent-alternate', evolutionBehavior: 'replace-node', rule: 'permanent-form-family' };
  return null;
}

export function getFormSemantics(slug, pokemon) {
  const automatic = automaticClassification(slug, pokemon);
  const override = overrides[slug];
  const resolved = override ? { ...automatic, ...override, rule: 'explicit-override' } : automatic;
  if (!resolved) return null;
  return Object.freeze({
    slug,
    category: resolved.category,
    evolutionBehavior: resolved.evolutionBehavior,
    classificationSource: resolved.rule,
    reason: resolved.reason ?? null,
    inheritance: FIELD_POLICY,
    material: resolved.category !== 'default'
  });
}

export function getEvolutionIdentity(semantics, pokemon) {
  const defaultVariety = pokemon.varieties?.find(variety => variety.isDefault);
  if (semantics.evolutionBehavior === 'base-relationship') {
    return { currentPokemonName: defaultVariety?.name ?? pokemon.species, activeFormKey: null };
  }
  return {
    currentPokemonName: pokemon.name,
    activeFormKey: semantics.evolutionBehavior === 'regional-branch'
      ? pokemon.name.match(/(?:^|-)(alola|galar|hisui|paldea)(?:-|$)/)?.[1] ?? null
      : null
  };
}

export function getEvolutionClarification(semantics, displayName, baseDisplayName) {
  if (semantics.evolutionBehavior !== 'base-relationship' || displayName === baseDisplayName) return null;
  const relationship = semantics.category === 'mega' ? 'Mega Evolution'
    : semantics.category === 'gmax' ? 'Gigantamax form'
    : semantics.category === 'stance' ? 'stance'
    : semantics.category === 'battle-state' ? 'battle state'
    : 'form';
  return `${displayName} is a ${relationship} of ${baseDisplayName}, not a separate evolutionary stage. The chain below shows the base species relationship.`;
}

export function getFormSemanticsOverrides() {
  return overrides;
}
