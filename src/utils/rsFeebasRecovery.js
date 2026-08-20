import {
  EMERALD_EASY_CHAT_CONDITIONS,
  EMERALD_EASY_CHAT_SECOND_GROUPS
} from "../data/feebas/emeraldEasyChatWords";
import {
  advanceEmeraldRng,
  advanceEmeraldRngBy,
  formatFeebasValue,
  getDewfordPhraseSignature,
  getFeebasRandOffsetForTrend,
  getUpper16,
  normalizeTrainerId
} from "./emeraldFeebasRecovery";
import { calculateRseFeebasFromValue } from "./rseFeebasCalculator";

export const RS_DEAD_RTC_DUMMY_DAY_COUNT = 1;
export const RS_MINUTES_PER_DAY = 1440;
export const RS_DEAD_RTC_BOOT_SEED = 0x05a0;
export const RS_TID_TO_TREND_GAP_CANDIDATES = [
  2,
  3
];
export const RS_STANDARD_DEAD_BATTERY_CANDIDATE_COUNT = 3;
export const RS_WORKING_BATTERY_LOW16_COUNT = 0x10000;

function nowMs() {
  return typeof performance !== "undefined" &&
    typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

export function getRubySapphireBootSeedForDeadRtc({
  dayCount = RS_DEAD_RTC_DUMMY_DAY_COUNT,
  hours = 0,
  minutes = 0
} = {}) {
  const minuteCount =
    dayCount * RS_MINUTES_PER_DAY +
    hours * 60 +
    minutes;

  return (
    ((minuteCount >>> 16) ^ minuteCount) & 0xffff
  );
}

function normalizePhrase(input) {
  if (input?.firstWordIndex !== undefined) {
    return input;
  }

  return getDewfordPhraseSignature(input);
}

function phraseMatchesTrend(phrase, trend) {
  return (
    trend.firstWordIndex === phrase.firstWordIndex &&
    trend.secondWordGroup ===
      phrase.secondWordGroup &&
    trend.secondWordIndex === phrase.secondWordIndex
  );
}

function trendSetContainsPhrase(trends, phrase) {
  return trends.some(trend =>
    phraseMatchesTrend(phrase, trend)
  );
}

export function simulateRsInitialDewfordTrend(
  preTrendState,
  trendIndex = 0
) {
  const firstWordState =
    advanceEmeraldRng(preTrendState);
  const firstWordIndex =
    getUpper16(firstWordState) %
    EMERALD_EASY_CHAT_CONDITIONS.length;
  const groupState = advanceEmeraldRng(firstWordState);
  const secondWordGroup =
    (getUpper16(groupState) & 1) === 1
      ? "lifestyle"
      : "hobbies";
  const secondGroup =
    EMERALD_EASY_CHAT_SECOND_GROUPS[
      secondWordGroup
    ];
  const secondWordState =
    advanceEmeraldRng(groupState);
  const secondWordIndex =
    getUpper16(secondWordState) % secondGroup.length;
  const trend =
    getFeebasRandOffsetForTrend(firstWordState);

  return {
    trendIndex,
    preTrendState,
    firstWordState,
    firstWordStateHex: `0x${firstWordState
      .toString(16)
      .toUpperCase()
      .padStart(8, "0")}`,
    firstWordIndex,
    firstWord:
      EMERALD_EASY_CHAT_CONDITIONS[firstWordIndex],
    secondWordGroup,
    secondWordGroupBit:
      secondWordGroup === "lifestyle" ? 1 : 0,
    secondWordIndex,
    secondWord: secondGroup[secondWordIndex],
    phrase: `${EMERALD_EASY_CHAT_CONDITIONS[firstWordIndex].text} / ${secondGroup[secondWordIndex].text}`,
    trendRandOffset: trend.trendRandOffset,
    test1: trend.test1,
    test2: trend.test2,
    rand: trend.feebasValueDecimal,
    value: trend.feebasValue,
    stateAfterTrend: trend.feebasValueState
  };
}

export function simulateRsInitialDewfordTrends(
  preTrendState,
  trendCount = 5
) {
  const trends = [];
  let state = preTrendState >>> 0;

  for (let index = 0; index < trendCount; index += 1) {
    const trend = simulateRsInitialDewfordTrend(
      state,
      index
    );
    trends.push(trend);
    state = trend.stateAfterTrend;
  }

  return {
    initialState: preTrendState >>> 0,
    finalState: state,
    trends
  };
}

function buildRsCandidate({
  tidState,
  tidAdvance = null,
  timingGap,
  phrase,
  additionalPhrases = [],
  source
}) {
  const preTrendState = advanceEmeraldRngBy(
    tidState,
    timingGap
  );
  const simulated =
    simulateRsInitialDewfordTrends(preTrendState);

  if (!trendSetContainsPhrase(simulated.trends, phrase)) {
    return null;
  }

  for (const extraPhrase of additionalPhrases) {
    if (
      !trendSetContainsPhrase(
        simulated.trends,
        extraPhrase
      )
    ) {
      return null;
    }
  }

  const matchingTrend = simulated.trends.find(trend =>
    phraseMatchesTrend(phrase, trend)
  );

  return {
    source,
    tidState,
    tidStateHex: `0x${(tidState >>> 0)
      .toString(16)
      .toUpperCase()
      .padStart(8, "0")}`,
    tidAdvance,
    timingGap,
    preTrendState,
    preTrendStateHex: `0x${preTrendState
      .toString(16)
      .toUpperCase()
      .padStart(8, "0")}`,
    matchingTrendIndex: matchingTrend.trendIndex,
    value: matchingTrend.value,
    decimal: matchingTrend.rand,
    trends: simulated.trends
  };
}

function dedupeRsCandidates(candidates) {
  const byValue = new Map();

  for (const candidate of candidates) {
    if (!byValue.has(candidate.value)) {
      byValue.set(candidate.value, {
        value: candidate.value,
        decimal: candidate.decimal,
        matchingRecoveryStates: []
      });
    }

    byValue.get(candidate.value).matchingRecoveryStates.push({
      tidState: candidate.tidState,
      tidStateHex: candidate.tidStateHex,
      tidAdvance: candidate.tidAdvance,
      timingGap: candidate.timingGap,
      matchingTrendIndex:
        candidate.matchingTrendIndex
    });
  }

  return [...byValue.values()];
}

export function findRsDeadBatteryCandidates({
  trainerId,
  phrase,
  phraseSignature,
  candidateCount = RS_STANDARD_DEAD_BATTERY_CANDIDATE_COUNT,
  maxTidSearchAdvances = 1000000
}) {
  const normalized = normalizeTrainerId(trainerId);
  if (!normalized.valid) {
    throw new Error(normalized.error);
  }

  const signature = normalizePhrase(
    phraseSignature ?? phrase
  );
  const matches = [];
  let state = RS_DEAD_RTC_BOOT_SEED;

  for (
    let advance = 1;
    advance <= maxTidSearchAdvances &&
    matches.length < candidateCount;
    advance += 1
  ) {
    state = advanceEmeraldRng(state);

    if (getUpper16(state) !== normalized.trainerId) {
      continue;
    }

    for (const timingGap of RS_TID_TO_TREND_GAP_CANDIDATES) {
      const candidate = buildRsCandidate({
        tidState: state,
        tidAdvance: advance,
        timingGap,
        phrase: signature,
        source: "dead-rtc"
      });

      if (candidate) {
        matches.push(candidate);
        if (matches.length >= candidateCount) break;
      }
    }
  }

  return {
    mode: "dead-rtc",
    trainerId: normalized.trainerId,
    trainerIdDisplay: normalized.paddedTrainerId,
    bootSeed: RS_DEAD_RTC_BOOT_SEED,
    phraseSignature: signature,
    timingGaps: RS_TID_TO_TREND_GAP_CANDIDATES,
    candidates: matches,
    uniqueValues: dedupeRsCandidates(matches)
  };
}

export function enumerateRsTidStateCandidates(
  trainerId
) {
  const normalized = normalizeTrainerId(trainerId);
  if (!normalized.valid) {
    throw new Error(normalized.error);
  }

  return Array.from(
    { length: RS_WORKING_BATTERY_LOW16_COUNT },
    (_, low16) =>
      ((normalized.trainerId << 16) | low16) >>> 0
  );
}

export function findRsWorkingBatteryCandidates({
  trainerId,
  phrase,
  phraseSignature,
  additionalPhrases = []
}) {
  const normalized = normalizeTrainerId(trainerId);
  if (!normalized.valid) {
    throw new Error(normalized.error);
  }

  const signature = normalizePhrase(
    phraseSignature ?? phrase
  );
  const extraSignatures = additionalPhrases.map(
    normalizePhrase
  );
  const candidates = [];
  const filterCounts = {
    statesExamined: 0,
    statesSurvivingCurrentPhrase: 0,
    afterAdditionalPhrases: []
  };
  const start = nowMs();

  for (let low16 = 0; low16 <= 0xffff; low16 += 1) {
    const tidState =
      ((normalized.trainerId << 16) | low16) >>> 0;

    for (const timingGap of RS_TID_TO_TREND_GAP_CANDIDATES) {
      filterCounts.statesExamined += 1;
      const preTrendState = advanceEmeraldRngBy(
        tidState,
        timingGap
      );
      const simulated =
        simulateRsInitialDewfordTrends(preTrendState);

      if (
        !trendSetContainsPhrase(
          simulated.trends,
          signature
        )
      ) {
        continue;
      }

      filterCounts.statesSurvivingCurrentPhrase += 1;

      let survivedExtras = true;
      for (
        let index = 0;
        index < extraSignatures.length;
        index += 1
      ) {
        if (
          !trendSetContainsPhrase(
            simulated.trends,
            extraSignatures[index]
          )
        ) {
          survivedExtras = false;
          break;
        }

        filterCounts.afterAdditionalPhrases[index] =
          (filterCounts.afterAdditionalPhrases[index] ??
            0) + 1;
      }

      if (!survivedExtras) continue;

      const matchingTrend = simulated.trends.find(trend =>
        phraseMatchesTrend(signature, trend)
      );

      candidates.push({
        source: "working-battery",
        low16,
        low16Hex: `0x${low16
          .toString(16)
          .toUpperCase()
          .padStart(4, "0")}`,
        tidState,
        tidStateHex: `0x${tidState
          .toString(16)
          .toUpperCase()
          .padStart(8, "0")}`,
        timingGap,
        matchingTrendIndex:
          matchingTrend.trendIndex,
        value: matchingTrend.value,
        decimal: matchingTrend.rand,
        trends: simulated.trends
      });
    }
  }

  const elapsedMs = nowMs() - start;
  const uniqueValues = dedupeRsCandidates(candidates);

  return {
    mode: "working-battery",
    trainerId: normalized.trainerId,
    trainerIdDisplay: normalized.paddedTrainerId,
    phraseSignature: signature,
    additionalPhrases: extraSignatures,
    timingGaps: RS_TID_TO_TREND_GAP_CANDIDATES,
    candidates,
    uniqueValues,
    filterCounts: {
      ...filterCounts,
      uniqueFeebasValues: uniqueValues.length,
      elapsedMs
    }
  };
}

export function extractRsExactFeebasValue(parseResult) {
  return parseResult?.feebasValue ?? null;
}

export function calculateSharedRseTilesForGame(
  game,
  value
) {
  return {
    game,
    value: formatFeebasValue(
      typeof value === "number"
        ? value
        : Number.parseInt(value, 16)
    ),
    result: calculateRseFeebasFromValue(value)
  };
}
