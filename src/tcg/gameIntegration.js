import { VERSION_GROUP_ORDER } from '../constants/versionOrder.js';

// The shared Pokémon index stores current types. Handle the type changes for
// National Dex 1–251 when presenting these vintage species in earlier games.
export function challengePokemonTypes(pokemon, game) {
  const generationOne = ['red-green-japan', 'blue-japan', 'red-blue', 'yellow'].includes(game);
  if (generationOne && [81, 82].includes(pokemon.id)) return ['electric'];
  if (VERSION_GROUP_ORDER.indexOf(game) < VERSION_GROUP_ORDER.indexOf('x-y')) {
    if ([35, 36, 173, 175, 209, 210].includes(pokemon.id)) return ['normal'];
    if (pokemon.id === 176) return ['normal', 'flying'];
    return pokemon.types.filter(type => type !== 'fairy');
  }
  return pokemon.types;
}
