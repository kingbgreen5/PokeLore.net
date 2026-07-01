import { useEffect, useState } from "react";
import MoveDetailPage from "./MoveDetailPage";
import LearnsetCard from "../components/LearnsetCard";
import { useMemo } from "react";
import Seo from "../seo/Seo";
import { learnsetsSeo } from "../seo/seoConfig";
import { loadMovesMap } from "../utils/loadMovesData";



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

      const learnsetsData =
        await learnsetsResponse.json();

      const movesJson =
        await loadMovesMap();

      setLearnsets(learnsetsData);
      setMovesData(movesJson);
    }

    loadData();
  }, []);


const filteredPokemon = useMemo(() => {
  if (search.trim() === "") {
    return [];
  }

  return learnsets
    .filter(pokemon =>
      pokemon.pokemon
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .slice(0, 20);

}, [search, learnsets]);






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
    <div style={{ padding: "1rem" }}>
      <Seo {...learnsetsSeo()} />

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
