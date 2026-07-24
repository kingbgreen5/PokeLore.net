import {
  useEffect,
  useState
} from "react";
import { Link } from "react-router-dom";
import SizeComparison from "../components/SizeComparison";
import Seo from "../seo/Seo";
import { topicSeo } from "../seo/seoConfig";
import { itemLocationTopics } from "./topicMetadata";
import "./RaticateAquaticPokemon.css";

const topic = itemLocationTopics.find(
  currentTopic =>
    currentTopic.slug ===
    "raticate-aquatic-pokemon"
);

const raticateEntries = [
  {
    version: "Yellow / Let's Go Pikachu / Let's Go Eevee",
    text:
      "Its hind feet are webbed. They act as flippers, so it can swim in rivers and hunt for prey."
  },
  {
    version: "Crystal / Y",
    text:
      "The webs on its hind legs enable it to cross rivers. It searches wide areas for food."
  },
  {
    version: "FireRed",
    text:
      "Its rear feet have three toes each. They are webbed, enabling it to swim across rivers."
  },
  {
    version: "Ultra Sun",
    text:
      "People say that it fled from its enemies by using its small webbed hind feet to swim from island to island in Alola."
  },
  {
    version: "Sun",
    text:
      "Its hind feet are webbed, so it's a strong swimmer. It can cross rivers and sometimes even oceans."
  }
];

function EntryQuote({
  entry
}) {
  return (
    <figure
      className="raticate-topic-quote"
    >
      <blockquote
        className="raticate-topic-quote-text"
      >
        "{entry.text}"
      </blockquote>

      <figcaption
        className="raticate-topic-quote-caption"
      >
        {entry.version}
      </figcaption>
    </figure>
  );
}

function RaticateSizeSection() {
  const [raticate, setRaticate] =
    useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRaticate() {
      try {
        const response = await fetch(
          "/data/pokemonData/20.json"
        );

        if (!response.ok) {
          throw new Error("Missing Raticate data");
        }

        const data = await response.json();

        if (isMounted) {
          setRaticate(data);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.warn(
          "Failed to load Raticate size chart data:",
          error
        );
        setRaticate(null);
      }
    }

    loadRaticate();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section
      aria-labelledby="raticate-size-heading"
      className="raticate-topic-section"
    >
      <h2 id="raticate-size-heading">
        Size Check
      </h2>

      <p
        className="raticate-topic-copy"
      >
        Perhaps it is too small to learn Surf? Certainly crossing 
        an ocean on ones back would be a harrowing adventure.
        Raticate is listed at 2'4" tall. That is
        not huge, but it is still more than twice
        the listed height of{" "}
        <Link to="/pokemon/chewtle">Chewtle</Link>{" "}
        and{" "}
        <Link to="/pokemon/froakie">Froakie</Link>,
        two much smaller Pokemon that can be used
        for surfing in the modern games.
      </p>

      {raticate ? (
        <SizeComparison
          pokemon={raticate}
          sectionId="raticate-size"
        />
      ) : (
        <p className="raticate-topic-copy">
          Loading Raticate size chart...
        </p>
      )}
    </section>
  );
}

