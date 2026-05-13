import { useState } from "react";
import typeColors from "../constants/typeColors";

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function LearnsetCard({ pokemonData, movesData, setSelectedMove }) {
  const [expanded, setExpanded] = useState(false);

  const [activeTab, setActiveTab] = useState("level-up");




  
  const groupedMoves = pokemonData.moves.reduce((acc, move) => {
    if (!acc[move.method]) {
      acc[move.method] = [];
    }

    acc[move.method].push(move);

    return acc;
  }, {});

//   const currentMoves = groupedMoves[activeTab] || [];

//   const sortedMoves = [...currentMoves].sort(
//     (a, b) => a.level - b.level
//   );

const currentMoves =
  groupedMoves[activeTab] || [];


const condensedMovesMap = {};

for (const move of currentMoves) {
  const key = `${move.move}-${move.method}-${move.level}`;

  if (!condensedMovesMap[key]) {
    condensedMovesMap[key] = {
      ...move,
      versionGroups: []
    };
  }

  condensedMovesMap[key].versionGroups.push(
    move.versionGroup
  );
}

const condensedMoves =
  Object.values(condensedMovesMap);

const sortedMoves = condensedMoves.sort(
  (a, b) => a.level - b.level
);










  return (
    <div
      style={{
        border: "2px solid #706363",
        borderRadius: "12px",
        padding: ".3rem",
        marginBottom: "1rem"
      }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <h2>{capitalize(pokemonData.pokemon)}</h2>

        <p>
          {pokemonData.moves.length} moves
        </p>
      </div>

      {expanded && (
        <div>
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "1rem",
              flexWrap: "wrap"
            }}
          >
            {Object.keys(groupedMoves).map(method => (
              <button
                key={method}
                onClick={() => setActiveTab(method)}
                style={{
                  padding: "0.5rem 1rem",
                  background:
                    activeTab === method
                      ? "#c2bcbc"
                      : "#747272",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                {capitalize(method)}
              </button>
            ))}
          </div>

          {/* Moves */}
          <div>

<div


// ---------------------------------------Column Headers---------------------------------------
  style={{
    display: "grid",
    gridTemplateColumns:
      "10px 115px 65px 50px 30px 1fr",
    gap: ".25rem",
    fontWeight: "bold",
    borderBottom: "2px solid #aaa",
    paddingBottom: "0.5rem",
    marginBottom: "0.5rem"
  }}
>
   <div>Lv.</div>
  <div>Move</div>
  <div>Type</div>
  <div>Pwr</div>
  <div>Acc</div>
</div>


            {sortedMoves.map((move, index) => {
              const moveDetails =
                movesData[move.move];

              return (
//----------------------------------------Move Row---------------------------------------

  <div
  key={index}
  style={{
    display: "grid",
    gridTemplateColumns:
      "10px 115px 75px 60px 25px 1fr",
    gap: ".25rem",
    alignItems: "start",
    padding: "0.25rem 0",
    // borderBottom: "1px solid #ddd",
    fontSize: "0.70rem"
  }}
>
  {/* Level */}
  <div>
    {move.level > 0
      ? ` ${move.level}`
      : "-"}
  </div>


  {/* Move Name
  <div>
    <strong>
      {capitalize(move.move)}
    </strong>
  </div>
 */}


<button
onClick={() => {




  setSelectedMove(move.move);
}}
>
    <strong>
      {capitalize(move.move)}
    </strong>
</button>


  

<span
  style={{
    backgroundColor:
      typeColors[moveDetails?.type],
    color: "white",
    padding: "0.2rem 0.9rem",
    borderRadius: "99px",
    fontSize: "0.60rem",
  
    textTransform: "uppercase"
  }}
>
  {moveDetails?.type}
</span>


  <div>
    {(
      moveDetails?.power || "---"
    )}
  </div>

  <div>
    {(
      moveDetails?.accuracy || "---"
    )}
  </div>




  {/* Versions */}
  {/* <div>
    {move.versionGroups.join(" / ")}
  </div> */}

  {/* Description */}
  {/* <div>
    {moveDetails?.description}
  </div> */}
</div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default LearnsetCard;