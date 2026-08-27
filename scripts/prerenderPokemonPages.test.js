import assert from "node:assert/strict";
import { injectHeadTags } from "./prerenderPokemonPages.js";
import pikachu from "../public/data/pokemonData/25.json" with {
  type: "json"
};

const html = injectHeadTags(
  [
    "<!doctype html>",
    "<html lang=\"en\">",
    "<head>",
    "<title>Old Title</title>",
    "</head>",
    "<body>",
    "<div id=\"root\"></div>",
    "</body>",
    "</html>"
  ].join("\n"),
  pikachu,
  "pikachu",
  "/images/pokemon/official/detail/25.webp"
);

assert.match(
  html,
  /<title>Pikachu Pokédex: Stats, Moves, Evolution &amp; Analysis \| PokéLore<\/title>/
);
assert.match(
  html,
  /<link rel="canonical" href="https:\/\/pokelore\.net\/pokemon\/pikachu">/
);
assert.match(
  html,
  /<meta name="description" content="Pikachu stats, moves, weaknesses, evolution, locations, Pokédex entries, plus playthrough, competitive and Nuzlocke analysis—all in one place\.">/
);
assert.doesNotMatch(
  html,
  /<meta name="robots"/
);

console.log(
  "Pokemon prerender title test passed."
);
