import { sortVersions } from "../constants/versionOrder.js";
import { formatVersionName } from "./formatVersionName.js";

export const ALL_ENCOUNTER_VERSIONS = "all";

const LABEL_OVERRIDES = {
  sos: "SOS",
  xd: "XD"
};

const METHOD_OVERRIDES = {
  "bubbling-spots": "Bubbling Spots",
  "colosseum-bonus-disc-jpn":
    "Colosseum Bonus Disc JPN",
  "feebas-tile-fishing":
    "Feebas Tile Fishing",
  "good-rod": "Good Rod",
  gift: "Gift",
  "old-rod": "Old Rod",
  "only-one": "One-time",
  overworld: "Overworld",
  "sos-encounter": "SOS Encounter",
  "super-rod": "Super Rod",
  "super-rod-spots": "Super Rod Spots",
  surf: "Surf",
  walk: "Walking"
};

function isFiniteNumber(value) {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value))
  );
}

export function formatEncounterLabel(value = "") {
  return String(value ?? "")
    .trim()
    .split("-")
    .filter(Boolean)
    .map(word => {
      const normalized = word.toLowerCase();

      return (
        LABEL_OVERRIDES[normalized] ??
        normalized.charAt(0).toUpperCase() +
          normalized.slice(1)
      );
    })
    .join(" ");
}

export function formatEncounterMethodName(
  method
) {
  const normalized = String(method ?? "")
    .trim()
    .toLowerCase();

  return (
    METHOD_OVERRIDES[normalized] ??
    formatEncounterLabel(normalized)
  );
}

export function formatEncounterCondition(
  condition
) {
  return formatEncounterLabel(condition);
}

export function formatEncounterVersionName(
  version
) {
  return formatVersionName(version);
}

export function getEncounterVersions(
  encounterData
) {
  return [
    ALL_ENCOUNTER_VERSIONS,
    ...sortVersions(
      new Set(
        encounterData?.locations?.flatMap(
          location =>
            location.areas?.flatMap(area =>
              area.versions?.map(
                version => version.version
              ) ?? []
            ) ?? []
        ) ?? []
      )
    )
  ];
}

export function getSelectedEncounterVersion(
  encounterData,
  preferredVersion = ALL_ENCOUNTER_VERSIONS
) {
  const versionOptions =
    getEncounterVersions(encounterData);

  return versionOptions.includes(
    preferredVersion
  )
    ? preferredVersion
    : ALL_ENCOUNTER_VERSIONS;
}

export function filterEncounterLocationsByVersion(
  encounterData,
  selectedVersion = ALL_ENCOUNTER_VERSIONS
) {
  return (
    encounterData?.locations
      ?.map(location => ({
        ...location,
        areas: (location.areas ?? [])
          .map(area => ({
            ...area,
            versions:
              selectedVersion ===
              ALL_ENCOUNTER_VERSIONS
                ? area.versions ?? []
                : (area.versions ?? []).filter(
                    version =>
                      version.version ===
                      selectedVersion
                  )
          }))
          .filter(
            area =>
              area.versions.length > 0
          )
      }))
      .filter(
        location =>
          location.areas.length > 0
      ) ?? []
  );
}

export function hasEncounterLocations(
  encounterData
) {
  return Boolean(
    encounterData?.locations?.length
  );
}

export function getEncounterRecords(
  locationOrAreaOrVersion
) {
  if (
    Array.isArray(
      locationOrAreaOrVersion?.encounters
    )
  ) {
    return locationOrAreaOrVersion.encounters;
  }

  if (
    Array.isArray(
      locationOrAreaOrVersion?.versions
    )
  ) {
    return locationOrAreaOrVersion.versions.flatMap(
      version => version.encounters ?? []
    );
  }

  return (
    locationOrAreaOrVersion?.areas?.flatMap(
      area =>
        (area.versions ?? []).flatMap(
          version => version.encounters ?? []
        )
    ) ?? []
  );
}

