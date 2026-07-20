const standardFossilItems = [
  {
    slug: "helix-fossil",
    displayName: "Helix Fossil",
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/helix-fossil.png",
    restoredPokemon: [
      {
        slug: "omanyte",
        displayName: "Omanyte"
      },
      {
        slug: "omastar",
        displayName: "Omastar"
      }
    ],
    evolutionSummary:
      "Omanyte evolves into Omastar at level 40.",
    choicePair: "Dome Fossil",
    guideSummary:
      "A bulky special attacker with strong Defense and useful Water/Rock coverage."
  },
  {
    slug: "dome-fossil",
    displayName: "Dome Fossil",
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dome-fossil.png",
    restoredPokemon: [
      {
        slug: "kabuto",
        displayName: "Kabuto"
      },
      {
        slug: "kabutops",
        displayName: "Kabutops"
      }
    ],
    evolutionSummary:
      "Kabuto evolves into Kabutops at level 40.",
    choicePair: "Helix Fossil",
    guideSummary:
      "A physical attacker that becomes easier to use from Generation IV onward."
  },
  {
    slug: "old-amber",
    displayName: "Old Amber",
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/old-amber.png",
    restoredPokemon: [
      {
        slug: "aerodactyl",
        displayName: "Aerodactyl"
      }
    ],
    evolutionSummary:
      "Aerodactyl does not evolve, but can Mega Evolve in later generations.",
    choicePair: null,
    guideSummary:
      "A very fast Rock/Flying attacker that is often obtained late or after the main story."
  },
  {
    slug: "root-fossil",
    displayName: "Root Fossil",
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/root-fossil.png",
    restoredPokemon: [
      {
        slug: "lileep",
        displayName: "Lileep"
      },
      {
        slug: "cradily",
        displayName: "Cradily"
      }
    ],
    evolutionSummary:
      "Lileep evolves into Cradily at level 40.",
    choicePair: "Claw Fossil",
    guideSummary:
      "A slow, durable Grass/Rock option built around survivability and recovery."
  },
  {
    slug: "claw-fossil",
    displayName: "Claw Fossil",
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/claw-fossil.png",
    restoredPokemon: [
      {
        slug: "anorith",
        displayName: "Anorith"
      },
      {
        slug: "armaldo",
        displayName: "Armaldo"
      }
    ],
    evolutionSummary:
      "Anorith evolves into Armaldo at level 40.",
    choicePair: "Root Fossil",
    guideSummary:
      "A more direct physical attacker with useful Bug and Rock damage."
  },
  {
    slug: "skull-fossil",
    displayName: "Skull Fossil",
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/skull-fossil.png",
    restoredPokemon: [
      {
        slug: "cranidos",
        displayName: "Cranidos"
      },
      {
        slug: "rampardos",
        displayName: "Rampardos"
      }
    ],
    evolutionSummary:
      "Cranidos evolves into Rampardos at level 30.",
    choicePair: "Armor Fossil",
    guideSummary:
      "A simple, high-Attack fossil choice for teams that want immediate offense."
  },
  {
    slug: "armor-fossil",
    displayName: "Armor Fossil",
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/armor-fossil.png",
    restoredPokemon: [
      {
        slug: "shieldon",
        displayName: "Shieldon"
      },
      {
        slug: "bastiodon",
        displayName: "Bastiodon"
      }
    ],
    evolutionSummary:
      "Shieldon evolves into Bastiodon at level 30.",
    choicePair: "Skull Fossil",
    guideSummary:
      "A defensive Rock/Steel wall with excellent bulk but low offensive pressure."
  },
  {
    slug: "cover-fossil",
    displayName: "Cover Fossil",
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/cover-fossil.png",
    restoredPokemon: [
      {
        slug: "tirtouga",
        displayName: "Tirtouga"
      },
      {
        slug: "carracosta",
        displayName: "Carracosta"
      }
    ],
    evolutionSummary:
      "Tirtouga evolves into Carracosta at level 37.",
    choicePair: "Plume Fossil",
    guideSummary:
      "A bulky physical attacker that can become dangerous after Shell Smash."
  },
  {
    slug: "plume-fossil",
    displayName: "Plume Fossil",
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/plume-fossil.png",
    restoredPokemon: [
      {
        slug: "archen",
        displayName: "Archen"
      },
      {
        slug: "archeops",
        displayName: "Archeops"
      }
    ],
    evolutionSummary:
      "Archen evolves into Archeops at level 37.",
    choicePair: "Cover Fossil",
    guideSummary:
      "A fast mixed attacker with excellent offenses but a limiting ability."
  },
  {
    slug: "jaw-fossil",
    displayName: "Jaw Fossil",
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/jaw-fossil.png",
    restoredPokemon: [
      {
        slug: "tyrunt",
        displayName: "Tyrunt"
      },
      {
        slug: "tyrantrum",
        displayName: "Tyrantrum"
      }
    ],
    evolutionSummary:
      "Tyrunt evolves into Tyrantrum at level 39 during the daytime.",
    choicePair: "Sail Fossil",
    guideSummary:
      "A straightforward physical Dragon/Rock attacker with strong biting moves."
  },
  {
    slug: "sail-fossil",
    displayName: "Sail Fossil",
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/sail-fossil.png",
    restoredPokemon: [
      {
        slug: "amaura",
        displayName: "Amaura"
      },
      {
        slug: "aurorus",
        displayName: "Aurorus"
      }
    ],
    evolutionSummary:
      "Amaura evolves into Aurorus at level 39 during the nighttime.",
    choicePair: "Jaw Fossil",
    guideSummary:
      "A slower special attacker with Ice coverage and several defensive weaknesses."
  }
];

