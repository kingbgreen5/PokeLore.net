


import { useState } from "react";
import typeColors from "../constants/typeColors";

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

function LearnsetCard({
  pokemonData,
  movesData,
  setSelectedMove
}) {
  const [expanded, setExpanded] =
    useState(false);

  //-----------------------------------------
  // Version Groups
  //-----------------------------------------

  // const versionGroups = [
  //   ...new Set(
  //     pokemonData.moves.map(
  //       move => move.versionGroup
  //     )
  //   )
  // ];

const versionGroups = [
  "all",
  ...new Set(
    pokemonData.moves.map(
      move => move.versionGroup
    )
  )
];

  //-----------------------------------------
  //  Default Selected Version
  //-----------------------------------------

  const [selectedVersion, setSelectedVersion] =
    useState(versionGroups[0]);


  //-----------------------------------------
  // Filter By Selected Version
  //-----------------------------------------

  // const filteredMoves =
  //   pokemonData.moves.filter(
  //     move =>
  //       move.versionGroup ===
  //       selectedVersion
  //   );

const filteredMoves =
  selectedVersion === "all"
    ? pokemonData.moves
    : pokemonData.moves.filter(
        move =>
          move.versionGroup ===
          selectedVersion
      );




  //-----------------------------------------
  // Group By Learn Method
  //-----------------------------------------

  const groupedMoves =
    filteredMoves.reduce((acc, move) => {
      if (!acc[move.method]) {
        acc[move.method] = [];
      }

      acc[move.method].push(move);

      return acc;
    }, {});

  //-----------------------------------------
  // Method Display Order
  //-----------------------------------------

  const methodOrder = [
    "level-up",
    "machine",
    "tutor",
    "egg"
  ];

  //-----------------------------------------
  // Render
  //-----------------------------------------

  return (
    <div
      style={{
        border: "2px solid #706363",
        borderRadius: "12px",
        padding: ".35rem",
        marginBottom: "1rem"
      }}
    >
      {/* Header */}

      <div
        onClick={() =>
          setExpanded(!expanded)
        }
        style={{
          cursor: "pointer",
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center"
        }}
      >
        <h2>
          {capitalize(
            pokemonData.pokemon
          )}
        </h2>

        <p>
          {
            filteredMoves.length
          }{" "}
          moves
        </p>
      </div>

      {/* Expanded Content */}

      {expanded && (
        <div>
          {/* Version Selector */}

          <div
            style={{
              marginBottom: "1rem"
            }}
          >
            <select
              value={
                selectedVersion
              }
              onChange={e =>
                setSelectedVersion(
                  e.target.value
                )
              }
              style={{
                padding:
                  "0.5rem",
                borderRadius:
                  "8px",
                border:
                  "1px solid #666"
              }}
            >
              {versionGroups.map(
                version => (
                  <option
                    key={version}
                    value={version}
                  >
                 {version === "all"
                   ? "All Generations"
                           : capitalize(version)}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Learn Method Sections */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "1rem",
              alignItems: "start"
            }}
          >
            {methodOrder.map(
              method => {
                const moves =
                  groupedMoves[
                    method
                  ];

                if (!moves)
                  return null;

                //-----------------------------------------
                // Condense Duplicate Moves
                //-----------------------------------------

                const condensedMap =
                  {};

                for (const move of moves) {
                  const key = `${move.move}-${move.level}`;

                  if (
                    !condensedMap[
                      key
                    ]
                  ) {
                    condensedMap[
                      key
                    ] = move;
                  }
                }

                const condensedMoves =
                  Object.values(
                    condensedMap
                  );

                //-----------------------------------------
                // Sort
                //-----------------------------------------

                const sortedMoves =
                  condensedMoves.sort(
                    (
                      a,
                      b
                    ) =>
                      a.level -
                      b.level
                  );

                return (
                  <div
                    key={method}
                    style={{
                      border:
                        "1px solid #666",
                      borderRadius:
                        "10px",
                      padding:
                        "0.75rem"
                    }}
                  >
                    {/* Section Title */}

                    <h3
                      style={{
                        marginTop: 0,
                        marginBottom:
                          "1rem"
                      }}
                    >
                      {capitalize(
                        method
                      )}
                    </h3>

                    {/* Column Headers */}

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "30px 1fr 70px 50px 50px",
                        gap:
                          ".35rem",
                        fontWeight:
                          "bold",
                        borderBottom:
                          "2px solid #888",
                        paddingBottom:
                          ".5rem",
                        marginBottom:
                          ".5rem",
                        fontSize:
                          ".75rem"
                      }}
                    >
                      <div>
                        Lv
                      </div>
                      <div>
                        Move
                      </div>
                      <div>
                        Type
                      </div>
                      <div>
                        Pwr
                      </div>
                      <div>
                        Acc
                      </div>
                    </div>

                    {/* Move Rows */}

                    {sortedMoves.map(
                      (
                        move,
                        index
                      ) => {
                        const moveDetails =
                          movesData[
                            move
                              .move
                          ];

                        return (
                          <div
                            key={
                              index
                            }
                            style={{
                              display:
                                "grid",
                              gridTemplateColumns:
                                "30px 1fr 70px 50px 50px",
                              gap:
                                ".35rem",
                              alignItems:
                                "center",
                              padding:
                                ".3rem 0",
                              fontSize:
                                ".72rem"
                            }}
                          >
                            {/* Level */}

                            <div>
                              {move.level >
                              0
                                ? move.level
                                : "-"}
                            </div>

                            {/* Move Button */}

                            <button
                              onClick={() =>
                                setSelectedMove(
                                  move.move
                                )
                              }
                              style={{
                                background:
                                  "none",
                                border:
                                  "none",
                                cursor:
                                  "pointer",
                                textAlign:
                                  "left",
                                padding:
                                  0,
                                fontWeight:
                                  "bold"
                              }}
                            >
                              {capitalize(
                                move.move
                              )}
                            </button>

                            {/* Type */}

                            <span
                              style={{
                                backgroundColor:
                                  typeColors[
                                    moveDetails?.type
                                  ],
                                color:
                                  "white",
                                padding:
                                  "0.2rem 0.5rem",
                                borderRadius:
                                  "999px",
                                textAlign:
                                  "center",
                                fontSize:
                                  ".6rem",
                                textTransform:
                                  "uppercase"
                              }}
                            >
                              {moveDetails?.type ||
                                "---"}
                            </span>

                            {/* Power */}

                            <div>
                              {moveDetails?.power ||
                                "---"}
                            </div>

                            {/* Accuracy */}

                            <div>
                              {moveDetails?.accuracy ||
                                "---"}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LearnsetCard;