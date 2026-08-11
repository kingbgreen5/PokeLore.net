import { Link } from "react-router-dom";
import { linkifyPokeloreText } from "../utils/pokeloreTextLinks";

function renderTextWithBreaks(text, keyPrefix, renderSegment) {
  return String(text)
    .split(/(\n{2,})/)
    .map((segment, index) => {
      if (!segment) {
        return null;
      }

      if (/^\n{2,}$/.test(segment)) {
        return (
          <span key={`${keyPrefix}-break-${index}`}>
            <br />
            <br />
          </span>
        );
      }

      return renderSegment(
        segment,
        `${keyPrefix}-text-${index}`
      );
    });
}

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
      return renderTextWithBreaks(
        part.text,
        index,
        (segment, key) => (
          <span key={key}>
            {segment}
          </span>
        )
      );
    }

    return renderTextWithBreaks(
      part.text,
      index,
      (segment, key) => (
        <Link
          key={key}
          to={part.href}
          style={{
            color: "#00cadb",
            fontWeight: 600,
            textDecoration: "none"
          }}
        >
          {segment}
        </Link>
      )
    );
  });
}

export default LinkedPokeloreText;
