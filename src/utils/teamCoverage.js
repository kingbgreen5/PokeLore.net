import { VERSION_GROUP_ORDER } from "../constants/versionOrder.js";

export const ALL_POKEMON_TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy"
];

const FAIRY_INTRO_VERSION_GROUP = "x-y";
const LEARNSET_VERSION_GROUP_ALIASES = {
  "the-isle-of-armor": "sword-shield",
  "the-crown-tundra": "sword-shield",
  "the-teal-mask": "scarlet-violet",
  "the-indigo-disk": "scarlet-violet",
  "brilliant-diamond-and-shining-pearl":
    "brilliant-diamond-shining-pearl"
};

export function getTypesForVersionGroup(
  versionGroup
) {
  const selectedIndex =
    VERSION_GROUP_ORDER.indexOf(versionGroup);
  const fairyIntroIndex =
    VERSION_GROUP_ORDER.indexOf(
      FAIRY_INTRO_VERSION_GROUP
    );
  const includesFairy =
    selectedIndex === -1 ||
    fairyIntroIndex === -1 ||
    selectedIndex >= fairyIntroIndex;

  return includesFairy
    ? ALL_POKEMON_TYPES
    : ALL_POKEMON_TYPES.filter(
        type => type !== "fairy"
      );
}

export function formatVersionGroupName(value = "") {
  return String(value)
    .split("-")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" / ");
}

export function isDamagingMove(move) {
  const category = String(
    move?.category ?? ""
  ).toLowerCase();

  return category === "physical" || category === "special";
}

export function getLevelUpAttackTypes({
  consideredTypes = ALL_POKEMON_TYPES,
  learnset,
  minMovePower = 0,
  movesByName,
  versionGroup
}) {
  const attackTypePowers =
    getLevelUpAttackTypePowers({
      consideredTypes,
      learnset,
      minMovePower,
      movesByName,
      versionGroup
    });

  return consideredTypes.filter(type =>
    Object.hasOwn(attackTypePowers, type)
  );
}

export function getLevelUpAttackTypePowers({
  consideredTypes = ALL_POKEMON_TYPES,
  learnset,
  minMovePower = 0,
  movesByName,
  versionGroup
}) {
  const attackTypePowers = {};
  const consideredTypeSet =
    new Set(consideredTypes);
  const learnsetVersionGroup =
    LEARNSET_VERSION_GROUP_ALIASES[
      versionGroup
    ] ?? versionGroup;

  for (const learnsetMove of learnset?.moves ?? []) {
    if (
      learnsetMove.method !== "level-up" ||
      learnsetMove.versionGroup !== learnsetVersionGroup
    ) {
      continue;
    }

    const move = movesByName?.[learnsetMove.move];
    const movePower =
      Number(move?.power) || 0;

    const moveType = String(
      move?.type ?? ""
    ).toLowerCase();

    if (
      !isDamagingMove(move) ||
      movePower < minMovePower ||
      !moveType ||
      !consideredTypeSet.has(moveType)
    ) {
      continue;
    }

    attackTypePowers[moveType] =
      Math.max(
        attackTypePowers[moveType] ?? 0,
        movePower
      );
  }

  return attackTypePowers;
}

export function getCoveredDefenseTypes({
  attackTypes,
  consideredTypes = ALL_POKEMON_TYPES,
  typeChart
}) {
  const coveredTypes = new Set();

  for (const attackType of attackTypes ?? []) {
    const matchups =
      typeChart?.[attackType] ?? {};

    for (const defenseType of consideredTypes) {
      if (matchups[defenseType] === 2) {
        coveredTypes.add(defenseType);
      }
    }
  }

  return consideredTypes.filter(type =>
    coveredTypes.has(type)
  );
}

export function getMissingDefenseTypes({
  consideredTypes = ALL_POKEMON_TYPES,
  coveredTypes
}) {
  const covered = new Set(coveredTypes);

  return consideredTypes.filter(
    type => !covered.has(type)
  );
}
