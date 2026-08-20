import {
  EMERALD_EASY_CHAT_CONDITIONS,
  EMERALD_EASY_CHAT_EXPECTED_COUNTS,
  EMERALD_EASY_CHAT_SECOND_GROUPS,
  auditEmeraldEasyChatWords
} from "../data/feebas/emeraldEasyChatWords";
import {
  formatUint16Hex,
  formatUint32Hex
} from "./rseFeebasCalculator";

export const EMERALD_NORMAL_RNG_MULTIPLIER =
  1103515245;
export const EMERALD_NORMAL_RNG_INCREMENT = 24691;
export const EMERALD_MIN_TREND_SEARCH_ADVANCES = 700;
export const EMERALD_PARITY_CANDIDATE_COUNT = 5;
export const EXTENDED_CANDIDATE_LIMIT = 500;
export const EXTENDED_RNG_ADVANCE_LIMIT = 5000000;
export const EMERALD_DEFAULT_MAX_SEARCH_ADVANCES =
  2000000;
export const EMERALD_SECOND_GROUP_BITS = {
  hobbies: 0,
  lifestyle: 1
};

function toUint32(value) {
  return Number(value) >>> 0;
}

export function advanceEmeraldRng(state) {
  return (
    Math.imul(
      toUint32(state),
      EMERALD_NORMAL_RNG_MULTIPLIER
    ) +
    EMERALD_NORMAL_RNG_INCREMENT
  ) >>> 0;
}

export function advanceEmeraldRngBy(
  state,
  advances
) {
  let current = toUint32(state);
  const count = Number(advances);

  if (
    !Number.isInteger(count) ||
    count < 0
  ) {
    throw new RangeError(
      "Emerald RNG advance count must be a non-negative integer."
    );
  }

  for (let index = 0; index < count; index += 1) {
    current = advanceEmeraldRng(current);
  }

  return current;
}

export function getUpper16(state) {
  return toUint32(state) >>> 16;
}

export function formatFeebasValue(value) {
  return (Number(value) & 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");
}

export function normalizeTrainerId(value) {
  const displayValue = String(value ?? "").trim();

  if (displayValue.length === 0) {
    return {
      valid: false,
      value: displayValue,
      trainerId: null,
      paddedTrainerId: "",
      error: "Trainer ID is required."
    };
  }

  if (!/^\d+$/.test(displayValue)) {
    return {
      valid: false,
      value: displayValue,
      trainerId: null,
      paddedTrainerId: "",
      error:
        "Trainer ID must be a decimal number from 0 to 65535."
    };
  }

  const trainerId = Number.parseInt(displayValue, 10);

  if (trainerId < 0 || trainerId > 65535) {
    return {
      valid: false,
      value: displayValue,
      trainerId: null,
      paddedTrainerId: "",
      error:
        "Trainer ID must be between 0 and 65535."
    };
  }

  return {
    valid: true,
    value: displayValue,
    trainerId,
    paddedTrainerId: String(trainerId).padStart(
      5,
      "0"
    ),
    error: null
  };
}

function getWord(words, index, label) {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= words.length
  ) {
    throw new RangeError(
      `${label} index ${index} is outside the internal Easy Chat range.`
    );
  }

  return words[index];
}

export function getDewfordPhraseSignature({
  firstWordIndex,
  secondWordGroup,
  secondWordIndex
}) {
  const normalizedGroup = String(
    secondWordGroup ?? ""
  ).toLowerCase();
  const secondGroup =
    EMERALD_EASY_CHAT_SECOND_GROUPS[
      normalizedGroup
    ];

  if (!secondGroup) {
    throw new RangeError(
      "Second Dewford word group must be lifestyle or hobbies."
    );
  }

  const firstWord = getWord(
    EMERALD_EASY_CHAT_CONDITIONS,
    firstWordIndex,
    "Conditions"
  );
  const secondWord = getWord(
    secondGroup,
    secondWordIndex,
    normalizedGroup
  );

  return {
    firstWordIndex,
    firstWord,
    firstWordText: firstWord.text,
    firstGroupSize:
      EMERALD_EASY_CHAT_CONDITIONS.length,
    secondWordGroup: normalizedGroup,
    secondWordGroupBit:
      EMERALD_SECOND_GROUP_BITS[normalizedGroup],
    secondWordIndex,
    secondWord,
    secondWordText: secondWord.text,
    secondGroupSize: secondGroup.length,
    phrase: `${firstWord.text} / ${secondWord.text}`
  };
}