export function getUniqueEncounterRecords(
  locationOrAreaOrVersion
) {
  const seen = new Set();

  return getEncounterRecords(
    locationOrAreaOrVersion
  ).filter(encounter => {
    const key =
      getEncounterRecordKey(encounter);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getEncounterRecordKey(encounter) {
  return JSON.stringify({
    method: encounter.method ?? null,
    minLevel: encounter.minLevel ?? null,
    maxLevel: encounter.maxLevel ?? null,
    chance: encounter.chance ?? null,
    conditions:
      encounter.conditions ?? []
  });
}

export function getGroupedEncounterVersions(
  area
) {
  const groups = [];
  const groupByKey = new Map();

  for (const version of area?.versions ?? []) {
    const key = JSON.stringify({
      maxChance: version.maxChance ?? null,
      encounters: (
        version.encounters ?? []
      ).map(getEncounterRecordKey)
    });
    const existingGroup =
      groupByKey.get(key);

    if (existingGroup) {
      existingGroup.versions.push(
        version.version
      );
      continue;
    }

    const group = {
      versions: [version.version],
      maxChance: version.maxChance,
      encounters:
        version.encounters ?? []
    };

    groups.push(group);
    groupByKey.set(key, group);
  }

  return groups.map(group => ({
    ...group,
    versions: sortVersions(group.versions)
  }));
}

export function getEncounterMethods(
  locationOrAreaOrVersion
) {
  return [
    ...new Set(
      getEncounterRecords(
        locationOrAreaOrVersion
      )
        .map(encounter => encounter.method)
        .filter(Boolean)
    )
  ];
}

export function getEncounterLevelRange(
  locationOrAreaOrVersion
) {
  const encounters = getEncounterRecords(
    locationOrAreaOrVersion
  );
  const minLevels = encounters
    .map(encounter => encounter.minLevel)
    .filter(isFiniteNumber)
    .map(Number);
  const maxLevels = encounters
    .map(encounter => encounter.maxLevel)
    .filter(isFiniteNumber)
    .map(Number);

  if (
    minLevels.length === 0 ||
    maxLevels.length === 0
  ) {
    return null;
  }

  return {
    minLevel: Math.min(...minLevels),
    maxLevel: Math.max(...maxLevels)
  };
}

export function formatEncounterLevelRange(
  encounterOrRange
) {
  const minLevel =
    encounterOrRange?.minLevel;
  const maxLevel =
    encounterOrRange?.maxLevel;

  if (
    minLevel === null &&
    maxLevel === null
  ) {
    return "-";
  }

  if (!isFiniteNumber(minLevel)) {
    return isFiniteNumber(maxLevel)
      ? `Lv. ${Number(maxLevel)}`
      : "-";
  }

  if (!isFiniteNumber(maxLevel)) {
    return `Lv. ${Number(minLevel)}`;
  }

  if (Number(minLevel) === Number(maxLevel)) {
    return `Lv. ${Number(minLevel)}`;
  }

  return `Lv. ${Number(minLevel)}–${Number(maxLevel)}`;
}

export function getMaximumEncounterChance(
  locationOrAreaOrVersion
) {
  if (
    isFiniteNumber(
      locationOrAreaOrVersion?.maxChance
    )
  ) {
    return Number(
      locationOrAreaOrVersion.maxChance
    );
  }

  const versionChances =
    Array.isArray(
      locationOrAreaOrVersion?.versions
    )
      ? locationOrAreaOrVersion.versions
          .map(version => version.maxChance)
          .filter(isFiniteNumber)
          .map(Number)
      : locationOrAreaOrVersion?.areas?.flatMap(
          area =>
            (area.versions ?? [])
              .map(version => version.maxChance)
              .filter(isFiniteNumber)
              .map(Number)
        ) ?? [];

  if (versionChances.length > 0) {
    return Math.max(...versionChances);
  }

  const encounterChances = getEncounterRecords(
    locationOrAreaOrVersion
  )
    .map(encounter => encounter.chance)
    .filter(isFiniteNumber)
    .map(Number);

  return encounterChances.length > 0
    ? Math.max(...encounterChances)
    : null;
}

export function formatChance(value) {
  return isFiniteNumber(value)
    ? `${Number(value)}%`
    : null;
}

export function formatMethodList(
  methods,
  {
    maxMethods = 4
  } = {}
) {
  const methodLabels = [
    ...new Set(methods.filter(Boolean))
  ].map(formatEncounterMethodName);

  if (
    methodLabels.length <= maxMethods
  ) {
    return methodLabels.join(", ");
  }

  const hiddenCount =
    methodLabels.length - maxMethods;

  return `${methodLabels
    .slice(0, maxMethods)
    .join(", ")}, +${hiddenCount} more`;
}

export function getEncounterSummary(
  locationOrAreaOrVersion,
  {
    allVersions = false
  } = {}
) {
  const methods = getEncounterMethods(
    locationOrAreaOrVersion
  );
  const levelRange = allVersions
    ? null
    : getEncounterLevelRange(
        locationOrAreaOrVersion
      );
  const maxChance = allVersions
    ? null
    : getMaximumEncounterChance(
        locationOrAreaOrVersion
      );

  return {
    allVersions,
    methods,
    levelRange,
    maxChance
  };
}

export function formatEncounterSummary(
  summary
) {
  const parts = [];
  const methodText = formatMethodList(
    summary?.methods ?? []
  );

  if (methodText) {
    parts.push(methodText);
  }

  if (summary?.allVersions) {
    parts.push("version details vary");
    return parts.join(" · ");
  }

  if (summary?.levelRange) {
    parts.push(
      formatEncounterLevelRange(
        summary.levelRange
      )
    );
  }

  const chanceText = formatChance(
    summary?.maxChance
  );

  if (chanceText) {
    parts.push(`up to ${chanceText}`);
  }

  return parts.join(" · ");
}

export function getLocationEncounterSummary(
  location,
  selectedVersion = ALL_ENCOUNTER_VERSIONS
) {
  return getEncounterSummary(location, {
    allVersions:
      selectedVersion ===
      ALL_ENCOUNTER_VERSIONS
  });
}

export function formatEncounterConditions(
  conditions = []
) {
  return conditions
    .map(formatEncounterCondition)
    .filter(Boolean)
    .join(", ");
}

export function getPokemonEncounterCandidateIds(
  pokemon
) {
  return pokemon?.id
    ? [Number(pokemon.id)]
    : [];
}
