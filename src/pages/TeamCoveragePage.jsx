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
const RECOMMENDATIONS_PER_PAGE = 25;
const SHOW_RECOMMENDATION_SCORE_DEBUG = true;
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

function formatScore(value) {
  const score = Number(value) || 0;

  return score > 0
    ? `+${score.toFixed(2)}`
    : score.toFixed(2);
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
  includeMachineMoves,
  maxMoveLevel,
  minMovePower,
  recommendation,
  showScore
}) {
  const [
    isScoringVisible,
    setIsScoringVisible
  ] = useState(false);

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
      {showScore && (
        <>
          <button
            type="button"
            onClick={() =>
              setIsScoringVisible(
                value => !value
              )
            }
            style={{
              backgroundColor: "transparent",
              border: "1px solid #555",
              borderRadius: "999px",
              color: "#cbd5e1",
              cursor: "pointer",
              fontSize: ".68rem",
              lineHeight: 1,
              padding: ".3rem .5rem"
            }}
          >
            {isScoringVisible
              ? "Hide Scoring"
              : "Show Scoring"}
          </button>
          {isScoringVisible && (
            <div>
          <p
            style={{
              color: "#f3f4f6",
              fontSize: ".8rem",
              fontWeight: "bold",
              margin: "0 0 .35rem"
            }}
          >
            Score{" "}
            {formatScore(
              recommendation.playthroughScore?.total
            )}
          </p>
          <p
            style={{
              color: "#9ca3af",
              fontSize: ".72rem",
              lineHeight: 1.3,
              margin: 0
            }}
          >
            Cov{" "}
            {formatScore(
              recommendation.playthroughScore?.parts
                ?.coverage
            )}{" "}
            · Dex{" "}
            {formatScore(
              recommendation.playthroughScore?.parts
                ?.regionalDex
            )}{" "}
            / Not Dex{" "}
            {formatScore(
              recommendation.playthroughScore?.parts
                ?.notRegionalDex
            )}{" "}
            · Trade{" "}
            {formatScore(
              recommendation.playthroughScore?.parts
                ?.tradeEvolution
            )}{" "}
            · Tier{" "}
            {formatScore(
              recommendation.playthroughScore?.parts
                ?.tier
            )}{" "}
            · BST{" "}
            {formatScore(
              recommendation.playthroughScore?.parts
                ?.bst
            )}
          </p>
          <p
            style={{
              color: "#9ca3af",
              fontSize: ".72rem",
              lineHeight: 1.3,
              margin: ".25rem 0 0"
            }}
          >
            Normal{" "}
            {formatScore(
              recommendation.playthroughScore?.parts
                ?.normalTypeQualifier
            )}{" "}
            · STAB Ice{" "}
            {formatScore(
              recommendation.playthroughScore?.parts
                ?.stabIceTypeBonus
            )}
          </p>
            </div>
          )}
        </>
      )}
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

  const recommendationCandidates =
    useMemo(() => {
      if (
        teamCoverageData?.versionGroup !==
        selectedVersion
      ) {
        return [];
      }

      const selectedIds = new Set(
        normalizedParty.filter(Boolean)
      );

      return (
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
        })
        .filter(
          pokemon =>
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
        )
        .sort((a, b) => {
          if (
            selectedSortMode ===
            "custom-score"
          ) {
            return compareByCustomScore(a, b);
          }

          if (
            selectedSortMode ===
            "most-coverage"
          ) {
            return compareByMostCoverage(
              a,
              b
            );
          }

          if (
            selectedSortMode ===
            "selected-type-first"
          ) {
            return compareBySelectedTypeFirst(
              selectedFocusType
            )(a, b);
          }

          if (
            getStatSortMode(
              selectedSortMode
            )
          ) {
            return compareByStat(
              selectedSortMode
            )(a, b);
          }

          return compareByNationalDex(a, b);
        });
    }, [
      consideredTypes,
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
  const recommendationPageCount =
    Math.max(
      1,
      Math.ceil(
        recommendationCandidates.length /
          RECOMMENDATIONS_PER_PAGE
      )
    );
  const currentRecommendationPage =
    Math.min(
      recommendationPage,
      recommendationPageCount
    );
  const recommendationStart =
    (currentRecommendationPage - 1) *
    RECOMMENDATIONS_PER_PAGE;
  const visibleRecommendations =
    recommendationCandidates.slice(
      recommendationStart,
      recommendationStart +
        RECOMMENDATIONS_PER_PAGE
    );
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

      <h1>Team Coverage Calculator</h1>

      <p
        style={{
          color: "#d1d5db",
          fontSize: "1rem",
          lineHeight: 1.45,
          margin: "0 auto 1.25rem",
          maxWidth: "760px"
        }}
      >
        Use the Team Coverage Calculator to build a Pokémon party, choose a
        game, and see which opposing types your team can hit for
        super-effective damage with their Level-Up learnset.
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
            <div className="team-coverage-recommendation-grid">
              {visibleRecommendations.map(
                recommendation => (
                  <RecommendationCard
                    key={recommendation.id}
                    maxMoveLevel={
                      selectedRecommendationMoveLevelThreshold
                    }
                    includeMachineMoves={
                      includeRecommendationTmLearnsets
                    }
                    minMovePower={
                      selectedRecommendationMovePowerThreshold
                    }
                    recommendation={
                      recommendation
                    }
                    showScore={
                      SHOW_RECOMMENDATION_SCORE_DEBUG &&
                      selectedSortMode ===
                      "custom-score"
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
