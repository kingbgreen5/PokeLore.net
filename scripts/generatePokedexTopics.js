import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "public", "data");
const outputPath = path.join(dataDir, "pokedexTopics.json");

const habitatSupplementByTopic = {
  "cave-pokemon": ["cave"],
  "forest-pokemon": ["forest"],
  "mountain-pokemon": ["mountain"],
  "ocean-pokemon": ["sea"],
  "urban-pokemon": ["urban"]
};








const topicDefinitions = [
  {
    slug: "forest-pokemon",
    active: true,
    subgroup: "biomes",
    title: "Forest",
    shortDescription:
      "Pokémon mentioned in forest, woodland, jungle, and tree-related Pokédex entries.",
    searchTerms: [
      "forest",
      "forests",
      "woods",
      "woodland",
      "jungle",
      "trees"
    ],
    introText:
      "These Pokémon are connected to forests, woods, jungles, trees, and similar habitats through official Pokédex entry text. Or their habitat is listed as 'Forest' in the database",
    seoTitle:
      "Pokémon That Live in Forests | PokéLore",
    seoDescription:
      "Explore Pokémon mentioned in forest-related Pokédex entries, with matching lore excerpts and links to each Pokémon page."
  },
  {
    slug: "mountain-pokemon",
    active: true,
    subgroup: "biomes",
    title: "Mountain",
    shortDescription:
      "Pokémon connected to mountains, cliffs, rocky peaks, and highland habitats.",
    searchTerms: [
      "mountain",
      "mountains",
      "cliff",
      "cliffs",
      "peak",
      "peaks",
      "rocky",
      "highlands"
    ],
    introText:
      "These Pokémon have Pokédex entries that mention mountains, cliffs, peaks, rocky places, or highland environments. Or their habitat is listed as 'Mountain' in the database",
    seoTitle:
      "Mountain Pokémon | PokéLore",
    seoDescription:
      "Explore Pokémon connected to mountain-related Pokédex entries, with official lore excerpts and links to each Pokémon page."
  },
  {
    slug: "cave-pokemon",
    active: true,
    subgroup: "biomes",
    title: "Cave",
    shortDescription:
      "Pokémon associated with caves, caverns, underground places, and darkness.",
    searchTerms: [
      "cave",
      "caves",
      "cavern",
      "caverns",
      "underground",
      "darkness"
    ],
    introText:
      "These Pokémon are tied to caves, caverns, underground areas, or darkness through official Pokédex entries. Or their habitat is listed as 'Cave' in the database",
    seoTitle:
      "Cave Pokémon | PokéLore",
    seoDescription:
      "Find Pokémon mentioned in cave-related Pokédex entries, including official excerpts and links to Pokémon detail pages."
  },
  {
    slug: "night-pokemon",
    active: true,
    subgroup: "behavior",
    title: "Nocturnal",
    shortDescription:
      "Pokémon whose Pokédex entries mention night, moonlight, darkness, or nocturnal behavior.",
    searchTerms: [
      "night",
      "nighttime",
      "moonlight",
      "darkness",
      "nocturnal",
      "after dark"
    ],
    introText:
      "These Pokémon have official Pokédex entries that connect them to night, moonlight, darkness, or activity after dark.",
    seoTitle:
      "Pokémon Active at Night | PokéLore",
    seoDescription:
      "Browse Pokémon with night-related Pokédex lore, including official entry excerpts and links to each Pokémon."
  },
  {
    slug: "ocean-pokemon",
    active: true,
    subgroup: "biomes",
    title: "Ocean",
    shortDescription:
      "Pokémon connected to oceans, seas, seafloors, waves, and marine life.",
    searchTerms: [
      "ocean",
      "sea",
      "seas",
      "seafloor",
      "underwater",
      "waves",
      "marine"
    ],
    introText:
      "These Pokémon are associated with oceans, seas, underwater places, waves, and marine environments through Pokédex text.",
    seoTitle:
      "Ocean Pokémon | PokéLore",
    seoDescription:
      "Explore Pokémon with ocean-related Pokédex entries, including official lore excerpts and Pokémon detail links."
  },
  {
    slug: "river-pokemon",
    active: false,
    subgroup: "biomes",
    title: "River and Lake Pokémon",
    shortDescription:
      "Pokémon mentioned near rivers, lakes, ponds, streams, or freshwater habitats.",
    searchTerms: [
      "river",
      "rivers",
      "lake",
      "lakes",
      "pond",
      "ponds",
      "stream",
      "streams",
      "freshwater"
    ],
    introText:
      "These Pokémon are connected to rivers, lakes, ponds, streams, or freshwater habitats in official Pokédex entries.",
    seoTitle:
      "River and Lake Pokémon | PokéLore",
    seoDescription:
      "Find Pokémon connected to river and lake Pokédex lore, with official excerpts and links to Pokémon pages."
  },
  {
    slug: "aggressive-pokemon",
    active: false,
    subgroup: "behavior",
    title: "Aggressive Pokémon",
    shortDescription:
      "Pokémon whose entries mention aggressive, violent, hostile, or ferocious behavior.",
    searchTerms: [
      "aggressive",
      "attacks",
      "attack",
      "violent",
      "vicious",
      "savage",
      "ferocious",
      "hostile"
    ],
    introText:
      "These Pokémon have official Pokédex entries describing aggressive, hostile, vicious, or ferocious behavior.",
    seoTitle:
      "Aggressive Pokémon | PokéLore",
    seoDescription:
      "Explore Pokémon described as aggressive or hostile in official Pokédex entries, with matching lore excerpts."
  },
  {
    slug: "dangerous-pokemon",
    active: false,
    subgroup: "behavior",
    title: "Dangerous Pokémon",
    shortDescription:
      "Pokémon described with danger, deadly traits, venom, poison, toxins, or fear.",
    searchTerms: [
      "dangerous",
      "danger",
      "deadly",
      "venomous",
      "poisonous",
      "toxic",
      "beware",
      "feared"
    ],
    introText:
      "These Pokémon have official Pokédex entries that mention danger, poison, venom, toxins, fear, or warnings.",
    seoTitle:
      "Dangerous Pokémon | PokéLore",
    seoDescription:
      "Browse dangerous Pokémon according to official Pokédex entries, with real lore excerpts and Pokémon links."
  },
  {
    slug: "ancient-pokemon",
    active: true,
    subgroup: "lore",
    title: "Ancient Pokémon",
    shortDescription:
      "Pokémon connected to ancient times, fossils, extinction, prehistory, or primeval life.",
    searchTerms: [
      "ancient",
      "prehistoric",
      "fossil",
      "fossils",
      "extinct",
      "primeval"
    ],
    introText:
      "These Pokémon are connected to ancient history, fossils, extinction, prehistoric eras, or primeval life in Pokédex entries.",
    seoTitle:
      "Ancient Pokémon | PokéLore",
    seoDescription:
      "Explore ancient and fossil-related Pokémon using official Pokédex entry excerpts and links to Pokémon pages."
  },
  {
    slug: "rare-pokemon",
    active: false,
    subgroup: "lore",
    title: "Rare Pokémon",
    shortDescription:
      "Pokémon described as rare, elusive, seldom seen, or hard to find.",
    searchTerms: [
      "rare",
      "rarely",
      "seldom",
      "elusive",
      "scarcely seen",
      "hard to find"
    ],
    introText:
      "These Pokémon have official Pokédex entries describing them as rare, elusive, seldom seen, or hard to find.",
    seoTitle:
      "Rare Pokémon | PokéLore",
    seoDescription:
      "Find Pokémon described as rare or elusive in official Pokédex entries, with matching lore excerpts."
  },
  {
    slug: "ghostly-pokemon",
    active: false,
    subgroup: "lore",
    title: "Ghostly and Mysterious Pokémon",
    shortDescription:
      "Pokémon tied to ghosts, spirits, haunted places, curses, mystery, or eerie lore.",
    searchTerms: [
      "ghost",
      "ghosts",
      "spirit",
      "spirits",
      "haunted",
      "mysterious",
      "eerie",
      "curse",
      "cursed"
    ],
    introText:
      "These Pokémon have official Pokédex entries involving ghosts, spirits, haunted places, curses, mystery, or eerie details.",
    seoTitle:
      "Ghostly and Mysterious Pokémon | PokéLore",
    seoDescription:
      "Explore ghostly and mysterious Pokémon using official Pokédex entry excerpts and links to Pokémon pages."
  },
  {
    slug: "urban-pokemon",
    active: true,
    subgroup: "biomes",
    title: "Urban",
    shortDescription:
      "Pokémon mentioned around cities, towns, villages, people, houses, or buildings.",
    searchTerms: [
      "city",
      "cities",
      "town",
      "towns",
      "village",
      "villages",
      "houses",
      "buildings"
    ],
    introText:
      "These Pokémon are linked to cities, towns, villages, people, homes, or buildings in official Pokédex entries.",
    seoTitle:
      "Pokémon Found Near Cities and People | PokéLore",
    seoDescription:
      "Browse Pokémon found near cities and people according to official Pokédex entries, with matching lore excerpts."
  }
];

