import {
  useEffect,
  useMemo,
  useState
} from "react";
import { Link } from "react-router-dom";
import CollapsibleSection from "../components/CollapsibleSection";
import LinkedPokeloreText from "../components/LinkedPokeloreText";
import useQueryParamState from "../hooks/useQueryParamState";
import usePokeloreLinkTargets from "../hooks/usePokeloreLinkTargets";
import Seo from "../seo/Seo";
import { evTrainingRoutesSeo } from "../seo/seoConfig";
import { readJsonFile } from "../utils/readJsonFile";

const DEFAULT_STAT = "hp";
const DEFAULT_VERSION = "platinum";
const ENABLED_VALUE = "enabled";
const DISABLED_VALUE = "disabled";
const DEFAULT_STATS = [
  {
    key: "hp",
    label: "HP"
  },
  {
    key: "attack",
    label: "Attack"
  },
  {
    key: "defense",
    label: "Defense"
  },
  {
    key: "specialAttack",
    label: "Sp. Atk"
  },
  {
    key: "specialDefense",
    label: "Sp. Def"
  },
  {
    key: "speed",
    label: "Speed"
  }
];

function getBrowserInitialData() {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    window.__POKELORE_EV_TRAINING_ROUTES__ ?? null
  );
}

function getBrowserInitialLinkTargets() {
  if (typeof window === "undefined") {
    return [];
  }

  return Array.isArray(
    window.__POKELORE_LINK_TARGETS__
  )
    ? window.__POKELORE_LINK_TARGETS__
    : [];
}

function formatName(value = "") {
  return String(value)
    .split("-")
    .filter(Boolean)
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function formatChance(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0%";
  }

  return `${Number.isInteger(number) ? number : number.toFixed(1)}%`;
}

function formatExpectedEv(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toFixed(
    number >= 1 ? 2 : 3
  );
}

function formatEncounterCount(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return "-";
  }

  return number.toLocaleString();
}

function encountersForMaxEv(expectedEvPerEncounter) {
  const number = Number(expectedEvPerEncounter);

  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }

  return Math.ceil(252 / number);
}

function formatLevelRange(pokemon) {
  if (
    pokemon.minLevel === null &&
    pokemon.maxLevel === null
  ) {
    return null;
  }

  if (
    pokemon.minLevel === pokemon.maxLevel
  ) {
    return `Lv. ${pokemon.minLevel}`;
  }

  return `Lv. ${pokemon.minLevel}-${pokemon.maxLevel}`;
}

function formatYield(evYieldBreakdown = []) {
  return evYieldBreakdown
    .map(
      entry =>
        `${entry.value} ${entry.label}`
    )
    .join(", ");
}

function normalizeRouteAreaName(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/\broad\b/g, "route")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function routeSubtitle(route) {
  const locationName = normalizeRouteAreaName(
    route.locationDisplayName
  );
  const areaName = normalizeRouteAreaName(
    route.areaDisplayName
  );
  const shouldShowArea =
    areaName && areaName !== locationName;

  return [
    route.regionDisplayName,
    shouldShowArea ? route.areaDisplayName : null
  ]
    .filter(Boolean)
    .join(" - ");
}

function SelectField({
  id,
  label,
  onChange,
  value,
  children
}) {
  return (
    <div
      className="ev-training-filter-field"
      style={{
        alignItems: "center",
        display: "grid",
        gap: ".6rem",
        gridTemplateColumns:
          "max-content minmax(130px, 180px)",
        textAlign: "left"
      }}
    >
      <span
        className="ev-training-filter-label"
        id={`${id}-label`}
        style={{
          color: "var(--text-h)",
          fontWeight: 700
        }}
      >
        {label}
      </span>

      <select
        className="ev-training-filter-select"
        id={id}
        aria-labelledby={`${id}-label`}
        value={value}
        onChange={event =>
          onChange(event.target.value)
        }
        style={{
          backgroundColor: "#202129",
          border: "1px solid #4b5563",
          borderRadius: "8px",
          color: "white",
          fontSize: ".95rem",
          minWidth: 0,
          padding: ".55rem .7rem",
          width: "100%"
        }}
      >
        {children}
      </select>
    </div>
  );
}

