import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import PokemonSummaryCard from "../components/PokemonSummaryCard";
import TypeBadge from "../components/TypeBadge";
import typeChart from "../constants/Types";
import typeColors from "../constants/typeColors";
import { VERSION_GROUP_ORDER } from "../constants/versionOrder";
import useLocalStorageState from "../hooks/useLocalStorageState";
import Seo from "../seo/Seo";
import { teamCoverageSeo } from "../seo/seoConfig";
import { loadMovesMap } from "../utils/loadMovesData";
import { formatPokemonDisplayName } from "../utils/pokemonNames";
import {
  DEFAULT_TEAM_RECOMMENDATION_WEIGHTS,
  LEVEL_UP_MOVE_LEVEL_THRESHOLDS,
  TEAM_RECOMMENDATION_WEIGHTS_STORAGE_KEY,
  formatVersionGroupName,
  getCoveredDefenseTypes,
  getDefensiveCoverageBreakdown,
  getDefensiveCoverageTypes,
  getLevelUpAttackTypes,
  getMissingDefenseTypes,
  getTeamRecommendationScore,
  getTeamDefensiveCoverageTypes,
  getTypesForVersionGroup,
  normalizeRecommendationWeights
} from "../utils/teamCoverage";

const PARTY_SIZE = 6;
const DEFAULT_VERSION_GROUP =
  "scarlet-violet";
const PARTY_STORAGE_KEY =
  "pokelore:team-coverage-party";
const VERSION_STORAGE_KEY =
  "pokelore:learnset-version";
const SORT_STORAGE_KEY =
  "pokelore:team-coverage-sort:v3";
const COVERAGE_FILTER_STORAGE_KEY =
  "pokelore:team-coverage-recommendation-coverage-filter:v2";
const FOCUS_TYPE_STORAGE_KEY =
  "pokelore:team-coverage-focus-type";
const MOVE_POWER_THRESHOLD_STORAGE_KEY =
  "pokelore:team-coverage-move-power-threshold";
const MOVE_LEVEL_THRESHOLD_STORAGE_KEY =
  "pokelore:team-coverage-move-level-threshold:v1";
const PARTY_TM_LEARNSET_STORAGE_KEY =
  "pokelore:team-coverage-tm-learnsets:v1";
const RECOMMENDATION_MOVE_POWER_THRESHOLD_STORAGE_KEY =
  "pokelore:team-coverage-recommendation-move-power-threshold:v2";
const RECOMMENDATION_MOVE_LEVEL_THRESHOLD_STORAGE_KEY =
  "pokelore:team-coverage-recommendation-move-level-threshold:v1";
const RECOMMENDATION_TM_LEARNSET_STORAGE_KEY =
  "pokelore:team-coverage-recommendation-tm-learnsets:v1";
const LEGENDARY_FILTER_STORAGE_KEY =
  "pokelore:team-coverage-legendary-filter:v1";
const TRADE_EVOLUTION_FILTER_STORAGE_KEY =
  "pokelore:team-coverage-trade-evolution-filter:v1";
const DESKTOP_RECOMMENDATIONS_PER_PAGE = 20;
const MOBILE_RECOMMENDATIONS_PER_PAGE = 12;
const MOBILE_RECOMMENDATIONS_MEDIA_QUERY =
  "(max-width: 540px)";
const DEFAULT_RECOMMENDATION_SORT_MODE =
  "custom-score";
const DEFAULT_RECOMMENDATION_COVERAGE_FILTER =
  "both";
const DEFAULT_RECOMMENDATION_MOVE_POWER_THRESHOLD = 60;
const DEFAULT_MOVE_LEVEL_THRESHOLD = 50;
const MOVE_POWER_THRESHOLD_OPTIONS = [
  {
    value: 0,
    label: "Any Power"
  },
  {
    value: 40,
    label: "40+"
  },
  {
    value: 50,
    label: "50+"
  },
  {
    value: 60,
    label: "60+"
  },
  {
    value: 70,
    label: "70+"
  },
  {
    value: 80,
    label: "80+"
  },
  {
    value: 90,
    label: "90+"
  },
  {
    value: 100,
    label: "100+"
  }
];
const MOVE_LEVEL_THRESHOLD_OPTIONS = [
  {
    value: 0,
    label: "Any Level"
  },
  ...LEVEL_UP_MOVE_LEVEL_THRESHOLDS.map(
    level => ({
      value: level,
      label: `Lv. ${level}`
    })
  )
];
const STAT_SORT_MODES = [
  {
    value: "highest-bst",
    label: "Highest BST",
    stat: "baseStatTotal"
  },
  {
    value: "highest-hp",
    label: "Highest HP",
    stat: "hp"
  },
  {
    value: "highest-attack",
    label: "Highest Attack",
    stat: "attack"
  },
  {
    value: "highest-defense",
    label: "Highest Defense",
    stat: "defense"
  },
  {
    value: "highest-special-attack",
    label: "Highest Sp. Atk",
    stat: "specialAttack"
  },
  {
    value: "highest-special-defense",
    label: "Highest Sp. Def",
    stat: "specialDefense"
  },
  {
    value: "highest-speed",
    label: "Highest Speed",
    stat: "speed"
  }
];
const SORT_MODES = [
  {
    value: "custom-score",
    label: "PokeLore Suggested"
  },
  {
    value: "national-dex",
    label: "National Dex"
  },
  {
    value: "most-coverage",
    label: "Most Coverage"
  },
  {
    value: "selected-type-first",
    label: "Selected Type First"
  },
  ...STAT_SORT_MODES.map(
    ({ value, label }) => ({
      value,
      label
    })
  )
];
const LEGENDARY_FILTER_OPTIONS = [
  {
    value: "hide",
    label: "Hide"
  },
  {
    value: "show",
    label: "Show"
  }
];
const TRADE_EVOLUTION_FILTER_OPTIONS = [
  {
    value: "hide",
    label: "Hide"
  },
  {
    value: "show",
    label: "Show"
  }
];
const TM_LEARNSET_OPTIONS = [
  {
    value: "exclude",
    label: "Exclude"
  },
  {
    value: "include",
    label: "Include"
  }
];
const DEFENSIVE_COVERAGE_GROUPS = [
  {
    key: "immunities",
    label: "Immune"
  },
  {
    key: "fourTimesResistances",
    label: "4x Resist"
  },
  {
    key: "twoTimesResistances",
    label: "2x Resist"
  }
];
const COVERAGE_FILTER_OPTIONS = [
  {
    value: "offensive",
    label: "Offensive"
  },
  {
    value: "defensive",
    label: "Defensive"
  },
  {
    value: "either",
    label: "Either"
  },
  {
    value: "both",
    label: "Both"
  }
];

function hexToRgb(hexColor) {
  const normalizedHex =
    String(hexColor ?? "").replace("#", "");

  if (normalizedHex.length !== 6) {
    return null;
  }

  const value = Number.parseInt(
    normalizedHex,
    16
  );

  if (!Number.isFinite(value)) {
    return null;
  }

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function rgbaFromHex(hexColor, alpha) {
  const rgb = hexToRgb(hexColor);

  return rgb
    ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
    : `rgba(74, 74, 74, ${alpha})`;
}

function getPokemonTypeTileStyle(types = []) {
  const colors = types
    .map(type => typeColors[type])
    .filter(Boolean);

  if (!colors.length) {
    return undefined;
  }

  const primaryColor = colors[0];
  const secondaryColor =
    colors[1] ?? colors[0];

  return {
    background: `linear-gradient(135deg, ${rgbaFromHex(
      primaryColor,
      0.11
    )}, ${rgbaFromHex(
      secondaryColor,
      colors.length > 1 ? 0.11 : 0.05
    )}), #202020`,
    borderColor: rgbaFromHex(
      primaryColor,
      0.2
    )
  };
}

function createEmptyParty() {
  return Array(PARTY_SIZE).fill(null);
}

function normalizeParty(value) {
  const source = Array.isArray(value)
    ? value
    : [];

  return createEmptyParty().map(
    (_, index) => source[index] ?? null
  );
}

function partiesEqual(a, b) {
  const left = normalizeParty(a);
  const right = normalizeParty(b);

  return left.every(
    (value, index) => value === right[index]
  );
}

function getValidVersionGroup(value) {
  return VERSION_GROUP_ORDER.includes(value)
    ? value
    : null;
}

function normalizePartyParam(value) {
  if (value == null) {
    return null;
  }

  const parsed = String(value)
    .split(/[-,]/)
    .slice(0, PARTY_SIZE)
    .map(token => {
      const id = Number(token);

      return Number.isFinite(id) && id > 0
        ? id
        : null;
    });

  if (!parsed.some(Boolean)) {
    return createEmptyParty();
  }

  return createEmptyParty().map(
    (_, index) => parsed[index] ?? null
  );
}

function serializePartyParam(value) {
  const normalized = normalizeParty(value);
  const lastFilledIndex =
    normalized.reduce(
      (lastIndex, id, index) =>
        id ? index : lastIndex,
      -1
    );

  if (lastFilledIndex === -1) {
    return "";
  }

  return normalized
    .slice(0, lastFilledIndex + 1)
    .map(id => id ?? 0)
    .join("-");
}

function getValidSortMode(value) {
  return SORT_MODES.some(
    option => option.value === value
  )
    ? value
    : DEFAULT_RECOMMENDATION_SORT_MODE;
}

function getValidCoverageFilter(value) {
  return COVERAGE_FILTER_OPTIONS.some(
    option => option.value === value
  )
    ? value
    : DEFAULT_RECOMMENDATION_COVERAGE_FILTER;
}

function getValidLegendaryFilter(value) {
  return LEGENDARY_FILTER_OPTIONS.some(
    option => option.value === value
  )
    ? value
    : LEGENDARY_FILTER_OPTIONS[0].value;
}

function getValidTradeEvolutionFilter(value) {
  return TRADE_EVOLUTION_FILTER_OPTIONS.some(
    option => option.value === value
  )
    ? value
    : TRADE_EVOLUTION_FILTER_OPTIONS[0].value;
}

function getValidMovePowerThreshold(
  value
) {
  const parsedValue = Number(value);

  return MOVE_POWER_THRESHOLD_OPTIONS.some(
    option => option.value === parsedValue
  )
    ? parsedValue
    : MOVE_POWER_THRESHOLD_OPTIONS[0].value;
}

function getValidMoveLevelThreshold(
  value
) {
  const parsedValue = Number(value);

  return MOVE_LEVEL_THRESHOLD_OPTIONS.some(
    option => option.value === parsedValue
  )
    ? parsedValue
    : DEFAULT_MOVE_LEVEL_THRESHOLD;
}

function getValidTmLearnsetMode(value) {
  if (value === true) {
    return "include";
  }

  if (value === false) {
    return "exclude";
  }

  return TM_LEARNSET_OPTIONS.some(
    option => option.value === value
  )
    ? value
    : TM_LEARNSET_OPTIONS[0].value;
}

function isMobileRecommendationViewport() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia(
      MOBILE_RECOMMENDATIONS_MEDIA_QUERY
    ).matches
  );
}

