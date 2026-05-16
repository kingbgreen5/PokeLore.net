import {
  useParams
} from "react-router-dom";

import {
  useEffect,
  useState
} from "react";

import typeColors from "../constants/typeColors";

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

function PokemonDetailPage() {
  const { id } = useParams();

  const [pokemon, setPokemon] =
    useState(null);

  // useEffect(() => {
  //   import(
  //     `../public/data/pokemonData${id}.json`
  //   ).then(data => {
  //     setPokemon(data.default);
  //   });
  // }, [id]);




useEffect(() => {
  async function loadPokemon() {
    try {
      const response =
        await fetch(
          `/data/pokemonData/${id}.json`
        );

      const data =
        await response.json();

      setPokemon(data);
    } catch (error) {
      console.error(
        "Failed to load Pokémon:",
        error
      );
    }
  }

  loadPokemon();
}, [id]);






  if (!pokemon) {
    return <p>Loading...</p>;
  }

  return (
    <div
      style={{
        padding: "2rem"
      }}
    >
      <h1>
        #{pokemon.id}{" "}
        {capitalize(
          pokemon.name
        )}
      </h1>

      <img
        src={pokemon.sprite}
        alt={pokemon.name}
        style={{
          width: "250px"
        }}
      />

      {/* Types */}

      <div
        style={{
          display: "flex",
          gap: ".5rem",
          marginBottom: "1rem"
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
                  ".4rem .9rem",
                borderRadius:
                  "999px"
              }}
            >
              {type}
            </span>
          )
        )}
      </div>

      {/* Abilities */}

      <h2>Abilities</h2>

      <ul>
        {pokemon.abilities.map(
          ability => (
            <li key={ability}>
              {capitalize(
                ability
              )}
            </li>
          )
        )}
      </ul>

      {/* Catch Rate */}

      <h2>Catch Rate</h2>

      <p>
        {pokemon.catchRate}
      </p>

      {/* Stats */}

      <h2>Base Stats</h2>

      {Object.entries(
        pokemon.stats
      ).map(([stat, value]) => (
        <div key={stat}>
          {capitalize(stat)}:{" "}
          {value}
        </div>
      ))}
    </div>
  );
}

export default PokemonDetailPage;