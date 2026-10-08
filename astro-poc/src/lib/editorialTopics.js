import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { itemLocationTopics } from '../../../src/topics/topicMetadata.js';
import { repositoryRoot } from './routes.js';

const root = repositoryRoot;
const readJson = relative => JSON.parse(readFileSync(join(root, relative), 'utf8'));
const articleDirectory = join(root, 'public/data/topics/articles');
const articleIndex = readJson('public/data/topics/topicIndex.json').topics;
const pokedexTopics = readJson('public/data/pokedexTopics.json').topics;

const articles = new Map(readdirSync(articleDirectory)
  .filter(file => file.endsWith('.json'))
  .map(file => {
    const article = JSON.parse(readFileSync(join(articleDirectory, file), 'utf8'));
    return [article.slug, article];
  }));

export const STATIC_TOPICS = itemLocationTopics.filter(topic => topic.active);
export const ARTICLE_TOPICS = articleIndex.filter(topic => topic.active !== false)
  .map(index => ({ ...index, article: articles.get(index.slug), kind: 'article' }));
export const POKEDEX_TOPICS = pokedexTopics.filter(topic => topic.active)
  .map(topic => ({ ...topic, kind: 'pokedex' }));
export const ACTIVE_TOPICS = [
  ...STATIC_TOPICS.map(topic => ({ ...topic, kind: 'static' })),
  ...ARTICLE_TOPICS,
  ...POKEDEX_TOPICS
];
export const TOPIC_BY_SLUG = new Map(ACTIVE_TOPICS.map(topic => [topic.slug, topic]));
export const TOPIC_SLUGS = ACTIVE_TOPICS.map(topic => topic.slug);
export const HIDDEN_TOPIC_SLUGS = [
  ...pokedexTopics.filter(topic => !topic.active).map(topic => topic.slug),
  ...articleIndex.filter(topic => topic.active === false).map(topic => topic.slug)
];

const subgroupOrder = ['guides', 'item-locations', 'biomes', 'behavior', 'lore', 'miscellaneous', 'other'];
export const subgroupLabels = { guides: 'Guides', biomes: 'Biomes', 'item-locations': 'Item Locations', behavior: 'Behavior', lore: 'Lore', miscellaneous: 'Miscellaneous' };
export const TOPIC_GROUPS = subgroupOrder.map(subgroup => ({
  subgroup,
  title: subgroupLabels[subgroup] ?? subgroup,
  topics: ACTIVE_TOPICS.filter(topic => (topic.subgroup ?? 'other') === subgroup)
})).filter(group => group.topics.length);

export function getTopic(slug) { return TOPIC_BY_SLUG.get(slug); }
export function topicSeo(topic) {
  const article = topic.article;
  return {
    title: topic.seoTitle ?? `${topic.title} | PokéLore`,
    description: topic.seoDescription ?? article?.excerpt ?? topic.shortDescription ?? 'Explore Pokémon grouped by official Pokédex entry text.',
    canonical: `https://pokelore.net/topic/${topic.slug}`,
    robots: 'index,follow,max-image-preview:large'
  };
}
export function topicCountLabel(topic) {
  return topic.countLabel ?? `${topic.pokemonCount} Pokemon · ${topic.entryCount} entries`;
}
export function formatArticleDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}
export function parseInlineText(text = '') {
  const pieces = [];
  const expression = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  for (const match of String(text).matchAll(expression)) {
    if (match.index > last) pieces.push({ text: text.slice(last, match.index) });
    pieces.push({ text: match[1], href: match[2] });
    last = match.index + match[0].length;
  }
  if (last < String(text).length) pieces.push({ text: text.slice(last) });
  return pieces.length ? pieces : [{ text: String(text) }];
}

export function itemLocationRows(game) {
  const sourceItems = readJson('public/data/itemLocationsCurated.json').items ?? [];
  const items = readJson('public/data/itemsIndex.json');
  const itemsByName = new Map(items.map(item => [item.name, item]));
  return sourceItems.flatMap(record => (record.acquisition ?? [])
    .filter(method => method.games?.includes(game))
    .map((method, index) => ({
      item: { name: record.item, displayName: record.displayName ?? itemsByName.get(record.item)?.displayName ?? record.item, sprite: itemsByName.get(record.item)?.sprite ?? null },
      version: game,
      method: { type: method.acquisitionType, area: method.area, details: method.method, requirements: method.requirements ?? [], repeatable: method.repeatable, versionExclusive: method.versionExclusive, location: method.location, key: `${record.item}-${method.location?.name ?? method.location ?? 'unknown'}-${method.method}-${index}` }
    })));
}
