import {
  useEffect,
  useMemo,
  useState
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import PokemonSummaryCard from "../components/PokemonSummaryCard";
import TypeBadge from "../components/TypeBadge";
import typeChart from "../constants/Types";
import { VERSION_GROUP_ORDER } from "../constants/versionOrder";
import useLocalStorageState from "../hooks/useLocalStorageState";
import Seo from "../seo/Seo";
import { singleTypeCoverageSeo } from "../seo/seoConfig";
import {
  formatVersionGroupName,
  getCoveredDefenseTypes,
  getTypesForVersionGroup
} from "../utils/teamCoverage";

const DEFAULT_VERSION_GROUP =
  "scarlet-violet";
const DEFAULT_TYPE = "water";
const VERSION_STORAGE_KEY =
  "pokelore:learnset-version";
const TYPE_STORAGE_KEY =
  "pokelore:single-type-coverage-type";
const SORT_STORAGE_KEY =
  "pokelore:single-type-coverage-sort";
const MOVE_POWER_THRESHOLD_STORAGE_KEY =
  "pokelore:single-type-coverage-move-power-threshold";
const RECOMMENDATIONS_PER_PAGE = 25;
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

function normalizeTypeParam(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getValidVersionGroup(value) {
  return VERSION_GROUP_ORDER.includes(value)
    ? value
    : null;
}

function getValidType(value, types) {
  return types.includes(value)
    ? value
    : null;
}

function getValidSortMode(value) {
  return SORT_MODES.some(
    option => option.value === value
  )
    ? value
    : SORT_MODES[0].value;
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

function compareByNationalDex(a, b) {
  return a.id - b.id;
}

function compareByMostCoverage(a, b) {
  return (
    b.coveredTypes.length -
      a.coveredTypes.length ||
    b.attackTypes.length -
      a.attackTypes.length ||
    compareByNationalDex(a, b)
  );
}

function compareBySelectedTypeFirst(a, b) {
  const aHasStab =
    a.selectedTypeAttackTypes.some(type =>
      a.types.includes(type)
    );
  const bHasStab =
    b.selectedTypeAttackTypes.some(type =>
      b.types.includes(type)
    );

  return (
    Number(bHasStab) -
      Number(aHasStab) ||
    b.selectedTypeAttackTypes.length -
      a.selectedTypeAttackTypes.length ||
    compareByMostCoverage(a, b)
  );
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

function getThresholdedAttackTypes({
  consideredTypes,
  minMovePower,
  pokemon
}) {
  if (minMovePower <= 0) {
    return consideredTypes.filter(type =>
      pokemon.attackTypes?.includes(type)
    );
  }

  const attackTypePowers =
    pokemon.attackTypePowers ?? {};

  return consideredTypes.filter(
    type =>
      Number(
        attackTypePowers[type]
      ) >= minMovePower
  );
}

async function readJsonUrl(url) {
  const response = await fetch(url);

  if (!response.ok) {
    return null;
  }

  return response.json();
}

function TypeBadgeList({
  emptyLabel,
  height = "1.35rem",
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
        justifyContent: "center"
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

function RecommendationCard({
  minMovePower,
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
      <div>
        <p
          style={{
            color: "#f3f4f6",
            fontSize: ".8rem",
            fontWeight: "bold",
            margin: "0 0 .35rem"
          }}
        >
          Helps Cover
        </p>
        <TypeBadgeList
          emptyLabel="None"
          height="1.05rem"
          types={
            recommendation.coverageHits
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
          Level-up attack types
          {minMovePower > 0
            ? ` (${minMovePower}+ power)`
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

function SingleTypeCoveragePage() {
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
  const urlType =
    normalizeTypeParam(
      searchParams.get("type")
    );
  const selectedVersion =
    getValidVersionGroup(urlVersion) ??
    getValidVersionGroup(
      preferredVersion
    ) ??
    DEFAULT_VERSION_GROUP;
  const consideredTypes = useMemo(
    () =>
      getTypesForVersionGroup(
        selectedVersion
      ),
    [selectedVersion]
  );
  const [
    preferredType,
    setPreferredType
  ] = useLocalStorageState(
    TYPE_STORAGE_KEY,
    DEFAULT_TYPE
  );
  const selectedType =
    getValidType(
      urlType,
      consideredTypes
    ) ??
    getValidType(
      preferredType,
      consideredTypes
    ) ??
    consideredTypes[0];
  const [
    teamCoverageData,
    setTeamCoverageData
  ] = useState(null);
  const [
    recommendationPage,
    setRecommendationPage
  ] = useState(1);
  const [
    preferredSortMode,
    setPreferredSortMode
  ] = useLocalStorageState(
    SORT_STORAGE_KEY,
    SORT_MODES[0].value
  );
  const selectedSortMode =
    getValidSortMode(preferredSortMode);
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
    if (selectedType !== preferredType) {
      setPreferredType(selectedType);
    }
  }, [
    preferredType,
    selectedType,
    setPreferredType
  ]);

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

  useEffect(() => {
    setRecommendationPage(1);
  }, [
    selectedType,
    selectedVersion
  ]);

  useEffect(() => {
    const urlHasSelectedVersion =
      searchParams.get("version") ===
      selectedVersion;
    const urlHasSelectedType =
      normalizeTypeParam(
        searchParams.get("type")
      ) === selectedType;
    const urlHasLegacyGameParam =
      searchParams.has("game");

    if (
      urlHasSelectedVersion &&
      urlHasSelectedType &&
      !urlHasLegacyGameParam
    ) {
      return;
    }

    const nextParams =
      new URLSearchParams(searchParams);

    nextParams.set(
      "version",
      selectedVersion
    );
    nextParams.set("type", selectedType);
    nextParams.delete("game");
    setSearchParams(nextParams, {
      replace: true
    });
  }, [
    searchParams,
    selectedType,
    selectedVersion,
    setSearchParams
  ]);

  const selectedVersionCoverageLoaded =
    teamCoverageData?.versionGroup ===
    selectedVersion;
  const selectedVersionHasAvailability =
    (teamCoverageData?.availablePokemonCount ??
      0) > 0;
  const recommendationCandidates =
    useMemo(() => {
      if (!selectedVersionCoverageLoaded) {
        return [];
      }

      return (
        teamCoverageData?.pokemon ?? []
      )
        .map(pokemon => {
          const attackTypes =
            getThresholdedAttackTypes({
              consideredTypes,
              minMovePower:
                selectedMovePowerThreshold,
              pokemon
            });
          const coveredTypes =
            getCoveredDefenseTypes({
              attackTypes,
              consideredTypes,
              typeChart
            });
          const selectedTypeAttackTypes =
            attackTypes.filter(
              attackType =>
                typeChart?.[attackType]?.[
                  selectedType
                ] === 2
            );

          return {
            ...pokemon,
            attackTypes,
            coveredTypes,
            coverageHits: [selectedType],
            selectedTypeAttackTypes
          };
        })
        .filter(pokemon =>
          pokemon.coveredTypes.includes(
            selectedType
          )
        )
        .sort((a, b) => {
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
              a,
              b
            );
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
      selectedMovePowerThreshold,
      selectedType,
      selectedSortMode,
      selectedVersionCoverageLoaded,
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

  function updateShareableParams({
    type = selectedType,
    version = selectedVersion
  }) {
    const nextParams =
      new URLSearchParams(searchParams);

    nextParams.set("version", version);
    nextParams.set("type", type);
    nextParams.delete("game");
    setSearchParams(nextParams);
  }

  return (
    <main
      style={{
        boxSizing: "border-box",
        padding: "1rem"
      }}
    >
      <Seo {...singleTypeCoverageSeo()} />

      <h1>Single Type Coverage</h1>

      <p
        style={{
          color: "#d1d5db",
          fontSize: "1rem",
          lineHeight: 1.45,
          margin: "0 auto 1.25rem",
          maxWidth: "760px"
        }}
      >
        Choose a game and a defensive type to find available Pokemon with
        level-up attacking moves that can hit that type for super-effective
        damage.
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
        Need to figure out your team's coverage?{" "}
        <Link to="/team-coverage">Try our Team Coverage Calculator.</Link>
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
          htmlFor="single-type-coverage-version"
          style={{
            color: "#f3f4f6",
            fontWeight: "bold"
          }}
        >
          Game
        </label>
        <select
          id="single-type-coverage-version"
          value={selectedVersion}
          onChange={event => {
            updateShareableParams({
              version:
                event.target.value
            });
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

        <label
          htmlFor="single-type-coverage-type"
          style={{
            color: "#f3f4f6",
            fontWeight: "bold"
          }}
        >
          Type
        </label>
        <select
          id="single-type-coverage-type"
          value={selectedType}
          onChange={event => {
            updateShareableParams({
              type: event.target.value
            });
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
          {consideredTypes.map(type => (
            <option
              key={type}
              value={type}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
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
          Suggested Pokemon
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
          These available Pokemon have level-up attacking moves that can hit{" "}
          <strong
            style={{
              color: "#f3f4f6"
            }}
          >
            {selectedType}
          </strong>{" "}
          for super-effective damage.
        </p>
        <p
          style={{
            color: "#9ca3af",
            fontSize: ".85rem",
            lineHeight: 1.35,
            margin: "0 auto 1rem",
            maxWidth: "720px"
          }}
        >
          Sort by Highest stat, Most coverage, or Dex Number.
        </p>

        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            gap: ".75rem",
            justifyContent: "center",
            margin: "0 0 1rem"
          }}
        >
          <label
            htmlFor="single-type-coverage-sort"
            style={{
              color: "#f3f4f6",
              fontWeight: "bold"
            }}
          >
            Sort
          </label>
          <select
            id="single-type-coverage-sort"
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

          <label
            htmlFor="single-type-coverage-move-power-threshold"
            style={{
              color: "#f3f4f6",
              fontWeight: "bold"
            }}
          >
            Move Power
          </label>
          <select
            id="single-type-coverage-move-power-threshold"
            value={selectedMovePowerThreshold}
            onChange={event => {
              setRecommendationPage(1);
              setPreferredMovePowerThreshold(
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
            No available Pokemon have level-up coverage for this type.
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
                    minMovePower={
                      selectedMovePowerThreshold
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
      </section>
    </main>
  );
}

export default SingleTypeCoveragePage;
