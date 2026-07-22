import {
  useEffect,
  useMemo,
  useState
} from "react";
import { Link } from "react-router-dom";
import Seo from "../seo/Seo";
import {
  abilitiesSeo,
  abilitySeo,
  dexEntriesSeo,
  dynamaxCrystalsGuideSeo,
  homeSeo,
  itemSeo,
  itemsSeo,
  learnsetsSeo,
  locationSeo,
  locationsSeo,
  movesSeo,
  moveSeo,
  pokemonSeo,
  singleTypeCoverageSeo,
  teamCoverageSeo,
  topicSeo,
  topicsSeo,
  typeSeo,
  typesSeo
} from "../seo/seoConfig";
import { staticTopics } from "../topics/topicRegistry";
import { readJsonFile } from "../utils/readJsonFile";

const TYPE_SLUGS = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy"
];

const SEO_DRAFT_STORAGE_KEY =
  "pokelore.seoReviewDrafts.v1";

const staticPages = [
  {
    group: "Static",
    label: "Home",
    path: "/",
    seo: homeSeo()
  },
  {
    group: "Static",
    label: "Dex Entries",
    path: "/dex-entries",
    seo: dexEntriesSeo()
  },
  {
    group: "Static",
    label: "Learnsets",
    path: "/learnsets",
    seo: learnsetsSeo()
  },
  {
    group: "Static",
    label: "Moves",
    path: "/moves",
    seo: movesSeo()
  },
  {
    group: "Static",
    label: "Abilities",
    path: "/abilities",
    seo: abilitiesSeo()
  },
  {
    group: "Static",
    label: "Items",
    path: "/items",
    seo: itemsSeo()
  },
  {
    group: "Static",
    label: "Dynamax Crystals",
    path: "/items/dynamax-crystals",
    seo: dynamaxCrystalsGuideSeo()
  },
  {
    group: "Static",
    label: "Locations",
    path: "/locations",
    seo: locationsSeo()
  },
  {
    group: "Static",
    label: "Topics",
    path: "/topics",
    seo: topicsSeo()
  },
  {
    group: "Static",
    label: "Types",
    path: "/types",
    seo: typesSeo()
  },
  {
    group: "Static",
    label: "Team Coverage",
    path: "/team-coverage",
    seo: teamCoverageSeo()
  },
  {
    group: "Static",
    label: "Single Type Coverage",
    path: "/single-type-coverage",
    seo: singleTypeCoverageSeo()
  }
];

function isLocalReviewHost() {
  if (typeof window === "undefined") {
    return false;
  }

  return [
    "localhost",
    "127.0.0.1",
    "::1"
  ].includes(window.location.hostname);
}

function formatName(value = "") {
  return String(value)
    .split("-")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function entryFromSeo({
  group,
  label,
  path,
  seo
}) {
  return {
    group,
    label,
    path,
    title: seo.title,
    description: seo.description,
    canonical: seo.canonical,
    robots: seo.robots
  };
}

function loadDrafts() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const storedDrafts =
      window.localStorage.getItem(
        SEO_DRAFT_STORAGE_KEY
      );

    return storedDrafts
      ? JSON.parse(storedDrafts)
      : {};
  } catch {
    return {};
  }
}

function persistDrafts(drafts) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    SEO_DRAFT_STORAGE_KEY,
    JSON.stringify(drafts)
  );
}

function getDraftedEntry(entry, drafts) {
  const draft = drafts[entry.path];
  const title =
    draft?.title ?? entry.title;
  const description =
    draft?.description ?? entry.description;
  const isEdited =
    title !== entry.title ||
    description !== entry.description;

  return {
    ...entry,
    originalTitle: entry.title,
    originalDescription: entry.description,
    title,
    description,
    isEdited
  };
}

function getLengthStatus(length, min, max) {
  if (length < min) return "short";
  if (length > max) return "long";
  return "good";
}

function LengthBadge({
  label,
  value,
  min,
  max
}) {
  const status = getLengthStatus(
    value.length,
    min,
    max
  );
  const color =
    status === "good"
      ? "#8bd17c"
      : status === "short"
        ? "#ffd166"
        : "#ff8a80";

  return (
    <span
      style={{
        color,
        fontSize: ".85rem"
      }}
    >
      {label}: {value.length} chars ({status})
    </span>
  );
}

