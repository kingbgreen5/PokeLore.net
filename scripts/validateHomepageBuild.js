import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  homepageToolLinks
} from "../src/data/homepageContent.js";

const rootDir = process.cwd();
const htmlPath = path.join(rootDir, "dist", "index.html");
const appRoutesPath = path.join(rootDir, "src", "App.jsx");
const html = fs.readFileSync(htmlPath, "utf8");
const appRoutes = fs.readFileSync(appRoutesPath, "utf8");

const expectedTitle =
  "PokéLore.net | Pokémon Pokédex, Tools &amp; Game Guides";
const expectedDescription =
  "PokéLore.net is a Pokémon Pokédex and game resource with stats, moves, evolutions, weaknesses, encounter locations, game analysis, team building, EV training tools, Feebas calculators, and more.";
const expectedLinks = homepageToolLinks.map(tool => [
  tool.path,
  tool.title
]);

function count(pattern) {
  return html.match(pattern)?.length ?? 0;
}

function assertIncludes(needle) {
  assert.ok(
    html.includes(needle),
    `Expected built homepage HTML to include: ${needle}`
  );
}

assert.equal(
  count(/<title>/gi),
  1,
  "Expected exactly one title tag."
);
assertIncludes(`<title>${expectedTitle}</title>`);

assert.equal(
  count(/<meta\s+name="description"/gi),
  1,
  "Expected exactly one meta description."
);
assertIncludes(
  `<meta name="description" content="${expectedDescription}">`
);

assert.equal(
  count(/<link\s+rel="canonical"/gi),
  1,
  "Expected exactly one canonical link."
);
assertIncludes(
  '<link rel="canonical" href="https://pokelore.net/">'
);

assert.equal(
  count(/<h1>/gi),
  1,
  "Expected exactly one homepage H1 in the raw HTML."
);
assertIncludes("<h1>Pokémon Pokédex, Tools &amp; Game Guides</h1>");
assert.equal(
  count(/<h1>PokéLore<\/h1>/gi),
  0,
  "Expected no separate PokéLore H1 in the raw HTML."
);
assertIncludes(
  "PokéLore.net is a game-focused Pokémon reference with stats, moves, weaknesses, evolutions, encounter locations, Pokédex lore"
);
assertIncludes("<h2 id=\"homepage-tools-heading\">Pokémon Tools &amp; Resources</h2>");
assertIncludes(
  '<h2 id="homepage-pokedex-heading">Explore the National Pokédex</h2>'
);

expectedLinks.forEach(([href, label]) => {
  assertIncludes(`href="${href}"`);
  assertIncludes(label);
  assert.ok(
    appRoutes.includes(`path="${href}"`) ||
      (href === "/" && appRoutes.includes('path="/"')),
    `Expected ${href} to exist as an app route.`
  );
});

assert.equal(
  count(/type="application\/ld\+json"/gi),
  1,
  "Expected exactly one JSON-LD script."
);

const structuredDataMatch = html.match(
  /<script id="seo-structured-data" type="application\/ld\+json">([^<]+)<\/script>/
);
assert.ok(
  structuredDataMatch,
  "Expected homepage WebSite JSON-LD script."
);

const structuredData = JSON.parse(
  structuredDataMatch[1]
);
assert.equal(structuredData["@type"], "WebSite");
assert.equal(
  structuredData.url,
  "https://pokelore.net/"
);
assert.equal(structuredData.name, "PokéLore.net");
assert.deepEqual(structuredData.alternateName, [
  "PokéLore",
  "pokelore.net"
]);
assert.notEqual(
  structuredData.name,
  "PokéLore",
  "Expected PokéLore to be an alternate name, not the preferred WebSite name."
);

assert.ok(
  !/PokéLore\.com|PokeLore\.com/i.test(html),
  "Expected no PokéLore.com branding in the built homepage HTML."
);

console.log("Homepage built HTML validation passed.");
