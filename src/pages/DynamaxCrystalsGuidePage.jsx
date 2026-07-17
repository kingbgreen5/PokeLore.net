import { Link } from "react-router-dom";
import Seo from "../seo/Seo";
import { dynamaxCrystalsGuideSeo } from "../seo/seoConfig";
import {
  formatDynamaxPokemonName,
  getReleasedDynamaxCrystals
} from "../utils/dynamaxCrystals";

function PokemonLinks({
  pokemonSlugs
}) {
  return pokemonSlugs.map((slug, index) => {
    const isLast =
      index === pokemonSlugs.length - 1;
    const separator =
      pokemonSlugs.length === 2
        ? isLast
          ? ""
          : " and "
        : isLast
          ? ""
          : index === pokemonSlugs.length - 2
            ? ", and "
            : ", ";

    return (
      <span key={slug}>
        <Link to={`/pokemon/${slug}`}>
          {formatDynamaxPokemonName(slug)}
        </Link>
        {separator}
      </span>
    );
  });
}

function DynamaxCrystalsGuidePage() {
  const releasedCrystals =
    getReleasedDynamaxCrystals();

  return (
    <main
      style={{
        margin: "0 auto",
        maxWidth: "1000px",
        padding: "2rem"
      }}
    >
      <Seo {...dynamaxCrystalsGuideSeo()} />

      <Link to="/items">Back To Items</Link>

      <h1>
        Dynamax Crystals Guide: Released Crystal
        Raids
      </h1>

      <section
        style={{
          marginBottom: "2rem",
          textAlign: "left"
        }}
      >
        <h2>What Dynamax Crystals Are</h2>
        <p>
          Dynamax Crystals are special event items
          introduced in Pokemon Sword and Shield.
          They were designed to activate a specific
          Max Raid Battle at Watchtower Lair in the
          Watchtower Ruins area of the Wild Area.
        </p>
        <p>
          After a usable crystal is selected from
          the Bag near Watchtower Lair, its
          associated Pokemon becomes available at
          the den until midnight or until it is
          caught.
        </p>
      </section>

      <section
        style={{
          marginBottom: "2rem",
          textAlign: "left"
        }}
      >
        <h2>How They Were Obtained</h2>
        <p>
          Released Dynamax Crystals were obtained
          through limited-time serial-code
          promotions, game purchase bonuses,
          magazines, guidebooks, or participating
          retailers. They were not normally found
          in the overworld or sold in Poke Marts.
        </p>
        <p>
          Most original Dynamax Crystal
          distributions have ended. Expired serial
          codes are not implied to still be
          redeemable.
        </p>
      </section>

      <section
        style={{
          marginBottom: "2rem",
          textAlign: "left"
        }}
      >
        <h2>Released Dynamax Crystals</h2>
        <p>
          Pokemon Sword and Shield contain data for
          300 differently named Dynamax Crystals,
          but only 12 were officially distributed
          and made available to players.
        </p>

        <div
          style={{
            display: "grid",
            gap: "1rem"
          }}
        >
          {releasedCrystals.map(crystal => (
            <article
              key={crystal.slug}
              style={{
                border: "1px solid #666",
                borderRadius: "12px",
                padding: "1rem"
              }}
            >
              <h3
                style={{
                  marginTop: 0
                }}
              >
                <Link to={`/item/${crystal.slug}`}>
                  {crystal.displayName}
                </Link>
              </h3>

              <p>
                <strong>Raid:</strong>{" "}
                {crystal.raidType} Max Raid Battle
                featuring{" "}
                <PokemonLinks
                  pokemonSlugs={crystal.raidPokemon}
                />
                .
              </p>

              {crystal.versionNotes && (
                <p>{crystal.versionNotes}</p>
              )}

              <p>
                <strong>
                  Original acquisition:
                </strong>{" "}
                {crystal.acquisitionSummary}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        style={{
          textAlign: "left"
        }}
      >
        <h2>Unused Crystal Data</h2>
        <p>
          The remaining 288 Dynamax Crystal item
          records are unused game-data entries.
          Those pages remain accessible for
          database completeness, but they are not
          included in the sitemap and are marked
          noindex because the items were never
          officially distributed.
        </p>
      </section>
    </main>
  );
}

export default DynamaxCrystalsGuidePage;
