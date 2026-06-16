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
import EvolutionNode
from "../components/EvolutionNode";




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

      //-------------------------------------
      // Pokemon
      //-------------------------------------

      const pokemonResponse =
        await fetch(
          `/data/pokemonData/${id}.json`
        );

      const pokemonData =
        await pokemonResponse.json();

      setPokemon(
        pokemonData
      );

      //-------------------------------------
      // Learnsets + Moves
      //-------------------------------------

      const [
        learnsetResponse,
        movesResponse
      ] = await Promise.all([

        fetch(
          `/data/pokemonLearnsets/${id}.json`
        ),

        fetch(
          "/data/moves.json"
        )

      ]);

      const [
        learnsetJson,
        movesJson
      ] = await Promise.all([

        learnsetResponse.json(),

        movesResponse.json()

      ]);

      setLearnsetData(
        learnsetJson
      );

      setMovesData(
        movesJson
      );

      //-------------------------------------
      //  Evolution Data
      //-------------------------------------



// const evolutionResponse =
//   await fetch(
//     "/data/evolutions.json"
//   );

// const evolutions =
//   await evolutionResponse.json();

// setEvolutionData(
//   evolutions[id]
// );


// console.log(
//   "Evolution Data:",
//   evolutions[id]
// );

const evolutionResponse =
  await fetch(
    `/data/evolutionChains/${pokemonData.evolutionChainId}.json`
  );

const evolutionJson =
  await evolutionResponse.json();

setEvolutionData(
  evolutionJson
);







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

{/* 
//-----------------------------------------Forms----------------------------------------- */}

<h2>Forms</h2>

<div
  style={{
    display: "flex",
    gap: ".5rem",
    flexWrap: "wrap",
    marginBottom: "1rem"
  }}
>
  {pokemon.varieties?.map(
    form => (
      <button
        key={form.id}
        onClick={() =>
          navigate(
            `/pokemon/${form.id}`
          )
        }
      >
        {capitalize(
          form.name
        )}
      </button>
    )
  )}
</div>




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

{/* <h2>Evolution Line</h2>
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
 */}
<div></div>

<h2>Evolution</h2>

{evolutionData?.root && (

  <EvolutionNode
    node={
      evolutionData.root
    }
  />

)}



{learnsetData ? (
  <LearnsetCard
    pokemonData={learnsetData}
    movesData={movesData}
    setSelectedMove={setSelectedMove}
  />
) : (
  <p>No learnset data loaded.</p>
)}





<DexEntryCard
  // entries={dexEntries}
    entries={pokemon.dexEntries}
/>


    <h2>Catch Rate</h2>
      <p>
        {pokemon.catchRate}
      </p>






    </div>
  );
}

export default PokemonDetailPage;