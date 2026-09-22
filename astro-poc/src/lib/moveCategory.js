import { VERSION_GROUP_ORDER } from '../../../src/constants/versionOrder.js';

// Research and edge cases: ../../LEARNSET_CATEGORIES.md
const legacyVersions = new Set([
  'red-green-japan', 'blue-japan', 'red-blue', 'yellow',
  'gold-silver', 'crystal', 'ruby-sapphire', 'emerald',
  'firered-leafgreen', 'colosseum', 'xd'
]);
const physicalTypes = new Set([
  'normal', 'fighting', 'flying', 'poison', 'ground',
  'rock', 'bug', 'ghost', 'steel'
]);
const specialTypes = new Set([
  'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark'
]);

export function usesTypeBasedCategories(version) {
  return legacyVersions.has(version);
}

export function getLearnsetMoveDisplay(move, version) {
  const category = move?.category?.toLowerCase();
  let type = move?.type?.toLowerCase();
  if (!usesTypeBasedCategories(version)) return { type, category };

  // pastValues describes the value BEFORE its versionGroup change boundary.
  // Use the first later type change, not the current type (e.g. Gen I Bite).
  const rank = VERSION_GROUP_ORDER.indexOf(version);
  const change = (move?.pastTypes ?? [])
    .filter(entry => VERSION_GROUP_ORDER.indexOf(entry.versionGroup) > rank)
    .sort((a, b) => VERSION_GROUP_ORDER.indexOf(a.versionGroup) - VERSION_GROUP_ORDER.indexOf(b.versionGroup))[0];
  if (change) type = change.type;

  // Power may be null for damaging moves such as Night Shade and Sonic Boom.
  if (category === 'status' || !['physical', 'special'].includes(category)) {
    return { type, category };
  }
  if (move.name === 'hidden-power' || move.name === 'weather-ball') {
    return {
      type,
      category: 'variable',
      categoryNote: move.name === 'hidden-power'
        ? 'Physical or Special depending on the type determined by the Pokémon’s IVs.'
        : 'Physical or Special depending on the move’s type in the current weather.'
    };
  }
  return {
    type,
    category: physicalTypes.has(type) ? 'physical' : specialTypes.has(type) ? 'special' : category
  };
}
