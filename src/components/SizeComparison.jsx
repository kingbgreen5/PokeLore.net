
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  useNavigate
} from "react-router-dom";
// import oakSprite from "../assets/FRLG_Professor_Oak_Portrait.png";
import oakSprite from "../assets/OakSprite3.png";
import { formatPokemonDisplayName }
from "../utils/pokemonNames";

const LOCAL_CORRECTIONS_KEY =
  "pokemonSpriteManualCorrections";

function readLocalCorrections() {
  try {
    return JSON.parse(
      localStorage.getItem(
        LOCAL_CORRECTIONS_KEY
      ) ?? "{}"
    );
  } catch {
    return {};
  }
}

function writeLocalCorrections(corrections) {
  localStorage.setItem(
    LOCAL_CORRECTIONS_KEY,
    JSON.stringify(corrections)
  );
}

function SizeComparison({
  pokemon,
  reviewMode = false
}) {
  const navigate = useNavigate();
  const oakHeightInches = 67;
  const fallbackSpriteCorrectionFactor = 1.2;
  const [
    spriteBoundsById,
    setSpriteBoundsById
  ] = useState({});
  const [isMobile, setIsMobile] =
    useState(false);
  const [topLayer, setTopLayer] =
    useState("pokemon");
  const chartScrollRef = useRef(null);
  const pendingScrollLeftRef = useRef(null);
  const [
    baseCorrectionsById,
    setBaseCorrectionsById
  ] = useState({});
  const [
    localCorrectionsById,
    setLocalCorrectionsById
  ] = useState(() =>
    readLocalCorrections()
  );
  const [pokemonIndex, setPokemonIndex] =
    useState([]);

  useLayoutEffect(() => {
    if (
      pendingScrollLeftRef.current === null
    ) {
      return;
    }

    const savedScrollLeft =
      pendingScrollLeftRef.current;
    pendingScrollLeftRef.current = null;

    if (chartScrollRef.current) {
      chartScrollRef.current.scrollLeft =
        savedScrollLeft;
    }
  }, [topLayer]);

  function handleTopLayerToggle() {
    pendingScrollLeftRef.current =
      chartScrollRef.current?.scrollLeft ?? null;

    setTopLayer(currentLayer =>
      currentLayer === "pokemon"
        ? "oak"
        : "pokemon"
    );
  }

  useEffect(() => {
    let isMounted = true;

    async function loadSpriteBounds() {
      try {
        const response = await fetch(
          "/data/pokemonSpriteBounds.json"
        );

        if (!response.ok) return;

        const data = await response.json();

        if (isMounted) {
          setSpriteBoundsById(
            data.sprites ?? {}
          );
        }
      } catch (error) {
        console.warn(
          "Sprite bounds data unavailable:",
          error
        );
      }
    }

    loadSpriteBounds();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(max-width: 640px)"
    );

    function updateIsMobile() {
      setIsMobile(mediaQuery.matches);
    }

    updateIsMobile();
    mediaQuery.addEventListener(
      "change",
      updateIsMobile
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        updateIsMobile
      );
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCorrectionData() {
      try {
        const [
          correctionsResponse,
          indexResponse
        ] = await Promise.all([
          fetch(
            "/data/pokemonSpriteCorrections.json"
          ),
          reviewMode
            ? fetch("/data/pokemonIndex.json")
            : Promise.resolve(null)
        ]);

        if (correctionsResponse.ok) {
          const correctionData =
            await correctionsResponse.json();

          if (isMounted) {
            setBaseCorrectionsById(
              correctionData.sprites ?? {}
            );
          }
        }

        if (
          reviewMode &&
          indexResponse?.ok
        ) {
          const indexData =
            await indexResponse.json();

          if (isMounted) {
            setPokemonIndex(indexData);
          }
        }
      } catch (error) {
        console.warn(
          "Sprite correction data unavailable:",
          error
        );
      }
    }

    loadCorrectionData();

    return () => {
      isMounted = false;
    };
  }, [reviewMode]);

  function heightToInches(height) {
    return Math.round((height / 10) * 39.3701);
  }

  function formatFeetInches(totalInches) {
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}' ${inches}"`;
  }

  const pokemonHeightInches = heightToInches(pokemon.height);
  const spriteBounds =
    spriteBoundsById[pokemon.id];
  const correctionData =
    localCorrectionsById[pokemon.id] ??
    baseCorrectionsById[pokemon.id] ??
    null;
  const manualCorrectionFactor =
    typeof correctionData === "number"
      ? correctionData
      : Number(correctionData?.factor ?? 1);
  const getPokemonSpriteSizing = useMemo(() => {
    return pokemonHeightPx => {
      if (
        spriteBounds?.visibleBounds?.height &&
        spriteBounds?.height
      ) {
        const scaledCorrection =
          manualCorrectionFactor;
        const scale =
          pokemonHeightPx /
          spriteBounds.visibleBounds.height;
        const effectiveScale =
          scale * scaledCorrection;
        const leftPadding =
          spriteBounds.transparentPadding
            ?.left ?? 0;
        const rightPadding =
          spriteBounds.transparentPadding
            ?.right ?? 0;
        const visibleWidth =
          spriteBounds.visibleBounds
            ?.width ?? spriteBounds.width;

        return {
          renderedHeight:
            spriteBounds.height *
            effectiveScale,
          renderedWidth:
            (spriteBounds.width ?? 0) *
            effectiveScale,
          visibleRenderedWidth:
            visibleWidth * effectiveScale,
          visibleLeftOffset:
            leftPadding * effectiveScale,
          floorOffset:
            (spriteBounds.transparentPadding
              ?.bottom ?? 0) *
            effectiveScale,
          horizontalOffset:
            ((rightPadding - leftPadding) /
              2) *
            effectiveScale,
          usesBounds: true
        };
      }

      const fallbackRenderedHeight =
        pokemonHeightPx *
        fallbackSpriteCorrectionFactor *
        manualCorrectionFactor;

      return {
        renderedHeight: fallbackRenderedHeight,
        renderedWidth: fallbackRenderedHeight,
        visibleRenderedWidth:
          fallbackRenderedHeight,
        visibleLeftOffset: 0,
        floorOffset: 0,
        horizontalOffset: 0,
        usesBounds: false
      };
    };
  }, [
    spriteBounds,
    manualCorrectionFactor,
    fallbackSpriteCorrectionFactor
  ]);

  const correctionExport = useMemo(() => {
    return JSON.stringify(
      {
        sprites: {
          ...baseCorrectionsById,
          ...localCorrectionsById
        }
      },
      null,
      2
    );
  }, [
    baseCorrectionsById,
    localCorrectionsById
  ]);

  const currentDexIndex = useMemo(
    () =>
      pokemonIndex.findIndex(
        indexedPokemon =>
          indexedPokemon.id === pokemon.id
      ),
    [pokemon.id, pokemonIndex]
  );

  const previousPokemon =
    currentDexIndex > 0
      ? pokemonIndex[currentDexIndex - 1]
      : null;
  const nextPokemon =
    currentDexIndex >= 0 &&
    currentDexIndex <
      pokemonIndex.length - 1
      ? pokemonIndex[currentDexIndex + 1]
      : null;

  function updateManualCorrection(delta) {
    const nextFactor = Math.max(
      0.25,
      Math.min(
        3,
        Number(
          (
            manualCorrectionFactor + delta
          ).toFixed(2)
        )
      )
    );
    const nextCorrections = {
      ...localCorrectionsById,
      [pokemon.id]: {
        id: pokemon.id,
        name: pokemon.name,
        factor: nextFactor
      }
    };

    setLocalCorrectionsById(nextCorrections);
    writeLocalCorrections(nextCorrections);
  }

  function resetManualCorrection() {
    const nextCorrections = {
      ...localCorrectionsById
    };

    delete nextCorrections[pokemon.id];
    setLocalCorrectionsById(nextCorrections);
    writeLocalCorrections(nextCorrections);
  }

  function navigateToPokemon(nextPokemon) {
    if (!nextPokemon) return;

    navigate(
      `/pokemon/${nextPokemon.id}?size-review=1`
    );
  }

  function getChartMetrics(chartHeightPx) {
    const tallestHeightInches = Math.max(
      pokemonHeightInches,
      oakHeightInches,
      72
    );
    const chartMaxFeet = Math.ceil(
      tallestHeightInches / 12
    );
    const chartMaxInches = chartMaxFeet * 12;
    const rulerMarks = Array.from(
      {
        length: chartMaxFeet + 1
      },
      (_, index) => chartMaxFeet - index
    );
    const oakHeightPx =
      (oakHeightInches / chartMaxInches) *
      chartHeightPx;
    const pokemonHeightPx =
      (pokemonHeightInches / chartMaxInches) *
      chartHeightPx;
    const pokemonSpriteSizing =
      getPokemonSpriteSizing(
        pokemonHeightPx
      );
    const mobileSubjectWidth =
      Math.ceil(
        (pokemonSpriteSizing
          .visibleRenderedWidth || 0) +
          oakHeightPx * 0.55 +
          96
      );
    const recommendedMinWidthPx =
      60 +
      Math.max(
        500,
        mobileSubjectWidth
      );

    return {
      chartMaxFeet,
      chartHeightPx,
      oakHeightPx,
      pokemonSpriteSizing,
      recommendedMinWidthPx,
      rulerMarks
    };
  }

  function Ruler({
    metrics,
    compact = false
  }) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: compact
            ? ".75rem"
            : "1rem",
          fontWeight: "700",
          justifyContent:
            "space-between",
          paddingRight: compact
            ? ".45rem"
            : "0.75rem",
          textAlign: "right"
        }}
      >
        {metrics.rulerMarks.map(feet => (
          <span key={feet}>
            {feet} ft
          </span>
        ))}
      </div>
    );
  }

  function RulerLines({
    metrics
  }) {
    return metrics.rulerMarks
      .filter(feet => feet !== 0)
      .map(feet => (
      <div
        key={feet}
        style={{
          borderTop:
            "1px dashed #cbd3dc",
          bottom: `${(feet / metrics.chartMaxFeet) * 100}%`,
          left: 0,
          position: "absolute",
          right: 0
        }}
      />
    ));
  }

  function ComparisonStage({
    metrics,
    stacked = false,
    clipOverflow = false,
    compactSpacing = false,
    topLayer = "pokemon"
  }) {
    const mobileScenePadding = 35
    ;
    const mobileOakOverlap = 55;
    const mobileOakLeft =
      mobileScenePadding +
      (metrics.pokemonSpriteSizing
        .visibleRenderedWidth || 0) -
      mobileOakOverlap;

    if (stacked) {
      return (
        <div
          style={{
            display: "grid",
            gap: "1rem",
            minWidth: "520px"
          }}
        >
          <SingleSubjectStage
            metrics={metrics}
            subject="pokemon"
          />
          <SingleSubjectStage
            metrics={metrics}
            subject="oak"
          />
        </div>
      );
    }

    return (
      <div
        style={{
          borderBottom: "2px solid #222",
          borderLeft: "2px solid #222",
          height: "100%",
          overflow: clipOverflow
            ? "hidden"
            : "visible",
          position: "relative"
        }}
      >
        <RulerLines metrics={metrics} />
        {compactSpacing ? (
          <>
            <SpriteColumn
              width="max-content"
              left={`${mobileScenePadding}px`}
              zIndex={
                topLayer === "pokemon"
                  ? 2
                  : 1
              }
            >
              <PokemonSprite
                metrics={metrics}
                alignVisibleLeft={true}
              />
            </SpriteColumn>
            <SpriteColumn
              width="max-content"
              left={`${mobileOakLeft}px`}
              zIndex={
                topLayer === "oak"
                  ? 2
                  : 1
              }
            >
              <OakSprite
                metrics={metrics}
              />
            </SpriteColumn>
          </>
        ) : (
          <>
            <SpriteColumn
              width="45%"
              left="6%"
              zIndex={
                topLayer === "pokemon"
                  ? 2
                  : 1
              }
            >
              <PokemonSprite
                metrics={metrics}
              />
            </SpriteColumn>
            <SpriteColumn
              width="40%"
              right="8%"
              zIndex={
                topLayer === "oak"
                  ? 2
                  : 1
              }
            >
              <OakSprite
                metrics={metrics}
              />
            </SpriteColumn>
          </>
        )}
      </div>
    );
  }

  function SingleSubjectStage({
    metrics,
    subject
  }) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "50px 1fr",
          height: `${metrics.chartHeightPx}px`
        }}
      >
        <Ruler
          metrics={metrics}
          compact={true}
        />
        <div
          style={{
            borderBottom:
              "2px solid #222",
            borderLeft:
              "2px solid #222",
            height: "100%",
            overflow: "hidden",
            position: "relative"
          }}
        >
          <RulerLines metrics={metrics} />
          <SpriteColumn
            left="0"
            right="0"
            width="100%"
          >
            {subject === "pokemon" ? (
              <PokemonSprite
                metrics={metrics}
              />
            ) : (
              <OakSprite
                metrics={metrics}
              />
            )}
          </SpriteColumn>
        </div>
      </div>
    );
  }

  function SpriteColumn({
    children,
    left,
    right,
    transform,
    width,
    zIndex
  }) {
    return (
      <div
        style={{
          alignItems: "center",
          bottom: "0",
          display: "flex",
          flexDirection: "column",
          left,
          position: "absolute",
          right,
          transform,
          width,
          zIndex
        }}
      >
        {children}
      </div>
    );
  }

  function OakSprite({
    metrics
  }) {
    return (
      <img
        src={oakSprite}
        alt="Professor Oak"
        style={{
          height: `${metrics.oakHeightPx}px`,
          // imageRendering: "pixelated",
          maxWidth: "none",
          objectFit: "contain",
          width: "auto",
          marginBottom:"-.5rem"
        }}
      />
    );
  }

  function PokemonSprite({
    metrics,
    alignVisibleLeft = false
  }) {
    const horizontalOffset =
      alignVisibleLeft
        ? -metrics.pokemonSpriteSizing
            .visibleLeftOffset
        : metrics.pokemonSpriteSizing
            .horizontalOffset;

    return (
      <img
        src={pokemon.sprite}
        alt={pokemon.name}
        style={{
          height: `${metrics.pokemonSpriteSizing.renderedHeight}px`,
          maxWidth: "none",
          objectFit: "contain",
          transform: `translate(${horizontalOffset}px, ${metrics.pokemonSpriteSizing.floorOffset}px)`,
          width: "auto"
        }}
      />
    );
  }

  function ChartFrame({
    title,
    description,
    chartHeightPx = 420,
    scrollable = false,
    stacked = false,
    minWidth = "720px",
    clipOverflow = false,
    compactSpacing = false,
    topLayer = "pokemon",
    showHeader = true
  }) {
    const metrics =
      getChartMetrics(chartHeightPx);
    const requestedMinWidthPx =
      Number.parseFloat(minWidth);
    const chartMinWidth =
      scrollable
        ? `${Math.max(
            Number.isFinite(
              requestedMinWidthPx
            )
              ? requestedMinWidthPx
              : 0,
            metrics.recommendedMinWidthPx
          )}px`
        : undefined;
    const chart = (
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            stacked
              ? "1fr"
              : "60px 1fr",
          height: stacked
            ? "auto"
            : `${chartHeightPx}px`,
          minWidth: chartMinWidth
        }}
      >
        {!stacked && (
          <Ruler metrics={metrics} />
        )}
        <ComparisonStage
          metrics={metrics}
          stacked={stacked}
          clipOverflow={clipOverflow}
          compactSpacing={compactSpacing}
          topLayer={topLayer}
        />
      </div>
    );

    return (
      <section
        style={{
          // border:
          //   "1px solid #d5dce5",
          // borderRadius: "18px",
          boxShadow:
            "0 4px 12px rgba(0, 0, 0, 0.08)",
          marginBottom: "2rem",
          // padding: "1.5rem",
          textAlign: "center"
        }}
      >
        {showHeader && (
          <>
            <h3
              style={{
                letterSpacing: "1px",
                margin: "0 0 .5rem",
                textTransform:
                  "uppercase"
              }}
            >
              {title}
            </h3>
            {description && (
              <p
                style={{
                  margin:
                    "0 auto 1.25rem",
                  maxWidth: "680px",
                  opacity: 0.8
                }}
              >
                {description}
              </p>
            )}
          </>
        )}
        {!showHeader && description && (
          <p
            style={{
              margin:
                "0 auto 1.25rem",
              maxWidth: "680px",
              opacity: 0.8
            }}
          >
            {description}
          </p>
        )}
        {scrollable ? (
          <div
            ref={chartScrollRef}
            style={{
              overflowX: "auto",
              paddingBottom: ".75rem"
            }}
          >
            {chart}
          </div>
        ) : (
          chart
        )}
      </section>
    );
  }

  return (
    <section
      style={{
        maxWidth: "1000px",
        margin: "2rem auto",
        padding: ".5rem",
        border: "1px solid #666",
        borderRadius: "18px",
        background: "#2c2c2c",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        textAlign: "center",
      }}
    >
      <h2
        style={{
          marginBottom: "1.5rem",
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        Approximate Size Comparison: BETA
      </h2>
     
      {isMobile ? (
        <ChartFrame
          title="Mobile"
          chartHeightPx={300}
          minWidth="560px"
          scrollable={true}
          clipOverflow={true}
          compactSpacing={true}
          topLayer={topLayer}
          showHeader={false}
        />
      ) : (
        <ChartFrame
          title="Desktop"
          topLayer={topLayer}
          showHeader={false}
        />
      )}

      <button
        type="button"
        onClick={handleTopLayerToggle}
        style={{
          backgroundColor: "#fab856",
          border: "none",
          borderRadius: "999px",
          color: "#1b1b1b",
          cursor: "pointer",
          fontWeight: "700",
          padding: ".55rem 1rem"
        }}
      >
        Top Layer:{" "}
        {topLayer === "pokemon"
          ? "Pokémon"
          : "Professor Oak"}
      </button>

      {reviewMode && (
        <section
          style={{
            border: "1px solid #666",
            borderRadius: "12px",
            marginTop: "1rem",
            padding: "1rem",
            textAlign: "left"
          }}
        >
          <h3
            style={{
              marginTop: 0
            }}
          >
            Sprite Size Review
          </h3>

          <p>
            Editing{" "}
            <strong>
              {formatPokemonDisplayName(
                pokemon
              )}
            </strong>
            {" "}at correction factor{" "}
            <strong>
              {manualCorrectionFactor.toFixed(
                2
              )}
            </strong>
            .
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: ".5rem",
              margin: "1rem 0"
            }}
          >
            <button
              type="button"
              onClick={() =>
                navigateToPokemon(
                  previousPokemon
                )
              }
              disabled={!previousPokemon}
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() =>
                updateManualCorrection(
                  -0.05
                )
              }
            >
              Decrease Size
            </button>

            <button
              type="button"
              onClick={() =>
                updateManualCorrection(
                  0.05
                )
              }
            >
              Increase Size
            </button>

            <button
              type="button"
              onClick={resetManualCorrection}
            >
              Reset
            </button>

            <button
              type="button"
              onClick={() =>
                navigateToPokemon(nextPokemon)
              }
              disabled={!nextPokemon}
            >
              Next
            </button>
          </div>

          <p
            style={{
              opacity: 0.8
            }}
          >
            Local edits are saved in this
            browser. Copy this JSON into{" "}
            <code>
              public/data/pokemonSpriteCorrections.json
            </code>
            {" "}when you want to keep the
            corrections in the project data.
          </p>

          <pre
            style={{
              backgroundColor: "#111",
              border: "1px solid #555",
              borderRadius: "8px",
              maxHeight: "260px",
              overflow: "auto",
              padding: "1rem",
              whiteSpace: "pre-wrap"
            }}
          >
            {correctionExport}
          </pre>
        </section>
      )}
    </section>
  );
}

export default SizeComparison;
