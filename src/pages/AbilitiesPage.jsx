import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

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

function AbilitiesPage() {

  const navigate = useNavigate();

  const [abilities, setAbilities] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  const [searchTerm, setSearchTerm] =
    useState("");

  useEffect(() => {

    async function loadAbilities() {

      try {

        const response =
          await fetch(
            "/data/abilities.json"
          );

        const data =
          await response.json();

        setAbilities(data);

      } catch (error) {

        console.error(
          "Failed to load abilities:",
          error
        );

      } finally {

        setLoading(false);

      }

    }

    loadAbilities();

  }, []);

  const filteredAbilities =
    useMemo(() => {

      return Object.values(
        abilities
      ).filter(
        ability =>
          ability.name.includes(
            searchTerm.toLowerCase()
          )
      );

    }, [
      abilities,
      searchTerm
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
        Ability Database
      </h1>

      <input
        type="text"
        placeholder="Search abilities..."
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
          marginBottom: "2rem"
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1rem"
        }}
      >

        {filteredAbilities.map(
          ability => (

            <div
              key={ability.name}

              onClick={() =>
                navigate(
                  `/ability/${ability.name}`
                )
              }

              style={{
                border:
                  "1px solid #666",

                borderRadius:
                  "12px",

                padding: "1rem",

                cursor: "pointer"
              }}
            >

              <h2>
                <strong>
                {capitalize(
                  ability.name
                )}</strong>
              </h2>

              <p>
                {
                  ability.shortEffect
                }
              </p>

            </div>

          )
        )}

      </div>

    </div>
  );
}

export default AbilitiesPage;