import { Link } from "react-router-dom";
import PokemonSummaryCard from "../components/PokemonSummaryCard";
import Seo from "../seo/Seo";
import { topicSeo } from "../seo/seoConfig";
import { itemLocationTopics } from "./topicMetadata";

const topic = itemLocationTopics.find(
  currentTopic =>
    currentTopic.slug ===
    "evolving-feebas-into-milotic-via-beauty"
);

const pokemon = [
  {
    id: 349,
    name: "feebas",
    species: "feebas",
    types: ["water"],
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/349.png"
  },
  {
    id: 350,
    name: "milotic",
    species: "milotic",
    types: ["water"],
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/350.png"
  }
];

const beautyBerries = [
  {
    id: 157,
    name: "Pamtre Berry",
    slug: "pamtre-berry",
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/pamtre-berry.png",
    categoryDisplayName: "Baking only",
    shortEffect:
      "Used for creating PokéBlocks and Poffins."
  },
  {
    id: 149,
    name: "Hondew Berry",
    slug: "hondew-berry",
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/hondew-berry.png",
    categoryDisplayName: "Effort drop",
    shortEffect:
      "Drops Special Attack Effort Values by 10 and raises happiness."
  },
  {
    id: 147,
    name: "Kelpsy Berry",
    slug: "kelpsy-berry",
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/kelpsy-berry.png",
    categoryDisplayName: "Effort drop",
    shortEffect:
      "Drops Attack Effort Values by 10 and raises happiness."
  },
  {
    id: 137,
    name: "Wiki Berry",
    slug: "wiki-berry",
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/wiki-berry.png",
    categoryDisplayName: "Picky healing",
    shortEffect:
      "Held: Consumed at 1/2 max HP to restore 1/8 max HP. Confuses Pokémon that dislike dry flavor."
  },
  {
    id: 152,
    name: "Cornn Berry",
    slug: "cornn-berry",
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/cornn-berry.png",
    categoryDisplayName: "Baking only",
    shortEffect:
      "Used for creating PokéBlocks and Poffins."
  }
];

const preferredNatures = [
  "Modest",
  "Mild",
  "Quiet",
  "Rash"
];

const avoidNatures = [
  "Impish",
  "Careful",
  "Adamant"
];

function LinkList({
  entries
}) {
  return (
    <>
      {entries.map((entry, index) => (
        <span key={entry.slug}>
          {index > 0 ? ", " : ""}
          <Link to={`/item/${entry.slug}`}>
            {entry.name}
          </Link>
        </span>
      ))}
    </>
  );
}

function ItemSummaryCard({
  item
}) {
  return (
    <Link
      to={`/item/${item.slug}`}
      style={{
        backgroundColor: "#2c2c2c",
        border: "1px solid #666",
        borderRadius: "12px",
        color: "inherit",
        cursor: "pointer",
        padding: "1rem",
        textAlign: "left",
        textDecoration: "none"
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: ".75rem",
          marginBottom: ".75rem"
        }}
      >
        {item.sprite && (
          <img
            src={item.sprite}
            alt={item.name}
            loading="lazy"
            style={{
              height: "42px",
              imageRendering:
                "pixelated",
              width: "42px"
            }}
          />
        )}

        <h2
          style={{
            margin: 0
          }}
        >
          {item.name}
        </h2>
      </div>

      <div>{item.categoryDisplayName}</div>

      <p
        style={{
          fontSize: ".9rem",
          lineHeight: 1.5,
          marginTop: ".75rem"
        }}
      >
        {item.shortEffect}
      </p>
    </Link>
  );
}

