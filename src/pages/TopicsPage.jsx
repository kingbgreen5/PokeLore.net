import {
  useEffect,
  useMemo,
  useState
} from "react";
import { Link } from "react-router-dom";
import Seo from "../seo/Seo";
import { topicsSeo } from "../seo/seoConfig";
import { staticTopics } from "../topics/topicRegistry";

const subgroupLabels = {
  biomes: "Biomes",
  "item-locations": "Item Locations",
  behavior: "Behavior",
  lore: "Lore"
};

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

        setTopics([
          ...staticTopics.filter(
            topic => topic.active
          ),
          ...(data.topics ?? []).filter(
            topic => topic.active
          )
        ]);
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

  const groupedTopics = useMemo(() => {
    return topics.reduce(
      (groups, topic) => {
        const subgroup =
          topic.subgroup ?? "other";

        return {
          ...groups,
          [subgroup]: [
            ...(groups[subgroup] ?? []),
            topic
          ]
        };
      },
      {}
    );
  }, [topics]);

  const subgroupOrder = [
    "item-locations",
    "biomes",
    "behavior",
    "lore",
    "other"
  ];

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

      <h1>Pokémon Topics</h1>

      <p
        style={{
          margin: "0 auto 2rem",
          maxWidth: "760px"
        }}
      >
        Browse curated topic pages and guides,
        including item locations, Pokémon
        habitats, behavior, and official
        Pokédex lore excerpts.
      </p>

      {topics.length === 0 ? (
        <p>No active topics yet.</p>
      ) : (
        subgroupOrder
          .filter(
            subgroup =>
              groupedTopics[subgroup]?.length >
              0
          )
          .map(subgroup => (
            <section
              key={subgroup}
              style={{
                marginBottom: "2rem"
              }}
            >
              <h2>{subgroupLabels[subgroup] ?? subgroup}</h2>

              <div
                style={{
                  display: "grid",
                  gap: "1rem",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))"
                }}
              >
                {groupedTopics[subgroup].map(
                  topic => (
                    <Link
                      key={topic.slug}
                      to={`/topic/${topic.slug}`}
                      style={{
                        backgroundColor:
                          "#2c2c2c",
                        border:
                          "2px solid #555",
                        borderRadius:
                          "12px",
                        color: "inherit",
                        display: "grid",
                        gap: ".5rem",
                        padding: "1rem",
                        textAlign: "left",
                        textDecoration: "none"
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "1.05rem",
                          margin: 0
                        }}
                      >
                        {topic.title}
                      </h3>

                      <p
                        style={{
                          lineHeight: 1.4,
                          margin: 0,
                          opacity: 0.85
                        }}
                      >
                        {
                          topic.shortDescription
                        }
                      </p>

                      <p
                        style={{
                          fontSize: ".85rem",
                          fontWeight: "bold",
                          margin: 0
                        }}
                      >
                        {topic.countLabel ??
                          `${topic.pokemonCount} Pokemon · ${topic.entryCount} entries`}
                      </p>
                    </Link>
                  )
                )}
              </div>
            </section>
          ))
      )}
    </main>
  );
}

export default TopicsPage;
