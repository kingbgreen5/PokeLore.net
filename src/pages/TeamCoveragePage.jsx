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
import { teamCoverageSeo } from "../seo/seoConfig";
import { loadMovesMap } from "../utils/loadMovesData";
import { formatPokemonDisplayName } from "../utils/pokemonNames";
import {
  formatVersionGroupName,
  getCoveredDefenseTypes,
  getLevelUpAttackTypes,
  getMissingDefenseTypes,
  getTypesForVersionGroup
} from "../utils/teamCoverage";

const PARTY_SIZE = 6;
const DEFAULT_VERSION_GROUP =
  "scarlet-violet";
const PARTY_STORAGE_KEY =
  "pokelore:team-coverage-party";
const VERSION_STORAGE_KEY =
  "pokelore:learnset-version";
const SORT_STORAGE_KEY =
  "pokelore:team-coverage-sort";
const FOCUS_TYPE_STORAGE_KEY =
  "pokelore:team-coverage-focus-type";
const MOVE_POWER_THRESHOLD_STORAGE_KEY =
  "pokelore:team-coverage-move-power-threshold";
const RECOMMENDATION_MOVE_POWER_THRESHOLD_STORAGE_KEY =
  "pokelore:team-coverage-recommendation-move-power-threshold";
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
  if (!value) {
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
    return null;
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
    b.missingHits.length -
      a.missingHits.length ||
    b.coveredTypes.length -
      a.coveredTypes.length ||
    compareByNationalDex(a, b)
  );
}

