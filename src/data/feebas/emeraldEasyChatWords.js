// Source: pret/pokeemerald Easy Chat word group data, preserved in internal index order.
export const EMERALD_EASY_CHAT_SOURCE =
  "https://github.com/pret/pokeemerald/tree/master/src/data/easy_chat";

function withIndexes(words, group) {
  return words.map((text, index) => ({
    text,
    index,
    group
  }));
}

export const EMERALD_EASY_CHAT_CONDITIONS =
  withIndexes(
    [
      "HOT",
      "EXISTS",
      "EXCESS",
      "APPROVED",
      "HAS",
      "GOOD",
      "LESS",
      "MOMENTUM",
      "GOING",
      "WEIRD",
      "BUSY",
      "TOGETHER",
      "FULL",
      "ABSENT",
      "BEING",
      "NEED",
      "TASTY",
      "SKILLED",
      "NOISY",
      "BIG",
      "LATE",
      "CLOSE",
      "DOCILE",
      "AMUSING",
      "ENTERTAINING",
      "PERFECTION",
      "PRETTY",
      "HEALTHY",
      "EXCELLENT",
      "UPSIDE DOWN",
      "COLD",
      "REFRESHING",
      "UNAVOIDABLE",
      "MUCH",
      "OVERWHELMING",
      "FABULOUS",
      "ELSE",
      "EXPENSIVE",
      "CORRECT",
      "IMPOSSIBLE",
      "SMALL",
      "DIFFERENT",
      "TIRED",
      "SKILL",
      "TOP",
      "NON-STOP",
      "PREPOSTEROUS",
      "NONE",
      "NOTHING",
      "NATURAL",
      "BECOMES",
      "LUKEWARM",
      "FAST",
      "LOW",
      "AWFUL",
      "ALONE",
      "BORED",
      "SECRET",
      "MYSTERY",
      "LACKS",
      "BEST",
      "LOUSY",
      "MISTAKE",
      "KIND",
      "WELL",
      "WEAKENED",
      "SIMPLE",
      "SEEMS",
      "BADLY"
    ],
    "conditions"
  );

export const EMERALD_EASY_CHAT_LIFESTYLE =
  withIndexes(
    [
      "CHORES",
      "HOME",
      "MONEY",
      "ALLOWANCE",
      "BATH",
      "CONVERSATION",
      "SCHOOL",
      "COMMEMORATE",
      "HABIT",
      "GROUP",
      "WORD",
      "STORE",
      "SERVICE",
      "WORK",
      "SYSTEM",
      "TRAIN",
      "CLASS",
      "LESSONS",
      "INFORMATION",
      "LIVING",
      "TEACHER",
      "TOURNAMENT",
      "LETTER",
      "EVENT",
      "DIGITAL",
      "TEST",
      "DEPT. STORE",
      "TELEVISION",
      "PHONE",
      "ITEM",
      "NAME",
      "NEWS",
      "POPULAR",
      "PARTY",
      "STUDY",
      "MACHINE",
      "MAIL",
      "MESSAGE",
      "PROMISE",
      "DREAM",
      "KINDERGARTEN",
      "LIFE",
      "RADIO",
      "RENTAL",
      "WORLD"
    ],
    "lifestyle"
  );

export const EMERALD_EASY_CHAT_HOBBIES =
  withIndexes(
    [
      "IDOL",
      "ANIME",
      "SONG",
      "MOVIE",
      "SWEETS",
      "CHAT",
      "CHILD'S PLAY",
      "TOYS",
      "MUSIC",
      "CARDS",
      "SHOPPING",
      "CAMERA",
      "VIEWING",
      "SPECTATOR",
      "GOURMET",
      "GAME",
      "RPG",
      "COLLECTION",
      "COMPLETE",
      "MAGAZINE",
      "WALK",
      "BIKE",
      "HOBBY",
      "SPORTS",
      "SOFTWARE",
      "SONGS",
      "DIET",
      "TREASURE",
      "TRAVEL",
      "DANCE",
      "CHANNEL",
      "MAKING",
      "FISHING",
      "DATE",
      "DESIGN",
      "LOCOMOTIVE",
      "PLUSH DOLL",
      "PC",
      "FLOWERS",
      "HERO",
      "NAP",
      "HEROINE",
      "FASHION",
      "ADVENTURE",
      "BOARD",
      "BALL",
      "BOOK",
      "FESTIVAL",
      "COMICS",
      "HOLIDAY",
      "PLANS",
      "TRENDY",
      "VACATION",
      "LOOK"
    ],
    "hobbies"
  );

