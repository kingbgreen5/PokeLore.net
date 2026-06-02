import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

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

function MovesPage() {

  const navigate = useNavigate();

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

const [sortMode, setSortMode] =
  useState("name");



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

            return (
              matchesSearch &&
              matchesType
            );

          }
        );

    }, [
      moves,
      searchTerm,
      selectedType
    ]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div
      style={{
        padding: "2rem"
      }}
    >

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
          padding: ".5rem",
          width: "100%",
          maxWidth: "400px",
          marginBottom: "1rem"
        }}
      />

<select
  value={selectedCategory}
  onChange={e =>
    setSelectedCategory(
      e.target.value
    )
  }

        style={{
          padding: ".5rem",
          marginBottom: "2rem"
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
          padding: ".5rem",
          marginBottom: "2rem"
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill,minmax(200px,.75fr))",
          gap: "1rem"
        }}
      >
        {filteredMoves.map(
          ([name, move]) => (

            <div
              key={name}

              onClick={() =>
                navigate(
                  `/move/${name}`
                )
              }

              style={{
                border:
                  "1px solid #666",

                borderRadius:
                  "12px",

                padding: ".1rem",

                cursor: "pointer"
              }}
            >

              <h3>
                {capitalize(
                  name
                )}
              </h3>

              <span
                style={{
                  backgroundColor:
                    typeColors[
                      move.type
                    ],

                  color: "white",

                  padding:
                    ".25rem .75rem",

                  borderRadius:
                    "999px"
                }}
              >
                {move.type}
              </span>

              <div
                style={{
                  marginTop:
                    "1rem"
                }}
              >
                Power:
                {" "}
                {move.power ??
                  "-"}
              </div>

              <div>
                Accuracy:
                {" "}
                {move.accuracy ??
                  "-"}
              </div>

              <div>
                PP:
                {" "}
                {move.pp ??
                  "-"}
              </div>

            </div>

          )
        )}
      </div>

    </div>
  );
}

export default MovesPage;