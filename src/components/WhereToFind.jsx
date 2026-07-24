import {
  useEffect,
  useMemo,
  useState
} from "react";
import { Link } from "react-router-dom";
import CollapsibleSection from "./CollapsibleSection";
import useSessionState from "../hooks/useSessionState";
import useLocalStorageState from "../hooks/useLocalStorageState";
import { sortVersions } from "../constants/versionOrder";

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
  enabled = true,
  pokemonId,
  titleColor,
  titleChevron = false
}) {
  const [expanded, setExpanded] =
    useSessionState(
      `pokemon:${pokemonId}:where-to-find-expanded`,
      false
    );

  const [encounterData, setEncounterData] =
    useState(null);
  const [loaded, setLoaded] =
    useState(false);

  const [
    preferredVersion,
    setPreferredVersion
  ] = useLocalStorageState(
    "pokelore:encounter-version",
    "all"
  );

  useEffect(() => {
    setEncounterData(null);
    setLoaded(false);

    if (!enabled) {
      return undefined;
    }

    let isActive = true;

    async function loadEncounters() {
      try {
        const response = await fetch(
          `/data/pokemonEncounters/${pokemonId}.json`
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (data.locations?.length) {
          if (isActive) {
            setEncounterData(data);
          }
        }
      } catch (error) {
        console.warn(
          "Failed to load encounter data:",
          error
        );
      } finally {
        if (isActive) {
          setLoaded(true);
        }
      }
    }

    loadEncounters();

    return () => {
      isActive = false;
    };
  }, [
    enabled,
    pokemonId
  ]);

  const versionOptions = useMemo(
    () => [
      "all",
      ...sortVersions(
        new Set(
          encounterData?.locations?.flatMap(
            location =>
              location.areas.flatMap(area =>
                area.versions.map(
                  version => version.version
                )
              )
          ) ?? []
        )
      )
    ],
    [encounterData]
  );
  const selectedVersion =
    versionOptions.includes(
      preferredVersion
    )
      ? preferredVersion
      : "all";

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

  const hasEncounterData =
    encounterData?.locations?.length > 0;

  return (
    <CollapsibleSection
      title="Where To Find"
      summary={
        !loaded
          ? "Loading locations"
          : hasEncounterData
            ? `${visibleLocations.length}${
                selectedVersion === "all"
                  ? ""
                  : ` / ${encounterData.locations.length}`
              } locations`
            : "No known locations"
      }
      expanded={expanded}
      titleColor={titleColor}
      titleChevron={titleChevron}
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
          {!hasEncounterData && (
            <p>
              {loaded
                ? "No encounter location data is available yet."
                : "Loading encounter location data..."}
            </p>
          )}

          {hasEncounterData && (
          <div
            style={{
              marginBottom: ".25rem",
              textAlign: "left"
            }}
          >
            <select
              aria-label="Encounter version"
              value={selectedVersion}
              onChange={event =>
                setPreferredVersion(
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
          )}

          {hasEncounterData &&
            visibleLocations.length === 0 && (
            <p>
              No encounter locations for this
              version.
            </p>
          )}

          {hasEncounterData && visibleLocations.map(location => (
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
