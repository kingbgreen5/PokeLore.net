import {
  useParams
} from "react-router-dom";

import {
  useEffect,
  useState,
  useRef
} from "react";

import { useNavigate }
from "react-router-dom";



import typeColors from "../constants/typeColors";
import LearnsetCard from "../components/LearnsetCard";
import DexEntryCard from "../components/DexEntryCard.jsx";
import TypeEffectivenessCard from "../components/TypeEffectivenessCard";
import EvolutionNode from "../components/EvolutionNode";
import BaseStatsChart from "../components/BaseStatsChart";
import PokemonSummaryCard from "../components/PokemonSummaryCard.jsx";
import WhereToFind from "../components/WhereToFind";
import Seo from "../seo/Seo";
import { pokemonSeo } from "../seo/seoConfig";





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

function getFormKey(pokemon) {
  if (
    !pokemon ||
    !pokemon.species ||
    pokemon.name === pokemon.species
  ) {
    return null;
  }

  const prefix =
    `${pokemon.species}-`;

  if (
    pokemon.name.startsWith(prefix)
  ) {
    return pokemon.name.slice(
      prefix.length
    );
  }

  return null;
}

function PokemonDetailPage() {
  const evolutionScrollRef = useRef(null);
const rootNodeRef = useRef(null);
const { id } = useParams();

const navigate = useNavigate();

const [pokemon, setPokemon] = useState(null);
const [learnsetData, setLearnsetData] = useState(null);
const [loading, setLoading] = useState(true);
const [evolutionData, setEvolutionData] = useState(null);
const [movesData, setMovesData] = useState({});
//---------------------------------------------------------------------LOAD POKEMON USE EFFECT---------------------------------------------------------------------
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

      const movesResponse =
        await fetch(
          "/data/moves.json"
        );

      const movesJson =
        await movesResponse.json();

      setMovesData(movesJson);

      try {
        const learnsetResponse =
          await fetch(
            `/data/pokemonLearnsets/${id}.json`
          );

        if (!learnsetResponse.ok) {
          throw new Error(
            `Missing learnset for ${id}`
          );
        }

        const learnsetJson =
          await learnsetResponse.json();

        setLearnsetData(
          learnsetJson
        );
      } catch (error) {
        console.warn(
          "Failed to load learnset:",
          error
        );

        setLearnsetData(null);
      }

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



// 2. center scroll AFTER render
useEffect(() => {
  if (!evolutionData) return;

  const container =
    evolutionScrollRef.current;

  const root =
    rootNodeRef.current;

  if (!container || !root) return;

  const treeIsScrollable =
    container.scrollWidth >
    container.clientWidth;

  // If the tree is narrow, let CSS center it.
  if (!treeIsScrollable) {
    container.scrollLeft = 0;
    return;
  }

  const containerRect =
    container.getBoundingClientRect();

  const rootRect =
    root.getBoundingClientRect();

  const scrollOffset =
    (rootRect.left + rootRect.width / 2) -
    (containerRect.left + containerRect.width / 2);

  container.scrollLeft += scrollOffset;

}, [evolutionData]);

if (loading) {
  return <p>Loading...</p>;
}

const activeFormKey =
  getFormKey(pokemon);


//----------------------------------------RETURN STATEMENT-----------------------------------------

  return (


    <div
      style={{
        padding: "2rem"
      }}
    >
      <Seo {...pokemonSeo(pokemon)} />

      {/* // ---------------------------------------RETURN STATEMENT-----------------------------------------*/}
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

{/* 
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
</div> */}




      {/* Types */}
    
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: ".5rem",
          marginBottom: "1rem"

          
        }}
      >
 
        {pokemon.types.map(
          type => (
            <button
              key={type}
              onClick={() =>
                navigate(
                  `/type/${type}`
                )
              }
              style={{
                backgroundColor:
                  typeColors[
                    type
                  ],
                border: "none",
                color: "white",
                cursor: "pointer",
                padding:
                  ".4rem .9rem",
                borderRadius:
                  "999px",
                  textTransform: "uppercase"
              }}
            >
              {type}
            </button>
          )
        )}
      </div>

{/* Abilities */}

<h2>Abilities</h2>

<div
  style={{
    display: "flex",
       justifyContent: "center",
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


<div>

  {/*//-----------------------------------------Forms----------------------------------------- */}



{pokemon.varieties?.length > 1 && (
  <>
    <h2>Forms</h2>

    <div
      style={{
        // display: "flex",
        // justifyContent: "center",
        // gap: "1rem",
        // flexWrap: "wrap",
        //      gridTemplateColumns:
        //     "repeat(auto-fit, minmax(120px, 1fr))",


          display: "grid",
          justifyItems: "center",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "1rem"



      }}
    >
      {pokemon.varieties.map(
        form => (
          <PokemonSummaryCard
            key={form.id}
            pokemon={form}
            compact={true}
          />
        )
      )}
    </div>
  </>
)}








  
</div>

<div 



   >
<BaseStatsChart
  stats={pokemon.stats}
/>

<TypeEffectivenessCard
  types={pokemon.types}
/>



  


      {/*---------------------------------------------------------- Stats */}






</div>


            {/* ---------------------------------------------------------Evolution Line */}





<div

    style={{
 marginTop: "2rem",
    }}
    

>

<h2>Evolution Chain</h2>
<div
  ref={evolutionScrollRef}
  style={{
    overflowX: "auto",
    width: "100%"
  }}
>
  <div
    style={{
      width: "max-content",
      margin:'0 auto',
    }}
  >
    {evolutionData?.root && (
<EvolutionNode
  node={evolutionData.root}
   isRoot={true}
  rootRef={rootNodeRef}
  activeFormKey={activeFormKey}
 
/>
    )}
  </div>
</div>

</div>




{learnsetData ? (
  <LearnsetCard
    pokemonData={learnsetData}
    movesData={movesData}
  />
) : (
  <p>No learnset data loaded.</p>
)}





<DexEntryCard
  // entries={dexEntries}
    entries={pokemon.dexEntries}
/>

<WhereToFind
  pokemonId={pokemon.id}
/>

    <h2>Catch Rate</h2>
      <p>
        {pokemon.catchRate}
      </p>






    </div>
  );
}

export default PokemonDetailPage;
