import {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  Link,
  useParams
} from "react-router-dom";
import CollapsibleSection from "../components/CollapsibleSection";
import PokemonSummaryCard from "../components/PokemonSummaryCard";
import useQueryParamState from "../hooks/useQueryParamState";
import Seo from "../seo/Seo";
import { locationSeo } from "../seo/seoConfig";
import { readJsonFile } from "../utils/readJsonFile";
import {
  compareVersions,
  sortVersions
} from "../constants/versionOrder";

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

function filterMethodRates(
  methodRates,
  selectedVersion
) {
  if (selectedVersion === "all") {
    return methodRates;
  }

  return methodRates
    .map(rate => ({
      ...rate,
      versionDetails:
        rate.versionDetails?.filter(
          detail =>
            detail.version ===
            selectedVersion
        ) ?? []
    }))
    .filter(
      rate =>
      rate.versionDetails.length > 0
    );
}

function formatItemMethodType(type) {
  return capitalize(type ?? "method");
}

function versionDisplayToSlug(version) {
  return String(version ?? "")
    .replace(/^Pokémon\s+/i, "")
    .replace(/^Pokemon\s+/i, "")
    .toLowerCase()
    .replace(/[':]/g, "")
    .replace(/\s+/g, "-");
}

function compareDisplayVersions(a, b) {
  return compareVersions(
    versionDisplayToSlug(a),
    versionDisplayToSlug(b)
  );
}

function getLocationItemRows(locationItems) {
  return (
    locationItems?.items?.flatMap(itemEntry =>
      itemEntry.versions.flatMap(
        versionEntry =>
          versionEntry.methods.map(
            (method, index) => ({
              item: itemEntry.item,
              version:
                versionEntry.version,
              method,
              key: `${itemEntry.item.name}-${versionEntry.version}-${method.type}-${method.details}-${index}`
            })
          )
      )
    ) ?? []
  );
}

function formatList(values) {
  if (values.length <= 1) {
    return values[0] ?? "";
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, and ${
    values[values.length - 1]
  }`;
}

function formatVersionList(versions) {
  const cleanedVersions =
    versions.map(version =>
      String(version ?? "").trim()
    );
  const pokemonPrefix =
    cleanedVersions.every(version =>
      version.startsWith("Pokémon ")
    );

  if (!pokemonPrefix) {
    return formatList(cleanedVersions);
  }

  return `Pokémon ${formatList(
    cleanedVersions.map(version =>
      version.replace(/^Pokémon\s+/, "")
    )
  )}`;
}

function arraysMatch(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  return a.every(
    (value, index) => value === b[index]
  );
}

function formatItemAnswer(
  locationDisplayName,
  itemGroup
) {
  const versions = formatVersionList(
    itemGroup.versions
  );

  return `Obtainable at ${locationDisplayName} in ${versions}.`;
}

function methodGroupKey(method) {
  return [
    method.type ?? "",
    method.area ?? "",
    method.details ?? "",
    method.notes ?? "",
    method.repeatable ? "repeatable" : "",
    method.versionExclusive
      ? "version-exclusive"
      : "",
    ...(method.requirements ?? [])
  ].join("|");
}

function groupItemRows(itemRows) {
  const itemGroups = new Map();

  itemRows.forEach(row => {
    if (!itemGroups.has(row.item.name)) {
      itemGroups.set(row.item.name, {
        item: row.item,
        versions: new Set(),
        methodsByKey: new Map()
      });
    }

    const itemGroup =
      itemGroups.get(row.item.name);
    itemGroup.versions.add(row.version);

    const key =
      methodGroupKey(row.method);

    if (!itemGroup.methodsByKey.has(key)) {
      itemGroup.methodsByKey.set(key, {
        ...row.method,
        versions: new Set()
      });
    }

    itemGroup.methodsByKey
      .get(key)
      .versions.add(row.version);
  });

  return Array.from(itemGroups.values()).map(
    itemGroup => ({
      item: itemGroup.item,
      versions: Array.from(
        itemGroup.versions
      ).sort(compareDisplayVersions),
      methods: Array.from(
        itemGroup.methodsByKey.values()
      ).map(method => ({
        ...method,
        versions: Array.from(
          method.versions
        ).sort(compareDisplayVersions)
      }))
    })
  );
}

function EncounterDetails({
  versions
}) {
  return (
    <div className="encounter div"
      style={{
        display: "grid",
        gap: ".75rem"
      
      }}
    >
      {versions.map(version => (
        <div
          key={version.version}
          style={{
               border: "1px solid #666",
               borderRadius: "18px",
            padding: ".4rem",
            textAlign: "center"
          }}
        >
          <strong>
            {capitalize(version.version)}
          </strong>


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
                    // border: "1px solid #666",
                    // borderRadius: "999px",
                    fontSize: ".8rem",
                    padding: ".3rem .3rem"
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

function LocationItemsSection({
  expanded,
  locationItems,
  onToggle
}) {
  const [
    selectedItemVersion,
    setSelectedItemVersion
  ] = useState("all");
  const locationDisplayName =
    locationItems?.location
      ?.displayName ?? "this location";
  const itemRows = useMemo(
    () =>
      getLocationItemRows(locationItems),
    [locationItems]
  );
  const itemVersions = useMemo(
    () => [
      "all",
      ...Array.from(
        new Set(
          itemRows.map(row => row.version)
        )
      ).sort(compareDisplayVersions)
    ],
    [itemRows]
  );
  const filteredItemRows = useMemo(
    () =>
      selectedItemVersion === "all"
        ? itemRows
        : itemRows.filter(
            row =>
              row.version ===
              selectedItemVersion
          ),
    [
      itemRows,
      selectedItemVersion
    ]
  );
  const groupedItems = useMemo(
    () =>
      groupItemRows(filteredItemRows),
    [filteredItemRows]
  );
  const previewItems =
    locationItems?.items
      ?.slice(0, 6)
      .map(
        itemEntry =>
          itemEntry.item.displayName
      ) ?? [];

  if (
    !locationItems?.items ||
    locationItems.items.length === 0
  ) {
    return null;
  }

  return (
    <CollapsibleSection
      title={`Items Found in ${locationDisplayName}`}
      summary={`${locationItems.items.length} items`}
      expanded={expanded}
      onToggle={onToggle}
      style={{
        boxSizing: "border-box",
        marginBottom: "2rem",
        width: "100%"
      }}
      contentStyle={{
        display: "grid",
        gap: "1rem",
        marginTop: "1rem"
      }}
    >
      <section
        data-section="location-items-seo-answer"
        itemScope
        itemType="https://schema.org/Question"
        style={{
          border: "1px solid #555",
          borderRadius: "12px",
          padding: "1rem",
          textAlign: "left"
        }}
      >
        <meta
          itemProp="name"
          content={`What items can be found in ${locationDisplayName}?`}
        />

        <div
          itemProp="acceptedAnswer"
          itemScope
          itemType="https://schema.org/Answer"
        >
          <p
            itemProp="text"
            style={{
              lineHeight: 1.5,
              marginBottom: 0
            }}
          >
            {locationDisplayName} has{" "}
            {locationItems.items.length} obtainable{" "}
            {locationItems.items.length === 1
              ? "item"
              : "items"}
            {previewItems.length > 0 &&
              `, including ${previewItems.join(", ")}`}
            . Use the version filter to see the
            item locations, methods, areas, and
            requirements for a specific Pokémon
            game.
          </p>
        </div>
      </section>

      {itemVersions.length > 1 && (
        <div
          style={{
            marginBottom: ".5rem",
            textAlign: "left"
          }}
        >
          <label
            htmlFor="location-item-version-filter"
            style={{
              display: "block",
              fontWeight: 700,
              marginBottom: ".5rem"
            }}
          >
            Filter Items By Version
          </label>

          <select
            id="location-item-version-filter"
            value={selectedItemVersion}
            onChange={event =>
              setSelectedItemVersion(
                event.target.value
              )
            }
            style={{
              backgroundColor: "#2c2c2c",
              border: "2px solid #555",
              borderRadius: "12px",
              color: "white",
              fontSize: "1rem",
              padding: ".75rem 1rem"
            }}
          >
            {itemVersions.map(version => (
              <option
                key={version}
                value={version}
              >
                {version === "all"
                  ? "All Versions"
                  : version}
              </option>
            ))}
          </select>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))"
        }}
      >
        {groupedItems.map(itemGroup => (
          <article
            key={itemGroup.item.name}
            style={{
              border: "1px solid #666",
              borderRadius: "12px",
              padding: "1rem",
              textAlign: "left"
            }}
          >
            <Link
              to={`/item/${itemGroup.item.name}`}
              style={{
                alignItems: "center",
                display: "flex",
                gap: ".75rem",
                marginBottom: ".75rem"
              }}
            >
              {itemGroup.item.sprite && (
                <img
                  src={itemGroup.item.sprite}
                  alt=""
                  style={{
                    height: "32px",
                    imageRendering:
                      "pixelated",
                    width: "32px"
                  }}
                />
              )}
              <strong>
                {itemGroup.item.displayName}
              </strong>
            </Link>

            <p
              style={{
                lineHeight: 1.5,
                marginTop: 0
              }}
            >
              {formatItemAnswer(
                locationDisplayName,
                itemGroup
              )}
            </p>

            <div
              style={{
                display: "grid",
                gap: ".75rem"
              }}
            >
              <div
                style={{
                  display: "grid",
                  gap: ".75rem"
                }}
              >
                {itemGroup.methods.map(
                  (method, index) => (
                    <div
                      key={`${methodGroupKey(method)}-${index}`}
                      style={{
                        borderTop:
                          "1px solid #444",
                        paddingTop:
                          ".75rem"
                      }}
                    >
                      <strong>
                        {formatItemMethodType(
                          method.type
                        )}
                      </strong>

                      <p
                        style={{
                          margin:
                            ".35rem 0 0"
                        }}
                      >
                        {!arraysMatch(
                          method.versions,
                          itemGroup.versions
                        ) && (
                          <>
                            <span>
                              {formatVersionList(
                                method.versions
                              )}
                            </span>
                            {" · "}
                          </>
                        )}
                        {method.area
                          ? method.area
                          : "Location details listed above"}
                      </p>

                      {method.details && (
                        <p
                          style={{
                            margin:
                              ".35rem 0 0",
                            opacity: 0.85
                          }}
                        >
                          {method.details}
                        </p>
                      )}

                      {method.requirements
                        ?.length > 0 && (
                        <div
                          style={{
                            marginTop:
                              ".5rem"
                          }}
                        >
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
                                  {
                                    requirement
                                  }
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </CollapsibleSection>
  );
}

function LocationDetailPage() {
  const { locationName } = useParams();

  const [location, setLocation] =
    useState(null);
  const [locationItems, setLocationItems] =
    useState(null);
  const [loading, setLoading] =
    useState(true);
  const [
    encountersExpanded,
    setEncountersExpanded
  ] = useState(true);
  const [
    itemsExpanded,
    setItemsExpanded
  ] = useState(true);
  const [selectedVersion, setSelectedVersion] =
    useQueryParamState(
      "version",
      "all"
    );

  useEffect(() => {
    async function loadLocation() {
      try {
        setLoading(true);

        const [
          data,
          itemData
        ] = await Promise.all([
          readJsonFile(
            `/data/locations/${locationName}.json`,
            {
              required: true
            }
          ),
          readJsonFile(
            `/data/locationItems/${locationName}.json`
          )
        ]);

        setLocation(data);
        setLocationItems(itemData);
      } catch (error) {
        console.error(
          "Failed to load location:",
          error
        );
        setLocation(null);
        setLocationItems(null);
      } finally {
        setLoading(false);
      }
    }

    loadLocation();
  }, [locationName]);

  const versions = useMemo(() => {
    if (!location) return [];

    return sortVersions(
      new Set(
        location.areas.flatMap(area =>
          area.pokemonEncounters.flatMap(
            encounter =>
              encounter.versions.map(
                version => version.version
              )
          )
        )
      )
    );
  }, [location]);

  const selectedVersionIsAvailable =
    selectedVersion === "all" ||
    versions.includes(selectedVersion);
  const activeVersion =
    selectedVersionIsAvailable
      ? selectedVersion
      : "all";
  const encounterCount =
    location?.areas?.reduce(
      (total, area) =>
        total +
        area.pokemonEncounters.filter(
          encounter =>
            filterVersions(
              encounter.versions,
              activeVersion
            ).length > 0
        ).length,
      0
    ) ?? 0;

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
        maxWidth: "1300px",
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

      <LocationItemsSection
        expanded={itemsExpanded}
        locationItems={locationItems}
        onToggle={() =>
          setItemsExpanded(
            expanded => !expanded
          )
        }
      />

      <CollapsibleSection
        title="Pokémon Encounters"
        summary={`${encounterCount} encounters`}
        expanded={encountersExpanded}
        onToggle={() =>
          setEncountersExpanded(
            expanded => !expanded
          )
        }
        style={{
          boxSizing: "border-box",
          width: "100%"
        }}
        contentStyle={{
          display: "grid",
          gap: "1rem",
          marginTop: "1rem"
        }}
      >
        {versions.length > 0 && (
          <div
            style={{
              marginBottom: "1rem"
            }}
          >
            <label
              htmlFor="location-version-filter"
              style={{
                display: "block",
                fontWeight: 700,
                marginBottom: ".5rem"
              }}
            >
              Filter Encounters By Version
            </label>

            <select
              id="location-version-filter"
              value={
                selectedVersionIsAvailable
                  ? selectedVersion
                  : "all"
              }
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
          </div>
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
                    activeVersion
                  )
                }))
                .filter(
                  encounter =>
                    encounter.versions.length > 0
                );
            const visibleEncounters =
              encounters.slice(
                0,
                activeVersion === "all"
                  ? ENCOUNTER_LIMIT
                  : encounters.length
              );
            const methodRates =
              filterMethodRates(
                area.encounterMethodRates,
                activeVersion
              );

            return (
              <section
                key={area.name}
                style={{
                  marginBottom: "2rem",
                  padding: ".1rem"
                }}
              >
                <h2>{area.displayName}</h2>

                {methodRates.length >
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
                    {methodRates.map(
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
                            fontSize:
                              "small",
                            padding:
                              ".35rem .35rem"
                          }}
                        >
                          {capitalize(rate.method)}
                          {activeVersion !==
                            "all" &&
                            rate.versionDetails?.[0]
                              ?.rate !==
                              undefined &&
                            ` · ${rate.versionDetails[0].rate}%`}
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
                            className="SummaryCardAndEncountersDiv"
                            key={
                              encounter.pokemon.id
                            }
                            style={{
                              alignItems: "start",
                              border:
                                "1px solid #666",
                              borderRadius:
                                "18px",
                              display: "grid",
                              gap: "1rem",
                              gridTemplateColumns:
                                "repeat(auto-fit, minmax(90px, 1fr))",
                              padding: ".1rem"
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
      </CollapsibleSection>
    </div>
  );
}

export default LocationDetailPage;