function PrepChecklist() {
  const markerStyle = {
    display: "inline-block",
    flex: "0 0 auto",
    fontWeight: 900,
    lineHeight: 1,
    marginTop: ".25rem",
    width: "1rem"
  };
  const itemStyle = {
    display: "flex",
    gap: ".5rem"
  };

  return (
    <section
      aria-labelledby="feebas-prep-checklist"
      style={{
        backgroundColor: "#202020",
        border: "1px solid #555",
        borderRadius: "12px",
        display: "grid",
        gap: "1rem",
        margin: "0 auto 2rem",
        maxWidth: "780px",
        padding: "1rem",
        textAlign: "left"
      }}
    >
      <h2
        id="feebas-prep-checklist"
        style={{
          margin: 0,
          textAlign: "center"
        }}
      >
        Checklist
      </h2>

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(240px, 1fr))"
        }}
      >
        <div>
          <h3
            style={{
              marginTop: 0
            }}
          >
            Have Ready
          </h3>
          <ul
            style={{
              display: "grid",
              gap: ".5rem",
              lineHeight: 1.5,
              listStyle: "none",
              marginBottom: 0,
              paddingLeft: 0
            }}
          >
            <li style={itemStyle}>
              <span
                aria-hidden="true"
                style={{
                  ...markerStyle,
                  color: "#22c55e"
                }}
              >
                ✓
              </span>
              <span>
                <Link to="/pokemon/feebas">
                  Feebas
                </Link>{" "}
                with Modest, Mild, Quiet, or Rash nature
              </span>
            </li>
            <li style={itemStyle}>
              <span
                aria-hidden="true"
                style={{
                  ...markerStyle,
                  color: "#22c55e"
                }}
              >
                ✓
              </span>
              <span>
                Stockpile of Dry berries:{" "}
                <Link to="/item/pamtre-berry">
                  Pamtre
                </Link>
                ,{" "}
                <Link to="/item/hondew-berry">
                  Hondew
                </Link>
                ,{" "}
                <Link to="/item/kelpsy-berry">
                  Kelpsy
                </Link>
                ,{" "}
                <Link to="/item/cornn-berry">
                  Cornn
                </Link>
                , or{" "}
                <Link to="/item/wiki-berry">
                  Wiki
                </Link>
              </span>
            </li>
            <li style={itemStyle}>
              <span
                aria-hidden="true"
                style={{
                  ...markerStyle,
                  color: "#22c55e"
                }}
              >
                ✓
              </span>
              <span>Game saved</span>
            </li>
          </ul>
        </div>

        <div>
          <h3
            style={{
              marginTop: 0
            }}
          >
            Avoid
          </h3>
          <ul
            style={{
              display: "grid",
              gap: ".5rem",
              lineHeight: 1.5,
              listStyle: "none",
              marginBottom: 0,
              paddingLeft: 0
            }}
          >
            <li style={itemStyle}>
              <span
                aria-hidden="true"
                style={{
                  ...markerStyle,
                  color: "#ef4444"
                }}
              >
                ✕
              </span>
              <span>
                Impish, Careful, or Adamant natured Feebas
              </span>
            </li>
            <li style={itemStyle}>
              <span
                aria-hidden="true"
                style={{
                  ...markerStyle,
                  color: "#ef4444"
                }}
              >
                ✕
              </span>
              <span>
                Saving after a failed attempt
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function FeebasBeautyEvolutionGuide() {
  return (
    <main
      style={{
        margin: "0 auto",
        maxWidth: "980px",
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

      <h1>
        {topic?.title ??
          "Evolving Feebas into Milotic via Beauty"}
      </h1>

      <p
        style={{
          lineHeight: 1.6,
          margin: "0 auto 2rem",
          maxWidth: "780px"
        }}
      >
        In games before the{" "}
        <Link to="/item/prism-scale">
          Prism Scale
        </Link>{" "}
        evolution method,{" "}
        <Link to="/pokemon/feebas">
          Feebas
        </Link>{" "}
        evolves into{" "}
        <Link to="/pokemon/milotic">
          Milotic
        </Link>{" "}
        after its Beauty condition reaches 170 and it levels
        up. Beauty is mostly invisible outside the contest
        condition screens, so planning your berries before
        feeding Feebas matters.
      </p>

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(240px, 320px))",
          justifyContent: "center",
          margin: "1.25rem auto 2rem",
          maxWidth: "680px"
        }}
      >
        {pokemon.map(entry => (
          <PokemonSummaryCard
            key={entry.name}
            pokemon={entry}
          />
        ))}
      </div>

      <PrepChecklist />

      <section>
        <h2>Things to Know</h2>

        <ul
          style={{
            display: "grid",
            fontWeight: 700,
            gap: ".75rem",
            lineHeight: 1.6,
            margin: "0 auto 1.5rem",
            maxWidth: "780px",
            textAlign: "left"
          }}
        >
          <li>
            Dry-flavor berries increase Beauty (when used as
            ingredients for Pokeblocks or Poffins).
          </li>
          <li>
            A Pokemon can only eat so many Pokeblocks or
            Poffins before it refuses more. Ingredient quality
            matters because weak recipes can fill Feebas before
            Beauty reaches 170.
          </li>
          <li>
            Prefer{" "}
            {preferredNatures.join(", ")} natures because they
            like Dry flavor. Avoid{" "}
            {avoidNatures.join(", ")} natures because they
            dislike Dry flavor.
          </li>
        </ul>
      </section>

      <section>
        <h2>Recommended Feeding Plan</h2>

        <p
          style={{
            lineHeight: 1.6,
            margin: "0 auto 1rem",
            maxWidth: "780px"
          }}
        >
          Do not feed your Feebas incrementally. Stock up on
          berries, save the game, then make your Pokeblocks or
          Poffins and feed Feebas everything. Test whether it
          was enough by leveling up normally or using a{" "}
          <Link to="/item/rare-candy">
            Rare Candy
          </Link>

           .{" "}Do not save if Feebas refuses to eat more and does
          not evolve after leveling up. Reset, adjust your
          berry plan, and try again.
          
        </p>

        {/* <p
          style={{
            borderLeft: "4px solid #fab856",
            lineHeight: 1.6,
            margin: "0 auto 2rem",
            maxWidth: "780px",
            paddingLeft: "1rem",
            textAlign: "left"
          }}
        >
          Do not save if Feebas refuses to eat more and does
          not evolve after leveling up. Reset, adjust your
          berry plan, and try again.
        </p> */}
      </section>

      <section>
        <h2>Berry Selection</h2>

        <p
          style={{
            lineHeight: 1.6,
            margin: "0 auto 1.25rem",
            maxWidth: "780px"
          }}
        >
          The best berries for Beauty-focused Pokeblocks and
          Poffins are <LinkList entries={beautyBerries} />.
          Any berry with meaningful Dry flavor can contribute,
          but you should prioritize the strongest Dry berries
          you can reliably gather. The two Standouts in Emerald are Hondew and Kelpsy. 
          as they have good availability and contribute significant dryness. 
          Berry Location data for each game is available in each berry's item page.
        </p>

        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            marginBottom: "2rem"
          }}
        >
          {beautyBerries.map(berry => (
            <ItemSummaryCard
              key={berry.slug}
              item={berry}
            />
          ))}
        </div>
      </section>

      <section>
        <h2>Game Notes</h2>

        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(250px, 1fr))"
          }}
        >
          <article
            style={{
              backgroundColor: "#2c2c2c",
              border: "1px solid #555",
              borderRadius: "10px",
              padding: "1rem",
              textAlign: "left"
            }}
          >
            <h3>Ruby, Sapphire, and Emerald</h3>
            <p>
              The{" "}
              <Link to="/location/lilycove-city">
                Lilycove City
              </Link>{" "}
              Contest Hall berry blender with three NPCs
              produces high-quality Pokeblocks, which helps
              raise Beauty efficiently before Feebas becomes
              full.
            </p>

            <p>
          
              Hondew and Kelpsy are the most realistic
               options for a playthough. Pamtre is the strongest, but it is locked behind the Elite 4.
            
            </p>
          </article>

          <article
            style={{
              backgroundColor: "#2c2c2c",
              border: "1px solid #555",
              borderRadius: "10px",
              padding: "1rem",
              textAlign: "left"
            }}
          >
            <h3>Diamond, Pearl, and Platinum</h3>
            <p>
               In Pokemon Platinum, Dry-Sweet Poffins can be
              bought downstairs in the{" "}
              <Link to="/location/veilstone-city">
                Veilstone Department Store
              </Link>
              .
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}

export default FeebasBeautyEvolutionGuide;
