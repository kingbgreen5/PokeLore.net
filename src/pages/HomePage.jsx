
import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useSearchParams }
from "react-router-dom";
import LatestNews from "../components/news/LatestNews";
import PokemonSummaryCard from "../components/PokemonSummaryCard";
import typeColors from "../constants/typeColors";
import usePersistedScroll from "../hooks/usePersistedScroll";
import useQueryParamState from "../hooks/useQueryParamState";
import Seo from "../seo/Seo";
import { homeSeo } from "../seo/seoConfig";

const POKEMON_PAGE_SIZE = 150;

function HomePage() {
  const gridRef = useRef(null);
  const [, setHomeSearchParams] =
    useSearchParams();

  //-----------------------------------------
  // State
  //-----------------------------------------

  const [loading, setLoading] =
    useState(true);

  const [pokemonIndex, setPokemonIndex] =
    useState([]);

  const [isDesktopGrid, setIsDesktopGrid] =
    useState(false);

  const [searchTerm] =
    useQueryParamState(
      "search",
      ""
    );

  const [selectedType] =
    useQueryParamState(
      "type",
      "all"
    );

  const [sortMode] =
    useQueryParamState(
      "sort",
      "dex-asc"
    );

  const [pageParam, setPageParam] =
    useQueryParamState(
      "page",
      "1"
    );

  usePersistedScroll(
    undefined,
    !loading
  );

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

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(min-width: 768px)"
    );

    function updateGridSize() {
      setIsDesktopGrid(
        mediaQuery.matches
      );
    }

    updateGridSize();
    mediaQuery.addEventListener(
      "change",
      updateGridSize
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        updateGridSize
      );
    };
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

  const requestedPage =
    Number.parseInt(pageParam, 10);
  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredPokemon.length /
        POKEMON_PAGE_SIZE
    )
  );
  const currentPage = Math.min(
    Number.isInteger(requestedPage) &&
      requestedPage > 0
      ? requestedPage
      : 1,
    totalPages
  );
  const pageStart =
    (currentPage - 1) *
    POKEMON_PAGE_SIZE;
  const visiblePokemon = useMemo(
    () =>
      filteredPokemon.slice(
        pageStart,
        pageStart + POKEMON_PAGE_SIZE
      ),
    [
      filteredPokemon,
      pageStart
    ]
  );

  function changePage(nextPage) {
    setPageParam(String(nextPage));
    requestAnimationFrame(() => {
      gridRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }

  function changeFilter(
    paramName,
    value,
    defaultValue
  ) {
    setHomeSearchParams(
      currentParams => {
        const params =
          new URLSearchParams(
            currentParams
          );

        if (value === defaultValue) {
          params.delete(paramName);
        } else {
          params.set(paramName, value);
        }

        params.delete("page");
        return params;
      },
      { replace: true }
    );
  }

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
        <Seo {...homeSeo()} />
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
        // padding: "1.5rem",
        maxWidth: "1800px",
        margin: "0 auto",
        width: "100%"
      }}
    >
      <Seo {...homeSeo()} />

      <LatestNews limit={4} />

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

        {/* <p
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
        </p> */}
      </div>

      {/* Controls */}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: ".5rem",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {/* Search */}

{/* -----------------------------------------Commenting this out for now to test functionality */}

        {/* <input
          type="text"
          placeholder="Search Pokémon name or dex number"
          value={searchTerm}
          onChange={e =>
            setSearchTerm(
              e.target.value
            )
          }
          style={{
            backgroundColor: "#2c2c2c",
            boxSizing: "border-box",
            color: "white",
            padding: ".8rem 1rem",
            borderRadius: "12px",
            border:
              "2px solid #555",
            maxWidth: "420px",
            width: "100%",
            fontSize: "1rem"
          }}
        /> */}




        {/* Type Filter */}

        <select
          value={selectedType}
          onChange={e =>
            changeFilter(
              "type",
              e.target.value,
              "all"
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
            changeFilter(
              "sort",
              e.target.value,
              "dex-asc"
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
          marginBottom: ".5rem",
          opacity: 0.8,
          textAlign: "center"
        }}
      >
        Showing{" "}
        {filteredPokemon.length === 0
          ? 0
          : pageStart + 1}
        -
        {pageStart +
          visiblePokemon.length}{" "}
        of {filteredPokemon.length}{" "}
        Pokémon
      </div>

      {/* Pokémon Grid */}

      <div
        ref={gridRef}
        style={{
          boxSizing: "border-box",
          display: "grid",
          gridTemplateColumns:
            isDesktopGrid
              ? "repeat(auto-fill, minmax(240px, 320px))"
              : "repeat(auto-fill, minmax(140px, 140px))",
          gap: "1rem",
          justifyContent: "center",
          width: "100%"
        }}
      >
        {visiblePokemon.map(
          pokemon => (
            <PokemonSummaryCard
              key={pokemon.id}
              pokemon={pokemon}
              compact={!isDesktopGrid}
            />
          )
        )}
      </div>

      {totalPages > 1 && (
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            margin: "2rem 0"
          }}
        >
          <button
            disabled={currentPage === 1}
            onClick={() =>
              changePage(currentPage - 1)
            }
            style={{
              border: "1px solid #666",
              borderRadius: "6px",
              cursor:
                currentPage === 1
                  ? "default"
                  : "pointer",
              opacity:
                currentPage === 1
                  ? 0.45
                  : 1,
              padding: ".55rem .85rem"
            }}
            type="button"
          >
            Previous
          </button>

          <span>
            Page {currentPage} of{" "}
            {totalPages}
          </span>

          <button
            disabled={
              currentPage === totalPages
            }
            onClick={() =>
              changePage(currentPage + 1)
            }
            style={{
              border: "1px solid #666",
              borderRadius: "6px",
              cursor:
                currentPage === totalPages
                  ? "default"
                  : "pointer",
              opacity:
                currentPage === totalPages
                  ? 0.45
                  : 1,
              padding: ".55rem .85rem"
            }}
            type="button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default HomePage;
