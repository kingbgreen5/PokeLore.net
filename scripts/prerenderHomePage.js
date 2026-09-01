import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  homepageIntro,
  homepageToolLinks
} from "../src/data/homepageContent.js";
import { homeSeo } from "../src/seo/seoConfig.js";

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);
const repoRoot = path.resolve(__dirname, "..");
const indexPath = path.join(
  repoRoot,
  "dist",
  "index.html"
);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildToolCards() {
  return homepageToolLinks
    .map(
      tool =>
        `<a class="homepage-tool-card" href="${escapeHtml(tool.path)}"><span class="homepage-tool-card-title">${escapeHtml(tool.title)}</span><span class="homepage-tool-card-description">${escapeHtml(tool.description)}</span></a>`
    )
    .join("");
}

function buildShell() {
  return `
      <main class="homepage-shell" aria-label="PokéLore homepage preview">
        <section class="homepage-intro">
          <h1>${escapeHtml(homepageIntro.heading)}</h1>
          <p class="homepage-intro-description">${escapeHtml(homepageIntro.description)}</p>
        </section>
        <section class="homepage-tools" aria-labelledby="homepage-tools-heading">
          <h2 id="homepage-tools-heading">Pokémon Tools &amp; Resources</h2>
          <div class="homepage-tool-grid">${buildToolCards()}</div>
        </section>
        <section class="homepage-pokedex-heading" aria-labelledby="homepage-pokedex-heading">
          <h2 id="homepage-pokedex-heading">Explore the National Pokédex</h2>
          <p>Browse Pokémon in National Pokédex order or use the filters to find a specific Pokémon.</p>
        </section>
      </main>
    `;
}

function injectHeadTags(template) {
  const seo = homeSeo();
  const structuredData = JSON.stringify(
    seo.structuredData
  );
  const tags = `
    <title>${escapeHtml(seo.title)}</title>
    <meta name="description" content="${escapeHtml(seo.description)}">
    <link rel="canonical" href="${escapeHtml(seo.canonical)}">
    <meta name="robots" content="max-image-preview:large">
    <script id="seo-structured-data" type="application/ld+json">${structuredData}</script>`;

  return template
    .replace(/<title>.*?<\/title>/, "")
    .replace(
      /<meta\s+name=["']description["'][^>]*>\s*/gi,
      ""
    )
    .replace(
      /<link\s+rel=["']canonical["'][^>]*>\s*/gi,
      ""
    )
    .replace(
      /<meta\s+name=["']robots["'][^>]*>\s*/gi,
      ""
    )
    .replace(
      /<script\s+id=["']seo-structured-data["'][\s\S]*?<\/script>\s*/gi,
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

  if (!template.includes('<div id="root"></div>')) {
    throw new Error(
      "Expected dist/index.html to contain an empty #root for homepage prerendering."
    );
  }

  const html = injectHeadTags(template)
    .replace(
      '<div id="root"></div>',
      `<div id="root">${buildShell()}</div>`
    );

  fs.writeFileSync(indexPath, html);
  console.log(
    "Prerendered homepage shell at dist/index.html."
  );
}

main();
