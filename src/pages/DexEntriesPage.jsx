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
import Seo from "../seo/Seo";
import { dexEntriesSeo } from "../seo/seoConfig";

const INITIAL_VISIBLE_GROUPS = 30;
const VISIBLE_GROUP_INCREMENT = 30;

function DexEntriesPage() {
  const [entries, setEntries] = useState([]);
  const [
    visibleGroupCount,
    setVisibleGroupCount
  ] = useState(INITIAL_VISIBLE_GROUPS);
  const [
    searchParams,
    setSearchParams
  ] = useSearchParams();
  const search =
    searchParams.get("search") ?? "";

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

  useEffect(() => {
    setVisibleGroupCount(INITIAL_VISIBLE_GROUPS);
  }, [search]);

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

  const normalizedSearch =
    search.trim().toLowerCase();

  const filteredEntries = useMemo(
    () =>
      normalizedSearch
        ? entries.filter(entry =>
            entry.searchableText.includes(
              normalizedSearch
            )
          )
        : entries,
    [entries, normalizedSearch]
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
          lineHeight: 1.35,
          margin: "0 0 1rem"
        }}
      >
        Search every entry from
        every generation.
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
        placeholder=" Search entries... Ex: 'forest', 'cave', 'sea'..."
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
    

      <p>
       {filteredEntries.length} results
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
          to={`/pokemon/${pokemonName}`}
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
            setVisibleGroupCount(count =>
              count + VISIBLE_GROUP_INCREMENT
            );
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
