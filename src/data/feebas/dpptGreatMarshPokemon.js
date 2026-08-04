export const DPPT_GREAT_MARSH_AREA_COUNT = 6;
export const DPPT_GREAT_MARSH_VALUE_COUNT = 32;

export const DPPT_GREAT_MARSH_GAME_TABLES = {
  platinum: {
    label: "Pokemon Platinum",
    pokemonIds: [
      454,
      352,
      352,
      455,
      451,
      453,
      195,
      452,
      451,
      453,
      195,
      115,
      46,
      452,
      102,
      102,
      451,
      453,
      451,
      455,
      193,
      285,
      46,
      115,
      316,
      357,
      316,
      285,
      451,
      455,
      453,
      114
    ]
  },
  diamondPearl: {
    label: "Pokemon Diamond & Pearl",
    pokemonIds: [
      453,
      451,
      455,
      453,
      451,
      455,
      55,
      453,
      451,
      455,
      315,
      397,
      454,
      452,
      102,
      55,
      397,
      453,
      451,
      455,
      193,
      285,
      46,
      115,
      316,
      315,
      397,
      453,
      451,
      455,
      315,
      55
    ]
  }
};

export const DPPT_GREAT_MARSH_VALIDATION_CASES = [
  {
    groupSeed: 0x00000000,
    expectedAreaValues: [0, 0, 0, 0, 0, 0],
    expectedPlatinumPokemonIds: [454, 454, 454, 454, 454, 454],
    expectedDiamondPearlPokemonIds: [453, 453, 453, 453, 453, 453],
    source: "boundary seed",
    status: "formula-fixture"
  },
  {
    groupSeed: 0xffffffff,
    expectedAreaValues: [31, 31, 31, 31, 31, 31],
    expectedPlatinumPokemonIds: [114, 114, 114, 114, 114, 114],
    expectedDiamondPearlPokemonIds: [55, 55, 55, 55, 55, 55],
    source: "boundary seed",
    status: "formula-fixture"
  },
  {
    groupSeed: 0xbd71aa22,
    expectedAreaValues: [2, 17, 10, 3, 23, 30],
    expectedPlatinumPokemonIds: [352, 453, 195, 455, 115, 453],
    expectedDiamondPearlPokemonIds: [455, 453, 315, 453, 115, 315],
    source: "ambiguous lottery pair 61249 -> 33671 option 1",
    status: "needs-independent-game-validation"
  },
  {
    groupSeed: 0x47ee3606,
    expectedAreaValues: [6, 16, 13, 28, 30, 3],
    expectedPlatinumPokemonIds: [195, 451, 452, 451, 453, 455],
    expectedDiamondPearlPokemonIds: [55, 397, 452, 451, 315, 453],
    source: "ambiguous lottery pair 61249 -> 33671 option 2",
    status: "needs-independent-game-validation"
  }
];
