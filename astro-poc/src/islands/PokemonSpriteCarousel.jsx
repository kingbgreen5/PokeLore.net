// Adapted from production; see PARITY_PLAN.md.
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Anchor as Link } from "./Anchor.jsx";
import { publicHref } from "../lib/links.js";
import {
  advanceSpriteFallback,
  getPokemonCardSources
} from "../../../src/utils/pokemonSprites.js";
import { getPokemonUrl } from "../../../src/utils/pokemonUrls.js";

//---------------------------FORMAT NAME---------------------------

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

//---------------------------LOADING PLACEHOLDER---------------------------

function PokemonSpriteCarouselPlaceholder() {
  return (
    <section
      style={{
        margin: "1rem auto 2rem",
        maxWidth: "760px"
      }}
    >
      {/* //---------------------------PLACEHOLDER WINDOW--------------------------- */}

      <div
        aria-hidden="true"
        style={{
          alignItems: "center",
          borderRadius: "12px",
          boxSizing: "border-box",
          display: "flex",
          gap: "1rem",
          minHeight: "317px",
          overflow: "hidden",
          padding:
            "1rem calc(50% - 120px)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)"
        }}
      >
        {/* //---------------------------PLACEHOLDER CARDS--------------------------- */}

        {[0, 1, 2].map(index => (
          <div
            key={index}
            style={{
              backgroundColor:
                index === 1
                  ? "transparent"
                  : "#2c2c2c",
              border:
                index === 1
                  ? "2px solid transparent"
                  : "1px solid #666",
              borderRadius: "12px",
              boxSizing: "border-box",
              flex:
                index === 1
                  ? "0 0 110px"
                  : "0 0 110px",
              minHeight:
                index === 1
                  ? "142px"
                  : "142px",
              opacity:
                index === 1 ? 0.35 : 0.45
            }}
          />
        ))}
      </div>
    </section>
  );
}

//---------------------------SPRITE CAROUSEL---------------------------