function EncounterStatsPanel({
  evMultiplier,
  route,
  statLabel
}) {
  const adjustedExpectedEv =
    route.expectedEvPerEncounter * evMultiplier;
  const adjustedEncountersForMaxEv =
    encountersForMaxEv(adjustedExpectedEv);
  const rows = [
    [
      `+${statLabel} Chance`,
      formatChance(route.targetChance)
    ],
    [
      `+${statLabel} Purity`,
      formatChance(route.cleanTargetChance)
    ],
    [
      "EV/Encounter",
      formatExpectedEv(adjustedExpectedEv)
    ],
    [
      "Encounters To 252",
      formatEncounterCount(adjustedEncountersForMaxEv)
    ]
  ];

  return (
    <aside
      className="ev-training-route-stats"
      aria-label={`${route.locationDisplayName} encounter stats`}
      style={{
        display: "grid",
        columnGap: "1.5rem",
        rowGap: ".2rem",
        gridTemplateColumns:
          "repeat(2, minmax(140px, 1fr))",
        justifySelf: "end",
        minWidth: "360px",
        paddingTop: ".25rem",
        width: "min(100%, 520px)"
      }}
    >
      {rows.map(([label, value]) => (
        <div
          className="ev-training-stat-row"
          key={label}
          style={{
            alignItems: "baseline",
            display: "grid",
            gap: ".75rem",
            gridTemplateColumns:
              "minmax(0, 1fr) auto",
            lineHeight: 1.35
          }}
        >
          <span
            style={{
              color: "var(--text)",
              fontSize: ".78rem",
              fontWeight: 500
            }}
          >
            {label}
          </span>
          <strong
            style={{
              color: "var(--text-h)",
              fontSize: ".86rem",
              fontVariantNumeric:
                "tabular-nums",
              fontWeight: 600,
              whiteSpace: "nowrap"
            }}
          >
            {value}
          </strong>
        </div>
      ))}
    </aside>
  );
}

