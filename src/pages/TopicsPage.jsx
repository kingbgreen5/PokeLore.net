import {
  useEffect,
  useState
} from "react";
import { Link } from "react-router-dom";
import Seo from "../seo/Seo";
import { topicsSeo } from "../seo/seoConfig";

function TopicsPage() {
  const [topics, setTopics] =
    useState([]);
  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadTopics() {
      try {
        const response = await fetch(
          "/data/pokedexTopics.json"
        );
        const data =
          await response.json();

        setTopics(data.topics ?? []);
      } catch (error) {
        console.error(
          "Failed to load Pokedex topics:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadTopics();
  }, []);

  if (loading) {
    return (
      <>
        <Seo {...topicsSeo()} />
        <p>Loading topics...</p>
      </>
    );
  }

  return (
    <main
      style={{
        padding: "2rem"
      }}
    >
      <Seo {...topicsSeo()} />

      <h1>Pokédex Lore Topics</h1>

      <p
        style={{
          margin: "0 auto 2rem",
          maxWidth: "760px"
        }}
      >
        Browse curated topic pages built from
        official Pokédex entry text. Each topic
        links to matching Pokémon and the exact
        entry excerpts that caused the match.
      </p>

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))"
        }}
      >
        {topics.map(topic => (
          <Link
            key={topic.slug}
            to={`/topic/${topic.slug}`}
            style={{
              backgroundColor: "#2c2c2c",
              border: "2px solid #555",
              borderRadius: "12px",
              color: "inherit",
              display: "grid",
              gap: ".5rem",
              padding: "1rem",
              textAlign: "left",
              textDecoration: "none"
            }}
          >
            <h2
              style={{
                fontSize: "1.05rem",
                margin: 0
              }}
            >
              {topic.title}
            </h2>

            <p
              style={{
                lineHeight: 1.4,
                margin: 0,
                opacity: 0.85
              }}
            >
              {topic.shortDescription}
            </p>

            <p
              style={{
                fontSize: ".85rem",
                fontWeight: "bold",
                margin: 0
              }}
            >
              {topic.pokemonCount} Pokemon ·{" "}
              {topic.entryCount} entries
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}

export default TopicsPage;
