import { useEffect, useState } from "react";
import MoveDetailPage from "./MoveDetailPage";
import LearnsetCard from "../components/LearnsetCard";




function LearnsetsPage() {
  const [learnsets, setLearnsets] =
    useState([]);

  const [movesData, setMovesData] =
    useState({});

  const [search, setSearch] =
    useState("");

    const [selectedMove, setSelectedMove] =
  useState(null);

  useEffect(() => {
    async function loadData() {
      const learnsetsResponse =
        await fetch(
          "/data/learnsets.json"
        );

      const movesResponse =
        await fetch(
          "/data/moves.json"
        );

      const learnsetsData =
        await learnsetsResponse.json();

      const movesJson =
        await movesResponse.json();

      setLearnsets(learnsetsData);
      setMovesData(movesJson);
    }

    loadData();
  }, []);

  const filteredPokemon =
    learnsets.filter(pokemon =>
      pokemon.pokemon
        .toLowerCase()
        .includes(search.toLowerCase())
    );


if (selectedMove) {
  return (
    <MoveDetailPage
      moveName={selectedMove}
      movesData={movesData}
      learnsets={learnsets}
      setSelectedMove={setSelectedMove}
    />
  );
}




  return (
    <div style={{ padding: "2rem" }}>
      <h5>Consolidated Learnsets from every generation</h5>

      <input
        type="text"
        placeholder="Search Pokémon..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        style={{
          width: "90%",
          padding: "1rem",
          marginBottom: "2rem",
          fontSize: "1rem"
        }}
      />

      {filteredPokemon.map(pokemon => (
        <LearnsetCard
          key={pokemon.pokemon}
          pokemonData={pokemon}
          movesData={movesData}
          setSelectedMove={setSelectedMove}
        />
      ))}
    </div>
  );
}

export default LearnsetsPage;