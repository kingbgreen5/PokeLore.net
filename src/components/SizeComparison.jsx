
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
import {
  DEFAULT_SIZE_COMPARISON_CHARACTER_ID,
  sizeComparisonCharacters
} from "../data/sizeComparisonCharacters";
import { formatPokemonDisplayName }
from "../utils/pokemonNames";
import {
  advanceSpriteFallback,
  getPokemonSizeComparisonSources
} from "../utils/pokemonSprites";
import { getPokemonUrl } from "../utils/pokemonUrls";

const LOCAL_CORRECTIONS_KEY =
  "pokemonSpriteManualCorrections";
const LOCAL_CHARACTER_CORRECTIONS_KEY =
  "pokemonComparisonCharacterManualCorrections";
const COMPARISON_CHARACTER_KEY =
  "pokemonSizeComparisonCharacter";

const SIZE_CORRECTION_REASONS = [
  {
    value: "coiled-body-length",
    label: "Coiled body length",
    explanation:
      "the official measurement appears to describe total body length rather than upright visual height"
  },
  {
    value: "wings",
    label: "Wings",
    explanation:
      "wings can extend beyond the main body silhouette"
  },
  {
    value: "antennae",
    label: "Antennae",
    explanation:
      "antennae can extend above the substantial head or body"
  },
  {
    value: "large-ears",
    label: "Large ears",
    explanation:
      "large or floppy ears can extend above the substantial head"
  },
  {
    value: "leaves-foliage",
    label: "Leaves/foliage",
    explanation:
      "leaves or foliage can extend beyond the substantial body"
  },
  {
    value: "tail",
    label: "Tail",
    explanation:
      "tails can extend beyond the main body silhouette"
  }
];

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

function readLocalCharacterCorrections() {
  try {
    return JSON.parse(
      localStorage.getItem(
        LOCAL_CHARACTER_CORRECTIONS_KEY
      ) ?? "{}"
    );
  } catch {
    return {};
  }
}

function writeLocalCharacterCorrections(corrections) {
  localStorage.setItem(
    LOCAL_CHARACTER_CORRECTIONS_KEY,
    JSON.stringify(corrections)
  );
}

function readComparisonCharacterId() {
  try {
    return (
      localStorage.getItem(
        COMPARISON_CHARACTER_KEY
      ) ??
      DEFAULT_SIZE_COMPARISON_CHARACTER_ID
    );
  } catch {
    return DEFAULT_SIZE_COMPARISON_CHARACTER_ID;
  }
}

function writeComparisonCharacterId(characterId) {
  try {
    localStorage.setItem(
      COMPARISON_CHARACTER_KEY,
      characterId
    );
  } catch {
    // Ignore storage failures so the chart remains usable.
  }
}

function getCorrectionReason(reasonValue) {
  return (
    SIZE_CORRECTION_REASONS.find(
      reason => reason.value === reasonValue
    ) ?? null
  );
}

function formatFeetInches(totalInches) {
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;

  return `${feet}' ${inches}"`;
}

function formatCharacterName(character) {
  return character.variant
    ? `${character.name} (${character.variant})`
    : character.name;
}

function formatCharacterOption(character) {
  const heightLabel = formatFeetInches(
    character.heightInches
  );
  const sourceLabel =
    character.heightSource === "fallback"
      ? "estimate"
      : "";

  return [
    formatCharacterName(character),
    heightLabel,
    sourceLabel
  ]
    .filter(Boolean)
    .join(" - ");
}

