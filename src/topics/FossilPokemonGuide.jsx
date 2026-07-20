import { Link } from "react-router-dom";
import Seo from "../seo/Seo";
import { topicSeo } from "../seo/seoConfig";
import {
  galarFossilItems,
  standardFossilItems
} from "../data/fossilItems";
import { itemLocationTopics } from "./topicMetadata";

const topic = itemLocationTopics.find(
  currentTopic =>
    currentTopic.slug === "fossil-pokemon-guide"
);

const choicePairs = [
  ["helix-fossil", "dome-fossil", "Kanto"],
  ["root-fossil", "claw-fossil", "Hoenn"],
  ["skull-fossil", "armor-fossil", "Sinnoh"],
  ["cover-fossil", "plume-fossil", "Unova"],
  ["jaw-fossil", "sail-fossil", "Kalos"]
];

const standardFossilItemsBySlug = new Map(
  standardFossilItems.map(item => [
    item.slug,
    item
  ])
);

const fossilChoiceGroups = choicePairs
  .map(([firstSlug, secondSlug, region]) => ({
    region,
    fossils: [
      standardFossilItemsBySlug.get(firstSlug),
      standardFossilItemsBySlug.get(secondSlug)
    ].filter(Boolean)
  }))
  .filter(group => group.fossils.length > 0);

const standaloneClassicFossils = standardFossilItems.filter(
  item => !item.choicePair
);

function PokemonLinks({
  pokemon
}) {
  return (
    <>
      {pokemon.map((entry, index) => (
        <span key={entry.slug}>
          {index > 0 ? ", " : ""}
          <Link to={`/pokemon/${entry.slug}`}>
            {entry.displayName}
          </Link>
        </span>
      ))}
    </>
  );
}

function FossilCard({
  item
}) {
  return (
    <article
      style={{
        border: "1px solid #555",
        borderRadius: "10px",
        display: "grid",
        gap: ".55rem",
        padding: "1rem"
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: ".75rem"
        }}
      >
        {item.sprite && (
          <img
            src={item.sprite}
            alt=""
            loading="lazy"
            style={{
              flex: "0 0 auto",
              height: "42px",
              imageRendering: "pixelated",
              width: "42px"
            }}
          />
        )}

        <h3
          style={{
            margin: 0
          }}
        >
          <Link to={`/item/${item.slug}`}>
            {item.displayName}
          </Link>
        </h3>
      </div>

      <p
        style={{
          lineHeight: 1.5,
          margin: 0
        }}
      >
        Restores <PokemonLinks pokemon={item.restoredPokemon} />.
      </p>

      <p
        style={{
          lineHeight: 1.5,
          margin: 0,
          opacity: 0.85
        }}
      >
        {item.evolutionSummary}
      </p>

      <p
        style={{
          lineHeight: 1.5,
          margin: 0
        }}
      >
        {item.guideSummary}
      </p>
    </article>
  );
}

function FossilChoiceGroup({
  group
}) {
  return (
    <article
      style={{
        border: "1px solid #444",
        borderRadius: "10px",
        display: "grid",
        gap: "1rem",
        padding: "1rem"
      }}
    >
      <h3
        style={{
          margin: 0
        }}
      >
        {group.region} Region Fossils
      </h3>

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))"
        }}
      >
        {group.fossils.map(item => (
          <FossilCard
            key={item.slug}
            item={item}
          />
        ))}
      </div>
    </article>
  );
}

function FossilPokemonGuide() {
  return (
    <main
      style={{
        margin: "0 auto",
        maxWidth: "980px",
        padding: "2rem"
      }}
    >
      <Seo {...topicSeo(topic)} />

      <Link to="/topics">
        Back to topics
      </Link>

      <h1>{topic?.title ?? "Fossil Pokemon Guide"}</h1>

      <p
        style={{
          lineHeight: 1.6,
          maxWidth: "760px"
        }}
      >
        Fossil items restore ancient Pokemon at fossil labs or
        restoration machines. This guide links each fossil item
        to its revived Pokemon, evolution details, and the
        curated fossil location notes on PokeLore. Open an
        individual fossil item page for curated game locations,
        revival levels, strengths and weaknesses.
      </p>

      <section
        style={{
          marginTop: "2rem"
        }}
      >
        <h2>Classic Fossils</h2>

        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "1fr"
          }}
        >
          {fossilChoiceGroups.map(group => (
            <FossilChoiceGroup
              key={group.region}
              group={group}
            />
          ))}
        </div>

        {standaloneClassicFossils.length > 0 && (
          <div
            style={{
              marginTop: "1.5rem"
            }}
          >
            <h3>Standalone Fossils</h3>

            <div
              style={{
                display: "grid",
                gap: "1rem",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(230px, 1fr))"
              }}
            >
              {standaloneClassicFossils.map(item => (
                <FossilCard
                  key={item.slug}
                  item={item}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      <section
        style={{
          marginTop: "2.5rem"
        }}
      >
        <h2>Galar Fossils</h2>

        <p
          style={{
            lineHeight: 1.6,
            maxWidth: "760px"
          }}
        >
          Pokemon Sword and Shield use fossil halves instead of
          one complete fossil item. Combine two fossilized parts
          with Cara Liss on Route 6 to restore a Galar fossil
          Pokemon.
        </p>

        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(230px, 1fr))",
            marginBottom: "1.5rem"
          }}
        >
          {galarFossilItems.map(item => (
            <FossilCard
              key={item.slug}
              item={item}
            />
          ))}
        </div>

      </section>
    </main>
  );
}

export default FossilPokemonGuide;
