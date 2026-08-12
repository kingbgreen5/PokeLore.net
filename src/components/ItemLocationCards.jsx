import { Link } from "react-router-dom";
import { compareVersions } from "../constants/versionOrder";
import { normalizeDisplayText } from "../utils/normalizeText";
import { getPokemonUrl } from "../utils/pokemonUrls";

function capitalize(text) {
  return String(text ?? "")
    .split("-")
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function formatItemMethodType(type) {
  return capitalize(
    normalizeDisplayText(type ?? "method")
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
      normalizeDisplayText(String(version ?? "")).trim()
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

function methodGroupKey(method) {
  const location =
    typeof method.location === "string"
      ? method.location
      : method.location?.name ??
        method.location?.displayName ??
        "";

  return [
    normalizeDisplayText(location),
    normalizeDisplayText(method.type ?? ""),
    normalizeDisplayText(method.area ?? ""),
    normalizeDisplayText(method.details ?? ""),
    formatCost(method.cost) ?? "",
    normalizeDisplayText(method.notes ?? ""),
    method.repeatable ? "repeatable" : "",
    method.versionExclusive
      ? "version-exclusive"
      : "",
    ...(method.requirements ?? []).map(
      normalizeDisplayText
    )
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

function ItemLocationLink({
  location
}) {
  if (!location) {
    return null;
  }

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

function PokemonLink({
  pokemon
}) {
  if (!pokemon) {
    return null;
  }

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
    const pokemonUrl =
      getPokemonUrl(pokemon);

    return (
      <Link to={pokemonUrl ?? "#"}>
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

function AbilityLink({
  ability
}) {
  if (!ability) {
    return null;
  }

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
        {ability.displayName}
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

function escapeRegExp(text) {
  return String(text).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function renderTextWithPokemonLinks(
  text,
  relatedPokemon
) {
  const normalizedText =
    normalizeDisplayText(text);
  const pokemon =
    relatedPokemon?.filter(Boolean) ?? [];

  if (!normalizedText || pokemon.length === 0) {
    return normalizedText;
  }

  const names = pokemon
    .map(entry =>
      normalizeDisplayText(
        typeof entry === "string"
          ? entry
          : entry.displayName ?? entry.name
      )
    )
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (names.length === 0) {
    return normalizedText;
  }

  const pattern = new RegExp(
    `\\b(${names.map(escapeRegExp).join("|")})\\b`,
    "gi"
  );

  return normalizedText
    .split(pattern)
    .map((part, index) => {
      const pokemonEntry = pokemon.find(entry => {
        const label = normalizeDisplayText(
          typeof entry === "string"
            ? entry
            : entry.displayName ?? entry.name
        );

        return (
          label.toLowerCase() ===
          part.toLowerCase()
        );
      });

      if (!pokemonEntry) {
        return part;
      }

      return (
        <PokemonLink
          key={`${part}-${index}`}
          pokemon={pokemonEntry}
        />
      );
    });
}

function ItemLocationCards({
  rows,
  showLocation = false
}) {
  const groupedItems =
    groupItemRows(rows);

  if (!groupedItems.length) {
    return (
      <p>No item locations found.</p>
    );
  }

  return (
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
                  imageRendering: "pixelated",
                  width: "32px"
                }}
              />
            )}
            <strong>
              {itemGroup.item.displayName}
            </strong>
          </Link>

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
                    paddingTop: ".75rem"
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

                    {showLocation &&
                      method.location && (
                      <>
                        <ItemLocationLink
                          location={
                            method.location
                          }
                        />
                        {method.area
                          ? " · "
                          : ""}
                      </>
                    )}

                    {renderTextWithPokemonLinks(
                      method.area ?? "",
                      method.relatedPokemon
                    )}
                  </p>

                  {method.details && (
                    <p
                      style={{
                        margin:
                          ".35rem 0 0",
                        opacity: 0.85
                      }}
                    >
                      {renderTextWithPokemonLinks(
                        method.details,
                        method.relatedPokemon
                      )}
                    </p>
                  )}

                  {formatCost(method.cost) && (
                    <p
                      style={{
                        margin:
                          ".35rem 0 0",
                        opacity: 0.85
                      }}
                    >
                      Cost:{" "}
                      {formatCost(method.cost)}
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
                              key={requirement}
                            >
                              {renderTextWithPokemonLinks(
                                requirement,
                                method.relatedPokemon
                              )}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {method.relatedAbilities
                    ?.length > 0 && (
                    <div
                      style={{
                        marginTop:
                          ".5rem"
                      }}
                    >
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
                </div>
              )
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

export default ItemLocationCards;