const galarFossilItems = [
  {
    slug: "fossilized-bird",
    displayName: "Fossilized Bird",
    restoredPokemon: [
      {
        slug: "dracozolt",
        displayName: "Dracozolt"
      },
      {
        slug: "arctozolt",
        displayName: "Arctozolt"
      }
    ],
    evolutionSummary:
      "Combines with Fossilized Drake for Dracozolt or Fossilized Dino for Arctozolt.",
    guideSummary:
      "One half of two Galar fossil combinations in Pokemon Sword and Shield."
  },
  {
    slug: "fossilized-drake",
    displayName: "Fossilized Drake",
    restoredPokemon: [
      {
        slug: "dracozolt",
        displayName: "Dracozolt"
      },
      {
        slug: "dracovish",
        displayName: "Dracovish"
      }
    ],
    evolutionSummary:
      "Combines with Fossilized Bird for Dracozolt or Fossilized Fish for Dracovish.",
    guideSummary:
      "One half of the Dracozolt and Dracovish fossil combinations."
  },
  {
    slug: "fossilized-dino",
    displayName: "Fossilized Dino",
    restoredPokemon: [
      {
        slug: "arctozolt",
        displayName: "Arctozolt"
      },
      {
        slug: "arctovish",
        displayName: "Arctovish"
      }
    ],
    evolutionSummary:
      "Combines with Fossilized Bird for Arctozolt or Fossilized Fish for Arctovish.",
    guideSummary:
      "One half of the two Ice-type Galar fossil combinations."
  },
  {
    slug: "fossilized-fish",
    displayName: "Fossilized Fish",
    restoredPokemon: [
      {
        slug: "dracovish",
        displayName: "Dracovish"
      },
      {
        slug: "arctovish",
        displayName: "Arctovish"
      }
    ],
    evolutionSummary:
      "Combines with Fossilized Drake for Dracovish or Fossilized Dino for Arctovish.",
    guideSummary:
      "One half of the Dracovish and Arctovish fossil combinations."
  }
];

const fossilItems = [
  ...standardFossilItems,
  ...galarFossilItems
];

const fossilItemSlugs = new Set(
  fossilItems.map(item => item.slug)
);

const fossilItemsBySlug = new Map(
  fossilItems.map(item => [
    item.slug,
    item
  ])
);

function getFossilItemData(slug) {
  return fossilItemsBySlug.get(slug) ?? null;
}

export {
  fossilItems,
  fossilItemSlugs,
  galarFossilItems,
  getFossilItemData,
  standardFossilItems
};
