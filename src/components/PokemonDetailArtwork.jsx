import {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  advanceSpriteFallback,
  getPokemonCardSources,
  getPokemonDetailSources
} from "../utils/pokemonSprites";

function PokemonDetailArtwork({
  alt,
  pokemon
}) {
  const cardSources = useMemo(
    () => getPokemonCardSources(pokemon),
    [pokemon]
  );
  const detailSources = useMemo(
    () => getPokemonDetailSources(pokemon),
    [pokemon]
  );
  const previewSource =
    cardSources[0] ?? detailSources[0];
  const fullSource = detailSources[0];
  const [displayedSource, setDisplayedSource] =
    useState(previewSource);

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
    <img
      alt={alt}
      decoding="async"
      fetchPriority="high"
      loading="eager"
      onError={event =>
        advanceSpriteFallback(
          event,
          fallbacks
        )
      }
      src={displayedSource}
      style={{
        height: "250px",
        objectFit: "contain",
        width: "250px"
      }}
    />
  );
}

export default PokemonDetailArtwork;
