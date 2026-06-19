import {
  useMemo,
  useState
} from "react";

function formatAcquisitionType(type) {
  if (!type) return "Unknown";

  return type
    .split("-")
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function AcquisitionMethods({
  acquisition
}) {
  const [expanded, setExpanded] =
    useState(false);

  const [selectedGeneration, setSelectedGeneration] =
    useState("all");

  const acquisitionList = useMemo(
    () =>
      Array.isArray(acquisition)
        ? acquisition
        : [],
    [acquisition]
  );

  const generations = useMemo(
    () => [
      "all",
      ...new Set(
        acquisitionList.map(
          method =>
            method.generation
        )
      )
    ],
    [acquisitionList]
  );

  const filteredAcquisition = useMemo(
    () =>
      selectedGeneration === "all"
        ? acquisitionList
        : acquisitionList.filter(
            method =>
              String(
                method.generation
              ) === selectedGeneration
          ),
    [
      acquisitionList,
      selectedGeneration
    ]
  );

  if (
    acquisitionList.length === 0
  ) {
    return (
      <section
        style={{
          border: "1px solid #666",
          borderRadius: "12px",
          marginBottom: "2rem",
          padding: "1rem"
        }}
      >
        <button
          type="button"
          onClick={() =>
            setExpanded(
              isExpanded => !isExpanded
            )
          }
          style={{
            alignItems: "center",
            background: "none",
            border: "none",
            color: "inherit",
            cursor: "pointer",
            display: "flex",
            font: "inherit",
            justifyContent:
              "space-between",
            padding: 0,
            width: "100%"
          }}
        >
          <h2>Acquisition</h2>
          <span>
            {expanded ? "▲" : "▼"}
          </span>
        </button>

        {expanded && (
          <p>No location data yet.</p>
        )}
      </section>
    );
  }

  return (
    <section
      style={{
        marginBottom: "2rem"
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          justifyContent:
            "space-between",
          marginBottom: expanded
            ? "1rem"
            : 0
        }}
      >
        <button
          type="button"
          onClick={() =>
            setExpanded(
              isExpanded => !isExpanded
            )
          }
          style={{
            alignItems: "center",
            background: "none",
            border: "none",
            color: "inherit",
            cursor: "pointer",
            display: "flex",
            font: "inherit",
            gap: ".75rem",
            padding: 0
          }}
        >
          <h2
            style={{
              margin: 0
            }}
          >
            Acquisition
          </h2>

          <span>
            {expanded ? "▲" : "▼"}
          </span>
        </button>

        {expanded && (
          <select
            value={selectedGeneration}
            onChange={event =>
              setSelectedGeneration(
                event.target.value
              )
            }
            style={{
              backgroundColor:
                "#2c2c2c",
              border:
                "2px solid #555",
              borderRadius: "12px",
              color: "white",
              fontSize: "1rem",
              padding: ".55rem .8rem"
            }}
          >
            {generations.map(
              generation => (
                <option
                  key={generation}
                  value={generation}
                >
                  {generation === "all"
                    ? "All Generations"
                    : `Generation ${generation}`}
                </option>
              )
            )}
          </select>
        )}
      </div>

      {expanded && (
        <div
          style={{
            display: "grid",
            gap: "1rem",
            textAlign: "left"
          }}
        >
          {filteredAcquisition.map(
            (method, index) => (
              <article
                key={`${method.generation}-${method.location}-${method.method}-${index}`}
                style={{
                  border:
                    "1px solid #666",
                  borderRadius: "12px",
                  padding: "1rem"
                }}
              >
                <div
                  style={{
                    alignItems: "center",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: ".5rem",
                    justifyContent:
                      "space-between",
                    marginBottom:
                      ".75rem"
                  }}
                >
                  <h3
                    style={{
                      margin: 0
                    }}
                  >
                    Generation{" "}
                    {method.generation}
                  </h3>

                  <span
                    style={{
                      border:
                        "1px solid #888",
                      borderRadius:
                        "999px",
                      fontSize: ".8rem",
                      padding:
                        ".25rem .65rem"
                    }}
                  >
                    {formatAcquisitionType(
                      method.acquisitionType
                    )}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: ".75rem"
                  }}
                >
                  <div>
                    <strong>Games</strong>
                    <p>
                      {method.games.join(
                        ", "
                      )}
                    </p>
                  </div>

                  <div>
                    <strong>
                      Location
                    </strong>
                    <p>
                      {method.location}
                    </p>
                  </div>

                  <div>
                    <strong>Method</strong>
                    <p>{method.method}</p>
                  </div>

                  {method.requirements
                    ?.length > 0 && (
                    <div>
                      <strong>
                        Requirements
                      </strong>
                      <ul
                        style={{
                          margin:
                            ".35rem 0 0",
                          paddingLeft:
                            "1.25rem"
                        }}
                      >
                        {method.requirements.map(
                          requirement => (
                            <li
                              key={
                                requirement
                              }
                            >
                              {requirement}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: ".5rem"
                    }}
                  >
                    <span>
                      <strong>
                        Repeatable:
                      </strong>{" "}
                      {method.repeatable
                        ? "Yes"
                        : "No"}
                    </span>

                    <span>
                      <strong>
                        Version
                        Exclusive:
                      </strong>{" "}
                      {method.versionExclusive
                        ? "Yes"
                        : "No"}
                    </span>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
}

export default AcquisitionMethods;
