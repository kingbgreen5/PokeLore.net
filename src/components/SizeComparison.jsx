


//   import oakSprite from "../assets/FRLG_Professor_Oak_Portrait.png";
//   import statusBadge from "../assets/Status Badge.png";
//   import oakSprite2 from "../assets/Red_Green_Prof_Oak.png"
// function SizeComparison({ pokemon }) {
//   const oakHeightInches = 67;
//   const oakVisualScale = 1;

// const chartHeightPx = 420;
// const chartMaxInches = 72;



//   function heightToInches(height) {
//     return Math.round((height / 10) * 39.3701);
//   }

//   function formatFeetInches(totalInches) {
//     const feet = Math.floor(totalInches / 12);
//     const inches = totalInches % 12;
//     return `${feet}' ${inches}"`;
//   }

//   const pokemonHeightInches = heightToInches(pokemon.height);
//   const chartMaxInches = 72;

// // const oakHeightPercent = (oakHeightInches / chartMaxInches) * 100;
// //   const pokemonHeightPercent = (pokemonHeightInches / chartMaxInches) * 100;



// const oakHeightPx = (oakHeightInches / chartMaxInches) * chartHeightPx;
// const pokemonHeightPx = (pokemonHeightInches / chartMaxInches) * chartHeightPx;

//   return (
//     <section
//       style={{
//         maxWidth: "900px",
//         margin: "2rem auto",
//         padding: "1.5rem",
//         border: "1px solid #d5dce5",
//         borderRadius: "18px",
//         background: "#2c2c2c",
//         boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
//         textAlign: "center",
//       }}
//     >
//       <h2
//         style={{
//           marginBottom: "1.5rem",
//           textTransform: "uppercase",
//           letterSpacing: "1px",
//         }}
//       >
//         Size Comparison
//       </h2>

//       <div
//         style={{
//           display: "grid",
//           gridTemplateColumns: "60px 1fr",
//           height: "420px",
//         }}
//       >
//         <div
//           style={{
//             display: "flex",
//             flexDirection: "column",
//             justifyContent: "space-between",
//             fontWeight: "700",
//             textAlign: "right",
//             paddingRight: "0.75rem",
//           }}
//         >
//           {[6, 5, 4, 3, 2, 1, 0].map((feet) => (
//             <span key={feet}>{feet} ft</span>
//           ))}
//         </div>

//         <div
//           style={{
//             position: "relative",
//             borderLeft: "2px solid #222",
//             borderBottom: "2px solid #222",
//             height: "100%",
//           }}
//         >
//           {[6, 5, 4, 3, 2, 1, 0].map((feet) => (
//             <div
//               key={feet}
//               style={{
//                 height: "calc(100% / 6)",
//                 borderTop: "1px dashed #cbd3dc",
//               }}
//             />
//           ))}



// <div
//   style={{
//     position: "absolute",
//     bottom: "0",
//     left: "6%",
//     width: "45%",
//     display: "flex",
//     flexDirection: "column",
//     alignItems: "center",
//   }}
// >
//   <img
//     src={oakSprite2}
//     alt="Professor Oak"
//     style={{
//     //   height: `${oakHeightPercent * oakVisualScale}%`,
//     height:"100%",
//     //   width: "auto",
//     //   maxWidth: "none",
//     //   objectFit: "contain",
//     //   imageRendering: "pixelated",
//     }}
//   />








//             {/* <div
//               style={{
//                 marginTop: "0.75rem",
//                 padding: "0.5rem 1rem",
//                 border: "1px solid #b8cbe0",
//                 borderRadius: "10px",
//                 background: "#eef6ff",
//                 display: "flex",
//                 flexDirection: "column",
//                 minWidth: "130px",
//                 textTransform: "capitalize",
//               }}
//             >
//               <strong>Prof. Oak</strong>
//               <span>{formatFeetInches(oakHeightInches)}</span>
//             </div> */}
//           </div>

