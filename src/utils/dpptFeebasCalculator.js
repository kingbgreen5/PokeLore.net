import {
  DPPT_FEEBAS_GROUP_SIZE,
  DPPT_FEEBAS_TILE_COUNT,
  dpptFeebasAudit,
  getFeebasGroup,
  getFeebasIndexWithinGroup,
  getFeebasTileByIndex
} from "./dpptFeebasTiles";

export const LOTTERY_NUMBER_PATTERN = /^\d{5}$/;
export const MAX_LOTTERY_VALUE = 0xffff;
export const LOTTERY_RNG_MULTIPLIER = 0x41c64e6d;
export const LOTTERY_RNG_INCREMENT = 0x3039;
export const LOTTERY_RNG_MULTIPLIER_INVERSE = 0xeeb9eb65;
export const LOTTERY_RNG_INCREMENT_INVERSE = 0xfc77a683;
export const DAILY_GROUP_SEED_MULTIPLIER = 0x6c078965;
export const DAILY_GROUP_SEED_INCREMENT = 0x00000001;
export const DAILY_LOTTERY_STATE_INCREMENT = 0xca55f729;
export const DPPT_FEEBAS_SUGGESTED_VALIDATION_SEEDS = [
  0x00000000,
  0x00000001,
  0x12345678,
  0x7fffffff,
  0x80000000,
  0xffffffff,
  0xa26e0c2b,
  0x5ae940d1,
  0xdeadbeef,
  0x0badf00d,
  0xc001d00d,
  0xfeedface,
  0x13579bdf,
  0x2468ace0,
  0x89abcdef,
  0xfedcba98
];

export function toUint32(value) {
  return value >>> 0;
}

export function toInt32(value) {
  return value | 0;
}

export function validateLotteryNumber(value) {
  const displayValue = String(value ?? "");

  if (displayValue.length === 0) {
    return {
      valid: false,
      error: "Lottery number is required."
    };
  }

  if (!/^\d+$/.test(displayValue)) {
    return {
      valid: false,
      error: "Lottery number must contain only decimal digits."
    };
  }

  if (displayValue.length !== 5) {
    return {
      valid: false,
      error: "Lottery number must be exactly five digits."
    };
  }

  return {
    valid: true,
    error: null
  };
}

export function parseLotteryNumber(value) {
  const validation = validateLotteryNumber(value);

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return Number.parseInt(String(value), 10);
}

export function formatLotteryNumber(value) {
  return String(value).padStart(5, "0");
}

export function getNextLotteryRngState(seed) {
  return toUint32(
    Math.imul(toUint32(seed), LOTTERY_RNG_MULTIPLIER) +
      LOTTERY_RNG_INCREMENT
  );
}

export function generateLotteryNumberFromSeed(seed) {
  return (getNextLotteryRngState(seed) >>> 16) & 0xffff;
}

export function advanceDailyGroupSeed(seed) {
  return toUint32(
    Math.imul(toUint32(seed), DAILY_GROUP_SEED_MULTIPLIER) +
      DAILY_GROUP_SEED_INCREMENT
  );
}

function formatSeedHex(seed) {
  return `0x${toUint32(seed)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0")}`;
}

function describeSeedSign(seed) {
  return toInt32(seed) < 0 ? "negative" : "positive";
}

function getSeedBytes(value) {
  const seedValue = toUint32(value);

  return [
    (seedValue >>> 24) & 0xff,
    (seedValue >>> 16) & 0xff,
    (seedValue >>> 8) & 0xff,
    seedValue & 0xff
  ];
}

function getIndexesFromBytes(bytes) {
  return bytes.map(
    (byte, byteIndex) =>
      (byte % DPPT_FEEBAS_GROUP_SIZE) +
      byteIndex * DPPT_FEEBAS_GROUP_SIZE
  );
}

export function createValidationPairFromSeed(
  yesterdaySeed,
  label = "Generated pair"
) {
  const yesterdaySeedUnsigned = toUint32(yesterdaySeed);
  const todaySeedUnsigned =
    advanceDailyGroupSeed(yesterdaySeedUnsigned);
  const yesterdayLottery = formatLotteryNumber(
    generateLotteryNumberFromSeed(yesterdaySeedUnsigned)
  );
  const todayLottery = formatLotteryNumber(
    generateLotteryNumberFromSeed(todaySeedUnsigned)
  );

  return {
    label,
    yesterdayLottery,
    todayLottery,
    yesterdaySeedUnsigned,
    yesterdaySeedSigned: toInt32(yesterdaySeedUnsigned),
    yesterdaySeedHex: formatSeedHex(yesterdaySeedUnsigned),
    todaySeedUnsigned,
    todaySeedSigned: toInt32(todaySeedUnsigned),
    todaySeedHex: formatSeedHex(todaySeedUnsigned),
    profile: `${describeSeedSign(
      yesterdaySeedUnsigned
    )} yesterday seed, ${describeSeedSign(
      todaySeedUnsigned
    )} today seed`
  };
}

