import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SITE_NAME, SITE_URL } from '../../../src/seo/seoConfig.js';
import { moveLearnerFacts } from './moveLearnerFacts.js';
import { loadPokemon } from './pokemonData.js';
import { POKEMON_SLUGS, pokemonPath, repositoryRoot } from './routes.js';

const source = JSON.parse(readFileSync(join(repositoryRoot, 'public/data/abilities.json'), 'utf8'));
export const ABILITY_SLUGS = Object.freeze(Object.keys(source));
export const ABILITY_SLUG_SET = new Set(ABILITY_SLUGS);
export const ABILITY_REGISTRY = Object.freeze(ABILITY_SLUGS.map(slug => Object.freeze({
  slug,
  displayName: formatAbilityName(slug),
  sourceId: null,
  generation: source[slug].generation
})));

let holderIndex;
function abilitySlug(name) {
  return String(name ?? '').trim().toLowerCase().replaceAll(' ', '-');
}
export function formatAbilityName(value) {
  return String(value ?? '').split('-').filter(Boolean).map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
}
function holdersByAbility() {
  if (holderIndex) return holderIndex;
  const facts = moveLearnerFacts();
  holderIndex = Object.fromEntries(ABILITY_SLUGS.map(slug => [slug, new Map()]));
  for (const pokemonSlug of POKEMON_SLUGS) {
    const { p } = loadPokemon(pokemonSlug);
    for (const ability of p.abilities ?? []) {
      const slug = abilitySlug(ability.name);
      const map = holderIndex[slug];
      if (!map) continue;
      const current = map.get(pokemonSlug) ?? {
        ...facts[pokemonSlug],
        sprite: facts[pokemonSlug].cardSprite,
        regular: false,
        hidden: false,
        slots: []
      };
      if (ability.hidden) current.hidden = true;
      else current.regular = true;
      if (Number.isFinite(ability.slot) && !current.slots.includes(ability.slot)) current.slots.push(ability.slot);
      map.set(pokemonSlug, current);
    }
  }
  return holderIndex;
}
function readOaksNotes(slug) {
  const path = join(repositoryRoot, 'public/data/oaksNotes/abilities', `${slug}.json`);
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
}
export function abilityModel(slug) {
  const record = source[slug];
  if (!record) return null;
  const holders = [...holdersByAbility()[slug].values()].sort((a, b) => a.id - b.id || a.name.localeCompare(b.name));
  const regularHolders = holders.filter(holder => holder.regular);
  const hiddenHolders = holders.filter(holder => holder.hidden);
  const displayName = formatAbilityName(slug);
  const canonical = `${SITE_URL}/ability/${slug}`;
  const description = `View the ${displayName} ability effect, generation, and ${holders.length} canonical Pokémon form${holders.length === 1 ? '' : 's'} that can have it.`;
  const rawHolders = record.pokemon ?? [];
  return {
    slug,
    displayName,
    sourceId: null,
    generation: record.generation,
    generationDisplay: formatAbilityName(record.generation),
    shortEffect: record.shortEffect,
    effect: record.effect,
    holders,
    regularHolders,
    hiddenHolders,
    rawHolderCount: rawHolders.length,
    routedHolderCount: holders.length,
    rawOnlyHolders: rawHolders.filter(name => !holders.some(holder => holder.name === name)),
    routedOnlyHolders: holders.filter(holder => !rawHolders.includes(holder.name)).map(holder => holder.name),
    oaksNotes: readOaksNotes(slug),
    seo: {
      title: `${displayName} Ability Guide | ${SITE_NAME}`,
      description,
      canonical,
      structuredData: {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: `${displayName} Ability Guide`, description, mainEntity: { '@id': `${canonical}#ability` }, breadcrumb: { '@id': `${canonical}#breadcrumb` } },
          { '@type': 'Thing', '@id': `${canonical}#ability`, name: displayName, description: record.effect, additionalProperty: [{ '@type': 'PropertyValue', name: 'Introduced', value: formatAbilityName(record.generation) }, { '@type': 'PropertyValue', name: 'Canonical Pokémon holders', value: holders.length }] },
          { '@type': 'BreadcrumbList', '@id': `${canonical}#breadcrumb`, itemListElement: [
            { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'Abilities', item: `${SITE_URL}/abilities` },
            { '@type': 'ListItem', position: 3, name: displayName, item: canonical }
          ] }
        ]
      }
    }
  };
}
export function allAbilityModels() {
  return ABILITY_SLUGS.map(abilityModel);
}
export function abilityPokemonPath(holder) {
  return pokemonPath(holder.name);
}
