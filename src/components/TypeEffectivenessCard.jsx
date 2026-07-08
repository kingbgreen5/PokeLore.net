import { Link } from "react-router-dom";
import typeColors from "../constants/typeColors";
import typeChart from "../constants/Types";
import TypeBadgeImage from "./TypeBadge";



const allTypes = Object.keys(typeColors);

function getDefensiveMatchups(types) {
  return allTypes
    .map(attackType => {
      const multiplier = types.reduce(
        (total, defenseType) =>
          total *
          (typeChart[attackType]?.[
            defenseType
          ] ?? 1),
        1
      );

      return {
        type: attackType,
        multiplier
      };
    })
    .filter(
      matchup =>
        matchup.multiplier !== 1
    )
    .sort(
      (a, b) =>
        b.multiplier - a.multiplier ||
        a.type.localeCompare(b.type)
    );
}

function TypeBadge({
  type,
  multiplier
}) {
  return (
    <Link
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
        textDecoration: "none"
      }}
    >
      <TypeBadgeImage
        height="1.4rem"
        type={type}
      />
      <strong>
        {multiplier}x
      </strong>
    </Link>
  );
}

function MatchupGroup({
  title,
  matchups
}) {
  if (matchups.length === 0) {
    return null;
  }

  return (
    <section>
      <h3
        style={{
          marginBottom: ".65rem"
        }}
      >
        {title}
      </h3>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: ".5rem",
          justifyContent: "center"
        }}
      >
        {matchups.map(
          matchup => (
            <TypeBadge
              key={matchup.type}
              type={matchup.type}
              multiplier={
                matchup.multiplier
              }
            />
          )
        )}
      </div>
    </section>
  );
}

function TypeEffectivenessCard({
  types
}) {
  const matchups =
    getDefensiveMatchups(types);

  const doubleWeaknesses =
    matchups.filter(
      matchup =>
        matchup.multiplier === 4
    );

  const weaknesses =
    matchups.filter(
      matchup =>
        matchup.multiplier === 2
    );

  const resistances =
    matchups.filter(
      matchup =>
        matchup.multiplier === 0.5
    );

  const doubleResistances =
    matchups.filter(
      matchup =>
        matchup.multiplier === 0.25
    );

  const immunities =
    matchups.filter(
      matchup =>
        matchup.multiplier === 0
    );

  return (
    <div
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
      {/* <h2>
        Type Effectiveness
      </h2> */}

      <div
        style={{
          display: "grid",
          gap: ".1rem",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
       
      
        }}
      >
        <MatchupGroup
          title="Weak To"
          matchups={[
            ...doubleWeaknesses,
            ...weaknesses
          ]}
        />

        <MatchupGroup
          title="Resists"
          matchups={[
            ...doubleResistances,
            ...resistances
          ]}
        />

        <MatchupGroup
          title="Immune To"
          matchups={immunities}
        />
      </div>
    </div>
  );
}

export default TypeEffectivenessCard;
