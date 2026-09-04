import {
  compareVersions
} from "../constants/versionOrder.js";

const GAME_CATALOG = [
  ["red", "Pokémon Red"],
  ["blue", "Pokémon Blue"],
  ["yellow", "Pokémon Yellow"],
  ["gold", "Pokémon Gold"],
  ["silver", "Pokémon Silver"],
  ["crystal", "Pokémon Crystal"],
  ["ruby", "Pokémon Ruby"],
  ["sapphire", "Pokémon Sapphire"],
  ["emerald", "Pokémon Emerald"],
  ["firered", "Pokémon FireRed"],
  ["leafgreen", "Pokémon LeafGreen"],
  ["diamond", "Pokémon Diamond"],
  ["pearl", "Pokémon Pearl"],
  ["platinum", "Pokémon Platinum"],
  ["heartgold", "Pokémon HeartGold"],
  ["soulsilver", "Pokémon SoulSilver"],
  ["black", "Pokémon Black"],
  ["white", "Pokémon White"],
  ["black-2", "Pokémon Black 2"],
  ["white-2", "Pokémon White 2"],
  ["x", "Pokémon X"],
  ["y", "Pokémon Y"],
  ["omega-ruby", "Pokémon Omega Ruby"],
  ["alpha-sapphire", "Pokémon Alpha Sapphire"],
  ["sun", "Pokémon Sun"],
  ["moon", "Pokémon Moon"],
  ["ultra-sun", "Pokémon Ultra Sun"],
  ["ultra-moon", "Pokémon Ultra Moon"],
  ["lets-go-pikachu", "Pokémon: Let's Go, Pikachu!"],
  ["lets-go-eevee", "Pokémon: Let's Go, Eevee!"],
  ["sword", "Pokémon Sword"],
  ["shield", "Pokémon Shield"],
  ["brilliant-diamond", "Pokémon Brilliant Diamond"],
  ["shining-pearl", "Pokémon Shining Pearl"],
  ["legends-arceus", "Pokémon Legends: Arceus"],
  ["scarlet", "Pokémon Scarlet"],
  ["violet", "Pokémon Violet"],
  ["legends-z-a", "Pokémon Legends: Z-A"],
  ["colosseum", "Pokémon Colosseum"],
  ["xd", "Pokémon XD"]
];

const GAME_VERSION_FAMILIES = [
  {
    key: "red-blue-yellow",
    gameSlugs: ["red", "blue", "yellow"],
    label: "Pokémon Red, Blue & Yellow"
  },
  {
    key: "gold-silver-crystal",
    gameSlugs: ["gold", "silver", "crystal"],
    label: "Pokémon Gold, Silver & Crystal"
  },
  {
    key: "ruby-sapphire-emerald",
    gameSlugs: ["ruby", "sapphire", "emerald"],
    label: "Pokémon Ruby, Sapphire & Emerald"
  },
  {
    key: "firered-leafgreen",
    gameSlugs: ["firered", "leafgreen"],
    label: "Pokémon FireRed & LeafGreen"
  },
  {
    key: "diamond-pearl-platinum",
    gameSlugs: ["diamond", "pearl", "platinum"],
    label: "Pokémon Diamond, Pearl & Platinum"
  },
  {
    key: "heartgold-soulsilver",
    gameSlugs: ["heartgold", "soulsilver"],
    label: "Pokémon HeartGold & SoulSilver"
  },
  {
    key: "black-white",
    gameSlugs: ["black", "white"],
    label: "Pokémon Black & White"
  },
  {
    key: "black-2-white-2",
    gameSlugs: ["black-2", "white-2"],
    label: "Pokémon Black 2 & White 2"
  },
  {
    key: "x-y",
    gameSlugs: ["x", "y"],
    label: "Pokémon X & Y"
  },
  {
    key: "omega-ruby-alpha-sapphire",
    gameSlugs: ["omega-ruby", "alpha-sapphire"],
    label: "Pokémon Omega Ruby & Alpha Sapphire"
  },
  {
    key: "sun-moon",
    gameSlugs: ["sun", "moon"],
    label: "Pokémon Sun & Moon"
  },
  {
    key: "ultra-sun-ultra-moon",
    gameSlugs: ["ultra-sun", "ultra-moon"],
    label: "Pokémon Ultra Sun & Ultra Moon"
  },
  {
    key: "lets-go-pikachu-lets-go-eevee",
    gameSlugs: ["lets-go-pikachu", "lets-go-eevee"],
    label: "Pokémon: Let's Go, Pikachu! & Let's Go, Eevee!"
  },
  {
    key: "sword-shield",
    gameSlugs: ["sword", "shield"],
    label: "Pokémon Sword & Shield"
  },
  {
    key: "brilliant-diamond-shining-pearl",
    gameSlugs: ["brilliant-diamond", "shining-pearl"],
    label: "Pokémon Brilliant Diamond & Shining Pearl"
  },
  {
    key: "legends-arceus",
    gameSlugs: ["legends-arceus"],
    label: "Pokémon Legends: Arceus"
  },
  {
    key: "scarlet-violet",
    gameSlugs: ["scarlet", "violet"],
    label: "Pokémon Scarlet & Violet"
  },
  {
    key: "legends-z-a",
    gameSlugs: ["legends-z-a"],
    label: "Pokémon Legends: Z-A"
  },
  {
    key: "colosseum",
    gameSlugs: ["colosseum"],
    label: "Pokémon Colosseum"
  },
  {
    key: "xd",
    gameSlugs: ["xd"],
    label: "Pokémon XD"
  }
];