function PreviewCard({
  entry,
  onDraftChange,
  onReset
}) {
  const displayUrl =
    entry.canonical?.replace(
      /^https?:\/\//,
      ""
    ) ?? entry.path;

  return (
    <article
      style={{
        border: "1px solid #444",
        borderRadius: "10px",
        display: "grid",
        gap: ".65rem",
        padding: "1rem"
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: ".75rem",
          justifyContent: "space-between"
        }}
      >
        <strong>{entry.label}</strong>
        <span
          style={{
            display: "flex",
            gap: ".5rem"
          }}
        >
          {entry.isEdited && (
            <span style={{ color: "#ffd166" }}>
              Edited
            </span>
          )}
          <span style={{ opacity: 0.8 }}>
            {entry.group}
          </span>
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gap: ".25rem"
        }}
      >
        <p
          style={{
            color: "#8ab4f8",
            fontSize: "1.1rem",
            lineHeight: 1.25,
            margin: 0
          }}
        >
          {entry.title}
        </p>
        <p
          style={{
            color: "#a8c7a1",
            fontSize: ".9rem",
            margin: 0,
            overflowWrap: "anywhere"
          }}
        >
          {displayUrl}
        </p>
        <p
          style={{
            lineHeight: 1.45,
            margin: 0
          }}
        >
          {entry.description}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: ".75rem"
        }}
      >
        <LengthBadge
          label="Title"
          value={entry.title}
          min={35}
          max={65}
        />
        <LengthBadge
          label="Description"
          value={entry.description}
          min={120}
          max={160}
        />
        {entry.robots && (
          <span style={{ color: "#ff8a80" }}>
            Robots: {entry.robots}
          </span>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gap: ".75rem"
        }}
      >
        <label>
          SEO title
          <input
            value={entry.title}
            onChange={event =>
              onDraftChange(
                entry,
                "title",
                event.target.value
              )
            }
            style={{
              boxSizing: "border-box",
              display: "block",
              marginTop: ".35rem",
              padding: ".65rem",
              width: "100%"
            }}
          />
        </label>

        <label>
          SEO description
          <textarea
            value={entry.description}
            onChange={event =>
              onDraftChange(
                entry,
                "description",
                event.target.value
              )
            }
            rows={3}
            style={{
              boxSizing: "border-box",
              display: "block",
              marginTop: ".35rem",
              padding: ".65rem",
              resize: "vertical",
              width: "100%"
            }}
          />
        </label>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: ".75rem"
        }}
      >
        <Link to={entry.path}>
          Open page
        </Link>

        {entry.isEdited && (
          <button
            type="button"
            onClick={() => onReset(entry)}
          >
            Reset draft
          </button>
        )}
      </div>
    </article>
  );
}

function SeoReviewPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [onlyEdited, setOnlyEdited] = useState(false);
  const [drafts, setDrafts] = useState(loadDrafts);
  const [copyStatus, setCopyStatus] = useState("");
  const isLocal = isLocalReviewHost();

  useEffect(() => {
    if (!isLocal) {
      setLoading(false);
      return;
    }

    async function loadSeoEntries() {
      try {
        const [
          pokemonIndex,
          movesIndex,
          abilities,
          itemsIndex,
          itemLocationsCurated,
          locationsIndex,
          pokedexTopics
        ] = await Promise.all([
          readJsonFile("/data/pokemonIndex.json", {
            required: true
          }),
          readJsonFile("/data/movesIndex.json", {
            required: true
          }),
          readJsonFile("/data/abilities.json", {
            required: true
          }),
          readJsonFile("/data/itemsIndex.json", {
            required: true
          }),
          readJsonFile(
            "/data/itemLocationsCurated.json",
            {
              required: true
            }
          ),
          readJsonFile("/data/locationsIndex.json", {
            required: true
          }),
          readJsonFile("/data/pokedexTopics.json", {
            required: true
          })
        ]);

        const pokemonDetails = await Promise.all(
          (pokemonIndex ?? []).map(async pokemon => {
            const detail =
              await readJsonFile(
                `/data/pokemonData/${pokemon.id}.json`
              );

            return detail ?? pokemon;
          })
        );

        const activeTopics = [
          ...staticTopics.filter(topic => topic.active),
          ...((pokedexTopics?.topics ?? []).filter(
            topic => topic.active
          ))
        ];
        const curatedItemLocationsBySlug =
          new Map(
            (itemLocationsCurated?.items ?? []).map(
              itemLocationData => [
                itemLocationData.item,
                itemLocationData
              ]
            )
          );
        const itemsWithCuratedAcquisition =
          (itemsIndex ?? []).map(item => {
            const curatedItemLocations =
              curatedItemLocationsBySlug.get(
                item.name
              );

            return curatedItemLocations
              ? {
                  ...item,
                  acquisition:
                    curatedItemLocations.acquisition ??
                    []
                }
              : item;
          });

        const nextEntries = [
          ...staticPages.map(entryFromSeo),
          ...pokemonDetails.map(pokemon =>
            entryFromSeo({
              group: "Pokemon",
              label: formatName(pokemon.name),
              path: `/pokemon/${pokemon.name}`,
              seo: pokemonSeo(pokemon)
            })
          ),
          ...(movesIndex ?? []).map(move =>
            entryFromSeo({
              group: "Moves",
              label: move.displayName ?? formatName(move.name),
              path: `/move/${move.name}`,
              seo: moveSeo(move.name)
            })
          ),
          ...Object.values(abilities ?? {}).map(ability =>
            entryFromSeo({
              group: "Abilities",
              label: formatName(ability.name),
              path: `/ability/${ability.name}`,
              seo: abilitySeo(ability.name)
            })
          ),
          ...itemsWithCuratedAcquisition.map(item =>
            entryFromSeo({
              group: "Items",
              label: item.displayName ?? formatName(item.name),
              path: `/item/${item.name}`,
              seo: itemSeo(item)
            })
          ),
          ...(locationsIndex ?? []).map(location =>
            entryFromSeo({
              group: "Locations",
              label:
                location.displayName ??
                formatName(location.name),
              path: `/location/${location.name}`,
              seo: locationSeo({
                name: location.name,
                displayName:
                  location.displayName ??
                  formatName(location.name),
                region: location.regionDisplayName
                  ? {
                      displayName:
                        location.regionDisplayName
                    }
                  : undefined
              })
            })
          ),
          ...TYPE_SLUGS.map(type =>
            entryFromSeo({
              group: "Types",
              label: formatName(type),
              path: `/type/${type}`,
              seo: typeSeo(type)
            })
          ),
          ...activeTopics.map(topic =>
            entryFromSeo({
              group: "Topics",
              label: topic.title ?? formatName(topic.slug),
              path: `/topic/${topic.slug}`,
              seo: topicSeo(topic)
            })
          )
        ];

        setEntries(nextEntries);
      } catch (loadError) {
        setError(loadError);
      } finally {
        setLoading(false);
      }
    }

    loadSeoEntries();
  }, [isLocal]);

  useEffect(() => {
    persistDrafts(drafts);
  }, [drafts]);

  const draftedEntries = useMemo(
    () =>
      entries.map(entry =>
        getDraftedEntry(entry, drafts)
      ),
    [drafts, entries]
  );

  const changedDrafts = useMemo(() => {
    return draftedEntries
      .filter(entry => entry.isEdited)
      .reduce((changes, entry) => {
        return {
          ...changes,
          [entry.path]: {
            group: entry.group,
            label: entry.label,
            title: entry.title,
            description: entry.description
          }
        };
      }, {});
  }, [draftedEntries]);

  function updateDraft(entry, field, value) {
    setDrafts(currentDrafts => {
      const currentDraft =
        currentDrafts[entry.path] ?? {};
      const nextDraft = {
        title:
          field === "title"
            ? value
            : currentDraft.title ??
              entry.originalTitle,
        description:
          field === "description"
            ? value
            : currentDraft.description ??
              entry.originalDescription
      };
      const hasChanges =
        nextDraft.title !== entry.originalTitle ||
        nextDraft.description !==
          entry.originalDescription;

      if (!hasChanges) {
        const {
          [entry.path]: removed,
          ...remainingDrafts
        } = currentDrafts;
        void removed;
        return remainingDrafts;
      }

      return {
        ...currentDrafts,
        [entry.path]: nextDraft
      };
    });
  }

  function resetDraft(entry) {
    setDrafts(currentDrafts => {
      const {
        [entry.path]: removed,
        ...remainingDrafts
      } = currentDrafts;
      void removed;
      return remainingDrafts;
    });
  }

  function resetAllDrafts() {
    setDrafts({});
  }

  async function copyOverridesJson() {
    const json = JSON.stringify(
      changedDrafts,
      null,
      2
    );

    try {
      await navigator.clipboard.writeText(json);
      setCopyStatus("Copied overrides JSON.");
    } catch {
      setCopyStatus(
        "Copy failed. Select the JSON below manually."
      );
    }
  }

  const groups = useMemo(
    () => [
      "all",
      ...Array.from(
        new Set(draftedEntries.map(entry => entry.group))
      ).sort()
    ],
    [draftedEntries]
  );

  const filteredEntries = useMemo(() => {
    const term =
      searchTerm.trim().toLowerCase();

    return draftedEntries.filter(entry => {
      const matchesGroup =
        selectedGroup === "all" ||
        entry.group === selectedGroup;
      const hasIssue =
        getLengthStatus(entry.title.length, 35, 65) !==
          "good" ||
        getLengthStatus(
          entry.description.length,
          120,
          160
        ) !== "good";
      const matchesIssue =
        !onlyIssues || hasIssue;
      const matchesEdited =
        !onlyEdited || entry.isEdited;
      const matchesSearch =
        !term ||
        [
          entry.group,
          entry.label,
          entry.path,
          entry.title,
          entry.description,
          entry.canonical
        ]
          .filter(Boolean)
          .some(value =>
            value.toLowerCase().includes(term)
          );

      return (
        matchesGroup &&
        matchesIssue &&
        matchesEdited &&
        matchesSearch
      );
    });
  }, [
    draftedEntries,
    onlyEdited,
    onlyIssues,
    searchTerm,
    selectedGroup
  ]);

  if (!isLocal) {
    return (
      <main style={{ padding: "2rem" }}>
        <Seo
          title="SEO Review | PokeLore"
          description="Private local SEO review utility."
          canonical="https://pokelore.net/seo-review"
          robots="noindex, nofollow"
        />
        <h1>SEO Review</h1>
        <p>
          This internal review page is only available on
          localhost.
        </p>
      </main>
    );
  }

  return (
    <main
      style={{
        margin: "0 auto",
        maxWidth: "1180px",
        padding: "2rem"
      }}
    >
      <Seo
        title="SEO Review | PokeLore"
        description="Private local SEO review utility."
        canonical="https://pokelore.net/seo-review"
        robots="noindex, nofollow"
      />

      <h1>SEO Review</h1>

      <p
        style={{
          lineHeight: 1.6,
          maxWidth: "760px"
        }}
      >
        Local-only preview of page titles and meta
        descriptions as they are generated by the current SEO
        helpers. Edits are saved as browser drafts and update
        this preview immediately. Export the overrides when you
        are ready to apply them to the codebase.
      </p>

      {loading && <p>Loading SEO entries...</p>}
      {error && (
        <p style={{ color: "#ff8a80" }}>
          Failed to load SEO review data:{" "}
          {error.message}
        </p>
      )}

      {!loading && !error && (
        <>
          <div
            style={{
              alignItems: "end",
              display: "grid",
              gap: "1rem",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              margin: "1.5rem 0"
            }}
          >
            <label>
              Search
              <input
                value={searchTerm}
                onChange={event =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Title, route, description..."
                style={{
                  boxSizing: "border-box",
                  display: "block",
                  marginTop: ".35rem",
                  padding: ".65rem",
                  width: "100%"
                }}
              />
            </label>

            <label>
              Group
              <select
                value={selectedGroup}
                onChange={event =>
                  setSelectedGroup(event.target.value)
                }
                style={{
                  display: "block",
                  marginTop: ".35rem",
                  padding: ".65rem",
                  width: "100%"
                }}
              >
                {groups.map(group => (
                  <option key={group} value={group}>
                    {group === "all" ? "All groups" : group}
                  </option>
                ))}
              </select>
            </label>

            <label
              style={{
                alignItems: "center",
                display: "flex",
                gap: ".5rem",
                minHeight: "2.5rem"
              }}
            >
              <input
                type="checkbox"
                checked={onlyIssues}
                onChange={event =>
                  setOnlyIssues(event.target.checked)
                }
              />
              Only length issues
            </label>

            <label
              style={{
                alignItems: "center",
                display: "flex",
                gap: ".5rem",
                minHeight: "2.5rem"
              }}
            >
              <input
                type="checkbox"
                checked={onlyEdited}
                onChange={event =>
                  setOnlyEdited(event.target.checked)
                }
              />
              Only edited drafts
            </label>
          </div>

          <div
            style={{
              alignItems: "center",
              display: "flex",
              flexWrap: "wrap",
              gap: ".75rem",
              marginBottom: "1rem"
            }}
          >
            <p style={{ margin: 0 }}>
              Showing {filteredEntries.length} of{" "}
              {draftedEntries.length} pages.{" "}
              {Object.keys(changedDrafts).length} edited.
            </p>

            <button
              type="button"
              onClick={copyOverridesJson}
              disabled={
                Object.keys(changedDrafts).length === 0
              }
            >
              Copy overrides JSON
            </button>

            <button
              type="button"
              onClick={resetAllDrafts}
              disabled={
                Object.keys(changedDrafts).length === 0
              }
            >
              Reset all drafts
            </button>

            {copyStatus && (
              <span>{copyStatus}</span>
            )}
          </div>

          {Object.keys(changedDrafts).length > 0 && (
            <details
              style={{
                marginBottom: "1rem"
              }}
            >
              <summary>
                View overrides JSON
              </summary>
              <pre
                style={{
                  background: "#111",
                  border: "1px solid #444",
                  borderRadius: "8px",
                  overflowX: "auto",
                  padding: "1rem"
                }}
              >
                {JSON.stringify(
                  changedDrafts,
                  null,
                  2
                )}
              </pre>
            </details>
          )}

          <div
            style={{
              display: "grid",
              gap: "1rem"
            }}
          >
            {filteredEntries.map(entry => (
              <PreviewCard
                key={`${entry.group}-${entry.path}`}
                entry={entry}
                onDraftChange={updateDraft}
                onReset={resetDraft}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}

export default SeoReviewPage;
