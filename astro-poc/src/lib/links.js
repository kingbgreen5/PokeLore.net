export const POC_SLUGS = ['kakuna', 'pikachu', 'charizard', 'raichu-alola'];
export function publicHref(path) {
  if (!path || !path.startsWith('/')) return path;
  const pathname = path.split(/[?#]/)[0];
  return pathname === '/' || /^\/pokemon\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pathname)
    ? path : `https://pokelore.net${path}`;
}
