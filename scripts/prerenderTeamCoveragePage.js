import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);
const repoRoot = path.resolve(__dirname, "..");
const distDir = path.join(repoRoot, "dist");
const indexPath = path.join(distDir, "index.html");
const outputDir = path.join(
  distDir,
  "team-coverage"
);
const outputPath = path.join(
  outputDir,
  "index.html"
);

const title =
  "Pokémon Team Builder & Type Coverage Calculator | PokéLore";
const description =
  "Build a Pokémon playthrough team for any game. Check offensive coverage, weaknesses, resistances, learnset levels and TM moves, then find suggested teammates that fill your team's gaps.";
const canonical =
  "https://pokelore.net/team-coverage";
const calculatorId =
  `${canonical}#team-coverage-calculator`;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: title,
        description,
        mainEntity: {
          "@id": calculatorId
        }
      },
      {
        "@type": "WebApplication",
        "@id": calculatorId,
        name:
          "Pokémon Team Builder & Type Coverage Calculator",
        url: canonical,
        applicationCategory: "GameApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        description,
        featureList: [
          "Choose a Pokémon game version for playthrough team building.",
          "Build a six-Pokémon party and calculate offensive type coverage.",
          "Check team weaknesses, resistances, and immunities.",
          "Filter learnset coverage by move power, learned level, and TM moves.",
          "Identify missing offensive and defensive coverage.",
          "Suggest available teammates that fill the team's gaps.",
          "Sort suggestions with PokeLore Suggested, coverage, stats, or National Dex number.",
          "Filter suggested teammates by legendary and trade evolution availability."
        ],
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD"
        }
      }
    ]
  };
}

function buildCriticalCss() {
  return `
    <style data-pokelore-team-coverage-prerender>
      #root {
        background: #16171d;
        color: #d1d5db;
        font-family: system-ui, "Segoe UI", Roboto, sans-serif;
      }

      .prerender-team-coverage-shell {
        box-sizing: border-box;
        margin: 0 auto;
        max-width: 1180px;
        min-height: 100svh;
        padding: 2rem 1rem 3rem;
        text-align: center;
      }

      .prerender-team-coverage-hero {
        margin: 0 auto 2rem;
        max-width: 760px;
      }

      .prerender-team-coverage-hero h1 {
        color: #f3f4f6;
        font-size: clamp(2.15rem, 7vw, 4rem);
        font-weight: 500;
        line-height: 1.12;
        margin: 0 0 1rem;
      }

      .prerender-team-coverage-hero p,
      .prerender-team-coverage-panel p,
      .prerender-team-coverage-explainer p {
        line-height: 1.65;
      }

      .prerender-team-coverage-hero p {
        color: #f3f4f6;
        font-size: 1.05rem;
        margin: 0;
      }

      .prerender-team-coverage-panel {
        background: rgba(32, 32, 32, 0.9);
        border: 1px solid #555;
        border-radius: 8px;
        margin: 0 auto 2rem;
        max-width: 820px;
        padding: 1.25rem;
      }

      .prerender-team-coverage-panel h2 {
        color: #f3f4f6;
        font-size: 1.45rem;
        font-weight: 500;
        line-height: 1.22;
        margin: 0 0 0.75rem;
      }

      .prerender-team-coverage-panel p {
        margin: 0;
      }

      .prerender-team-coverage-explainer {
        border-top: 1px solid #555;
        margin: 2rem auto 0;
        max-width: 820px;
        padding-top: 1.5rem;
        text-align: left;
      }

      .prerender-team-coverage-explainer h2,
      .prerender-team-coverage-explainer h3 {
        color: #f3f4f6;
        line-height: 1.22;
        text-align: center;
      }

      .prerender-team-coverage-explainer h2 {
        font-size: 1.55rem;
        font-weight: 500;
        margin: 0 0 1rem;
      }

      .prerender-team-coverage-explainer h3 {
        font-size: 1.05rem;
        margin: 1.5rem 0 0.6rem;
      }

      .prerender-team-coverage-explainer p {
        margin: 0 0 0.85rem;
      }

      .prerender-team-coverage-explainer strong {
        color: #f3f4f6;
      }
    </style>`;
}

