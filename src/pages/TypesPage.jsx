import { useNavigate } from "react-router-dom";
import typeColors from "../constants/typeColors";
import Seo from "../seo/Seo";
import {
  formatName,
  typesSeo
} from "../seo/seoConfig";

function TypesPage() {
  const navigate = useNavigate();
  const types = Object.keys(typeColors);

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "1100px",
        margin: "0 auto"
      }}
    >
      <Seo {...typesSeo()} />

      <h1>Pokémon Types</h1>

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(150px, 1fr))",
          marginTop: "2rem"
        }}
      >
        {types.map(type => (
          <button
            key={type}
            onClick={() =>
              navigate(`/type/${type}`)
            }
            style={{
              backgroundColor:
                typeColors[type],
              border: "2px solid rgba(255, 255, 255, .18)",
              borderRadius: "12px",
              color: "white",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "bold",
              minHeight: "64px",
              padding: ".85rem 1rem",
              textTransform: "uppercase"
            }}
          >
            {formatName(type)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TypesPage;
