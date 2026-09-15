// WotC-era assignments, not modern TCG assignments. Rewards are house rules.
// Sources: https://bulbapedia.bulbagarden.net/wiki/Grass_(TCG)
// https://bulbapedia.bulbagarden.net/wiki/Colorless_(TCG)
// https://bulbapedia.bulbagarden.net/wiki/Type_(TCG)
const base = {
  Grass: ['grass', 'bug', 'poison'], Fire: ['fire'], Water: ['water', 'ice'],
  Lightning: ['electric'], Fighting: ['fighting', 'rock', 'ground'],
  Psychic: ['psychic', 'ghost'], Colorless: ['normal', 'flying', 'dragon'],
};
export const ENERGY_ERAS = { base, neo: { ...base, Darkness: ['dark'], Metal: ['steel'] } };
export const SPECIAL_ENERGY = {
  'Double Colorless Energy': ['Colorless'], 'Full Heal Energy': ['Colorless'],
  'Potion Energy': ['Colorless'], 'Recycle Energy': ['Colorless'],
  'Rainbow Energy': Object.keys(base).filter(type => type !== 'Colorless'),
  'Miracle Energy': [...Object.keys(base), 'Darkness', 'Metal'],
};
export function energyRewardTypes(card, era, game) {
  const mapping = ENERGY_ERAS[era];
  const energy = SPECIAL_ENERGY[card.name] ?? [card.name.replace(/ Energy$/, '')];
  const types = [...new Set(energy.flatMap(type => mapping[type] ?? []))];
  const gen1 = ['red-green-japan', 'blue-japan', 'red-blue', 'yellow'].includes(game);
  return types.filter(type => !gen1 || !['dark', 'steel'].includes(type));
}
