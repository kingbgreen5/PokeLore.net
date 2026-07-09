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
  typeName
}) {
  const [pokemonDetails, setPokemonDetails] =
    useState([]);
  const [
    spriteBoundsById,
    setSpriteBoundsById
  ] = useState({});
  const [loading, setLoading] =
    useState(false);
  const chartScrollRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDetails() {
      try {
        setLoading(true);

        const [
          detailResults,
          boundsResponse
        ] = await Promise.all([
          Promise.all(
            pokemon.map(async currentPokemon => {
              try {
                const response = await fetch(
                  `/data/pokemonData/${currentPokemon.id}.json`
                );

                if (!response.ok) {
                  return currentPokemon;
                }

                return response.json();
              } catch {
                return currentPokemon;
              }
            })
          ),
          fetch(
            "/data/pokemonSpriteBounds.json"
          )
        ]);

        const boundsData =
          boundsResponse.ok
            ? await boundsResponse.json()
            : {
                sprites: {}
              };

        if (isMounted) {
          setPokemonDetails(detailResults);
          setSpriteBoundsById(
            boundsData.sprites ?? {}
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

    if (pokemon.length > 0) {
      loadDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [pokemon]);

  const sortedPokemon = useMemo(
    () =>
      [...pokemonDetails]
        .filter(
          currentPokemon =>
            Number.isFinite(
              Number(currentPokemon.height)
            )
        )
        .sort(
          (a, b) =>
            Number(a.height) -
              Number(b.height) ||
            Number(a.id) - Number(b.id)
        ),
    [pokemonDetails]
  );

  const tallestPokemonHeight = useMemo(
    () =>
      Math.max(
        ...sortedPokemon.map(
          currentPokemon =>
            Number(currentPokemon.height)
        ),
        1
      ),
    [sortedPokemon]
  );

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
          {typeName} Size Chart
        </h2>
        <p>Loading size chart...</p>
      </section>
    );
  }

  if (sortedPokemon.length === 0) {
    return null;
  }

  const chartHeightPx = 260;
  const maxVisibleSpriteHeightPx = 210;

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
        {typeName} Pokémon by Size
      </h2>

      <p
        style={{
          margin: "0 auto 1rem",
          maxWidth: "680px",
          opacity: 0.8
        }}
      >
        Smallest Pokémon are on the left.
        Largest Pokémon are on the right.
      </p>

      <div
        ref={chartScrollRef}
        style={{
          overflowX: "auto",
          paddingBottom: ".75rem"
        }}
      >
        <div
          style={{
            alignItems: "end",
            borderBottom: "2px solid #888",
            display: "flex",
            gap: "1.25rem",
            minHeight: `${chartHeightPx}px`,
            padding: "1rem 1rem 0"
          }}
        >
          {sortedPokemon.map(currentPokemon => {
            const heightRatio =
              Number(currentPokemon.height) /
              tallestPokemonHeight;
            const visibleHeightPx = Math.max(
              18,
              heightRatio *
                maxVisibleSpriteHeightPx
            );
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
                  minHeight:
                    `${chartHeightPx}px`,
                  textDecoration: "none",
                  width:
                    `${sizing.stageWidth}px`
                }}
              >
                <div
                  style={{
                    alignItems: "end",
                    display: "flex",
                    flex: "1",
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
