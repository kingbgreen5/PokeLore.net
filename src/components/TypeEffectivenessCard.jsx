import { useId } from "react";
import { Link } from "react-router-dom";
import TypeBadgeImage from "./TypeBadge";
import {
  formatDamageMultiplier,
  formatTypeName,
  getDefensiveMatchupGroups
} from "../utils/typeEffectiveness";

function TypeBadge({
  type,
  multiplier
}) {
  const typeName = formatTypeName(type);
  const multiplierLabel =
    formatDamageMultiplier(multiplier);

  return (
    <Link
      aria-label={`${typeName} attacking moves deal ${multiplierLabel} damage`}
      to={`/type/${type}`}
      style={{
        alignItems: "center",
        border: "none",
        color: "white",
        cursor: "pointer",
        display: "inline-flex",
        fontSize: ".72rem",
        fontWeight: "bold",
        gap: ".35rem",
        justifyContent: "center",
        textDecoration: "none"
      }}
    >
      <strong>
        {multiplierLabel}
      </strong>
      <TypeBadgeImage
        alt={`${typeName} type`}
        height="1.4rem"
        type={type}
      />
    </Link>
  );
}

function MatchupGroup({
  headingId,
  title,
  matchups
}) {
  if (matchups.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={headingId}>
      <h3
        id={headingId}
        style={{
          marginBottom: ".65rem"
        }}
      >
        {title}
      </h3>

      <ul
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: ".5rem",
          justifyContent: "center",
          listStyle: "none",
          margin: 0,
          padding: 0
        }}
      >
        {matchups.map(
          matchup => (
            <li
              key={matchup.type}
            >
              <TypeBadge
                type={matchup.type}
                multiplier={
                  matchup.multiplier
                }
              />
            </li>
          )
        )}
      </ul>
    </section>
  );
}

function TypeEffectivenessCard({
  headingLevel = "h2",
  pokemonName,
  types
}) {
  const headingId = useId();
  const groupIdPrefix = useId();
  const HeadingTag =
    headingLevel === "h3" ? "h3" : "h2";
  const groups =
    getDefensiveMatchupGroups(types);
  const headingText = pokemonName
    ? `${pokemonName}'s Weaknesses and Resistances`
    : "Weaknesses and Resistances";

  return (
    <section
      aria-labelledby={headingId}
      style={{
        // border: "2px solid #555555",
        borderRadius: "12px",
        margin: "2rem auto",
        maxWidth: "900px",
        padding: "1rem",
        paddingTop:"0rem",
            //  backgroundColor: "#2c2c2c",
      }}
    >
      <HeadingTag id={headingId}>
        {headingText}
      </HeadingTag>

      <div
        style={{
          display: "grid",
          gap: ".1rem",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
       
      
        }}
      >
        <MatchupGroup
          headingId={`${groupIdPrefix}-weaknesses`}
          title="Weak To"
          matchups={groups.weaknesses}
        />

        <MatchupGroup
          headingId={`${groupIdPrefix}-resistances`}
          title="Resists"
          matchups={groups.resistances}
        />

        <MatchupGroup
          headingId={`${groupIdPrefix}-immunities`}
          title="Immune To"
          matchups={groups.immunities}
        />
      </div>
    </section>
  );
}

export default TypeEffectivenessCard;
