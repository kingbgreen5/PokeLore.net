import {
  Link,
  Navigate,
  useLocation,
  useParams
} from "react-router-dom";

import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState
} from "react";

import CollapsibleSection from "../components/CollapsibleSection";
import TypeEffectivenessCard from "../components/TypeEffectivenessCard";
import BaseStatsChart from "../components/BaseStatsChart";
import PokemonDetailArtwork from "../components/PokemonDetailArtwork";
import PokemonDescriptionSection from "../components/PokemonDescriptionSection";
import TypeBadge from "../components/TypeBadge";
import DeferredSection from "../components/DeferredSection";
import Seo from "../seo/Seo";
import { pokemonSeo } from "../seo/seoConfig";
import { readJsonFile } from "../utils/readJsonFile";
import { loadMovesMap } from "../utils/loadMovesData";
import {
  formatPokemonDisplayName,
  getRegionalFormKey
} from "../utils/pokemonNames";
import {
  getPokemonUrl,
  resolvePokemonRouteIdentifier
} from "../utils/pokemonUrls";

const DEFERRED_DETAILS_WARMUP_DELAY_MS = 1600;
const DEFERRED_SECTION_ROOT_MARGIN = "1200px 0px";
const DEEP_DEFERRED_SECTION_DELAY_MS = 2800;

const loadLearnsetCard = () =>
  import("../components/LearnsetCard");
const loadDexEntryCard = () =>
  import("../components/DexEntryCard.jsx");
const loadEvolutionNode = () =>
  import("../components/EvolutionNode");
const loadFormEvolutionPaths = () =>
  loadEvolutionNode().then(
    module => ({
      default: module.FormEvolutionPaths
    })
  );
const loadOaksNotes = () =>
  import("../components/OaksNotes");
const loadPokemonGoNotes = () =>
  import("../components/PokemonGoNotes");
const loadPokemonSummaryCard = () =>
  import("../components/PokemonSummaryCard.jsx");
const loadWhereToFind = () =>
  import("../components/WhereToFind");
const loadPokeloreAnalysis = () =>
  import("../components/PokeloreAnalysis");
const loadPokemonBiologyData = () =>
  import("../components/PokemonBiologyData");
const loadHeldItems = () =>
  import("../components/HeldItems");
const loadAdditionalImages = () =>
  import("../components/AdditionalImages");
const loadSizeComparison = () =>
  import("../components/SizeComparison");
const loadPokemonSpriteCarousel = () =>
  import("../components/PokemonSpriteCarousel.jsx");

const LearnsetCard = lazy(loadLearnsetCard);
const DexEntryCard = lazy(loadDexEntryCard);
const EvolutionNode = lazy(loadEvolutionNode);
const FormEvolutionPaths = lazy(loadFormEvolutionPaths);
const OaksNotes = lazy(loadOaksNotes);
const PokemonGoNotes = lazy(loadPokemonGoNotes);
const PokemonSummaryCard = lazy(loadPokemonSummaryCard);
const WhereToFind = lazy(loadWhereToFind);
const PokeloreAnalysis = lazy(loadPokeloreAnalysis);
const PokemonBiologyData = lazy(loadPokemonBiologyData);
const HeldItems = lazy(loadHeldItems);
const AdditionalImages = lazy(loadAdditionalImages);
const SizeComparison = lazy(loadSizeComparison);
const PokemonSpriteCarousel = lazy(loadPokemonSpriteCarousel);

function warmPokemonDetailDeferredModules() {
  return Promise.allSettled([
    loadLearnsetCard(),
    loadDexEntryCard(),
    loadEvolutionNode(),
    loadFormEvolutionPaths(),
    loadOaksNotes(),
    loadPokemonGoNotes(),
    loadPokemonSummaryCard(),
    loadWhereToFind(),
    loadPokeloreAnalysis(),
    loadPokemonBiologyData(),
    loadHeldItems(),
    loadAdditionalImages(),
    loadSizeComparison(),
    loadPokemonSpriteCarousel()
  ]);
}

function schedulePokemonDetailWarmup(callback) {
  let cancelled = false;
  let timeoutId = null;
  let idleId = null;

  const queueWarmup = () => {
    timeoutId = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(
          () => {
            if (!cancelled) {
              callback();
            }
          },
          {
            timeout: 1200
          }
        );
        return;
      }

      callback();
    }, DEFERRED_DETAILS_WARMUP_DELAY_MS);
  };

  if (document.readyState === "complete") {
    queueWarmup();
  } else {
    window.addEventListener(
      "load",
      queueWarmup,
      {
        once: true
      }
    );
  }

  return () => {
    cancelled = true;
    window.removeEventListener(
      "load",
      queueWarmup
    );

    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }

    if (
      idleId &&
      "cancelIdleCallback" in window
    ) {
      window.cancelIdleCallback(idleId);
    }
  };
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

