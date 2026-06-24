


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


  import oakSprite from "../assets/FRLG_Professor_Oak_Portrait.png";
import oakSprite2 from "../assets/Red_Green_Prof_Oak.png";

function SizeComparison({ pokemon }) {
  const oakHeightInches = 67;

  const chartHeightPx = 420;
  const chartMaxInches = 72;

  function heightToInches(height) {
    return Math.round((height / 10) * 39.3701);
  }

  function formatFeetInches(totalInches) {
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}' ${inches}"`;
  }

  const pokemonHeightInches = heightToInches(pokemon.height);

  const oakHeightPx =
    (oakHeightInches / chartMaxInches) * chartHeightPx;

  const pokemonHeightPx =
    (pokemonHeightInches / chartMaxInches) * chartHeightPx;

  return (
    <section
      style={{
        maxWidth: "900px",
        margin: "2rem auto",
        padding: "1.5rem",
        border: "1px solid #d5dce5",
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
        Size Comparison
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "60px 1fr",
          height: `${chartHeightPx}px`,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            fontWeight: "700",
            textAlign: "right",
            paddingRight: "0.75rem",
          }}
        >
          {[6, 5, 4, 3, 2, 1, 0].map((feet) => (
            <span key={feet}>{feet} ft</span>
          ))}
        </div>

        <div
          style={{
            position: "relative",
            borderLeft: "2px solid #222",
            borderBottom: "2px solid #222",
            height: "100%",
          }}
        >
          {[6, 5, 4, 3, 2, 1, 0].map((feet) => (
            <div
              key={feet}
              style={{
                height: "calc(100% / 6)",
                borderTop: "1px dashed #cbd3dc",
              }}
            />
          ))}

          <div
            style={{
              position: "absolute",
              bottom: "0",
              left: "6%",
              width: "45%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <img
              src={oakSprite}
              alt="Professor Oak"
              style={{
                height: `${oakHeightPx}px`,
                width: "auto",
                maxWidth: "none",
                objectFit: "contain",
                imageRendering: "pixelated",
              }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              bottom: "0",
              right: "8%",
              width: "40%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <img
              src={pokemon.sprite}
              alt={pokemon.name}
              style={{
                height: `${pokemonHeightPx}px`,
                width: "auto",
                maxWidth: "100%",
                objectFit: "contain",
                marginBottom: "-2rem",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default SizeComparison;