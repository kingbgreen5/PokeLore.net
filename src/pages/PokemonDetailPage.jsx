import {
  useParams
} from "react-router-dom";

import {
  useEffect,
  useState
} from "react";

import typeColors from "../constants/typeColors";
import MoveDetailPage from "./MoveDetailPage";
import LearnsetCard from "../components/LearnsetCard";





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

    const [learnsetData, setLearnsetData] =
  useState(null);

  // useEffect(() => {
  //   import(
  //     `../public/data/pokemonData${id}.json`
  //   ).then(data => {
  //     setPokemon(data.default);
  //   });
  // }, [id]);

  const [movesData, setMovesData] =
    useState({});
    const [selectedMove, setSelectedMove] =
  useState(null);



// useEffect(() => {
//   async function loadPokemon() {
//     try {
//       const response =
//         await fetch(
//           `/data/pokemonData/${id}.json`
//         );

//       const data =
//         await response.json();

//       setPokemon(data);
//     } catch (error) {
//       console.error(
//         "Failed to load Pokémon:",
//         error
//       );
//     }
//   }

//   loadPokemon();
// }, [id]);

useEffect(() => {
  async function loadPokemon() {
    try {

      //-----------------------------------------
      // Load Pokémon Metadata
      //-----------------------------------------

      const response =
        await fetch(
          `/data/pokemonData/${id}.json`
        );

      const data =
        await response.json();

      setPokemon(data);

      //-----------------------------------------
      // Load Learnsets
      //-----------------------------------------

      const learnsetResponse =
        await fetch(
          "/data/learnsets.json"
        );

      const learnsets =
        await learnsetResponse.json();

      const matchedLearnset =
        learnsets.find(
          entry =>
            entry.pokemon === data.name
        );

      setLearnsetData(
        matchedLearnset
      );


      const movesResponse =
        await fetch(
          "/data/moves.json"
        );

      const movesJson =
        await movesResponse.json();


      setMovesData(movesJson);




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


    <h2>Catch Rate</h2>
      <p>
        {pokemon.catchRate}
      </p>





{learnsetData && (
  <>
    <h2>Learnset</h2>

    <LearnsetCard
      pokemonData={learnsetData}
      movesData={movesData}
      setSelectedMove={
        setSelectedMove
      }
    />
  </>
)}

    </div>
  );
}

export default PokemonDetailPage;