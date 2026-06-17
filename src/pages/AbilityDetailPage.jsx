import {
  useParams
} from "react-router-dom";

import {
  useEffect,
  useMemo,
  useState
} from "react";

import PokemonSummaryCard from "../components/PokemonSummaryCard";

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

  const { abilityName } =
    useParams();

  const [ability, setAbility] =
    useState(null);

  const [pokemonIndex, setPokemonIndex] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    async function loadAbility() {

      try {

        setLoading(true);

        const [
          abilitiesResponse,
          pokemonIndexResponse
        ] = await Promise.all([
          fetch(
            "/data/abilities.json"
          ),
          fetch(
            "/data/pokemonIndex.json"
          )
        ]);

        const [
          abilitiesData,
          pokemonIndexData
        ] = await Promise.all([
          abilitiesResponse.json(),
          pokemonIndexResponse.json()
        ]);

        setAbility(
          abilitiesData[
            abilityName
          ]
        );

        setPokemonIndex(
          pokemonIndexData
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

  const pokemonByName = useMemo(
    () =>
      new Map(
        pokemonIndex.map(
          pokemon => [
            pokemon.name,
            pokemon
          ]
        )
      ),
    [pokemonIndex]
  );

  const pokemonWithAbility = useMemo(
    () =>
      ability?.pokemon
        .map(pokemon =>
          pokemonByName.get(
            pokemon
          )
        )
        .filter(Boolean) ?? [],
    [ability, pokemonByName]
  );

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
    display: "grid",
    gap: "1rem",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(150px, 1fr))",
    marginTop: "1rem"
  }}
>
  {pokemonWithAbility.map(
    pokemon => (
      <PokemonSummaryCard
        key={pokemon.id}
        pokemon={pokemon}
        compact={true}
      />
    )
  )}
</div>

      </div>

    </div>
  );
}

export default AbilityDetailPage;
