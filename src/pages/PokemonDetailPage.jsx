import {
  Link,
  Navigate,
  useLocation,
  useParams
} from "react-router-dom";

import {
  useEffect,
  useState,
  useRef
} from "react";

import LearnsetCard from "../components/LearnsetCard";
import DexEntryCard from "../components/DexEntryCard.jsx";
import TypeEffectivenessCard from "../components/TypeEffectivenessCard";
import EvolutionNode from "../components/EvolutionNode";
import BaseStatsChart from "../components/BaseStatsChart";
import OaksNotes from "../components/OaksNotes";
import PokemonGoNotes from "../components/PokemonGoNotes";
import PokemonSummaryCard from "../components/PokemonSummaryCard.jsx";
import PokemonDetailArtwork from "../components/PokemonDetailArtwork";
import TypeBadge from "../components/TypeBadge";
import WhereToFind from "../components/WhereToFind";
import HeldItems from "../components/HeldItems";
import SizeComparison from "../components/SizeComparison"
import AdditionalImages from "../components/AdditionalImages";
import Seo from "../seo/Seo";
import PokemonSpriteCarousel from "../components/PokemonSpriteCarousel.jsx"
import { pokemonSeo } from "../seo/seoConfig";
import { readJsonFile } from "../utils/readJsonFile";
import { loadMovesMap } from "../utils/loadMovesData";
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

function normalizePokemonIdentifier(
  identifier
) {
  try {
    return decodeURIComponent(
      String(identifier ?? "")
    )
      .trim()
      .toLowerCase();
  } catch {
    return String(identifier ?? "")
      .trim()
      .toLowerCase();
  }
}

function isNumericIdentifier(identifier) {
  return /^\d+$/.test(identifier);
}

function applySelectedVariety(
  pokemonData,
  normalizedIdentifier
) {
  const selectedVariety =
    pokemonData.varieties?.find(
      variety =>
        variety.name ===
        normalizedIdentifier
    );

  if (!selectedVariety) {
    return pokemonData;
  }

  return {
    ...pokemonData,
    name: selectedVariety.name,
    id: selectedVariety.id,
    isDefaultForm:
      selectedVariety.isDefault,
    sprite:
      selectedVariety.sprite ??
      pokemonData.sprite,
    spriteFallback:
      selectedVariety.spriteFallback,
    types:
      selectedVariety.types ??
      pokemonData.types
  };
}