function LearnsetPlaceholder({
  loading,
  onReveal,
  titleColor,
  titleChevron = false
}) {
  return (
    <CollapsibleSection
      title="Learnsets"
      summary={
        loading
          ? "Loading moves"
          : "Preparing moves"
      }
      expanded={false}
      titleColor={titleColor}
      titleChevron={titleChevron}
      onToggle={onReveal}
      contentStyle={{
        marginTop: "1rem"
      }}
      seoVisible={false}
    />
  );
}

function PokemonDetailNotFound() {
  return (
    <main
      style={{
        margin: "0 auto",
        maxWidth: "720px",
        padding: "2rem 1rem",
        textAlign: "center"
      }}
    >
      <Seo
        title="Pokemon Not Found | PokeLore"
        description="We couldn't find a Pokemon matching this URL."
        canonicalAction="remove"
        robots="noindex, follow"
      />
      <h1>Pokemon Not Found</h1>
      <p>
        We couldn't find a Pokemon matching this URL.
      </p>
      <p
        style={{
          marginTop: "1rem"
        }}
      >
        <Link to="/">
          Return to Pokedex
        </Link>
      </p>
    </main>
  );
}

function PokemonDetailLoading() {
  return (
    <main
      aria-label="Loading Pokemon"
      style={{
        margin: "0 auto",
        maxWidth: "720px",
        padding: "2rem 1rem",
        textAlign: "center"
      }}
    >
      <Seo
        title="Loading Pokemon | PokeLore"
        description="Loading Pokemon details."
        canonicalAction="remove"
        robots="max-image-preview:large"
      />
      <p>Loading...</p>
    </main>
  );
}

