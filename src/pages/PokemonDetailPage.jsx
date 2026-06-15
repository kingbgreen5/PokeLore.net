import {
  useParams
} from "react-router-dom";

import {
  useEffect,
  useState
} from "react";

import { useNavigate }
from "react-router-dom";

import typeColors from "../constants/typeColors";
import MoveDetailPage from "./MoveDetailPage";
import LearnsetCard from "../components/LearnsetCard";
import DexEntryCard from "../components/DexEntryCard.jsx";





function capitalize(text) {
  return text
    .split("-")
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function PokemonDetailPage() {
const { id } = useParams();

const pokemonId =
  isNaN(id)
    ? id.toLowerCase()
    : Number(id);
    
  const [pokemon, setPokemon] =
    useState(null);


    const [learnsetData, setLearnsetData] =
  useState(null);

    const [loading, setLoading] =
    useState(true);
const navigate = useNavigate();


const [dexEntries, setDexEntries] =
  useState([]);

  const [evolutionData, setEvolutionData] =
  useState(null);



  // useEffect(() => {
  //   import(
  //     `../public/data/pokemonData${id}.json`
  //   ).then(data => {
  //     setPokemon(data.default);
  //   });
  // }, [id]);

  const [movesData, setMovesData] =
    useState({});
    
    const [selectedMove, setSelectedMove] =
               useState(null);


useEffect(() => {
 async function loadPokemon() {

  try {

    setLoading(true);

    //-----------------------------------------
    // Load Pokémon Index
    //-----------------------------------------

    const indexResponse =
      await fetch(
        "/data/pokemonIndex.json"
      );

    const pokemonIndex =
      await indexResponse.json();

    //-----------------------------------------
    // Find Matching Pokémon
    //-----------------------------------------

    const matchedPokemon =
      pokemonIndex.find(
        pokemon =>

          pokemon.name ===
            id.toLowerCase()

          ||

          pokemon.id.toString() === id
      );

    //-----------------------------------------
    // Safety Check
    //-----------------------------------------

    if (!matchedPokemon) {

      console.error(
        "Pokémon not found"
      );

      setLoading(false);

      return;
    }

    //-----------------------------------------
    // Fetch Actual Pokémon Data
    //-----------------------------------------

    const response =
      await fetch(
        `/data/pokemonData/${matchedPokemon.id}.json`
      );

    const data =
      await response.json();

    setPokemon(data);

    //-----------------------------------------
    // Load Learnsets
    //-----------------------------------------

    const learnsetResponse =
      await fetch(
        "/data/learnsets.json"
      );

    const learnsets =
      await learnsetResponse.json();

    const matchedLearnset =
      learnsets.find(
        entry =>
          entry.pokemon === data.name
      );

    setLearnsetData(
      matchedLearnset
    );

    //-----------------------------------------
    // Load Evolutions
    //-----------------------------------------

const evolutionResponse =
  await fetch(
    "/data/evolutions.json"
  );

const evolutions =
  await evolutionResponse.json();

setEvolutionData(
  evolutions[id]
);


//-----------------------------------------
// Load Dex Entries
//-----------------------------------------

const dexResponse =
  await fetch(
    "/data/condensedEntries.json"
  );

const dexData =
  await dexResponse.json();

const pokemonEntries =
  dexData.filter(
    entry =>
      entry.pokemon === data.name
  );

setDexEntries(
  pokemonEntries
);

    //-----------------------------------------
    // Load Moves
    //-----------------------------------------

    const movesResponse =
      await fetch(
        "/data/moves.json"
      );

    const movesJson =
      await movesResponse.json();

    setMovesData(movesJson);

  } catch (error) {

    console.error(
      "Failed to load Pokémon:",
      error
    );

  } finally {

    setLoading(false);

  }
}









  loadPokemon();
}, [id]);


if (loading) {
  return <p>Loading...</p>;
}

const baseStatTotal =
  Object.values(
    pokemon.stats
  ).reduce(
    (sum, stat) => sum + stat,
    0
  );


//----------------------------------------RETURN STATEMENT-----------------------------------------

  return (
    <div
      style={{
        padding: "2rem"
      }}
    >
      <h1>
       
        {capitalize(
          pokemon.name
        )}
      </h1>

      <img
        src={pokemon.sprite}
        alt={pokemon.name}
        style={{
          width: "250px"
        }}
      />
<h5> No. {pokemon.id}.</h5>

      {/* Types */}

      <div
        style={{
          display: "flex",
          gap: ".5rem",
          marginBottom: "1rem"
          
        }}
      >
        
        {pokemon.types.map(
          type => (
            <span
              key={type}
              style={{
                backgroundColor:
                  typeColors[
                    type
                  ],
                color: "white",
                padding:
                  ".4rem .9rem",
                borderRadius:
                  "999px"
              }}
            >
              {type}
            </span>
          )
        )}
      </div>

{/* Abilities */}

<h2>Abilities</h2>

<div
  style={{
    display: "flex",
    gap: ".5rem",
    flexWrap: "wrap",
    marginBottom: "1rem"
  }}
>
  {pokemon.abilities.map(
    ability => (

      <button
        key={ability}

        onClick={() =>
          navigate(
            `/ability/${ability}`
          )
        }

        style={{
          padding:
            ".4rem .8rem",

          borderRadius:
            "999px",

          border: "none",

          cursor: "pointer"
          
        }}
      >
        {capitalize(
          ability
        )}
      </button>

    )
  )}
</div>


  


      {/* Stats */}

      <h2>Base Stats</h2>

<div
  style={{
    marginTop: "1rem",
    fontWeight: "bold",
    fontSize: "1.1rem"
  }}
>
  Total: {baseStatTotal}
</div>
      {Object.entries(
        pokemon.stats
      ).map(([stat, value]) => (
        <div key={stat}>
          {capitalize(stat)}:{" "}
          {value}
        </div>
      ))}


            {/* Evolution Line */}

<h2>Evolution Line</h2>
{evolutionData?.chain?.map(
  (evolution, index) => (
    <div key={index}>


      {evolution.level && (
        <div>
          ↓ Lv.
          {evolution.level}
        </div>
      )}


      <button
        onClick={() =>
          navigate(
            `/pokemon/${evolution.id}`
          )
        }
      >
        
        {capitalize(
          evolution.name
        )}
      </button>

      

    </div>
  )
)}


{learnsetData && (
  <>
  

    <LearnsetCard
      pokemonData={learnsetData}
      movesData={movesData}
      setSelectedMove={
        setSelectedMove
      }
    />
  </>
)}

<DexEntryCard
  entries={dexEntries}
/>


    <h2>Catch Rate</h2>
      <p>
        {pokemon.catchRate}
      </p>






    </div>
  );
}

export default PokemonDetailPage;