export const VERSION_ORDER = [
  "red-japan",
  "green-japan",
  "blue-japan",
  "red",
  "blue",
  "yellow",
  "gold",
  "silver",
  "crystal",
  "ruby",
  "sapphire",
  "colosseum",
  "firered",
  "leafgreen",
  "emerald",
  "xd",
  "diamond",
  "pearl",
  "platinum",
  "heartgold",
  "soulsilver",
  "black",
  "white",
  "black-2",
  "white-2",
  "x",
  "y",
  "omega-ruby",
  "alpha-sapphire",
  "sun",
  "moon",
  "ultra-sun",
  "ultra-moon",
  "lets-go-pikachu",
  "lets-go-eevee",
  "sword",
  "shield",
  "brilliant-diamond",
  "shining-pearl",
  "legends-arceus",
  "scarlet",
  "violet"
];

export const VERSION_GROUP_ORDER = [
  "red-green-japan",
  "blue-japan",
  "red-blue",
  "yellow",
  "gold-silver",
  "crystal",
  "ruby-sapphire",
  "colosseum",
  "firered-leafgreen",
  "emerald",
  "xd",
  "diamond-pearl",
  "platinum",
  "heartgold-soulsilver",
  "black-white",
  "black-2-white-2",
  "x-y",
  "omega-ruby-alpha-sapphire",
  "sun-moon",
  "ultra-sun-ultra-moon",
  "lets-go-pikachu-lets-go-eevee",
  "sword-shield",
  "the-isle-of-armor",
  "the-crown-tundra",
  "brilliant-diamond-shining-pearl",
  "brilliant-diamond-and-shining-pearl",
  "legends-arceus",
  "scarlet-violet",
  "the-teal-mask",
  "the-indigo-disk"
];

function rankFrom(order) {
  return new Map(
    order.map((name, index) => [
      name,
      index
    ])
  );
}

const versionRanks =
  rankFrom(VERSION_ORDER);
const versionGroupRanks =
  rankFrom(VERSION_GROUP_ORDER);

function compareByRank(ranks, a, b) {
  const aRank =
    ranks.get(a) ?? Number.MAX_SAFE_INTEGER;
  const bRank =
    ranks.get(b) ?? Number.MAX_SAFE_INTEGER;

  if (aRank !== bRank) {
    return aRank - bRank;
  }

  return String(a).localeCompare(String(b));
}

export function compareVersions(a, b) {
  return compareByRank(
    versionRanks,
    a,
    b
  );
}

export function compareVersionGroups(a, b) {
  return compareByRank(
    versionGroupRanks,
    a,
    b
  );
}

export function sortVersions(versions) {
  return [...versions].sort(compareVersions);
}

export function sortVersionGroups(versionGroups) {
  return [...versionGroups].sort(
    compareVersionGroups
  );
}