function HowToUseSection() {
  const [expanded, setExpanded] =
    useState(false);
  const terms = [
    {
      term: "Stat chance",
      description:
        "The share of battles in this encounter table that give the EV stat you selected."
    },
    {
      term: "Stat Purity",
      description:
        "The share of battles that give only the selected EV stat, without unwanted EVs in another stat."
    },
    {
      term: "EV per encounter",
      description:
        "The average selected-stat EVs you should expect from each wild battle in that setup."
    },
    {
      term: "Encounter rate",
      description:
        "How often the game rolls a wild encounter for that method or area, when that data is available."
    }
  ];

  return (
    <CollapsibleSection
      id="ev-training-how-to-use"
      title="How To Use This Tool"
      expanded={expanded}
      titleColor="var(--link-unvisited)"
      titleChevron={true}
      onToggle={() =>
        setExpanded(current => !current)
      }
      style={{
        backgroundColor: "#1b1c23",
        border: "1px solid #343844",
        borderRadius: "8px",
        marginBottom: 0,
        padding: ".6rem"
      }}
      contentStyle={{
        display: "grid",
        gap: "1rem",
        marginTop: ".75rem"
      }}
    >
      <div
        itemScope
        itemType="https://schema.org/Question"
      >
        <meta
          itemProp="name"
          content="How do you use the EV training locations calculator?"
        />
        <p>
          <span
            itemProp="acceptedAnswer"
            itemScope
            itemType="https://schema.org/Answer"
          >
            <span itemProp="text">
              Pick the EV stat you want to train, then
              pick your game. The tool compares Pokemon
              EV yields against repeatable wild encounter
              tables and shows the top ten training
              locations. Gen I-II games use the older
              stat experience system instead of modern EV
              training. Enable Macho Brace or Pokerus if
              your Pokemon has those EV multipliers
              active, or to see how they would affect
              your training.
            </span>
          </span>
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: ".75rem",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))"
        }}
      >
        {terms.map(item => (
          <div
            key={item.term}
            style={{
              border: "1px solid #3f4350",
              borderRadius: "8px",
              padding: ".85rem"
            }}
          >
            <strong
              style={{
                color: "var(--text-h)",
                display: "block",
                marginBottom: ".35rem"
              }}
            >
              {item.term}
            </strong>
            <p
              style={{
                fontSize: ".94rem",
                lineHeight: 1.45
              }}
            >
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

function GuideSection({
  title,
  children
}) {
  return (
    <section
      style={{
        display: "grid",
        gap: ".75rem"
      }}
    >
      <h2
        style={{
          letterSpacing: 0,
          marginBottom: 0
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function GuideSubsection({
  title,
  children
}) {
  return (
    <section
      style={{
        display: "grid",
        gap: ".5rem"
      }}
    >
      <h3
        style={{
          color: "var(--text-h)",
          fontSize: "1.1rem",
          margin: 0
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function GuideCard({
  title,
  children
}) {
  return (
    <div
      style={{
        border: "1px solid #3f4350",
        borderRadius: "8px",
        display: "grid",
        gap: ".5rem",
        padding: "1rem"
      }}
    >
      <strong
        style={{
          color: "var(--text-h)"
        }}
      >
        {title}
      </strong>
      {children}
    </div>
  );
}

function GuideText({
  as = "p",
  children,
  linkTargets,
  usedRoutes
}) {
  const Component = as;

  return (
    <Component>
      <LinkedPokeloreText
        text={children}
        linkTargets={linkTargets}
        usedRoutes={usedRoutes}
      />
    </Component>
  );
}

function EvTrainingGuideSection({
  initialLinkTargets = []
}) {
  const linkTargets =
    usePokeloreLinkTargets(initialLinkTargets);
  const itemLinkTargets = useMemo(
    () =>
      linkTargets.filter(
        target => target.category === "item"
      ),
    [linkTargets]
  );
  const usedLinkRoutes = new Set();
  const powerItems = [
    ["Power Weight", "HP"],
    ["Power Bracer", "Attack"],
    ["Power Belt", "Defense"],
    ["Power Lens", "Special Attack"],
    ["Power Band", "Special Defense"],
    ["Power Anklet", "Speed"]
  ];
  const routeQualities = [
    "A high encounter chance for Pokemon giving the desired EV",
    "Few or no Pokemon giving unwanted EVs",
    "Low-level Pokemon that can be defeated quickly",
    "Easy access to encounters and healing",
    "Special methods such as Horde or SOS Battles when available"
  ];
  const generationNotes = [
    {
      title: "Generation I - Red, Blue, and Yellow",
      body:
        "These games use Stat Experience rather than modern EVs. Defeating a Pokemon adds points to every stat based on that species' base stats, and every stat can eventually be maximized."
    },
    {
      title: "Generation II - Gold, Silver, and Crystal",
      body:
        "Generation II keeps Stat Experience. Special Attack and Special Defense share one Special value, and Pokerus can double Stat Experience gained through battles."
    },
    {
      title:
        "Generation III - Ruby, Sapphire, Emerald, FireRed, and LeafGreen",
      body:
        "Generation III introduces the modern EV system: 510 total EVs, 255 in a single stat, and Pokemon usually awarding 1, 2, or 3 EVs in specific stats."
    },
    {
      title:
        "Generation IV - Diamond, Pearl, Platinum, HeartGold, and SoulSilver",
      body:
        "Generation IV keeps the modern limits and adds Power Items, which add 4 EVs in the item's stat each time the holder earns EVs from battle."
    },
    {
      title: "Generation V - Black, White, Black 2, and White 2",
      body:
        "Generation V adds Wings, lets Level 100 Pokemon gain EVs from battle, and recalculates stat changes after battle rather than waiting for another level-up."
    },
    {
      title: "Generation VI - X, Y, Omega Ruby, and Alpha Sapphire",
      body:
        "Generation VI changes the individual stat cap to 252 EVs and introduces Super Training. Horde Encounters can be especially fast because five Pokemon can award EVs in one battle."
    },
    {
      title:
        "Generation VII - Sun, Moon, Ultra Sun, and Ultra Moon",
      body:
        "Power Items increase from +4 to +8 EVs. SOS Battles can be extremely efficient because ally Pokemon award double their normal EV yield."
    },
    {
      title:
        "Pokemon: Let's Go, Pikachu! and Let's Go, Eevee!",
      body:
        "The Let's Go games replace traditional EV training with Awakening Values, raised with candy. Traditional EV-training routes do not apply to those games."
    },
    {
      title:
        "Generation VIII - Sword, Shield, Brilliant Diamond, and Shining Pearl",
      body:
        "These games use the familiar 252-per-stat and 510-total EV system. Vitamins can now raise a stat all the way to 252 EVs."
    },
    {
      title: "Pokemon Legends: Arceus",
      body:
        "Legends: Arceus uses Effort Levels raised mainly with Grit items, so normal EV-training routes are not needed for raising battle stats."
    },
    {
      title: "Generation IX - Scarlet and Violet",
      body:
        "Scarlet and Violet use the modern EV system with +8 Power Items. Pokerus has no effect, and Let's Go Auto Battles do not award EVs."
    }
  ];

  return (
    <section
      aria-labelledby="ev-training-guide"
      style={{
        backgroundColor: "#1b1c23",
        border: "1px solid #343844",
        borderRadius: "8px",
        display: "grid",
        gap: "1.5rem",
        padding: "1.25rem"
      }}
    >
      <header>
        <h2
          id="ev-training-guide"
          style={{
            letterSpacing: 0,
            marginBottom: ".5rem"
          }}
        >
          EV Training Guide
        </h2>
        <GuideText
          linkTargets={itemLinkTargets}
          usedRoutes={usedLinkRoutes}
        >
          Use the route finder above to choose a game and stat, then use this guide to understand what EVs are and how battle training changes between generations.
        </GuideText>
      </header>

      <GuideSection title="What Are EVs?">
        <GuideText
          linkTargets={itemLinkTargets}
          usedRoutes={usedLinkRoutes}
        >
          Effort Values, usually called EVs, are hidden points that make a Pokemon's stats stronger through training. In most Pokemon games, defeating a Pokemon awards EVs in one or more stats: HP, Attack, Defense, Special Attack, Special Defense, or Speed.
        </GuideText>
        <GuideText
          linkTargets={itemLinkTargets}
          usedRoutes={usedLinkRoutes}
        >
          Different species give different EVs, so choosing what you battle lets you deliberately train particular stats. For example, a Pokemon that gives 1 Speed EV adds one point toward your Pokemon's Speed investment each time it is defeated.
        </GuideText>
      </GuideSection>

      <GuideSection title="How Much Do EVs Increase A Stat?">
        <GuideText
          linkTargets={itemLinkTargets}
          usedRoutes={usedLinkRoutes}
        >
          From Generation III onward, every 4 EVs in a stat are worth 1 additional stat point at Level 100. At lower levels, the increase is scaled according to level.
        </GuideText>
        <GuideText
          linkTargets={itemLinkTargets}
          usedRoutes={usedLinkRoutes}
        >
          A Pokemon can have 510 EVs in total. Since Generation VI, an individual stat can hold a maximum of 252 EVs, which is enough for 63 additional points at Level 100 before Nature is taken into account.
        </GuideText>
        <GuideCard title="Common EV Spread">
          <GuideText
            linkTargets={itemLinkTargets}
            usedRoutes={usedLinkRoutes}
          >
            252 / 252 / 4 fully trains two stats and puts the remaining useful EVs into a third stat.
          </GuideText>
        </GuideCard>
      </GuideSection>

      <GuideSection title="How EV Training Through Battles Works">
        <GuideText
          linkTargets={itemLinkTargets}
          usedRoutes={usedLinkRoutes}
        >
          Every Pokemon has an EV yield. Defeat a Pokemon that gives Attack EVs and your Pokemon gains Attack EVs; defeat one that gives Speed EVs and it gains Speed EVs instead.
        </GuideText>
        <GuideText
          linkTargets={itemLinkTargets}
          usedRoutes={usedLinkRoutes}
        >
          From Generation III onward, EVs are not divided between Pokemon the way experience may be. Pokemon eligible to receive EVs receive the appropriate yield themselves. From Generation VI onward, party-wide Exp. Share can also award EVs to Pokemon that did not directly enter battle.
        </GuideText>
        <GuideCard title="Good EV Training Spots Usually Have">
          <ul
            style={{
              margin: 0,
              paddingLeft: "1.25rem"
            }}
          >
            {routeQualities.map(quality => (
              <GuideText
                as="li"
                key={quality}
                linkTargets={itemLinkTargets}
                usedRoutes={usedLinkRoutes}
              >
                {quality}
              </GuideText>
            ))}
          </ul>
        </GuideCard>
      </GuideSection>

      <GuideSection title="Items That Make EV Training Faster">
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(240px, 1fr))"
          }}
        >
          <GuideCard title="Power Items">
            <GuideText
              linkTargets={itemLinkTargets}
              usedRoutes={usedLinkRoutes}
            >
              Beginning in Generation IV, Power Items add EVs in a specific stat whenever the holder earns EVs from battle.
            </GuideText>
            <ul
              style={{
                margin: 0,
                paddingLeft: "1.25rem"
              }}
            >
              {powerItems.map(([item, stat]) => (
                <li key={item}>
                  <strong>
                    <LinkedPokeloreText
                      text={item}
                      linkTargets={itemLinkTargets}
                      usedRoutes={usedLinkRoutes}
                    />
                    :
                  </strong>{" "}
                  {stat}
                </li>
              ))}
            </ul>
            <GuideText
              linkTargets={itemLinkTargets}
              usedRoutes={usedLinkRoutes}
            >
              They add +4 EVs in Generations IV-VI and +8 EVs from Generation VII onward.
            </GuideText>
          </GuideCard>

          <GuideCard title="Macho Brace">
            <GuideText
              linkTargets={itemLinkTargets}
              usedRoutes={usedLinkRoutes}
            >
              The Macho Brace doubles EVs earned through battle while held, although it temporarily halves the holder's Speed during battle.
            </GuideText>
          </GuideCard>

          <GuideCard title="Pokerus">
            <GuideText
              linkTargets={itemLinkTargets}
              usedRoutes={usedLinkRoutes}
            >
              Pokerus normally doubles EVs earned through battle and can stack with Power Items or the Macho Brace. It has no effect in Pokemon Scarlet and Violet.
            </GuideText>
          </GuideCard>

          <GuideCard title="Vitamins And Feathers">
            <GuideText
              linkTargets={itemLinkTargets}
              usedRoutes={usedLinkRoutes}
            >
              Vitamins such as HP Up, Protein, Iron, Calcium, Zinc, and Carbos increase the matching stat's EVs by 10. Feathers or Wings add 1 EV and are useful for finishing precise spreads.
            </GuideText>
          </GuideCard>
        </div>
      </GuideSection>

      <GuideSection title="How EV Training Changed Between Generations">
        <div
          style={{
            display: "grid",
            gap: "1rem"
          }}
        >
          {generationNotes.map(note => (
            <GuideSubsection
              key={note.title}
              title={note.title}
            >
              <GuideText
                linkTargets={itemLinkTargets}
                usedRoutes={usedLinkRoutes}
              >
                {note.body}
              </GuideText>
            </GuideSubsection>
          ))}
        </div>
      </GuideSection>

      <GuideSection title="Which Pokemon Should I Battle?">
        <GuideText
          linkTargets={itemLinkTargets}
          usedRoutes={usedLinkRoutes}
        >
          The best Pokemon to defeat depends on the game, the stat you want to train, encounter rates, and available training mechanics. That is what the EV training calculator above is designed to solve: select your game and target stat to find locations where the encounter pool is favorable while minimizing unwanted EVs.
        </GuideText>
      </GuideSection>
    </section>
  );
}

function PokemonRow({
  pokemon
}) {
  const levelRange =
    formatLevelRange(pokemon);

  return (
    <Link
      to={`/pokemon/${pokemon.id}`}
      style={{
        alignItems: "center",
        borderTop: "1px solid #2f323d",
        color: "inherit",
        display: "grid",
        gap: ".75rem",
        gridTemplateColumns:
          "42px minmax(0, 1fr) auto",
        padding: ".7rem 0",
        textDecoration: "none"
      }}
    >
      {pokemon.sprite ? (
        <img
          src={pokemon.sprite}
          alt=""
          loading="lazy"
          style={{
            height: "42px",
            objectFit: "contain",
            width: "42px"
          }}
        />
      ) : (
        <span />
      )}

      <span
        style={{
          minWidth: 0,
          textAlign: "left"
        }}
      >
        <strong
          style={{
            color: "var(--text-h)",
            display: "block",
            overflowWrap: "anywhere"
          }}
        >
          {pokemon.displayName}
        </strong>
        <small>
          {formatYield(
            pokemon.evYieldBreakdown
          )}
          {levelRange
            ? ` - ${levelRange}`
            : ""}
        </small>
      </span>

      <span
        style={{
          color: "var(--text-h)",
          fontVariantNumeric:
            "tabular-nums",
          fontWeight: 700,
          whiteSpace: "nowrap"
        }}
      >
        {formatChance(pokemon.chance)}
      </span>
    </Link>
  );
}

function RouteCard({
  evMultiplier,
  route,
  statLabel
}) {
  const encounterRateText =
    route.encounterRate === null
      ? null
      : `${formatChance(route.encounterRate)} encounter rate`;

  return (
    <article
      className="ev-training-route-card"
      style={{
        backgroundColor: "#202129",
        border: "1px solid #3f4350",
        borderRadius: "8px",
        display: "grid",
        gap: "1rem",
        padding: "1rem",
        textAlign: "left"
      }}
    >
      <div
        className="ev-training-route-card-top"
        style={{
          alignItems: "start",
          display: "grid",
          gap: "1rem",
          gridTemplateColumns:
            "minmax(0, 1fr) minmax(210px, max-content)"
        }}
      >
        <div
          className="ev-training-route-heading"
          style={{
            alignItems: "start",
            display: "grid",
            gap: ".75rem",
            gridTemplateColumns:
              "auto minmax(0, 1fr)"
          }}
        >
          <span
            aria-label={`Rank ${route.rank}`}
            style={{
              alignItems: "center",
              backgroundColor: "#fab856",
              borderRadius: "999px",
              color: "#181818",
              display: "inline-flex",
              fontWeight: 800,
              height: "2rem",
              justifyContent: "center",
              width: "2rem"
            }}
          >
            {route.rank}
          </span>

          <div>
            <h2
              style={{
                letterSpacing: 0,
                marginBottom: ".25rem",
                overflowWrap: "anywhere"
              }}
            >
              <Link
                to={`/location/${route.locationName}`}
              >
                {route.locationDisplayName}
              </Link>
            </h2>
            <p
              style={{
                opacity: 0.86
              }}
            >
              {routeSubtitle(route)}
            </p>
            <p
              style={{
                marginTop: ".85rem"
              }}
            >
              {formatName(route.method)}
              {encounterRateText &&
                ` - ${encounterRateText}`}
              {route.conditions.length > 0 &&
                ` - ${route.conditions
                  .map(formatName)
                  .join(", ")}`}
            </p>
          </div>
        </div>

        <EncounterStatsPanel
          evMultiplier={evMultiplier}
          route={route}
          statLabel={statLabel}
        />
      </div>

      <div>
        {route.pokemon.map(pokemon => (
          <PokemonRow
            key={pokemon.id}
            pokemon={pokemon}
          />
        ))}
      </div>
    </article>
  );
}

function EvTrainingRoutesPage({
  initialData,
  initialLinkTargets
} = {}) {
  const initialRouteData =
    initialData ?? getBrowserInitialData();
  const initialGuideLinkTargets =
    initialLinkTargets ??
    getBrowserInitialLinkTargets();
  const [data, setData] =
    useState(initialRouteData);
  const [loading, setLoading] =
    useState(
      !initialRouteData ||
        initialRouteData.isPartial === true
    );
  const [loadError, setLoadError] =
    useState(false);
  const [selectedStat, setSelectedStat] =
    useQueryParamState(
      "stat",
      DEFAULT_STAT
    );
  const [
    selectedVersion,
    setSelectedVersion
  ] = useQueryParamState(
    "version",
    DEFAULT_VERSION
  );
  const [
    selectedMachoBrace,
    setSelectedMachoBrace
  ] = useQueryParamState(
    "machoBrace",
    DISABLED_VALUE
  );
  const [
    selectedPokerus,
    setSelectedPokerus
  ] = useQueryParamState(
    "pokerus",
    DISABLED_VALUE
  );

  useEffect(() => {
    async function loadData() {
      try {
        setLoadError(false);
        setLoading(true);
        const nextData =
          await readJsonFile(
            "/data/evTrainingRoutes.json",
            {
              required: true
            }
          );

        setData(nextData);
      } catch (error) {
        console.error(
          "Failed to load EV training routes:",
          error
        );
        setLoadError(true);
        setData(currentData =>
          currentData?.isPartial === true
            ? currentData
            : null
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const stats =
    data?.stats?.length > 0
      ? data.stats
      : DEFAULT_STATS;
  const versions =
    data?.versions?.length > 0
      ? data.versions
      : [
          {
            version: DEFAULT_VERSION,
            displayName: formatName(DEFAULT_VERSION)
          }
        ];
  const activeStat =
    stats.some(
      stat => stat.key === selectedStat
    )
      ? selectedStat
      : stats[0]?.key ?? DEFAULT_STAT;
  const activeVersion =
    versions.some(
      version =>
        version.version === selectedVersion
    )
      ? selectedVersion
      : versions.find(
          version =>
            version.version ===
            DEFAULT_VERSION
        )?.version ??
        versions[0]?.version ??
        DEFAULT_VERSION;
  const activeStatLabel =
    stats.find(stat => stat.key === activeStat)
      ?.label ?? formatName(activeStat);
  const activeMachoBrace =
    selectedMachoBrace === ENABLED_VALUE
      ? ENABLED_VALUE
      : DISABLED_VALUE;
  const activePokerus =
    selectedPokerus === ENABLED_VALUE
      ? ENABLED_VALUE
      : DISABLED_VALUE;
  const evMultiplier =
    (activeMachoBrace === ENABLED_VALUE ? 2 : 1) *
    (activePokerus === ENABLED_VALUE ? 2 : 1);
  const routes = useMemo(
    () =>
      data?.routesByVersion?.[
        activeVersion
      ]?.[activeStat] ?? [],
    [data, activeStat, activeVersion]
  );
  const waitingForFullRouteData =
    data?.isPartial === true &&
    routes.length === 0 &&
    !loadError;

  return (
    <main
      id="ev-training-routes-tool"
      style={{
        boxSizing: "border-box",
        display: "grid",
        gap: "1.5rem",
        margin: "0 auto",
        maxWidth: "1080px",
        padding: "2rem",
        textAlign: "left",
        width: "100%"
      }}
    >
      <Seo {...evTrainingRoutesSeo()} />

      <header>
        <h1
          style={{
            letterSpacing: 0,
            lineHeight: 1.32,
            marginBottom: ".75rem",
            textAlign: "center"
          }}
        >
          Best Pokémon EV Training Locations Calculator
        </h1>
        <p
          style={{
            margin: "0 auto",
            maxWidth: "760px",
            textAlign: "center"
          }}
        >
          Ranked by matching encounter chance, expected
          EV per encounter, and clean target-only chance.
        </p>
      </header>

      <section
        className="ev-training-filter-panel"
        aria-label="EV training filters"
        style={{
          alignItems: "end",
          backgroundColor: "#1b1c23",
          border: "1px solid #343844",
          borderRadius: "8px",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          justifyContent: "center",
          padding: "1rem"
        }}
      >
        <SelectField
          id="ev-training-stat"
          label="Stat"
          value={activeStat}
          onChange={setSelectedStat}
        >
          {stats.map(stat => (
            <option
              key={stat.key}
              value={stat.key}
            >
              {stat.label}
            </option>
          ))}
        </SelectField>

        <SelectField
          id="ev-training-version"
          label="Game"
          value={activeVersion}
          onChange={setSelectedVersion}
        >
          {versions.map(version => (
            <option
              key={version.version}
              value={version.version}
            >
              {version.displayName}
            </option>
          ))}
        </SelectField>

        <SelectField
          id="ev-training-macho-brace"
          label={
            <Link to="/item/macho-brace">
              Macho Brace
            </Link>
          }
          value={activeMachoBrace}
          onChange={setSelectedMachoBrace}
        >
          <option value={DISABLED_VALUE}>
            Disabled
          </option>
          <option value={ENABLED_VALUE}>
            Enabled
          </option>
        </SelectField>

        <SelectField
          id="ev-training-pokerus"
          label="Pokerus"
          value={activePokerus}
          onChange={setSelectedPokerus}
        >
          <option value={DISABLED_VALUE}>
            Disabled
          </option>
          <option value={ENABLED_VALUE}>
            Enabled
          </option>
        </SelectField>
      </section>

      <HowToUseSection />

      <section
        aria-live="polite"
        style={{
          display: "grid",
          gap: "1rem"
        }}
      >
        {(loading || waitingForFullRouteData) &&
        routes.length === 0 ? (
          <p
            style={{
              textAlign: "center"
            }}
          >
            Loading EV training locations...
          </p>
        ) : !data ||
          (loadError &&
            data?.isPartial === true &&
            routes.length === 0) ? (
          <p
            style={{
              textAlign: "center"
            }}
          >
            EV training data is unavailable.
          </p>
        ) : routes.length === 0 ? (
          <p
            style={{
              textAlign: "center"
            }}
          >
            No EV training routes found for this
            selection.
          </p>
        ) : (
          routes.map(route => (
            <RouteCard
              key={`${route.locationName}-${route.areaName}-${route.method}-${route.conditions.join("-")}`}
              evMultiplier={evMultiplier}
              route={route}
              statLabel={activeStatLabel}
            />
          ))
        )}
      </section>

      <EvTrainingGuideSection
        initialLinkTargets={initialGuideLinkTargets}
      />
    </main>
  );
}

export default EvTrainingRoutesPage;
