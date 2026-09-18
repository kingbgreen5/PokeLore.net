// Reviewed repository facts only. Missing game scopes stay unsupported.
export const fossilChainIds = {
  "helix-fossil": 69, "dome-fossil": 70, "old-amber": 71,
  "root-fossil": 176, "claw-fossil": 177, "skull-fossil": 211,
  "armor-fossil": 212, "cover-fossil": 288, "plume-fossil": 289,
  "jaw-fossil": 357, "sail-fossil": 358
};

export const evolutionItemAllowlist = [
  "fire-stone", "water-stone", "thunder-stone", "leaf-stone", "moon-stone",
  "sun-stone", "shiny-stone", "dusk-stone", "dawn-stone", "ice-stone",
  "prism-scale", "kings-rock", "metal-coat", "up-grade", "dubious-disc",
  "razor-claw", "razor-fang", "reaper-cloth", "protector", "electirizer",
  "magmarizer", "sachet", "whipped-dream"
];

// These overrides explicitly name Legends: Arceus. They are NOT ranges extending
// to later games. Traditional held-trade methods remain pending game review.
export const evolutionItemRules = [
  ["metal-coat", "onix", "steelix"],
  ["metal-coat", "scyther", "scizor"],
  ["up-grade", "porygon", "porygon2"],
  ["dubious-disc", "porygon2", "porygon-z"],
  ["reaper-cloth", "dusclops", "dusknoir"],
  ["protector", "rhydon", "rhyperior"],
  ["electirizer", "electabuzz", "electivire"],
  ["magmarizer", "magmar", "magmortar"]
].map(([item, sourcePokemon, targetPokemon]) => ({
  item, sourcePokemon, sourceForm: "default", sourceSlug: sourcePokemon,
  targetPokemon, targetForm: "default", targetSlug: targetPokemon,
  role: "used-on", trigger: "use-item",
  conditions: { all: [] }, games: ["legends-arceus"],
  alternateMethods: [], coverage: "listed-games-only",
  provenance: [`public/data/evolutionMethodOverrides.json#${targetPokemon}.additionalMethods`, "public/data/evolutionChains"],
  review: { forms: true, role: true, conditions: true, games: true }
}));

const earlyPowerScope = {
  label: "Generations IV-VI",
  games: ["diamond-pearl", "platinum", "heartgold-soulsilver", "black-white", "black-2-white-2", "x-y", "omega-ruby-alpha-sapphire"],
  bonusEVs: 4
};
const modernPowerScope = {
  label: "Sun/Moon, Ultra Sun/Ultra Moon, Sword/Shield, Brilliant Diamond/Shining Pearl, Scarlet/Violet",
  games: ["sun-moon", "ultra-sun-ultra-moon", "sword-shield", "brilliant-diamond-shining-pearl", "scarlet-violet"],
  bonusEVs: 8
};
export const evItemRules = {
  "macho-brace": {
    stat: "all", evMultiplier: 2, speedMultiplier: 0.5,
    scope: {
      label: "Ruby/Sapphire/Emerald, FireRed/LeafGreen, Diamond/Pearl/Platinum, HeartGold/SoulSilver, Black/White, Black 2/White 2, X/Y, Omega Ruby/Alpha Sapphire, Sword/Shield, Brilliant Diamond/Shining Pearl",
      games: ["ruby-sapphire", "emerald", "firered-leafgreen", ...earlyPowerScope.games, "sword-shield", "brilliant-diamond-shining-pearl"]
    },
    provenance: ["src/pages/EvTrainingRoutesPage.jsx#evMultiplier", "src/pages/EvTrainingRoutesPage.jsx#Macho-Brace", "public/data/itemLocationsCurated/macho-brace.json"]
  },
  ...Object.fromEntries([
    ["power-weight", "HP"], ["power-bracer", "Attack"],
    ["power-belt", "Defense"], ["power-lens", "Special Attack"],
    ["power-band", "Special Defense"], ["power-anklet", "Speed"]
  ].map(([item, stat]) => [item, {
    stat, speedMultiplier: 0.5,
    rules: [earlyPowerScope, modernPowerScope],
    provenance: ["src/pages/EvTrainingRoutesPage.jsx#powerItems", "src/pages/EvTrainingRoutesPage.jsx#Power-Items", `public/data/items/${item}.json#effect`]
  }]))
};

// No active/inactive rule can be responsibly extracted from the unscoped effect
// and regional flavor text. Null means unknown, never inactive.
export const mulchMechanics = {
  "gooey-mulch": {
    status: "needs-curation", rules: [],
    pending: { games: null, active: null, mechanic: "regrowth-count", modifier: null },
    missing: ["Verified regrowth count and rounding by game", "Explicit functional/inactive status by game"],
    provenance: ["notes/item-content-audit/assessment.md#d-f-ev-items-held-items-and-mulches"]
  }
};
