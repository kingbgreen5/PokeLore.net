import typeColors from '../../../src/constants/typeColors.js';
import { isItemHiddenFromUi } from '../../../src/utils/itemVisibility.js';
import { applyTmMaterialFallback, getTmMaterialDetail } from '../../../src/utils/tmMaterialDetails.js';
import { getPokemonUrl } from '../../../src/utils/pokemonUrls.js';
function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function capitalize(text) {
  return String(text)
    .split("-")
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function compactName(text) {
  return normalizeText(text).replace(/\s+/g, "");
}

function fuzzySubsequenceScore(query, target) {
  let queryIndex = 0;
  let score = 0;
  let streak = 0;

  for (
    let targetIndex = 0;
    targetIndex < target.length &&
    queryIndex < query.length;
    targetIndex++
  ) {
    if (
      query[queryIndex] === target[targetIndex]
    ) {
      queryIndex++;
      streak++;
      score += 2 + streak;
    } else {
      streak = 0;
    }
  }

  if (queryIndex !== query.length) {
    return 0;
  }

  return Math.min(score, 35);
}

function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 3) {
    return 4;
  }

  const previous = Array.from(
    { length: b.length + 1 },
    (_, index) => index
  );

  for (let i = 1; i <= a.length; i++) {
    const current = [i];

    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] +
          (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }

    previous.splice(
      0,
      previous.length,
      ...current
    );
  }

  return previous[b.length];
}

function scoreRecord(record, query) {
  const normalizedQuery =
    normalizeText(query);
  const compactQuery =
    compactName(query);

  if (!normalizedQuery) {
    return 0;
  }

  const searchable =
    record.searchable;
  const compactSearchable =
    compactName(searchable);
  const label =
    normalizeText(record.label);
  const words =
    searchable.split(" ").filter(Boolean);
  const queryWords =
    normalizedQuery.split(" ").filter(Boolean);

  let score = 0;

  if (label === normalizedQuery) {
    score += 120;
  }

  if (label.startsWith(normalizedQuery)) {
    score += 90;
  }

  if (searchable.includes(normalizedQuery)) {
    score += 70;
  }

  if (compactSearchable.includes(compactQuery)) {
    score += 55;
  }

  for (const queryWord of queryWords) {
    if (
      words.some(word =>
        word.startsWith(queryWord)
      )
    ) {
      score += 18;
      continue;
    }

    if (
      words.some(
        word =>
          queryWord.length > 2 &&
          editDistance(queryWord, word) <= 2
      )
    ) {
      score += 12;
    }
  }

  score += fuzzySubsequenceScore(
    compactQuery,
    compactSearchable
  );

  return score;
}

function buildSearchRecord({
  id,
  label,
  category,
  route,
  description,
  sprite,
  keywords = []
}) {
  return {
    id,
    label,
    category,
    route,
    description,
    sprite,
    searchable: normalizeText(
      [
        label,
        category,
        description,
        ...keywords
      ].join(" ")
    )
  };
}


export function createSearchRecords({pokemonIndex,moves,abilities,items,locations,tmMaterialDetails}) {
        const nextRecords = [
          buildSearchRecord({
            id: "pokemon-page",
            label: "Pokémon",
            category: "Page",
            route: "/",
            description: "Pokémon database"
          }),
          buildSearchRecord({
            id: "moves-page",
            label: "Moves",
            category: "Page",
            route: "/moves",
            description: "Move database"
          }),
          buildSearchRecord({
            id: "abilities-page",
            label: "Abilities",
            category: "Page",
            route: "/abilities",
            description: "Ability database"
          }),
          buildSearchRecord({
            id: "items-page",
            label: "Items",
            category: "Page",
            route: "/items",
            description: "Item database"
          }),
          buildSearchRecord({
            id: "locations-page",
            label: "Locations",
            category: "Page",
            route: "/locations",
            description: "Location database"
          }),
          buildSearchRecord({
            id: "tools-page",
            label: "Tools",
            category: "Page",
            route: "/tools",
            description:
              "Pokemon calculators and planning tools",
            keywords: [
              "team builder",
              "team coverage",
              "feebas calculator",
              "ev training",
              "single type coverage"
            ]
          }),
          buildSearchRecord({
            id: "ev-training-routes-page",
            label:
              "Best EV Training Locations Calculator",
            category: "Page",
            route: "/ev-training-routes",
            description:
              "Top EV training locations by game and stat",
            keywords: [
              "effort values",
              "ev yields",
              "wild encounters"
            ]
          }),
          buildSearchRecord({
            id: "types-page",
            label: "Types",
            category: "Page",
            route: "/types",
            description: "Type matchups"
          }),
          ...pokemonIndex.map(pokemon =>
            buildSearchRecord({
              id: `pokemon-${pokemon.id}`,
              label: capitalize(pokemon.name),
              category: "Pokémon",
              route: getPokemonUrl(pokemon),
              description: `No. ${pokemon.id}`,
              sprite: pokemon.sprite,
              keywords: [
                pokemon.name,
                String(pokemon.id),
                ...(pokemon.types ?? [])
              ]
            })
          ),
          ...Object.entries(moves).map(
            ([name, move]) =>
              buildSearchRecord({
                id: `move-${name}`,
                label: capitalize(name),
                category: "Move",
                route: `/move/${name}`,
                description: capitalize(move.type),
                keywords: [
                  name,
                  move.type,
                  move.category,
                  move.description
                ]
              })
          ),
          ...Object.values(abilities).map(
            ability =>
              buildSearchRecord({
                id: `ability-${ability.name}`,
                label: capitalize(ability.name),
                category: "Ability",
                route: `/ability/${ability.name}`,
                description:
                  ability.shortEffect,
                keywords: [
                  ability.name,
                  ability.effect,
                  ability.generation
                ]
              })
          ),
          ...items
            .filter(
              item => !isItemHiddenFromUi(item)
            )
            .map(item => {
              const enrichedItem =
                applyTmMaterialFallback(
                  item,
                  getTmMaterialDetail(
                    item,
                    tmMaterialDetails
                  )
                );

              return buildSearchRecord({
                id: `item-${enrichedItem.name}`,
                label:
                  enrichedItem.displayName ??
                  capitalize(
                    enrichedItem.name
                  ),
                category: "Item",
                route: `/item/${enrichedItem.name}`,
                description:
                  enrichedItem.categoryDisplayName,
                sprite: enrichedItem.sprite,
                keywords: [
                  enrichedItem.name,
                  enrichedItem.pocket,
                  enrichedItem.shortEffect
                ]
              });
            }),
          ...locations.map(location =>
            buildSearchRecord({
              id: `location-${location.name}`,
              label: location.displayName,
              category: "Location",
              route: `/location/${location.name}`,
              description:
                location.regionDisplayName,
              keywords: [
                location.name,
                location.region,
                location.regionDisplayName
              ]
            })
          ),
          ...Object.keys(typeColors).map(type =>
            buildSearchRecord({
              id: `type-${type}`,
              label: capitalize(type),
              category: "Type",
              route: `/type/${type}`,
              description: "Type matchups",
              keywords: [type, "type"]
            })
          )
        ];


return nextRecords;
}
