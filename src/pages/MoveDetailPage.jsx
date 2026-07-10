import TypeBadge from "../components/TypeBadge";
import {
  Link,
  useParams
} from "react-router-dom";

import {
  useEffect,
  useMemo,
  useState
} from "react";

import CollapsibleSection from "../components/CollapsibleSection";
import MoveMachineItems from "../components/MoveMachineItems";
import OaksNotes from "../components/OaksNotes";
import PokemonGoNotes from "../components/PokemonGoNotes";
import PokemonSummaryCard from "../components/PokemonSummaryCard";
import useSessionState from "../hooks/useSessionState";
import Seo from "../seo/Seo";
import { moveSeo } from "../seo/seoConfig";
import { loadMoveDetail } from "../utils/loadMovesData";

function capitalize(text) {
  return String(text ?? "")
    .split("-")
    .filter(Boolean)
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function formatValue(value) {
  return value === null ||
    value === undefined ||
    value === ""
    ? "-"
    : value;
}

function formatPercent(value) {
  return value === null ||
    value === undefined
    ? "-"
    : `${value}%`;
}

function formatCritChance(critRate) {
  if (
    critRate === null ||
    critRate === undefined
  ) {
    return "-";
  }

  if (critRate <= 0) {
    return "1/24";
  }

  if (critRate === 1) {
    return "1/8";
  }

  if (critRate === 2) {
    return "1/2";
  }

  return "Guaranteed";
}

const MOVE_FLAG_LABELS = {
  contact: "Makes contact",
  charge: "Charges",
  recharge: "Recharge",
  protect: "Protect affected",
  reflectable: "Reflectable",
  snatch: "Snatchable",
  mirror: "Mirror Move",
  punch: "Punch",
  sound: "Sound",
  gravity: "Gravity blocked",
  defrost: "Thaws user",
  distance: "Distant target",
  heal: "Healing",
  authentic: "Bypasses substitute",
  powder: "Powder",
  bite: "Bite",
  pulse: "Pulse",
  ballistics: "Ballistic",
  mental: "Mental",
  "non-sky-battle": "No Sky Battle",
  dance: "Dance"
};

function formatMoveFlag(flag) {
  return (
    MOVE_FLAG_LABELS[flag] ??
    capitalize(flag)
  );
}

function normalizeMoveFlag(flag) {
  if (typeof flag === "string") {
    return {
      name: flag,
      displayName: formatMoveFlag(flag),
      description: null
    };
  }

  const name =
    flag?.name ?? "";

  return {
    name,
    displayName:
      flag?.displayName ??
      formatMoveFlag(name),
    description:
      flag?.description ?? null
  };
}

function buildDisplayMoveFlags(moveData) {
  if (!Array.isArray(moveData.flags)) {
    return [];
  }

  const normalizedFlags =
    moveData.flags
      .map(normalizeMoveFlag)
      .filter(flag => flag.name);
  const makesContact =
    normalizedFlags.some(
      flag => flag.name === "contact"
    );
  const contactFlag =
    makesContact
      ? normalizedFlags.find(
          flag => flag.name === "contact"
        )
      : {
          name: "no-contact",
          displayName:
            "Does not make contact",
          description:
            "This move does not make direct contact with the target."
        };

  return [
    contactFlag,
    ...normalizedFlags.filter(
      flag => flag.name !== "contact"
    )
  ];
}

async function readJsonUrl(url) {
  const response = await fetch(url);

  if (!response.ok) {
    return null;
  }

  const text = await response.text();
  const trimmed = text.trim();

  if (
    !trimmed.startsWith("{") &&
    !trimmed.startsWith("[")
  ) {
    return null;
  }

  return JSON.parse(text);
}

function CategoryBadge({
  category
}) {
  return (
    <span
      data-section="move-category-badge"
      style={{
        border: "2px solid #555",
        borderRadius: "999px",
        color: "#d9e8ff",
        fontSize: "1.05rem",
        fontWeight: "800",
        letterSpacing: 0,
        padding: ".45rem 1.15rem",
        textTransform: "uppercase"
      }}
    >
      {category}
    </span>
  );
}

function CritBadge({
  critRate
}) {
  if (!critRate || critRate <= 0) {
    return null;
  }

  return (
    <span
      aria-label={`Critical hit chance ${formatCritChance(critRate)}`}
      data-section="move-crit-badge"
      title={`Critical hit chance ${formatCritChance(critRate)}`}
      style={{
        alignItems: "center",
        backgroundColor: "#ff6f19",
        border: "2px solid #dd4d00",
        borderRadius: "14px",
        color: "#ffd72e",
        display: "inline-flex",
        fontSize: "1.45rem",
        fontWeight: "900",
        height: "40px",
        justifyContent: "center",
        lineHeight: 1,
        width: "40px"
      }}
    >
      ✸
    </span>
  );
}

function HeroStatStack({
  moveData
}) {
  const moveFlags =
    buildDisplayMoveFlags(moveData);
  const rows = [
    {
      label: "POWER",
      value: formatValue(moveData.power),
      emphasis: true
    },
    {
      label: "ACC",
      value: formatValue(moveData.accuracy),
      emphasis: true
    },
    {
      label: "Priority",
      value: formatValue(moveData.priority)
    },
    {
      label: "PP",
      value: formatValue(moveData.pp)
    },
    {
      label: "CRIT",
      value: formatCritChance(
        moveData.meta?.critRate
      )
    },
    {
      label: "EFFECT CHANCE",
      value: formatPercent(
        moveData.effectChance
      )
    }
  ];

  return (
    <div
      data-section="move-hero-stat-stack"
      style={{
        display: "grid",
        gap: ".1rem",
        margin: "4.5rem auto 2.5rem",
        maxWidth: "470px"
      }}
    >
      {rows.map(row => (
        <div
          key={row.label}
          style={{
            alignItems: "baseline",
            color: row.emphasis
              ? "white"
              : "#a7a7ad",
            display: "grid",
            fontSize: row.emphasis
              ? "clamp(2rem, 2vw, 3.25rem)"
              : "clamp(1.45rem, 4vw, 2.45rem)",
            fontWeight: "900",
            gap: "1.2rem",
            gridTemplateColumns:
              "minmax(0, 1fr) auto",
            letterSpacing: 0,
            lineHeight: 1.05,
            textTransform:
              row.label === "Priority"
                ? "none"
                : "uppercase"
          }}
        >
          <span
            style={{
              textAlign: "right"
            }}
          >
            {row.label}:
          </span>

          <span
            style={{
              minWidth: "120px",
              textAlign: "left"
            }}
          >
            {row.value}
          </span>
        </div>
      ))}

      {moveFlags.length > 0 && (
        <div
          data-section="move-flags"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: ".35rem",
            gridColumn: "1 / -1",
            justifyContent: "flex-end",
            marginTop: ".25rem"
          }}
        >
          {moveFlags.map(flag => (
            <span
              key={flag.name}
              aria-label={
                flag.description
                  ? `${flag.displayName}: ${flag.description}`
                  : flag.displayName
              }
              title={
                flag.description ??
                flag.displayName
              }
              style={{
                border: "1px solid #4d4d55",
                borderRadius: "999px",
                color: "#8f96a3",
                cursor: flag.description
                  ? "help"
                  : "default",
                fontSize: ".72rem",
                fontWeight: "700",
                letterSpacing: 0,
                lineHeight: 1,
                padding: ".22rem .5rem",
                textTransform: "uppercase"
              }}
            >
              {flag.displayName}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function EffectPanel({
  moveData
}) {
  const hasEffect =
    moveData.shortEffect ||
    moveData.description ||
    moveData.effect;

  return (
    <section
      data-section="move-effect-panel"
      style={{
        border: "2px solid #4d4d55",
        borderRadius: "14px",
        margin: "0 auto 2rem",
        maxWidth: "900px",
        padding: "1.4rem",
        position: "relative",
        textAlign: "center"
      }}
    >
      <h2
        style={{
          fontSize: "1.5rem",
          margin: "0 0 1rem"
        }}
      >
        Effect
      </h2>

      {hasEffect ? (
        <>
          {(moveData.shortEffect ||
            moveData.description) && (
            <p
              style={{
                color: "#aeb6c7",
                fontSize: "1.05rem",
                lineHeight: 1.55,
                margin: ".35rem 0"
              }}
            >
              {moveData.shortEffect ??
                moveData.description}
            </p>
          )}

          {moveData.effect &&
            moveData.effect !==
              moveData.shortEffect && (
              <p
                style={{
                  color: "#aeb6c7",
                  fontSize: "1.05rem",
                  lineHeight: 1.55,
                  margin: ".35rem 0"
                }}
              >
                {moveData.effect}
              </p>
            )}
        </>
      ) : (
        <p
          style={{
            color: "#aeb6c7",
            lineHeight: 1.55,
            margin: 0
          }}
        >
          No detailed effect text available.
        </p>
      )}
    </section>
  );
}

function DetailPillRow({
  moveData
}) {
  const details = [
    [
      "Target",
      capitalize(moveData.target)
    ],
    [
      "Introduced",
      capitalize(moveData.generation)
    ],
    // [
    //   "Ailment",
    //   capitalize(moveData.meta?.ailment)
    // ],
    // [
    //   "Meta",
    //   capitalize(moveData.meta?.category)
    // ],
    // [
    //   "Drain",
    //   moveData.meta?.drain
    // ],
    // [
    //   "Healing",
    //   moveData.meta?.healing
    // ],
    // [
    //   "Flinch",
    //   formatPercent(
    //     moveData.meta?.flinchChance
    //   )
    // ],
    // [
    //   "Stat Chance",
    //   formatPercent(
    //     moveData.meta?.statChance
    //   )
    // ]
  ].filter(
    ([, value]) =>
      value !== null &&
      value !== undefined &&
      value !== "-"
  );

  if (!details.length) {
    return null;
  }

  return (
    <div
      data-section="move-detail-pill-row"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: ".55rem",
        justifyContent: "center",
        margin: "0 auto 2rem",
        maxWidth: "900px"
      }}
    >
      {details.map(([label, value]) => (
        <span
          key={label}
          style={{
            border: "1px solid #4d4d55",
            borderRadius: "999px",
            color: "#b8b8c0",
            fontSize: ".82rem",
            padding: ".28rem .65rem"
          }}
        >
          <strong>{label}:</strong>{" "}
          {value}
        </span>
      ))}
    </div>
  );
}

function StatChangesSection({
  statChanges
}) {
  if (!statChanges?.length) {
    return null;
  }

  return (
    <section
      data-section="move-stat-changes-list"
      style={{
        margin: "0 auto 1rem",
        maxWidth: "880px"
      }}
    >
      {statChanges.map(change => (
        <div
          key={`${change.stat}-${change.change}`}
          style={{
            backgroundColor: "#202026",
            border: "1px solid #4d4d55",
            borderRadius: "12px",
            marginBottom: ".6rem",
            padding: ".75rem",
            textAlign: "center"
          }}
        >
          {capitalize(change.stat)}:{" "}
          <strong>
            {change.change > 0
              ? `+${change.change}`
              : change.change}
          </strong>
        </div>
      ))}
    </section>
  );
}

function compactSectionStyle() {
  return {
    margin: "0 auto 1.45rem",
    maxWidth: "880px"
  };
}

function PastValuesSection({
  moveName,
  pastValues
}) {
  const [expanded, setExpanded] =
    useSessionState(
      `move:${moveName}:past-values-expanded`,
      false
    );

  if (!pastValues?.length) {
    return null;
  }

  return (
    <CollapsibleSection
      title="Version History"
      summary={`${pastValues.length} changes`}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      style={compactSectionStyle()}
      contentStyle={{
        display: "grid",
        gap: ".75rem",
        marginTop: "1rem"
      }}
    >
      {/* ------------------------ MOVE VERSION HISTORY ------------------------ */}
      <div data-section="move-version-history">
        {pastValues.map((value, index) => (
          <div
            key={`${value.versionGroup}-${index}`}
            style={{
              backgroundColor: "#202026",
              border: "1px solid #555",
              borderRadius: "12px",
              marginBottom: ".75rem",
              padding: ".9rem"
            }}
          >
       
              {capitalize(
                value.versionGroup
              )}
      

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: ".75rem",
                marginTop: ".6rem"
              }}
            >
              <span>
                Power:{" "}
                {formatValue(value.power)}
              </span>
              <span>
                Accuracy:{" "}
                {formatValue(
                  value.accuracy
                )}
              </span>
              <span>
                PP: {formatValue(value.pp)}
              </span>
              {value.type && (
                <span>
                  Type: {capitalize(value.type)}
                </span>
              )}
            </div>

            {value.effectEntries?.map(
              entry => (
                <p
                  key={entry.shortEffect}
                  style={{
                    lineHeight: 1.55,
                    marginBottom: 0
                  }}
                >
                  {entry.shortEffect ||
                    entry.effect}
                </p>
              )
            )}
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

function FlavorTextSection({
  moveName,
  flavorTextEntries
}) {
  const [expanded, setExpanded] =
    useSessionState(
      `move:${moveName}:flavor-text-expanded`,
      false
    );

  if (!flavorTextEntries?.length) {
    return null;
  }

  return (
    <CollapsibleSection
      title="In-Game Descriptions"
      summary={`${flavorTextEntries.length} entries`}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      style={compactSectionStyle()}
      contentStyle={{
        display: "grid",
        gap: ".75rem",
        marginTop: "1rem"
      }}
    >
      {/* ------------------------ MOVE FLAVOR TEXT ENTRIES ------------------------ */}
      <div data-section="move-flavor-text-list">
        {flavorTextEntries.map(entry => (
          <div
            key={`${entry.versionGroup}-${entry.text}`}
            style={{
              backgroundColor: "#202026",
              border: "1px solid #555",
              borderRadius: "12px",
              marginBottom: ".75rem",
              padding: ".9rem"
            }}
          >
            <strong>
              {capitalize(
                entry.versionGroup
              )}
            </strong>

            <p
              style={{
                lineHeight: 1.55,
                marginBottom: 0
              }}
            >
              {entry.text}
            </p>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

const learnerMethodOrder = [
  "level-up",
  "machine",
  "egg",
  "tutor",
  "other"
];

function getLearnerMethodLabel(method) {
  if (method === "level-up") {
    return "Level Up";
  }

  if (method === "machine") {
    return "TMs, HMs, and TRs";
  }

  if (method === "egg") {
    return "Via Breeding";
  }

  if (method === "tutor") {
    return "Move Tutor";
  }

  return "Other Methods";
}

function getLearnerMethodRank(method) {
  const index =
    learnerMethodOrder.indexOf(method);

  return index === -1
    ? learnerMethodOrder.length
    : index;
}

function normalizeLearnerGroups(
  pokemonThatLearnMove,
  methodGroups
) {
  if (methodGroups?.length) {
    return methodGroups
      .filter(group => group.pokemon?.length)
      .map(group => ({
        method: group.method,
        label:
          group.label ??
          getLearnerMethodLabel(
            group.method
          ),
        pokemon: group.pokemon
      }))
      .sort(
        (a, b) =>
          getLearnerMethodRank(a.method) -
            getLearnerMethodRank(b.method) ||
          a.label.localeCompare(b.label)
      );
  }

  const groupsByMethod = new Map();

  pokemonThatLearnMove.forEach(pokemon => {
    const methods =
      pokemon.methods?.length
        ? pokemon.methods
        : [
            {
              method:
                pokemon.method ?? "other"
            }
          ];

    methods.forEach(methodEntry => {
      const method =
        methodEntry.method ?? "other";

      if (!groupsByMethod.has(method)) {
        groupsByMethod.set(method, {
          method,
          label:
            getLearnerMethodLabel(
              method
            ),
          pokemonById: new Map()
        });
      }

      groupsByMethod
        .get(method)
        .pokemonById.set(
          pokemon.id,
          pokemon
        );
    });
  });

  return Array.from(
    groupsByMethod.values()
  )
    .map(group => ({
      method: group.method,
      label: group.label,
      pokemon: Array.from(
        group.pokemonById.values()
      ).sort((a, b) => a.id - b.id)
    }))
    .sort(
      (a, b) =>
        getLearnerMethodRank(a.method) -
          getLearnerMethodRank(b.method) ||
        a.label.localeCompare(b.label)
    );
}

function MoveLearnersSection({
  moveName,
  pokemonThatLearnMove,
  methodGroups
}) {
  const [
    pokemonLearnersExpanded,
    setPokemonLearnersExpanded
  ] = useSessionState(
    `move:${moveName}:pokemon-learners-expanded`,
    false
  );
  const learnerGroups =
    normalizeLearnerGroups(
      pokemonThatLearnMove,
      methodGroups
    );

  return (
    <CollapsibleSection
      title="Pokémon That Learn This Move"
      summary={`${pokemonThatLearnMove.length} Pokémon`}
      expanded={pokemonLearnersExpanded}
      onToggle={() =>
        setPokemonLearnersExpanded(
          !pokemonLearnersExpanded
        )
      }
      style={compactSectionStyle()}
      contentStyle={{
        marginTop: "1rem"
      }}
    >
      {/* ------------------------ MOVE LEARNER METHOD GROUPS ------------------------ */}
      <div
        data-section="move-learner-method-groups"
        style={{
          display: "grid",
          gap: "1.5rem"
        }}
      >
        {learnerGroups.map(group => (
          <section
            key={group.method}
            data-section={`move-learner-group-${group.method}`}
          >
            <div
              style={{
                alignItems: "baseline",
                display: "flex",
                gap: ".75rem",
                justifyContent:
                  "space-between",
                marginBottom: ".75rem"
              }}
            >
              <h3
                style={{
                  fontSize: "1.05rem",
                  margin: 0
                }}
              >
                {group.label}
              </h3>

              <span
                style={{
                  color: "#aaa",
                  fontSize: ".9rem"
                }}
              >
                {group.pokemon.length} Pokémon
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gap: "1rem",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(130px, 1fr))"
              }}
            >
              {group.pokemon.map(
                pokemon => (
                  <PokemonSummaryCard
                    key={`${group.method}-${pokemon.id}`}
                    pokemon={pokemon}
                    compact={true}
                  />
                )
              )}
            </div>
          </section>
        ))}
      </div>
    </CollapsibleSection>
  );
}

function MoveDetailPage({
  moveName: selectedMoveName,
  setSelectedMove
}) {
  const { moveName: routeMoveName } =
    useParams();
  const moveName =
    selectedMoveName ?? routeMoveName;
  const [moveData, setMoveData] =
    useState(null);
  const [learnsets, setLearnsets] =
    useState([]);
  const [pokemonIndex, setPokemonIndex] =
    useState([]);
  const [generatedLearners, setGeneratedLearners] =
    useState(null);
  const [oaksNotes, setOaksNotes] =
    useState(null);
  const [
    pokemonGoNotes,
    setPokemonGoNotes
  ] = useState(null);
  const [
    generatedLearnerGroups,
    setGeneratedLearnerGroups
  ] = useState(null);
  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadMove() {
      try {
        setLoading(true);
        setMoveData(null);
        setGeneratedLearners(null);
        setGeneratedLearnerGroups(null);
        setOaksNotes(null);
        setPokemonGoNotes(null);
        setLearnsets([]);
        setPokemonIndex([]);

        //-----------------------------------------
        // MOVE DETAIL DATA
        //-----------------------------------------

        const [
          moveDetail,
          oaksNotesData,
          pokemonGoNotesData
        ] = await Promise.all([
          loadMoveDetail(moveName),
          readJsonUrl(
            `/data/oaksNotes/moves/${moveName}.json`
          ),
          readJsonUrl(
            `/data/pokemonGo/moves/${moveName}.json`
          )
        ]);

        if (!ignore) {
          setMoveData(moveDetail);
          setOaksNotes(oaksNotesData);
          setPokemonGoNotes(pokemonGoNotesData);
        }

        //-----------------------------------------
        // MOVE LEARNER DATA
        //-----------------------------------------

        const generatedLearnerData =
          await readJsonUrl(
            `/data/moveLearners/${moveName}.json`
          );

        if (generatedLearnerData?.pokemon) {
          if (!ignore) {
            setGeneratedLearners(
              generatedLearnerData.pokemon
            );
            setGeneratedLearnerGroups(
              generatedLearnerData.methodGroups ??
                null
            );
          }

          return;
        }

        const [
          learnsetsData,
          pokemonIndexData
        ] = await Promise.all([
          readJsonUrl(
            "/data/learnsets.json"
          ),
          readJsonUrl(
            "/data/pokemonIndex.json"
          )
        ]);

        if (!ignore) {
          setLearnsets(learnsetsData ?? []);
          setPokemonIndex(
            pokemonIndexData ?? []
          );
        }
      } catch (error) {
        console.error(
          "Failed to load move:",
          error
        );
        setOaksNotes(null);
        setPokemonGoNotes(null);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadMove();

    return () => {
      ignore = true;
    };
  }, [moveName]);

  const pokemonByName = useMemo(
    () =>
      new Map(
        pokemonIndex.map(
          pokemon => [
            pokemon.name,
            pokemon
          ]
        )
      ),
    [pokemonIndex]
  );

  const pokemonThatLearnMove =
    generatedLearners ??
    learnsets
      .filter(pokemon =>
        pokemon.moves.some(
          moveEntry =>
            moveEntry.move === moveName
        )
      )
      .map(pokemon =>
        pokemonByName.get(
          pokemon.pokemon
        )
      )
      .filter(Boolean);

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <Seo {...moveSeo(moveName)} />
        <p>Loading...</p>
      </div>
    );
  }

  if (!moveData) {
    return (
      <div style={{ padding: "2rem" }}>
        <Link to="/moves">
          ← Back
        </Link>

        <h1>Move not found</h1>
      </div>
    );
  }

  const moveDisplayName =
    moveData.displayName ??
    capitalize(moveName);
  return (
    <div
      data-section="move-detail-page"
      style={{
        margin: "0 auto",
        maxWidth: "1120px",
        padding: "2rem 1rem 4rem"
      }}
    >
      <Seo {...moveSeo(moveName)} />

      {/* ------------------------ MOVE BACK BUTTON ------------------------ */}
      <div data-section="move-back-button">
        {setSelectedMove ? (
          <button
            onClick={() =>
              setSelectedMove(null)
            }
            style={{
              background: "none",
              border: "1px solid #555",
              borderRadius: "999px",
              color: "inherit",
              cursor: "pointer",
              marginBottom: "1.5rem",
              padding: "0.45rem .85rem"
            }}
          >
            ← Back To Moves
          </button>
        ) : (
          <Link
            to="/moves"
            style={{
              background: "none",
              border: "1px solid #555",
              borderRadius: "999px",
              color: "inherit",
              cursor: "pointer",
              display: "inline-block",
              marginBottom: "1.5rem",
              padding: "0.45rem .85rem",
              textDecoration: "none"
            }}
          >
            ← Back To Moves
          </Link>
        )}
      </div>

      {/* ------------------------ MOVE HERO HEADER ------------------------ */}
      <header
        data-section="move-header"
        style={{
          alignItems: "center",
          display: "grid",
          justifyItems: "center",
          marginBottom: "2rem",
          textAlign: "center"
        }}
      >
        <h1
          style={{
            fontSize:
              "clamp(3.2rem, 8vw, 5.7rem)",
            fontWeight: "500",
            lineHeight: 1,
            margin: "0 0 2rem"
          }}
        >
          {moveDisplayName}
        </h1>

        <div
          data-section="move-type-divider-row"
          style={{
            alignItems: "center",
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns:
              "80px auto 80px",
            marginBottom: "1.6rem"
          }}
        >
          <span
            style={{
              borderTop: "2px solid #444",
              height: 0
            }}
          />

          <Link
            to={`/type/${moveData.type}`}
            style={{
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              textDecoration: "none"
            }}
          >
            <TypeBadge
              height="2.65rem"
              type={moveData.type}
            />
          </Link>

          <span
            style={{
              borderTop: "2px solid #444",
              height: 0
            }}
          />
        </div>

        <div
          data-section="move-category-and-crit-row"
          style={{
            alignItems: "center",
            display: "flex",
            gap: ".85rem",
            justifyContent: "center"
          }}
        >
          <CategoryBadge
            category={moveData.category}
          />

          <CritBadge
            critRate={
              moveData.meta?.critRate
            }
          />
        </div>
      </header>

      <HeroStatStack
        moveData={moveData}
      />

      <EffectPanel
        moveData={moveData}
      />

      <DetailPillRow
        moveData={moveData}
      />

      <OaksNotes note={oaksNotes} />

      <PokemonGoNotes note={pokemonGoNotes} />

      <StatChangesSection
        statChanges={
          moveData.statChanges
        }
      />

      <FlavorTextSection
        moveName={moveName}
        flavorTextEntries={
          moveData.flavorTextEntries
        }
      />

      {/* ------------------------ MOVE LEARNERS SECTION ------------------------ */}
      <div data-section="move-learners-section">
        <MoveLearnersSection
          key={moveName}
          moveName={moveName}
          pokemonThatLearnMove={
            pokemonThatLearnMove
          }
          methodGroups={
            generatedLearnerGroups
          }
        />
      </div>

      {/* ------------------------ MOVE MACHINE ITEMS ------------------------ */}
      <div
        data-section="move-machine-items"
        style={compactSectionStyle()}
      >
        <MoveMachineItems
          key={moveName}
          storageKey={`move:${moveName}:machine-items-expanded`}
          machineItems={
            moveData.machineItems
          }
        />
      </div>

      <PastValuesSection
        moveName={moveName}
        pastValues={
          moveData.pastValues
        }
      />
    </div>
  );
}

export default MoveDetailPage;