function PokemonDetailPage() {
  const evolutionScrollRef = useRef(null);
const rootNodeRef = useRef(null);
const { identifier } = useParams();
const location = useLocation();

const [pokemon, setPokemon] = useState(null);
const [learnsetData, setLearnsetData] = useState(null);
const [loading, setLoading] = useState(true);
const [notFound, setNotFound] = useState(false);
const [redirectPath, setRedirectPath] = useState(null);
const [evolutionData, setEvolutionData] = useState(null);
const [evolutionMethodOverrides, setEvolutionMethodOverrides] = useState({});
const [movesData, setMovesData] = useState({});
const [oaksNotes, setOaksNotes] = useState(null);
const [pokemonGoNotes, setPokemonGoNotes] = useState(null);
const [learnsetLoading, setLearnsetLoading] = useState(false);
const [evolutionLoading, setEvolutionLoading] = useState(false);
//---------------------------------------------------------------------LOAD POKEMON USE EFFECT---------------------------------------------------------------------
useEffect(() => {
  let isActive = true;

  async function loadPokemon() {
    try {

      setLoading(true);
      setNotFound(false);
      setRedirectPath(null);
      setPokemon(null);
      setLearnsetData(null);
      setEvolutionData(null);
      setEvolutionMethodOverrides({});
      setMovesData({});
      setOaksNotes(null);
      setPokemonGoNotes(null);
      setLearnsetLoading(false);
      setEvolutionLoading(false);

      const normalizedIdentifier =
        normalizePokemonIdentifier(
          identifier
        );

      const routesResponse =
        await fetch(
          "/data/pokemonRoutes.json"
        );

      if (!routesResponse.ok) {
        throw new Error(
          "Failed to load Pokémon route lookup"
        );
      }

      const routes =
        await routesResponse.json();

      if (!isActive) {
        return;
      }

      if (
        isNumericIdentifier(
          normalizedIdentifier
        )
      ) {
        const canonicalName =
          routes.byId?.[
            normalizedIdentifier
          ];

        if (!canonicalName) {
          setNotFound(true);
          return;
        }

        setRedirectPath(
          `/pokemon/${canonicalName}${location.search}`
        );
        return;
      }

      const pokemonId =
        routes.byName?.[
          normalizedIdentifier
        ];

      if (!pokemonId) {
        setNotFound(true);
        return;
      }

      if (
        normalizedIdentifier !==
        identifier
      ) {
        setRedirectPath(
          `/pokemon/${normalizedIdentifier}${location.search}`
        );
        return;
      }

      //-------------------------------------
      // Pokemon
      //-------------------------------------

      const pokemonResponse =
        await fetch(
          `/data/pokemonData/${pokemonId}.json`
        );

      if (!isActive) {
        return;
      }

      if (!pokemonResponse.ok) {
        setNotFound(true);
        return;
      }

      const pokemonData =
        await pokemonResponse.json();

      if (!isActive) {
        return;
      }

      const selectedPokemon =
        applySelectedVariety(
          pokemonData,
          normalizedIdentifier
        );

      const [
        oaksNotesData,
        pokemonGoNotesData
      ] = await Promise.all([
        readJsonFile(
          `/data/oaksNotes/pokemon/${selectedPokemon.name}.json`
        ),
        readJsonFile(
          `/data/pokemonGo/pokemon/${selectedPokemon.name}.json`
        )
      ]);

      if (!isActive) {
        return;
      }

      setPokemon(
        selectedPokemon
      );
      setOaksNotes(oaksNotesData);
      setPokemonGoNotes(pokemonGoNotesData);
      setLoading(false);
      setEvolutionLoading(true);

      const evolutionResponsePromise =
        fetch(
          `/data/evolutionChains/${pokemonData.evolutionChainId}.json`
        );

      const evolutionOverridesPromise =
        readJsonFile(
          "/data/evolutionMethodOverrides.json",
          {
            warn: true
          }
        );

      //-------------------------------------
      // Learnsets + Moves
      //-------------------------------------

      setLearnsetLoading(true);

      const learnsetResponsePromise =
        fetch(
          `/data/pokemonLearnsets/${pokemonId}.json`
        );

      void (async () => {
      try {
        const movesJson =
          await loadMovesMap();

        if (!isActive) {
          return;
        }

        setMovesData(movesJson);

        const learnsetResponse =
          await learnsetResponsePromise;

        if (!isActive) {
          return;
        }

        if (!learnsetResponse.ok) {
          throw new Error(
            `Missing learnset for ${pokemonId}`
          );
        }

        const learnsetJson =
          await learnsetResponse.json();

        if (!isActive) {
          return;
        }

        setLearnsetData(
          learnsetJson
        );
      } catch (error) {
        if (!isActive) {
          return;
        }

        console.warn(
          "Failed to load learnset:",
          error
        );

        setLearnsetData(null);
      } finally {
        if (isActive) {
          setLearnsetLoading(false);
        }
      }
      })();

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

try {
  const [
    evolutionResponse,
    evolutionOverrides
  ] = await Promise.all([
    evolutionResponsePromise,
    evolutionOverridesPromise
  ]);

  if (!evolutionResponse.ok) {
    throw new Error(
      `Missing evolution chain for ${pokemonData.evolutionChainId}`
    );
  }

  const evolutionJson =
    await evolutionResponse.json();

  if (!isActive) {
    return;
  }

  setEvolutionData(
    evolutionJson
  );

  setEvolutionMethodOverrides(
    evolutionOverrides ?? {}
  );
} catch (error) {
  if (!isActive) {
    return;
  }

  console.warn(
    "Failed to load evolution data:",
    error
  );

  setEvolutionData(null);
  setEvolutionMethodOverrides({});
} finally {
  if (isActive) {
    setEvolutionLoading(false);
  }
}







    } catch (error) {
      if (!isActive) {
        return;
      }

      console.error(
        "Failed to load Pokémon:",
        error
      );
      setNotFound(true);

    } finally {
      if (isActive) {
        setLoading(false);
      }

    }
  }

  loadPokemon();

  return () => {
    isActive = false;
  };

}, [
  identifier,
  location.search
]);



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

if (redirectPath) {
  return (
    <Navigate
      to={redirectPath}
      replace
    />
  );
}

if (loading) {
  return <p>Loading...</p>;
}

if (notFound || !pokemon) {
  return (
    <p>
      Pokémon not found.
    </p>
  );
}

const activeFormKey =
  getRegionalFormKey(pokemon);
const searchParams =
  new URLSearchParams(
    location.search
  );
const sizeReviewValue =
  searchParams.get("size-review");
const sizeReviewMode =
  searchParams.has("size-review") &&
  sizeReviewValue !== "0" &&
  sizeReviewValue !== "false";



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

      
      {/*
        Previous remote artwork implementation, retained for quick rollback:

        <img
          key={`${pokemon.id}-${pokemon.name}-${pokemon.sprite}`}
          src={pokemon.sprite}
          alt={formatPokemonDisplayName(pokemon)}
          onError={event =>
            advanceSpriteFallback(
              event,
              getPokemonSpriteFallbacks(pokemon)
            )
          }
          style={{ width: "250px" }}
        />
      */}

      <PokemonDetailArtwork
        key={`${pokemon.id}-${pokemon.name}-${pokemon.sprite}`}
        alt={formatPokemonDisplayName(
          pokemon
        )}
        pokemon={pokemon}
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
            <Link
              key={type}
              to={`/type/${type}`}
              style={{
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                textDecoration: "none"
              }}
            >
              <TypeBadge
                height="2rem"
                type={type}
              />
            </Link>
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

      <Link
        key={abilitySlug}
        to={`/ability/${abilitySlug}`}
        style={{
          padding:
            ".4rem .8rem",

          borderRadius:
            "999px",

          border: "none",

          cursor: "pointer",

          textDecoration: "none"
          
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
      </Link>

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
    {evolutionLoading && (
      <p>Loading evolution chain...</p>
    )}

    {!evolutionLoading && evolutionData?.root && (
<EvolutionNode
  node={evolutionData.root}
   isRoot={true}
  rootRef={rootNodeRef}
  activeFormKey={activeFormKey}
  currentPokemonName={pokemon.name}
  evolutionMethodOverrides={evolutionMethodOverrides}
 
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


{learnsetLoading ? (
  <p>Loading learnsets...</p>
) : learnsetData ? (
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

<HeldItems
  key={`held-items-${pokemon.id}`}
  pokemonId={pokemon.id}
/>

<OaksNotes note={oaksNotes} />

<PokemonGoNotes note={pokemonGoNotes} />

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
