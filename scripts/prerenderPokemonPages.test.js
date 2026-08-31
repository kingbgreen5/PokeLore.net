import assert from "node:assert/strict";
import {
  buildEvolutionSection,
  buildLearnsetSection,
  buildPokemonShell,
  buildWhereToFindSection,
  buildTypeEffectivenessSection,
  injectHeadTags
} from "./prerenderPokemonPages.js";
import pikachu from "../public/data/pokemonData/25.json" with {
  type: "json"
};
import bulbasaur from "../public/data/pokemonData/1.json" with {
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
import bulbasaurLearnset from "../public/data/pokemonLearnsets/1.json" with {
  type: "json"
};
import pikachuLearnset from "../public/data/pokemonLearnsets/25.json" with {
  type: "json"
};
import eeveeLearnset from "../public/data/pokemonLearnsets/133.json" with {
  type: "json"
};
import celebiLearnset from "../public/data/pokemonLearnsets/251.json" with {
  type: "json"
};
import feebasLearnset from "../public/data/pokemonLearnsets/349.json" with {
  type: "json"
};
import feebasEncounters from "../public/data/pokemonEncounters/349.json" with {
  type: "json"
};
import pikachuEncounters from "../public/data/pokemonEncounters/25.json" with {
  type: "json"
};
import miraidonLearnset from "../public/data/pokemonLearnsets/1008.json" with {
  type: "json"
};
import movesIndex from "../public/data/movesIndex.json" with {
  type: "json"
};

const movesData = Object.fromEntries(
  movesIndex.map(move => [
    move.name,
    move
  ])
);

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
assert.match(
  html,
  /id="pokelore-prerender-where-to-find-data"[^>]*>\{"pokemonId":25,"pokemon":"pikachu","locationCount":0\}<\/script>/
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

const pikachuLearnsetSection =
  buildLearnsetSection(
    pikachu,
    pikachuLearnset,
    movesData
  );

assert.match(
  pikachuLearnsetSection,
  /<h2>Learnsets<\/h2>/
);
assert.match(
  pikachuLearnsetSection,
  /<p>1075 moves<\/p>/
);
assert.match(
  pikachuLearnsetSection,
  /class="collapsible-content collapsed"/
);
assert.match(
  pikachuLearnsetSection,
  /<h3>Pikachu Moves Learned by Level Up<\/h3>/
);
assert.match(
  pikachuLearnsetSection,
  /<p>Scarlet Violet<\/p>/
);
assert.match(
  pikachuLearnsetSection,
  /<td>36<\/td>\s*<td><a href="\/move\/thunderbolt">Thunderbolt<\/a><\/td>/
);
assert.match(
  pikachuLearnsetSection,
  /<td>44<\/td>\s*<td><a href="\/move\/thunder">Thunder<\/a><\/td>/
);
assert.doesNotMatch(
  pikachuLearnsetSection,
  /Machine|Tutor|Egg|<a href="\/move\/protect">Protect<\/a>|<a href="\/move\/surf">Surf<\/a>/
);

const feebasWhereToFindSection =
  buildWhereToFindSection(
    {
      id: 349,
      name: "feebas"
    },
    feebasEncounters
  );

assert.match(
  feebasWhereToFindSection,
  /<h2>Where To Find Feebas<\/h2>/
);
assert.match(
  feebasWhereToFindSection,
  /<a href="\/location\/hoenn-route-119">Route 119<\/a> · Hoenn/
);
assert.match(
  feebasWhereToFindSection,
  /Road 119/
);
assert.match(
  feebasWhereToFindSection,
  /Ruby, Sapphire, Emerald/
);
assert.match(
  feebasWhereToFindSection,
  /Feebas Tile Fishing · Lv\. 20–25 · up to 50%/
);
assert.match(
  feebasWhereToFindSection,
  /<li>Feebas Tile Fishing · Lv\. 20–25 · 50%<\/li>/
);
assert.match(
  feebasWhereToFindSection,
  /class="collapsible-content collapsed"/
);

const pikachuWhereToFindSection =
  buildWhereToFindSection(
    pikachu,
    pikachuEncounters
  );

assert.match(
  pikachuWhereToFindSection,
  /<h2>Where To Find Pikachu<\/h2>/
);
assert.match(
  pikachuWhereToFindSection,
  /<a href="\/location\/friend-safari">Friend Safari<\/a> · Kalos/
);
assert.match(
  pikachuWhereToFindSection,
  /Friend Safari Slot 2/
);

const noLocationWhereToFindSection =
  buildWhereToFindSection(
    {
      id: 617,
      name: "accelgor"
    },
    null
  );

assert.match(
  noLocationWhereToFindSection,
  /<h2>Where To Find Accelgor<\/h2>/
);
assert.match(
  noLocationWhereToFindSection,
  /No known locations/
);

const representativeLearnsets = [
  [
    "Bulbasaur",
    bulbasaur,
    bulbasaurLearnset,
    /<p>Scarlet Violet<\/p>[\s\S]*<td>12<\/td>\s*<td><a href="\/move\/razor-leaf">Razor Leaf<\/a><\/td>/
  ],
  [
    "Eevee",
    {
      id: 133,
      name: "eevee"
    },
    eeveeLearnset,
    /<p>Scarlet Violet<\/p>[\s\S]*<td>15<\/td>\s*<td><a href="\/move\/baby-doll-eyes">Baby-Doll Eyes<\/a><\/td>/
  ],
  [
    "Celebi",
    {
      id: 251,
      name: "celebi"
    },
    celebiLearnset,
    /<p>Brilliant Diamond Shining Pearl<\/p>[\s\S]*<td>100<\/td>\s*<td><a href="\/move\/perish-song">Perish Song<\/a><\/td>/
  ],
  [
    "Feebas",
    {
      id: 349,
      name: "feebas"
    },
    feebasLearnset,
    /<p>Scarlet Violet<\/p>[\s\S]*<td>25<\/td>\s*<td><a href="\/move\/flail">Flail<\/a><\/td>/
  ],
  [
    "Miraidon",
    {
      id: 1008,
      name: "miraidon"
    },
    miraidonLearnset,
    /<p>Scarlet Violet<\/p>[\s\S]*<td>98<\/td>\s*<td><a href="\/move\/hyper-beam">Hyper Beam<\/a><\/td>/
  ]
];

representativeLearnsets.forEach(
  ([label, pokemon, learnset, expected]) => {
    const learnsetSection =
      buildLearnsetSection(
        pokemon,
        learnset,
        movesData
      );

    assert.match(
      learnsetSection,
      new RegExp(
        `<h3>${label} Moves Learned by Level Up<\\/h3>`
      )
    );
    assert.match(
      learnsetSection,
      expected
    );
    assert.doesNotMatch(
      learnsetSection,
      /<th[^>]*>Type<\/th>|<th[^>]*>Pwr<\/th>|<th[^>]*>Acc<\/th>|<th[^>]*>Cat\.<\/th>/
    );
  }
);

const shell = buildPokemonShell(
  pikachu,
  "pikachu",
  {},
  [],
  [],
  null,
  {},
  pikachuLearnset,
  movesData,
  pikachuEncounters
);

assert.match(
  shell,
  /<h2 id="prerender-type-effectiveness-heading">Pikachu's Weaknesses and Resistances<\/h2>/
);
assert.match(
  shell,
  /<strong>2×<\/strong>\s*<img src="\/assets\/type-badges\/GROUND\.png" alt="Ground type"/
);
assert.match(
  shell,
  /<h2>Learnsets<\/h2>[\s\S]*<a href="\/move\/thunderbolt">Thunderbolt<\/a>/
);
assert.match(
  shell,
  /<h2>Where To Find Pikachu<\/h2>[\s\S]*Friend Safari Slot 2/
);

console.log(
  "Pokemon prerender tests passed."
);
