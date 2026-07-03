import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  Link,
  useNavigate
} from "react-router-dom";
import typeColors from "../constants/typeColors";
import { isItemHiddenFromUi } from "../utils/itemVisibility";
import { loadMovesMap } from "../utils/loadMovesData";

const RESULT_LIMIT = 12;

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

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

function compactName(text) {
  return normalizeText(text).replace(/\s+/g, "");
}

function fuzzySubsequenceScore(query, target) {
  let queryIndex = 0;
  let score = 0;
  let streak = 0;

  for (
    let targetIndex = 0;
    targetIndex < target.length &&
    queryIndex < query.length;
    targetIndex++
  ) {
    if (
      query[queryIndex] === target[targetIndex]
    ) {
      queryIndex++;
      streak++;
      score += 2 + streak;
    } else {
      streak = 0;
    }
  }

  if (queryIndex !== query.length) {
    return 0;
  }

  return Math.min(score, 35);
}

function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 3) {
    return 4;
  }

  const previous = Array.from(
    { length: b.length + 1 },
    (_, index) => index
  );

  for (let i = 1; i <= a.length; i++) {
    const current = [i];

    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] +
          (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }

    previous.splice(
      0,
      previous.length,
      ...current
    );
  }

  return previous[b.length];
}

function scoreRecord(record, query) {
  const normalizedQuery =
    normalizeText(query);
  const compactQuery =
    compactName(query);

  if (!normalizedQuery) {
    return 0;
  }

  const searchable =
    record.searchable;
  const compactSearchable =
    compactName(searchable);
  const label =
    normalizeText(record.label);
  const words =
    searchable.split(" ").filter(Boolean);
  const queryWords =
    normalizedQuery.split(" ").filter(Boolean);

  let score = 0;

  if (label === normalizedQuery) {
    score += 120;
  }

  if (label.startsWith(normalizedQuery)) {
    score += 90;
  }

  if (searchable.includes(normalizedQuery)) {
    score += 70;
  }

  if (compactSearchable.includes(compactQuery)) {
    score += 55;
  }

  for (const queryWord of queryWords) {
    if (
      words.some(word =>
        word.startsWith(queryWord)
      )
    ) {
      score += 18;
      continue;
    }

    if (
      words.some(
        word =>
          queryWord.length > 2 &&
          editDistance(queryWord, word) <= 2
      )
    ) {
      score += 12;
    }
  }

  score += fuzzySubsequenceScore(
    compactQuery,
    compactSearchable
  );

  return score;
}

function buildSearchRecord({
  id,
  label,
  category,
  route,
  description,
  sprite,
  keywords = []
}) {
  return {
    id,
    label,
    category,
    route,
    description,
    sprite,
    searchable: normalizeText(
      [
        label,
        category,
        description,
        ...keywords
      ].join(" ")
    )
  };
}

async function fetchJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }

  return response.json();
}

function settledValue(result, fallback, label) {
  if (result.status === "fulfilled") {
    return result.value;
  }

  console.warn(
    `Global search could not load ${label}:`,
    result.reason
  );

  return fallback;
}

