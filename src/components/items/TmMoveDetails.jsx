import {
  useEffect,
  useMemo,
  useState
} from "react";
import MoveSummaryCard from "../MoveSummaryCard";

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

function generationForVersionGroup(
  versionGroup
) {
  if (
    [
      "red-blue",
      "yellow"
    ].includes(versionGroup)
  ) {
    return "Generation I";
  }

  if (
    [
      "gold-silver",
      "crystal"
    ].includes(versionGroup)
  ) {
    return "Generation II";
  }

  if (
    [
      "ruby-sapphire",
      "emerald",
      "firered-leafgreen",
      "colosseum",
      "xd"
    ].includes(versionGroup)
  ) {
    return "Generation III";
  }

  if (
    [
      "diamond-pearl",
      "platinum",
      "heartgold-soulsilver"
    ].includes(versionGroup)
  ) {
    return "Generation IV";
  }

  if (
    [
      "black-white",
      "black-2-white-2"
    ].includes(versionGroup)
  ) {
    return "Generation V";
  }

  if (
    [
      "x-y",
      "omega-ruby-alpha-sapphire"
    ].includes(versionGroup)
  ) {
    return "Generation VI";
  }

  if (
    [
      "sun-moon",
      "ultra-sun-ultra-moon",
      "lets-go-pikachu-lets-go-eevee"
    ].includes(versionGroup)
  ) {
    return "Generation VII";
  }

  if (
    [
      "sword-shield",
      "the-isle-of-armor",
      "the-crown-tundra",
      "brilliant-diamond-and-shining-pearl",
      "legends-arceus"
    ].includes(versionGroup)
  ) {
    return "Generation VIII";
  }

  if (
    [
      "scarlet-violet",
      "the-teal-mask",
      "the-indigo-disk"
    ].includes(versionGroup)
  ) {
    return "Generation IX";
  }

  return "Other Games";
}

