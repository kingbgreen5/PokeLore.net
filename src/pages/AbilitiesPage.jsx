import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";
import usePersistedScroll from "../hooks/usePersistedScroll";
import useQueryParamState from "../hooks/useQueryParamState";
import Seo from "../seo/Seo";
import { abilitiesSeo } from "../seo/seoConfig";

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
    useQueryParamState(
      "search",
      ""
    );

  usePersistedScroll(
    undefined,
    !loading
  );

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
    return (
      <>
        <Seo {...abilitiesSeo()} />
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
      <Seo {...abilitiesSeo()} />

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
          backgroundColor: "#2c2c2c",
          border: "2px solid #555",
          borderRadius: "12px",
          boxSizing: "border-box",
          color: "white",
          fontSize: "1rem",
          marginBottom: "2rem",
          maxWidth: "420px",
          padding: ".8rem 1rem",
          width: "100%"
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