const displayNameBySlug = new Map(
  GAME_CATALOG.map(([slug, displayName]) => [
    slug,
    displayName
  ])
);

const gameSlugByName = new Map();

function normalizeGameName(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

for (const [slug, displayName] of GAME_CATALOG) {
  gameSlugByName.set(
    normalizeGameName(displayName),
    slug
  );
  gameSlugByName.set(
    normalizeGameName(
      displayName.replace(/^Pokémon:?\s*/, "Pokemon ")
    ),
    slug
  );
}

function sortGameSlugs(slugs) {
  return [...slugs].sort(compareVersions);
}

function groupRank(gameSlugs) {
  const firstSlug = sortGameSlugs(gameSlugs)[0];
  const ordered = sortGameSlugs([
    ...displayNameBySlug.keys()
  ]);

  return ordered.indexOf(firstSlug);
}

function formatList(values) {
  if (values.length <= 1) {
    return values[0] ?? "";
  }

  if (values.length === 2) {
    return `${values[0]} & ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")} & ${
    values[values.length - 1]
  }`;
}

function formatGameListLabel(gameSlugs, fallbackGames) {
  const knownNames = sortGameSlugs(gameSlugs)
    .map(slug => displayNameBySlug.get(slug))
    .filter(Boolean);

  const names =
    knownNames.length > 0
      ? knownNames
      : (fallbackGames ?? []).filter(Boolean);

  if (names.length === 0) {
    return "Other Games";
  }

  const [firstName, ...restNames] = names;
  const shortenedNames = [
    firstName,
    ...restNames.map(name =>
      String(name)
        .replace(/^Pokémon:?\s*/, "")
        .replace(/^Pokemon:?\s*/, "")
    )
  ];

  return formatList(shortenedNames);
}

function shortGameName(gameSlug) {
  return String(displayNameBySlug.get(gameSlug) ?? gameSlug)
    .replace(/^Pokémon:?\s*/, "")
    .replace(/^Pokemon:?\s*/, "");
}

function sameGameSlugs(a, b) {
  const first = sortGameSlugs(
    Array.from(new Set(a))
  );
  const second = sortGameSlugs(
    Array.from(new Set(b))
  );

  return (
    first.length === second.length &&
    first.every(
      (slug, index) => slug === second[index]
    )
  );
}

export function getAcquisitionGameSlug(gameName) {
  return gameSlugByName.get(
    normalizeGameName(gameName)
  );
}

export function getAcquisitionGameSlugs(games) {
  return sortGameSlugs(
    Array.from(
      new Set(
        (Array.isArray(games) ? games : [])
          .map(getAcquisitionGameSlug)
          .filter(Boolean)
      )
    )
  );
}

export function formatGameRestrictionLabel(gameSlugs) {
  const shortNames = sortGameSlugs(gameSlugs)
    .map(shortGameName)
    .filter(Boolean);

  if (shortNames.length === 0) {
    return null;
  }

  return `${formatList(shortNames)} only`;
}

export function getAcquisitionCardGameContext(
  method,
  group
) {
  const methodGameSlugs =
    getAcquisitionGameSlugs(method?.games);
  const groupGameSlugs = sortGameSlugs(
    group?.gameSlugs ?? []
  );
  const hasKnownMethodGames =
    methodGameSlugs.length > 0;
  const hasKnownGroupGames =
    groupGameSlugs.length > 0;
  const gamesMatchGroup =
    hasKnownMethodGames &&
    hasKnownGroupGames &&
    sameGameSlugs(
      methodGameSlugs,
      groupGameSlugs
    );
  const isNarrowerThanGroup =
    hasKnownMethodGames &&
    hasKnownGroupGames &&
    methodGameSlugs.length <
      groupGameSlugs.length &&
    methodGameSlugs.every(slug =>
      groupGameSlugs.includes(slug)
    );

  return {
    methodGameSlugs,
    redundantGames: gamesMatchGroup,
    restrictionLabel: isNarrowerThanGroup
      ? formatGameRestrictionLabel(methodGameSlugs)
      : null,
    showFallbackVersionExclusive:
      Boolean(method?.versionExclusive) &&
      !isNarrowerThanGroup
  };
}

export function formatGameGroupLabel({
  gameSlugs = [],
  games = []
} = {}) {
  const normalizedSlugs = sortGameSlugs(
    Array.from(new Set(gameSlugs))
  );
  const exactFamily =
    GAME_VERSION_FAMILIES.find(family => {
      const familySlugs = sortGameSlugs(
        family.gameSlugs
      );

      return (
        familySlugs.length ===
          normalizedSlugs.length &&
        familySlugs.every(
          (slug, index) =>
            slug === normalizedSlugs[index]
        )
      );
    });

  return (
    exactFamily?.label ??
    formatGameListLabel(normalizedSlugs, games)
  );
}

function findFamilyForGameSlugs(gameSlugs) {
  if (gameSlugs.length === 0) {
    return null;
  }

  return GAME_VERSION_FAMILIES.find(family =>
    gameSlugs.every(slug =>
      family.gameSlugs.includes(slug)
    )
  );
}

export function groupAcquisitionByGameFamily(
  acquisition
) {
  const methods = Array.isArray(acquisition)
    ? acquisition
    : [];
  const groupsByKey = new Map();

  methods.forEach((method, index) => {
    const games = Array.isArray(method.games)
      ? method.games
      : [];
    const gameSlugs =
      getAcquisitionGameSlugs(games);
    const family =
      findFamilyForGameSlugs(gameSlugs);
    const key =
      family?.key ??
      (gameSlugs.length > 0
        ? `games:${gameSlugs.join("|")}`
        : `other:${method.generation ?? "unknown"}`);
    const label =
      family?.label ??
      formatGameGroupLabel({
        gameSlugs,
        games
      });
    const sortSlugs =
      family?.gameSlugs ?? gameSlugs;
    const sortRank = groupRank(sortSlugs);

    if (!groupsByKey.has(key)) {
      groupsByKey.set(key, {
        key,
        label,
        gameSlugs: sortSlugs,
        sortRank:
          sortRank === -1
            ? Number.MAX_SAFE_INTEGER
            : sortRank,
        firstIndex: index,
        entries: []
      });
    }

    groupsByKey.get(key).entries.push(method);
  });

  return [...groupsByKey.values()].sort((a, b) => {
    if (a.sortRank !== b.sortRank) {
      return a.sortRank - b.sortRank;
    }

    if (a.firstIndex !== b.firstIndex) {
      return a.firstIndex - b.firstIndex;
    }

    return a.label.localeCompare(b.label);
  });
}

export {
  GAME_VERSION_FAMILIES
};