function PokemonSpriteCarousel({
  pokemon,
  initialIndex,
  registryUrl,
  navigationCount
}) {
  //---------------------------ROUTER + REFS---------------------------

  const navigate = path => window.location.assign(publicHref(path));
  const location = { search: typeof window === "undefined" ? "" : window.location.search };
  const containerRef = useRef(null);
  const itemRefs = useRef(new Map());
  const dragStateRef = useRef({
    isDragging: false,
    moved: false,
    pressedPokemonName: null,
    startX: 0,
    scrollLeft: 0
  });
  const suppressClickRef = useRef(false);
  const registryRequestRef = useRef(null);

  //---------------------------STATE---------------------------

  const [pokemonIndex, setPokemonIndex] =
    useState(initialIndex);
  const [registryError, setRegistryError] =
    useState(false);
  const [isDragging, setIsDragging] =
    useState(false);
  const [
    isCurrentCentered,
    setIsCurrentCentered
  ] = useState(false);

  //---------------------------LOAD POKEMON INDEX---------------------------

  const hasFullIndex =
    pokemonIndex.length === navigationCount;

  const loadFullIndex = useCallback(async () => {
    if (hasFullIndex) return pokemonIndex;
    if (!registryRequestRef.current) {
      registryRequestRef.current = fetch(registryUrl, {
        headers: { Accept: "application/json" }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(
              `Navigation registry request failed: ${response.status}`
            );
          }
          return response.json();
        })
        .then(entries => {
          if (
            !Array.isArray(entries) ||
            entries.length !== navigationCount ||
            entries.some(entry =>
              !Number.isInteger(entry?.id) ||
              typeof entry?.name !== "string"
            )
          ) {
            throw new Error("Invalid Pokémon navigation registry");
          }
          setPokemonIndex(entries);
          setRegistryError(false);
          return entries;
        })
        .catch(error => {
          registryRequestRef.current = null;
          setRegistryError(true);
          throw error;
        });
    }
    return registryRequestRef.current;
  }, [hasFullIndex, navigationCount, pokemonIndex, registryUrl]);

  function requestFullIndex() {
    void loadFullIndex().catch(() => {});
  }

  //---------------------------CURRENT DISPLAYED POKEMON---------------------------

  const carouselPokemon = useMemo(() => {
    if (!pokemonIndex.length || !pokemon) {
      return null;
    }

    return (
      pokemonIndex.find(
        entry => entry.name === pokemon.name
      ) ??
      pokemonIndex.find(
        entry => entry.id === pokemon.id
      ) ??
      null
    );
  }, [
    pokemon,
    pokemonIndex
  ]);
  const carouselPokemonIndex =
    useMemo(
      () =>
        carouselPokemon
          ? pokemonIndex.findIndex(
              entry =>
                entry.name ===
                carouselPokemon.name
            )
          : -1,
      [
        carouselPokemon,
        pokemonIndex
      ]
    );

  //---------------------------CENTER CURRENT POKEMON---------------------------

  const isCurrentPokemonCentered = useCallback(() => {
    if (!carouselPokemon) return false;

    const container = containerRef.current;
    const item =
      itemRefs.current.get(
        carouselPokemon.name
      );

    if (!container || !item) return false;

    const containerRect =
      container.getBoundingClientRect();
    const itemRect =
      item.getBoundingClientRect();
    const containerCenter =
      containerRect.left +
      containerRect.width / 2;
    const itemCenter =
      itemRect.left + itemRect.width / 2;

    return (
      Math.abs(
        containerCenter - itemCenter
      ) < 8
    );
  }, [carouselPokemon]);

  const updateCurrentCentered =
    useCallback(() => {
      setIsCurrentCentered(
        isCurrentPokemonCentered()
      );
    }, [isCurrentPokemonCentered]);

  const centerCurrentPokemon = useCallback(
    () => {
      if (!carouselPokemon) return;

      const container = containerRef.current;
      const item =
        itemRefs.current.get(
          carouselPokemon.name
        );

      if (!container || !item) return;

      const containerRect =
        container.getBoundingClientRect();
      const itemRect =
        item.getBoundingClientRect();
      const itemOffsetLeft =
        itemRect.left -
        containerRect.left +
        container.scrollLeft;
      const centeredScrollLeft =
        itemOffsetLeft -
        container.clientWidth / 2 +
        item.offsetWidth / 2;

      container.scrollLeft =
        centeredScrollLeft;

      window.setTimeout(
        updateCurrentCentered,
        0
      );
    },
    [
      carouselPokemon,
      updateCurrentCentered
    ]
  );

  useLayoutEffect(() => {
    centerCurrentPokemon();
  }, [centerCurrentPokemon]);

  //---------------------------DRAG TO SCROLL---------------------------

  function handlePointerDown(event) {
    requestFullIndex();
    const container = containerRef.current;

    if (!container) return;

    suppressClickRef.current = false;
    const pressedCard =
      event.target instanceof Element
        ? event.target.closest(
            "[data-pokemon-name]"
          )
        : null;

    if (event.pointerType !== "mouse") {
      return;
    }

    dragStateRef.current = {
      isDragging: true,
      moved: false,
      pressedPokemonName:
        pressedCard?.dataset
          ?.pokemonName ?? null,
      startX: event.clientX,
      scrollLeft: container.scrollLeft
    };

    setIsDragging(true);

    container.setPointerCapture(
      event.pointerId
    );
  }

  function handlePointerMove(event) {
    if (event.pointerType !== "mouse") {
      return;
    }

    const container = containerRef.current;
    const dragState = dragStateRef.current;

    if (!container || !dragState.isDragging) {
      return;
    }

    const distance =
      event.clientX - dragState.startX;

    if (Math.abs(distance) > 4) {
      dragState.moved = true;
      suppressClickRef.current = true;
    }

    container.scrollLeft =
      dragState.scrollLeft - distance;
  }

  function endDrag() {
    if (!dragStateRef.current.isDragging) {
      return;
    }

    const dragState = dragStateRef.current;
    dragStateRef.current.isDragging = false;
    setIsDragging(false);

    if (
      !dragState.moved &&
      dragState.pressedPokemonName
    ) {
      suppressClickRef.current = true;
      navigateToPokemonName(
        dragState.pressedPokemonName
      );
    }
  }

  function getPokemonNavigation(name) {
    const searchParams =
      new URLSearchParams(
        location.search
      );
    const sizeReviewValue =
      searchParams.get("size-review");
    const isSizeReviewMode =
      searchParams.has("size-review") &&
      sizeReviewValue !== "0" &&
      sizeReviewValue !== "false";
    const sizeReviewSearch =
      isSizeReviewMode
        ? "?size-review=1"
        : "";

    return {
      to: getPokemonUrl(
        name,
        sizeReviewSearch
      ),
      state: {
        preserveScroll:
          isSizeReviewMode
      }
    };
  }

  function navigateToPokemonName(name) {
    if (!name) return;

    const pokemonNavigation =
      getPokemonNavigation(name);

    if (pokemonNavigation.to) {
      navigate(
        pokemonNavigation.to,
        { state: pokemonNavigation.state }
      );
    }
  }

  function handleCardClick(event) {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;
      return;
    }

  }

  //---------------------------LOADING FALLBACK---------------------------

  if (!pokemonIndex.length || !carouselPokemon) {
    return <PokemonSpriteCarouselPlaceholder />;
  }

  //---------------------------RENDER---------------------------

  return (
    <section
      style={{
        margin: "1rem auto",
        maxWidth: "760px"
      }}
    >

<h2>Navigation</h2>

  
      {/* //---------------------------CAROUSEL WINDOW--------------------------- */}

      <div
        ref={containerRef}
        aria-busy={!hasFullIndex && !registryError ? undefined : false}
        onScroll={updateCurrentCentered}
        onPointerDown={handlePointerDown}
        onFocusCapture={requestFullIndex}
        onWheel={requestFullIndex}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{
          // border: "2px solid #555",
          borderRadius: "12px",
          boxSizing: "border-box",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          cursor: isDragging
            ? "grabbing"
            : "grab",
          overflowX: "auto",
          padding:
            "1rem calc(50% - 120px)",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "thin",
          touchAction: "pan-x",
          overscrollBehaviorY: "contain",
          userSelect: isDragging
            ? "none"
            : "auto",
          WebkitOverflowScrolling: "touch",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)"
        }}
      >
        {pokemonIndex.map((entry, index) => {
          //---------------------------IS CURRENT---------------------------

          const isCurrent =
            entry.name === carouselPokemon.name;

          const pokemonNavigation =
            getPokemonNavigation(entry.name);
          const carouselSources =
            getPokemonCardSources(entry);
          const shouldEagerLoad =
            carouselPokemonIndex >= 0 &&
            Math.abs(
              index - carouselPokemonIndex
            ) <= 4;

          return (
            //---------------------------POKEMON CARD---------------------------
      
            <Link
              key={entry.name}
              to={pokemonNavigation.to ?? "#"}
              state={pokemonNavigation.state}
              aria-disabled={!pokemonNavigation.to}
              aria-current={isCurrent ? "page" : undefined}
              data-pokemon-name={entry.name}
              ref={element => {
                if (element) {
                  itemRefs.current.set(
                    entry.name,
                    element
                  );
                } else {
                  itemRefs.current.delete(
                    entry.name
                  );
                }
              }}
              onClick={event =>
                pokemonNavigation.to
                  ? handleCardClick(
                      event
                    )
                  : event.preventDefault()
              }
              style={{
                alignItems: "center",
                backgroundColor: "#2c2c2c",
        
                border: isCurrent
                  ? "2px solid transparent"
                  : "1px solid #707070",


                borderRadius: "12px",
                boxShadow: isCurrent
                  ? "none"
                  : "0 2px 8px rgba(0, 0, 0, .18)",

                color: isCurrent
                ? "transparent"
                : "#707070",

                cursor: isDragging
                  ? "grabbing"
                  : "pointer",
                touchAction: "pan-x",
                
                display: "flex",
                flex: isCurrent
                  ? "0 0 110px"
                  : "0 0 110px",
                flexDirection: "column",
                justifyContent: "center",
                minHeight: isCurrent
                  ? "142px"
                  : "142px",
                  paddingRight: isCurrent
                  ? ".5rem"
                  : ".5rem",
                paddingLeft: isCurrent
                  ? ".5rem"
                  : ".5rem",
                opacity: isCurrent
                  ? .5
                  : 0.9,
                scrollSnapAlign: "center",
                transform: isCurrent
                  ? "scale(.9)"
                  : "scale(.9)",
                transition:
                  "transform .15s ease, border-color .15s ease, background-color .15s ease, flex-basis .15s ease, opacity .15s ease",
                textDecoration: "none"
              }}
            >
              {/* //---------------------------DEX NUMBER--------------------------- */}

              <span
                style={{
                  alignSelf: "flex-start",
                  fontSize: isCurrent
                    ? ".9rem"
                    : ".72rem",
                  opacity: isCurrent
                    ? 0.85
                    : 0.7
                }}
              >
                #
                {entry.id
                  .toString()
                  .padStart(4, "0")}
              </span>

              {/* //---------------------------SPRITE--------------------------- */}

              {/*
                Previous remote carousel image, retained for quick rollback:

                <img
                  src={entry.sprite}
                  alt={entry.name}
                  loading="lazy"
                  style={{
                    height: isCurrent ? "150px" : "78px",
                    objectFit: "contain",
                    width: isCurrent ? "150px" : "78px"
                  }}
                />
              */}

              <img
                src={carouselSources[0]}
                alt={entry.name}
                decoding="async"
                fetchPriority={
                  isCurrent ? "high" : "auto"
                }
                loading={
                  shouldEagerLoad
                    ? "eager"
                    : "lazy"
                }
                onError={event =>
                  advanceSpriteFallback(
                    event,
                    carouselSources.slice(1)
                  )
                }
                style={{
                  height: isCurrent
                    ? "150px"
                    : "78px",
                  objectFit: "contain",
                  width: isCurrent
                    ? "150px"
                    : "78px"
                }}
              />

              {/* //---------------------------POKEMON NAME--------------------------- */}

              <span
                style={{
                  fontSize: isCurrent
                    ? "1rem"
                    : ".72rem",
                  fontWeight: "bold",
                  lineHeight: 1.15,
                  overflowWrap: "anywhere",
                  textAlign: "center"
                }}
              >
                {capitalize(entry.name)}
              </span>
            </Link>
          );
        })}
      </div>

      {!hasFullIndex && (
        <button
          type="button"
          onClick={requestFullIndex}
          style={{
            backgroundColor: "#2c2c2c",
            border: "1px solid #666",
            borderRadius: "999px",
            color: "white",
            cursor: "pointer",
            fontSize: ".85rem",
            marginTop: ".5rem",
            padding: ".35rem .8rem"
          }}
        >
          {registryError ? "Retry full Pokédex" : "Browse full Pokédex"}
        </button>
      )}

      {/* //---------------------------RECENTER BUTTON--------------------------- */}

      <button
        onClick={centerCurrentPokemon}
        style={{
          backgroundColor: isCurrentCentered
            ? "transparent"
            : "#2c2c2c",
          border: isCurrentCentered
            ? "1px solid transparent"
            : "1px solid #666",
          borderRadius: "999px",
          color: isCurrentCentered
            ? "rgba(255, 255, 255, 0.07)"
            : "white",
          cursor: "pointer",
          fontSize: ".85rem",
          marginTop: ".5rem",
          // marginBottom: ".5rem",
          padding: ".35rem .8rem",
          transition:
            "background-color .15s ease, border-color .15s ease, color .15s ease"
        }}
      >
        Recenter
      </button>


    </section>
  );
}

export default PokemonSpriteCarousel;