function SizeComparison({
  pokemon,
  reviewMode = false,
  sectionId = "size"
}) {
  const navigate = useNavigate();
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
    baseCharacterCorrectionsById,
    setBaseCharacterCorrectionsById
  ] = useState({});
  const [
    localCorrectionsById,
    setLocalCorrectionsById
  ] = useState(() =>
    readLocalCorrections()
  );
  const [
    localCharacterCorrectionsById,
    setLocalCharacterCorrectionsById
  ] = useState(() =>
    readLocalCharacterCorrections()
  );
  const [
    comparisonCharacterId,
    setComparisonCharacterId
  ] = useState(() =>
    readComparisonCharacterId()
  );
  const [pokemonIndex, setPokemonIndex] =
    useState([]);
  const pokemonSources = useMemo(
    () => getPokemonSizeComparisonSources(pokemon),
    [pokemon]
  );

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
            setBaseCharacterCorrectionsById(
              correctionData.comparisonCharacters ??
                {}
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

  function formatMeters(height) {
    return `${(Number(height) / 10).toFixed(1)} m`;
  }

  const pokemonHeightInches = heightToInches(pokemon.height);
  const pokemonDisplayName =
    formatPokemonDisplayName(pokemon);
  const comparisonCharacter =
    sizeComparisonCharacters.find(
      character =>
        character.id === comparisonCharacterId
    ) ??
    sizeComparisonCharacters.find(
      character =>
        character.id ===
        DEFAULT_SIZE_COMPARISON_CHARACTER_ID
    ) ??
    sizeComparisonCharacters[0];
  const comparisonCharacterName =
    formatCharacterName(comparisonCharacter);
  const comparisonHeightInches =
    comparisonCharacter.heightInches;
  const comparisonCharacterCorrectionData =
    localCharacterCorrectionsById[
      comparisonCharacter.id
    ] ??
    baseCharacterCorrectionsById[
      comparisonCharacter.id
    ] ??
    null;
  const parsedComparisonCharacterScale =
    typeof comparisonCharacterCorrectionData ===
    "number"
      ? comparisonCharacterCorrectionData
      : Number(
          comparisonCharacterCorrectionData?.scale ??
            1
        );
  const comparisonCharacterScale =
    Number.isFinite(
      parsedComparisonCharacterScale
    )
      ? parsedComparisonCharacterScale
      : 1;
  const hasLocalComparisonCharacterCorrection =
    Object.prototype.hasOwnProperty.call(
      localCharacterCorrectionsById,
      comparisonCharacter.id
    );
  const effectiveComparisonHeightInches =
    comparisonHeightInches *
    comparisonCharacterScale;
  const listedHeightLabel =
    formatFeetInches(pokemonHeightInches);
  const listedMetricHeight =
    formatMeters(pokemon.height);
  const spriteBounds =
    spriteBoundsById[pokemon.id];
  const correctionData =
    localCorrectionsById[pokemon.id] ??
    baseCorrectionsById[pokemon.id] ??
    null;
  const parsedManualCorrectionFactor =
    typeof correctionData === "number"
      ? correctionData
      : Number(correctionData?.factor ?? 1);
  const manualCorrectionFactor =
    Number.isFinite(parsedManualCorrectionFactor)
      ? parsedManualCorrectionFactor
      : 1;
  const effectivePokemonHeightInches =
    pokemonHeightInches *
    manualCorrectionFactor;
  const topLayerPreset =
    typeof correctionData === "object" &&
    correctionData?.topLayer === "oak"
      ? "oak"
      : "pokemon";
  const correctionReason =
    typeof correctionData === "object"
      ? getCorrectionReason(correctionData?.reason)
      : null;
  const pokemonSpriteFlipped =
    typeof correctionData === "object" &&
    correctionData?.flipHorizontal === true;
  const sizeComparisonSummary =
    manualCorrectionFactor === 1
      ? `${pokemonDisplayName} is listed at ${listedHeightLabel} (${listedMetricHeight}) and shown in an in-chart visual comparison.`
      : correctionReason
        ? `${pokemonDisplayName} is listed at ${listedHeightLabel} (${listedMetricHeight}); this chart uses a pose-adjusted visual scale because ${correctionReason.explanation}.`
        : `${pokemonDisplayName} is listed at ${listedHeightLabel} (${listedMetricHeight}); this chart uses a pose-adjusted visual scale.`;
  const headingId = `${sectionId}-comparison-heading`;
  const summaryId = `${sectionId}-comparison-summary`;

  useEffect(() => {
    setTopLayer(topLayerPreset);
  }, [
    pokemon.id,
    topLayerPreset
  ]);

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
        },
        comparisonCharacters: {
          ...baseCharacterCorrectionsById,
          ...localCharacterCorrectionsById
        }
      },
      null,
      2
    );
  }, [
    baseCharacterCorrectionsById,
    baseCorrectionsById,
    localCharacterCorrectionsById,
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

  function buildCorrectionEntry(
    overrides = {}
  ) {
    const currentCorrection =
      typeof correctionData === "number"
        ? {
            factor: correctionData
          }
        : {
            ...(correctionData ?? {})
          };

    const nextCorrection = {
      ...currentCorrection,
      id: pokemon.id,
      name: pokemon.name,
      factor: manualCorrectionFactor,
      ...overrides
    };

    if (!nextCorrection.reason) {
      delete nextCorrection.reason;
    }

    if (!nextCorrection.flipHorizontal) {
      delete nextCorrection.flipHorizontal;
    }

    return nextCorrection;
  }

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
      [pokemon.id]: buildCorrectionEntry({
        factor: nextFactor
      })
    };

    setLocalCorrectionsById(nextCorrections);
    writeLocalCorrections(nextCorrections);
  }

  function updateTopLayerPreset(layer) {
    const nextCorrections = {
      ...localCorrectionsById,
      [pokemon.id]: buildCorrectionEntry({
        topLayer: layer
      })
    };

    setTopLayer(layer);
    setLocalCorrectionsById(nextCorrections);
    writeLocalCorrections(nextCorrections);
  }

  function updateCorrectionReason(reason) {
    const nextCorrections = {
      ...localCorrectionsById,
      [pokemon.id]: buildCorrectionEntry({
        reason: reason || undefined
      })
    };

    setLocalCorrectionsById(nextCorrections);
    writeLocalCorrections(nextCorrections);
  }

  function toggleHorizontalFlip() {
    const nextCorrections = {
      ...localCorrectionsById,
      [pokemon.id]: buildCorrectionEntry({
        flipHorizontal:
          !pokemonSpriteFlipped
      })
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

  function handleComparisonCharacterChange(event) {
    const nextCharacterId = event.target.value;

    setComparisonCharacterId(nextCharacterId);
    writeComparisonCharacterId(nextCharacterId);
  }

  function buildCharacterCorrectionEntry(
    overrides = {}
  ) {
    const currentCorrection =
      typeof comparisonCharacterCorrectionData ===
      "number"
        ? {
            scale:
              comparisonCharacterCorrectionData
          }
        : {
            ...(
              comparisonCharacterCorrectionData ??
              {}
            )
          };

    return {
      ...currentCorrection,
      id: comparisonCharacter.id,
      name: comparisonCharacter.name,
      scale: comparisonCharacterScale,
      ...overrides
    };
  }

  function updateComparisonCharacterScale(delta) {
    const nextScale = Math.max(
      0.5,
      Math.min(
        2,
        Number(
          (
            comparisonCharacterScale + delta
          ).toFixed(2)
        )
      )
    );
    const nextCorrections = {
      ...localCharacterCorrectionsById,
      [comparisonCharacter.id]:
        buildCharacterCorrectionEntry({
          scale: nextScale
        })
    };

    setLocalCharacterCorrectionsById(
      nextCorrections
    );
    writeLocalCharacterCorrections(
      nextCorrections
    );
  }

  function resetComparisonCharacterScale() {
    const nextCorrections = {
      ...localCharacterCorrectionsById
    };

    delete nextCorrections[
      comparisonCharacter.id
    ];
    setLocalCharacterCorrectionsById(
      nextCorrections
    );
    writeLocalCharacterCorrections(
      nextCorrections
    );
  }

  function navigateToPokemon(nextPokemon) {
    if (!nextPokemon) return;

    const pokemonUrl =
      getPokemonUrl(
        nextPokemon,
        "?size-review=1"
      );

    if (pokemonUrl) {
      navigate(
        pokemonUrl,
        {
          state: {
            preserveScroll: true
          }
        }
      );
    }
  }

  function getChartMetrics(chartHeightPx) {
    const tallestHeightInches = Math.max(
      effectivePokemonHeightInches,
      effectiveComparisonHeightInches,
      72
    );
    const rawChartMaxFeet = Math.ceil(
      tallestHeightInches / 12
    );
    const rulerInterval =
      getRulerInterval(
        rawChartMaxFeet,
        chartHeightPx
      );
    const chartMaxFeet =
      Math.ceil(
        rawChartMaxFeet /
          rulerInterval
      ) * rulerInterval;
    const chartMaxInches =
      chartMaxFeet * 12;
    const rulerMarks = [];

    for (
      let feet = chartMaxFeet;
      feet >= 0;
      feet -= rulerInterval
    ) {
      rulerMarks.push(feet);
    }
    const comparisonHeightPx =
      (effectiveComparisonHeightInches /
        chartMaxInches) *
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
          comparisonHeightPx * 0.55 +
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
      comparisonHeightPx,
      pokemonSpriteSizing,
      recommendedMinWidthPx,
      rulerInterval,
      rulerMarks
    };
  }

  function getRulerInterval(
    chartMaxFeet,
    chartHeightPx
  ) {
    const minimumPixelsPerTick = 32;
    const intervals = [
      1,
      2,
      5,
      10,
      20,
      50
    ];

    return (
      intervals.find(interval => {
        const tickCount =
          chartMaxFeet / interval;

        return (
          chartHeightPx / tickCount >=
          minimumPixelsPerTick
        );
      }) ??
      intervals[intervals.length - 1]
    );
  }

  function Ruler({
    metrics,
    compact = false
  }) {
    return (
      <div
        style={{
          fontSize: compact
            ? ".75rem"
            : "1rem",
          fontWeight: "700",
          height: "100%",
          paddingRight: compact
            ? ".45rem"
            : "0.75rem",
          position: "relative",
          textAlign: "right"
        }}
      >
        {metrics.rulerMarks.map(feet => (
          <span
            key={feet}
            style={{
              bottom: `${(feet / metrics.chartMaxFeet) * 100}%`,
              position: "absolute",
              right: compact
                ? ".45rem"
                : "0.75rem",
              transform:
                "translateY(50%)"
            }}
          >
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
    const mobileComparisonOverlap = 55;
    const mobileComparisonLeft =
      mobileScenePadding +
      (metrics.pokemonSpriteSizing
        .visibleRenderedWidth || 0) -
      mobileComparisonOverlap;

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
              left={`${mobileComparisonLeft}px`}
              zIndex={
                topLayer === "oak"
                  ? 2
                  : 1
              }
            >
              <ComparisonCharacterSprite
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
              <ComparisonCharacterSprite
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
              <ComparisonCharacterSprite
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

  function ComparisonCharacterSprite({
    metrics
  }) {
    return (
      <img
        src={comparisonCharacter.sprite}
        alt={comparisonCharacterName}
        style={{
          height: `${metrics.comparisonHeightPx}px`,
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
        src={pokemonSources[0]}
        alt={pokemon.name}
        onError={event =>
          advanceSpriteFallback(
            event,
            pokemonSources.slice(1)
          )
        }
        style={{
          height: `${metrics.pokemonSpriteSizing.renderedHeight}px`,
          maxWidth: "none",
          objectFit: "contain",
          transform: `translate(${horizontalOffset}px, ${metrics.pokemonSpriteSizing.floorOffset}px) scaleX(${pokemonSpriteFlipped ? -1 : 1})`,
          transformOrigin: "center bottom",
          width: "auto"
        }}
      />
    );
  }

  function ChartFrame({
    title,
    description,
    chartHeightPx = 420,
    topPaddingPx = 0,
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
            : `${chartHeightPx + topPaddingPx}px`,
          boxSizing: "border-box",
          paddingTop: topPaddingPx
            ? `${topPaddingPx}px`
            : undefined,
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
              overflowY: "visible",
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
      id={sectionId}
      aria-labelledby={headingId}
      aria-describedby={summaryId}
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
        id={headingId}
        style={{
          marginBottom: ".4rem",
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        {pokemonDisplayName} Size Comparison: BETA
      </h2>
      <p
        id={summaryId}
        style={{
          fontSize: ".9rem",
          margin: "0 auto 1.25rem",
          maxWidth: "680px",
          opacity: 0.82
        }}
      >
        {sizeComparisonSummary}
      </p>

      {isMobile ? (
        <ChartFrame
          title="Mobile"
          chartHeightPx={300}
          topPaddingPx={48}
          minWidth="560px"
          scrollable={true}
          clipOverflow={false}
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

      <details
        style={{
          borderTop: "1px solid #555",
          margin: "0 auto 1rem",
          maxWidth: "760px",
          paddingTop: ".85rem",
          textAlign: "left"
        }}
      >
        <summary
          style={{
            cursor: "pointer",
            fontWeight: "700"
          }}
        >
          How is visual size determined?
        </summary>

        <div
          style={{
            fontSize: ".9rem",
            lineHeight: 1.55,
            opacity: 0.9,
            paddingTop: ".7rem"
          }}
        >
          <p
            style={{
              margin: "0 0 .65rem"
            }}
          >
            Pokédex height is treated as the
            official listed measurement, but
            the chart uses pose-aware visual
            scaling so each sprite looks
            reasonable in a direct comparison.
          </p>

          <p
            style={{
              margin: "0 0 .65rem"
            }}
          >
            For long or coiled Pokémon, the
            listed height may represent total
            body length rather than upright
            height. For Pokémon with floppy
            ears, leaves, feathers, antennae,
            wings, or other flexible features,
            the chart usually measures to the
            top of the solid, substantial part
            of the head or body instead of the
            tallest decorative feature.
          </p>

          <p
            style={{
              margin: 0
            }}
          >
            The goal is not to replace the
            official height, but to make the
            artwork compare naturally at the
            size it appears to occupy.
          </p>

          {manualCorrectionFactor !== 1 && (
            <p
              style={{
                margin: ".65rem 0 0"
              }}
            >
              {correctionReason
                ? `${pokemonDisplayName} is currently tagged for ${correctionReason.label.toLowerCase()}.`
                : `${pokemonDisplayName} currently uses a pose-adjusted visual scale.`}
            </p>
          )}
        </div>
      </details>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexWrap: "wrap",
          gap: ".6rem",
          justifyContent: "center",
          margin: "0 auto 1rem"
        }}
      >
        <label
          style={{
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            fontSize: ".9rem",
            fontWeight: "700",
            gap: ".4rem",
            justifyContent: "center"
          }}
        >
          Compare with
          <select
            value={comparisonCharacter.id}
            onChange={
              handleComparisonCharacterChange
            }
            style={{
              backgroundColor: "#171a20",
              border: "1px solid #6f7a86",
              borderRadius: "8px",
              color: "#f5f5f5",
              font: "inherit",
              maxWidth: "min(82vw, 360px)",
              padding: ".45rem .6rem"
            }}
          >
            {sizeComparisonCharacters.map(
              character => (
                <option
                  key={character.id}
                  value={character.id}
                >
                  {formatCharacterOption(
                    character
                  )}
                </option>
              )
            )}
          </select>
        </label>

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
            : comparisonCharacterName}
        </button>
      </div>

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

          <p>
            Comparison character{" "}
            <strong>
              {comparisonCharacterName}
            </strong>
            {" "}is displayed at{" "}
            <strong>
              {Math.round(
                comparisonCharacterScale * 100
              )}
              %
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
                updateComparisonCharacterScale(
                  -0.05
                )
              }
            >
              Decrease Character
            </button>

            <button
              type="button"
              onClick={() =>
                updateComparisonCharacterScale(
                  0.05
                )
              }
            >
              Increase Character
            </button>

            <button
              type="button"
              onClick={resetComparisonCharacterScale}
              disabled={
                !hasLocalComparisonCharacterCorrection
              }
            >
              Reset Character
            </button>

            <button
              type="button"
              onClick={toggleHorizontalFlip}
            >
              {pokemonSpriteFlipped
                ? "Unflip Image"
                : "Horizontally Flip Image"}
            </button>

            <button
              type="button"
              onClick={() =>
                updateTopLayerPreset(
                  "pokemon"
                )
              }
              disabled={
                topLayerPreset === "pokemon"
              }
            >
              Preset Pokémon Front
            </button>

            <button
              type="button"
              onClick={() =>
                updateTopLayerPreset("oak")
              }
              disabled={topLayerPreset === "oak"}
            >
              Preset Character Front
            </button>

            <label
              style={{
                alignItems: "center",
                display: "flex",
                gap: ".35rem"
              }}
            >
              Reason
              <select
                value={
                  typeof correctionData === "object"
                    ? correctionData?.reason ?? ""
                    : ""
                }
                onChange={event =>
                  updateCorrectionReason(
                    event.target.value
                  )
                }
              >
                <option value="">
                  No specific reason
                </option>
                {SIZE_CORRECTION_REASONS.map(
                  reason => (
                    <option
                      key={reason.value}
                      value={reason.value}
                    >
                      {reason.label}
                    </option>
                  )
                )}
              </select>
            </label>

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
            browser. Pokemon and comparison
            character corrections are included
            below. Copy this JSON into{" "}
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
