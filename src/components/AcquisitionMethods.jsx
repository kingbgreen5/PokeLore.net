import {
  useMemo,
  useState
} from "react";
import { Link } from "react-router-dom";
import CollapsibleSection from "./CollapsibleSection";
import useSessionState from "../hooks/useSessionState";

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

function formatLocationKey(location) {
  if (!location) return "no-location";

  if (typeof location === "string") {
    return location;
  }

  return location.name ?? location.displayName;
}

function ItemLocationLink({
  location
}) {
  if (!location) return null;

  if (typeof location === "string") {
    return <span>{location}</span>;
  }

  if (
    location.name &&
    location.displayName
  ) {
    return (
      <Link
        to={`/location/${location.name}`}
      >
        {location.displayName}
      </Link>
    );
  }

  return null;
}

function ItemLink({
  item
}) {
  if (!item) return null;

  if (typeof item === "string") {
    return <span>{item}</span>;
  }

  if (
    item.name &&
    item.displayName
  ) {
    return (
      <Link to={`/item/${item.name}`}>
        {item.displayName}
      </Link>
    );
  }

  return null;
}

function AbilityLink({
  ability
}) {
  if (!ability) return null;

  if (typeof ability === "string") {
    return <span>{ability}</span>;
  }

  if (
    ability.name &&
    ability.displayName
  ) {
    return (
      <Link
        to={`/ability/${ability.name}`}
      >
        {ability.displayName}
      </Link>
    );
  }

  return null;
}

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

function AcquisitionMethods({
  acquisition,
  storageKey = "acquisition-expanded"
}) {
  const [expanded, setExpanded] =
    useSessionState(
      storageKey,
      false
    );

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
    return null;
  }

  return (
    <CollapsibleSection
      title="Where to Find"
      summary={expanded ? "▲" : "▼"}
      expanded={expanded}
      onToggle={() =>
        setExpanded(
          isExpanded => !isExpanded
        )
      }
      style={{
        marginBottom: "2rem"
      }}
      contentStyle={{
        display: "grid",
        gap: "1rem",
        textAlign: "left"
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
          marginBottom: "1rem"
        }}
      >
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
      </div>

          {filteredAcquisition.map(
            (method, index) => (
              <article
                key={`${method.generation}-${formatLocationKey(method.location)}-${method.method}-${index}`}
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
                      <ItemLocationLink
                        location={
                          method.location
                        }
                      />
                    </p>
                  </div>

                  <div>
                    <strong>Method</strong>
                    <p>
                      {method.method ??
                        method.details}
                    </p>
                  </div>

                  {formatCost(method.cost) && (
                    <div>
                      <strong>Cost</strong>
                      <p>
                        {formatCost(
                          method.cost
                        )}
                      </p>
                    </div>
                  )}

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

                  {method.relatedItems
                    ?.length > 0 && (
                    <div>
                      <strong>
                        Related Items
                      </strong>
                      <ul
                        style={{
                          margin:
                            ".35rem 0 0",
                          paddingLeft:
                            "1.25rem"
                        }}
                      >
                        {method.relatedItems.map(
                          item => (
                            <li
                              key={
                                typeof item ===
                                "string"
                                  ? item
                                  : item.name
                              }
                            >
                              <ItemLink
                                item={item}
                              />
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {method.relatedAbilities
                    ?.length > 0 && (
                    <div>
                      <strong>
                        Related Abilities
                      </strong>
                      <ul
                        style={{
                          margin:
                            ".35rem 0 0",
                          paddingLeft:
                            "1.25rem"
                        }}
                      >
                        {method.relatedAbilities.map(
                          ability => (
                            <li
                              key={
                                typeof ability ===
                                "string"
                                  ? ability
                                  : ability.name
                              }
                            >
                              <AbilityLink
                                ability={ability}
                              />
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {method.relatedLocations
                    ?.length > 0 && (
                    <div>
                      <strong>
                        Related Locations
                      </strong>
                      <ul
                        style={{
                          margin:
                            ".35rem 0 0",
                          paddingLeft:
                            "1.25rem"
                        }}
                      >
                        {method.relatedLocations.map(
                          location => (
                            <li
                              key={
                                typeof location ===
                                "string"
                                  ? location
                                  : location.name
                              }
                            >
                              <ItemLocationLink
                                location={
                                  location
                                }
                              />
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
    </CollapsibleSection>
  );
}

export default AcquisitionMethods;
