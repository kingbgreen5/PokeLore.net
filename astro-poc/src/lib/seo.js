import { pokemonSeo, homeSeo, SITE_URL } from '../../../src/seo/seoConfig.js';
export { homeSeo };
export function referenceSeo(data) {
  const seo = structuredClone(pokemonSeo(data.p));
  seo.image = new URL(data.artwork, SITE_URL).href;
  seo.robots = 'index,follow,max-image-preview:large';
  if (!data.hasSizeComparison) {
    seo.description = `Explore ${data.name}'s stats, moves, abilities, evolution details, type matchups, locations, and Pokédex entries.`;
    seo.structuredData['@graph'] = seo.structuredData['@graph'].filter(node => node['@type'] !== 'CreativeWork');
    for (const node of seo.structuredData['@graph']) {
      if (node['@type'] === 'WebPage') delete node.hasPart;
      if (node.description) node.description = seo.description;
    }
  }
  // Retain size-comparison schema only when the routed form has measured bounds.
  for (const node of seo.structuredData['@graph']) {
    if (node['@type'] === 'Thing') {
      node.image = seo.image;
      // API form IDs (e.g. 10100) are not National Pokédex numbers.
      const nationalId = data.nationalDexNumber;
      node.identifier = `National Pokédex #${nationalId}`;
      node.additionalProperty.find(p => p.name === 'National Pokédex number').value = nationalId;
    }
  }
  return seo;
}
