import assert from "node:assert/strict";
import {
  buildEvolutionSection,
  buildPokemonShell,
  buildTypeEffectivenessSection,
  injectHeadTags
} from "./prerenderPokemonPages.js";
import pikachu from "../public/data/pokemonData/25.json" with {
  type: "json"
};
import ivysaur from "../public/data/pokemonData/2.json" with {
  type: "json"
};
import gyarados from "../public/data/pokemonData/130.json" with {
  type: "json"
};
import bulbasaurChain from "../public/data/evolutionChains/1.json" with {
  type: "json"
};
import oddishChain from "../public/data/evolutionChains/18.json" with {
  type: "json"
};
import laprasChain from "../public/data/evolutionChains/65.json" with {
  type: "json"
};
import eeveeChain from "../public/data/evolutionChains/67.json" with {
  type: "json"
};
import feebasChain from "../public/data/evolutionChains/178.json" with {
  type: "json"
};
import evolutionMethodOverrides from "../public/data/evolutionMethodOverrides.json" with {
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

const ivysaurTypeSection =
  buildTypeEffectivenessSection(ivysaur);

assert.match(
  ivysaurTypeSection,
  /<h2 id="prerender-type-effectiveness-heading">Ivysaur's Weaknesses and Resistances<\/h2>/
);
assert.match(
  ivysaurTypeSection,
  /<strong>2×<\/strong>\s*<img src="\/assets\/type-badges\/FIRE\.png" alt="Fire type"/
);
assert.match(
  ivysaurTypeSection,
  /<strong>¼×<\/strong>\s*<img src="\/assets\/type-badges\/GRASS\.png" alt="Grass type"/
);
assert.doesNotMatch(
  ivysaurTypeSection,
  /<span>Fire<\/span>|<span>Grass<\/span>/
);
assert.doesNotMatch(
  ivysaurTypeSection,
  /display\s*:\s*none|visibility\s*:\s*hidden|aria-hidden/i
);

const gyaradosTypeSection =
  buildTypeEffectivenessSection(gyarados);

assert.match(
  gyaradosTypeSection,
  /<strong>4×<\/strong>\s*<img src="\/assets\/type-badges\/ELECTRIC\.png" alt="Electric type"/
);
assert.match(
  gyaradosTypeSection,
  /<strong>0×<\/strong>\s*<img src="\/assets\/type-badges\/GROUND\.png" alt="Ground type"/
);

const bulbasaurEvolutionSection =
  buildEvolutionSection(
    bulbasaurChain,
    ivysaur,
    evolutionMethodOverrides
  );

assert.match(
  bulbasaurEvolutionSection,
  /<h2 id="prerender-evolution-heading">Evolution Chain<\/h2>/
);
assert.match(
  bulbasaurEvolutionSection,
  /Bulbasaur evolves into Ivysaur at level 16, and Ivysaur evolves into Venusaur at level 32\./
);
assert.match(
  bulbasaurEvolutionSection,
  /<a class="prerender-evolution-card" href="\/pokemon\/bulbasaur">/
);
assert.match(
  bulbasaurEvolutionSection,
  /<a class="prerender-evolution-card" href="\/pokemon\/ivysaur">/
);
assert.match(
  bulbasaurEvolutionSection,
  /<div class="prerender-evolution-method">Lvl\. up at level 16<span aria-hidden="true"> ↓<\/span><\/div>/
);

const oddishEvolutionSection =
  buildEvolutionSection(
    oddishChain,
    {
      id: 43,
      name: "oddish"
    },
    evolutionMethodOverrides
  );

assert.match(
  oddishEvolutionSection,
  /Gloom can then evolve into Vileplume with a Leaf Stone or Bellossom with a Sun Stone\./
);
assert.match(
  oddishEvolutionSection,
  /<a href="\/item\/leaf-stone">Leaf Stone<\/a>/
);
assert.match(
  oddishEvolutionSection,
  /<a href="\/item\/sun-stone">Sun Stone<\/a>/
);

const laprasEvolutionSection =
  buildEvolutionSection(
    laprasChain,
    {
      id: 131,
      name: "lapras"
    },
    evolutionMethodOverrides
  );

assert.match(
  laprasEvolutionSection,
  /Lapras does not evolve into or from any other Pokémon\./
);
assert.doesNotMatch(
  laprasEvolutionSection,
  /Gigantamax|Gmax|Mega/
);

const eeveeEvolutionSection =
  buildEvolutionSection(
    eeveeChain,
    {
      id: 133,
      name: "eevee"
    },
    evolutionMethodOverrides
  );

assert.match(
  eeveeEvolutionSection,
  /Eevee has 8 possible evolutions: Vaporeon, Jolteon, Flareon, Espeon, Umbreon, Leafeon, Glaceon, and Sylveon, with the required method varying by evolution\./
);
assert.match(
  eeveeEvolutionSection,
  /<a href="\/item\/water-stone">Water Stone<\/a>/
);
assert.match(
  eeveeEvolutionSection,
  /<a href="\/location\/eterna-forest">Eterna Forest<\/a>/
);

const feebasEvolutionSection =
  buildEvolutionSection(
    feebasChain,
    {
      id: 349,
      name: "feebas"
    },
    evolutionMethodOverrides
  );

assert.match(
  feebasEvolutionSection,
  /Feebas evolves into Milotic by raising its Beauty and leveling up or by trading while holding a Prism Scale\./
);
assert.match(
  feebasEvolutionSection,
  /<a href="\/topic\/evolving-feebas-into-milotic-via-beauty">with high beauty<\/a>/
);
assert.match(
  feebasEvolutionSection,
  /<a href="\/item\/prism-scale">Prism Scale<\/a>/
);

const shell = buildPokemonShell(
  pikachu,
  "pikachu",
  {},
  [],
  []
);

assert.match(
  shell,
  /<h2 id="prerender-type-effectiveness-heading">Pikachu's Weaknesses and Resistances<\/h2>/
);
assert.match(
  shell,
  /<strong>2×<\/strong>\s*<img src="\/assets\/type-badges\/GROUND\.png" alt="Ground type"/
);

console.log(
  "Pokemon prerender tests passed."
);
