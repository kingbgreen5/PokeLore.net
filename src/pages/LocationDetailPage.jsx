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
import ItemLocationCards from "../components/ItemLocationCards";
import OaksNotes from "../components/OaksNotes";
import PokemonSummaryCard from "../components/PokemonSummaryCard";
import useQueryParamState from "../hooks/useQueryParamState";
import Seo from "../seo/Seo";
import { locationSeo } from "../seo/seoConfig";
import { readJsonFile } from "../utils/readJsonFile";
import { normalizeDisplayText } from "../utils/normalizeText";
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

function versionDisplayToSlug(version) {
  return normalizeDisplayText(String(version ?? ""))
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
                normalizeDisplayText(versionEntry.version),
              method: {
                ...method,
                details: normalizeDisplayText(method.details),
                notes: normalizeDisplayText(method.notes),
                requirements:
                  method.requirements?.map(normalizeDisplayText)
              },
              key: `${itemEntry.item.name}-${normalizeDisplayText(versionEntry.version)}-${method.type}-${normalizeDisplayText(method.details)}-${index}`
            })
          )
      )
    ) ?? []
  );
}

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

function formatCost(cost) {
  if (!cost) return null;

  if (typeof cost === "string") {
    return cost;
  }

  if (
    cost.amount === null ||
    cost.amount === undefined
  ) {
    return null;
  }

  return `${cost.amount.toLocaleString()} ${
    cost.currency ?? ""
  }`.trim();
}

function methodText(row) {
  return [
    row.method.details,
    row.method.notes,
    ...(row.method.requirements ?? [])
  ]
    .filter(Boolean)
    .join(" ");
}

function daysForAthleteShopRow(row) {
  const text = methodText(row);

  return WEEKDAYS.filter(day =>
    new RegExp(`\\b${day}\\b`, "i").test(text)
  );
}

function dataCardLevel(row) {
  const text = methodText(row);
  const match = text.match(
    /Pok[eé]athlon Level\s+(\d+)/i
  );

  return match?.[1] ?? "Other";
}

function uniqueRowsByItem(rows) {
  return Array.from(
    rows
      .reduce((map, row) => {
        if (!map.has(row.item.name)) {
          map.set(row.item.name, row);
        }

        return map;
      }, new Map())
      .values()
  ).sort((a, b) =>
    a.item.displayName.localeCompare(
      b.item.displayName
    )
  );
}

function ItemShopGrid({
  rows
}) {
  const uniqueRows =
    uniqueRowsByItem(rows);

  if (uniqueRows.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: "grid",
        gap: ".75rem",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(180px, 1fr))"
      }}
    >
      {uniqueRows.map(row => {
        const cost = formatCost(
          row.method.cost
        );

        return (
          <Link
            key={row.item.name}
            to={`/item/${row.item.name}`}
            style={{
              alignItems: "center",
              border: "1px solid #666",
              borderRadius: "12px",
              display: "flex",
              gap: ".75rem",
              padding: ".75rem",
              textDecoration: "none"
            }}
          >
            {row.item.sprite && (
              <img
                src={row.item.sprite}
                alt=""
                style={{
                  height: "32px",
                  imageRendering: "pixelated",
                  width: "32px"
                }}
              />
            )}

            <span>
              <strong
                style={{
                  display: "block"
                }}
              >
                {row.item.displayName}
              </strong>

              {cost && (
                <small>{cost}</small>
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function PokeathlonDomeItems({
  itemRows,
  locationDisplayName
}) {
  const athleteRows = itemRows.filter(
    row =>
      row.method.area ===
      "Athlete Shop"
  );
  const dataCardRows = itemRows.filter(
    row =>
      row.method.area ===
      "Data Card Shop"
  );
  const vendingRows = itemRows.filter(
    row =>
      row.method.area ===
      "Player vending machines"
  );
  const coveredItems = new Set(
    [
      ...athleteRows,
      ...dataCardRows,
      ...vendingRows
    ].map(row => row.item.name)
  );
  const additionalRows = itemRows.filter(
    row => !coveredItems.has(row.item.name)
  );

  return (
    <>
      {athleteRows.length > 0 && (
        <section
          style={{
            display: "grid",
            gap: "1rem"
          }}
        >
          <h3>Athlete Shop</h3>

          {WEEKDAYS.map(day => {
            const dayRows =
              athleteRows.filter(row =>
                daysForAthleteShopRow(
                  row
                ).includes(day)
              );

            if (dayRows.length === 0) {
              return null;
            }

            return (
              <section key={day}>
                <h4>{day}</h4>
                <ItemShopGrid rows={dayRows} />
              </section>
            );
          })}
        </section>
      )}

      {dataCardRows.length > 0 && (
        <section>
          <h3>Data Card Shop</h3>

          {[1, 2, 3, 4, 5].map(level => {
            const levelRows =
              dataCardRows.filter(
                row =>
                  dataCardLevel(row) ===
                  String(level)
              );

            if (levelRows.length === 0) {
              return null;
            }

            return (
              <section key={level}>
                <h4>Level {level}</h4>
                <ItemShopGrid
                  rows={levelRows}
                />
              </section>
            );
          })}
        </section>
      )}

      {vendingRows.length > 0 && (
        <section>
          <h3>Vending Machines</h3>
          <ItemShopGrid rows={vendingRows} />
        </section>
      )}

      {additionalRows.length > 0 && (
        <section>
          <h3>Additional Listings</h3>
          <ItemLocationCards
            rows={additionalRows}
            locationDisplayName={
              locationDisplayName
            }
          />
        </section>
      )}
    </>
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
    normalizeDisplayText(
      locationItems?.location
        ?.displayName ?? "this location"
    );
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
    () => {
      const cleanSelectedItemVersion =
        normalizeDisplayText(selectedItemVersion);

      return cleanSelectedItemVersion === "all"
        ? itemRows
        : itemRows.filter(
            row =>
              row.version ===
              cleanSelectedItemVersion
          );
    },
    [
      itemRows,
      selectedItemVersion
    ]
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
            value={normalizeDisplayText(selectedItemVersion)}
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
                  : normalizeDisplayText(version)}
              </option>
            ))}
          </select>
        </div>
      )}

      {locationItems.location?.name ===
      "pokeathlon-dome" ? (
        <PokeathlonDomeItems
          itemRows={filteredItemRows}
          locationDisplayName={
            locationDisplayName
          }
        />
      ) : (
        <ItemLocationCards
          rows={filteredItemRows}
          locationDisplayName={
            locationDisplayName
          }
        />
      )}
    </CollapsibleSection>
  );
}

function LocationDetailPage() {
  const { locationName } = useParams();

  const [location, setLocation] =
    useState(null);
  const [locationItems, setLocationItems] =
    useState(null);
  const [oaksNotes, setOaksNotes] =
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
          itemData,
          oaksNotesData
        ] = await Promise.all([
          readJsonFile(
            `/data/locations/${locationName}.json`,
            {
              required: true
            }
          ),
          readJsonFile(
            `/data/locationItems/${locationName}.json`
          ),
          readJsonFile(
            `/data/oaksNotes/locations/${locationName}.json`
          )
        ]);

        setLocation(data);
        setLocationItems(itemData);
        setOaksNotes(oaksNotesData);
      } catch (error) {
        console.error(
          "Failed to load location:",
          error
        );
        setLocation(null);
        setLocationItems(null);
        setOaksNotes(null);
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

      <OaksNotes note={oaksNotes} />

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