export const EMERALD_EASY_CHAT_SECOND_GROUPS = {
  lifestyle: EMERALD_EASY_CHAT_LIFESTYLE,
  hobbies: EMERALD_EASY_CHAT_HOBBIES
};

export const EMERALD_EASY_CHAT_EXPECTED_COUNTS = {
  conditions: 69,
  lifestyle: 45,
  hobbies: 54
};

export const EMERALD_EASY_CHAT_MASK_BITS = 9;
export const EMERALD_EASY_CHAT_MASK_INDEX =
  (1 << EMERALD_EASY_CHAT_MASK_BITS) - 1;
export const EMERALD_EASY_CHAT_GROUP_IDS = {
  conditions: 10,
  lifestyle: 12,
  hobbies: 13
};

const EMERALD_EASY_CHAT_GROUPS_BY_ID = {
  [EMERALD_EASY_CHAT_GROUP_IDS.conditions]: {
    key: "conditions",
    label: "CONDITIONS",
    words: EMERALD_EASY_CHAT_CONDITIONS
  },
  [EMERALD_EASY_CHAT_GROUP_IDS.lifestyle]: {
    key: "lifestyle",
    label: "LIFESTYLE",
    words: EMERALD_EASY_CHAT_LIFESTYLE
  },
  [EMERALD_EASY_CHAT_GROUP_IDS.hobbies]: {
    key: "hobbies",
    label: "HOBBIES",
    words: EMERALD_EASY_CHAT_HOBBIES
  }
};

export function encodeEmeraldEasyChatWord(
  group,
  index
) {
  const groupId =
    EMERALD_EASY_CHAT_GROUP_IDS[group];

  if (groupId === undefined) {
    throw new RangeError(
      `Unsupported Emerald Easy Chat group ${group}.`
    );
  }

  return (
    (groupId << EMERALD_EASY_CHAT_MASK_BITS) |
    (index & EMERALD_EASY_CHAT_MASK_INDEX)
  );
}

export function decodeEmeraldEasyChatWord(rawValue) {
  const raw = Number(rawValue) & 0xffff;

  if (raw === 0xffff) {
    return {
      raw,
      rawHex: "0xFFFF",
      decoded: false,
      empty: true,
      reason: "Empty Easy Chat word."
    };
  }

  const groupId = raw >> EMERALD_EASY_CHAT_MASK_BITS;
  const index =
    raw & EMERALD_EASY_CHAT_MASK_INDEX;
  const group =
    EMERALD_EASY_CHAT_GROUPS_BY_ID[groupId];

  if (!group) {
    return {
      raw,
      rawHex: `0x${raw
        .toString(16)
        .toUpperCase()
        .padStart(4, "0")}`,
      decoded: false,
      empty: false,
      groupId,
      index,
      reason:
        "This Easy Chat group is not loaded in the Emerald Feebas diagnostic data."
    };
  }

  const word = group.words[index];

  if (!word) {
    return {
      raw,
      rawHex: `0x${raw
        .toString(16)
        .toUpperCase()
        .padStart(4, "0")}`,
      decoded: false,
      empty: false,
      groupId,
      group: group.key,
      groupLabel: group.label,
      index,
      reason:
        "Easy Chat word index is outside the loaded group."
    };
  }

  return {
    raw,
    rawHex: `0x${raw
      .toString(16)
      .toUpperCase()
      .padStart(4, "0")}`,
    decoded: true,
    empty: false,
    groupId,
    group: group.key,
    groupLabel: group.label,
    index,
    text: word.text,
    word
  };
}

export function auditEmeraldEasyChatWords() {
  const counts = {
    conditions: EMERALD_EASY_CHAT_CONDITIONS.length,
    lifestyle: EMERALD_EASY_CHAT_LIFESTYLE.length,
    hobbies: EMERALD_EASY_CHAT_HOBBIES.length
  };

  return {
    counts,
    valid:
      counts.conditions ===
        EMERALD_EASY_CHAT_EXPECTED_COUNTS.conditions &&
      counts.lifestyle ===
        EMERALD_EASY_CHAT_EXPECTED_COUNTS.lifestyle &&
      counts.hobbies ===
        EMERALD_EASY_CHAT_EXPECTED_COUNTS.hobbies
  };
}
