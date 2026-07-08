import {
  useMemo,
  useState
} from "react";
import { Link } from "react-router-dom";
import CollapsibleSection from "./CollapsibleSection";
import useSessionState from "../hooks/useSessionState";
import { normalizeDisplayText } from "../utils/normalizeText";

function formatAcquisitionType(type) {
  if (!type) return "Unknown";

  return normalizeDisplayText(type)
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

  return normalizeDisplayText(
    location.name ?? location.displayName
  );
}

function ItemLocationLink({
  location
}) {
  if (!location) return null;

  if (typeof location === "string") {
    return (
      <span>
        {normalizeDisplayText(location)}
      </span>
    );
  }

  if (
    location.name &&
    location.displayName
  ) {
    return (
      <Link
        to={`/location/${location.name}`}
      >
        {normalizeDisplayText(location.displayName)}
      </Link>
    );
  }

  return (
    <span>
      {normalizeDisplayText(
        location.displayName ?? location.name
      )}
    </span>
  );
}

function ItemLink({
  item
}) {
  if (!item) return null;

  if (typeof item === "string") {
    return (
      <span>
        {normalizeDisplayText(item)}
      </span>
    );
  }

  if (
    item.name &&
    item.displayName
  ) {
    return (
      <Link to={`/item/${item.name}`}>
        {normalizeDisplayText(item.displayName)}
      </Link>
    );
  }

  return (
    <span>
      {normalizeDisplayText(
        item.displayName ?? item.name
      )}
    </span>
  );
}

function AbilityLink({
  ability
}) {
  if (!ability) return null;

  if (typeof ability === "string") {
    return (
      <span>
        {normalizeDisplayText(ability)}
      </span>
    );
  }

  if (
    ability.name &&
    ability.displayName
  ) {
    return (
      <Link
        to={`/ability/${ability.name}`}
      >
        {normalizeDisplayText(ability.displayName)}
      </Link>
    );
  }

  return (
    <span>
      {normalizeDisplayText(
        ability.displayName ?? ability.name
      )}
    </span>
  );
}

function PokemonLink({
  pokemon
}) {
  if (!pokemon) return null;

  if (typeof pokemon === "string") {
    return (
      <span>
        {normalizeDisplayText(pokemon)}
      </span>
    );
  }

  if (
    pokemon.name &&
    pokemon.displayName
  ) {
    return (
      <Link to={`/pokemon/${pokemon.name}`}>
        {normalizeDisplayText(pokemon.displayName)}
      </Link>
    );
  }

  return (
    <span>
      {normalizeDisplayText(
        pokemon.displayName ?? pokemon.name
      )}
    </span>
  );
}

function MoveLink({
  move
}) {
  if (!move) return null;

  if (typeof move === "string") {
    return (
      <span>
        {normalizeDisplayText(move)}
      </span>
    );
  }

  if (
    move.name &&
    move.displayName
  ) {
    return (
      <Link to={`/move/${move.name}`}>
        {normalizeDisplayText(move.displayName)}
      </Link>
    );
  }

  return (
    <span>
      {normalizeDisplayText(
        move.displayName ?? move.name
      )}
    </span>
  );
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
                      {method.games
                        .map(normalizeDisplayText)
                        .join(", ")}
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
                      {normalizeDisplayText(
                        method.method ??
                          method.details
                      )}
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
                              {normalizeDisplayText(
                                requirement
                              )}
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

                  {method.relatedPokemon
                    ?.length > 0 && (
                    <div>
                      <strong>
                        Related Pokemon
                      </strong>
                      <ul
                        style={{
                          margin:
                            ".35rem 0 0",
                          paddingLeft:
                            "1.25rem"
                        }}
                      >
                        {method.relatedPokemon.map(
                          pokemon => (
                            <li
                              key={
                                typeof pokemon ===
                                "string"
                                  ? pokemon
                                  : pokemon.name
                              }
                            >
                              <PokemonLink
                                pokemon={pokemon}
                              />
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {method.relatedMoves
                    ?.length > 0 && (
                    <div>
                      <strong>
                        Related Moves
                      </strong>
                      <ul
                        style={{
                          margin:
                            ".35rem 0 0",
                          paddingLeft:
                            "1.25rem"
                        }}
                      >
                        {method.relatedMoves.map(
                          move => (
                            <li
                              key={
                                typeof move ===
                                "string"
                                  ? move
                                  : move.name
                              }
                            >
                              <MoveLink
                                move={move}
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
