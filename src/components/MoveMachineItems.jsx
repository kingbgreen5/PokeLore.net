import { Link } from "react-router-dom";

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

function groupMachineItems(
  machineItems
) {
  const generationGroups =
    new Map();

  for (const machineItem of machineItems) {
    if (
      !generationGroups.has(
        machineItem.generation
      )
    ) {
      generationGroups.set(
        machineItem.generation,
        new Map()
      );
    }

    const itemGroups =
      generationGroups.get(
        machineItem.generation
      );

    if (
      !itemGroups.has(
        machineItem.itemName
      )
    ) {
      itemGroups.set(
        machineItem.itemName,
        {
          item:
            machineItem,
          versionGroups: []
        }
      );
    }

    itemGroups
      .get(machineItem.itemName)
      .versionGroups
      .push(
        machineItem.versionGroup
      );
  }

  return Array.from(
    generationGroups,
    ([generation, itemGroups]) => ({
      generation,
      items:
        Array.from(
          itemGroups.values()
        )
    })
  );
}

function generationRank(generation) {
  const index = [
    "Generation I",
    "Generation II",
    "Generation III",
    "Generation IV",
    "Generation V",
    "Generation VI",
    "Generation VII",
    "Generation VIII",
    "Generation IX",
    "Other Games"
  ].indexOf(generation);

  return index === -1
    ? 999
    : index;
}

function MoveMachineItems({
  machineItems = []
}) {
  if (!machineItems.length) {
    return null;
  }

  const groupedMachineItems =
    groupMachineItems(machineItems)
      .sort(
        (a, b) =>
          generationRank(
            a.generation
          ) -
          generationRank(
            b.generation
          )
      );

  return (
    <section
      style={{
        marginBottom: "3rem"
      }}
    >
      <h2>
        TMs, HMs, and TRs
      </h2>

      <div
        style={{
          display: "grid",
          gap: "1.25rem"
        }}
      >
        {groupedMachineItems.map(
          ({ generation, items }) => (
            <div key={generation}>
              <h3
                style={{
                  marginBottom: ".75rem"
                }}
              >
                {generation}
              </h3>

              <div
                style={{
                  display: "grid",
                  gap: "1rem",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(150px, 1fr))"
                }}
              >
                {items.map(
                  ({
                    item,
                    versionGroups
                  }) => (
                    <Link
                      key={`${generation}-${item.itemName}`}
                      to={`/item/${item.itemName}`}
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
                        color:
                          "white",
                        display:
                          "flex",
                        flexDirection:
                          "column",
                        justifyContent:
                          "space-between",
                        minHeight:
                          "150px",
                        padding:
                          ".75rem",
                        textAlign:
                          "center",
                        textDecoration:
                          "none"
                      }}
                    >
                      <div>
                        {item.itemSprite && (
                          <img
                            src={
                              item.itemSprite
                            }
                            alt={
                              item.itemDisplayName
                            }
                            style={{
                              height:
                                "42px",
                              imageRendering:
                                "pixelated",
                              width:
                                "42px"
                            }}
                          />
                        )}

                        <h4
                          style={{
                            margin:
                              ".35rem 0 .2rem"
                          }}
                        >
                          {
                            item.itemDisplayName
                          }
                        </h4>

                        <span
                          style={{
                            color:
                              "#ff8c42",
                            fontSize:
                              ".75rem",
                            fontWeight:
                              "bold"
                          }}
                        >
                          {item.itemKind}
                        </span>
                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          flexWrap:
                            "wrap",
                          gap: ".25rem",
                          justifyContent:
                            "center",
                          marginTop:
                            ".65rem"
                        }}
                      >
                        {versionGroups.map(
                          versionGroup => (
                            <span
                              key={versionGroup}
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
                                versionGroup
                              )}
                            </span>
                          )
                        )}
                      </div>
                    </Link>
                  )
                )}
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}

export default MoveMachineItems;
