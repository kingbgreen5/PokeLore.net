import oakSprite from "../../../src/assets/size-comparison-characters/OakSprite3.png?url";
import redFrlg from "../../../src/assets/size-comparison-characters/800px-FireRed_LeafGreen_Red.png?url";
import leafFrlg from "../../../src/assets/size-comparison-characters/800px-FireRed_LeafGreen_Leaf.png?url";
import blueFrlg from "../../../src/assets/size-comparison-characters/800px-FireRed_LeafGreen_Blue.png?url";
import blueHgss from "../../../src/assets/size-comparison-characters/800px-HeartGold_SoulSilver_Blue.png?url";
import redSm from "../../../src/assets/size-comparison-characters/800px-Sun_Moon_Red.png?url";
import ethanHgss from "../../../src/assets/size-comparison-characters/HeartGold_SoulSilver_Ethan.png?url";
import lyraHgss from "../../../src/assets/size-comparison-characters/HeartGold_SoulSilver_Lyra.png?url";
import krisCrystal from "../../../src/assets/size-comparison-characters/800px-Crystal_Kris.png?url";
import brendanEmerald from "../../../src/assets/size-comparison-characters/Emerald_Brendan.png?url";
import mayOras from "../../../src/assets/size-comparison-characters/320px-Omega_Ruby_Alpha_Sapphire_May.png?url";
import lucasDp from "../../../src/assets/size-comparison-characters/Diamond_Pearl_Lucas.png?url";
import dawnPlatinum from "../../../src/assets/size-comparison-characters/800px-Platinum_Dawn.png?url";
import hilbertBw from "../../../src/assets/size-comparison-characters/Black_White_Hilbert.png?url";
import hildaBw from "../../../src/assets/size-comparison-characters/Black_White_Hilda.png?url";
import calemXy from "../../../src/assets/size-comparison-characters/XY_Calem.png?url";
import serenaXy from "../../../src/assets/size-comparison-characters/XY_Serena.png?url";
import elioSm from "../../../src/assets/size-comparison-characters/800px-Sun_Moon_Elio.png?url";
import seleneSm from "../../../src/assets/size-comparison-characters/800px-Sun_Moon_Selene.png?url";
import victorSwsh from "../../../src/assets/size-comparison-characters/800px-Sword_Shield_Victor.png?url";
import gloriaSwsh from "../../../src/assets/size-comparison-characters/800px-Sword_Shield_Gloria.png?url";
import victorCrownTundra from "../../../src/assets/size-comparison-characters/800px-Sword_Shield_Victor_Crown_Tundra.png?url";
import gloriaIsleOfArmor from "../../../src/assets/size-comparison-characters/150px-Sword_Shield_Gloria_Isle_of_Armor.png?url";

export const DEFAULT_SIZE_COMPARISON_CHARACTER_ID =
  "professor-oak";