async function readJson(fileName) {
  const text = await fs.readFile(
    path.join(dataDir, fileName),
    "utf8"
  );
  return JSON.parse(text);
}

async function readOptionalJson(
  fileName,
  fallback
) {
  try {
    return await readJson(fileName);
  } catch (error) {
    if (error.code === "ENOENT") {
      return fallback;
    }

    throw error;
  }
}

function normalizeText(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function makeTermMatcher(term) {
  const normalizedTerm =
    normalizeText(term);
  const escaped =
    escapeRegExp(normalizedTerm);

  return new RegExp(
    `(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`,
    "i"
  );
}

function matchingTerms(text, terms) {
  return terms.filter(term =>
    makeTermMatcher(term).test(text)
  );
}

function hasExcludedTerm(text, terms = []) {
  return terms.some(term =>
    makeTermMatcher(term).test(text)
  );
}

function buildPokemonLookup(pokemonIndex) {
  return new Map(
    pokemonIndex.map(pokemon => [
      pokemon.name,
      pokemon
    ])
  );
}

function buildPokemonIdLookup(pokemonIndex) {
  return new Map(
    pokemonIndex.map(pokemon => [
      pokemon.id,
      pokemon
    ])
  );
}

function addPokemonMatch({
  pokemonMatches,
  pokemon
}) {
  if (!pokemonMatches.has(pokemon.name)) {
    pokemonMatches.set(pokemon.name, {
      pokemon: {
        id: pokemon.id,
        name: pokemon.name,
        sprite: pokemon.sprite,
        types: pokemon.types ?? []
      },
      entries: [],
      habitatMatches: [],
      curatedMatches: [],
      seenText: new Set()
    });
  }

  return pokemonMatches.get(pokemon.name);
}

function buildExcludedPokemonSets(
  excludedPokemon
) {
  const values = [
    ...(excludedPokemon ?? [])
  ];

  return {
    ids: new Set(
      values
        .map(value => Number(value))
        .filter(value =>
          Number.isFinite(value)
        )
    ),
    names: new Set(
      values.map(value =>
        String(value).toLowerCase()
      )
    )
  };
}

function normalizeCuratedPokemonValue(value) {
  if (
    value &&
    typeof value === "object"
  ) {
    return value;
  }

  return {
    id: Number(value),
    name: String(value)
  };
}

function getCuratedPokemon({
  value,
  pokemonByName,
  pokemonById
}) {
  const normalized =
    normalizeCuratedPokemonValue(value);
  const id =
    Number(normalized.id);

  if (Number.isFinite(id)) {
    return pokemonById.get(id);
  }

  return pokemonByName.get(
    String(normalized.name ?? "")
      .toLowerCase()
  );
}

function isPokemonExcluded(
  pokemon,
  excludedPokemon
) {
  return (
    excludedPokemon.ids.has(
      Number(pokemon.id)
    ) ||
    excludedPokemon.names.has(
      String(pokemon.name).toLowerCase()
    )
  );
}

function buildTopic(
  topic,
  entries,
  pokemonByName,
  pokemonById,
  habitatData
) {
  const pokemonMatches = new Map();
  const excludedPokemon =
    buildExcludedPokemonSets(
      topic.excludedPokemon
    );
  const {
    excludedPokemon: _excludedPokemon,
    includedPokemon: _includedPokemon,
    ...topicOutput
  } = topic;

  entries.forEach(entry => {
    const normalizedEntryText =
      normalizeText(entry.text);
    const terms = matchingTerms(
      normalizedEntryText,
      topic.searchTerms
    );

    if (
      terms.length === 0 ||
      hasExcludedTerm(
        normalizedEntryText,
        topic.excludeTerms
      )
    ) {
      return;
    }

    const pokemon =
      pokemonByName.get(entry.pokemon);

    if (
      !pokemon ||
      isPokemonExcluded(
        pokemon,
        excludedPokemon
      )
    ) {
      return;
    }

    const match = addPokemonMatch({
      pokemonMatches,
      pokemon
    });
    const textKey =
      normalizeText(entry.text);

    if (match.seenText.has(textKey)) {
      return;
    }

    match.seenText.add(textKey);
    match.entries.push({
      versions: entry.versions ?? [],
      text: entry.text,
      matchedTerms: terms
    });
  });

  (
    habitatSupplementByTopic[
      topic.slug
    ] ?? []
  ).forEach(habitatName => {
    const habitat =
      habitatData?.habitats?.[habitatName];

    if (!habitat) return;

    habitat.pokemonIds.forEach(pokemonId => {
      const pokemon =
        pokemonById.get(pokemonId);

      if (
        !pokemon ||
        isPokemonExcluded(
          pokemon,
          excludedPokemon
        )
      ) {
        return;
      }

      const match = addPokemonMatch({
        pokemonMatches,
        pokemon
      });
      const alreadyAdded =
        match.habitatMatches.some(
          currentHabitat =>
            currentHabitat.name === habitatName
        );

      if (!alreadyAdded) {
        match.habitatMatches.push({
          name: habitatName,
          displayName:
            habitat.displayName ??
            habitatName
        });
      }
    });
  });

  (topic.includedPokemon ?? []).forEach(value => {
    const pokemon = getCuratedPokemon({
      value,
      pokemonByName,
      pokemonById
    });

    if (
      !pokemon ||
      isPokemonExcluded(
        pokemon,
        excludedPokemon
      )
    ) {
      return;
    }

    const match = addPokemonMatch({
      pokemonMatches,
      pokemon
    });
    const reason =
      typeof value === "object"
        ? value.reason
        : null;

    if (
      !match.curatedMatches.some(
        currentMatch =>
          currentMatch.reason === reason
      )
    ) {
      match.curatedMatches.push({
        reason:
          reason ??
          "Curated topic inclusion"
      });
    }
  });

  const results =
    [...pokemonMatches.values()]
      .sort(
        (a, b) =>
          a.pokemon.id - b.pokemon.id
      )
      .map(match => ({
        pokemon: match.pokemon,
        entries: match.entries,
        habitatMatches:
          match.habitatMatches,
        curatedMatches:
          match.curatedMatches
      }));
  const entryCount =
    results.reduce(
      (total, result) =>
        total + result.entries.length,
      0
    );

  return {
    ...topicOutput,
    active: topic.active === true,
    excludeTerms: topic.excludeTerms ?? [],
    pokemonCount: results.length,
    entryCount,
    results
  };
}

async function main() {
  const [
    entries,
    pokemonIndex,
    curation,
    habitatData
  ] =
    await Promise.all([
      readJson("condensedEntries.json"),
      readJson("pokemonIndex.json"),
      readOptionalJson(
        "pokedexTopicCuration.json",
        {
          excludedPokemonByTopic: {},
          includedPokemonByTopic: {}
        }
      ),
      readOptionalJson(
        "habitatData.json",
        {
          habitats: {}
        }
      )
    ]);
  const pokemonByName =
    buildPokemonLookup(pokemonIndex);
  const pokemonById =
    buildPokemonIdLookup(pokemonIndex);
  const topics = topicDefinitions.map(topic => {
    const excludedPokemon =
      new Set(
        curation.excludedPokemonByTopic?.[
          topic.slug
        ] ?? []
      );
    const includedPokemon =
      curation.includedPokemonByTopic?.[
        topic.slug
      ] ?? [];

    return buildTopic(
      {
        ...topic,
        excludedPokemon,
        includedPokemon
      },
      entries,
      pokemonByName,
      pokemonById,
      habitatData
    );
  });

  await fs.writeFile(
    outputPath,
    `${JSON.stringify(
      {
        generatedAt:
          new Date().toISOString(),
        topics
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(
    `Generated ${topics.length} Pokedex topics at ${outputPath}`
  );

  topics.forEach(topic => {
    console.log(
      `${topic.slug}: ${topic.pokemonCount} Pokemon, ${topic.entryCount} entries`
    );
  });
}

main().catch(error => {
  console.error(
    "Failed to generate Pokedex topics:",
    error
  );
  throw error;
});
