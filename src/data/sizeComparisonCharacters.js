import oakSprite from "../assets/size-comparison-characters/OakSprite3.png";
import redFrlg from "../assets/size-comparison-characters/800px-FireRed_LeafGreen_Red.png";
import leafFrlg from "../assets/size-comparison-characters/800px-FireRed_LeafGreen_Leaf.png";
import blueFrlg from "../assets/size-comparison-characters/800px-FireRed_LeafGreen_Blue.png";
import blueHgss from "../assets/size-comparison-characters/800px-HeartGold_SoulSilver_Blue.png";
import redSm from "../assets/size-comparison-characters/800px-Sun_Moon_Red.png";
import ethanHgss from "../assets/size-comparison-characters/HeartGold_SoulSilver_Ethan.png";
import lyraHgss from "../assets/size-comparison-characters/HeartGold_SoulSilver_Lyra.png";
import krisCrystal from "../assets/size-comparison-characters/800px-Crystal_Kris.png";
import brendanEmerald from "../assets/size-comparison-characters/Emerald_Brendan.png";
import mayOras from "../assets/size-comparison-characters/320px-Omega_Ruby_Alpha_Sapphire_May.png";
import lucasDp from "../assets/size-comparison-characters/Diamond_Pearl_Lucas.png";
import dawnPlatinum from "../assets/size-comparison-characters/800px-Platinum_Dawn.png";
import hilbertBw from "../assets/size-comparison-characters/Black_White_Hilbert.png";
import hildaBw from "../assets/size-comparison-characters/Black_White_Hilda.png";
import calemXy from "../assets/size-comparison-characters/XY_Calem.png";
import serenaXy from "../assets/size-comparison-characters/XY_Serena.png";
import elioSm from "../assets/size-comparison-characters/800px-Sun_Moon_Elio.png";
import seleneSm from "../assets/size-comparison-characters/800px-Sun_Moon_Selene.png";

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
    heightInches: 63,
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
  }
];