export const sizeComparisonCharacters = [
  {
    id: "professor-oak",
    name: "Professor Oak",
    sprite: oakSprite,
    heightInches: 67,
    heightSource: "existing-chart-baseline"
  },
  {
    id: "red-frlg",
    name: "Red",
    variant: "FireRed/LeafGreen",
    sprite: redFrlg,
    heightInches: 55,
    heightSource: "listed",
    heightSourceUrl:
      "https://bulbapedia.bulbagarden.net/wiki/Red_(game)"
  },
  {
    id: "leaf-frlg",
    name: "Leaf",
    variant: "FireRed/LeafGreen",
    sprite: leafFrlg,
    heightInches: 55,
    heightSource: "listed",
    heightSourceUrl:
      "https://bulbapedia.bulbagarden.net/wiki/Leaf_(game)"
  },
  {
    id: "blue-frlg",
    name: "Blue",
    variant: "FireRed/LeafGreen",
    sprite: blueFrlg,
    heightInches: 55,
    heightSource: "listed",
    heightSourceUrl:
      "https://bulbapedia.bulbagarden.net/wiki/Blue_(game)"
  },
  {
    id: "blue-hgss",
    name: "Blue",
    variant: "HeartGold/SoulSilver",
    sprite: blueHgss,
    heightInches: 63,
    heightSource: "listed",
    heightSourceUrl:
      "https://bulbapedia.bulbagarden.net/wiki/Blue_(game)"
  },
  {
    id: "red-sm",
    name: "Red",
    variant: "Sun/Moon",
    sprite: redSm,
    heightInches: 70,
    heightSource: "listed",
    heightSourceUrl:
      "https://bulbapedia.bulbagarden.net/wiki/Red_(game)"
  },
  {
    id: "ethan-hgss",
    name: "Ethan",
    variant: "HeartGold/SoulSilver",
    sprite: ethanHgss,
    heightInches: 59,
    heightSource: "listed",
    heightSourceUrl:
      "https://bulbapedia.bulbagarden.net/wiki/Ethan_(game)"
  },
  {
    id: "lyra-hgss",
    name: "Lyra",
    variant: "HeartGold/SoulSilver",
    sprite: lyraHgss,
    heightInches: 59,
    heightSource: "listed",
    heightSourceUrl:
      "https://bulbapedia.bulbagarden.net/wiki/Lyra_(game)"
  },
  {
    id: "dawn-platinum",
    name: "Dawn",
    variant: "Platinum",
    sprite: dawnPlatinum,
    heightInches: 56,
    heightSource: "listed",
    heightSourceUrl:
      "https://bulbapedia.bulbagarden.net/wiki/Dawn_(game)"
  },
  {
    id: "kris-crystal",
    name: "Kris",
    variant: "Crystal",
    sprite: krisCrystal,
    heightInches: 59,
    heightSource: "fallback"
  },
  {
    id: "brendan-emerald",
    name: "Brendan",
    variant: "Emerald",
    sprite: brendanEmerald,
    heightInches: 59,
    heightSource: "fallback"
  },
  {
    id: "may-oras",
    name: "May",
    variant: "Omega Ruby/Alpha Sapphire",
    sprite: mayOras,
    heightInches: 59,
    heightSource: "fallback"
  },
  {
    id: "lucas-dp",
    name: "Lucas",
    variant: "Diamond/Pearl",
    sprite: lucasDp,
    heightInches: 56,
    heightSource: "fallback"
  },
  {
    id: "hilbert-bw",
    name: "Hilbert",
    variant: "Black/White",
    sprite: hilbertBw,
    heightInches: 63,
    heightSource: "fallback"
  },
  {
    id: "hilda-bw",
    name: "Hilda",
    variant: "Black/White",
    sprite: hildaBw,
    heightInches: 63,
    heightSource: "fallback"
  },
  {
    id: "calem-xy",
    name: "Calem",
    variant: "X/Y",
    sprite: calemXy,
    heightInches: 63,
    heightSource: "fallback"
  },
  {
    id: "serena-xy",
    name: "Serena",
    variant: "X/Y",
    sprite: serenaXy,
    heightInches: 63,
    heightSource: "fallback"
  },
  {
    id: "elio-sm",
    name: "Elio",
    variant: "Sun/Moon",
    sprite: elioSm,
    heightInches: 63,
    heightSource: "fallback"
  },
  {
    id: "selene-sm",
    name: "Selene",
    variant: "Sun/Moon",
    sprite: seleneSm,
    heightInches: 63,
    heightSource: "fallback"
  },
  {
    id: "victor-swsh",
    name: "Victor",
    variant: "Sword/Shield",
    sprite: victorSwsh,
    heightInches: 63,
    heightSource: "fallback"
  },
  {
    id: "gloria-swsh",
    name: "Gloria",
    variant: "Sword/Shield",
    sprite: gloriaSwsh,
    heightInches: 63,
    heightSource: "fallback"
  },
  {
    id: "victor-crown-tundra",
    name: "Victor",
    variant: "Crown Tundra",
    sprite: victorCrownTundra,
    heightInches: 63,
    heightSource: "fallback"
  },
  {
    id: "gloria-isle-of-armor",
    name: "Gloria",
    variant: "Isle of Armor",
    sprite: gloriaIsleOfArmor,
    heightInches: 63,
    heightSource: "fallback"
  }
];
