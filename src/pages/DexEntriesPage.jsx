import { useEffect, useState } from "react";
import {
  Link,
  useSearchParams
} from "react-router-dom";
import { capitalize } from "../utils/capitalize";
import Seo from "../seo/Seo";
import { dexEntriesSeo } from "../seo/seoConfig";

function DexEntriesPage() {
  const [entries, setEntries] = useState([]);
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

      setEntries(data);
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

  // const filteredEntries = entries.filter(entry =>
  //   entry.text.toLowerCase().includes(search.toLowerCase())
  // );


const filteredEntries = entries.filter(entry =>
  entry.text.toLowerCase().includes(search.toLowerCase())
);

const groupedEntries = filteredEntries.reduce((acc, entry) => {
  if (!acc[entry.pokemon]) {
    acc[entry.pokemon] = [];
  }

  acc[entry.pokemon].push(entry);

  return acc;
}, {});


//-----------------------------------------------RETURN STATEMENT--------------------------------------------------
  return (
  <div > 
    <Seo {...dexEntriesSeo()} />

    <div style={{ padding: "1rem" }} >

 
      <h4>
        Search every entry from
        every generation.
      </h4>


{/* 
------------------------------------------------SEARCH BAR-------------------------------------------------- */}


      <input
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


{Object.entries(groupedEntries).map(
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

          <p><>{entry.text}</> </p>

          <div style={{
            fontSize: ".875rem",
            color: "#5a5a5a",
          }}
          >{capitalize(
            entry.versions
             .map(capitalize)
              .join(" / "))}</div>
  
        </div>
      ))}
    </div>
  )
)}
    </div>
    </div>
  );
}

export default DexEntriesPage;
