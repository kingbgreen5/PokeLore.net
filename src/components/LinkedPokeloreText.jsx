import { Link } from "react-router-dom";
import { linkifyPokeloreText } from "../utils/pokeloreTextLinks";

function LinkedPokeloreText({
  text,
  linkTargets,
  currentPokemon,
  excludedPokemonLabels,
  usedRoutes
}) {
  const parts = linkifyPokeloreText(
    text,
    linkTargets,
    currentPokemon,
    {
      excludedPokemonLabels,
      usedRoutes
    }
  );

  return parts.map((part, index) => {
    if (!part.href) {
      return (
        <span key={index}>
          {part.text}
        </span>
      );
    }

    return (
      <Link
        key={index}
        to={part.href}
        style={{
          color: "#00cadb",
          fontWeight: 600,
          textDecoration: "none"
        }}
      >
        {part.text}
      </Link>
    );
  });
}

export default LinkedPokeloreText;