function compareByNationalDex(a, b) {
  return a.id - b.id;
}

function getRecommendationCoverageScore(
  recommendation
) {
  return (
    Number(
      recommendation?.coverageScore
    ) || 0
  );
}

function compareByMostCoverage(a, b) {
  return (
    getRecommendationCoverageScore(b) -
      getRecommendationCoverageScore(a) ||
    (b.missingHits?.length ?? 0) -
      (a.missingHits?.length ?? 0) ||
    (b.missingDefensiveHits?.length ?? 0) -
      (a.missingDefensiveHits?.length ?? 0) ||
    (b.coveredTypes?.length ?? 0) -
      (a.coveredTypes?.length ?? 0) ||
    compareByNationalDex(a, b)
  );
}

function compareBySelectedTypeFirst(
  focusType
) {
  return (a, b) => {
    const aHitsFocus =
      a.missingHits.includes(focusType) ||
      a.missingDefensiveHits?.includes(
        focusType
      );
    const bHitsFocus =
      b.missingHits.includes(focusType) ||
      b.missingDefensiveHits?.includes(
        focusType
      );

    return (
      Number(bHitsFocus) -
        Number(aHitsFocus) ||
      compareByMostCoverage(a, b)
    );
  };
}

function getStatSortMode(value) {
  return STAT_SORT_MODES.find(
    option => option.value === value
  );
}

function getPokemonStatValue(pokemon, stat) {
  if (stat === "baseStatTotal") {
    return (
      Number(pokemon?.baseStatTotal) || 0
    );
  }

  return (
    Number(pokemon?.stats?.[stat]) || 0
  );
}

function compareByStat(sortMode) {
  const statMode =
    getStatSortMode(sortMode);

  return (a, b) => {
    if (!statMode) {
      return compareByNationalDex(a, b);
    }

    return (
      getPokemonStatValue(
        b,
        statMode.stat
      ) -
        getPokemonStatValue(
          a,
          statMode.stat
        ) ||
      compareByNationalDex(a, b)
    );
  };
}

function compareByCustomScore(a, b) {
  return (
    (b.playthroughScore?.total ?? 0) -
      (a.playthroughScore?.total ?? 0) ||
    getPokemonStatValue(
      b,
      "baseStatTotal"
    ) -
      getPokemonStatValue(
        a,
        "baseStatTotal"
      ) ||
    compareByMostCoverage(a, b)
  );
}

function sortRecommendationCandidates(
  candidates,
  sortMode,
  focusType
) {
  return [...candidates].sort((a, b) => {
    if (sortMode === "custom-score") {
      return compareByCustomScore(a, b);
    }

    if (sortMode === "most-coverage") {
      return compareByMostCoverage(a, b);
    }

    if (sortMode === "selected-type-first") {
      return compareBySelectedTypeFirst(
        focusType
      )(a, b);
    }

    if (getStatSortMode(sortMode)) {
      return compareByStat(sortMode)(a, b);
    }

    return compareByNationalDex(a, b);
  });
}

function getAttackTypePowersForLevel({
  includeMachineMoves = false,
  maxMoveLevel = 0,
  pokemon
}) {
  const levelCap =
    Number(maxMoveLevel) || 0;
  const attackTypePowerLevels =
    includeMachineMoves
      ? pokemon.attackTypePowerLevelsWithMachineMoves ??
        pokemon.attackTypePowerLevels
      : pokemon.attackTypePowerLevels;
  const attackTypePowers =
    includeMachineMoves
      ? pokemon.attackTypePowersWithMachineMoves ??
        pokemon.attackTypePowers
      : pokemon.attackTypePowers;
  const attackTypePowersByLevel =
    includeMachineMoves
      ? pokemon.attackTypePowersByLevelWithMachineMoves ??
        pokemon.attackTypePowersByLevel
      : pokemon.attackTypePowersByLevel;

  return (
    attackTypePowerLevels
      ? Object.fromEntries(
          Object.entries(
            attackTypePowerLevels
          ).flatMap(
            ([attackType, powerLevels]) => {
              const availablePowerLevels =
                levelCap > 0
                  ? powerLevels.filter(
                      entry =>
                        Number(entry.level) <=
                        levelCap
                    )
                  : powerLevels;
              const strongestEntry =
                availablePowerLevels[
                  availablePowerLevels.length - 1
                ];

              return strongestEntry
                ? [
                    [
                      attackType,
                      Number(
                        strongestEntry.power
                      ) || 0
                    ]
                  ]
                : [];
            }
          )
        )
      : levelCap > 0
        ? attackTypePowersByLevel?.[
            String(levelCap)
          ] ??
          attackTypePowers ??
          {}
        : attackTypePowers ?? {}
  );
}

function getThresholdedAttackTypes({
  consideredTypes,
  includeMachineMoves = false,
  maxMoveLevel = 0,
  minMovePower,
  pokemon
}) {
  const attackTypePowers =
    getAttackTypePowersForLevel({
      includeMachineMoves,
      maxMoveLevel,
      pokemon
    });

  if (minMovePower <= 0) {
    return consideredTypes.filter(type =>
      Object.hasOwn(attackTypePowers, type)
    );
  }

  return consideredTypes.filter(
    type =>
      Number(
        attackTypePowers[type]
      ) >= minMovePower
  );
}

function isStabIceTypeBonusEligible({
  includeMachineMoves = false,
  maxMoveLevel = 0,
  pokemon
}) {
  return (
    pokemon?.types?.includes("ice") &&
    Number(
      getAttackTypePowersForLevel({
        includeMachineMoves,
        maxMoveLevel,
        pokemon
      }).ice
    ) > 60
  );
}

function getCoverageFilterScore({
  coverageFilter,
  defensiveHits,
  offensiveHits
}) {
  if (coverageFilter === "defensive") {
    return defensiveHits.length;
  }

  if (coverageFilter === "either") {
    return (
      offensiveHits.length +
      defensiveHits.length
    );
  }

  if (coverageFilter === "both") {
    return (
      offensiveHits.length +
      defensiveHits.length
    );
  }

  return offensiveHits.length;
}

function isPureNormalType(pokemon) {
  const types = pokemon?.types ?? [];

  return (
    types.length === 1 &&
    types[0] === "normal"
  );
}

function matchesCoverageFilter({
  coverageFilter,
  defensiveHits,
  normalTypeQualifierEligible = false,
  offensiveHits
}) {
  if (normalTypeQualifierEligible) {
    return true;
  }

  const hasOffensive =
    offensiveHits.length > 0;
  const hasDefensive =
    defensiveHits.length > 0;

  if (coverageFilter === "defensive") {
    return hasDefensive;
  }

  if (coverageFilter === "either") {
    return hasOffensive || hasDefensive;
  }

  if (coverageFilter === "both") {
    return hasOffensive && hasDefensive;
  }

  return hasOffensive;
}

function isCosmeticPickerForm(name) {
  return String(name).startsWith(
    "pikachu-"
  );
}

function getPokemonOptionLabel(option) {
  return formatPokemonDisplayName({
    id: option.id,
    name: option.name
  });
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function readJsonUrl(url) {
  const fetchUrl =
    import.meta.env.DEV
      ? `${url}${
          url.includes("?") ? "&" : "?"
        }t=${Date.now()}`
      : url;
  const response = await fetch(fetchUrl);

  if (!response.ok) {
    return null;
  }

  return response.json();
}

function TypeBadgeList({
  emptyLabel,
  height = "1.35rem",
  justifyContent = "center",
  types
}) {
  if (!types.length) {
    return (
      <span
        style={{
          color: "#9ca3af",
          fontSize: ".9rem"
        }}
      >
        {emptyLabel}
      </span>
    );
  }

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        flexWrap: "wrap",
        gap: ".35rem",
        justifyContent
      }}
    >
      {types.map(type => (
        <TypeBadge
          key={type}
          type={type}
          height={height}
        />
      ))}
    </div>
  );
}

function formatMatchupScore(value) {
  const numericValue = Number(value) || 0;

  return Number.isInteger(numericValue)
    ? String(numericValue)
    : numericValue.toFixed(1);
}

function getDefenseMultiplier({
  attackType,
  defenseTypes,
  typeChart
}) {
  return (defenseTypes ?? []).reduce(
    (total, defenseType) =>
      total *
      (typeChart?.[attackType]?.[
        defenseType
      ] ?? 1),
    1
  );
}

function sortMatchupEntries(
  entries,
  consideredTypes
) {
  const typeOrder = new Map(
    consideredTypes.map((type, index) => [
      type,
      index
    ])
  );

  return entries.sort(
    (a, b) =>
      b.sortValue - a.sortValue ||
      (typeOrder.get(a.type) ?? 0) -
        (typeOrder.get(b.type) ?? 0)
  );
}

function getTeamResistanceEntries({
  consideredTypes,
  teamTypeSets,
  typeChart
}) {
  const entries = [];

  for (const attackType of consideredTypes) {
    let immunityCount = 0;
    let resistanceScore = 0;

    for (const defenseTypes of teamTypeSets) {
      const multiplier = getDefenseMultiplier({
        attackType,
        defenseTypes,
        typeChart
      });

      if (multiplier === 0) {
        immunityCount += 1;
      } else if (multiplier < 1) {
        resistanceScore += 1 / multiplier;
      }
    }

    if (
      immunityCount > 0 ||
      resistanceScore > 0
    ) {
      const resistanceLabel =
        resistanceScore > 0
          ? `${formatMatchupScore(
              resistanceScore
            )}X`
          : "";
      const immunityLabel =
        immunityCount > 0
          ? immunityCount > 1
            ? `${immunityCount} IMM`
            : "IMM"
          : "";

      entries.push({
        label:
          immunityLabel && resistanceLabel
            ? `${immunityLabel}+${resistanceLabel}`
            : immunityLabel || resistanceLabel,
        sortValue:
          resistanceScore +
          immunityCount * 4,
        type: attackType
      });
    }
  }

  return sortMatchupEntries(
    entries,
    consideredTypes
  );
}

