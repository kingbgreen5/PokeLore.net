import {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  useNavigate,
  useParams
} from "react-router-dom";
import MoveSummaryCard from "../components/MoveSummaryCard";
import PokemonSummaryCard from "../components/PokemonSummaryCard";
import typeChart from "../constants/Types";
import typeColors from "../constants/typeColors";

const allTypes = Object.keys(typeColors);

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
        padding: "1rem"
      }}
    >
      <h3
        style={{
          marginTop: 0
        }}
      >
        {title}
      </h3>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: ".5rem",
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

function TypeDetailPage() {
  const { typeName } = useParams();

  const type =
    typeName?.toLowerCase();

  const [pokemonIndex, setPokemonIndex] =
    useState([]);

  const [moves, setMoves] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadTypeData() {
      try {
        const [
          pokemonResponse,
          movesResponse
        ] = await Promise.all([
          fetch(
            "/data/pokemonIndex.json"
          ),
          fetch("/data/moves.json")
        ]);

        const [
          pokemonData,
          movesData
        ] = await Promise.all([
          pokemonResponse.json(),
          movesResponse.json()
        ]);

        setPokemonIndex(pokemonData);
        setMoves(movesData);
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

  const movesOfType = useMemo(
    () =>
      Object.entries(moves).filter(
        ([, move]) =>
          move.type === type
      ),
    [moves, type]
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

  return (
    <div
      style={{
        padding: "2rem"
      }}
    >
      <h1>
        {capitalize(type)} Type
      </h1>

      <div
        style={{
          backgroundColor:
            typeColors[type],
          borderRadius: "999px",
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

      <p
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
      </p>

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

      <h2>
        {capitalize(type)} Pokémon
      </h2>

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          marginBottom: "3rem"
        }}
      >
        {pokemonOfType.map(
          pokemon => (
            <PokemonSummaryCard
              key={pokemon.id}
              pokemon={pokemon}
            />
          )
        )}
      </div>

      <h2>
        {capitalize(type)} Attacks
      </h2>

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(200px, .75fr))"
        }}
      >
        {movesOfType.map(
          ([name, move]) => (
            <MoveSummaryCard
              key={name}
              name={name}
              move={move}
            />
          )
        )}
      </div>
    </div>
  );
}

export default TypeDetailPage;
