import { Link } from "react-router-dom";
import Seo from "../seo/Seo";

function isLocalHost() {
  if (typeof window === "undefined") {
    return false;
  }

  return [
    "localhost",
    "127.0.0.1",
    "::1"
  ].includes(window.location.hostname);
}

const toolGroups = [
  {
    title: "Authoring",
    tools: [
      {
        label: "Article Studio",
        path: "/article-studio",
        description:
          "Local article authoring, preview, image picking, validation, and save flow."
      },
      {
        label: "Feebas Tile Editor",
        path: "/dev/feebas-tile-editor",
        description:
          "Mt. Coronet Feebas fishing tile grid editor with local save and JSON import/export."
      },
      {
        label: "Feebas Map Validator",
        path: "/dev/feebas-map-validator",
        description:
          "DPPt Feebas index-to-map renderer validation with group boundaries, audits, and test cases."
      },
      {
        label: "DPPt Feebas Calculator",
        path: "/dev/dppt-feebas-calculator",
        description:
          "Local lottery-number seed recovery, Feebas index calculation, diagnostics, and external visual comparison workflow."
      }
    ]
  },
  {
    title: "Review",
    tools: [
      {
        label: "SEO Review",
        path: "/seo-review",
        description:
          "Local title/meta-description review utility with browser drafts and override export."
      },
      {
        label: "Topic Review Mode",
        path: "/topic/forest-pokemon?review=1",
        description:
          "Review generated Pokédex topic matches and export local curation removals."
      },
      {
        label: "Pokémon Size Review",
        path: "/pokemon/bulbasaur?size-review=1",
        description:
          "Sprite size correction controls on a Pokémon detail page. The mode carries across Pokémon links."
      }
    ]
  },
  {
    title: "OG Previews",
    tools: [
      {
        label: "OG Preview Index",
        path: "/og-preview",
        description:
          "Landing view for Open Graph card previews."
      },
      {
        label: "OG Pokémon Preview",
        path: "/og-preview/pokemon/697",
        description:
          "Sample Pokémon Open Graph card."
      },
      {
        label: "OG Move Preview",
        path: "/og-preview/move/thunderbolt",
        description:
          "Sample move Open Graph card."
      },
      {
        label: "OG Topic Preview",
        path: "/og-preview/topic/forest-pokemon",
        description:
          "Sample Pokédex topic Open Graph card."
      },
      {
        label: "OG Item Preview",
        path: "/og-preview/item/master-ball",
        description:
          "Sample item Open Graph card."
      }
    ]
  }
];

function ToolCard({
  tool
}) {
  return (
    <article
      style={{
        backgroundColor: "#202124",
        border: "1px solid #454950",
        borderRadius: "8px",
        display: "grid",
        gap: ".55rem",
        padding: "1rem",
        textAlign: "left"
      }}
    >
      <Link
        to={tool.path}
        style={{
          color: "var(--link-unvisited)",
          fontSize: "1.05rem",
          fontWeight: 700,
          overflowWrap: "anywhere",
          textDecoration: "none"
        }}
      >
        {tool.label}
      </Link>
      <code
        style={{
          color: "#d1d5db",
          fontSize: ".85rem",
          overflowWrap: "anywhere"
        }}
      >
        {tool.path}
      </code>
      <p
        style={{
          lineHeight: 1.5,
          margin: 0,
          opacity: 0.86
        }}
      >
        {tool.description}
      </p>
    </article>
  );
}

function DevToolsPage() {
  if (!isLocalHost()) {
    return (
      <main
        style={{
          margin: "0 auto",
          maxWidth: "760px",
          padding: "2rem"
        }}
      >
        <Seo
          title="Developer Tools | PokeLore"
          description="Private local developer tools index."
          canonical="https://pokelore.net/dev"
          robots="noindex, nofollow"
        />
        <h1>Developer Tools</h1>
        <p>
          This page is only available on localhost.
        </p>
      </main>
    );
  }

  return (
    <main
      style={{
        margin: "0 auto",
        maxWidth: "1100px",
        padding: "2rem 1rem 3rem"
      }}
    >
      <Seo
        title="Developer Tools | PokeLore"
        description="Private local developer tools index."
        canonical="https://pokelore.net/dev"
        robots="noindex, nofollow"
      />

      <header
        style={{
          margin: "0 auto 1.5rem",
          maxWidth: "760px",
          textAlign: "center"
        }}
      >
        <h1>Developer Tools</h1>
        <p
          style={{
            lineHeight: 1.6,
            margin: 0,
            opacity: 0.86
          }}
        >
          Hidden local index for authoring, review, preview, and calibration tools.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gap: "1.25rem"
        }}
      >
        {toolGroups.map(group => (
          <section key={group.title}>
            <h2
              style={{
                marginBottom: ".75rem"
              }}
            >
              {group.title}
            </h2>
            <div
              style={{
                display: "grid",
                gap: ".85rem",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(240px, 1fr))"
              }}
            >
              {group.tools.map(tool => (
                <ToolCard
                  key={tool.path}
                  tool={tool}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

export default DevToolsPage;