export function matchDewfordPhraseAtState(
  firstWordState,
  phraseSignature
) {
  const state0 = toUint32(firstWordState);
  const upper0 = getUpper16(state0);
  const firstWordModulo =
    upper0 % phraseSignature.firstGroupSize;
  const state1 = advanceEmeraldRng(state0);
  const upper1 = getUpper16(state1);
  const secondWordGroupBit = upper1 & 1;
  const state2 = advanceEmeraldRng(state1);
  const upper2 = getUpper16(state2);
  const secondWordModulo =
    upper2 % phraseSignature.secondGroupSize;

  return {
    matches:
      firstWordModulo ===
        phraseSignature.firstWordIndex &&
      secondWordGroupBit ===
        phraseSignature.secondWordGroupBit &&
      secondWordModulo ===
        phraseSignature.secondWordIndex,
    firstWordModulo,
    secondWordGroupBit,
    secondWordModulo,
    states: {
      firstWordState: state0,
      groupState: state1,
      secondWordState: state2
    },
    stateHex: {
      firstWordState: formatUint32Hex(state0),
      groupState: formatUint32Hex(state1),
      secondWordState: formatUint32Hex(state2)
    },
    upper16: {
      firstWord: upper0,
      group: upper1,
      secondWord: upper2
    }
  };
}

export function getFeebasRandOffsetForTrend(
  firstWordState
) {
  const test1State = advanceEmeraldRngBy(
    firstWordState,
    4
  );
  const test1 =
    getUpper16(test1State) % 98;
  const test2State = advanceEmeraldRngBy(
    firstWordState,
    5
  );
  const test2 =
    getUpper16(test2State) % 98;
  let trendRandOffset = 8;

  if (test1 <= 50) {
    trendRandOffset = 6;
  } else if (test2 <= 80) {
    trendRandOffset = 7;
  }

  const feebasValueState = advanceEmeraldRngBy(
    firstWordState,
    trendRandOffset
  );
  const feebasValueDecimal =
    getUpper16(feebasValueState);

  return {
    test1,
    test1State,
    test1StateHex: formatUint32Hex(test1State),
    test2,
    test2State,
    test2StateHex: formatUint32Hex(test2State),
    trendRandOffset,
    feebasValueState,
    feebasValueStateHex: formatUint32Hex(
      feebasValueState
    ),
    feebasValueDecimal,
    feebasValue: formatFeebasValue(
      feebasValueDecimal
    ),
    feebasValueHex: formatUint16Hex(
      feebasValueDecimal
    )
  };
}

export function findEmeraldFeebasValueCandidates({
  trainerId,
  phraseSignature,
  minimumAdvances = EMERALD_MIN_TREND_SEARCH_ADVANCES,
  candidateCount = EMERALD_PARITY_CANDIDATE_COUNT,
  maxSearchAdvances = EMERALD_DEFAULT_MAX_SEARCH_ADVANCES
}) {
  const normalizedTrainerId =
    normalizeTrainerId(trainerId);

  if (!normalizedTrainerId.valid) {
    throw new Error(normalizedTrainerId.error);
  }

  const audit = auditEmeraldEasyChatWords();
  if (!audit.valid) {
    throw new Error(
      "Emerald Easy Chat word counts do not match expected internal counts."
    );
  }

  const minimumAdvanceCount = Number(minimumAdvances);
  const desiredCandidateCount = Number(candidateCount);
  const maxAdvanceCount = Number(maxSearchAdvances);

  if (
    !Number.isInteger(minimumAdvanceCount) ||
    minimumAdvanceCount < 0 ||
    !Number.isInteger(desiredCandidateCount) ||
    desiredCandidateCount < 1 ||
    !Number.isInteger(maxAdvanceCount) ||
    maxAdvanceCount < minimumAdvanceCount
  ) {
    throw new RangeError(
      "Invalid Emerald recovery search settings."
    );
  }

  let scanAdvance = minimumAdvanceCount;
  let state = advanceEmeraldRngBy(
    normalizedTrainerId.trainerId,
    minimumAdvanceCount
  );
  const candidates = [];

  while (
    candidates.length < desiredCandidateCount &&
    scanAdvance <= maxAdvanceCount
  ) {
    const phraseMatch = matchDewfordPhraseAtState(
      state,
      phraseSignature
    );

    if (phraseMatch.matches) {
      const trend =
        getFeebasRandOffsetForTrend(state);
      candidates.push({
        candidateNumber: candidates.length + 1,
        value: trend.feebasValue,
        decimal: trend.feebasValueDecimal,
        valueHex: trend.feebasValueHex,
        scanAdvance,
        firstWordState: state,
        firstWordStateHex:
          phraseMatch.stateHex.firstWordState,
        phraseMatch,
        trendRandOffset:
          trend.trendRandOffset,
        test1: trend.test1,
        test2: trend.test2,
        test1StateHex: trend.test1StateHex,
        test2StateHex: trend.test2StateHex,
        feebasValueStateHex:
          trend.feebasValueStateHex
      });
    }

    state = advanceEmeraldRng(state);
    scanAdvance += 1;
  }

  return {
    game: "emerald",
    trainerId: normalizedTrainerId.trainerId,
    trainerIdDisplay:
      normalizedTrainerId.paddedTrainerId,
    initialSeed: normalizedTrainerId.trainerId,
    initialSeedHex: formatUint32Hex(
      normalizedTrainerId.trainerId
    ),
    minimumAdvances: minimumAdvanceCount,
    candidateCount: desiredCandidateCount,
    maxSearchAdvances: maxAdvanceCount,
    stoppedAtAdvance: scanAdvance - 1,
    searchLimitReached:
      candidates.length < desiredCandidateCount,
    phraseSignature,
    candidates
  };
}

