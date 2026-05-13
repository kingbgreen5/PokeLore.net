import { useEffect, useState } from "react";
import { capitalize } from "../utils/capitalize";

function DexEntriesPage() {
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      const response = await fetch("/data/condensedEntries.json");
      const data = await response.json();

      setEntries(data);
    }

    loadData();
  }, []);

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


const backgroundimg = {
       backgroundImage: 'url("/images/background.png")',
            height: "60vh",
            marginTop: "50px",
            // backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
        };



//-----------------------------------------------RETURN STATEMENT--------------------------------------------------
  return (
  <div > 
    <div style={{ padding: "2rem" }} >
<h5></h5>
      <div >


{/* 
------------------------------------------------SEARCH BAR-------------------------------------------------- */}


      <input
        type="text"
        placeholder=" Search entries... Ex: 'forest', 'cave', 'sea'..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "90%",
          padding: "1rem",
          marginBottom: "2rem",
          fontSize: ".75 rem"
        }}
      />
        </div>

      <p>
        Showing {filteredEntries.length} results
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
        {capitalize(pokemonName)}
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