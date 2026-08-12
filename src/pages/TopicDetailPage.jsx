import {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  Link,
  useLocation,
  useParams
} from "react-router-dom";
import TypeBadge from "../components/TypeBadge";
import TopicArticlePage from "../components/topics/TopicArticlePage";
import { getArticleContentType } from "../utils/articleSchema";
import Seo from "../seo/Seo";
import { topicSeo } from "../seo/seoConfig";
import { formatPokemonDisplayName }
from "../utils/pokemonNames";
import { getPokemonUrl }
from "../utils/pokemonUrls";
import { itemLocationTopicComponents } from "../topics/topicRegistry";

const REVIEW_STORAGE_PREFIX =
  "pokedex-topic-review:";

function capitalize(text) {
  return String(text)
    .split("-")
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function formatVersions(versions = []) {
  return versions
    .map(capitalize)
    .join(", ");
}

function readStoredRemovals(topicSlug) {
  try {
    return JSON.parse(
      localStorage.getItem(
        `${REVIEW_STORAGE_PREFIX}${topicSlug}`
      ) ?? "[]"
    );
  } catch {
    return [];
  }
}

function readAllStoredRemovals() {
  const excludedPokemonByTopic = {};

  for (
    let index = 0;
    index < localStorage.length;
    index += 1
  ) {
    const key = localStorage.key(index);

    if (
      !key?.startsWith(
        REVIEW_STORAGE_PREFIX
      )
    ) {
      continue;
    }

    const topicSlug = key.slice(
      REVIEW_STORAGE_PREFIX.length
    );
    const ids = readStoredRemovals(
      topicSlug
    );

    if (ids.length > 0) {
      excludedPokemonByTopic[topicSlug] =
        ids;
    }
  }

  return {
    excludedPokemonByTopic
  };
}

function PokedexTopicDetailPage() {
  const { topicSlug } = useParams();
  const location = useLocation();
  const reviewMode =
    new URLSearchParams(
      location.search
    ).get("review") === "1";
  const [topic, setTopic] =
    useState(null);
  const [loading, setLoading] =
    useState(true);
  const [notFound, setNotFound] =
    useState(false);
  const [
    approvedRemovalIds,
    setApprovedRemovalIds
  ] = useState(new Set());
  const [
    pendingRemovalIds,
    setPendingRemovalIds
  ] = useState(new Set());
  const [
    curationPreview,
    setCurationPreview
  ] = useState("");

  useEffect(() => {
    async function loadTopic() {
      try {
        setLoading(true);
        setNotFound(false);

        const response = await fetch(
          "/data/pokedexTopics.json"
        );
        const data =
          await response.json();
        const matchingTopic =
          data.topics?.find(
            currentTopic =>
              currentTopic.slug === topicSlug
          );

        if (
          !matchingTopic ||
          (!matchingTopic.active &&
            !reviewMode)
        ) {
          setNotFound(true);
          setTopic(null);
          return;
        }

        setTopic(matchingTopic);
        const storedRemovals =
          readStoredRemovals(topicSlug);
        const storedSet =
          new Set(storedRemovals);

        setApprovedRemovalIds(storedSet);
        setPendingRemovalIds(storedSet);
        setCurationPreview("");
      } catch (error) {
        console.error(
          "Failed to load Pokedex topic:",
          error
        );
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadTopic();
  }, [reviewMode, topicSlug]);

  const visibleResults = useMemo(
    () =>
      topic?.results.filter(
        result =>
          !approvedRemovalIds.has(
            result.pokemon.id
          )
      ) ?? [],
    [approvedRemovalIds, topic]
  );

  const visibleEntryCount = useMemo(
    () =>
      visibleResults.reduce(
        (total, result) =>
          total + result.entries.length,
        0
      ),
    [visibleResults]
  );

  function togglePendingRemoval(pokemonId) {
    setPendingRemovalIds(currentIds => {
      const nextIds =
        new Set(currentIds);

      if (nextIds.has(pokemonId)) {
        nextIds.delete(pokemonId);
      } else {
        nextIds.add(pokemonId);
      }

      return nextIds;
    });
  }

  function approveReviewChanges() {
    const sortedIds =
      [...pendingRemovalIds].sort(
        (a, b) => a - b
      );

    localStorage.setItem(
      `${REVIEW_STORAGE_PREFIX}${topic.slug}`,
      JSON.stringify(sortedIds)
    );

    setApprovedRemovalIds(
      new Set(sortedIds)
    );
    setCurationPreview(
      JSON.stringify(
        readAllStoredRemovals(),
        null,
        2
      )
    );
  }

  function clearReviewChanges() {
    localStorage.removeItem(
      `${REVIEW_STORAGE_PREFIX}${topic.slug}`
    );
    setApprovedRemovalIds(new Set());
    setPendingRemovalIds(new Set());
    setCurationPreview(
      JSON.stringify(
        readAllStoredRemovals(),
        null,
        2
      )
    );
  }

  if (loading) {
    return <p>Loading topic...</p>;
  }

  if (notFound || !topic) {
    return (
      <main
        style={{
          padding: "2rem"
        }}
      >
        <h1>Topic not found</h1>
        <Link to="/topics">
          Back to Pokedex topics
        </Link>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: "2rem"
      }}
    >
      <Seo {...topicSeo(topic)} />

      <Link
        to="/topics"
        style={{
          color: "inherit"
        }}
      >
        Back to topics
      </Link>

      <h1>{topic.title}</h1>

      <p
        style={{
          margin: "0 auto 1rem",
          maxWidth: "780px"
        }}
      >
        {topic.introText}
      </p>

      <p
        style={{
          fontWeight: "bold",
          marginBottom: "2rem"
        }}
      >
        {visibleResults.length} Pokémon ·{" "}
        {visibleEntryCount} matching entries
      </p>

      {reviewMode && (
        <section
          style={{
            backgroundColor: "#202020",
            border: "1px solid #555",
            borderRadius: "12px",
            marginBottom: "1rem",
            padding: "1rem",
            textAlign: "left"
          }}
        >
          <h2
            style={{
              marginTop: 0
            }}
          >
            Topic Review Mode
          </h2>

          <p>
            Check Pokémon that should be removed
            from this topic, then approve changes
            at the bottom. Approved removals are
            stored locally in this browser.
          </p>
        </section>
      )}

      {visibleResults.length === 0 ? (
        <p>
          No Pokémon currently match this topic.
        </p>
      ) : (
        <div
          style={{
            columnGap: "1rem",
            columnWidth: "260px"
          }}
        >
          {visibleResults.map(result => (
            <article
              key={result.pokemon.id}
              style={{
                backgroundColor: "#2c2c2c",
                border: "2px solid #555",
                borderRadius: "12px",
                breakInside: "avoid",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                marginBottom: "1rem",
                padding: "1rem"
              }}
            >
              {reviewMode && (
                <label
                  style={{
                    alignItems: "center",
                    display: "flex",
                    gap: ".45rem",
                    justifySelf: "start"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={pendingRemovalIds.has(
                      result.pokemon.id
                    )}
                    onChange={() =>
                      togglePendingRemoval(
                        result.pokemon.id
                      )
                    }
                  />
                  Remove{" "}
                  {formatPokemonDisplayName(
                    result.pokemon
                  )}{" "}
                  from this topic
                </label>
              )}

              <Link
                to={getPokemonUrl(result.pokemon) ?? "#"}
                style={{
                  alignItems: "center",
                  color: "inherit",
                  display: "grid",
                  justifyItems: "center",
                  textDecoration: "none"
                }}
              >
                <span
                  style={{
                    justifySelf: "start",
                    opacity: 0.65
                  }}
                >
                  #
                  {String(
                    result.pokemon.id
                  ).padStart(4, "0")}
                </span>

                <img
                  src={result.pokemon.sprite}
                  alt={formatPokemonDisplayName(
                    result.pokemon
                  )}
                  loading="lazy"
                  style={{
                    height: "96px",
                    objectFit: "contain",
                    width: "96px"
                  }}
                />

                <strong
                  style={{
                    textAlign: "center"
                  }}
                >
                  {formatPokemonDisplayName(
                    result.pokemon
                  )}
                </strong>
              </Link>

              <div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: ".35rem",
                    justifyContent:
                      "center",
                    marginBottom: ".75rem"
                  }}
                >
                  {result.pokemon.types.map(type => (
                    <Link
                      key={type}
                      to={`/type/${type}`}
                      style={{
                        display: "inline-flex",
                        textDecoration: "none",
                      }}
                    >
                      <TypeBadge
                        height="1.35rem"
                        type={type}
                      />
                    </Link>
                  ))}
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: ".75rem"
                  }}
                >
                  {result.habitatMatches
                    ?.length > 0 && (
                    <section
                      style={{
                        borderLeft:
                          "3px solid #7ac97a",
                        paddingLeft: ".75rem"
                      }}
                    >
                      <p
                        style={{
                          lineHeight: 1.5,
                          margin:
                            "0 0 .35rem"
                        }}
                      >
                        Habitat:{" "}
                        {result.habitatMatches
                          .map(
                            habitat =>
                              habitat.displayName
                          )
                          .join(", ")}
                      </p>
                    </section>
                  )}

                  {result.curatedMatches
                    ?.length > 0 && (
                    <section
                      style={{
                        borderLeft:
                          "3px solid #8ca0ff",
                        paddingLeft: ".75rem"
                      }}
                    >
                      {result.curatedMatches.map(
                        (match, index) => (
                          <p
                            key={`${result.pokemon.id}-curated-${index}`}
                            style={{
                              lineHeight: 1.5,
                              margin:
                                "0 0 .35rem"
                            }}
                          >
                            {match.reason}
                          </p>
                        )
                      )}
                    </section>
                  )}

                  {result.entries.map(
                    (entry, index) => (
                      <section
                        key={`${result.pokemon.id}-${index}`}
                        style={{
                          borderLeft:
                            "3px solid #fab856",
                          paddingLeft: ".75rem"
                        }}
                      >
                        <p
                          style={{
                            lineHeight: 1.5,
                            margin:
                              "0 0 .35rem"
                          }}
                        >
                          {entry.text}
                        </p>

                        {entry.versions.length >
                          0 && (
                          <p
                            style={{
                              fontSize: ".8rem",
                              margin: 0,
                              opacity: 0.75
                            }}
                          >
                            {formatVersions(
                              entry.versions
                            )}
                          </p>
                        )}
                      </section>
                    )
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {reviewMode && (
        <section
          style={{
            backgroundColor: "#202020",
            border: "1px solid #555",
            borderRadius: "12px",
            marginTop: "1rem",
            padding: "1rem",
            textAlign: "left"
          }}
        >
          <button
            type="button"
            onClick={approveReviewChanges}
            style={{
              backgroundColor: "#fab856",
              border: "none",
              borderRadius: "10px",
              color: "#1b1b1b",
              cursor: "pointer",
              fontWeight: "bold",
              padding: ".65rem 1rem"
            }}
          >
            Approve Changes
          </button>

          <button
            type="button"
            onClick={clearReviewChanges}
            style={{
              backgroundColor: "#2c2c2c",
              border: "1px solid #555",
              borderRadius: "10px",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
              marginLeft: ".75rem",
              padding: ".65rem 1rem"
            }}
          >
            Clear Local Removals
          </button>

          {curationPreview && (
            <>
              <p>
                Copy this into{" "}
                <code>
                  public/data/pokedexTopicCuration.json
                </code>
                , then run{" "}
                <code>
                  npm run generate:topics
                </code>
                .
              </p>

              <pre
                style={{
                  backgroundColor: "#111",
                  border: "1px solid #555",
                  borderRadius: "8px",
                  overflowX: "auto",
                  padding: "1rem"
                }}
              >
                {curationPreview}
              </pre>
            </>
          )}
        </section>
      )}
    </main>
  );
}

function TopicDetailPage() {
  const { topicSlug } = useParams();
  const [
    articleLoadState,
    setArticleLoadState
  ] = useState({
    slug: "",
    article: null,
    checked: false
  });
  const StaticTopicComponent =
    itemLocationTopicComponents[
      topicSlug
    ];
  const currentArticleState =
    articleLoadState.slug === topicSlug
      ? articleLoadState
      : {
          slug: topicSlug,
          article: null,
          checked: false
        };

  useEffect(() => {
    if (StaticTopicComponent) {
      return;
    }

    let isActive = true;

    fetch(
      `/data/topics/articles/${topicSlug}.json`
    )
      .then(response =>
        response.ok ? response.json() : null
      )
      .then(data => {
        if (!isActive) return;
        setArticleLoadState({
          slug: topicSlug,
          article:
            data &&
            getArticleContentType(data) === "article" &&
            (import.meta.env.DEV ||
              data.active !== false)
              ? data
              : null,
          checked: true
        });
      })
      .catch(error => {
        if (!isActive) return;
        console.warn(
          "Failed to load topic article:",
          error
        );
        setArticleLoadState({
          slug: topicSlug,
          article: null,
          checked: true
        });
      });

    return () => {
      isActive = false;
    };
  }, [StaticTopicComponent, topicSlug]);

  if (StaticTopicComponent) {
    return <StaticTopicComponent />;
  }

  if (!currentArticleState.checked) {
    return <p>Loading topic...</p>;
  }

  if (currentArticleState.article) {
    return (
      <TopicArticlePage
        article={currentArticleState.article}
      />
    );
  }

  return <PokedexTopicDetailPage />;
}

export default TopicDetailPage;
