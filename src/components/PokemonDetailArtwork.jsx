import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  advanceSpriteFallback,
  getPokemonCardSources,
  getPokemonDetailSources
} from "../utils/pokemonSprites";

function PokemonDetailArtwork({
  alt,
  onPriorityLoad,
  pokemon
}) {
  const priorityLoadNotified =
    useRef(false);
  const cardSources = useMemo(
    () => getPokemonCardSources(pokemon),
    [pokemon]
  );
  const detailSources = useMemo(
    () => getPokemonDetailSources(pokemon),
    [pokemon]
  );
  const previewSource =
    detailSources[0] ?? cardSources[0];
  const fullSource = detailSources[0];
  const [displayedSource, setDisplayedSource] =
    useState(previewSource);

  useEffect(() => {
    priorityLoadNotified.current = false;
  }, [
    pokemon?.id,
    pokemon?.name,
    pokemon?.sprite
  ]);

  function notifyPriorityLoad() {
    if (priorityLoadNotified.current) {
      return;
    }

    priorityLoadNotified.current = true;
    onPriorityLoad?.();
  }

  useEffect(() => {
    if (
      !fullSource ||
      fullSource === previewSource
    ) {
      return undefined;
    }

    let cancelled = false;
    const fullImage = new Image();

    fullImage.fetchPriority = "high";
    fullImage.src = fullSource;
    fullImage.onload = async () => {
      try {
        await fullImage.decode();
      } catch {
        // A loaded image can still be displayed when decode is unavailable.
      }

      if (!cancelled) {
        setDisplayedSource(fullSource);
      }
    };

    return () => {
      cancelled = true;
    };
  }, [
    fullSource,
    previewSource
  ]);

  const fallbacks = [
    ...detailSources,
    ...cardSources
  ].filter(
    (source, index, sources) =>
      source &&
      source !== displayedSource &&
      sources.indexOf(source) === index
  );

  return (
    <span
      aria-label={alt}
      role="img"
      style={{
        display: "inline-block",
        height: "250px",
        width: "250px"
      }}
    >
      <img
        alt=""
        aria-hidden="true"
        decoding="async"
        fetchPriority="high"
        height="250"
        loading="eager"
        onLoad={notifyPriorityLoad}
        onError={event =>
          advanceSpriteFallback(
            event,
            fallbacks
          )
        }
        src={displayedSource}
        width="250"
        style={{
          display: "block",
          height: "250px",
          objectFit: "contain",
          width: "250px"
        }}
      />
    </span>
  );
}

export default PokemonDetailArtwork;
