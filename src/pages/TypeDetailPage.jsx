import {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  Link,
  useNavigate,
  useParams
} from "react-router-dom";
import CollapsibleSection from "../components/CollapsibleSection";
import MoveSummaryCard from "../components/MoveSummaryCard";
import PokemonSummaryCard from "../components/PokemonSummaryCard";
import TypeSizeChart from "../components/TypeSizeChart";
import typeChart from "../constants/Types";
import typeColors from "../constants/typeColors";
import Seo from "../seo/Seo";
import { typeSeo } from "../seo/seoConfig";
import { loadMovesMap } from "../utils/loadMovesData";

const allTypes = Object.keys(typeColors);

const pokemonStatOptions = {
  baseStatTotal: {
    label: "BST",
    displayName: "Base Stat Total"
  },
  hp: {
    label: "HP",
    displayName: "HP"
  },
  attack: {
    label: "Atk",
    displayName: "Attack"
  },
  defense: {
    label: "Def",
    displayName: "Defense"
  },
  specialAttack: {
    label: "SpA",
    displayName: "Sp. Atk"
  },
  specialDefense: {
    label: "SpD",
    displayName: "Sp. Def"
  },
  speed: {
    label: "Spe",
    displayName: "Speed"
  }
};

function getPokemonStatValue(
  pokemon,
  statKey
) {
  if (statKey === "baseStatTotal") {
    return pokemon.baseStatTotal;
  }

  return pokemon.stats?.[statKey];
}

function capitalize(text) {
  return text
    .split("-")
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function getOffensiveMatchups(type) {
  return allTypes
    .map(defenseType => ({
      type: defenseType,
      multiplier:
        typeChart[type]?.[
          defenseType
        ] ?? 1
    }))
    .filter(
      matchup =>
        matchup.multiplier !== 1
    );
}

function getDefensiveMatchups(type) {
  return allTypes
    .map(attackType => ({
      type: attackType,
      multiplier:
        typeChart[attackType]?.[
          type
        ] ?? 1
    }))
    .filter(
      matchup =>
        matchup.multiplier !== 1
    );
}

function TypeBadge({
  type,
  multiplier
}) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() =>
        navigate(`/type/${type}`)
      }
      style={{
        backgroundColor:
          typeColors[type],
        border: "none",
        borderRadius: "999px",
        color: "white",
        cursor: "pointer",
        display: "inline-flex",
        fontSize: ".72rem",
        fontWeight: "bold",
        gap: ".35rem",
        padding: ".3rem .7rem",
        textTransform: "uppercase"
      }}
    >
      {type}
      <strong>
        {multiplier}x
      </strong>
    </button>
  );
}

function MatchupGroup({
  title,
  matchups
}) {
  if (matchups.length === 0) {
    return null;
  }

  return (
    <section
      style={{
        border: "1px solid #666",
        borderRadius: "12px",
        padding: ".5rem",
        paddingTop: ".1rem"
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: ".1rem"
        }}
      >
        {title}
      </h3>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: ".9rem",
          justifyContent: "center"
        }}
      >
        {matchups.map(
          matchup => (
            <TypeBadge
              key={matchup.type}
              type={matchup.type}
              multiplier={
                matchup.multiplier
              }
            />
          )
        )}
      </div>
    </section>
  );
}

function MatchupPanel({
  title,
  matchups
}) {
  const strong =
    matchups.filter(
      matchup =>
        matchup.multiplier === 2
    );

  const resisted =
    matchups.filter(
      matchup =>
        matchup.multiplier === 0.5
    );

  const noEffect =
    matchups.filter(
      matchup =>
        matchup.multiplier === 0
    );

  return (
    <div>
      <h2>
        {title}
      </h2>

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))"
        }}
      >
        <MatchupGroup
          title="2x"
          matchups={strong}
        />

        <MatchupGroup
          title="0.5x"
          matchups={resisted}
        />

        <MatchupGroup
          title="0x"
          matchups={noEffect}
        />
      </div>
    </div>
  );
}

function TypeAbilityCard({
  ability
}) {
  return (
    <Link
      to={`/ability/${ability.name}`}
      style={{
        backgroundColor: "#2c2c2c",
        border: "1px solid #666",
        borderRadius: "12px",
        color: "inherit",
        display: "grid",
        gap: ".5rem",
        padding: "1rem",
        textAlign: "left",
        textDecoration: "none"
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: ".5rem",
          justifyContent:
            "space-between"
        }}
      >
        <strong>
          {ability.displayName}
        </strong>

        <span
          style={{
            border: "1px solid #777",
            borderRadius: "999px",
            fontSize: ".78rem",
            padding: ".2rem .55rem"
          }}
        >
          {ability.pokemonCount} Pokémon
        </span>
      </div>

      {ability.shortEffect && (
        <p
          style={{
            fontSize: ".9rem",
            margin: 0,
            opacity: 0.85
          }}
        >
          {ability.shortEffect}
        </p>
      )}

      {ability.hiddenPokemonCount >
        0 && (
        <span
          style={{
            color: "#f7c96b",
            fontSize: ".82rem"
          }}
        >
          Hidden ability for{" "}
          {ability.hiddenPokemonCount}
        </span>
      )}
    </Link>
  );
}

