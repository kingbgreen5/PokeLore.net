import {
  useEffect,
  useMemo,
  useState
} from "react";
import { Link } from "react-router-dom";

function capitalize(text) {
  return String(text)
    .split("-")
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function formatLevelRange(encounter) {
  if (
    encounter.minLevel === null &&
    encounter.maxLevel === null
  ) {
    return "-";
  }

  if (
    encounter.minLevel === encounter.maxLevel
  ) {
    return `Lv. ${encounter.minLevel}`;
  }

  return `Lv. ${encounter.minLevel}-${encounter.maxLevel}`;
}

function WhereToFind({
  pokemonId
}) {
  const [encounterData, setEncounterData] =
    useState(null);

  useEffect(() => {
    async function loadEncounters() {
      try {
        setEncounterData(null);

        const response = await fetch(
          `/data/pokemonEncounters/${pokemonId}.json`
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (data.locations?.length) {
          setEncounterData(data);
        }
      } catch (error) {
        console.warn(
          "Failed to load encounter data:",
          error
        );
      }
    }

    loadEncounters();
  }, [pokemonId]);

  const visibleLocations = useMemo(
    () =>
      encounterData?.locations?.slice(0, 20) ??
      [],
    [encounterData]
  );

  if (!visibleLocations.length) {
    return null;
  }

  return (
    <section
      style={{
        marginTop: "2rem"
      }}
    >
      <h2>Where To Find</h2>

      <div
        style={{
          display: "grid",
          gap: "1rem"
        }}
      >
        {visibleLocations.map(location => (
          <details
            key={location.location.name}
            style={{
              border: "1px solid #666",
              borderRadius: "12px",
              padding: "1rem"
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              <Link
                to={`/location/${location.location.name}`}
              >
                {
                  location.location
                    .displayName
                }
              </Link>
              {" · "}
              {capitalize(
                location.location.region
              )}
            </summary>

            {location.areas.map(area => (
              <div
                key={area.name}
                style={{
                  marginTop: "1rem",
                  textAlign: "left"
                }}
              >
                <h3>{area.displayName}</h3>

                {area.versions.map(version => (
                  <div
                    key={version.version}
                    style={{
                      borderTop:
                        "1px solid #444",
                      paddingTop: ".75rem"
                    }}
                  >
                    <strong>
                      {capitalize(
                        version.version
                      )}
                    </strong>
                    <span
                      style={{
                        opacity: 0.75
                      }}
                    >
                      {" "}
                      max {version.maxChance}%
                    </span>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: ".5rem",
                        marginTop: ".5rem"
                      }}
                    >
                      {version.encounters.map(
                        (encounter, index) => (
                          <span
                            key={`${version.version}-${index}`}
                            style={{
                              border:
                                "1px solid #666",
                              borderRadius:
                                "999px",
                              fontSize:
                                ".8rem",
                              padding:
                                ".3rem .6rem"
                            }}
                          >
                            {capitalize(
                              encounter.method
                            )}
                            {" · "}
                            {formatLevelRange(
                              encounter
                            )}
                            {" · "}
                            {
                              encounter.chance
                            }
                            %
                            {encounter
                              .conditions
                              .length > 0 &&
                              ` · ${encounter.conditions
                                .map(capitalize)
                                .join(", ")}`}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </details>
        ))}
      </div>

      {encounterData.locations.length >
        visibleLocations.length && (
        <p
          style={{
            opacity: 0.8
          }}
        >
          Showing first{" "}
          {visibleLocations.length} of{" "}
          {encounterData.locations.length}{" "}
          locations.
        </p>
      )}
    </section>
  );
}

export default WhereToFind;
