import {
  useLocation,
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
import SizeComparison from "../components/SizeComparison"
import AdditionalImages from "../components/AdditionalImages";
import Seo from "../seo/Seo";
import PokemonSpriteCarousel from "../components/PokemonSpriteCarousel.jsx"
import { pokemonSeo } from "../seo/seoConfig";
import {
  formatPokemonDisplayName,
  getRegionalFormKey
} from "../utils/pokemonNames";





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

function getAbilityDisplayName(ability) {
  return typeof ability === "string"
    ? capitalize(ability)
    : ability.name;
}

function getAbilitySlug(ability) {
  const abilityName =
    typeof ability === "string"
      ? ability
      : ability.name;

  return String(abilityName)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function isHiddenAbility(
  ability,
  index
) {
  if (
    typeof ability === "object" &&
    ability !== null &&
    "hidden" in ability
  ) {
    return ability.hidden === true;
  }

  return index === 2;
}

function PokemonDetailPage() {
  const evolutionScrollRef = useRef(null);
const rootNodeRef = useRef(null);
const { id } = useParams();
const location = useLocation();

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
  getRegionalFormKey(pokemon);
const sizeReviewMode =
  new URLSearchParams(
    location.search
  ).get("size-review") === "1";



  const correctionFactor = 10
const pokemonHeight = (pokemon.height / correctionFactor) +" m.";
 const meterToInches= 39.370079
 const pokemonHeightInches = (pokemon.height / correctionFactor)*meterToInches;
 // eslint-disable-next-line no-unused-vars
 const pokemonHeightEnglish = (pokemonHeightInches / 12)



// eslint-disable-next-line no-unused-vars
const weightCorrection= 10;
const pokemonWeight = (pokemon.weight / correctionFactor) +" kg.";



function formatHeightEnglish(height) {
  const totalInches = Math.round((height / 10) * 39.3701);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;

  return `${feet}' ${inches}"`;
}

function formatWeightEnglish(weight) {
  const pounds = (weight / 10) * 2.20462;
  return `${pounds.toFixed(1)} lbs`;
}




//----------------------------------------RETURN STATEMENT-----------------------------------------

  return (


    <div
      style={{
        padding: "1rem"
      }}
    >
      <Seo {...pokemonSeo(pokemon)} />

      
      <img
        src={pokemon.sprite}
        alt={formatPokemonDisplayName(
          pokemon
        )}
        style={{
          width: "250px"
        }}
      />


      <h1>
       
        {formatPokemonDisplayName(
          pokemon
        )}
      </h1>




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
    (ability, index) => {
      const abilitySlug =
        getAbilitySlug(ability);
      const abilityDisplayName =
        getAbilityDisplayName(ability);
      const hiddenAbility =
        isHiddenAbility(
          ability,
          index
        );

      return (

      <button
        key={abilitySlug}

        onClick={() =>
          navigate(
            `/ability/${abilitySlug}`
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
        {abilityDisplayName}

        {hiddenAbility && (
          <span
            style={{
              display: "block",
              fontSize: ".65rem",
              marginTop: ".15rem",
              opacity: 0.75
            }}
          >
            Hidden Ability
          </span>
        )}
      </button>

    );
    }
  )}
</div>



<div  >
    
      {/*---------------------------------------------------------- Stats */}



<BaseStatsChart
  stats={pokemon.stats}
/>

<TypeEffectivenessCard
  types={pokemon.types}
/>



  





</div>


            {/* ---------------------------------------------------------Evolution Line */}

<div

    style={{
 marginTop: "2rem",
//  marginBottom:"1rem"
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





<div className="formDiv">

  {/*//-----------------------------------------Forms----------------------------------------- */}

{pokemon.varieties?.length > 1 && (
  <>
    <h2>Forms</h2>

    <div
      style={{
          display: "grid",
          justifyItems: "center",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "1rem",
          marginBottom:"1rem"


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


{learnsetData ? (
  <LearnsetCard
    key={`learnset-${pokemon.id}`}
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
  key={`where-to-find-${pokemon.id}`}
  pokemonId={pokemon.id}
/>

<AdditionalImages
  pokemonId={pokemon.id}
  pokemonName={formatPokemonDisplayName(
    pokemon
  )}
/>

<div 
      style={{
          marginBottom:"1rem"
      }}>




<h2



>Biological Data</h2>
      <p>
       Species: {pokemon.genus}
      </p>
      
       <p>Height: {formatHeightEnglish(pokemon.height)} ({pokemonHeight})</p>



<p>Weight: {formatWeightEnglish(pokemon.weight)} ({pokemonWeight})</p>

           



{pokemon.habitat != null ? (
 <p 
            style={{
              textTransform:'capitalize'
            }}
            >
           Habitat: {pokemon.habitat}
      </p>
) : (


 <p 
            style={{
              textTransform:'capitalize'
            }}
            >
           Habitat: Currently Unknown
      </p>

)}











              <p
                  style={{
              textTransform:'capitalize'
            }}>
           Color: {pokemon.color}
      </p>

        <p
            style={{
              textTransform:'capitalize'
            }}>
           Body Style: {pokemon.shape}
      </p>
      

      </div>
<h2>Misc</h2>
      <p>
       Catch Rate: {pokemon.catchRate}
      </p>
      <p>
       Base Experience: {pokemon.baseExperience} Exp
      </p>
            <p>
       Hatch Counter: {pokemon.hatchCounter}
      </p>

<SizeComparison
  pokemon={pokemon}
  reviewMode={sizeReviewMode}
/>

<PokemonSpriteCarousel
  pokemon={pokemon}
/>


    </div>
  );
}

export default PokemonDetailPage;
