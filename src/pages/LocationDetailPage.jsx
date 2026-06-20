import {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  Link,
  useParams
} from "react-router-dom";
import PokemonSummaryCard from "../components/PokemonSummaryCard";
import Seo from "../seo/Seo";
import { locationSeo } from "../seo/seoConfig";

const ENCOUNTER_LIMIT = 80;

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

function filterVersions(versions, selectedVersion) {
  if (selectedVersion === "all") {
    return versions;
  }

  return versions.filter(
    version =>
      version.version === selectedVersion
  );
}

function EncounterDetails({
  versions
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: ".75rem"
      }}
    >
      {versions.map(version => (
        <div
          key={version.version}
          style={{
            borderTop: "1px solid #444",
            paddingTop: ".75rem",
            textAlign: "left"
          }}
        >
          <strong>
            {capitalize(version.version)}
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
                    border: "1px solid #666",
                    borderRadius: "999px",
                    fontSize: ".8rem",
                    padding: ".3rem .6rem"
                  }}
                >
                  {capitalize(encounter.method)}
                  {" · "}
                  {formatLevelRange(encounter)}
                  {" · "}
                  {encounter.chance}%
                  {encounter.conditions.length >
                    0 &&
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
  );
}

function LocationDetailPage() {
  const { locationName } = useParams();

  const [location, setLocation] =
    useState(null);
  const [loading, setLoading] =
    useState(true);
  const [selectedVersion, setSelectedVersion] =
    useState("all");

  useEffect(() => {
    async function loadLocation() {
      try {
        setLoading(true);

        const response = await fetch(
          `/data/locations/${locationName}.json`
        );

        if (!response.ok) {
          setLocation(null);
          return;
        }

        const data = await response.json();
        setLocation(data);
      } catch (error) {
        console.error(
          "Failed to load location:",
          error
        );
        setLocation(null);
      } finally {
        setLoading(false);
      }
    }

    loadLocation();
  }, [locationName]);

  const versions = useMemo(() => {
    if (!location) return [];

    return [
      ...new Set(
        location.areas.flatMap(area =>
          area.pokemonEncounters.flatMap(
            encounter =>
              encounter.versions.map(
                version => version.version
              )
          )
        )
      )
    ].sort();
  }, [location]);

  if (loading) {
    return (
      <>
        <Seo {...locationSeo(locationName)} />
        <p>Loading...</p>
      </>
    );
  }

  if (!location) {
    return (
      <div
        style={{
          padding: "2rem"
        }}
      >
        <Seo {...locationSeo(locationName)} />
        <h1>Location not found</h1>
        <Link to="/locations">
          Back To Locations
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        margin: "0 auto",
        maxWidth: "1100px",
        padding: "2rem"
      }}
    >
      <Seo {...locationSeo(location)} />

      <Link to="/locations">
        Back To Locations
      </Link>

      <h1>{location.displayName}</h1>

      <p>
        {location.region.displayName}
        {" · "}
        {location.areas.length} areas
      </p>

      {versions.length > 0 && (
        <select
          value={selectedVersion}
          onChange={event =>
            setSelectedVersion(
              event.target.value
            )
          }
          style={{
            backgroundColor: "#2c2c2c",
            border: "2px solid #555",
            borderRadius: "12px",
            color: "white",
            fontSize: "1rem",
            marginBottom: "2rem",
            padding: ".75rem 1rem"
          }}
        >
          <option value="all">
            All Versions
          </option>
          {versions.map(version => (
            <option
              key={version}
              value={version}
            >
              {capitalize(version)}
            </option>
          ))}
        </select>
      )}

      {location.areas.length === 0 ? (
        <p>No location areas found.</p>
      ) : (
        location.areas.map(area => {
          const encounters =
            area.pokemonEncounters
              .map(encounter => ({
                ...encounter,
                versions: filterVersions(
                  encounter.versions,
                  selectedVersion
                )
              }))
              .filter(
                encounter =>
                  encounter.versions.length > 0
              );
          const visibleEncounters =
            encounters.slice(
              0,
              selectedVersion === "all"
                ? ENCOUNTER_LIMIT
                : encounters.length
            );

          return (
            <section
              key={area.name}
              style={{
                border: "1px solid #666",
                borderRadius: "12px",
                marginBottom: "2rem",
                padding: "1rem"
              }}
            >
              <h2>{area.displayName}</h2>

              {area.encounterMethodRates.length >
                0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: ".5rem",
                    justifyContent: "center",
                    marginBottom: "1rem"
                  }}
                >
                  {area.encounterMethodRates.map(
                    rate => (
                      <span
                        key={rate.method}
                        style={{
                          backgroundColor:
                            "#2c2c2c",
                          border:
                            "1px solid #666",
                          borderRadius:
                            "999px",
                          padding:
                            ".35rem .75rem"
                        }}
                      >
                        {capitalize(rate.method)}
                      </span>
                    )
                  )}
                </div>
              )}

              {encounters.length === 0 ? (
                <p>No Pokémon encounters for this filter.</p>
              ) : (
                <>
                  <div
                    style={{
                      display: "grid",
                      gap: "1rem"
                    }}
                  >
                    {visibleEncounters.map(
                      encounter => (
                        <div
                          key={
                            encounter.pokemon.id
                          }
                          style={{
                            alignItems: "start",
                            display: "grid",
                            gap: "1rem",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(90px, 1fr))"
                          }}
                        >
                          <PokemonSummaryCard
                            pokemon={
                              encounter.pokemon
                            }
                            compact={true}
                          />

                          <EncounterDetails
                            versions={
                              encounter.versions
                            }
                          />
                        </div>
                      )
                    )}
                  </div>

                  {visibleEncounters.length <
                    encounters.length && (
                    <p
                      style={{
                        marginTop: "1rem",
                        opacity: 0.8
                      }}
                    >
                      Showing first{" "}
                      {
                        visibleEncounters.length
                      }{" "}
                      encounters. Choose a
                      version to narrow this
                      area.
                    </p>
                  )}
                </>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}

export default LocationDetailPage;