function TypeDetailPage() {
  const { typeName } = useParams();

  const type =
    typeName?.toLowerCase();

  const [pokemonIndex, setPokemonIndex] =
    useState([]);

  const [moves, setMoves] =
    useState({});
  const [
    typeAbilities,
    setTypeAbilities
  ] = useState({});

  const [loading, setLoading] =
    useState(true);
  const [
    pokemonSectionExpanded,
    setPokemonSectionExpanded
  ] = useState(false);
  const [
    attacksSectionExpanded,
    setAttacksSectionExpanded
  ] = useState(false);
  const [
    abilitiesSectionExpanded,
    setAbilitiesSectionExpanded
  ] = useState(false);
  const [
    powerSortMode,
    setPowerSortMode
  ] = useState("default");
  const [
    pokemonStatFilter,
    setPokemonStatFilter
  ] = useState("default");
  const [
    pokemonStatSortDirection,
    setPokemonStatSortDirection
  ] = useState("desc");

  useEffect(() => {
    async function loadTypeData() {
      try {
        const [
          pokemonResponse,
          movesData,
          abilitiesResponse
        ] = await Promise.all([
          fetch(
            "/data/pokemonIndex.json"
          ),
          loadMovesMap(),
          fetch(
            "/data/typeAbilities.json"
          )
        ]);

        const [
          pokemonData,
          abilitiesData
        ] = await Promise.all([
          pokemonResponse.json(),
          Promise.resolve(movesData),
          abilitiesResponse.json()
        ]);

        setPokemonIndex(pokemonData);
        setMoves(movesData);
        setTypeAbilities(
          abilitiesData
        );
      } catch (error) {
        console.error(
          "Failed to load type data:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadTypeData();
  }, []);

  const pokemonOfType = useMemo(
    () =>
      pokemonIndex.filter(
        pokemon =>
          pokemon.types.includes(type)
      ),
    [pokemonIndex, type]
  );

  const sortedPokemonOfType = useMemo(
    () => {
      if (
        pokemonStatFilter === "default"
      ) {
        return pokemonOfType;
      }

      return [...pokemonOfType].sort(
        (first, second) => {
          const firstValue =
            getPokemonStatValue(
              first,
              pokemonStatFilter
            );
          const secondValue =
            getPokemonStatValue(
              second,
              pokemonStatFilter
            );

          const sortResult =
            (secondValue ?? -1) -
            (firstValue ?? -1);

          return pokemonStatSortDirection ===
            "asc"
            ? sortResult * -1
            : sortResult;
        }
      );
    },
    [
      pokemonOfType,
      pokemonStatFilter,
      pokemonStatSortDirection
    ]
  );

  const selectedPokemonStatOption =
    pokemonStatOptions[
      pokemonStatFilter
    ];

  function renderPokemonStatLabel(pokemon) {
    if (
      !selectedPokemonStatOption
    ) {
      return null;
    }

    const value = getPokemonStatValue(
      pokemon,
      pokemonStatFilter
    );

    if (
      value === undefined ||
      value === null
    ) {
      return null;
    }

    return (
      <div
        style={{
          color: "#f3f3f3",
          fontSize: ".85rem",
          fontWeight: "700",
          marginTop: ".35rem",
          opacity: 0.9,
          textAlign: "center"
        }}
      >
        {selectedPokemonStatOption.label}
        : {value}
      </div>
    );
  }

  const movesOfType = useMemo(
    () =>
      Object.entries(moves).filter(
        ([, move]) =>
          move.type === type
      ),
    [moves, type]
  );

  const abilitiesOfType = useMemo(
    () => typeAbilities[type] ?? [],
    [typeAbilities, type]
  );

  const sortedMovesOfType = useMemo(
    () =>
      [...movesOfType].sort(([, a], [, b]) => {
        if (powerSortMode === "high-low") {
          return (
            (b.power ?? -1) -
            (a.power ?? -1)
          );
        }

        if (powerSortMode === "low-high") {
          return (
            (a.power ?? Infinity) -
            (b.power ?? Infinity)
          );
        }

        return 0;
      }),
    [movesOfType, powerSortMode]
  );

  if (!typeColors[type]) {
    return (
      <div
        style={{
          padding: "2rem"
        }}
      >
        <h1>Type not found</h1>
      </div>
    );
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  const offensiveMatchups =
    getOffensiveMatchups(type);

  const defensiveMatchups =
    getDefensiveMatchups(type);

    // --------------------------------------------------------RETURN-------
  return (
    <div
      style={{
        padding: "2rem"
      }}
    >
      <Seo {...typeSeo(type)} />



      <h1
      style={{
    
        color: typeColors[type],
      }}
      >
        {capitalize(type)} Type
      </h1>

      <div
        style={{
          backgroundColor:
            typeColors[type],
          borderRadius: "999px",
          fontFamily:"",
          color: "white",
          display: "inline-block",
          fontWeight: "bold",
          marginBottom: "1rem",
          padding: ".45rem 1rem",
          textTransform: "uppercase"
        }}
      >
        {type}
      </div>

      {/* <p
        style={{
          margin: "0 auto 2rem",
          maxWidth: "760px"
        }}
      >
        {capitalize(type)} matchups
        show how {type} attacks
        perform against defending
        types, and how pure {type} 
         Pokémon handle incoming
        attacks.
      </p> */}

      <div
        style={{
          display: "grid",
          gap: "2rem",
          marginBottom: "3rem"
        }}
      >
        <MatchupPanel
          title="Offensive Matchups"
          matchups={offensiveMatchups}
        />

        <MatchupPanel
          title="Defensive Matchups"
          matchups={defensiveMatchups}
        />
      </div>


      {/* this is not ready for prime time yet so I am commenting it out */}
      {/* <TypeSizeChart
        pokemon={pokemonOfType}
        typeName={capitalize(type)}
      /> */}

{/*                                                                                                                         POKEMON OF THE TYPE */}
      <CollapsibleSection
        title={`${capitalize(type)} Pokémon`}
        summary={`${pokemonOfType.length} Pokémon`}
        expanded={pokemonSectionExpanded}
        onToggle={() =>
          setPokemonSectionExpanded(
            !pokemonSectionExpanded
          )
        }
        style={{
          marginBottom: "3rem"
        }}
        contentStyle={{
          marginTop: "1rem"
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: ".75rem",
            marginBottom: "1rem"
          }}
        >
          <select
            value={pokemonStatFilter}
            onChange={e =>
              setPokemonStatFilter(
                e.target.value
              )
            }
            style={{
              backgroundColor: "#2c2c2c",
              border: "2px solid #555",
              borderRadius: "12px",
              color: "white",
              fontSize: "1rem",
              padding: ".7rem 1rem"
            }}
          >
            <option value="default">
              Nat. Dex. Number
            </option>

            {Object.entries(
              pokemonStatOptions
            ).map(([value, option]) => (
              <option
                key={value}
                value={value}
              >
                {option.displayName}
              </option>
            ))}
          </select>

          <select
            value={pokemonStatSortDirection}
            onChange={e =>
              setPokemonStatSortDirection(
                e.target.value
              )
            }
            disabled={
              pokemonStatFilter === "default"
            }
            style={{
              backgroundColor: "#2c2c2c",
              border: "2px solid #555",
              borderRadius: "12px",
              color: "white",
              fontSize: "1rem",
              opacity:
                pokemonStatFilter ===
                "default"
                  ? 0.55
                  : 1,
              padding: ".7rem 1rem"
            }}
          >
            <option value="desc">
              Descending
            </option>

            <option value="asc">
              Ascending
            </option>
          </select>
        </div>

        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(130px, 1fr))"
          }}
        >
          {sortedPokemonOfType.map(
            pokemon => (
              <div
                key={pokemon.id}
                style={{
                  alignItems: "center",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <PokemonSummaryCard
                  pokemon={pokemon}
                  compact={true}
                />

                {renderPokemonStatLabel(
                  pokemon
                )}
              </div>
            )
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title={`Abilities of ${capitalize(type)} Pokémon`}
        summary={`${abilitiesOfType.length} abilities`}
        expanded={abilitiesSectionExpanded}
        onToggle={() =>
          setAbilitiesSectionExpanded(
            !abilitiesSectionExpanded
          )
        }
        style={{
          marginBottom: "3rem"
        }}
        contentStyle={{
          marginTop: "1rem"
        }}
      >
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))"
          }}
        >
          {abilitiesOfType.map(
            ability => (
              <TypeAbilityCard
                key={ability.name}
                ability={ability}
              />
            )
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title={`${capitalize(type)} Attacks`}
        summary={`${movesOfType.length} moves`}
        expanded={attacksSectionExpanded}
        onToggle={() =>
          setAttacksSectionExpanded(
            !attacksSectionExpanded
          )
        }
        contentStyle={{
          marginTop: "1rem"
        }}
      >
        <div
          style={{
            marginBottom: "1rem"
          }}
        >
          <select
            value={powerSortMode}
            onChange={e =>
              setPowerSortMode(
                e.target.value
              )
            }
            style={{
              backgroundColor: "#2c2c2c",
              border: "2px solid #555",
              borderRadius: "12px",
              color: "white",
              fontSize: "1rem",
              padding: ".7rem 1rem"
            }}
          >
            <option value="default">
              Default Order
            </option>

            <option value="high-low">
              Power Descending
            </option>

            <option value="low-high">
              Power Ascending
            </option>
          </select>
        </div>

        <div
          style={{
            display: "grid",
            gap: "1rem",
            justifyItems: "center",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(130px, 1fr))"
          }}
        >
          {sortedMovesOfType.map(
            ([name, move]) => (
              <MoveSummaryCard
                key={name}
                name={name}
                move={move}
              />
            )
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}

export default TypeDetailPage;
