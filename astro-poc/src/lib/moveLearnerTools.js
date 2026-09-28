export const STAT_OPTIONS = [
  ['baseStatTotal', 'Base Stat Total'], ['hp', 'HP'], ['attack', 'Attack'],
  ['defense', 'Defense'], ['specialAttack', 'Sp. Atk'],
  ['specialDefense', 'Sp. Def'], ['speed', 'Speed']
];

export const METHOD_ORDER = ['level-up', 'machine', 'egg', 'tutor', 'xd-purification', 'form-change', 'other'];

export function statValue(pokemon, stat) {
  if (!stat) return null;
  return stat === 'baseStatTotal' ? pokemon.baseStatTotal : pokemon.stats?.[stat];
}

export function compareLearners(a, b, stat, direction = 'desc') {
  if (stat) {
    const av = statValue(a, stat), bv = statValue(b, stat);
    const aMissing = !Number.isFinite(av), bMissing = !Number.isFinite(bv);
    if (aMissing !== bMissing) return aMissing ? 1 : -1;
    if (!aMissing && av !== bv) return direction === 'asc' ? av - bv : bv - av;
  }
  return (a.id ?? Number.MAX_SAFE_INTEGER) - (b.id ?? Number.MAX_SAFE_INTEGER)
    || a.name.localeCompare(b.name);
}

export function filterAndSortGroups(groups, facts, options = {}) {
  const { method = '', stat = '', direction = 'desc', minimum = '', maximum = '' } = options;
  const min = minimum === '' ? null : Number(minimum), max = maximum === '' ? null : Number(maximum);
  return groups
    .filter(group => !method || group.method === method)
    .map(group => ({ ...group, pokemon: group.pokemon
      .map(identity => facts[identity.name] ? { ...identity, ...facts[identity.name] } : null)
      .filter(Boolean)
      .filter(pokemon => {
        if (!stat) return true;
        const value = statValue(pokemon, stat);
        return Number.isFinite(value) && (min === null || value >= min) && (max === null || value <= max);
      })
      .sort((a, b) => compareLearners(a, b, stat, direction)) }))
    .filter(group => group.pokemon.length);
}

export function uniqueLearners(groups) {
  const byName = new Map();
  for (const group of groups) for (const pokemon of group.pokemon) if (!byName.has(pokemon.name)) byName.set(pokemon.name, pokemon);
  return [...byName.values()];
}

export function sizeChartLearners(groups) {
  return uniqueLearners(groups).filter(pokemon => Number.isFinite(pokemon.height) && pokemon.height > 0)
    .sort((a, b) => b.height - a.height || compareLearners(a, b));
}

export function allMoveLearners(groupsByVersion, facts) {
  const byName = new Map();
  for (const groups of Object.values(groupsByVersion ?? {})) for (const group of groups) for (const identity of group.pokemon) {
    if (!byName.has(identity.name) && facts[identity.name]) byName.set(identity.name, { ...identity, ...facts[identity.name] });
  }
  return [...byName.values()];
}

export function formatHeight(decimetres) {
  const inches = Math.round(decimetres * 3.937007874);
  return `${Math.floor(inches / 12)}' ${inches % 12}\"`;
}