function normalizeExactFeebasValue(value) {
  if (typeof value === "number") {
    return Number(value) & 0xffff;
  }

  const text = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/^0X/, "");

  if (!/^[0-9A-F]{1,4}$/.test(text)) {
    throw new Error(
      "Exact Feebas value must be a 16-bit hex value."
    );
  }

  return Number.parseInt(text, 16) & 0xffff;
}

export function findExactFeebasValueInPredictionStream({
  trainerId,
  phrase,
  phraseSignature,
  exactValue,
  minSearchAdvance = EMERALD_MIN_TREND_SEARCH_ADVANCES,
  maxCandidateMatches = EXTENDED_CANDIDATE_LIMIT,
  maxRngAdvances = EXTENDED_RNG_ADVANCE_LIMIT
}) {
  const signature = phraseSignature ?? phrase;
  const exactDecimal =
    normalizeExactFeebasValue(exactValue);
  const exactFormatted =
    formatFeebasValue(exactDecimal);
  const normalizedTrainerId =
    normalizeTrainerId(trainerId);

  if (!normalizedTrainerId.valid) {
    throw new Error(normalizedTrainerId.error);
  }

  if (!signature) {
    throw new Error(
      "A Dewford phrase signature is required."
    );
  }

  const minimumAdvanceCount = Number(minSearchAdvance);
  const candidateLimit = Number(maxCandidateMatches);
  const rngLimit = Number(maxRngAdvances);

  if (
    !Number.isInteger(minimumAdvanceCount) ||
    minimumAdvanceCount < 0 ||
    !Number.isInteger(candidateLimit) ||
    candidateLimit < 1 ||
    !Number.isInteger(rngLimit) ||
    rngLimit < minimumAdvanceCount
  ) {
    throw new RangeError(
      "Invalid extended prediction stream settings."
    );
  }

  let state = advanceEmeraldRngBy(
    normalizedTrainerId.trainerId,
    minimumAdvanceCount
  );
  let scanAdvance = minimumAdvanceCount;
  const candidates = [];
  const matchingRanks = [];

  while (
    candidates.length < candidateLimit &&
    scanAdvance <= rngLimit
  ) {
    const phraseMatch = matchDewfordPhraseAtState(
      state,
      signature
    );

    if (phraseMatch.matches) {
      const trend =
        getFeebasRandOffsetForTrend(state);
      const rank = candidates.length + 1;
      const exactMatch =
        trend.feebasValueDecimal === exactDecimal;
      const candidate = {
        candidateNumber: rank,
        rank,
        value: trend.feebasValue,
        decimal: trend.feebasValueDecimal,
        scanAdvance,
        firstWordState: state,
        firstWordStateHex:
          phraseMatch.stateHex.firstWordState,
        trendRandOffset:
          trend.trendRandOffset,
        test1: trend.test1,
        test2: trend.test2,
        exactMatch
      };

      candidates.push(candidate);

      if (exactMatch) {
        matchingRanks.push(rank);
      }
    }

    state = advanceEmeraldRng(state);
    scanAdvance += 1;
  }

  const firstMatchRank = matchingRanks[0] ?? null;
  const firstMatch =
    firstMatchRank === null
      ? null
      : candidates[firstMatchRank - 1];

  return {
    trainerId: normalizedTrainerId.trainerId,
    trainerIdDisplay:
      normalizedTrainerId.paddedTrainerId,
    exactValue: exactFormatted,
    exactDecimal,
    phraseSignature: signature,
    minSearchAdvance: minimumAdvanceCount,
    maxCandidateMatches: candidateLimit,
    maxRngAdvances: rngLimit,
    phraseMatchesExamined: candidates.length,
    rngAdvancesScanned:
      Math.max(0, scanAdvance - minimumAdvanceCount),
    stoppedAtScanAdvance: scanAdvance - 1,
    searchLimitReached:
      candidates.length < candidateLimit,
    exactValueFound: firstMatch !== null,
    firstMatchingCandidateRank: firstMatchRank,
    firstMatch,
    additionalMatchingRanks:
      matchingRanks.length > 1
        ? matchingRanks.slice(1)
        : [],
    candidates
  };
}

export function getEmeraldEasyChatAudit() {
  return {
    ...auditEmeraldEasyChatWords(),
    expectedCounts:
      EMERALD_EASY_CHAT_EXPECTED_COUNTS
  };
}