function getTeamWeaknessEntries({
  consideredTypes,
  teamTypeSets,
  typeChart
}) {
  const entries = [];

  for (const attackType of consideredTypes) {
    const weaknessScore = teamTypeSets.reduce(
      (total, defenseTypes) => {
        const multiplier =
          getDefenseMultiplier({
            attackType,
            defenseTypes,
            typeChart
          });

        return multiplier > 1
          ? total + multiplier
          : total;
      },
      0
    );

    if (weaknessScore > 0) {
      entries.push({
        label: `${formatMatchupScore(
          weaknessScore
        )}X`,
        sortValue: weaknessScore,
        type: attackType
      });
    }
  }

  return sortMatchupEntries(
    entries,
    consideredTypes
  );
}

function MatchupBadgeList({
  emptyLabel,
  entries,
  height = "1.35rem"
}) {
  if (!entries.length) {
    return (
      <span
        style={{
          color: "#9ca3af",
          fontSize: ".9rem"
        }}
      >
        {emptyLabel}
      </span>
    );
  }

  return (
    <div className="team-coverage-matchup-badge-list">
      {entries.map(entry => (
        <span
          key={`${entry.type}-${entry.label}`}
          className="team-coverage-matchup-badge"
        >
          <span className="team-coverage-matchup-score">
            {entry.label}
          </span>
          <TypeBadge
            type={entry.type}
            height={height}
          />
        </span>
      ))}
    </div>
  );
}

function CoveragePanel({
  children,
  description,
  tone = "neutral",
  title,
  types = []
}) {
  const toneStyles = {
    covered: {
      backgroundColor: "rgba(74, 201, 122, 0.1)",
      border: "1px solid rgba(74, 201, 122, 0.45)"
    },
    missing: {
      backgroundColor: "rgba(248, 113, 113, 0.1)",
      border: "1px solid rgba(248, 113, 113, 0.45)"
    },
    neutral: {
      backgroundColor: "#202020",
      border: "1px solid #4a4a4a"
    }
  };
  const accentStyle =
    toneStyles[tone] ?? toneStyles.neutral;

  return (
    <section
      className={`team-coverage-panel team-coverage-panel-${tone}`}
      style={{
        borderRadius: "8px",
        boxSizing: "border-box",
        padding: "1rem",
        ...accentStyle
      }}
    >
      <h2
        style={{
          marginBottom: ".85rem"
        }}
      >
        {title}
      </h2>
      <p
        style={{
          color: "#9ca3af",
          fontSize: ".85rem",
          lineHeight: 1.35,
          margin: "0 0 .85rem"
        }}
      >
        {description}
      </p>
      {children ?? (
        <TypeBadgeList
          emptyLabel="None"
          height="1.45rem"
          types={types}
        />
      )}
    </section>
  );
}

function DefensiveCoverageBadgeGroups({
  groups
}) {
  const visibleGroups =
    DEFENSIVE_COVERAGE_GROUPS.filter(
      group => groups?.[group.key]?.length
    );

  if (!visibleGroups.length) {
    return (
      <span className="team-coverage-party-muted">
        None
      </span>
    );
  }

  return (
    <div className="team-coverage-defense-groups">
      {visibleGroups.map(group => (
        <div
          key={group.key}
          className="team-coverage-defense-group"
        >
          <span className="team-coverage-defense-group-label">
            {group.label}
          </span>
          <TypeBadgeList
            emptyLabel="None"
            height="1.15rem"
            justifyContent="center"
            types={groups[group.key]}
          />
        </div>
      ))}
    </div>
  );
}

function PartyTile({
  includeMachineMoves,
  maxMoveLevel,
  member,
  minMovePower,
  onChoose,
  onRemove
}) {
  const pokemon = member?.pokemon;
  const attackTypes =
    member?.attackTypes ?? [];
  const coveredTypes =
    member?.coveredTypes ?? [];
  const defensiveCoverageGroups =
    member?.defensiveCoverageGroups;
  const isLoading =
    member?.loading === true;

  if (!pokemon) {
    return (
      <button
        type="button"
        onClick={onChoose}
        className="team-coverage-party-tile team-coverage-party-tile-empty"
      >
        <div
          aria-hidden="true"
          className="team-coverage-party-add-icon"
        >
          +
        </div>
        <strong
          className="team-coverage-party-add-label"
        >
          Add Pokemon
        </strong>
      </button>
    );
  }

  return (
    <div
      className="team-coverage-party-tile team-coverage-party-tile-filled"
      style={getPokemonTypeTileStyle(
        pokemon.types ?? []
      )}
    >
      <PokemonSummaryCard
        pokemon={pokemon}
        variant="teamCoverage"
      />

      <div className="team-coverage-party-actions">
        <button
          type="button"
          onClick={onChoose}
        >
          Change
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="team-coverage-party-clear-button"
        >
          Clear
        </button>
      </div>

      <div className="team-coverage-party-section">
        <h3>
          {includeMachineMoves
            ? "Lv-Up + TM Atk Types"
            : "Lv-Up Atk Types"}
        </h3>
        <p className="team-coverage-party-muted">
          {minMovePower > 0
            ? `(${minMovePower}+ Pwr)`
            : "(Any Pwr)"}
          {maxMoveLevel > 0
            ? ` by Lv. ${maxMoveLevel}`
            : ""}
        </p>
        {isLoading ? (
          <span className="team-coverage-party-muted">
            Loading...
          </span>
        ) : (
          <TypeBadgeList
            emptyLabel={`None${
              minMovePower > 0
                ? ` at ${minMovePower}+`
                : ""
            }${
              maxMoveLevel > 0
                ? ` by Lv. ${maxMoveLevel}`
                : ""
            }`}
            height="1.15rem"
            justifyContent="center"
            types={attackTypes}
          />
        )}
      </div>

      <div className="team-coverage-party-section">
        <h3>Hits Offensively</h3>
        {isLoading ? (
          <span className="team-coverage-party-muted">
            Loading...
          </span>
        ) : (
          <TypeBadgeList
            emptyLabel="None"
            height="1.15rem"
            justifyContent="center"
            types={coveredTypes}
          />
        )}
      </div>

      <div className="team-coverage-party-section">
        <h3>Defends Against</h3>
        <DefensiveCoverageBadgeGroups
          groups={defensiveCoverageGroups}
        />
      </div>
    </div>
  );
}