function buildShell() {
  return `
    <main class="prerender-team-coverage-shell">
      <section class="prerender-team-coverage-hero" aria-label="Pokemon team builder introduction">
        <h1>Pokémon Playthrough Team Builder</h1>
        <p>
          Build a team for the Pokémon game you're actually playing. Check
          offensive coverage, weaknesses, resistances and immunities, then find
          suggested teammates based on the Pokémon available in your game and
          the moves they can realistically learn.
        </p>
      </section>

      <section class="prerender-team-coverage-panel" id="team-coverage-calculator">
        <h2>Team Builder and Type Coverage Calculator</h2>
        <p>
          The interactive team builder loads here, letting you choose a game,
          add Pokémon to your party, filter learnsets by move power, level, and
          TM availability, then compare suggested teammates against your team's
          offensive and defensive needs.
        </p>
      </section>

      <article class="prerender-team-coverage-explainer">
        <h2>How the Pokémon Playthrough Team Builder Works</h2>
        <p>
          The Team Builder can be used to evaluate an entire playthrough team,
          but it is particularly useful when you already have several Pokémon
          picked and need to find the best teammate to fill the remaining gaps.
        </p>

        <h3>Your Team and Their Coverage</h3>
        <p>
          Each Pokémon on your team has its available level-up attack types
          displayed. These moves can be filtered by minimum <strong>Move
          Power</strong> and by the level at which they are learned.
        </p>
        <p>
          Set the <strong>Learned At</strong> level to something appropriate
          for where you are in your playthrough. If you are building a team for
          the Elite Four, for example, set it close to the level you expect
          your team to be when challenging the Pokémon League. If you are
          planning for the midgame, use a lower level that better reflects
          where your team currently is.
        </p>
        <p>
          This helps keep the coverage results realistic instead of counting
          powerful moves that your Pokémon will not actually learn until much
          later.
        </p>

        <h3>Offensive Coverage and Missing Offensive Coverage</h3>
        <p>
          <strong>Offensive Coverage</strong> shows which Pokémon types your
          team can hit for super-effective damage using the moves they can
          actually learn in your selected game. By default, this is based on
          level-up moves, but TM moves can also be included.
        </p>
        <p>
          This means offensive coverage is based on your Pokémon's actual
          learnsets rather than simply assuming they can cover types based on
          their own typing.
        </p>
        <p>
          If a type is not being covered when you think it should be, check
          your <strong>Learned At</strong> and <strong>Move Power</strong>
          settings. Earlier-generation Pokémon games often have much more
          limited level-up learnsets, so lowering or raising these filters can
          significantly change the results. For complete move information, see
          the individual Pokémon's detail page.
        </p>
        <p>
          The <strong>Missing Offensive Coverage</strong> section shows the
          types your current team cannot hit super effectively under your
          selected settings. Ideally, your team should be able to cover most
          types, but not every missing type is equally important. Pay particular
          attention to the Elite Four and Champion in the game you are playing,
          since having strong coverage against their teams can be much more
          valuable than filling an otherwise uncommon gap.
        </p>

        <h3>Defensive Coverage, Missing Coverage, and Weaknesses</h3>
        <p>
          <strong>Defensive Coverage</strong> shows which attacking types your
          team can resist or is immune to. If multiple team members resist the
          same type, those resistances stack in the display. The same is true
          for immunities and weaknesses.
        </p>
        <p>
          The <strong>Missing Defensive Coverage</strong> section identifies
          attack types for which your team has no resistance or immunity. This
          does not necessarily mean your team is weak to that type; it simply
          means you do not currently have a Pokémon that can comfortably switch
          into it based on typing alone.
        </p>
        <p>
          The <strong>Weaknesses</strong> section identifies attack types that
          can deal super-effective damage to members of your team. Stacking
          values make it easier to spot major shared weaknesses. When choosing
          another teammate, try to avoid adding another Pokémon that makes an
          already significant weakness even worse.
        </p>

        <h3>Suggested Teammates</h3>
        <p>
          PokeLore Suggested is designed for normal Pokémon game playthroughs
          rather than competitive battling. Availability, realistic learnsets,
          evolution requirements, type coverage, and usefulness during the
          story therefore matter more than competitive viability alone.
        </p>
        <p>
          The Team Builder is especially useful when you need one final Pokémon
          and are wondering <strong>what Pokémon you should add to your
          team</strong>. Suggested Teammates compares available Pokémon against
          the gaps in your current team and attempts to surface options that
          are both useful and realistically obtainable.
        </p>

        <h3>Understanding the Sort Modes</h3>
        <p>
          The default <strong>PokeLore Suggested</strong> sort considers how
          much useful offensive and defensive coverage a Pokémon can provide at
          your selected level. Pokémon found in the Regional Pokédex are
          strongly favored, helping keep recommendations focused on Pokémon you
          can realistically obtain during that game's playthrough.
        </p>
        <p>
          Trade evolutions and Legendary Pokémon are excluded from suggestions
          by default, but either can be included using the available filters. A
          Pokémon's level-up learnset in your selected game and its defensive
          typing are also major components of its recommendation score.
        </p>
        <p>
          Offensive and defensive coverage are the main drivers of most
          recommendations, but several other factors help refine the results.
          Base Stat Total (BST) plays a smaller role, primarily by pushing
          low-BST, unevolved Pokémon farther down the list while giving stronger
          Pokémon a modest boost. Pokémon known to be particularly strong
          playthrough choices may also receive a ranking boost even when their
          raw type coverage is somewhat lower.
        </p>
        <p>
          The highest-ranked Pokémon will not always be the absolute best
          choice for every playthrough. Some opposing types are much more
          important to cover in certain games than others. If your current team
          is missing a large amount of type coverage, powerful Pokémon with
          limited level-up coverage, such as Snorlax, may appear farther down
          the list. As your team's coverage becomes more complete, these
          powerful but less versatile Pokémon can begin ranking higher.
        </p>
        <p>
          Normal-type Pokémon are another good example. They can be extremely
          useful during a playthrough, but because Normal-type attacks cannot
          deal super-effective damage, they may contribute less to offensive
          type coverage than Pokémon of other types.
        </p>
        <p>
          <strong>Most Coverage</strong> focuses primarily on which Pokémon can
          fill the greatest number of your team's missing coverage needs.
          Factors such as BST are ignored. The <strong>Team Need</strong>
          dropdown can further focus the results on Offensive Coverage,
          Defensive Coverage, either one, or Pokémon that help with both.
        </p>
        <p>
          Stat-based sorts such as <strong>Highest BST</strong>,
          <strong>Highest Attack</strong>, and <strong>Highest Speed</strong>
          still limit the results to Pokémon that can help your team in some
          way, but prioritize the selected stat rather than overall coverage.
        </p>

        <h3>TM Coverage and Specific Types</h3>
        <p>
          Sometimes the best way to fix a missing type is not to add another
          Pokémon at all. One of your existing team members may be able to
          learn an appropriate TM. Set <strong>TM Learnsets</strong> to
          <strong>Include</strong> to factor available TM moves into the
          calculator's offensive coverage analysis.
        </p>
        <p>
          If you specifically need an answer to one troublesome Pokémon type,
          choose <strong>Selected Type First</strong> from the Sort dropdown. A
          <strong>Type</strong> dropdown will then appear, allowing you to
          prioritize suggested teammates that can help cover that particular
          type.
        </p>
      </article>
    </main>`;
}

function injectHeadTags(html) {
  const structuredData = JSON.stringify(
    buildStructuredData()
  );
  const tags = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <meta name="robots" content="max-image-preview:large">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <script id="seo-structured-data" type="application/ld+json">${structuredData}</script>
    ${buildCriticalCss()}
  `;

  return html
    .replace(
      /<title>.*?<\/title>/,
      ""
    )
    .replace(
      /<\/head>/,
      `${tags}\n  </head>`
    );
}

function main() {
  if (!fs.existsSync(indexPath)) {
    throw new Error(
      "dist/index.html not found. Run this after vite build."
    );
  }

  const template = fs.readFileSync(
    indexPath,
    "utf8"
  );
  const html = injectHeadTags(template).replace(
    '<div id="root"></div>',
    `<div id="root">${buildShell()}</div>`
  );

  fs.mkdirSync(outputDir, {
    recursive: true
  });
  fs.writeFileSync(outputPath, html);

  console.log(
    "Prerendered team coverage page at dist/team-coverage/index.html."
  );
}

main();
