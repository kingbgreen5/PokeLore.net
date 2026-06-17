
import { useMemo, useState, useEffect } from "react";
import PokemonSummaryCard from "../components/PokemonSummaryCard";
import typeColors from "../constants/typeColors";

function HomePage() {
  //-----------------------------------------
  // State
  //-----------------------------------------

  const [loading, setLoading] =
    useState(true);

  const [pokemonIndex, setPokemonIndex] =
    useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedType, setSelectedType] =
    useState("all");

  const [sortMode, setSortMode] =
    useState("dex-asc");

  //-----------------------------------------
  // Load Pokémon Index
  //-----------------------------------------

  useEffect(() => {
    async function loadPokemon() {
      try {
        const response =
          await fetch(
            "/data/pokemonIndex.json"
          );

        const data =
          await response.json();

        setPokemonIndex(data);
      } catch (error) {
        console.error(
          "Failed to load Pokémon index:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadPokemon();
  }, []);

  //-----------------------------------------
  // All Available Types
  //-----------------------------------------

  const allTypes = [
    "all",
    ...new Set(
      pokemonIndex.flatMap(
        pokemon => pokemon.types
      )
    )
  ];

  //-----------------------------------------
  // Filtered Pokémon
  //-----------------------------------------

  const filteredPokemon = useMemo(() => {
    let filtered = [...pokemonIndex];

    //-----------------------------------------
    // Search Filter
    //-----------------------------------------

    if (searchTerm.trim()) {
      const term =
        searchTerm.toLowerCase();

      filtered = filtered.filter(
        pokemon =>
          pokemon.name.includes(term) ||
          pokemon.id
            .toString()
            .includes(term)
      );
    }

    //-----------------------------------------
    // Type Filter
    //-----------------------------------------

    if (selectedType !== "all") {
      filtered = filtered.filter(
        pokemon =>
          pokemon.types.includes(
            selectedType
          )
      );
    }

    //-----------------------------------------
    // Sorting
    //-----------------------------------------

    switch (sortMode) {
      case "dex-desc":
        filtered.sort(
          (a, b) => b.id - a.id
        );
        break;

      case "name-asc":
        filtered.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        break;

      case "name-desc":
        filtered.sort((a, b) =>
          b.name.localeCompare(a.name)
        );
        break;

      default:
        filtered.sort(
          (a, b) => a.id - b.id
        );
    }

    return filtered;
  }, [
    pokemonIndex,
    searchTerm,
    selectedType,
    sortMode
  ]);

  //-----------------------------------------
  // Loading Screen
  //-----------------------------------------

  if (loading) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center"
        }}
      >
        Booting up Pokédex...
      </div>
    );
  }


  //-----------------------------------------
  // Render
  //-----------------------------------------

  return (
    <div
      style={{
        padding: "1.5rem",
        maxWidth: "1800px",
        margin: "0 auto"
      }}
    >
      {/* Hero Section */}

      <div
        style={{
          marginBottom: "2rem",
          textAlign: "center"
        }}
      >
        {/* <h3
          style={{
            // fontSize: "2.5rem",
            // marginBottom: ".5rem"
          }}
        >
          Pokédex
        </h3> */}

        <p
          style={{
            opacity: 0.8,
            maxWidth: "700px",
            margin: "0 auto"
          }}
        >
          Browse Pokémon by National
          Dex number, search by
          name, filter by type, and
          explore detailed Pokémon
          data.
        </p>
      </div>

      {/* Controls */}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2rem",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {/* Search */}

        <input
          type="text"
          placeholder="Search Pokémon name or dex number"
          value={searchTerm}
          onChange={e =>
            setSearchTerm(
              e.target.value
            )
          }
          style={{
            padding: ".8rem 1rem",
            borderRadius: "12px",
            border:
              "2px solid #555",
            minWidth: "320px",
            fontSize: "1rem"
          }}
        />

        {/* Type Filter */}

        <select
          value={selectedType}
          onChange={e =>
            setSelectedType(
              e.target.value
            )
          }
          style={{
            padding: ".8rem 1rem",
            borderRadius: "12px",
            border:
              "2px solid #555",
            fontSize: "1rem",
            backgroundColor:
              selectedType === "all"
                ? "#2c2c2c"
                : typeColors[
                    selectedType
                  ],
            color: "white"
          }}
        >
          {allTypes.map(type => (
            <option
              key={type}
              value={type}
            >
              {type === "all"
                ? "All Types"
                : type
                    .charAt(0)
                    .toUpperCase() +
                  type.slice(1)}
            </option>
          ))}
        </select>

        {/* Sorting */}

        <select
          value={sortMode}
          onChange={e =>
            setSortMode(
              e.target.value
            )
          }
          style={{
            padding: ".8rem 1rem",
            borderRadius: "12px",
            border:
              "2px solid #555",
            fontSize: "1rem"
          }}
        >
          <option value="dex-asc">
            Dex Number ↑
          </option>

          <option value="dex-desc">
            Dex Number ↓
          </option>

          <option value="name-asc">
            Name A-Z
          </option>

          <option value="name-desc">
            Name Z-A
          </option>
        </select>
      </div>

      {/* Results Count */}

      <div
        style={{
          marginBottom: "1.5rem",
          opacity: 0.8,
          textAlign: "center"
        }}
      >
        Showing {filteredPokemon.length}{" "}
        Pokémon
      </div>

      {/* Pokémon Grid */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1rem"
        }}
      >
        {filteredPokemon.map(
          pokemon => (
            <PokemonSummaryCard
              key={pokemon.id}
              pokemon={pokemon}
            />
          )
        )}
      </div>
    </div>
  );
}

export default HomePage;
