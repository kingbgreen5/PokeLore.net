import { Link } from "react-router-dom";
import { compareVersions } from "../constants/versionOrder";

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

function methodGroupKey(method) {
  const location =
    typeof method.location === "string"
      ? method.location
      : method.location?.name ??
        method.location?.displayName ??
        "";

  return [
    location,
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

function formatItemAnswer(
  locationDisplayName,
  itemGroup
) {
  const versions = formatVersionList(
    itemGroup.versions
  );

  return locationDisplayName
    ? `Obtainable at ${locationDisplayName} in ${versions}.`
    : `Obtainable in ${versions}.`;
}

function ItemLocationLink({
  location
}) {
  if (!location) {
    return null;
  }

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

  return (
    <span>
      {location.displayName ?? location.name}
    </span>
  );
}

function ItemLocationCards({
  rows,
  locationDisplayName,
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

                    {method.area
                      ? method.area
                      : showLocation
                        ? ""
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
                              key={requirement}
                            >
                              {requirement}
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
export {
  compareDisplayVersions,
  formatVersionList,
  groupItemRows
};
