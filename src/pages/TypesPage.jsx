import { Link } from "react-router-dom";
import typeColors from "../constants/typeColors";
import TypeBadge from "../components/TypeBadge";
import Seo from "../seo/Seo";
import {
  typesSeo
} from "../seo/seoConfig";

function TypesPage() {
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
          <Link
            key={type}
            to={`/type/${type}`}
            style={{
              alignItems: "center",
              backgroundColor: "#2c2c2c",
              border: "2px solid rgba(255, 255, 255, .18)",
              borderRadius: "12px",
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              minHeight: "64px",
              padding: ".85rem 1rem",
              textDecoration: "none"
            }}
          >
            <TypeBadge
              height="2rem"
              type={type}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default TypesPage;