function PokemonPicker({
  activeSlot,
  onClose,
  onSelect,
  options
}) {
  const [search, setSearch] =
    useState("");

  const filteredOptions = useMemo(() => {
    const term =
      normalizeSearchText(search);

    if (!term) {
      return options;
    }

    return options
      .filter(option => {
        const label =
          normalizeSearchText(
            getPokemonOptionLabel(
              option
            )
          );
        const name =
          normalizeSearchText(
            option.name
          );

        return (
          label.includes(term) ||
          name.includes(term) ||
          String(option.id) === term
        );
      })
      .slice(0, 80);
  }, [
    options,
    search
  ]);

  if (activeSlot === null) {
    return null;
  }

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        alignItems: "flex-start",
        backgroundColor:
          "rgba(0, 0, 0, .55)",
        display: "flex",
        inset: 0,
        justifyContent: "center",
        padding: "6rem 1rem 1rem",
        position: "fixed",
        zIndex: 50
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Choose Pokemon for slot ${activeSlot + 1}`}
        onClick={event =>
          event.stopPropagation()
        }
        style={{
          backgroundColor: "#202020",
          border: "1px solid #555",
          borderRadius: "8px",
          boxShadow:
            "0 18px 38px rgba(0, 0, 0, .45)",
          boxSizing: "border-box",
          maxWidth: "520px",
          padding: "1rem",
          width: "100%"
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: ".75rem",
            justifyContent: "space-between",
            marginBottom: ".75rem"
          }}
        >
          <h2>Choose Pokemon</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "1px solid #666",
              borderRadius: "6px",
              cursor: "pointer",
              padding: ".35rem .55rem"
            }}
          >
            Close
          </button>
        </div>

        <input
          autoFocus
          type="search"
          value={search}
          onChange={event =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search Pokemon..."
          style={{
            backgroundColor: "#2c2c2c",
            border: "2px solid #555",
            borderRadius: "8px",
            boxSizing: "border-box",
            color: "white",
            fontSize: "1rem",
            marginBottom: ".75rem",
            padding: ".75rem",
            width: "100%"
          }}
        />

        <div
          style={{
            display: "grid",
            gap: ".35rem",
            maxHeight: "360px",
            overflowY: "auto"
          }}
        >
          {filteredOptions.map(option => (
            <button
              key={option.id}
              type="button"
              onClick={() =>
                onSelect(option)
              }
              style={{
                alignItems: "center",
                backgroundColor: "#2c2c2c",
                border: "1px solid #4a4a4a",
                borderRadius: "6px",
                color: "white",
                cursor: "pointer",
                display: "flex",
                gap: ".75rem",
                justifyContent:
                  "space-between",
                padding: ".55rem .7rem",
                textAlign: "left"
              }}
            >
              <span>
                {getPokemonOptionLabel(
                  option
                )}
              </span>
              <span
                style={{
                  color: "#9ca3af",
                  fontSize: ".8rem"
                }}
              >
                #{String(option.id).padStart(4, "0")}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({
  canAddToTeam,
  includeMachineMoves,
  maxMoveLevel,
  minMovePower,
  onAddToTeam,
  recommendation
}) {
  return (
    <div
      style={{
        alignItems: "center",
        backgroundColor: "#202020",
        border: "1px solid #4a4a4a",
        borderRadius: "8px",
        boxSizing: "border-box",
        display: "grid",
        gap: ".65rem",
        justifyItems: "center",
        padding: ".75rem"
      }}
    >
      <PokemonSummaryCard
        pokemon={recommendation}
        variant="compact"
      />
      <button
        type="button"
        disabled={!canAddToTeam}
        onClick={onAddToTeam}
        style={{
          backgroundColor: canAddToTeam
            ? "rgba(34, 197, 94, 0.18)"
            : "transparent",
          border: canAddToTeam
            ? "1px solid rgba(74, 222, 128, 0.65)"
            : "1px solid #555",
          borderRadius: "999px",
          color: canAddToTeam
            ? "#bbf7d0"
            : "#9ca3af",
          cursor: canAddToTeam
            ? "pointer"
            : "default",
          fontSize: ".68rem",
          fontWeight: 700,
          lineHeight: 1,
          opacity: canAddToTeam ? 1 : 0.55,
          padding: ".35rem .6rem"
        }}
        title={
          canAddToTeam
            ? "Add this Pokemon to the first open team slot."
            : "Your team is full."
        }
      >
        Add to Team
      </button>
      <div>
        <p
          style={{
            color: "#f3f4f6",
            fontSize: ".8rem",
            fontWeight: "bold",
            margin: "0 0 .35rem"
          }}
        >
          Hits Offensively
        </p>
        <TypeBadgeList
          emptyLabel="None"
          height="1.05rem"
          types={
            recommendation.missingHits
          }
        />
      </div>
      <div>
        <p
          style={{
            color: "#f3f4f6",
            fontSize: ".8rem",
            fontWeight: "bold",
            margin: "0 0 .35rem"
          }}
        >
          Defends Against
        </p>
        <TypeBadgeList
          emptyLabel="None"
          height="1.05rem"
          types={
            recommendation.missingDefensiveHits ??
            []
          }
        />
      </div>
      <div>
        <p
          style={{
            color: "#9ca3af",
            fontSize: ".75rem",
            margin: "0 0 .35rem"
          }}
        >
          {includeMachineMoves
            ? "Level-up + TM attack types"
            : "Level-up attack types"}
          {minMovePower > 0
            ? ` (${minMovePower}+ power)`
            : ""}
          {maxMoveLevel > 0
            ? ` by Lv. ${maxMoveLevel}`
            : ""}
        </p>
        <TypeBadgeList
          emptyLabel="None"
          height=".95rem"
          types={
            recommendation.attackTypes
          }
        />
      </div>
    </div>
  );
}

function TeamCoverageExplainer() {
  return (
    <article className="team-coverage-explainer">
      <h2>
        How the Pokémon Playthrough Team Builder Works
      </h2>
      <p>
        The Team Builder can be used to evaluate an entire playthrough team,
        but it is particularly useful when you already have several Pokémon
        picked and need to find the best teammate to fill the remaining gaps.
      </p>

      <h3>Your Team and Their Coverage</h3>
      <p>
        Each Pokémon on your team has its available level-up attack types
        displayed. These moves can be filtered by minimum <strong>Move
        Power</strong> and by the level at which they are learned.
      </p>
      <p>
        Set the <strong>Learned At</strong> level to something appropriate for
        where you are in your playthrough. If you are building a team for the
        Elite Four, for example, set it close to the level you expect your team
        to be when challenging the League. If you are planning for the
        midgame, use a lower level that better reflects where your team
        currently is.
      </p>
      <p>
        This helps keep coverage results realistic instead of counting
        powerful moves that your Pokémon will not learn until much
        later.
      </p>

      <h3>Offensive Coverage and Missing Offensive Coverage</h3>
      <p>
        <strong>Offensive Coverage</strong> shows which Pokémon types your team
        can hit for super-effective damage using the moves they can actually
        learn in your selected game. By default, this is based on level-up
        moves, but TM moves can also be included.
      </p>
      <p>
        This means offensive coverage is based on your Pokémon's actual
        learnsets rather than simply assuming they can cover types based on
        their own typing.
      </p>
      <p>
        If a type is not being covered when you think it should be, check your{" "}
        <strong>Learned At</strong> and <strong>Move Power</strong> settings.
        Earlier-generation Pokémon games often have much more limited level-up
        learnsets, so lowering or raising these filters can significantly
        change the results. For complete Learnset information, see the individual
        Pokémon's detail page.
      </p>
      <p>
        The <strong>Missing Offensive Coverage</strong> section shows the types
        your current team cannot hit super effectively under your selected
        settings. Ideally, your team should be able to cover most types, but
        not every missing type is equally important. Pay particular attention
        to the Elite Four and Champion in the game you are playing, since
        having strong coverage against their teams can be much more valuable
        than filling an otherwise uncommon gap.
      </p>

      <h3>Defensive Coverage, Missing Coverage, and Weaknesses</h3>
      <p>
        <strong>Defensive Coverage</strong> shows which attacking types your
        team can resist or is immune to. If multiple team members resist the
        same type, those resistances stack in the display. The same is true for
        immunities and weaknesses.
      </p>
      <p>
        The <strong>Missing Defensive Coverage</strong> section identifies
        attack types for which your team has no resistance or immunity. This
        does not necessarily mean your team is weak to that type; it simply
        means you do not currently have a Pokémon that can comfortably switch
        into it based on typing alone.
      </p>
      <p>
        The <strong>Weaknesses</strong> section identifies attack types that
        can deal super-effective damage to members of your team. Stacking
        values make it easier to spot major shared weaknesses. When choosing
        another teammate, try to avoid adding another Pokémon that makes an
        already significant weakness even worse.
      </p>

      <h3>What Pokémon Should I Add to My Team?</h3>
      <p>
        The Team Builder compares the Pokémon available in your selected game against 
        your team's offensive and defensive coverage gaps to help identify useful additions.


        "PokeLore Suggested" is designed for normal Pokémon game playthroughs
        rather than competitive battling. Availability, realistic learnsets,
        evolution requirements, type coverage, and usefulness during the story
        therefore matter more than competitive viability alone.
      </p>
      <p>
        The Team Builder is especially useful when you need one final Pokémon
        and are wondering <strong>what Pokémon you should add to your
        team</strong>. Suggested Teammates compares available Pokémon against
        the gaps in your current team and attempts to surface options that are
        both useful and realistically obtainable.
      </p>

      <h3>Understanding the Sort Modes</h3>
      <p>
        The default <strong>PokeLore Suggested</strong> sort considers how much
        useful offensive and defensive coverage a Pokémon can provide at your
        selected level. Pokémon found in the Regional Pokédex are strongly
        favored, helping keep recommendations focused on Pokémon you can
        realistically obtain during that game's playthrough.
      </p>
      <p>
        Trade evolutions and Legendary Pokémon are excluded from suggestions by
        default, but either can be included using the available filters. A
        Pokémon's level-up learnset in your selected game and its defensive
        typing are also major components of its recommendation score.
      </p>
      <p>
        Offensive and defensive coverage are the main drivers of most
        recommendations, but several other factors help refine the results.
        Base Stat Total (BST) plays a smaller role, primarily by pushing
        low-BST, unevolved Pokémon farther down the list while giving stronger
        Pokémon a modest boost. Pokémon known to be particularly strong
        playthrough choices may also receive a ranking boost even when their
        raw type coverage is somewhat lower.
      </p>
      <p>
        The highest-ranked Pokémon will not always be the absolute best choice
        for every playthrough. Some opposing types are much more important to
        cover in certain games than others. If your current team is missing a
        large amount of type coverage, powerful Pokémon with limited level-up
        coverage, such as Snorlax, may appear farther down the list. As your
        team's coverage becomes more complete, these powerful but less
        versatile Pokémon can begin ranking higher.
      </p>
      <p>
        Normal-type Pokémon can be extremely useful during a playthrough, 
        but because Normal-type attacks cannot
        deal super-effective damage, they may contribute less to offensive type
        coverage than Pokémon of other types. For that reason they get a slight 
        boost in the scoring system to help them appear more prominently.
      </p>
      <p>
        <strong>Most Coverage</strong> focuses primarily on which Pokémon can
        fill the greatest number of your team's missing coverage needs. Factors
        such as BST are ignored. The <strong>Team Need</strong> dropdown can
        further focus the results on Offensive Coverage, Defensive Coverage,
        either one, or Pokémon that help with both.
      </p>
      <p>
        Stat-based sorts such as <strong>Highest BST</strong>, <strong>Highest
        Attack</strong>, and <strong>Highest Speed</strong> still limit the
        results to Pokémon that can help your team in some way, but prioritize
        the selected stat rather than overall coverage.
      </p>

      <h3>TM Coverage and Specific Types</h3>
      <p>
        Sometimes the best way to fix a missing type is not to add another
        Pokémon at all. One of your existing team members may be able to learn
        an appropriate TM. Set <strong>TM Learnsets</strong> to{" "}
        <strong>Include</strong> to factor available TM moves into the
        calculator's offensive coverage analysis.
      </p>
      <p>
        If you specifically need an answer to one troublesome Pokémon type,
        choose <strong>Selected Type First</strong> from the Sort dropdown. A{" "}
        <strong>Type</strong> dropdown will then appear, allowing you to
        prioritize suggested teammates that can help cover that particular
        type.
      </p>
    </article>
  );
}

function TeamCoveragePage() {
  const [
    searchParams,
    setSearchParams
  ] = useSearchParams();
  const [
    preferredVersion,
    setPreferredVersion
  ] = useLocalStorageState(
    VERSION_STORAGE_KEY,
    DEFAULT_VERSION_GROUP
  );
  const urlVersion =
    searchParams.get("version") ??
    searchParams.get("game");
  const selectedVersion =
    getValidVersionGroup(urlVersion) ??
    getValidVersionGroup(
      preferredVersion
    ) ??
    DEFAULT_VERSION_GROUP;
  const [party, setParty] =
    useLocalStorageState(
      PARTY_STORAGE_KEY,
      createEmptyParty()
    );
  const storageParty = useMemo(
    () => normalizeParty(party),
    [party]
  );
  const urlParty = useMemo(
    () =>
      normalizePartyParam(
        searchParams.get("team") ??
          searchParams.get("party") ??
          searchParams.get("pokemon")
      ),
    [searchParams]
  );
  const normalizedParty =
    urlParty ?? storageParty;
  const selectedPartyIds = useMemo(
    () => [
      ...new Set(
        normalizedParty.filter(Boolean)
      )
    ],
    [normalizedParty]
  );
  const [pokemonOptions, setPokemonOptions] =
    useState([]);
  const [movesByName, setMovesByName] =
    useState({});
  const [
    pokemonRecordsById,
    setPokemonRecordsById
  ] = useState({});
  const [
    activeSlot,
    setActiveSlot
  ] = useState(null);
  const [
    teamCoverageData,
    setTeamCoverageData
  ] = useState(null);
  const pendingLocalPartyParamRef =
    useRef(null);
  const [
    recommendationPage,
    setRecommendationPage
  ] = useState(1);
  const [
    isMobileRecommendationPageSize,
    setIsMobileRecommendationPageSize
  ] = useState(
    isMobileRecommendationViewport
  );
  const [
    preferredSortMode,
    setPreferredSortMode
  ] = useLocalStorageState(
    SORT_STORAGE_KEY,
    DEFAULT_RECOMMENDATION_SORT_MODE
  );
  const selectedSortMode =
    getValidSortMode(preferredSortMode);
  const [
    preferredCoverageFilter,
    setPreferredCoverageFilter
  ] = useLocalStorageState(
    COVERAGE_FILTER_STORAGE_KEY,
    DEFAULT_RECOMMENDATION_COVERAGE_FILTER
  );
  const selectedCoverageFilter =
    getValidCoverageFilter(
      preferredCoverageFilter
    );
  const [
    preferredLegendaryFilter,
    setPreferredLegendaryFilter
  ] = useLocalStorageState(
    LEGENDARY_FILTER_STORAGE_KEY,
    LEGENDARY_FILTER_OPTIONS[0].value
  );
  const selectedLegendaryFilter =
    getValidLegendaryFilter(
      preferredLegendaryFilter
    );
  const [
    preferredTradeEvolutionFilter,
    setPreferredTradeEvolutionFilter
  ] = useLocalStorageState(
    TRADE_EVOLUTION_FILTER_STORAGE_KEY,
    TRADE_EVOLUTION_FILTER_OPTIONS[0].value
  );
  const selectedTradeEvolutionFilter =
    getValidTradeEvolutionFilter(
      preferredTradeEvolutionFilter
    );
  const [
    preferredRecommendationWeights
  ] = useLocalStorageState(
    TEAM_RECOMMENDATION_WEIGHTS_STORAGE_KEY,
    DEFAULT_TEAM_RECOMMENDATION_WEIGHTS
  );
  const selectedRecommendationWeights =
    useMemo(
      () =>
        normalizeRecommendationWeights(
          preferredRecommendationWeights
        ),
      [preferredRecommendationWeights]
    );
  const [
    preferredFocusType,
    setPreferredFocusType
  ] = useLocalStorageState(
    FOCUS_TYPE_STORAGE_KEY,
    "water"
  );
  const [
    preferredMovePowerThreshold,
    setPreferredMovePowerThreshold
  ] = useLocalStorageState(
    MOVE_POWER_THRESHOLD_STORAGE_KEY,
    MOVE_POWER_THRESHOLD_OPTIONS[0].value
  );
  const selectedMovePowerThreshold =
    getValidMovePowerThreshold(
      preferredMovePowerThreshold
    );
  const [
    preferredMoveLevelThreshold,
    setPreferredMoveLevelThreshold
  ] = useLocalStorageState(
    MOVE_LEVEL_THRESHOLD_STORAGE_KEY,
    DEFAULT_MOVE_LEVEL_THRESHOLD
  );
  const selectedMoveLevelThreshold =
    getValidMoveLevelThreshold(
      preferredMoveLevelThreshold
    );
  const [
    preferredPartyTmLearnsetMode,
    setPreferredPartyTmLearnsetMode
  ] = useLocalStorageState(
    PARTY_TM_LEARNSET_STORAGE_KEY,
    "exclude"
  );
  const selectedPartyTmLearnsetMode =
    getValidTmLearnsetMode(
      preferredPartyTmLearnsetMode
    );
  const includePartyTmLearnsets =
    selectedPartyTmLearnsetMode ===
    "include";
  const [
    preferredRecommendationMovePowerThreshold,
    setPreferredRecommendationMovePowerThreshold
  ] = useLocalStorageState(
    RECOMMENDATION_MOVE_POWER_THRESHOLD_STORAGE_KEY,
    DEFAULT_RECOMMENDATION_MOVE_POWER_THRESHOLD
  );
  const selectedRecommendationMovePowerThreshold =
    getValidMovePowerThreshold(
      preferredRecommendationMovePowerThreshold
    );
  const [
    preferredRecommendationMoveLevelThreshold,
    setPreferredRecommendationMoveLevelThreshold
  ] = useLocalStorageState(
    RECOMMENDATION_MOVE_LEVEL_THRESHOLD_STORAGE_KEY,
    DEFAULT_MOVE_LEVEL_THRESHOLD
  );
  const selectedRecommendationMoveLevelThreshold =
    getValidMoveLevelThreshold(
      preferredRecommendationMoveLevelThreshold
    );
  const [
    preferredRecommendationTmLearnsetMode,
    setPreferredRecommendationTmLearnsetMode
  ] = useLocalStorageState(
    RECOMMENDATION_TM_LEARNSET_STORAGE_KEY,
    "exclude"
  );
  const selectedRecommendationTmLearnsetMode =
    getValidTmLearnsetMode(
      preferredRecommendationTmLearnsetMode
    );
  const includeRecommendationTmLearnsets =
    selectedRecommendationTmLearnsetMode ===
    "include";
  const consideredTypes = useMemo(
    () =>
      getTypesForVersionGroup(
        selectedVersion
      ),
    [selectedVersion]
  );
  const recommendationsPerPage =
    isMobileRecommendationPageSize
      ? MOBILE_RECOMMENDATIONS_PER_PAGE
      : DESKTOP_RECOMMENDATIONS_PER_PAGE;

  useEffect(() => {
    if (
      selectedVersion !==
      preferredVersion
    ) {
      setPreferredVersion(
        selectedVersion
      );
    }
  }, [
    preferredVersion,
    selectedVersion,
    setPreferredVersion
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQueryList =
      window.matchMedia(
        MOBILE_RECOMMENDATIONS_MEDIA_QUERY
      );

    function handleMediaChange(event) {
      setIsMobileRecommendationPageSize(
        event.matches
      );
      setRecommendationPage(1);
    }

    setIsMobileRecommendationPageSize(
      mediaQueryList.matches
    );

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener(
        "change",
        handleMediaChange
      );

      return () => {
        mediaQueryList.removeEventListener(
          "change",
          handleMediaChange
        );
      };
    }

    mediaQueryList.addListener(
      handleMediaChange
    );

    return () => {
      mediaQueryList.removeListener(
        handleMediaChange
      );
    };
  }, []);

  useEffect(() => {
    const pendingLocalPartyParam =
      pendingLocalPartyParamRef.current;
    const currentPartyParam =
      searchParams.get("team") ??
      searchParams.get("party") ??
      searchParams.get("pokemon") ??
      "";

    if (pendingLocalPartyParam !== null) {
      if (
        currentPartyParam ===
        pendingLocalPartyParam
      ) {
        pendingLocalPartyParamRef.current =
          null;
      }

      return;
    }

    if (
      urlParty &&
      !partiesEqual(urlParty, storageParty)
    ) {
      setParty(urlParty);
    }
  }, [
    setParty,
    searchParams,
    storageParty,
    urlParty
  ]);

  useEffect(() => {
    const serializedParty =
      serializePartyParam(normalizedParty);
    const urlHasSelectedVersion =
      searchParams.get("version") ===
      selectedVersion;
    const urlHasSelectedParty =
      (searchParams.get("team") ?? "") ===
      serializedParty;
    const hasLegacyParams =
      searchParams.has("game") ||
      searchParams.has("party") ||
      searchParams.has("pokemon");

    if (
      urlHasSelectedVersion &&
      urlHasSelectedParty &&
      !hasLegacyParams
    ) {
      return;
    }

    const nextParams =
      new URLSearchParams(searchParams);

    nextParams.set(
      "version",
      selectedVersion
    );
    nextParams.delete("game");
    nextParams.delete("party");
    nextParams.delete("pokemon");

    if (serializedParty) {
      nextParams.set(
        "team",
        serializedParty
      );
    } else {
      nextParams.delete("team");
    }

    setSearchParams(nextParams, {
      replace: true
    });
  }, [
    normalizedParty,
    searchParams,
    selectedVersion,
    setSearchParams
  ]);

  useEffect(() => {
    let isMounted = true;

    async function loadBaseData() {
      const [
        routes,
        movesMap
      ] = await Promise.all([
        readJsonUrl(
          "/data/pokemonRoutes.json"
        ),
        loadMovesMap()
      ]);

      if (!isMounted) {
        return;
      }

      const options = Object.entries(
        routes?.byId ?? {}
      )
        .map(([id, name]) => ({
          id: Number(id),
          name
        }))
        .filter(
          option =>
            Number.isFinite(
              option.id
            ) &&
            !isCosmeticPickerForm(
              option.name
            )
        )
        .sort((a, b) => a.id - b.id);

      setPokemonOptions(options);
      setMovesByName(movesMap);
    }

    loadBaseData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!selectedPartyIds.length) {
      return;
    }

    async function loadPokemonRecords() {
      const entries =
        await Promise.all(
          selectedPartyIds.map(async id => {
            const [
              pokemon,
              learnset
            ] = await Promise.all([
              readJsonUrl(
                `/data/pokemonData/${id}.json`
              ),
              readJsonUrl(
                `/data/pokemonLearnsets/${id}.json`
              )
            ]);

            return [
              id,
              {
                error:
                  !pokemon || !learnset,
                learnset,
                loading: false,
                pokemon
              }
            ];
          })
        );

      if (!isMounted) {
        return;
      }

      setPokemonRecordsById(
        Object.fromEntries(entries)
      );
    }

    loadPokemonRecords();

    return () => {
      isMounted = false;
    };
  }, [selectedPartyIds]);

  useEffect(() => {
    let isMounted = true;

    async function loadTeamCoverageData() {
      const data = await readJsonUrl(
        `/data/teamCoverage/${selectedVersion}.json`
      );

      if (!isMounted) {
        return;
      }

      setTeamCoverageData(data);
    }

    loadTeamCoverageData();

    return () => {
      isMounted = false;
    };
  }, [selectedVersion]);

  const partyMembers = useMemo(
    () =>
      normalizedParty.map(id => {
        if (!id) {
          return null;
        }

        const record =
          pokemonRecordsById[id] ?? {
            loading: true
          };
        const attackTypes =
          record.learnset
            ? getLevelUpAttackTypes({
                consideredTypes,
                includeMachineMoves:
                  includePartyTmLearnsets,
                learnset:
                  record.learnset,
                maxMoveLevel:
                  selectedMoveLevelThreshold,
                minMovePower:
                  selectedMovePowerThreshold,
                movesByName,
                versionGroup:
                  selectedVersion
            })
            : [];
        const coveredTypes =
          getCoveredDefenseTypes({
            attackTypes,
            consideredTypes,
            typeChart
          });
        const defensiveCoverageGroups =
          getDefensiveCoverageBreakdown({
            consideredTypes,
            defenseTypes:
              record.pokemon?.types ?? [],
            typeChart
          });
        const defensiveCoverageTypes = [
          ...defensiveCoverageGroups.immunities,
          ...defensiveCoverageGroups.fourTimesResistances,
          ...defensiveCoverageGroups.twoTimesResistances
        ];

        return {
          ...record,
          attackTypes,
          coveredTypes,
          defensiveCoverageGroups,
          defensiveCoverageTypes
        };
      }),
    [
      includePartyTmLearnsets,
      movesByName,
      normalizedParty,
      pokemonRecordsById,
      selectedMoveLevelThreshold,
      selectedMovePowerThreshold,
      selectedVersion,
      consideredTypes
    ]
  );

  const partyAttackTypes = useMemo(
    () =>
      consideredTypes.filter(type =>
        partyMembers.some(member =>
          member?.attackTypes?.includes(type)
        )
      ),
    [
      consideredTypes,
      partyMembers
    ]
  );
  const coveredTypes = useMemo(
    () =>
      getCoveredDefenseTypes({
        attackTypes: partyAttackTypes,
        consideredTypes,
        typeChart
      }),
    [
      consideredTypes,
      partyAttackTypes
    ]
  );
  const missingTypes = useMemo(
    () =>
      getMissingDefenseTypes({
        consideredTypes,
        coveredTypes
      }),
    [
      consideredTypes,
      coveredTypes
    ]
  );
  const teamTypeSets = useMemo(
    () =>
      partyMembers
        .map(
          member =>
            member?.pokemon?.types ?? []
        )
        .filter(types => types.length),
    [partyMembers]
  );
  const defensiveCoveredTypes = useMemo(
    () =>
      getTeamDefensiveCoverageTypes({
        consideredTypes,
        teamTypeSets,
        typeChart
      }),
    [
      consideredTypes,
      teamTypeSets
    ]
  );
  const defensiveCoverageEntries =
    useMemo(
      () =>
        getTeamResistanceEntries({
          consideredTypes,
          teamTypeSets,
          typeChart
        }),
      [
        consideredTypes,
        teamTypeSets
      ]
    );
  const weaknessEntries = useMemo(
    () =>
      getTeamWeaknessEntries({
        consideredTypes,
        teamTypeSets,
        typeChart
      }),
    [
      consideredTypes,
      teamTypeSets
    ]
  );
  const missingDefensiveTypes =
    useMemo(
      () =>
        getMissingDefenseTypes({
          consideredTypes,
          coveredTypes:
            defensiveCoveredTypes
        }),
      [
        consideredTypes,
        defensiveCoveredTypes
      ]
    );
  const hasPureNormalPartyMember =
    useMemo(
      () =>
        partyMembers.some(member =>
          isPureNormalType(member?.pokemon)
        ),
      [partyMembers]
    );
  const focusTypeOptions = useMemo(() => {
    if (
      selectedCoverageFilter ===
      "defensive"
    ) {
      return missingDefensiveTypes;
    }

    if (
      selectedCoverageFilter ===
      "either" ||
      selectedCoverageFilter === "both"
    ) {
      const focusTypes = new Set([
        ...missingTypes,
        ...missingDefensiveTypes
      ]);

      return consideredTypes.filter(type =>
        focusTypes.has(type)
      );
    }

    return missingTypes;
  }, [
    consideredTypes,
    missingDefensiveTypes,
    missingTypes,
    selectedCoverageFilter
  ]);
  const selectedFocusType =
    focusTypeOptions.includes(
      preferredFocusType
    )
      ? preferredFocusType
      : focusTypeOptions[0] ??
        consideredTypes[0];

  useEffect(() => {
    if (
      selectedFocusType &&
      selectedFocusType !==
        preferredFocusType
    ) {
      setPreferredFocusType(
        selectedFocusType
      );
    }
  }, [
    preferredFocusType,
    selectedFocusType,
    setPreferredFocusType
  ]);

  const hasActiveRecommendationNeed =
    selectedCoverageFilter === "defensive"
      ? missingDefensiveTypes.length > 0
      : selectedCoverageFilter === "both" ||
        selectedCoverageFilter === "either"
        ? missingTypes.length > 0 ||
          missingDefensiveTypes.length > 0
        : missingTypes.length > 0;
  const hasOpenPartySlot =
    normalizedParty.some(id => !id);

  const recommendationResult =
    useMemo(() => {
      if (
        teamCoverageData?.versionGroup !==
        selectedVersion
      ) {
        return {
          candidates: [],
          fallbackMode: null
        };
      }

      const selectedIds = new Set(
        normalizedParty.filter(Boolean)
      );

      const scoredCandidates = (
        teamCoverageData?.pokemon ?? []
      )
        .filter(
          pokemon =>
            !selectedIds.has(pokemon.id) &&
            pokemon.isMythical !== true &&
            (selectedLegendaryFilter ===
              "show" ||
              pokemon.isLegendary !== true) &&
            (selectedTradeEvolutionFilter ===
              "show" ||
              pokemon.playthroughScore?.flags
                ?.tradeEvolution !== true &&
                pokemon.playthroughFlags
                  ?.tradeEvolution !== true)
        )
        .map(pokemon => {
          const normalTypeQualifierEligible =
            !hasPureNormalPartyMember &&
            isPureNormalType(pokemon);
          const stabIceTypeBonusEligible =
            isStabIceTypeBonusEligible({
              includeMachineMoves:
                includeRecommendationTmLearnsets,
              maxMoveLevel:
                selectedRecommendationMoveLevelThreshold,
              pokemon
            });
          const attackTypes =
            getThresholdedAttackTypes({
              consideredTypes,
              includeMachineMoves:
                includeRecommendationTmLearnsets,
              maxMoveLevel:
                selectedRecommendationMoveLevelThreshold,
              minMovePower:
                selectedRecommendationMovePowerThreshold,
              pokemon
            });
          const coveredTypes =
            getCoveredDefenseTypes({
              attackTypes,
              consideredTypes,
              typeChart
            });
          const defensiveCoverageTypes =
            getDefensiveCoverageTypes({
              consideredTypes,
              defenseTypes:
                pokemon.types ?? [],
              typeChart
            });
          const missingHits =
            coveredTypes.filter(type =>
              missingTypes.includes(type)
            );
          const missingDefensiveHits =
            defensiveCoverageTypes.filter(
              type =>
                missingDefensiveTypes.includes(
                  type
                )
            );

          const scoredPokemon = {
            ...pokemon,
            attackTypes,
            coveredTypes,
            coverageScore:
              getCoverageFilterScore({
                coverageFilter:
                  selectedCoverageFilter,
                defensiveHits:
                  missingDefensiveHits,
                offensiveHits:
                  missingHits
              }),
            defensiveCoverageTypes,
            missingDefensiveHits,
            missingHits,
            normalTypeQualifierEligible,
            stabIceTypeBonusEligible
          };

          return {
            ...scoredPokemon,
            playthroughScore:
              getTeamRecommendationScore({
                includeTradeEvolutionPenalty:
                  selectedTradeEvolutionFilter !==
                  "show",
                pokemon: scoredPokemon,
                weights:
                  selectedRecommendationWeights
            })
          };
        });

      const strictCandidates =
        scoredCandidates.filter(pokemon =>
          !hasOpenPartySlot ||
          !hasActiveRecommendationNeed ||
          matchesCoverageFilter({
            coverageFilter:
              selectedCoverageFilter,
            defensiveHits:
              pokemon.missingDefensiveHits,
            normalTypeQualifierEligible:
              pokemon.normalTypeQualifierEligible,
            offensiveHits:
              pokemon.missingHits
          })
        );

      const sortedStrictCandidates =
        sortRecommendationCandidates(
          strictCandidates,
          selectedSortMode,
          selectedFocusType
        );

      if (sortedStrictCandidates.length > 0) {
        return {
          candidates: sortedStrictCandidates,
          fallbackMode: null
        };
      }

      if (
        selectedCoverageFilter !== "both" ||
        !hasOpenPartySlot ||
        !hasActiveRecommendationNeed
      ) {
        return {
          candidates: sortedStrictCandidates,
          fallbackMode: null
        };
      }

      const eitherCandidates =
        sortRecommendationCandidates(
          scoredCandidates.filter(pokemon =>
            matchesCoverageFilter({
              coverageFilter: "either",
              defensiveHits:
                pokemon.missingDefensiveHits,
              normalTypeQualifierEligible:
                pokemon.normalTypeQualifierEligible,
              offensiveHits:
                pokemon.missingHits
            })
          ),
          selectedSortMode,
          selectedFocusType
        ).slice(0, 5);

      if (eitherCandidates.length > 0) {
        return {
          candidates: eitherCandidates,
          fallbackMode: "either"
        };
      }

      return {
        candidates:
          sortRecommendationCandidates(
            scoredCandidates,
            "highest-bst",
            selectedFocusType
          ).slice(0, 5),
        fallbackMode: "bst"
      };
    }, [
      consideredTypes,
      hasActiveRecommendationNeed,
      hasOpenPartySlot,
      hasPureNormalPartyMember,
      includeRecommendationTmLearnsets,
      missingDefensiveTypes,
      missingTypes,
      normalizedParty,
      selectedCoverageFilter,
      selectedFocusType,
      selectedLegendaryFilter,
      selectedRecommendationMoveLevelThreshold,
      selectedRecommendationMovePowerThreshold,
      selectedRecommendationWeights,
      selectedSortMode,
      selectedTradeEvolutionFilter,
      selectedVersion,
      teamCoverageData
    ]);
  const recommendationCandidates =
    recommendationResult.candidates;
  const recommendationFallbackMode =
    recommendationResult.fallbackMode;
  const recommendationPageCount =
    Math.max(
      1,
      Math.ceil(
        recommendationCandidates.length /
          recommendationsPerPage
      )
    );
  const currentRecommendationPage =
    Math.min(
      recommendationPage,
      recommendationPageCount
    );
  const recommendationStart =
    (currentRecommendationPage - 1) *
    recommendationsPerPage;
  const visibleRecommendations =
    recommendationCandidates.slice(
      recommendationStart,
      recommendationStart +
        recommendationsPerPage
    );

  useEffect(() => {
    setRecommendationPage(page =>
      Math.min(page, recommendationPageCount)
    );
  }, [recommendationPageCount]);

  const selectedVersionCoverageLoaded =
    teamCoverageData?.versionGroup ===
    selectedVersion;
  const selectedVersionHasAvailability =
    (teamCoverageData?.availablePokemonCount ??
      0) > 0;
  const hasSelectedParty =
    normalizedParty.some(Boolean);

  function updatePartySearchParams(
    nextParty,
    options
  ) {
    const nextParams =
      new URLSearchParams(searchParams);
    const serializedParty =
      serializePartyParam(nextParty);

    nextParams.set(
      "version",
      selectedVersion
    );
    nextParams.delete("game");
    nextParams.delete("party");
    nextParams.delete("pokemon");

    if (serializedParty) {
      nextParams.set(
        "team",
        serializedParty
      );
    } else {
      nextParams.delete("team");
    }

    setSearchParams(nextParams, options);
  }

  function updateSlot(slotIndex, value) {
    setRecommendationPage(1);
    const next =
      normalizeParty(normalizedParty);
    next[slotIndex] = value;
    const serializedParty =
      serializePartyParam(next);

    pendingLocalPartyParamRef.current =
      serializedParty;
    setParty(next);

    updatePartySearchParams(next, {
      replace: !serializedParty
    });
  }

  function clearParty() {
    setRecommendationPage(1);
    const next = createEmptyParty();
    pendingLocalPartyParamRef.current = "";
    setParty(next);
    updatePartySearchParams(next, {
      replace: true
    });
  }

  function addRecommendationToTeam(recommendation) {
    const openSlotIndex =
      normalizedParty.findIndex(id => !id);

    if (openSlotIndex === -1) {
      return;
    }

    updateSlot(
      openSlotIndex,
      recommendation.id
    );
  }

  function handleSelectPokemon(option) {
    if (activeSlot === null) {
      return;
    }

    updateSlot(activeSlot, option.id);
    setActiveSlot(null);
  }

  return (
    <main
      style={{
        boxSizing: "border-box",
        padding: "1rem"
      }}
    >
      <Seo {...teamCoverageSeo()} />

      <h1
        style={{
          lineHeight: 1.12,
          marginLeft: "auto",
          marginRight: "auto",
          maxWidth: "760px"
        }}
      >
        Pokémon Playthrough Team Builder
      </h1>

      <p
        style={{
          color: "#d1d5db",
          fontSize: "1rem",
          lineHeight: 1.45,
          margin: "0 auto 1.25rem",
          maxWidth: "760px"
        }}
      >
        Build a team for the Pokémon game you're actually playing. Check
        offensive coverage, weaknesses, resistances and immunities, then find
        suggested teammates based on the Pokémon available in your game and
        the moves they can realistically learn.
      </p>

      <p
        style={{
          color: "#9ca3af",
          fontSize: ".9rem",
          lineHeight: 1.4,
          margin: "0 auto 1.25rem",
          maxWidth: "760px"
        }}
      >
        Just need to cover one type?{" "}
        <Link to="/single-type-coverage">
          Try our Single Coverage Calculator.
        </Link>
      </p>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexWrap: "wrap",
          gap: ".75rem",
          justifyContent: "center",
          marginBottom: "1.25rem"
        }}
      >
        <label
          htmlFor="team-coverage-version"
          style={{
            color: "#f3f4f6",
            fontWeight: "bold"
          }}
        >
          Game
        </label>
        <select
          id="team-coverage-version"
          value={selectedVersion}
          onChange={event => {
            setRecommendationPage(1);
            const nextParams =
              new URLSearchParams(
                searchParams
              );
            nextParams.set(
              "version",
              event.target.value
            );
            nextParams.delete("game");
            setSearchParams(nextParams);
          }}
          style={{
            backgroundColor: "#2c2c2c",
            border: "2px solid #555",
            borderRadius: "8px",
            color: "white",
            fontSize: "1rem",
            maxWidth: "100%",
            padding: ".7rem .9rem"
          }}
        >
          {VERSION_GROUP_ORDER.map(
            versionGroup => (
              <option
                key={versionGroup}
                value={versionGroup}
              >
                {formatVersionGroupName(
                  versionGroup
                )}
              </option>
            )
          )}
        </select>
      </div>

      <p
        style={{
          color: "#9ca3af",
          fontSize: ".9rem",
          margin: "0 auto .75rem"
        }}
      >
        Select Pokemon to see learnset coverage.
      </p>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexWrap: "wrap",
          gap: ".6rem",
          justifyContent: "center",
          margin: "0 auto 1rem"
        }}
      >
        <label
          htmlFor="team-coverage-move-power-threshold"
          style={{
            color: "#f3f4f6",
            fontSize: ".9rem",
            fontWeight: "bold"
          }}
        >
          Move Power
        </label>
        <select
          id="team-coverage-move-power-threshold"
          value={selectedMovePowerThreshold}
          onChange={event =>
            setPreferredMovePowerThreshold(
              Number(event.target.value)
            )
          }
          style={{
            backgroundColor: "#2c2c2c",
            border: "2px solid #555",
            borderRadius: "8px",
            color: "white",
            fontSize: ".95rem",
            padding: ".55rem .75rem"
          }}
        >
          {MOVE_POWER_THRESHOLD_OPTIONS.map(
            option => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            )
          )}
        </select>
        <label
          htmlFor="team-coverage-move-level-threshold"
          style={{
            color: "#f3f4f6",
            fontSize: ".9rem",
            fontWeight: "bold"
          }}
        >
          Learned At
        </label>
        <select
          id="team-coverage-move-level-threshold"
          value={selectedMoveLevelThreshold}
          onChange={event =>
            setPreferredMoveLevelThreshold(
              Number(event.target.value)
            )
          }
          style={{
            backgroundColor: "#2c2c2c",
            border: "2px solid #555",
            borderRadius: "8px",
            color: "white",
            fontSize: ".95rem",
            padding: ".55rem .75rem"
          }}
        >
          {MOVE_LEVEL_THRESHOLD_OPTIONS.map(
            option => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            )
          )}
        </select>
        <label
          htmlFor="team-coverage-tm-learnsets"
          style={{
            color: "#f3f4f6",
            fontSize: ".9rem",
            fontWeight: "bold"
          }}
        >
          TM Learnsets
        </label>
        <select
          id="team-coverage-tm-learnsets"
          value={selectedPartyTmLearnsetMode}
          onChange={event =>
            setPreferredPartyTmLearnsetMode(
              event.target.value
            )
          }
          style={{
            backgroundColor: "#2c2c2c",
            border: "2px solid #555",
            borderRadius: "8px",
            color: "white",
            fontSize: ".95rem",
            padding: ".55rem .75rem"
          }}
        >
          {TM_LEARNSET_OPTIONS.map(
            option => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            )
          )}
        </select>
        <span
          style={{
            color: "#9ca3af",
            fontSize: ".8rem"
          }}
        >
          Applies to selected party coverage.
        </span>
        <button
          type="button"
          disabled={!hasSelectedParty}
          onClick={clearParty}
          style={{
            backgroundColor: "transparent",
            border: "1px solid #666",
            borderRadius: "6px",
            color: "#d1d5db",
            cursor: hasSelectedParty
              ? "pointer"
              : "default",
            fontSize: ".85rem",
            opacity: hasSelectedParty
              ? 1
              : 0.45,
            padding: ".45rem .7rem"
          }}
        >
          Clear Team
        </button>
      </div>

      <section
        className="team-coverage-party-grid"
        aria-label="Party Pokemon"
      >
        {normalizedParty.map((id, index) => (
          <PartyTile
            key={index}
            includeMachineMoves={
              includePartyTmLearnsets
            }
            maxMoveLevel={
              selectedMoveLevelThreshold
            }
            member={partyMembers[index]}
            minMovePower={
              selectedMovePowerThreshold
            }
            onChoose={() =>
              setActiveSlot(index)
            }
            onRemove={() =>
              updateSlot(index, null)
            }
          />
        ))}
      </section>

      <div
        className="team-coverage-panels"
      >
        <CoveragePanel
          tone="covered"
          title="Offensive Coverage"
          description={`Your team's ${
            includePartyTmLearnsets
              ? "level-up and TM"
              : "level-up"
          } learnset has moves that hit these types for super effective damage.`}
          types={coveredTypes}
        />
        <CoveragePanel
          tone="missing"
          title="Missing Offensive Coverage"
          description={`Your team's ${
            includePartyTmLearnsets
              ? "level-up and TM"
              : "level-up"
          } learnset cannot hit these types for super effective damage.`}
          types={missingTypes}
        />
        <CoveragePanel
          tone="covered"
          title="Defensive Coverage"
          description="Your team has at least one Pokemon that resists or is immune to attacks of these types."
        >
          <MatchupBadgeList
            emptyLabel="None"
            entries={
              defensiveCoverageEntries
            }
            height="1.45rem"
          />
        </CoveragePanel>
        <CoveragePanel
          tone="missing"
          title="Missing Defensive Coverage"
          description="Your team does not currently have a resistance or immunity to attacks of these types."
          types={missingDefensiveTypes}
        />
        <CoveragePanel
          tone="missing"
          title="Weaknesses"
          description="Your team has Pokemon weak to attacks of these types. Stacked totals add together across the team."
        >
          <MatchupBadgeList
            emptyLabel="None"
            entries={weaknessEntries}
            height="1.45rem"
          />
        </CoveragePanel>
      </div>

      <section
        style={{
          margin: "1.25rem auto 0",
          maxWidth: "940px"
        }}
      >
        <p
          style={{
            color: "#9ca3af",
            fontSize: ".85rem",
            lineHeight: 1.35,
            margin: "0 auto 1rem",
            maxWidth: "760px"
          }}
        >
          These Pokemon are technically available in the game. That does not
          necessarily mean they are available for a playthrough. It is meant to
          be overly broad, and also includes Pokemon that must be traded for.
        </p>

        <h2
          style={{
            marginBottom: ".4rem"
          }}
        >
          Suggested Teammates
        </h2>
        <p
          style={{
            color: "#9ca3af",
            fontSize: ".85rem",
            lineHeight: 1.35,
            margin: "0 auto 1rem",
            maxWidth: "720px"
          }}
        >
          Sort by PokeLore Suggested, Highest stat, Most coverage, or Dex Number.
        </p>

        <div
          className="team-coverage-filter-controls"
          style={{
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            gap: ".75rem",
            justifyContent: "center",
            margin: "0 0 1rem"
          }}
        >
          <div className="team-coverage-filter-control">
            <label
              htmlFor="team-coverage-sort"
              style={{
                color: "#f3f4f6",
                fontWeight: "bold"
              }}
            >
              Sort
            </label>
            <select
              id="team-coverage-sort"
              value={selectedSortMode}
              onChange={event => {
                setRecommendationPage(1);
                setPreferredSortMode(
                  event.target.value
                );
              }}
              style={{
                backgroundColor: "#2c2c2c",
                border: "2px solid #555",
                borderRadius: "8px",
                color: "white",
                fontSize: ".95rem",
                maxWidth: "100%",
                padding: ".55rem .75rem"
              }}
            >
              {SORT_MODES.map(option => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="team-coverage-filter-control">
            <label
              htmlFor="team-coverage-need"
              style={{
                color: "#f3f4f6",
                fontWeight: "bold"
              }}
            >
              Team Need
            </label>
            <select
              id="team-coverage-need"
              value={selectedCoverageFilter}
              onChange={event => {
                setRecommendationPage(1);
                setPreferredCoverageFilter(
                  event.target.value
                );
              }}
              style={{
                backgroundColor: "#2c2c2c",
                border: "2px solid #555",
                borderRadius: "8px",
                color: "white",
                fontSize: ".95rem",
                maxWidth: "100%",
                padding: ".55rem .75rem"
              }}
            >
              {COVERAGE_FILTER_OPTIONS.map(
                option => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="team-coverage-filter-control">
            <label
              htmlFor="team-coverage-recommendation-move-power-threshold"
              style={{
                color: "#f3f4f6",
                fontWeight: "bold"
              }}
            >
              Move Power
            </label>
            <select
              id="team-coverage-recommendation-move-power-threshold"
              value={
                selectedRecommendationMovePowerThreshold
              }
              onChange={event => {
                setRecommendationPage(1);
                setPreferredRecommendationMovePowerThreshold(
                  Number(event.target.value)
                );
              }}
              style={{
                backgroundColor: "#2c2c2c",
                border: "2px solid #555",
                borderRadius: "8px",
                color: "white",
                fontSize: ".95rem",
                maxWidth: "100%",
                padding: ".55rem .75rem"
              }}
            >
              {MOVE_POWER_THRESHOLD_OPTIONS.map(
                option => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="team-coverage-filter-control">
            <label
              htmlFor="team-coverage-recommendation-move-level-threshold"
              style={{
                color: "#f3f4f6",
                fontWeight: "bold"
              }}
            >
              Learned At
            </label>
            <select
              id="team-coverage-recommendation-move-level-threshold"
              value={
                selectedRecommendationMoveLevelThreshold
              }
              onChange={event => {
                setRecommendationPage(1);
                setPreferredRecommendationMoveLevelThreshold(
                  Number(event.target.value)
                );
              }}
              style={{
                backgroundColor: "#2c2c2c",
                border: "2px solid #555",
                borderRadius: "8px",
                color: "white",
                fontSize: ".95rem",
                maxWidth: "100%",
                padding: ".55rem .75rem"
              }}
            >
              {MOVE_LEVEL_THRESHOLD_OPTIONS.map(
                option => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="team-coverage-filter-control">
            <label
              htmlFor="team-coverage-recommendation-tm-learnsets"
              style={{
                color: "#f3f4f6",
                fontWeight: "bold"
              }}
            >
              TM Learnsets
            </label>
            <select
              id="team-coverage-recommendation-tm-learnsets"
              value={
                selectedRecommendationTmLearnsetMode
              }
              onChange={event => {
                setRecommendationPage(1);
                setPreferredRecommendationTmLearnsetMode(
                  event.target.value
                );
              }}
              style={{
                backgroundColor: "#2c2c2c",
                border: "2px solid #555",
                borderRadius: "8px",
                color: "white",
                fontSize: ".95rem",
                maxWidth: "100%",
                padding: ".55rem .75rem"
              }}
            >
              {TM_LEARNSET_OPTIONS.map(
                option => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="team-coverage-filter-control">
            <label
              htmlFor="team-coverage-legendaries"
              style={{
                color: "#f3f4f6",
                fontWeight: "bold"
              }}
            >
              Legendaries
            </label>
            <select
              id="team-coverage-legendaries"
              value={selectedLegendaryFilter}
              onChange={event => {
                setRecommendationPage(1);
                setPreferredLegendaryFilter(
                  event.target.value
                );
              }}
              style={{
                backgroundColor: "#2c2c2c",
                border: "2px solid #555",
                borderRadius: "8px",
                color: "white",
                fontSize: ".95rem",
                maxWidth: "100%",
                padding: ".55rem .75rem"
              }}
            >
              {LEGENDARY_FILTER_OPTIONS.map(
                option => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="team-coverage-filter-control">
            <label
              htmlFor="team-coverage-trade-evolutions"
              style={{
                color: "#f3f4f6",
                fontWeight: "bold"
              }}
            >
              Trade Evos
            </label>
            <select
              id="team-coverage-trade-evolutions"
              value={selectedTradeEvolutionFilter}
              onChange={event => {
                setRecommendationPage(1);
                setPreferredTradeEvolutionFilter(
                  event.target.value
                );
              }}
              style={{
                backgroundColor: "#2c2c2c",
                border: "2px solid #555",
                borderRadius: "8px",
                color: "white",
                fontSize: ".95rem",
                maxWidth: "100%",
                padding: ".55rem .75rem"
              }}
            >
              {TRADE_EVOLUTION_FILTER_OPTIONS.map(
                option => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>

          {selectedSortMode ===
            "selected-type-first" &&
            focusTypeOptions.length > 0 && (
              <div className="team-coverage-filter-control">
                <label
                  htmlFor="team-coverage-focus-type"
                  style={{
                    color: "#f3f4f6",
                    fontWeight: "bold"
                  }}
                >
                  Type
                </label>
                <select
                  id="team-coverage-focus-type"
                  value={selectedFocusType}
                  onChange={event => {
                    setRecommendationPage(1);
                    setPreferredFocusType(
                      event.target.value
                    );
                  }}
                  style={{
                    backgroundColor: "#2c2c2c",
                    border: "2px solid #555",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: ".95rem",
                    maxWidth: "100%",
                    padding: ".55rem .75rem"
                  }}
                >
                  {focusTypeOptions.map(type => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type.charAt(0).toUpperCase() +
                        type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}
        </div>

        {!selectedVersionCoverageLoaded ? (
          <p>Loading recommendations...</p>
        ) : !selectedVersionHasAvailability ? (
          <p
            style={{
              color: "#9ca3af"
            }}
          >
            Availability data is not ready for {formatVersionGroupName(
              selectedVersion
            )} yet.
          </p>
        ) : visibleRecommendations.length === 0 ? (
          <p
            style={{
              color: "#9ca3af"
            }}
          >
            No available Pokemon fill the selected coverage need.
          </p>
        ) : (
          <>
            <p
              style={{
                color: "#9ca3af",
                fontSize: ".8rem",
                margin: "0 0 .75rem"
              }}
            >
              Showing {recommendationStart + 1}-
              {recommendationStart +
                visibleRecommendations.length}{" "}
              of {recommendationCandidates.length} matches.
            </p>
            {recommendationFallbackMode && (
              <p
                style={{
                  color: "#cbd5e1",
                  fontSize: ".82rem",
                  lineHeight: 1.35,
                  margin: "0 auto .85rem",
                  maxWidth: "680px"
                }}
              >
                {recommendationFallbackMode ===
                "either"
                  ? "No available Pokemon matched both offensive and defensive needs, so showing the top 5 that match either need."
                  : "No available Pokemon matched the selected coverage need, so showing the top 5 highest-BST options."}
              </p>
            )}
            <div className="team-coverage-recommendation-grid">
              {visibleRecommendations.map(
                recommendation => (
                  <RecommendationCard
                    key={recommendation.id}
                    canAddToTeam={
                      hasOpenPartySlot
                    }
                    maxMoveLevel={
                      selectedRecommendationMoveLevelThreshold
                    }
                    includeMachineMoves={
                      includeRecommendationTmLearnsets
                    }
                    minMovePower={
                      selectedRecommendationMovePowerThreshold
                    }
                    onAddToTeam={() =>
                      addRecommendationToTeam(
                        recommendation
                      )
                    }
                    recommendation={
                      recommendation
                    }
                  />
                )
              )}
            </div>
            {recommendationPageCount > 1 && (
              <div
                style={{
                  alignItems: "center",
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "center",
                  marginTop: "1rem"
                }}
              >
                <button
                  type="button"
                  disabled={
                    currentRecommendationPage ===
                    1
                  }
                  onClick={() =>
                    setRecommendationPage(
                      page =>
                        Math.max(1, page - 1)
                    )
                  }
                  style={{
                    border: "1px solid #666",
                    borderRadius: "6px",
                    cursor:
                      currentRecommendationPage ===
                      1
                        ? "default"
                        : "pointer",
                    opacity:
                      currentRecommendationPage ===
                      1
                        ? 0.45
                        : 1,
                    padding: ".55rem .85rem"
                  }}
                >
                  Previous
                </button>
                <span>
                  Page {currentRecommendationPage} of{" "}
                  {recommendationPageCount}
                </span>
                <button
                  type="button"
                  disabled={
                    currentRecommendationPage ===
                    recommendationPageCount
                  }
                  onClick={() =>
                    setRecommendationPage(
                      page =>
                        Math.min(
                          recommendationPageCount,
                          page + 1
                        )
                    )
                  }
                  style={{
                    border: "1px solid #666",
                    borderRadius: "6px",
                    cursor:
                      currentRecommendationPage ===
                      recommendationPageCount
                        ? "default"
                        : "pointer",
                    opacity:
                      currentRecommendationPage ===
                      recommendationPageCount
                        ? 0.45
                        : 1,
                    padding: ".55rem .85rem"
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        <TeamCoverageExplainer />
      </section>

      {activeSlot !== null && (
        <PokemonPicker
          key={activeSlot}
          activeSlot={activeSlot}
          onClose={() =>
            setActiveSlot(null)
          }
          onSelect={handleSelectPokemon}
          options={pokemonOptions}
        />
      )}
    </main>
  );
}

export default TeamCoveragePage;
