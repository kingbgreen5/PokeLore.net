import {
  useParams
} from "react-router-dom";

import {
  useEffect,
  useState
} from "react";

import PokemonSummaryCard from "../components/PokemonSummaryCard";
import Seo from "../seo/Seo";
import { abilitySeo } from "../seo/seoConfig";

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

  const [
    pokemonWithAbility,
    setPokemonWithAbility
  ] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    let isActive = true;

    async function loadAbility() {

      try {

        setLoading(true);
        setAbility(null);
        setPokemonWithAbility([]);

        const [
          abilitiesResponse,
          pokemonRoutesResponse
        ] = await Promise.all([
          fetch(
            "/data/abilities.json"
          ),
          fetch(
            "/data/pokemonRoutes.json"
          )
        ]);

        const [
          abilitiesData,
          pokemonRoutes
        ] = await Promise.all([
          abilitiesResponse.json(),
          pokemonRoutesResponse.json()
        ]);

        const nextAbility =
          abilitiesData[
            abilityName
          ];

        if (!nextAbility) {
          if (isActive) {
            setAbility(null);
            setPokemonWithAbility([]);
          }

          return;
        }

        const pokemonDetails =
          await Promise.all(
            (nextAbility.pokemon ?? [])
              .map(async pokemonName => {
                const pokemonId =
                  pokemonRoutes.byName?.[
                    pokemonName
                  ];

                if (!pokemonId) {
                  return null;
                }

                const pokemonResponse =
                  await fetch(
                    `/data/pokemonData/${pokemonId}.json`
                  );

                if (!pokemonResponse.ok) {
                  return null;
                }

                return pokemonResponse.json();
              })
          );

        if (isActive) {
          setAbility(nextAbility);
          setPokemonWithAbility(
            pokemonDetails.filter(Boolean)
          );
        }

      } catch (error) {

        console.error(
          "Failed to load ability:",
          error
        );

      } finally {

        if (isActive) {
          setLoading(false);
        }

      }

    }

    loadAbility();

    return () => {
      isActive = false;
    };

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
      <Seo {...abilitySeo(ability.name)} />

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

        <p
        style={{
          textTransform:"uppercase"
        }
        }>
        
            {ability.generation}
    
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
      "repeat(auto-fit, minmax(140px, 1fr))",
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