function PokemonDetailUnavailable() {
  return (
    <main
      aria-label="Pokemon temporarily unavailable"
      style={{
        margin: "0 auto",
        maxWidth: "720px",
        padding: "2rem 1rem",
        textAlign: "center"
      }}
    >
      <Seo
        title="Pokemon Temporarily Unavailable | PokeLore"
        description="Pokemon details are temporarily unavailable."
        canonicalAction="remove"
        robots="max-image-preview:large"
      />
      <h1>Pokemon Temporarily Unavailable</h1>
      <p>
        Pokemon details are temporarily unavailable.
      </p>
    </main>
  );
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
const [loadError, setLoadError] = useState(null);
const [redirectPath, setRedirectPath] = useState(null);
const [evolutionData, setEvolutionData] = useState(null);
const [evolutionMethodOverrides, setEvolutionMethodOverrides] = useState({});
const [movesData, setMovesData] = useState({});
const [oaksNotes, setOaksNotes] = useState(null);
const [pokemonGoNotes, setPokemonGoNotes] = useState(null);
const [learnsetLoading, setLearnsetLoading] = useState(false);
const [evolutionLoading, setEvolutionLoading] = useState(false);
const [
  deferredDetailsReady,
  setDeferredDetailsReady
] = useState(false);
//---------------------------------------------------------------------LOAD POKEMON USE EFFECT---------------------------------------------------------------------
useEffect(() => {
  let isActive = true;

  async function loadPokemon() {
    try {

      setLoading(true);
      setNotFound(false);
      setLoadError(null);
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
      setDeferredDetailsReady(false);

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

      const routeResolution =
        resolvePokemonRouteIdentifier(
          identifier,
          routes
        );

      if (
        routeResolution.status ===
        "not-found"
      ) {
        setNotFound(true);
        return;
      }

      if (
        routeResolution.status ===
        "redirect"
      ) {
        setRedirectPath(
          getPokemonUrl(
            routeResolution.slug,
            location.search
          )
        );
        return;
      }

      //-------------------------------------
      // Pokemon
      //-------------------------------------

      const pokemonResponse =
        await fetch(
          `/data/pokemonData/${routeResolution.id}.json`
        );

      if (!isActive) {
        return;
      }

      if (!pokemonResponse.ok) {
        throw new Error(
          `Failed to load Pokémon data for ${routeResolution.slug}`
        );
      }

      const pokemonData =
        await pokemonResponse.json();

      if (!isActive) {
        return;
      }

      const selectedPokemon =
        applySelectedVariety(
          pokemonData,
          routeResolution.slug
        );

      setPokemon(
        selectedPokemon
      );
      setLoading(false);

    } catch (error) {
      if (!isActive) {
        return;
      }

      console.error(
        "Failed to load Pokémon:",
        error
      );
      setLoadError(error);

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

useEffect(() => {
  if (!pokemon || !deferredDetailsReady) {
    return undefined;
  }

  let isActive = true;

  async function loadSupplementalNotes() {
    const [
      oaksNotesData,
      pokemonGoNotesData
    ] = await Promise.all([
      readJsonFile(
        `/data/oaksNotes/pokemon/${pokemon.name}.json`
      ),
      readJsonFile(
        `/data/pokemonGo/pokemon/${pokemon.name}.json`
      )
    ]);

    if (!isActive) {
      return;
    }

    setOaksNotes(oaksNotesData);
    setPokemonGoNotes(pokemonGoNotesData);
  }

  loadSupplementalNotes();

  return () => {
    isActive = false;
  };
}, [
  deferredDetailsReady,
  pokemon
]);

useEffect(() => {
  if (!pokemon || !deferredDetailsReady) {
    return undefined;
  }

  let isActive = true;

  async function loadEvolutionData() {
    try {
      setEvolutionLoading(true);

      const [
        evolutionResponse,
        evolutionOverrides
      ] = await Promise.all([
        fetch(
          `/data/evolutionChains/${pokemon.evolutionChainId}.json`
        ),
        readJsonFile(
          "/data/evolutionMethodOverrides.json",
          {
            warn: true
          }
        )
      ]);

      if (!evolutionResponse.ok) {
        throw new Error(
          `Missing evolution chain for ${pokemon.evolutionChainId}`
        );
      }

      const evolutionJson =
        await evolutionResponse.json();

      if (!isActive) {
        return;
      }

      setEvolutionData(evolutionJson);
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
  }

  loadEvolutionData();

  return () => {
    isActive = false;
  };
}, [
  deferredDetailsReady,
  pokemon
]);

useEffect(() => {
  if (!pokemon || !deferredDetailsReady) {
    return undefined;
  }

  let isActive = true;

  async function loadLearnset() {
    try {
      setLearnsetLoading(true);

      const [
        movesJson,
        learnsetResponse
      ] = await Promise.all([
        loadMovesMap(),
        fetch(
          `/data/pokemonLearnsets/${pokemon.id}.json`
        )
      ]);

      if (!isActive) {
        return;
      }

      setMovesData(movesJson);

      if (!learnsetResponse.ok) {
        throw new Error(
          `Missing learnset for ${pokemon.id}`
        );
      }

      const learnsetJson =
        await learnsetResponse.json();

      if (!isActive) {
        return;
      }

      setLearnsetData(learnsetJson);
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
  }

  loadLearnset();

  return () => {
    isActive = false;
  };
}, [
  deferredDetailsReady,
  pokemon
]);

useEffect(() => {
  if (!pokemon || deferredDetailsReady) {
    return undefined;
  }

  return schedulePokemonDetailWarmup(() => {
    warmPokemonDetailDeferredModules();
    setDeferredDetailsReady(true);
  });
}, [
  deferredDetailsReady,
  pokemon
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
  return <PokemonDetailLoading />;
}

if (notFound) {
  return <PokemonDetailNotFound />;
}

if (loadError || !pokemon) {
  return <PokemonDetailUnavailable />;
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
const expandableTitleColor =
  "var(--link-unvisited)";
const familyEvolutionOverride =
  evolutionData?.root?.pokemon?.name
    ? evolutionMethodOverrides[
        evolutionData.root.pokemon.name
      ]
    : null;
const formEvolutionPaths =
  familyEvolutionOverride
    ?.formEvolutionPaths;
const useFormEvolutionPaths =
  Boolean(
    familyEvolutionOverride
      ?.replaceDefaultEvolutionDisplay &&
    Array.isArray(formEvolutionPaths) &&
    formEvolutionPaths.length > 0
  );
const visibleSpecialFormNotes =
  (
    familyEvolutionOverride
      ?.specialFormNotes ?? []
  ).filter(note =>
    note.pokemon === pokemon.name
  );

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

      <PokemonDescriptionSection
        key={`description-${pokemon.id}`}
        pokemon={pokemon}
      />

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
  evYield={pokemon.evYield}
/>

<TypeEffectivenessCard
  types={pokemon.types}
/>



  





</div>

<DeferredSection
  fallback={
    <div
      aria-hidden="true"
      style={{
        minHeight: "1px"
      }}
    />
  }
  onReveal={() =>
    setDeferredDetailsReady(true)
  }
  delayMs={2800}
  rootMargin={DEFERRED_SECTION_ROOT_MARGIN}
>
  <Suspense fallback={null}>


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
      width: useFormEvolutionPaths
        ? "100%"
        : "max-content",
      margin:'0 auto',
    }}
  >
    {evolutionLoading && (
      <p>Loading evolution chain...</p>
    )}

    {!evolutionLoading && evolutionData?.root && (
      useFormEvolutionPaths ? (
        <FormEvolutionPaths
          root={evolutionData.root}
          paths={formEvolutionPaths}
          currentPokemonName={pokemon.name}
        />
      ) : (
        <EvolutionNode
          node={evolutionData.root}
          isRoot={true}
          rootRef={rootNodeRef}
          activeFormKey={activeFormKey}
          currentPokemonName={pokemon.name}
          evolutionMethodOverrides={evolutionMethodOverrides}
        />
      )
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
    {visibleSpecialFormNotes.length > 0 && (
      <div
        className="form-special-notes"
        aria-label="Special form evolution notes"
      >
        {visibleSpecialFormNotes.map(
          note => (
            <p key={note.pokemon}>
              {note.note}
            </p>
          )
        )}
      </div>
    )}
  </>
  )}
</div>

  <PokeloreAnalysis
    key={`pokelore-analysis-${pokemon.id}`}
    pokemon={pokemon}
    pokemonId={pokemon.id}
    titleColor={expandableTitleColor}
    titleChevron={true}
  />

  {learnsetData ? (
    <Suspense fallback={null}>
      <LearnsetCard
        key={`learnset-${pokemon.id}`}
        pokemonData={learnsetData}
        movesData={movesData}
        titleColor={expandableTitleColor}
        titleChevron={true}
      />
    </Suspense>
  ) : (
    <LearnsetPlaceholder
      loading={
        deferredDetailsReady ||
        learnsetLoading
      }
      onReveal={() =>
        setDeferredDetailsReady(true)
      }
      titleColor={expandableTitleColor}
      titleChevron={true}
    />
  )}





  <DexEntryCard
    // entries={dexEntries}
      entries={pokemon.dexEntries}
      titleColor={expandableTitleColor}
      titleChevron={true}
  />

  <WhereToFind
    enabled={deferredDetailsReady}
    key={`where-to-find-${pokemon.id}`}
    pokemonId={pokemon.id}
    titleColor={expandableTitleColor}
    titleChevron={true}
  />

  <HeldItems
    enabled={deferredDetailsReady}
    key={`held-items-${pokemon.id}`}
    pokemonId={pokemon.id}
    titleColor={expandableTitleColor}
    titleChevron={true}
  />

  <OaksNotes note={oaksNotes} />

  <PokemonGoNotes note={pokemonGoNotes} />

  <AdditionalImages
    pokemonId={pokemon.id}
    pokemonName={formatPokemonDisplayName(
      pokemon
    )}
    titleColor={expandableTitleColor}
    titleChevron={true}
  />

  <PokemonBiologyData
    key={`biology-and-behavior-${pokemon.id}`}
    pokemon={pokemon}
    titleColor={expandableTitleColor}
    titleChevron={true}
  />

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

  <DeferredSection
    fallback={
      <div
        aria-hidden="true"
        style={{
          minHeight: "1px"
        }}
      />
    }
    delayMs={DEEP_DEFERRED_SECTION_DELAY_MS}
    rootMargin={DEFERRED_SECTION_ROOT_MARGIN}
  >
    <Suspense fallback={null}>
      <SizeComparison
        pokemon={pokemon}
        reviewMode={sizeReviewMode}
      />
    </Suspense>
  </DeferredSection>

  <DeferredSection
    fallback={
      <div
        aria-hidden="true"
        style={{
          minHeight: "1px"
        }}
      />
    }
    delayMs={DEEP_DEFERRED_SECTION_DELAY_MS}
    rootMargin={DEFERRED_SECTION_ROOT_MARGIN}
  >
    <Suspense fallback={null}>
      <PokemonSpriteCarousel
        pokemon={pokemon}
      />
    </Suspense>
  </DeferredSection>

  </Suspense>
</DeferredSection>


    </div>
  );
}

export default PokemonDetailPage;
