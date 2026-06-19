import {
  useEffect,
  useMemo,
  useState
} from "react";

import MoveSummaryCard from "../components/MoveSummaryCard";
import Seo from "../seo/Seo";
import { movesSeo } from "../seo/seoConfig";

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

function MovesPage() {

  const [moves, setMoves] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedType, setSelectedType] =
    useState("all");

const [selectedCategory, setSelectedCategory] =
  useState("all");

const [powerSortMode, setPowerSortMode] =
  useState("all");



  useEffect(() => {

    async function loadMoves() {

      try {

        const response =
          await fetch(
            "/data/moves.json"
          );

        const data =
          await response.json();

        setMoves(data);

      } catch (error) {

        console.error(
          "Failed to load moves:",
          error
        );

      } finally {

        setLoading(false);

      }

    }

    loadMoves();

  }, []);

  const allTypes = [
    "all",
    ...new Set(
      Object.values(moves).map(
        move => move.type
      )
    )
  ];

  const filteredMoves =
    useMemo(() => {

      return Object.entries(
        moves
      )
        .filter(
          ([name, move]) => {

            const matchesSearch =
              name.includes(
                searchTerm.toLowerCase()
              );

            const matchesType =
              selectedType === "all"
              ||
              move.type ===
                selectedType;

            const matchesCategory =
              selectedCategory === "all"
              ||
              move.category ===
                selectedCategory;

            return (
              matchesSearch &&
              matchesType &&
              matchesCategory
            );

          }
        )
        .sort(([, a], [, b]) => {
          if (powerSortMode === "high-low") {
            return (
              (b.power ?? -1) -
              (a.power ?? -1)
            );
          }

          if (powerSortMode === "low-high") {
            return (
              (a.power ?? Infinity) -
              (b.power ?? Infinity)
            );
          }

          return 0;
        });

    }, [
      moves,
      searchTerm,
      selectedType,
      selectedCategory,
      powerSortMode
    ]);

  if (loading) {
    return (
      <>
        <Seo {...movesSeo()} />
        <p>Loading...</p>
      </>
    );
  }

  return (
    <div
      style={{
        padding: "2rem"
      }}
    >
      <Seo {...movesSeo()} />

      <h1>
        Move Database
      </h1>

      <input
        type="text"
        placeholder="Search moves..."
        value={searchTerm}
        onChange={e =>
          setSearchTerm(
            e.target.value
          )
        }
        style={{
          backgroundColor: "#2c2c2c",
          border: "2px solid #555",
          borderRadius: "12px",
          boxSizing: "border-box",
          color: "white",
          fontSize: "1rem",
          marginBottom: "1rem",
          maxWidth: "420px",
          padding: ".8rem 1rem",
          width: "100%"
        }}
      />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          justifyContent: "center",
          marginBottom: "2rem"
        }}
      >
        <select
          value={selectedCategory}
          onChange={e =>
            setSelectedCategory(
              e.target.value
            )
          }
          style={{
            backgroundColor: "#2c2c2c",
            border: "2px solid #555",
            borderRadius: "12px",
            color: "white",
            fontSize: "1rem",
            padding: ".7rem 1rem"
          }}
        >
          <option value="all">
            All Categories
          </option>

          <option value="physical">
            Physical
          </option>

          <option value="special">
            Special
          </option>

          <option value="status">
            Status
          </option>
        </select>

        <select
          value={selectedType}
          onChange={e =>
            setSelectedType(
              e.target.value
            )
          }
          style={{
            backgroundColor: "#2c2c2c",
            border: "2px solid #555",
            borderRadius: "12px",
            color: "white",
            fontSize: "1rem",
            padding: ".7rem 1rem"
          }}
        >
          {allTypes.map(type => (
            <option
              key={type}
              value={type}
            >
              {capitalize(type)}
            </option>
          ))}
        </select>

        <select
          value={powerSortMode}
          onChange={e =>
            setPowerSortMode(
              e.target.value
            )
          }
          style={{
            backgroundColor: "#2c2c2c",
            border: "2px solid #555",
            borderRadius: "12px",
            color: "white",
            fontSize: "1rem",
            padding: ".7rem 1rem"
          }}
        >
          <option value="all">
            Default Order
          </option>

                    <option value="low-high">
            Power Descending
          </option>

          <option value="high-low">
            Power Ascending
          </option>




        </select>
      </div>

      <div
        style={{
          display: "grid",
          justifyItems: "center",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "1rem"
        }}
      >
        {filteredMoves.map(
          ([name, move]) => (

            <MoveSummaryCard
              key={name}
              name={name}
              move={move}
            />

          )
        )}
      </div>

    </div>
  );
}

export default MovesPage;
