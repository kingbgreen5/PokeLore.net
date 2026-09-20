import { pokemonSeo, homeSeo, SITE_URL } from '../../../src/seo/seoConfig.js';
import { routes } from './routes.js';
export { homeSeo };
export function referenceSeo(data) {
  const seo = structuredClone(pokemonSeo(data.p));
  seo.image = new URL(data.artwork, SITE_URL).href;
  seo.robots = 'index,follow,max-image-preview:large';
  // Phase 1B renders the actual size comparison: retain its intended schema.
  for (const node of seo.structuredData['@graph']) {
    if (node['@type'] === 'Thing') {
      node.image = seo.image;
      // API form IDs (e.g. 10100) are not National Pokédex numbers.
      const nationalId = routes.byName[data.p.species];
      node.identifier = `National Pokédex #${nationalId}`;
      node.additionalProperty.find(p => p.name === 'National Pokédex number').value = nationalId;
    }
  }
  return seo;
}
