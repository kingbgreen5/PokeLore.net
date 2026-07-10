import { Link } from "react-router-dom";
import Seo from "../seo/Seo";
import { topicSeo } from "../seo/seoConfig";
import { itemLocationTopics } from "./topicMetadata";

const topic = itemLocationTopics.find(
  currentTopic =>
    currentTopic.slug === "herba-mystica"
);

const flavors = [
  {
    slug: "sweet-herba-mystica",
    name: "Sweet Herba Mystica",
    titan: {
      name: "Klawf",
      to: "/pokemon/klawf"
    },
    location: {
      name: "South Province Area Three",
      to: "/location/paldea-south-province-area-three"
    },
    role:
      "Often used in recipes where a sweet flavor is specifically called for."
  },
  {
    slug: "salty-herba-mystica",
    name: "Salty Herba Mystica",
    titan: {
      name: "Orthworm",
      to: "/pokemon/orthworm"
    },
    location: {
      name: "East Province Area Three",
      to: "/location/paldea-east-province-area-three"
    },
    role:
      "A common high-value ingredient in many shiny sandwich recipe sets."
  },
  {
    slug: "sour-herba-mystica",
    name: "Sour Herba Mystica",
    titan: {
      name: "Great Tusk or Iron Treads",
      links: [
        {
          label: "Great Tusk",
          to: "/pokemon/great-tusk"
        },
        {
          label: "Iron Treads",
          to: "/pokemon/iron-treads"
        }
      ]
    },
    location: {
      name: "Asado Desert",
      to: "/location/asado-desert"
    },
    role:
      "Useful when a recipe calls for sour flavor; do not assume it can replace every other Herba."
  },
  {
    slug: "bitter-herba-mystica",
    name: "Bitter Herba Mystica",
    titan: {
      name: "Bombirdier",
      to: "/pokemon/bombirdier"
    },
    location: {
      name: "West Province Area One",
      to: "/location/paldea-west-province-area-one"
    },
    role:
      "Used in recipes that specifically need bitter flavor or flexible Herba slots."
  },
  {
    slug: "spicy-herba-mystica",
    name: "Spicy Herba Mystica",
    titan: {
      name: "Dondozo and Tatsugiri",
      links: [
        {
          label: "Dondozo",
          to: "/pokemon/dondozo"
        },
        {
          label: "Tatsugiri",
          to: "/pokemon/tatsugiri-curly"
        }
      ]
    },
    location: {
      name: "Casseroya Lake",
      to: "/location/casseroya-lake"
    },
    role:
      "Used when a recipe calls for spicy flavor; save it for recipes that need it."
  }
];

const coachRewards = [
  ["Katy", "sweet-herba-mystica", "Sweet Herba Mystica"],
  ["Tyme", "bitter-herba-mystica", "Bitter Herba Mystica"],
  ["Larry", "salty-herba-mystica", "Salty Herba Mystica"],
  ["Saguaro", "sour-herba-mystica", "Sour Herba Mystica"],
  ["Kofu", "spicy-herba-mystica", "Spicy Herba Mystica"]
];

const faqs = [
  {
    question:
      "Why did the Titan not give me usable Herba Mystica?",
    answer:
      "The Titan storyline herbs are story items. Arven uses them immediately, so they restore Koraidon or Miraidon's abilities but do not become Bag ingredients."
  },
  {
    question:
      "Can every 5-star raid drop Herba Mystica?",
    answer:
      "No. Herba Mystica rewards depend on the raid boss reward pool. Check the boss before assuming it can drop a herb."
  },
  {
    question:
      "Can every raid drop every flavor?",
    answer:
      "No. Different eligible raid bosses can have different possible Herba Mystica flavors."
  },
  {
    question: "Which flavor is best?",
    answer:
      "It depends on the recipe. Salty Herba Mystica is often convenient for popular sandwich recipes, but exact recipes may require different flavors."
  },
  {
    question: "Are Herba Mystica repeatable?",
    answer:
      "Raid rewards and hard-difficulty Ogre Oustin' rewards are repeatable. Special coach rewards are finite."
  },
  {
    question: "Do I need DLC?",
    answer:
      "You do not need DLC for basic high-star Tera Raid farming, but Ogre Oustin' requires The Teal Mask and League Club coach rewards require The Indigo Disk."
  },
  {
    question: "What are Herba Mystica used for?",
    answer:
      "They are rare sandwich ingredients used in high-level recipes for powers such as Sparkling Power, Encounter Power, Title Power, Humungo Power, Teensy Power, and Raid Power."
  },
  {
    question:
      "Can story Herba Mystica be used in sandwiches?",
    answer:
      "No. Only the usable Bag items from sources such as eligible raids can be used as sandwich ingredients."
  }
];

