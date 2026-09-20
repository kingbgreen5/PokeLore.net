export const POC_SLUGS = ['kakuna', 'pikachu', 'charizard', 'raichu-alola'];
export function publicHref(path) {
  if (!path || !path.startsWith('/')) return path;
  const pathname = path.split(/[?#]/)[0];
  return pathname === '/' || POC_SLUGS.some(s => pathname === `/pokemon/${s}`)
    ? path : `https://pokelore.net${path}`;
}
