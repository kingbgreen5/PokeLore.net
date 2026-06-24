import typeColors from "../constants/typeColors";
import {
  useParams
} from "react-router-dom";

import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";
import CollapsibleSection from "../components/CollapsibleSection";
import MoveMachineItems from "../components/MoveMachineItems";
import PokemonSummaryCard from "../components/PokemonSummaryCard";
import useSessionState from "../hooks/useSessionState";
import Seo from "../seo/Seo";
import { moveSeo } from "../seo/seoConfig";

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function MoveLearnersSection({
  moveName,
  pokemonThatLearnMove
}) {
  const [
    pokemonLearnersExpanded,
    setPokemonLearnersExpanded
  ] = useSessionState(
    `move:${moveName}:pokemon-learners-expanded`,
    false
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
      contentStyle={{
        display: "grid",
        gap: "1rem",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(130px, 1fr))",
        marginTop: "1rem"
      }}
    >
          {pokemonThatLearnMove.map(
            pokemon => (
              <PokemonSummaryCard
                key={pokemon.id}
                pokemon={pokemon}
                compact={true}
              />
            )
          )}
    </CollapsibleSection>
  );
}

function MoveDetailPage({
  // moveName,
  // movesData,
  // learnsets,
  setSelectedMove
}) {
  const { moveName } = useParams();
  // const move = movesData[moveName];
  const [moveData, setMoveData] =
  useState(null);

  const navigate = useNavigate();

const [learnsets, setLearnsets] =
  useState([]);

const [pokemonIndex, setPokemonIndex] =
  useState([]);

useEffect(() => {

  async function loadMove() {

    try {

      //-----------------------------------------
      // Load Moves
      //-----------------------------------------

      const movesResponse =
        await fetch(
          "/data/moves.json"
        );

      const moves =
        await movesResponse.json();

      setMoveData(
        moves[moveName]
      );

      //-----------------------------------------
      // Load Learnsets
      //-----------------------------------------

      const [
        learnsetsResponse,
        pokemonIndexResponse
      ] = await Promise.all([
        fetch(
          "/data/learnsets.json"
        ),
        fetch(
          "/data/pokemonIndex.json"
        )
      ]);

      const [
        learnsetsData,
        pokemonIndexData
      ] = await Promise.all([
        learnsetsResponse.json(),
        pokemonIndexResponse.json()
      ]);

      setLearnsets(
        learnsetsData
      );

      setPokemonIndex(
        pokemonIndexData
      );

    } catch (error) {

      console.error(
        "Failed to load move:",
        error
      );

    }

  }

  loadMove();

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

  // Find all Pokémon that learn this move.
  const pokemonThatLearnMove =
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











  if (!moveData) {
    return (
      <div style={{ padding: "2rem" }}>
        <button
     onClick={() => navigate("/moves")}
        >
          ← Back
        </button>

        <h1>Move not found</h1>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "1000px",
        margin: "0 auto"
      }}
    >
      <Seo {...moveSeo(moveName)} />

      {/* Back Button */}
      <button
        onClick={() =>
          setSelectedMove
            ? setSelectedMove(null)
            : navigate("/moves")
        }
        style={{
          marginBottom: "2rem",
          padding: "0.5rem 1rem",
          cursor: "pointer"
        }}
      >
        ← Back To Moves
      </button>

      {/* Move Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "2rem",
          flexWrap: "wrap"
        }}
      >
        <h1
          style={{
            margin: 0
          }}
        >
          {capitalize(moveName)}
        </h1>

        <button
          onClick={() =>
            navigate(
              `/type/${moveData.type}`
            )
          }
          style={{
            backgroundColor:
              typeColors[moveData.type],
            border: "none",
            cursor: "pointer",
            color: "white",
            padding: "0.4rem 0.8rem",
            borderRadius: "999px",
            fontWeight: "bold",
            textTransform: "uppercase"
          }}
        >
          {moveData.type}
        </button>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "flex",
          gap: "2rem",
          marginBottom: "2rem",
          flexWrap: "wrap"
        }}
      >
        <div>
          <strong>Power</strong>
          <p>{moveData.power ?? "-"}</p>
        </div>

        <div>
          <strong>Accuracy</strong>
          <p>{moveData.accuracy ?? "-"}</p>
        </div>

        <div>
          <strong>PP</strong>
          <p>{moveData.pp ?? "-"}</p>
        </div>
      </div>

      {/* Description */}
      <div
        style={{
          marginBottom: "3rem"
        }}
      >
        <h2>Description</h2>

        <p
          style={{
            lineHeight: "1.6"
          }}
        >
          {moveData.description}
        </p>
      </div>

      <MoveMachineItems
        key={moveName}
        storageKey={`move:${moveName}:machine-items-expanded`}
        machineItems={
          moveData.machineItems
        }
      />

      <MoveLearnersSection
        key={moveName}
        moveName={moveName}
        pokemonThatLearnMove={
          pokemonThatLearnMove
        }
      />
    </div>
  );
}

export default MoveDetailPage;
