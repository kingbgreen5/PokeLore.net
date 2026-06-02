import typeColors from "../constants/typeColors";
import {
  useParams
} from "react-router-dom";

import {
  useEffect,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
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

      const learnsetsResponse =
        await fetch(
          "/data/learnsets.json"
        );

      const learnsetsData =
        await learnsetsResponse.json();

      setLearnsets(
        learnsetsData
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

  // Find all Pokémon that learn this move
  const pokemonThatLearnMove =
    learnsets.filter(pokemon =>
      pokemon.moves.some(
        moveEntry =>
          moveEntry.move === moveName
      )
    );

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "1000px",
        margin: "0 auto"
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => setSelectedMove(null)}
        style={{
          marginBottom: "2rem",
          padding: "0.5rem 1rem",
          cursor: "pointer"
        }}
      >
        ← Back To Learnsets
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

        <span
          style={{
            backgroundColor:
              typeColors[moveData.type],
            color: "white",
            padding: "0.4rem 0.8rem",
            borderRadius: "999px",
            fontWeight: "bold",
            textTransform: "uppercase"
          }}
        >
          {moveData.type}
        </span>
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

      {/* Pokemon Learnset */}
      <div>
        <h2>
          Pokémon That Learn This Move
        </h2>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginTop: "1rem"
          }}
        >
          {pokemonThatLearnMove.map(
            pokemon => (
              <div
                key={pokemon.pokemon}
                style={{
                  border:
                    "1px solid #ccc",
                  padding:
                    "0.5rem 1rem",
                  borderRadius:
                    "999px",
                  fontSize: "0.9rem"
                }}
              >
                {capitalize(
                  pokemon.pokemon
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default MoveDetailPage;