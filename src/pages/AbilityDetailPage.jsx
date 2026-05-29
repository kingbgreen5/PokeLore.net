import {
  useParams
} from "react-router-dom";

import {
  useEffect,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

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

function AbilityDetailPage() {

  const navigate = useNavigate();

  const { abilityName } =
    useParams();

  const [ability, setAbility] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    async function loadAbility() {

      try {

        setLoading(true);

        const response =
          await fetch(
            "/data/abilities.json"
          );

        const data =
          await response.json();

        setAbility(
          data[abilityName]
        );

      } catch (error) {

        console.error(
          "Failed to load ability:",
          error
        );

      } finally {

        setLoading(false);

      }

    }

    loadAbility();

  }, [abilityName]);

  //-----------------------------------------
  // Loading
  //-----------------------------------------

  if (loading) {
    return <p>Loading...</p>;
  }

  //-----------------------------------------
  // Missing Ability
  //-----------------------------------------

  if (!ability) {
    return (
      <p>
        Ability not found.
      </p>
    );
  }

  //-----------------------------------------
  // Render
  //-----------------------------------------

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "900px",
        margin: "0 auto"
      }}
    >

      <h1>
        {capitalize(
          ability.name
        )}
      </h1>

      {/* In-Game Description */}

      <div
        style={{
          marginBottom: "2rem"
        }}
      >
        <h2>
          In-Game Description
        </h2>

        <p>
          {
            ability.shortEffect
          }
        </p>
      </div>

      {/* Detailed Effect */}

      <div
        style={{
          marginBottom: "2rem"
        }}
      >
        <h2>
          Detailed Effect
        </h2>

        <p>
          {ability.effect}
        </p>
      </div>

      {/* Generation */}

      <div
        style={{
          marginBottom: "2rem"
        }}
      >
        <h2>Generation</h2>

        <p>
          {capitalize(
            ability.generation
          )}
        </p>
      </div>

      {/* Pokémon */}

      <div>

        <h2>
          Pokémon With This
          Ability
        </h2>

<div
  style={{
    display: "flex",
    flexWrap: "wrap",
    gap: ".5rem"
  }}
>
  {ability.pokemon.map(
    pokemon => (

      <button
        key={pokemon}

        onClick={() =>
          navigate(
            `/pokemon/${pokemon}`
          )
        }

        style={{
          padding:
            ".35rem .75rem",

          border:
            "1px solid #888",

          borderRadius:
            "999px",

          cursor: "pointer"
        }}
      >
        {capitalize(
          pokemon
        )}
      </button>

    )
  )}
</div>

      </div>

    </div>
  );
}

export default AbilityDetailPage;