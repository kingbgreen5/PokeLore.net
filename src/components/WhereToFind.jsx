import {
  useEffect,
  useMemo,
  useState
} from "react";
import { Link } from "react-router-dom";
import CollapsibleSection from "./CollapsibleSection";
import useSessionState from "../hooks/useSessionState";

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
  const [expanded, setExpanded] =
    useSessionState(
      `pokemon:${pokemonId}:where-to-find-expanded`,
      false
    );

  const [encounterData, setEncounterData] =
    useState(null);

  const [selectedVersion, setSelectedVersion] =
    useState("all");

  useEffect(() => {
    async function loadEncounters() {
      try {
        setEncounterData(null);
        setSelectedVersion("all");

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

  const versionOptions = useMemo(
    () => [
      "all",
      ...new Set(
        encounterData?.locations?.flatMap(
          location =>
            location.areas.flatMap(area =>
              area.versions.map(
                version => version.version
              )
            )
        ) ?? []
      )
    ].sort((a, b) => {
      if (a === "all") return -1;
      if (b === "all") return 1;
      return a.localeCompare(b);
    }),
    [encounterData]
  );

  const visibleLocations = useMemo(
    () =>
      encounterData?.locations
        ?.map(location => ({
          ...location,
          areas: location.areas
            .map(area => ({
              ...area,
              versions:
                selectedVersion === "all"
                  ? area.versions
                  : area.versions.filter(
                      version =>
                        version.version ===
                        selectedVersion
                    )
            }))
            .filter(
              area =>
                area.versions.length > 0
            )
        }))
        .filter(
          location =>
            location.areas.length > 0
        ) ?? [],
    [
      encounterData,
      selectedVersion
    ]
  );

  if (!encounterData?.locations?.length) {
    return null;
  }

  return (
    <CollapsibleSection
      title="Where To Find"
      summary={`${visibleLocations.length}${
        selectedVersion === "all"
          ? ""
          : ` / ${encounterData.locations.length}`
      } locations`}
      expanded={expanded}
      onToggle={() =>
        setExpanded(!expanded)
      }
      style={{
        marginTop: "1rem"
      }}
      contentStyle={{
        display: "grid",
        gap: "1rem",
        marginTop: "1rem"
      }}
    >
          <div
            style={{
              marginBottom: ".25rem",
              textAlign: "left"
            }}
          >
            <select
              value={selectedVersion}
              onChange={event =>
                setSelectedVersion(
                  event.target.value
                )
              }
              style={{
                padding: "0.5rem",
                borderRadius: "8px",
                border: "1px solid #666"
              }}
            >
              {versionOptions.map(version => (
                <option
                  key={version}
                  value={version}
                >
                  {version === "all"
                    ? "All Versions"
                    : capitalize(version)}
                </option>
              ))}
            </select>
          </div>

          {visibleLocations.length === 0 && (
            <p>
              No encounter locations for this
              version.
            </p>
          )}

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
    </CollapsibleSection>
  );
}

export default WhereToFind;