export const DPPT_FEEBAS_SUGGESTED_VALIDATION_PAIRS =
  DPPT_FEEBAS_SUGGESTED_VALIDATION_SEEDS.map(
    (seed, index) =>
      createValidationPairFromSeed(
        seed,
        `Suggested pair ${index + 1}`
      )
  );

export function createRandomValidationPair(
  random = Math.random
) {
  const randomValue = Number(random());
  const normalized = Number.isFinite(randomValue)
    ? Math.min(
        0.9999999999999999,
        Math.max(0, randomValue)
      )
    : 0;
  const yesterdaySeed = Math.floor(
    normalized * 0x100000000
  );

  return createValidationPairFromSeed(
    yesterdaySeed,
    "Random pair"
  );
}

function recoverGroupSeedFromLotteryRngState(lotteryRngState) {
  return toUint32(
    Math.imul(
      toUint32(lotteryRngState),
      LOTTERY_RNG_MULTIPLIER_INVERSE
    ) + LOTTERY_RNG_INCREMENT_INVERSE
  );
}

export function recoverDpptGroupSeed(
  yesterdayLottery,
  todayLottery
) {
  const yesterdayValue =
    typeof yesterdayLottery === "number"
      ? yesterdayLottery
      : parseLotteryNumber(yesterdayLottery);
  const todayValue =
    typeof todayLottery === "number"
      ? todayLottery
      : parseLotteryNumber(todayLottery);

  if (
    yesterdayValue < 0 ||
    yesterdayValue > MAX_LOTTERY_VALUE ||
    todayValue < 0 ||
    todayValue > MAX_LOTTERY_VALUE
  ) {
    return [];
  }

  const candidates = [];
  const seenTodaySeeds = new Set();

  for (
    let lowBits = 0;
    lowBits <= MAX_LOTTERY_VALUE;
    lowBits += 1
  ) {
    const yesterdayLotteryRngState =
      ((yesterdayValue << 16) | lowBits) >>> 0;
    // The daily group seed advances by +1, but this check is against
    // the already-transformed lottery RNG state, where the combined
    // increment is 0xCA55F729.
    const todayLotteryRngState = toUint32(
      Math.imul(
        yesterdayLotteryRngState,
        DAILY_GROUP_SEED_MULTIPLIER
      ) + DAILY_LOTTERY_STATE_INCREMENT
    );

    if (((todayLotteryRngState >>> 16) & 0xffff) !== todayValue) {
      continue;
    }

    const yesterdaySeedUnsigned =
      recoverGroupSeedFromLotteryRngState(
        yesterdayLotteryRngState
      );
    const todaySeedUnsigned =
      advanceDailyGroupSeed(yesterdaySeedUnsigned);

    if (
      generateLotteryNumberFromSeed(yesterdaySeedUnsigned) !==
        yesterdayValue ||
      generateLotteryNumberFromSeed(todaySeedUnsigned) !==
        todayValue ||
      seenTodaySeeds.has(todaySeedUnsigned)
    ) {
      continue;
    }

    seenTodaySeeds.add(todaySeedUnsigned);
    candidates.push({
      candidateNumber: candidates.length + 1,
      yesterdaySeedUnsigned,
      yesterdaySeedSigned: toInt32(yesterdaySeedUnsigned),
      groupSeedUnsigned: todaySeedUnsigned,
      groupSeedSigned: toInt32(todaySeedUnsigned)
    });
  }

  return candidates;
}

