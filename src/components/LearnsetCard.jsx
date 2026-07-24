


import TypeBadge from "./TypeBadge";
import { Link }
from "react-router-dom";
import CollapsibleSection from "./CollapsibleSection";
import useSessionState from "../hooks/useSessionState";
import useLocalStorageState from "../hooks/useLocalStorageState";
import physicalBadge from "../assets/Physical Badge.png";
import specialBadge from "../assets/Special Badge.png";
import statusBadge from "../assets/Status Badge.png";
import { sortVersionGroups } from "../constants/versionOrder";

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

function getCategoryBadge(category) {
  const normalizedCategory =
    category?.toLowerCase();

  if (normalizedCategory === "physical") {
    return physicalBadge;
  }

  if (normalizedCategory === "special") {
    return specialBadge;
  }

  if (normalizedCategory === "status") {
    return statusBadge;
  }

  return null;
}

function LearnsetCard({
  pokemonData,
  movesData,
  titleColor,
  titleChevron = false
}) {
  const [expanded, setExpanded] =
    useSessionState(
      `pokemon:${pokemonData.id ?? pokemonData.pokemon}:learnsets-expanded`,
      false
    );
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
  ...sortVersionGroups(
    new Set(
      pokemonData.moves.map(
        move => move.versionGroup
      )
    )
  )
];

  //-----------------------------------------
  //  Default Selected Version
  //-----------------------------------------

  const [
    preferredVersion,
    setPreferredVersion
  ] = useLocalStorageState(
    "pokelore:learnset-version",
    "all"
  );
  const selectedVersion =
    versionGroups.includes(
      preferredVersion
    )
      ? preferredVersion
      : "all";


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
    <CollapsibleSection
      title="Learnsets"
      summary={`${filteredMoves.length} moves`}
      titleColor={titleColor}
      titleChevron={titleChevron}
      expanded={expanded}
      onToggle={() =>
        setExpanded(!expanded)
      }
      contentStyle={{
        marginTop: "1rem"
      }}
    >
        <div>
          {/* Version Selector */}

          <div
            style={{
              marginBottom: "1rem"
            }}
          >
            <select
              aria-label="Learnset version"
              value={
                selectedVersion
              }
              onChange={e =>
                setPreferredVersion(
                  e.target.value
                )
              }
              style={{
                padding:
                  "0.5rem",
                borderRadius:
                  "8px",
                border:
                  "1px solid #606060"
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

                  <div className="learnsetCard"
                    key={method}
                    style={{

                      padding:
                        "0.15rem"
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
                          // "10px 1fr 70px 50px 50px 10px",
                          "20px 1fr 70px 30px 20px 40px",
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
                        Lvl
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
                        <div>
                        Cat.
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
                        const categoryBadge =
                          getCategoryBadge(
                            moveDetails?.category
                          );

                        return (
                          <div
                            key={
                              index
                            }
                            style={{
                              display:
                                "grid",
                              gridTemplateColumns:
                                // "30px 1fr 70px 50px 50px",
                                   "20px 1fr 70px 25px 15px 50px",
                              gap:
                                ".35rem",
                              alignItems:
                                "center",
                              padding:
                                ".2rem 0",
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

                            <Link
                              to={`/move/${move.move}`}
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
                                  "bold",
                                textDecoration:
                                  "none"
                              }}
                            >
                              {capitalize(
                                move.move
                              )}
                            </Link>

                            {/* Type */}

                            {moveDetails?.type ? (
                              <Link
                                to={`/type/${moveDetails.type}`}
                                style={{
                                  border:
                                    "none",
                                  cursor:
                                    "pointer",
                                  display:
                                    "inline-flex",
                                  textAlign:
                                    "center",
                                  textDecoration:
                                    "none"
                                }}
                              >
                                <TypeBadge
                                  height="1.25rem"
                                  type={moveDetails.type}
                                />
                              </Link>
                            ) : (
                              <span
                                style={{
                                  borderRadius:
                                    "999px",
                                  color:
                                    "white",
                                  fontSize:
                                    ".6rem",
                                  padding:
                                    "0.2rem 0.5rem",
                                  textAlign:
                                    "center",
                                  textTransform:
                                    "uppercase"
                                }}
                              >
                                ---
                              </span>
                            )}

                            {/* Power */}

                            <div>
                              {moveDetails?.power ||
                                "---"}
                            </div>



                            <div>
                              {moveDetails?.accuracy ||
                                "---"}
                            </div>

                            {/* Category */}

                            <div>
                              {categoryBadge ? (
                                <img
                                  src={
                                    categoryBadge
                                  }
                                  alt={`${moveDetails.category} move`}
                                  style={{
                                    display:
                                      "block",
                                    width:
                                      "60px",
                                    height:
                                      "28px",
                                    objectFit:
                                      "contain"
                                  }}
                                />
                              ) : (
                                moveDetails?.category ||
                                  "---"
                              )}
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
    </CollapsibleSection>
  );
}

export default LearnsetCard;
