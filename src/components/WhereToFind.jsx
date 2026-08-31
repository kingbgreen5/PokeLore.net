import {
  useEffect,
  useMemo,
  useState
} from "react";
import { Link } from "react-router-dom";
import CollapsibleSection from "./CollapsibleSection";
import useSessionState from "../hooks/useSessionState";
import useLocalStorageState from "../hooks/useLocalStorageState";
import {
  ALL_ENCOUNTER_VERSIONS,
  filterEncounterLocationsByVersion,
  formatEncounterConditions,
  formatEncounterLabel,
  formatEncounterLevelRange,
  formatEncounterMethodName,
  formatEncounterSummary,
  formatEncounterVersionName,
  getEncounterVersions,
  getLocationEncounterSummary,
  getSelectedEncounterVersion,
  hasEncounterLocations
} from "../utils/encounterDisplay";

function WhereToFind({
  enabled = true,
  initialPreview = null,
  pokemonId,
  pokemonName,
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
    () => getEncounterVersions(encounterData),
    [encounterData]
  );
  const selectedVersion =
    getSelectedEncounterVersion(
      encounterData,
      preferredVersion
    );

  const visibleLocations = useMemo(
    () =>
      filterEncounterLocationsByVersion(
        encounterData,
        selectedVersion
      ),
    [
      encounterData,
      selectedVersion
    ]
  );

  const hasEncounterData =
    hasEncounterLocations(encounterData);
  const previewMatches =
    Number(initialPreview?.pokemonId) ===
    Number(pokemonId);
  const previewLocationCount =
    previewMatches &&
    Number.isFinite(
      Number(initialPreview?.locationCount)
    )
      ? Number(initialPreview.locationCount)
      : null;
  const title = pokemonName
    ? `Where To Find ${pokemonName}`
    : "Where To Find";
  const locationSummary =
    !loaded && previewLocationCount !== null
      ? previewLocationCount
      : visibleLocations.length;

  return (
    <CollapsibleSection
      title={title}
      summary={
        !loaded
          ? previewLocationCount !== null
            ? previewLocationCount > 0
              ? `${previewLocationCount} locations`
              : "No known locations"
            : "Loading locations"
          : hasEncounterData
            ? `${locationSummary}${
                selectedVersion ===
                ALL_ENCOUNTER_VERSIONS
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
                : previewLocationCount === 0
                  ? "No known encounter locations."
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
                    : formatEncounterVersionName(
                        version
                      )}
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

          {hasEncounterData && visibleLocations.map(location => {
              const summaryText =
                formatEncounterSummary(
                  getLocationEncounterSummary(
                    location,
                    selectedVersion
                  )
                );

              return (
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
                <span
                  style={{
                    display: "block"
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
                  {formatEncounterLabel(
                    location.location.region
                  )}
                </span>
                {summaryText && (
                  <span
                    style={{
                      display: "block",
                      fontSize: ".88rem",
                      fontWeight: "normal",
                      marginTop: ".25rem",
                      opacity: 0.78
                    }}
                  >
                    {summaryText}
                  </span>
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
                        {formatEncounterVersionName(
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
                              {formatEncounterMethodName(
                                encounter.method
                              )}
                              {" · "}
                              {formatEncounterLevelRange(
                                encounter
                              )}
                              {" · "}
                              {
                                encounter.chance
                              }
                              %
                              {(encounter
                                .conditions ?? [])
                                .length > 0 &&
                                ` · ${formatEncounterConditions(
                                  encounter.conditions
                                )}`}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </details>
              );
            })}
    </CollapsibleSection>
  );
}

export default WhereToFind;