function GlobalSiteSearch() {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  const [records, setRecords] =
    useState([]);
  const [query, setQuery] =
    useState("");
  const [isFocused, setIsFocused] =
    useState(false);
  const [activeIndex, setActiveIndex] =
    useState(0);

  useEffect(() => {
    async function loadSearchData() {
      try {
        const [
          pokemonResult,
          movesResult,
          abilitiesResult,
          itemsResult,
          locationsResult
        ] = await Promise.allSettled([
          fetchJson("/data/pokemonIndex.json"),
          loadMovesMap(),
          fetchJson("/data/abilities.json"),
          fetchJson("/data/itemsIndex.json"),
          fetchJson("/data/locationsIndex.json")
        ]);
        const pokemonIndex =
          settledValue(
            pokemonResult,
            [],
            "Pokemon index"
          );
        const moves =
          settledValue(
            movesResult,
            {},
            "moves"
          );
        const abilities =
          settledValue(
            abilitiesResult,
            {},
            "abilities"
          );
        const items =
          settledValue(
            itemsResult,
            [],
            "items"
          );
        const locations =
          settledValue(
            locationsResult,
            [],
            "locations"
          );

        const nextRecords = [
          buildSearchRecord({
            id: "pokemon-page",
            label: "Pokémon",
            category: "Page",
            route: "/",
            description: "Pokémon database"
          }),
          buildSearchRecord({
            id: "moves-page",
            label: "Moves",
            category: "Page",
            route: "/moves",
            description: "Move database"
          }),
          buildSearchRecord({
            id: "abilities-page",
            label: "Abilities",
            category: "Page",
            route: "/abilities",
            description: "Ability database"
          }),
          buildSearchRecord({
            id: "items-page",
            label: "Items",
            category: "Page",
            route: "/items",
            description: "Item database"
          }),
          buildSearchRecord({
            id: "locations-page",
            label: "Locations",
            category: "Page",
            route: "/locations",
            description: "Location database"
          }),
          buildSearchRecord({
            id: "types-page",
            label: "Types",
            category: "Page",
            route: "/types",
            description: "Type matchups"
          }),
          ...pokemonIndex.map(pokemon =>
            buildSearchRecord({
              id: `pokemon-${pokemon.id}`,
              label: capitalize(pokemon.name),
              category: "Pokémon",
              route: `/pokemon/${pokemon.name}`,
              description: `No. ${pokemon.id}`,
              sprite: pokemon.sprite,
              keywords: [
                pokemon.name,
                String(pokemon.id),
                ...(pokemon.types ?? [])
              ]
            })
          ),
          ...Object.entries(moves).map(
            ([name, move]) =>
              buildSearchRecord({
                id: `move-${name}`,
                label: capitalize(name),
                category: "Move",
                route: `/move/${name}`,
                description: capitalize(move.type),
                keywords: [
                  name,
                  move.type,
                  move.category,
                  move.description
                ]
              })
          ),
          ...Object.values(abilities).map(
            ability =>
              buildSearchRecord({
                id: `ability-${ability.name}`,
                label: capitalize(ability.name),
                category: "Ability",
                route: `/ability/${ability.name}`,
                description:
                  ability.shortEffect,
                keywords: [
                  ability.name,
                  ability.effect,
                  ability.generation
                ]
              })
          ),
          ...items
            .filter(
              item => !isItemHiddenFromUi(item)
            )
            .map(item =>
              buildSearchRecord({
                id: `item-${item.name}`,
                label:
                  item.displayName ??
                  capitalize(item.name),
                category: "Item",
                route: `/item/${item.name}`,
                description:
                  item.categoryDisplayName,
                sprite: item.sprite,
                keywords: [
                  item.name,
                  item.pocket,
                  item.shortEffect
                ]
              })
            ),
          ...locations.map(location =>
            buildSearchRecord({
              id: `location-${location.name}`,
              label: location.displayName,
              category: "Location",
              route: `/location/${location.name}`,
              description:
                location.regionDisplayName,
              keywords: [
                location.name,
                location.region,
                location.regionDisplayName
              ]
            })
          ),
          ...Object.keys(typeColors).map(type =>
            buildSearchRecord({
              id: `type-${type}`,
              label: capitalize(type),
              category: "Type",
              route: `/type/${type}`,
              description: "Type matchups",
              keywords: [type, "type"]
            })
          )
        ];

        setRecords(nextRecords);
      } catch (error) {
        console.error(
          "Failed to load global search data:",
          error
        );
      }
    }

    loadSearchData();
  }, []);

  useEffect(() => {
    function handleDocumentClick(event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target
        )
      ) {
        setIsFocused(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleDocumentClick
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleDocumentClick
      );
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) {
      return [];
    }

    return records
      .map(record => ({
        ...record,
        score: scoreRecord(record, query)
      }))
      .filter(record => record.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.label.localeCompare(b.label)
      )
      .slice(0, RESULT_LIMIT);
  }, [
    records,
    query
  ]);

  function selectResult(result) {
    navigate(result.route);
    setQuery("");
    setActiveIndex(0);
    setIsFocused(false);
  }

  function closeResults() {
    setQuery("");
    setActiveIndex(0);
    setIsFocused(false);
  }

  function handleKeyDown(event) {
    if (!results.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex(index =>
        Math.min(
          index + 1,
          results.length - 1
        )
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(index =>
        Math.max(index - 1, 0)
      );
    }

    if (event.key === "Enter") {
      event.preventDefault();
      selectResult(results[activeIndex]);
    }

    if (event.key === "Escape") {
      setIsFocused(false);
    }
  }

  const shouldShowResults =
    isFocused && query.trim().length > 0;

  return (
    <div
      ref={wrapperRef}
      style={{
        maxWidth: "520px",
        position: "relative",
        zIndex: 1000,
        width: "100%"
      }}
    >
      <input
        type="search"
        value={query}
        placeholder="Search Pokémon, items, moves, locations..."
        onChange={event => {
          setQuery(event.target.value);
          setActiveIndex(0);
          setIsFocused(true);
        }}
        onClick={() => setIsFocused(true)}
        onFocus={() => setIsFocused(true)}
        onKeyDown={handleKeyDown}
        style={{
          backgroundColor: "#2c2c2c",
          border: "2px solid #555",
          borderRadius: "12px",
          boxSizing: "border-box",
          color: "white",
          fontSize: "1rem",
          padding: ".65rem .9rem",
          width: "100%"
        }}
      />

      {shouldShowResults && (
        <div
          style={{
            backgroundColor: "#202020",
            border: "1px solid #555",
            borderRadius: "12px",
            boxShadow:
              "0 12px 28px rgba(0, 0, 0, .35)",
            left: 0,
            maxHeight: "420px",
            overflowY: "auto",
            padding: ".35rem",
            position: "absolute",
            right: 0,
            top: "calc(100% + .35rem)",
            zIndex: 1001
          }}
        >
          {results.length === 0 ? (
            <div
              style={{
                color: "white",
                opacity: 0.75,
                padding: ".75rem"
              }}
            >
              No results
            </div>
          ) : (
            results.map((result, index) => (
              <Link
                key={result.id}
                to={result.route}
                onMouseDown={event => {
                  if (event.button === 0) {
                    event.preventDefault();
                  }
                }}
                onClick={closeResults}
                style={{
                  alignItems: "center",
                  backgroundColor:
                    index === activeIndex
                      ? "#fab856"
                      : "transparent",
                  border: "none",
                  borderRadius: "8px",
                  color:
                    index === activeIndex
                      ? "#1b1b1b"
                      : "white",
                  cursor: "pointer",
                  display: "grid",
                  gap: ".65rem",
                  gridTemplateColumns:
                    "36px 1fr auto",
                  padding: ".55rem",
                  textAlign: "left",
                  textDecoration: "none",
                  width: "100%"
                }}
              >
                <div
                  style={{
                    alignItems: "center",
                    display: "flex",
                    height: "36px",
                    justifyContent: "center",
                    width: "36px"
                  }}
                >
                  {result.sprite ? (
                    <img
                      src={result.sprite}
                      alt=""
                      style={{
                        height: "34px",
                        objectFit: "contain",
                        width: "34px"
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: ".75rem",
                        fontWeight: "bold",
                        opacity: 0.75
                      }}
                    >
                      {result.category[0]}
                    </span>
                  )}
                </div>

                <div>
                  <div
                    style={{
                      fontWeight: "bold"
                    }}
                  >
                    {result.label}
                  </div>

                  {result.description && (
                    <div
                      style={{
                        fontSize: ".75rem",
                        opacity: 0.8
                      }}
                    >
                      {result.description}
                    </div>
                  )}
                </div>

                <span
                  style={{
                    fontSize: ".72rem",
                    fontWeight: "bold",
                    opacity: 0.75
                  }}
                >
                  {result.category}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSiteSearch;
