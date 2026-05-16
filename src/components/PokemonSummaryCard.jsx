import typeColors from "../constants/typeColors";
import { useNavigate }
from "react-router-dom";
const navigate = useNavigate();

function capitalize(text) {
  return text
    .split("-")
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function PokemonSummaryCard({
  pokemon,
  onClick
}) {
  return (
    <div

      // onClick={() =>
      //   onClick?.(pokemon)
      // }

onClick={() =>
  navigate(`/pokemon/${pokemon.id}`)
}



      style={{
        border: "2px solid #555",
        borderRadius: "18px",
        padding: "1rem",
        backgroundColor:
          "#2c2c2c",
        cursor: "pointer",
        transition:
          "transform 0.15s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "320px"
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
      {/* Dex Number */}

      <div
        style={{
          width: "100%",
          textAlign: "left",
          opacity: 0.6,
          fontSize: ".85rem",
          marginBottom: ".5rem"
        }}
      >
        #
        {pokemon.id
          .toString()
          .padStart(4, "0")}
      </div>

      {/* Sprite */}

      <img
        src={pokemon.sprite}
        alt={pokemon.name}
        loading="lazy"
        style={{
          width: "170px",
          height: "170px",
          objectFit: "contain",
          marginBottom: ".5rem"
        }}
      />

      {/* Name */}

      <h2
        style={{
          margin:
            "0 0 .75rem 0",
          textAlign: "center",
          fontSize: "1.2rem"
        }}
      >
        {capitalize(
          pokemon.name
        )}
      </h2>

      {/* Types */}

      <div
        style={{
          display: "flex",
          gap: ".5rem",
          flexWrap: "wrap",
          justifyContent:
            "center"
        }}
      >
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
                  ".35rem .85rem",
                borderRadius:
                  "999px",
                fontSize:
                  ".72rem",
                fontWeight:
                  "bold",
                textTransform:
                  "uppercase",
                letterSpacing:
                  ".03rem"
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