//           <div
//             style={{
//               position: "absolute",
//               bottom: "0",
//               right: "8%",
//               width: "40%",
//               display: "flex",
//               flexDirection: "column",
//               alignItems: "center",
//             }}
//           >
//             <img
//               src={pokemon.sprite}
//               alt={pokemon.name}
//               style={{
//                 height: `${pokemonHeightPercent}%`,
//                 maxWidth: "100%",
//                 objectFit: "contain",
//                 // imageRendering: "pixelated",
//                 marginBottom:"-2rem"
//               }}
//             />

//             {/* <div
//               style={{
//                 marginTop: "0.75rem",
//                 padding: "0.5rem 1rem",
//                 border: "1px solid #b9d9b9",
//                 borderRadius: "10px",
//                 background: "#f0fff0",
//                 display: "flex",
//                 flexDirection: "column",
//                 minWidth: "130px",
//                 textTransform: "capitalize",
//               }}
//             >
//               <strong>{pokemon.name}</strong>
//               <span>{formatFeetInches(pokemonHeightInches)}</span>
//             </div> */}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// export default SizeComparison;


import {
  useEffect,
  useMemo,
  useState
} from "react";
import oakSprite from "../assets/FRLG_Professor_Oak_Portrait.png";

function SizeComparison({ pokemon }) {
  const oakHeightInches = 67;
  const fallbackSpriteCorrectionFactor = 1.2;
  const [
    spriteBoundsById,
    setSpriteBoundsById
  ] = useState({});
  const [isMobile, setIsMobile] =
    useState(false);

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
  const getPokemonSpriteSizing = useMemo(() => {
    return pokemonHeightPx => {
    if (
      spriteBounds?.visibleBounds?.height &&
      spriteBounds?.height
    ) {
      const scale =
        pokemonHeightPx /
        spriteBounds.visibleBounds.height;

      return {
        renderedHeight:
          spriteBounds.height * scale,
        floorOffset:
          (spriteBounds.transparentPadding
            ?.bottom ?? 0) * scale,
        usesBounds: true
      };
    }

    return {
      renderedHeight:
        pokemonHeightPx *
        fallbackSpriteCorrectionFactor,
      floorOffset: 0,
      usesBounds: false
    };
    };
  }, [
    spriteBounds,
    fallbackSpriteCorrectionFactor
  ]);

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

    return {
      chartMaxFeet,
      chartHeightPx,
      oakHeightPx,
      pokemonSpriteSizing:
        getPokemonSpriteSizing(
          pokemonHeightPx
        ),
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
    return metrics.rulerMarks.map(feet => (
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
    compactSpacing = false
  }) {
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
              left="38%"
              transform="translateX(-50%)"
            >
              <PokemonSprite
                metrics={metrics}
              />
            </SpriteColumn>
            <SpriteColumn
              width="max-content"
              left="62%"
              transform="translateX(-50%)"
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
            >
              <PokemonSprite
                metrics={metrics}
              />
            </SpriteColumn>
            <SpriteColumn
              width="40%"
              right="8%"
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
    width
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
          width
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
          imageRendering: "pixelated",
          maxWidth: "none",
          objectFit: "contain",
          width: "auto"
        }}
      />
    );
  }

  function PokemonSprite({
    metrics
  }) {
    return (
      <img
        src={pokemon.sprite}
        alt={pokemon.name}
        style={{
          height: `${metrics.pokemonSpriteSizing.renderedHeight}px`,
          maxWidth: "none",
          objectFit: "contain",
          transform: `translateY(${metrics.pokemonSpriteSizing.floorOffset}px)`,
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
    showHeader = true
  }) {
    const metrics =
      getChartMetrics(chartHeightPx);
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
          minWidth: scrollable
            ? minWidth
            : undefined
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
        />
      </div>
    );

    return (
      <section
        style={{
          border:
            "1px solid #d5dce5",
          borderRadius: "18px",
          boxShadow:
            "0 4px 12px rgba(0, 0, 0, 0.08)",
          marginBottom: "2rem",
          padding: "1.5rem",
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
        maxWidth: "900px",
        margin: "2rem auto",
        padding: "1.5rem",
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
          showHeader={false}
        />
      ) : (
        <ChartFrame
          title="Desktop"
          showHeader={false}
        />
      )}
    </section>
  );
}

export default SizeComparison;
