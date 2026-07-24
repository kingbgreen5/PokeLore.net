import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Link } from "react-router-dom";
import { formatPokemonDisplayName }
from "../utils/pokemonNames";
import {
  advanceSpriteFallback,
  getPokemonCardSources
} from "../utils/pokemonSprites";

const pokemonDetailCache = new Map();
const pokemonDetailFetchLimit = 24;

function heightToInches(height) {
  return Math.round((height / 10) * 39.3701);
}

function formatFeetInches(totalInches) {
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;

  return `${feet}' ${inches}"`;
}

function getSpriteSizing({
  bounds,
  visibleHeightPx
}) {
  if (
    bounds?.visibleBounds?.height &&
    bounds?.height
  ) {
    const scale =
      visibleHeightPx /
      bounds.visibleBounds.height;

    return {
      renderedHeight:
        bounds.height * scale,
      floorOffset:
        (bounds.transparentPadding?.bottom ??
          0) * scale,
      stageWidth: Math.max(
        96,
        (bounds.visibleBounds.width ?? 80) *
          scale +
          24
      )
    };
  }

  return {
    renderedHeight: visibleHeightPx * 1.2,
    floorOffset: 0,
    stageWidth: 110
  };
}

function getSpriteCorrectionFactor(
  correctionsById,
  pokemon
) {
  const correctionData =
    correctionsById[pokemon.id];
  const parsedCorrection =
    typeof correctionData === "number"
      ? correctionData
      : Number(correctionData?.factor ?? 1);

  return Number.isFinite(parsedCorrection) &&
    parsedCorrection > 0
    ? parsedCorrection
    : 1;
}

function getVisualHeight(
  correctionsById,
  pokemon
) {
  return (
    Number(pokemon.height) *
    getSpriteCorrectionFactor(
      correctionsById,
      pokemon
    )
  );
}

function clampZoomMultiplier(value) {
  return Math.min(
    4,
    Math.max(0.08, value)
  );
}

async function mapWithConcurrency(
  items,
  limit,
  mapper
) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(
        items[currentIndex]
      );
    }
  }

  await Promise.all(
    Array.from(
      {
        length: Math.min(limit, items.length)
      },
      runWorker
    )
  );

  return results;
}

async function loadPokemonDetail(
  currentPokemon
) {
  const pokemonId = Number(
    currentPokemon.id
  );

  if (!Number.isFinite(pokemonId)) {
    return currentPokemon;
  }

  if (!pokemonDetailCache.has(pokemonId)) {
    pokemonDetailCache.set(
      pokemonId,
      fetch(
        `/data/pokemonData/${pokemonId}.json`
      )
        .then(response =>
          response.ok
            ? response.json()
            : null
        )
        .catch(() => null)
    );
  }

  const pokemonDetail =
    await pokemonDetailCache.get(pokemonId);

  return pokemonDetail
    ? {
        ...currentPokemon,
        ...pokemonDetail
      }
    : currentPokemon;
}

function SizeChartPokemonImage({
  pokemon,
  rootRef,
  sizing
}) {
  const imageRef = useRef(null);
  const [shouldLoad, setShouldLoad] =
    useState(
      () =>
        typeof IntersectionObserver ===
        "undefined"
    );
  const sources = useMemo(
    () => getPokemonCardSources(pokemon),
    [pokemon]
  );

  useEffect(() => {
    const image = imageRef.current;
    const root = rootRef.current;

    if (
      !image ||
      !root ||
      typeof IntersectionObserver ===
        "undefined"
    ) {
      return undefined;
    }

    const observer =
      new IntersectionObserver(
        entries => {
          if (
            entries.some(
              entry => entry.isIntersecting
            )
          ) {
            setShouldLoad(true);
            observer.disconnect();
          }
        },
        {
          root,
          rootMargin: "0px 320px"
        }
      );

    observer.observe(image);
    return () => observer.disconnect();
  }, [rootRef]);

  if (!shouldLoad) {
    return (
      <span
        ref={imageRef}
        aria-hidden="true"
        style={{
          display: "block",
          height:
            `${sizing.renderedHeight}px`,
          width: "1px"
        }}
      />
    );
  }

  return (
    <img
      ref={imageRef}
      alt={formatPokemonDisplayName(
        pokemon
      )}
      decoding="async"
      onError={event =>
        advanceSpriteFallback(
          event,
          sources.slice(1)
        )
      }
      src={sources[0]}
      style={{
        height:
          `${sizing.renderedHeight}px`,
        maxWidth: "none",
        objectFit: "contain",
        transform:
          `translateY(${sizing.floorOffset}px)`,
        width: "auto"
      }}
    />
  );
}

