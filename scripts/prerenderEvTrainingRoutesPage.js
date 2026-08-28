import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);
const repoRoot = path.resolve(__dirname, "..");
const distDir = path.join(repoRoot, "dist");
const indexPath = path.join(distDir, "index.html");
const outputDir = path.join(
  distDir,
  "ev-training-routes"
);
const outputPath = path.join(
  outputDir,
  "index.html"
);
const evTrainingRoutesPath = path.join(
  repoRoot,
  "public",
  "data",
  "evTrainingRoutes.json"
);
const linkTargetsPath = path.join(
  repoRoot,
  "public",
  "data",
  "pokeloreLinkTargets.json"
);
const DEFAULT_VERSION = "platinum";
const DEFAULT_STAT = "hp";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeJsonForScript(data) {
  return JSON.stringify(data)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

async function readJson(filePath) {
  const text = await fs.readFile(filePath, "utf8");

  return JSON.parse(text);
}

function buildInitialRouteData(fullData) {
  return {
    generatedAt: fullData.generatedAt,
    isPartial: true,
    ranking: fullData.ranking,
    stats: fullData.stats,
    versions: fullData.versions,
    routesByVersion: {
      [DEFAULT_VERSION]: {
        [DEFAULT_STAT]:
          fullData.routesByVersion?.[
            DEFAULT_VERSION
          ]?.[DEFAULT_STAT] ?? []
      }
    }
  };
}

function injectHeadTags(html, seo) {
  const structuredData = JSON.stringify(
    seo.structuredData
  );
  const tags = `
    <title>${escapeHtml(seo.title)}</title>
    <meta name="description" content="${escapeHtml(seo.description)}">
    <link rel="canonical" href="${escapeHtml(seo.canonical)}">
    <meta name="robots" content="max-image-preview:large">
    <meta property="og:title" content="${escapeHtml(seo.title)}">
    <meta property="og:description" content="${escapeHtml(seo.description)}">
    <meta property="og:url" content="${escapeHtml(seo.canonical)}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${escapeHtml(seo.title)}">
    <meta name="twitter:description" content="${escapeHtml(seo.description)}">
    <script id="seo-structured-data" type="application/ld+json">${structuredData}</script>
  `;

  return html
    .replace(/<title>.*?<\/title>/, "")
    .replace(
      /<\/head>/,
      `${tags}\n  </head>`
    );
}

function injectInitialData(
  html,
  initialRouteData,
  initialLinkTargets
) {
  const script = `
    <script>
      window.__POKELORE_EV_TRAINING_ROUTES__ = ${escapeJsonForScript(initialRouteData)};
      window.__POKELORE_LINK_TARGETS__ = ${escapeJsonForScript(initialLinkTargets)};
    </script>
  `;

  return html.replace(
    /<\/body>/,
    `${script}\n  </body>`
  );
}

async function main() {
  const [template, evTrainingRoutes, linkTargets] =
    await Promise.all([
      fs.readFile(indexPath, "utf8"),
      readJson(evTrainingRoutesPath),
      readJson(linkTargetsPath)
    ]);
  const vite = await createServer({
    appType: "custom",
    logLevel: "error",
    server: {
      middlewareMode: true
    }
  });

  try {
    const [
      { default: EvTrainingRoutesPage },
      { evTrainingRoutesSeo }
    ] = await Promise.all([
      vite.ssrLoadModule(
        "/src/pages/EvTrainingRoutesPage.jsx"
      ),
      vite.ssrLoadModule("/src/seo/seoConfig.js")
    ]);
    const initialRouteData =
      buildInitialRouteData(evTrainingRoutes);
    const initialLinkTargets = linkTargets.filter(
      target => target.category === "item"
    );
    const appHtml = renderToString(
      React.createElement(
        MemoryRouter,
        {
          initialEntries: [
            "/ev-training-routes"
          ]
        },
        React.createElement(EvTrainingRoutesPage, {
          initialData: initialRouteData,
          initialLinkTargets
        })
      )
    );
    const seo = evTrainingRoutesSeo();
    const html = injectInitialData(
      injectHeadTags(template, seo).replace(
        '<div id="root"></div>',
        `<div id="root" data-pokelore-react-prerender="ev-training-routes">${appHtml}</div>`
      ),
      initialRouteData,
      initialLinkTargets
    );

    await fs.mkdir(outputDir, {
      recursive: true
    });
    await fs.writeFile(outputPath, html, "utf8");

    console.log(
      "Prerendered EV training routes page at dist/ev-training-routes/index.html."
    );
  } finally {
    await vite.close();
  }
}

main().catch(error => {
  console.error(
    "Failed to prerender EV training routes page:",
    error
  );
  process.exitCode = 1;
});
