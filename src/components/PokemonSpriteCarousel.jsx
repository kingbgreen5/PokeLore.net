import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  useLocation,
  useNavigate
} from "react-router-dom";

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
  pokemon
}) {
  //---------------------------ROUTER + REFS---------------------------

  const navigate = useNavigate();
  const location = useLocation();
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

  //---------------------------STATE---------------------------

  const [pokemonIndex, setPokemonIndex] =
    useState([]);
  const [isDragging, setIsDragging] =
    useState(false);
  const [
    isCurrentCentered,
    setIsCurrentCentered
  ] = useState(false);

  //---------------------------LOAD POKEMON INDEX---------------------------

  useEffect(() => {
    async function loadPokemonIndex() {
      try {
        const response = await fetch(
          "/data/pokemonIndex.json"
        );
        const data = await response.json();

        setPokemonIndex(
          [...data].sort(
            (a, b) => a.id - b.id
          )
        );
      } catch (error) {
        console.error(
          "Failed to load Pokémon index for carousel:",
          error
        );
      }
    }

    loadPokemonIndex();
  }, []);

  //---------------------------CURRENT DISPLAYED POKEMON---------------------------

  const carouselPokemon = useMemo(() => {
    if (!pokemonIndex.length || !pokemon) {
      return null;
    }

    return (
      pokemonIndex.find(
        entry => entry.id === pokemon.id
      ) ??
      pokemonIndex.find(
        entry =>
          entry.name === pokemon.species
      ) ??
      pokemonIndex.find(
        entry => entry.name === pokemon.name
      ) ??
      null
    );
  }, [
    pokemon,
    pokemonIndex
  ]);

  //---------------------------CENTER CURRENT POKEMON---------------------------

  const isCurrentPokemonCentered = useCallback(() => {
    if (!carouselPokemon) return false;

    const container = containerRef.current;
    const item =
      itemRefs.current.get(
        carouselPokemon.id
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
          carouselPokemon.id
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

  function navigateToPokemonName(name) {
    if (!name) return;

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

    navigate(
      `/pokemon/${name}${sizeReviewSearch}`,
      {
        state: {
          preserveScroll:
            isSizeReviewMode
        }
      }
    );
  }

  function handleCardClick(event, entry) {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;
      return;
    }

    navigateToPokemonName(entry.name);
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
        onScroll={updateCurrentCentered}
        onPointerDown={handlePointerDown}
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
        {pokemonIndex.map(entry => {
          //---------------------------IS CURRENT---------------------------

          const isCurrent =
            entry.id === carouselPokemon.id;

          return (
            //---------------------------POKEMON CARD---------------------------
      
            <button
              key={entry.id}
              data-pokemon-name={entry.name}
              ref={element => {
                if (element) {
                  itemRefs.current.set(
                    entry.id,
                    element
                  );
                } else {
                  itemRefs.current.delete(
                    entry.id
                  );
                }
              }}
              onClick={event =>
                handleCardClick(
                  event,
                  entry
                )
              }
              style={{
                alignItems: "center",
                backgroundColor: isCurrent
                  ? "transparent"
                  : "#2c2c2c",
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
                  "transform .15s ease, border-color .15s ease, background-color .15s ease, flex-basis .15s ease, opacity .15s ease"
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

              <img
                src={entry.sprite}
                alt={entry.name}
                loading="lazy"
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
            </button>
          );
        })}
      </div>

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
