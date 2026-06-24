import typeColors from "../constants/typeColors";
import { useNavigate }
from "react-router-dom";
import { formatPokemonDisplayName }
from "../utils/pokemonNames";

const CARD_SIZES = {
  full: {
    width: undefined,
    minHeight: "320px",
    maxHeight: "320px",
    maxWidth: "320px",
    padding: "1rem",
    dexFontSize: ".85rem",
    dexMarginBottom: "0",
    spriteSize: "170px",
    nameFontSize: "1.2rem",
    nameMargin: "0 0 .5rem 0",
    typeGap: ".5rem",
    typePadding: ".35rem .85rem",
    typeFontSize: ".72rem",
    typeLetterSpacing: ".03rem"
  },
  compact: {
    width: "135px",
    minHeight: "135px",
    maxHeight: "200px",
    maxWidth: "200px",
    padding: ".2rem",
    dexFontSize: ".85rem",
    dexMarginBottom: "-.7rem",
    spriteSize: "90px",
    nameFontSize: ".8rem",
    nameMargin: "0 0 .5rem 0",
    typeGap: ".5rem",
    typePadding: ".1rem .4rem",
    typeFontSize: ".4rem",
    typeLetterSpacing: ".03rem"
  },
  subcompact: {
    width: "75px",
    minHeight: "75px",
    maxHeight: "100px",
    maxWidth: "100px",
    padding: ".1rem",
    dexFontSize: ".48rem",
    dexMarginBottom: "-.35rem",
    spriteSize: "45px",
    nameFontSize: ".48rem",
    nameMargin: "0 0 .2rem 0",
    typeGap: ".15rem",
    typePadding: ".05rem .2rem",
    typeFontSize: ".25rem",
    typeLetterSpacing: "0"
  }
};


function PokemonSummaryCard({
  pokemon,
  compact = false,
  subcompact = false,
  variant
}) {
  
   const navigate = useNavigate();

  const sizeKey =
    variant ||
    (subcompact
      ? "subcompact"
      : compact
        ? "compact"
        : "full");

  const size =
    CARD_SIZES[sizeKey] ||
    CARD_SIZES.full;
  const displayName =
    formatPokemonDisplayName(
      pokemon
    );
  
  return (
    <div

      // onClick={() =>
      //   onClick?.(pokemon)
      // }

onClick={() =>
  navigate(`/pokemon/${pokemon.id}`)
}

// ------------------------------------------------container

      style={{
        border: "2px solid #555",
        borderRadius: "18px",
        backgroundColor:
          "#2c2c2c",
        cursor: "pointer",
        transition:
          "transform 0.15s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box",
        width: size.width,
        minHeight: size.minHeight,
        maxHeight: size.maxHeight,
        maxWidth: size.maxWidth,
        padding: size.padding
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform =
          "translateY(-4px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform =
          "translateY(0px)";
      }}
    >
      {/*-------------------------------------------------------- Dex Number */}

      <div
        style={{
          width: "100%",
          textAlign: "left",
          opacity: 0.6,
          fontSize: size.dexFontSize,
          marginBottom:
            size.dexMarginBottom
        }}
      >
        #
        {pokemon.id
          .toString()
          .padStart(4, "0")}
      </div>

      {/*--------------------------------------------------------------- Sprite */}

      <img
        src={pokemon.sprite}
        alt={displayName}
        loading="lazy"
        style={{
          width: size.spriteSize,
          height: size.spriteSize,
          objectFit: "contain",


        }}
      />

      {/*-------------------------------------------------------- Name */}

      <h2
        style={{
          margin: size.nameMargin,
          textAlign: "center",
          fontSize:
            size.nameFontSize,
          lineHeight: 1.1,
          overflowWrap:
            "anywhere",


        }}
      >
        {displayName}
      </h2>

      {/* Types */}

      <div
        style={{
          display: "flex",
          gap: size.typeGap,
          flexWrap: "wrap",
          justifyContent:
            "center"
        }}
      >
  {/*-------------------------------------------------------- Type */}

        {pokemon.types.map(
          type => (
            <span
              key={type}
              style={{
                backgroundColor:
                  typeColors[
                    type
                  ],
                color: "white",
                padding:
                  size.typePadding,
                borderRadius:
                  "999px",
                fontSize:
                  size.typeFontSize,
                fontWeight:
                  "bold",
                textTransform:
                  "uppercase",
                letterSpacing:
                  size.typeLetterSpacing,
        
              }}
            >
              {type}
            </span>
          )
        )}

        
        
      </div>
    </div>
  );
}

export default PokemonSummaryCard;
