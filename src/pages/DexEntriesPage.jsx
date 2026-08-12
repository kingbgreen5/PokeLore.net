import {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  Link,
  useSearchParams
} from "react-router-dom";
import { capitalize } from "../utils/capitalize";
import {
  matchesDexEntrySearch,
  parseDexEntrySearchQuery
} from "../utils/dexEntrySearch";
import Seo from "../seo/Seo";
import { dexEntriesSeo } from "../seo/seoConfig";
import { getPokemonUrl } from "../utils/pokemonUrls";

const INITIAL_VISIBLE_GROUPS = 30;
const VISIBLE_GROUP_INCREMENT = 30;

function DexEntriesPage() {
  const [entries, setEntries] = useState([]);
  const [
    searchParams,
    setSearchParams
  ] = useSearchParams();
  const search =
    searchParams.get("search") ?? "";
  const exactWordEnabled =
    searchParams.get("exact") === "1";
  const visibleGroupKey = `${search}\u0000${
    exactWordEnabled ? "1" : "0"
  }`;
  const [
    visibleGroupState,
    setVisibleGroupState
  ] = useState({
    count: INITIAL_VISIBLE_GROUPS,
    key: visibleGroupKey
  });
  const visibleGroupCount =
    visibleGroupState.key === visibleGroupKey
      ? visibleGroupState.count
      : INITIAL_VISIBLE_GROUPS;

  useEffect(() => {
    async function loadData() {
      const response = await fetch("/data/condensedEntries.json");
      const data = await response.json();

      setEntries(
        data.map(entry => ({
          ...entry,
          searchableText:
            entry.text.toLowerCase(),
          displayVersions: entry.versions
            .map(capitalize)
            .join(" / ")
        }))
      );
    }

    loadData();
  }, []);

  function handleSearchChange(event) {
    const nextSearch = event.target.value;
    const nextParams =
      new URLSearchParams(searchParams);

    if (nextSearch.trim()) {
      nextParams.set("search", nextSearch);
    } else {
      nextParams.delete("search");
    }

    setSearchParams(nextParams, {
      replace: true
    });
  }

  function handleExactWordChange(event) {
    const nextParams =
      new URLSearchParams(searchParams);

    if (event.target.checked) {
      nextParams.set("exact", "1");
    } else {
      nextParams.delete("exact");
    }

    setSearchParams(nextParams, {
      replace: true
    });
  }

  const searchQuery = useMemo(
    () =>
      parseDexEntrySearchQuery(
        search,
        exactWordEnabled
      ),
    [search, exactWordEnabled]
  );

  const filteredEntries = useMemo(
    () =>
      searchQuery.term
        ? entries.filter(entry =>
            matchesDexEntrySearch(
              entry.searchableText,
              searchQuery.term,
              searchQuery.exactWord
            )
          )
        : entries,
    [entries, searchQuery]
  );

  const groupedEntries = useMemo(() => {
    const groups = new Map();

    filteredEntries.forEach(entry => {
      if (!groups.has(entry.pokemon)) {
        groups.set(entry.pokemon, []);
      }

      groups.get(entry.pokemon).push(entry);
    });

    return Array.from(groups.entries());
  }, [filteredEntries]);

  const visibleGroups = groupedEntries.slice(
    0,
    visibleGroupCount
  );
  const hiddenGroupCount = Math.max(
    groupedEntries.length - visibleGroupCount,
    0
  );

  return (
  <main
    aria-labelledby="dex-entries-title"
    style={{ padding: "1rem" }}
  >
    <Seo {...dexEntriesSeo()} />

      <h1
        id="dex-entries-title"
        style={{
          fontSize: "1rem",
          letterSpacing: 0,
          lineHeight: 1.5,
          margin: "0 auto 1rem",
          maxWidth: "72rem"
        }}
      >
        Search every Pokémon Pokédex entry from every main series game in one place.
        <span className="dex-entries-desktop-intro">
          {" "}Find how each Pokémon has been described across generations, compare
          version differences, and discover how official Pokédex lore has evolved
          over time.
        </span>
      </h1>
      <label
        htmlFor="dex-entry-search"
        style={{
          display: "block",
          fontWeight: 700,
          marginBottom: ".5rem"
        }}
      >
        Search entries
      </label>
      <input
        id="dex-entry-search"
        type="text"
        placeholder=' Search entries... Ex: forest, cave, "sea"...'
        value={search}
        onChange={handleSearchChange}
        style={{
          backgroundColor: "#2c2c2c",
          border: "2px solid #555",
          borderRadius: "12px",
          boxSizing: "border-box",
          color: "white",
          marginBottom: "2rem",
          maxWidth: "420px",
          padding: ".8rem 1rem",
          fontSize: "1rem",
          width: "100%"
        }}
      />
      <label
        htmlFor="dex-entry-exact-word"
        style={{
          alignItems: "center",
          cursor: "pointer",
          display: "flex",
          gap: ".55rem",
          justifyContent: "center",
          margin: "-1.25rem auto 2rem",
          maxWidth: "420px",
          textAlign: "left"
        }}
      >
        <input
          id="dex-entry-exact-word"
          type="checkbox"
          checked={exactWordEnabled}
          onChange={handleExactWordChange}
          style={{
            accentColor: "var(--link-unvisited)",
            height: "1.05rem",
            width: "1.05rem"
          }}
        />
        <span>
          Exact word
        </span>
      </label>
    

      <p>
       {filteredEntries.length} results
       {searchQuery.exactWord && searchQuery.term ? " (exact word)" : ""}
      </p>


{visibleGroups.map(
  ([pokemonName, pokemonEntries]) => (
    <div
      key={pokemonName}
      style={{
        border: "2px solid #ccc",
        padding: "1rem",
        marginBottom: "2rem",
        borderRadius: "12px",
        textAlign:"left"
      }}
    >
      <h2>
        <Link
          to={getPokemonUrl(pokemonName) ?? "#"}
          style={{
            color: "var(--link-unvisited)",
            fontWeight: 700,
            textDecoration: "none"
          }}
        >
          {capitalize(pokemonName)}
        </Link>
      </h2>

      {pokemonEntries.map((entry, index) => (
        <div
          key={index}
          style={{
            marginBottom: "1rem",
            paddingBottom: "1rem",
            // borderBottom: "1px solid #eee"
          }}
        >
          <p>{entry.text}</p>

          <div
            style={{
              fontSize: ".875rem",
              color: "#9ca3af",
            }}
          >
            {entry.displayVersions}
          </div>
  
        </div>
      ))}
    </div>
  )
)}

      {hiddenGroupCount > 0 && (
        <button
          type="button"
          onClick={() => {
            setVisibleGroupState({
              count:
                visibleGroupCount +
                VISIBLE_GROUP_INCREMENT,
              key: visibleGroupKey
            });
          }}
          style={{
            backgroundColor: "#2c2c2c",
            border: "2px solid #555",
            borderRadius: "8px",
            color: "white",
            cursor: "pointer",
            display: "block",
            fontSize: "1rem",
            fontWeight: 700,
            margin: "0 auto 2rem",
            padding: ".8rem 1rem"
          }}
        >
          Show more Pokemon
        </button>
      )}
    </main>
  );
}

export default DexEntriesPage;
