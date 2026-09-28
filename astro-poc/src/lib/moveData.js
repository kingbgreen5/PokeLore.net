import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { VERSION_GROUP_ORDER } from '../../../src/constants/versionOrder.js';
import { formatPokemonDisplayName } from '../../../src/utils/pokemonNames.js';
import { routes, repositoryRoot } from './routes.js';
export { MOVE_STRESS_SLUGS } from './moveRoutes.js';

const movesDirectory = join(repositoryRoot, 'public', 'data', 'moves');
const learnersDirectory = join(repositoryRoot, 'public', 'data', 'moveLearners');
const moveIndex = JSON.parse(readFileSync(join(repositoryRoot, 'public', 'data', 'movesIndex.json'), 'utf8'));
export const MOVE_SLUGS = Object.freeze(moveIndex.map(move => move.name));
export const MOVE_SLUG_SET = new Set(MOVE_SLUGS);

export function formatMoveValue(value, suffix = '') {
  return value === null || value === undefined || value === '' ? '—' : `${value}${suffix}`;
}

export function formatLabel(value) {
  return String(value ?? '').split('-').filter(Boolean).map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
}

function canonicalPokemon(pokemon) {
  if (!routes.byName[pokemon.name]) return null;
  const index = routes.byName[pokemon.name];
  return {
    id: pokemon.id,
    name: pokemon.name,
    displayName: formatPokemonDisplayName({ ...pokemon, ...index }),
    sprite: pokemon.sprite
  };
}

function groupForVersion(source, versionGroup) {
  const groups = new Map();
  for (const pokemon of source.pokemon ?? []) {
    const methods = (pokemon.methods ?? [{ method: pokemon.method ?? 'other', versionGroup: pokemon.versionGroup }])
      .filter(method => method.versionGroup === versionGroup);
    if (!methods.length) continue;
    const canonical = canonicalPokemon(pokemon);
    if (!canonical) continue;
    for (const method of new Set(methods.map(entry => entry.method ?? 'other'))) {
      if (!groups.has(method)) groups.set(method, []);
      if (!groups.get(method).some(entry => entry.name === canonical.name)) groups.get(method).push(canonical);
    }
  }
  return [...groups].map(([method, pokemon]) => ({ method, label: learnerMethodLabel(method), pokemon }));
}

export function learnerMethodLabel(method) {
  return ({ 'level-up': 'Level Up', machine: 'TMs, HMs, and TRs', egg: 'Via Breeding', tutor: 'Move Tutor', 'xd-purification': 'XD Purification', 'form-change': 'Form Change' })[method] ?? formatLabel(method);
}

export function loadMove(slug) {
  if (!MOVE_SLUG_SET.has(slug)) throw new Error(`Unregistered Move slug: ${slug}`);
  const move = JSON.parse(readFileSync(join(movesDirectory, `${slug}.json`), 'utf8'));
  const learnerPath = join(learnersDirectory, `${slug}.json`);
  const learners = existsSync(learnerPath) ? JSON.parse(readFileSync(learnerPath, 'utf8')) : { pokemon: [] };
  const versions = [...new Set((learners.pokemon ?? []).flatMap(pokemon => (pokemon.methods ?? []).map(method => method.versionGroup)).filter(Boolean))]
    .sort((a, b) => (VERSION_GROUP_ORDER.indexOf(a) === -1 ? 999 : VERSION_GROUP_ORDER.indexOf(a)) - (VERSION_GROUP_ORDER.indexOf(b) === -1 ? 999 : VERSION_GROUP_ORDER.indexOf(b)));
  const latestVersion = versions.at(-1) ?? null;
  const latestGroups = latestVersion ? groupForVersion(learners, latestVersion) : [];
  const learnerCount = new Set((learners.pokemon ?? []).map(pokemon => pokemon.name).filter(name => routes.byName[name])).size;
  return { move, learners, versions, latestVersion, latestGroups, learnerCount };
}

export function moveLearnerPayload(slug) {
  const data = loadMove(slug);
  return JSON.stringify({
    move: slug,
    versions: data.versions,
    groupsByVersion: Object.fromEntries(data.versions.map(version => [version, groupForVersion(data.learners, version).map(group => ({
      ...group,
      pokemon: group.pokemon.map(({ id, name, displayName }) => ({ id, name, displayName }))
    }))]))
  });
}

export function moveSeoData(data) {
  const { move } = data;
  const name = move.displayName ?? formatLabel(move.name);
  const canonical = `https://pokelore.net/move/${move.name}`;
  const description = `View ${name}'s ${formatLabel(move.type)} type, ${formatLabel(move.category)} category, power, accuracy, PP, effect, and Pokémon learners.`;
  return {
    title: `${name} Move Guide | PokéLore`, description, canonical,
    robots: 'index,follow,max-image-preview:large',
    structuredData: {
      '@context': 'https://schema.org', '@graph': [
        { '@type': 'WebPage', '@id': canonical, url: canonical, name: `${name} Move Guide`, description },
        { '@type': 'Thing', '@id': `${canonical}#move`, name, description: move.shortEffect ?? move.description ?? move.effect, additionalProperty: [
          ['Type', formatLabel(move.type)], ['Category', formatLabel(move.category)], ['Power', formatMoveValue(move.power)],
          ['Accuracy', formatMoveValue(move.accuracy, move.accuracy == null ? '' : '%')], ['PP', formatMoveValue(move.pp)], ['Priority', formatMoveValue(move.priority)]
        ].map(([name, value]) => ({ '@type': 'PropertyValue', name, value })) },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'PokéLore', item: 'https://pokelore.net/' },
          { '@type': 'ListItem', position: 2, name: 'Moves', item: 'https://pokelore.net/moves' },
          { '@type': 'ListItem', position: 3, name, item: canonical }
        ] }
      ]
    }
  };
}