function TypeSizeChart({
  pokemon,
  typeName,
  title,
  description,
  sectionStyle
}) {
  const [pokemonDetails, setPokemonDetails] =
    useState([]);
  const [
    spriteBoundsById,
    setSpriteBoundsById
  ] = useState({});
  const [
    spriteCorrectionsById,
    setSpriteCorrectionsById
  ] = useState({});
  const [loading, setLoading] =
    useState(false);
  const [
    zoomMultiplier,
    setZoomMultiplier
  ] = useState(null);
  const chartScrollRef = useRef(null);
  const chartKey =
    title ?? typeName ?? "size-chart";
  const activeZoomState =
    zoomMultiplier?.key === chartKey
      ? zoomMultiplier
      : {
          key: chartKey,
          value: null
        };

  useEffect(() => {
    let isMounted = true;

    async function loadDetails() {
      try {
        setLoading(true);

        const [
          detailResults,
          boundsResponse,
          correctionsResponse
        ] = await Promise.all([
          mapWithConcurrency(
            pokemon,
            pokemonDetailFetchLimit,
            loadPokemonDetail
          ),
          fetch(
            "/data/pokemonSpriteBounds.json"
          ),
          fetch(
            "/data/pokemonSpriteCorrections.json"
          )
        ]);

        const boundsData =
          boundsResponse.ok
            ? await boundsResponse.json()
            : {
                sprites: {}
              };
        const correctionData =
          correctionsResponse.ok
            ? await correctionsResponse.json()
            : {
                sprites: {}
              };

        if (isMounted) {
          setPokemonDetails(detailResults);
          setSpriteBoundsById(
            boundsData.sprites ?? {}
          );
          setSpriteCorrectionsById(
            correctionData.sprites ?? {}
          );
        }
      } catch (error) {
        console.error(
          "Failed to load type size chart:",
          error
        );

        if (isMounted) {
          setPokemonDetails(pokemon);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (pokemon.length === 0) {
      setPokemonDetails([]);
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [pokemon]);

  const sortedPokemon = useMemo(
    () =>
      [
        ...(pokemon.length > 0
          ? pokemonDetails
          : [])
      ]
        .filter(
          currentPokemon =>
            Number.isFinite(
              Number(currentPokemon.height)
            )
        )
        .sort(
          (a, b) => {
            const visualHeightDifference =
              getVisualHeight(
                spriteCorrectionsById,
                b
              ) -
              getVisualHeight(
                spriteCorrectionsById,
                a
              );

            return (
              visualHeightDifference ||
              Number(b.height) -
                Number(a.height) ||
              Number(a.id) - Number(b.id)
            );
          }
        ),
    [
      pokemon.length,
      pokemonDetails,
      spriteCorrectionsById
    ]
  );

  const tallestPokemonHeight = useMemo(
    () =>
      Math.max(
        ...sortedPokemon.map(
          currentPokemon =>
            getVisualHeight(
              spriteCorrectionsById,
              currentPokemon
            )
        ),
        1
      ),
    [
      sortedPokemon,
      spriteCorrectionsById
    ]
  );

  const shortestPokemonHeight = useMemo(
    () => {
      const visualHeights =
        sortedPokemon
          .map(currentPokemon =>
            getVisualHeight(
              spriteCorrectionsById,
              currentPokemon
            )
          )
          .filter(
            visualHeight =>
              Number.isFinite(
                visualHeight
              ) && visualHeight > 0
          );

      return visualHeights.length
        ? Math.min(...visualHeights)
        : 1;
    },
    [
      sortedPokemon,
      spriteCorrectionsById
    ]
  );

  const chartTitle =
    title ?? `${typeName} Pokémon by Size`;
  const chartDescription =
    description ??
    `Largest Pokémon are on the left.
        Smallest Pokémon are on the right.`;

  if (pokemon.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <section
        style={{
          border: "1px solid #666",
          borderRadius: "12px",
          marginBottom: "3rem",
          padding: "1rem"
        }}
      >
        <h2>
          {chartTitle}
        </h2>
        <p>Loading size chart...</p>
      </section>
    );
  }

  if (sortedPokemon.length === 0) {
    return null;
  }

  const chartHeightPx = 320;
  const labelAreaHeightPx = 54;
  const imageAreaHeightPx =
    chartHeightPx - labelAreaHeightPx;
  const maxVisibleSpriteHeightPx = 260;
  const minVisibleSpriteHeightPx = 44;
  const basePixelsPerHeightUnit =
    shortestPokemonHeight > 0
      ? minVisibleSpriteHeightPx /
        shortestPokemonHeight
      : minVisibleSpriteHeightPx;
  const fitLargestZoomMultiplier =
    tallestPokemonHeight > 0 &&
    basePixelsPerHeightUnit > 0
      ? maxVisibleSpriteHeightPx /
        tallestPokemonHeight /
        basePixelsPerHeightUnit
      : 1;
  const activeZoomMultiplier =
    activeZoomState.value ??
    clampZoomMultiplier(
      fitLargestZoomMultiplier
    );
  const pixelsPerHeightUnit =
    basePixelsPerHeightUnit *
    activeZoomMultiplier;

  function zoomIn() {
    setZoomMultiplier(currentZoom =>
      ({
        key: chartKey,
        value: clampZoomMultiplier(
          (currentZoom?.key === chartKey
            ? currentZoom.value
            : activeZoomMultiplier) * 1.25
        )
      })
    );
  }

  function zoomOut() {
    setZoomMultiplier(currentZoom =>
      ({
        key: chartKey,
        value: clampZoomMultiplier(
          (currentZoom?.key === chartKey
            ? currentZoom.value
            : activeZoomMultiplier) / 1.25
        )
      })
    );
  }

  function fitLargestPokemon() {
    setZoomMultiplier({
      key: chartKey,
      value: null
    });
  }

  return (
    <section
      style={{
        border: "1px solid #666",
        borderRadius: "12px",
        boxSizing: "border-box",
        contain: "inline-size layout paint",
        marginBottom: "3rem",
        maxWidth: "100%",
        minWidth: 0,
        overflow: "hidden",
        padding: "1rem",
        width: "100%",
        ...sectionStyle
      }}
    >
      <h2>
        {chartTitle}
      </h2>

      <p
        style={{
          margin: "0 auto 1rem",
          maxWidth: "680px",
          opacity: 0.8
        }}
      >
        {chartDescription}
      </p>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexWrap: "wrap",
          gap: ".5rem",
          justifyContent: "center",
          marginBottom: "1rem"
        }}
      >
        <button
          type="button"
          onClick={zoomOut}
          style={{
            borderRadius: "8px",
            padding: ".45rem .75rem"
          }}
        >
          Zoom out
        </button>

        <button
          type="button"
          onClick={zoomIn}
          style={{
            borderRadius: "8px",
            padding: ".45rem .75rem"
          }}
        >
          Zoom in
        </button>

        <button
          type="button"
          onClick={fitLargestPokemon}
          style={{
            borderRadius: "8px",
            padding: ".45rem .75rem"
          }}
        >
          Reset
        </button>

        <span
          style={{
            fontSize: ".8rem",
            opacity: 0.75
          }}
        >
          One true scale at current zoom
        </span>
      </div>

      <div
        ref={chartScrollRef}
        style={{
          boxSizing: "border-box",
          contain: "inline-size layout paint",
          maxWidth: "100%",
          minWidth: 0,
          overflowX: "auto",
          overflowY: "hidden",
          overscrollBehaviorX: "contain",
          paddingBottom: ".75rem",
          WebkitOverflowScrolling: "touch"
        }}
      >
        <div
          style={{
            alignItems: "end",
            borderBottom: "2px solid #888",
            boxSizing: "border-box",
            contain: "layout paint",
            display: "flex",
            gap: "1.25rem",
            height: `${chartHeightPx}px`,
            overflowX: "visible",
            overflowY: "hidden",
            padding: "1rem 1rem 0",
            width: "max-content"
          }}
        >
          {sortedPokemon.map(currentPokemon => {
            const visualHeight =
              getVisualHeight(
                spriteCorrectionsById,
                currentPokemon
              );
            const visibleHeightPx =
              visualHeight *
              pixelsPerHeightUnit;
            const sizing = getSpriteSizing({
              bounds:
                spriteBoundsById[
                  currentPokemon.id
                ],
              visibleHeightPx
            });
            const heightInches =
              heightToInches(
                currentPokemon.height
              );

            return (
              <Link
                key={currentPokemon.id}
                to={`/pokemon/${currentPokemon.name}`}
                style={{
                  alignItems: "center",
                  color: "inherit",
                  display: "flex",
                  flex: "0 0 auto",
                  flexDirection: "column",
                  justifyContent: "end",
                  height:
                    `${chartHeightPx}px`,
                  maxHeight:
                    `${chartHeightPx}px`,
                  overflow: "hidden",
                  textDecoration: "none",
                  width:
                    `${sizing.stageWidth}px`
                }}
              >
                <div
                  style={{
                    alignItems: "end",
                    display: "flex",
                    flex: `0 0 ${imageAreaHeightPx}px`,
                    height:
                      `${imageAreaHeightPx}px`,
                    justifyContent: "center",
                    overflow: "hidden",
                    width: "100%"
                  }}
                >
                  <SizeChartPokemonImage
                    pokemon={currentPokemon}
                    rootRef={chartScrollRef}
                    sizing={sizing}
                  />
                </div>

                <strong
                  style={{
                    flex: "0 0 auto",
                    fontSize: ".75rem",
                    lineHeight: 1.1,
                    marginTop: ".5rem",
                    textAlign: "center"
                  }}
                >
                  {formatPokemonDisplayName(
                    currentPokemon
                  )}
                </strong>

                <span
                  style={{
                    flex: "0 0 auto",
                    fontSize: ".68rem",
                    opacity: 0.75
                  }}
                >
                  {formatFeetInches(
                    heightInches
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default TypeSizeChart;