export function calculateFeebasIndexesFromSeed(seed) {
  const groupSeedUnsigned = toUint32(seed);
  const groupSeedSigned = toInt32(groupSeedUnsigned);
  // External DPPt calculator checks show Feebas reads the raw unsigned
  // seed bytes. Keep the signed-absolute version as a diagnostic
  // alternate because early research and old local builds used it.
  const absoluteSeed = Math.abs(groupSeedSigned);
  const absoluteSeedUnsigned = absoluteSeed >>> 0;
  const bytes = getSeedBytes(groupSeedUnsigned);
  const indexes = getIndexesFromBytes(bytes);
  const signedAbsoluteBytes =
    getSeedBytes(absoluteSeedUnsigned);
  const signedAbsoluteIndexes = getIndexesFromBytes(
    signedAbsoluteBytes
  );

  return {
    groupSeedSigned,
    groupSeedUnsigned,
    absoluteSeed,
    seedHex: formatSeedHex(groupSeedUnsigned),
    bytes,
    indexes,
    signedAbsoluteBytes,
    signedAbsoluteIndexes,
    hasSignedAbsoluteAlternate:
      groupSeedSigned < 0 &&
      signedAbsoluteIndexes.join(",") !== indexes.join(",")
  };
}

export function resolveFeebasIndexes(indexes) {
  return indexes.map((index, resultIndex) => {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= DPPT_FEEBAS_TILE_COUNT
    ) {
      throw new RangeError(
        `Invalid Feebas index ${index}; expected 0-527.`
      );
    }

    const tile = getFeebasTileByIndex(index);

    return {
      resultNumber: resultIndex + 1,
      index,
      group: getFeebasGroup(index),
      indexWithinGroup: getFeebasIndexWithinGroup(index),
      x: tile.x,
      y: tile.y
    };
  });
}

function createFeebasCandidateFromGroupSeed(
  groupSeed,
  extras = {}
) {
  const seedResult = calculateFeebasIndexesFromSeed(groupSeed);

  return {
    ...extras,
    ...seedResult,
    results: resolveFeebasIndexes(seedResult.indexes),
    signedAbsoluteResults: seedResult.hasSignedAbsoluteAlternate
      ? resolveFeebasIndexes(
          seedResult.signedAbsoluteIndexes
        )
      : null
  };
}

export function calculateDpptFeebasResultsFromSeed(
  groupSeed
) {
  const groupSeedUnsigned = toUint32(groupSeed);

  return {
    valid: true,
    errors: [],
    source: "group-seed",
    candidateCount: 1,
    candidates: [
      createFeebasCandidateFromGroupSeed(
        groupSeedUnsigned,
        {
          candidateNumber: 1,
          groupSeedUnsigned,
          groupSeedSigned: toInt32(groupSeedUnsigned)
        }
      )
    ]
  };
}

export function calculateDpptFeebasResults(
  yesterdayLottery,
  todayLottery
) {
  const yesterdayDisplay = String(yesterdayLottery ?? "");
  const todayDisplay = String(todayLottery ?? "");
  const errors = [];
  const yesterdayValidation =
    validateLotteryNumber(yesterdayDisplay);
  const todayValidation =
    validateLotteryNumber(todayDisplay);

  if (!dpptFeebasAudit.valid) {
    errors.push(...dpptFeebasAudit.errors);
  }

  if (!yesterdayValidation.valid) {
    errors.push(
      `Yesterday's Lottery number: ${yesterdayValidation.error}`
    );
  }

  if (!todayValidation.valid) {
    errors.push(
      `Today's Lottery number: ${todayValidation.error}`
    );
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      yesterdayLottery: yesterdayDisplay,
      todayLottery: todayDisplay,
      candidates: []
    };
  }

  const yesterdayValue = parseLotteryNumber(yesterdayDisplay);
  const todayValue = parseLotteryNumber(todayDisplay);

  if (
    yesterdayValue > MAX_LOTTERY_VALUE ||
    todayValue > MAX_LOTTERY_VALUE
  ) {
    return {
      valid: false,
      errors: [
        "Lottery numbers above 65535 cannot be produced by the DPPt group-seed lottery RNG."
      ],
      yesterdayLottery: yesterdayDisplay,
      todayLottery: todayDisplay,
      candidates: []
    };
  }

  const candidates = recoverDpptGroupSeed(
    yesterdayValue,
    todayValue
  ).map(candidate =>
    createFeebasCandidateFromGroupSeed(
      candidate.groupSeedUnsigned,
      {
        ...candidate,
        yesterdaySeedHex: formatSeedHex(
          candidate.yesterdaySeedUnsigned
        )
      }
    )
  );

  if (candidates.length === 0) {
    errors.push(
      "No DPPt daily group seed produces this consecutive lottery pair."
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    yesterdayLottery: yesterdayDisplay,
    todayLottery: todayDisplay,
    candidateCount: candidates.length,
    candidates
  };
}
