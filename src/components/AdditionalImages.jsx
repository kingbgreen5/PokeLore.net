import {
  useEffect,
  useMemo,
  useState
} from "react";
import CollapsibleSection from "./CollapsibleSection";

function formatLabel(path) {
  return path
    .replace(/^sprites\./, "")
    .split(".")
    .map(part =>
      part
        .split("-")
        .map(
          word =>
            word.charAt(0).toUpperCase() +
            word.slice(1)
        )
        .join(" ")
    )
    .join(" / ");
}

function flattenSprites(
  value,
  path = "sprites",
  images = []
) {
  if (!value) {
    return images;
  }

  if (
    typeof value === "string" &&
    value.startsWith("http")
  ) {
    images.push({
      label: formatLabel(path),
      url: value
    });

    return images;
  }

  if (
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return images;
  }

  Object.entries(value).forEach(
    ([key, nestedValue]) => {
      flattenSprites(
        nestedValue,
        `${path}.${key}`,
        images
      );
    }
  );

  return images;
}

function uniqueImages(images) {
  const seenUrls = new Set();

  return images.filter(image => {
    if (seenUrls.has(image.url)) {
      return false;
    }

    seenUrls.add(image.url);
    return true;
  });
}

function AdditionalImages({
  pokemonId,
  pokemonName
}) {
  const [expanded, setExpanded] =
    useState(false);
  const [sprites, setSprites] =
    useState(null);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState(null);

  useEffect(() => {
    if (!expanded || sprites || loading) {
      return;
    }

    async function loadSprites() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${pokemonId}`
        );

        if (!response.ok) {
          throw new Error(
            `Unable to load sprites for ${pokemonId}`
          );
        }

        const data =
          await response.json();

        setSprites(
          data.sprites ?? {}
        );
      } catch (loadError) {
        console.warn(
          "Failed to load additional Pokémon images:",
          loadError
        );
        setError(
          "Additional images are unavailable right now."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSprites();
  }, [
    expanded,
    loading,
    pokemonId,
    sprites
  ]);

  const images = useMemo(
    () =>
      sprites
        ? uniqueImages(
            flattenSprites(sprites)
          )
        : [],
    [sprites]
  );

  return (
    <CollapsibleSection
      title="Additional Images"
      summary={
        images.length > 0
          ? `${images.length} images`
          : "PokeAPI sprites"
      }
      expanded={expanded}
      onToggle={() =>
        setExpanded(!expanded)
      }
      seoVisible={false}
      style={{
        marginTop: "1rem"
      }}
      contentStyle={{
        marginTop: "1rem"
      }}
    >
      {!expanded && (
        <p>
          Open this section to load extra
          PokeAPI sprite images.
        </p>
      )}

      {expanded && loading && (
        <p>Loading additional images...</p>
      )}

      {expanded && error && (
        <p>{error}</p>
      )}

      {expanded &&
        !loading &&
        !error &&
        sprites &&
        images.length === 0 && (
          <p>No additional images found.</p>
        )}

      {expanded && images.length > 0 && (
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(130px, 1fr))"
          }}
        >
          {images.map(image => (
            <figure
              key={image.url}
              style={{
                alignItems: "center",
                backgroundColor: "#2c2c2c",
                border: "1px solid #555",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                gap: ".5rem",
                justifyContent: "center",
                margin: 0,
                minHeight: "150px",
                padding: ".75rem"
              }}
            >
              <img
                src={image.url}
                alt={`${pokemonName} ${image.label}`}
                loading="lazy"
                style={{
                  height: "96px",
                  imageRendering: "pixelated",
                  objectFit: "contain",
                  width: "96px"
                }}
              />

              <figcaption
                style={{
                  fontSize: ".72rem",
                  lineHeight: 1.2,
                  opacity: 0.85,
                  overflowWrap: "anywhere",
                  textAlign: "center"
                }}
              >
                {image.label}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </CollapsibleSection>
  );
}

export default AdditionalImages;
