import { Link } from "react-router-dom";
import Seo from "../seo/Seo";
import { toolsSeo } from "../seo/seoConfig";

const tools = [
  {
    title: "Team Builder",
    path: "/team-coverage",
    description:
      "Build a Pokemon party and check offensive type coverage for a selected game."
  },
  {
    title: "Best EV Training Locations Calculator",
    path: "/ev-training-routes",
    description:
      "Find the best repeatable wild encounter locations for training a chosen EV stat."
  },
  {
    title: "DPPt Feebas Calculator",
    path: "/dppt-feebas-calculator",
    description:
      "Calculate possible Feebas tiles in Diamond, Pearl, and Platinum."
  },
  {
    title: "Single Type Coverage",
    path: "/single-type-coverage",
    description:
      "Choose a game and defensive type to find Pokemon that can hit it super-effectively."
  }
];

function ToolsPage() {
  return (
    <main
      style={{
        boxSizing: "border-box",
        display: "grid",
        gap: "1.5rem",
        margin: "0 auto",
        maxWidth: "1040px",
        padding: "2rem",
        textAlign: "left",
        width: "100%"
      }}
    >
      <Seo {...toolsSeo()} />

      <header
        style={{
          textAlign: "center"
        }}
      >
        <h1
          style={{
            letterSpacing: 0,
            marginBottom: ".75rem"
          }}
        >
          Tools
        </h1>
        <p
          style={{
            margin: "0 auto",
            maxWidth: "720px"
          }}
        >
          Calculators and planning helpers for Pokemon
          teams, encounters, and game-specific routing.
        </p>
      </header>

      <section
        aria-label="Pokemon tools"
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(240px, 1fr))"
        }}
      >
        {tools.map(tool => (
          <Link
            key={tool.path}
            to={tool.path}
            style={{
              backgroundColor: "#202129",
              border: "1px solid #3f4350",
              borderRadius: "8px",
              color: "inherit",
              display: "grid",
              gap: ".75rem",
              minHeight: "150px",
              padding: "1rem",
              textDecoration: "none"
            }}
          >
            <h2
              style={{
                letterSpacing: 0,
                margin: 0
              }}
            >
              {tool.title}
            </h2>
            <p>{tool.description}</p>
            <span
              style={{
                color: "var(--link-unvisited)",
                fontWeight: 700,
                marginTop: "auto"
              }}
            >
              Open tool
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}

export default ToolsPage;