function TextLink({
  children,
  to
}) {
  return to ? (
    <Link to={to}>{children}</Link>
  ) : (
    <span>{children}</span>
  );
}

function TitanLinks({
  titan
}) {
  if (titan.links?.length > 0) {
    return titan.links.map((link, index) => (
      <span key={link.to}>
        {index > 0 ? " or " : ""}
        <TextLink to={link.to}>
          {link.label}
        </TextLink>
      </span>
    ));
  }

  return (
    <TextLink to={titan.to}>
      {titan.name}
    </TextLink>
  );
}

function CardGrid({
  children
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: "1rem",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(220px, 1fr))"
      }}
    >
      {children}
    </div>
  );
}

function InfoCard({
  children
}) {
  return (
    <article
      style={{
        border: "1px solid #666",
        borderRadius: "8px",
        padding: "1rem",
        textAlign: "left"
      }}
    >
      {children}
    </article>
  );
}

function HerbaMysticaGuide() {
  return (
    <main
      style={{
        margin: "0 auto",
        maxWidth: "1040px",
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
          lineHeight: 1.6,
          margin: "0 auto 2rem",
          maxWidth: "780px"
        }}
      >
        {topic.introText}
      </p>

      <section>
        <h2>Overview</h2>
        <p>
          Herba Mystica are rare sandwich ingredients in{" "}
          <strong>Pokemon Scarlet</strong> and{" "}
          <strong>Pokemon Violet</strong>. Usable Herba Mystica
          are especially valuable for high-level sandwich recipes
          and powers such as Sparkling Power, Encounter Power,
          Title Power, Humungo Power, Teensy Power, and Raid
          Power.
        </p>

        <CardGrid>
          {flavors.map(flavor => (
            <InfoCard key={flavor.slug}>
              <h3>
                <Link to={`/item/${flavor.slug}`}>
                  {flavor.name}
                </Link>
              </h3>
              <p>{flavor.role}</p>
            </InfoCard>
          ))}
        </CardGrid>
      </section>

      <section>
        <h2>Story Herbs vs. Usable Items</h2>
        <p>
          The Herba Mystica found during the Path of Legends
          Titan storyline are not added to your Bag as usable
          sandwich ingredients. Arven uses those story herbs
          immediately, and they restore Koraidon or Miraidon's
          travel abilities.
        </p>

        <CardGrid>
          {flavors.map(flavor => (
            <InfoCard key={`story-${flavor.slug}`}>
              <h3>{flavor.name}</h3>
              <p>
                Titan: <TitanLinks titan={flavor.titan} />
              </p>
              <p>
                Location:{" "}
                <TextLink to={flavor.location.to}>
                  {flavor.location.name}
                </TextLink>
              </p>
            </InfoCard>
          ))}
        </CardGrid>

        <p
          style={{
            fontWeight: 700
          }}
        >
          The story herbs restore Koraidon or Miraidon's abilities
          but do not become usable Bag items.
        </p>
      </section>

      <section>
        <h2>How to Unlock Usable Herba Mystica</h2>
        <p>
          Usable Herba Mystica become available primarily through
          eligible high-level Tera Raid Battles, not directly from
          the Titan storyline. Five-star raids begin appearing
          after you complete the main story. Six-star raids are
          unlocked later, after post-game progression such as the
          Academy Ace Tournament and additional high-star raid
          activity that leads to Jacq's warning call.
        </p>
      </section>

      <section>
        <h2>Tera Raid Sources</h2>
        <p>
          Usable Herba Mystica can be possible rewards from
          eligible 5-star raids, 6-star raids, and selected
          7-star event raids when those events are active. Not
          every raid boss can drop Herba Mystica, and not every
          eligible raid boss can drop every flavor.
        </p>
        <p>
          The important farming rule is to check the specific raid
          boss reward pool. This guide avoids duplicating a large
          boss-by-boss table until the site has a verified shared
          raid-drop dataset.
        </p>
      </section>

      <section>
        <h2>Other Sources</h2>
        <CardGrid>
          <InfoCard>
            <h3>Hard-Difficulty Ogre Oustin'</h3>
            <p>
              In The Teal Mask, hard-difficulty Ogre Oustin' can
              reward Herba Mystica as a random repeatable reward.
              The flavor is not guaranteed, so treat this as a
              bonus farming route rather than a targeted flavor
              source.
            </p>
          </InfoCard>

          <InfoCard>
            <h3>
              <Link to="/location/league-club-room">
                League Club Room
              </Link>{" "}
              Coach Rewards
            </h3>
            <p>
              In The Indigo Disk, selected special coach
              interactions give finite Herba Mystica rewards.
              These are useful, but they are not repeatable
              farming sources.
            </p>
            <ul>
              {coachRewards.map(([coach, slug, item]) => (
                <li key={coach}>
                  {coach} - three{" "}
                  <Link to={`/item/${slug}`}>{item}</Link>
                </li>
              ))}
            </ul>
          </InfoCard>
        </CardGrid>
      </section>

      <section>
        <h2>Flavor Comparison</h2>
        <CardGrid>
          {flavors.map(flavor => (
            <InfoCard key={`compare-${flavor.slug}`}>
              <h3>
                <Link to={`/item/${flavor.slug}`}>
                  {flavor.name}
                </Link>
              </h3>
              <p>
                <strong>Story Titan:</strong>{" "}
                <TitanLinks titan={flavor.titan} />
              </p>
              <p>
                <strong>Story Location:</strong>{" "}
                <TextLink to={flavor.location.to}>
                  {flavor.location.name}
                </TextLink>
              </p>
              <p>
                <strong>Usable Acquisition:</strong> Eligible
                high-star Tera Raid rewards, hard Ogre Oustin',
                and one finite League Club coach reward.
              </p>
              <p>
                <strong>Common Sandwich Role:</strong>{" "}
                {flavor.role}
              </p>
            </InfoCard>
          ))}
        </CardGrid>
      </section>

      <section>
        <h2>Farming Tips</h2>
        <ul
          style={{
            lineHeight: 1.7,
            textAlign: "left"
          }}
        >
          <li>
            Focus on eligible high-star raids rather than the
            Titan storyline.
          </li>
          <li>
            Check the raid boss reward pool before assuming a boss
            can drop Herba Mystica.
          </li>
          <li>
            Use repeatable sources, especially eligible raids, for
            long-term farming.
          </li>
          <li>
            Treat coach rewards as useful finite bonuses, not
            repeatable farming routes.
          </li>
          <li>
            Save rare flavors for recipes that specifically call
            for them.
          </li>
          <li>
            Separate broad sandwich farming advice from exact
            recipe requirements; different recipes may need
            different flavor combinations.
          </li>
        </ul>
      </section>

      <section>
        <h2>Frequently Asked Questions</h2>
        <div
          style={{
            display: "grid",
            gap: "1rem"
          }}
        >
          {faqs.map(faq => (
            <InfoCard key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </InfoCard>
          ))}
        </div>
      </section>
    </main>
  );
}

export default HerbaMysticaGuide;