function compareBySelectedTypeFirst(
  focusType
) {
  return (a, b) => {
    const aHitsFocus =
      a.missingHits.includes(focusType);
    const bHitsFocus =
      b.missingHits.includes(focusType);

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

function CoveragePanel({
  description,
  title,
  types
}) {
  return (
    <section
      style={{
        backgroundColor: "#202020",
        border: "1px solid #4a4a4a",
        borderRadius: "8px",
        boxSizing: "border-box",
        padding: "1rem"
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
      <TypeBadgeList
        emptyLabel="None"
        height="1.45rem"
        types={types}
      />
    </section>
  );
}

function PartyTile({
  index,
  member,
  minMovePower,
  onChoose,
  onRemove,
  selectedVersion
}) {
  const pokemon = member?.pokemon;
  const attackTypes =
    member?.attackTypes ?? [];
  const isLoading =
    member?.loading === true;

  if (!pokemon) {
    return (
      <button
        type="button"
        onClick={onChoose}
        className="team-coverage-party-tile"
        style={{
          alignItems: "center",
          backgroundColor: "#2c2c2c",
          border: "2px solid #555",
          borderRadius: "8px",
          boxSizing: "border-box",
          color: "white",
          cursor: "pointer",
          display: "grid",
          gap: ".65rem",
          justifyItems: "center",
          minHeight: "245px",
          padding: ".75rem",
          textAlign: "center"
        }}
      >
        <span
          style={{
            color: "#9ca3af",
            fontSize: ".8rem",
            justifySelf: "start"
          }}
        >
          Slot {index + 1}
        </span>
        <div
          aria-hidden="true"
          style={{
            alignItems: "center",
            border: "1px dashed #666",
            borderRadius: "8px",
            color: "#9ca3af",
            display: "flex",
            fontSize: "2rem",
            height: "96px",
            justifyContent: "center",
            width: "96px"
          }}
        >
          +
        </div>
        <strong
          style={{
            color: "#f3f4f6"
          }}
        >
          Add Pokemon
        </strong>
        <TypeBadgeList
          emptyLabel="No Pokemon selected"
          height="1.1rem"
          types={[]}
        />
      </button>
    );
  }

  return (
    <div
      className="team-coverage-party-tile"
      style={{
        alignItems: "center",
        backgroundColor: "#2c2c2c",
        border: "2px solid #555",
        borderRadius: "8px",
        boxSizing: "border-box",
        color: "white",
        display: "grid",
        gap: ".65rem",
        justifyItems: "center",
        padding: ".75rem",
        position: "relative",
        textAlign: "center"
      }}
    >
      <span
        style={{
          color: "#9ca3af",
          fontSize: ".8rem",
          justifySelf: "start"
        }}
      >
        Slot {index + 1}
      </span>

      <PokemonSummaryCard
        pokemon={pokemon}
        variant="compact"
      />

      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: ".4rem",
          justifyContent: "center"
        }}
      >
        <button
          type="button"
          onClick={onChoose}
          style={{
            backgroundColor: "transparent",
            border: "1px solid #666",
            borderRadius: "6px",
            color: "#d1d5db",
            cursor: "pointer",
            fontSize: ".75rem",
            padding: ".15rem .45rem"
          }}
        >
          Change
        </button>
        <button
          type="button"
          onClick={onRemove}
          style={{
            backgroundColor: "transparent",
            border: "1px solid #666",
            borderRadius: "6px",
            color: "#d1d5db",
            cursor: "pointer",
            fontSize: ".75rem",
            padding: ".15rem .45rem"
          }}
        >
          Clear
        </button>
      </div>

      <div
        style={{
          minHeight: "2.1rem"
        }}
      >
        <p
          style={{
            color: "#9ca3af",
            fontSize: ".75rem",
            margin: "0 0 .35rem"
          }}
        >
          Level-Up attack types
          {minMovePower > 0
            ? ` (${minMovePower}+ power)`
            : ""}
        </p>
        {isLoading ? (
          <span
            style={{
              color: "#9ca3af",
              fontSize: ".85rem"
            }}
          >
            Loading...
          </span>
        ) : (
          <TypeBadgeList
            emptyLabel={`No level-up attacks${
              minMovePower > 0
                ? ` at ${minMovePower}+ power`
                : ""
            } in ${formatVersionGroupName(
              selectedVersion
            )}`}
            height="1.1rem"
            types={attackTypes}
          />
        )}
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
            recommendation.missingHits
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
    preferredRecommendationMovePowerThreshold,
    setPreferredRecommendationMovePowerThreshold
  ] = useLocalStorageState(
    RECOMMENDATION_MOVE_POWER_THRESHOLD_STORAGE_KEY,
    MOVE_POWER_THRESHOLD_OPTIONS[0].value
  );
  const selectedRecommendationMovePowerThreshold =
    getValidMovePowerThreshold(
      preferredRecommendationMovePowerThreshold
    );
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
    if (
      urlParty &&
      !partiesEqual(urlParty, storageParty)
    ) {
      setParty(urlParty);
    }
  }, [
    setParty,
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
                learnset:
                  record.learnset,
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

        return {
          ...record,
          attackTypes,
          coveredTypes
        };
      }),
    [
      movesByName,
      normalizedParty,
      pokemonRecordsById,
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
  const selectedFocusType =
    missingTypes.includes(
      preferredFocusType
    )
      ? preferredFocusType
      : missingTypes[0] ??
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
            !selectedIds.has(pokemon.id)
        )
        .map(pokemon => {
          const attackTypes =
            getThresholdedAttackTypes({
              consideredTypes,
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

          return {
            ...pokemon,
            attackTypes,
            coveredTypes,
            missingHits:
              coveredTypes.filter(type =>
                missingTypes.includes(
                  type
                )
              )
          };
        })
        .filter(
          pokemon =>
            pokemon.missingHits.length > 0
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
      missingTypes,
      normalizedParty,
      selectedFocusType,
      selectedRecommendationMovePowerThreshold,
      selectedSortMode,
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

  function updateSlot(slotIndex, value) {
    setRecommendationPage(1);
    const next =
      normalizeParty(normalizedParty);
    next[slotIndex] = value;
    setParty(next);

    const nextParams =
      new URLSearchParams(searchParams);
    const serializedParty =
      serializePartyParam(next);

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

    setSearchParams(nextParams);
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
        Select Pokemon to see level up learnset coverage.
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
        <span
          style={{
            color: "#9ca3af",
            fontSize: ".8rem"
          }}
        >
          Applies to selected party level-up moves.
        </span>
      </div>

      <section
        className="team-coverage-party-grid"
        aria-label="Party Pokemon"
      >
        {normalizedParty.map((id, index) => (
          <PartyTile
            key={index}
            index={index}
            member={partyMembers[index]}
            minMovePower={
              selectedMovePowerThreshold
            }
            selectedVersion={
              selectedVersion
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
          title="Overall Type Coverage"
          description="Your team's level-up learnset has moves that hit these types for super effective damage."
          types={coveredTypes}
        />
        <CoveragePanel
          title="Missing Coverage"
          description="Your team's level-up learnset cannot hit these types for super effective damage."
          types={missingTypes}
        />
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
          These available Pokemon have level-up attacking moves that cover at
          least one currently missing type.
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

          {selectedSortMode ===
            "selected-type-first" &&
            missingTypes.length > 0 && (
              <>
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
                  {missingTypes.map(type => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type.charAt(0).toUpperCase() +
                        type.slice(1)}
                    </option>
                  ))}
                </select>
              </>
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
            No available Pokemon fill the current missing coverage.
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
                      selectedRecommendationMovePowerThreshold
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