function TmMoveDetails({
  item
}) {
  const [movesData, setMovesData] =
    useState({});

  const hasMachineData =
    item?.machines?.some(
      machine =>
        machine.move?.name ||
        machine.versionGroup
    ) ?? false;

  useEffect(() => {
    if (!hasMachineData) {
      return undefined;
    }

    let ignore = false;

    async function loadMoves() {
      try {
        const response =
          await fetch(
            "/data/moves.json"
          );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        if (!ignore) {
          setMovesData(data);
        }
      } catch (error) {
        console.error(
          "Failed to load move data:",
          error
        );
      }
    }

    loadMoves();

    return () => {
      ignore = true;
    };
  }, [hasMachineData]);

  const machineEntries =
    useMemo(
      () =>
        item?.machines?.filter(
          machine =>
            machine.move?.name ||
            machine.versionGroup
        ) ?? [],
      [item]
    );

  const groupedByGeneration =
    useMemo(() => {
      const groups = new Map();

      for (const machine of machineEntries) {
        const generation =
          generationForVersionGroup(
            machine.versionGroup
          );

        if (!groups.has(generation)) {
          groups.set(
            generation,
            []
          );
        }

        groups
          .get(generation)
          .push(machine);
      }

      return Array.from(
        groups,
        ([generation, entries]) => {
          const moveGroups =
            new Map();

          for (const entry of entries) {
            const moveName =
              entry.move?.name;

            if (!moveName) {
              continue;
            }

            if (!moveGroups.has(moveName)) {
              moveGroups.set(
                moveName,
                []
              );
            }

            moveGroups
              .get(moveName)
              .push(entry);
          }

          return {
            generation,
            moveGroups:
              Array.from(
                moveGroups,
                ([
                  moveName,
                  moveEntries
                ]) => ({
                  moveName,
                  entries:
                    moveEntries
                })
              )
          };
        }
      );
    }, [machineEntries]);

  if (!machineEntries.length) {
    return null;
  }

  return (
    <section
      style={{
        border: "1px solid #666",
        borderRadius: "12px",
        marginBottom: "2rem",
        padding: "1rem"
      }}
    >
      <h2>Machine Moves</h2>



{/* 
      <p
        style={{
          lineHeight: 1.6,
          marginTop: 0,
          opacity: 0.85
        }}
      >
        {item.displayName} teaches{" "}
        {taughtMoveNames.length > 0
          ? taughtMoveNames
              .map(capitalize)
              .join(", ")
          : "different moves"}{" "}
        depending on the game.
      </p>
 */}


{/* 
      <div
        style={{
          display: "grid",
          gap: "1rem",
          marginBottom: "1.25rem"
        }}
      >
        {taughtMoveNames.map(moveName => {
          const move =
            movesData[moveName];

          return (
            <div
              key={moveName}
              style={{
                backgroundColor:
                  "#2c2c2c",
                border:
                  "1px solid #555",
                borderRadius: "8px",
                padding: "1rem"
              }}
            >
              <div
                style={{
                  alignItems:
                    "center",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: ".6rem",
                  justifyContent:
                    "space-between"
                }}
              >
                <Link
                  to={`/move/${moveName}`}
                  style={{
                    color: "#ff8c42",
                    fontSize: "1.15rem",
                    fontWeight: "bold",
                    textDecoration:
                      "none"
                  }}
                >
                  {capitalize(moveName)}
                </Link>

                {move?.type && (
                  <Link
                    to={`/type/${move.type}`}
                    style={{
                      backgroundColor:
                        typeColors[
                          move.type
                        ],
                      borderRadius:
                        "999px",
                      color: "white",
                      fontSize: ".75rem",
                      fontWeight:
                        "bold",
                      padding:
                        ".25rem .65rem",
                      textDecoration:
                        "none",
                      textTransform:
                        "uppercase"
                    }}
                  >
                    {move.type}
                  </Link>
                )}
              </div>



              {move && (
                <div
                  style={{
                    display: "grid",
                    gap: ".75rem",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(90px, 1fr))",
                    marginTop: "1rem",
                    textAlign: "center"
                  }}
                >
                  <MoveStat
                    label="Category"
                    value={
                      move.category
                        ? capitalize(
                            move.category
                          )
                        : "-"
                    }
                  />
                  <MoveStat
                    label="Power"
                    value={move.power}
                  />
                  <MoveStat
                    label="Accuracy"
                    value={move.accuracy}
                  />
                  <MoveStat
                    label="PP"
                    value={move.pp}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
 */}



      <div
        style={{
          display: "grid",
          gap: "1rem"
      
        }}
      >
        {groupedByGeneration.map(
          ({ generation, moveGroups }) => (
            <div key={generation}>
              <h3
                style={{
                  marginBottom: ".5rem"
                }}
              >
                {generation}
              </h3>

              <div
                style={{
                  alignItems:
                    "start",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: ".5rem",
                  justifyContent:
                    "center"
                }}
              >
                {moveGroups.map(
                  ({
                    moveName,
                    entries
                  }) => {
                    const move =
                      movesData[moveName];

                    return (
                    <div
                      key={`${generation}-${moveName}`}
                      style={{
                        alignItems:
                          "center",
                        display:
                          "flex",
                        flexDirection:
                          "column",
                        gap: ".5rem",
                        width: "150px"
                      }}
                    >
                      {move ? (
                        <MoveSummaryCard
                          name={moveName}
                          move={move}
                        />
                      ) : (
                        <div
                          style={{
                            alignItems:
                              "center",
                            backgroundColor:
                              "#2c2c2c",
                            border:
                              "2px solid #555",
                            borderRadius:
                              "18px",
                            boxSizing:
                              "border-box",
                            display:
                              "flex",
                            minHeight:
                              "150px",
                            padding:
                              ".35rem",
                            textAlign:
                              "center",
                            width:
                              "150px"
                          }}
                        >
                          {capitalize(
                            moveName
                          )}
                        </div>
                      )}

                      <div
                        style={{
                          display:
                            "flex",
                          flexWrap:
                            "wrap",
                          gap: ".25rem",
                          justifyContent:
                            "center"
                        }}
                      >
                        {entries.map(
                          entry => (
                            <span
                              key={`${entry.versionGroup}-${entry.machineId ?? entry.machineUrl}`}
                              style={{
                                backgroundColor:
                                  "#252525",
                                border:
                                  "1px solid #444",
                                borderRadius:
                                  "999px",
                                fontSize:
                                  ".68rem",
                                padding:
                                  ".2rem .45rem"
                              }}
                            >
                              {capitalize(
                                entry.versionGroup
                              )}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                    );
                  }
                )}
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}

export default TmMoveDetails;
