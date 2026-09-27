export const STRESS_SLUGS = [
  'kakuna', 'pikachu', 'charizard', 'raichu-alola',
  'eevee', 'tyrogue', 'nincada', 'shedinja',
  'ditto', 'mewtwo',
  'ponyta-galar', 'zorua-hisui', 'tauros-paldea-combat-breed',
  'deoxys-attack', 'rotom-heat', 'giratina-origin',
  'darmanitan-galar-standard', 'lycanroc-dusk',
  'meowstic-female', 'indeedee-female', 'oinkologne-female', 'frillish-female',
  'alcremie', 'vivillon', 'furfrou', 'minior-blue',
  'palafin-hero', 'aegislash-blade', 'ogerpon-wellspring-mask', 'charizard-mega-x'
];
export function publicHref(path) {
  if (!path || !path.startsWith('/')) return path;
  const pathname = path.split(/[?#]/)[0];
  return pathname === '/' || /^\/pokemon\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pathname)
    ? path : `https://pokelore.net${path}`;
}