function RaticateAquaticPokemon() {
  return (
    <main
      className="raticate-topic"
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
          "Raticate: Aquatic Pokemon?"}
      </h1>

      <p
        className="raticate-topic-lede"
      >
        One of the Pokemon with the most aquatic
        Pokedex entries is not a{" "}
        <Link to="/type/water">Water type</Link>,
        and it essentially learns no Water-type
        moves.
      </p>

      <section className="raticate-topic-section">
        <h2>The First River Result</h2>

        <p
          className="raticate-topic-copy"
        >
          When you think of Pokemon that live around
          rivers, you probably picture{" "}
          <Link to="/pokemon/slowpoke">
            Slowpoke
          </Link>
          {", "}
          <Link to="/pokemon/marill">Marill</Link>
          {", maybe "}
          <Link to="/pokemon/magikarp">
            Magikarp
          </Link>
          {". "}
          But the first Pokemon that appears when
          you{" "}
          <Link to="/dex-entries?search=river">
            search the entire Pokedex for "river"
          </Link>{" "}
          is...{" "}
          <Link to="/pokemon/raticate">
            Raticate?
          </Link>
        </p>

        <div
          className="raticate-topic-reveal"
          aria-label="Kanto and Alolan Raticate"
        >
          <Link
            to="/pokemon/raticate"
            className="raticate-topic-reveal-image-link"
          >
            <img
              src="/images/pokemon/official/detail/20.webp"
              alt="Kanto Raticate"
              loading="lazy"
              className="raticate-topic-reveal-image"
            />
            <span>Kanto Raticate</span>
          </Link>

          <Link
            to="/pokemon/raticate-alola"
            className="raticate-topic-reveal-image-link"
          >
            <img
              src="/images/pokemon/official/detail/10092.webp"
              alt="Alolan Raticate"
              loading="lazy"
              className="raticate-topic-reveal-image"
            />
            <span>Alolan Raticate</span>
          </Link>
        </div>

        <p
          className="raticate-topic-copy"
        >
          Multiple Pokedex entries talk about how it
          has webbed feet, swims, and even hunts for
          prey in the water.
        </p>

        <div
          className="raticate-topic-quotes"
        >
          {raticateEntries
            .slice(0, 4)
            .map(entry => (
              <EntryQuote
                key={entry.version}
                entry={entry}
              />
            ))}
        </div>
      </section>

      <section className="raticate-topic-section">
  

        <p
          className="raticate-topic-copy"
        >
          Swimming in a river is one thing. Hunting
          prey in water is impressive. However,{" "}
          <strong>Pokemon Sun</strong> takes it even
          farther.
        </p>

        <div
          className="raticate-topic-spotlight"
        >
          <EntryQuote entry={raticateEntries[4]} />
        </div>

        <p
          className="raticate-topic-emphasis"
        >
          OCEANS. Not just streams or rivers.
          OCEANS.
        </p>

        <p
          className="raticate-topic-copy"
        >
          This is well beyond the capabilities of 
          something like a normal rat, and more 
          like what you would 
          expect from a marine mammal. That
          is why some fans speculate that Raticate's
          design may be based partly on a muskrat:
          its body is more compact than a typical
          rat, and its official lore keeps returning
          to water.
        </p>
      </section>

      <section className="raticate-topic-section">
        <h2>The Learnset Gap</h2>

        <p
          className="raticate-topic-copy"
        >
          Raticate is not just an overgrown sewer rat.
          It is apparently a semi-aquatic,
          ocean-crossing predator. So why can it not
          learn Surf, or basically any Water move for
          that matter? You can check{" "}
          <Link to="/pokemon/raticate">
            Raticate's learnset
          </Link>{" "}
          against its entries and the mismatch stands
          out.
        </p>

        <p
          className="raticate-topic-copy"
        >
          It learns{" "}
          <Link to="/move/water-gun">
            Water Gun
          </Link>{" "}
          and{" "}
          <Link to="/move/bubble-beam">
            Bubble Beam
          </Link>{" "}
          via TM in Gen I, but that can hardly
          be said to fit such an aquatic lifestyle.
        </p>
      </section>

      <RaticateSizeSection />

      <section className="raticate-topic-section">
        <h2>How Game Freak Could Lean In</h2>

        <p
          className="raticate-topic-copy"
        >
          A{" "}
          <Link to="/type/water">Water</Link>
          {"/"}
          <Link to="/type/normal">Normal</Link>{" "}
          typing would be one direct way to acknowledge
          the aquatic lifestyle, though it might feel a
          little like a different version of{" "}
          <Link to="/pokemon/bibarel">Bibarel</Link>.
          Another idea is a signature ability, maybe
          called <strong>River Rat</strong>, that makes
          Raticate's Normal-type moves super effective
          against Water-type Pokemon.
        </p>

        <p
          className="raticate-topic-copy"
        >
          Raticate is not a fan favorite, and probably
          is not going to get very much love any time
          soon. It did get an{" "}
          <Link to="/pokemon/raticate-alola">
            Alolan form
          </Link>
          {", "}
          so it may be waiting a while for another
          spotlight.
        </p>
      </section>
    </main>
  );
}

export default RaticateAquaticPokemon;
