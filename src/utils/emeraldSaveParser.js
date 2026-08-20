import { decodeEmeraldEasyChatWord } from "../data/feebas/emeraldEasyChatWords";
import {
  formatUint16Hex,
  formatUint32Hex
} from "./rseFeebasCalculator";

export const GBA_SAVE_SIZE = 0x20000;
export const MGBA_RTC_EXTENSION_SIZE = 0x10;
export const MGBA_RTC_APPENDED_SAVE_SIZE =
  GBA_SAVE_SIZE + MGBA_RTC_EXTENSION_SIZE;
export const SECTOR_SIZE = 0x1000;
export const SECTOR_DATA_SIZE = 0x0f80;
export const SECTOR_ID_OFFSET = 0x0ff4;
export const SECTOR_CHECKSUM_OFFSET = 0x0ff6;
export const SECTOR_SIGNATURE_OFFSET = 0x0ff8;
export const SECTOR_COUNTER_OFFSET = 0x0ffc;
export const SECTOR_SIGNATURE = 0x08012025;
export const SECTORS_PER_SLOT = 14;
export const PHYSICAL_SAVE_SLOT_SECTORS = 28;
export const PHYSICAL_SECTOR_COUNT = 32;
export const EMERALD_SAVE_BLOCK1_SIZE = 0x3d88;
export const RS_SAVE_BLOCK1_SIZE = 0x3ac0;
export const SAVE_BLOCK1_SIZE = EMERALD_SAVE_BLOCK1_SIZE;
export const SAVE_BLOCK2_TRAINER_ID_OFFSET = 0x000a;
export const EMERALD_DEWFORD_TRENDS_OFFSET = 0x2e68;
export const RS_DEWFORD_TRENDS_OFFSET = 0x2dd4;
export const EMERALD_DEWFORD_TREND_SIZE = 8;
export const RS_DEWFORD_TREND_SIZE = 8;
export const EMERALD_DEWFORD_TREND_COUNT = 5;
export const RS_DEWFORD_TREND_COUNT = 5;
export const DEWFORD_TREND_METADATA_OFFSET = 0x00;
export const DEWFORD_TREND_RAND_OFFSET = 0x02;
export const DEWFORD_TREND_WORD0_OFFSET = 0x04;
export const DEWFORD_TREND_WORD1_OFFSET = 0x06;
export const SAVE_BLOCK1_LOGICAL_SECTOR_IDS = [
  1,
  2,
  3,
  4
];
export const SAVE_BLOCK1_SECTOR_OFFSETS = {
  1: 0x0000,
  2: 0x0f80,
  3: 0x1f00,
  4: 0x2e80
};

// The stale global.h annotation places dewfordTrends at 0x2E64.
// OldMan occupies 0x40 bytes starting at 0x2E28, so DewfordTrend
// starts at 0x2E68; its leading bitfield is followed by u16 rand.
export const EMERALD_FEEBAS_VALUE_OFFSET = 0x2e6a;
export const RS_FEEBAS_VALUE_OFFSET = 0x2dd6;
export const EMERALD_FEEBAS_LOGICAL_SECTOR_ID = 3;
export const RS_FEEBAS_LOGICAL_SECTOR_ID = 3;
export const EMERALD_FEEBAS_SECTOR_OFFSET = 0x0f6a;
export const RS_FEEBAS_SECTOR_OFFSET = 0x0ed6;

export const EMERALD_SECTOR_DATA_SIZES = [
  0x0f2c,
  0x0f80,
  0x0f80,
  0x0f80,
  0x0f08,
  0x0f80,
  0x0f80,
  0x0f80,
  0x0f80,
  0x0f80,
  0x0f80,
  0x0f80,
  0x0f80,
  0x07d0
];

export const RS_SECTOR_DATA_SIZES = [
  0x0890,
  0x0f80,
  0x0f80,
  0x0f80,
  0x0c40,
  0x0f80,
  0x0f80,
  0x0f80,
  0x0f80,
  0x0f80,
  0x0f80,
  0x0f80,
  0x0f80,
  0x07d0
];

export const GEN3_FEEBAS_SAVE_PROFILES = {
  emerald: {
    game: "emerald",
    gameLabel: "Pokémon Emerald",
    saveBlock1Size: EMERALD_SAVE_BLOCK1_SIZE,
    sectorDataSizes: EMERALD_SECTOR_DATA_SIZES,
    dewfordTrendsOffset:
      EMERALD_DEWFORD_TRENDS_OFFSET,
    feebasValueOffset: EMERALD_FEEBAS_VALUE_OFFSET,
    trendSize: EMERALD_DEWFORD_TREND_SIZE,
    trendCount: EMERALD_DEWFORD_TREND_COUNT,
    feebasLogicalSectorId:
      EMERALD_FEEBAS_LOGICAL_SECTOR_ID,
    feebasSectorOffset:
      EMERALD_FEEBAS_SECTOR_OFFSET,
    feebasSectorOffsetHex: "0xF6A"
  },
  rubySapphire: {
    game: "ruby-sapphire",
    gameLabel: "Pokémon Ruby/Sapphire",
    saveBlock1Size: RS_SAVE_BLOCK1_SIZE,
    sectorDataSizes: RS_SECTOR_DATA_SIZES,
    dewfordTrendsOffset: RS_DEWFORD_TRENDS_OFFSET,
    feebasValueOffset: RS_FEEBAS_VALUE_OFFSET,
    trendSize: RS_DEWFORD_TREND_SIZE,
    trendCount: RS_DEWFORD_TREND_COUNT,
    feebasLogicalSectorId: RS_FEEBAS_LOGICAL_SECTOR_ID,
    feebasSectorOffset: RS_FEEBAS_SECTOR_OFFSET,
    feebasSectorOffsetHex: "0xED6"
  }
};

function toUint8Array(input) {
  if (input instanceof Uint8Array) {
    return input;
  }

  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input);
  }

  throw new TypeError(
    "Expected an ArrayBuffer or Uint8Array."
  );
}

function getEmeraldSaveFormat(bytes) {
  if (bytes.length === GBA_SAVE_SIZE) {
    return {
      supported: true,
      format: "standard",
      formatLabel: "standard raw Emerald save",
      rtcExtensionDetected: false,
      saveDataSize: GBA_SAVE_SIZE,
      extraDataSize: 0,
      saveData: bytes
    };
  }

  if (bytes.length === MGBA_RTC_APPENDED_SAVE_SIZE) {
    return {
      supported: true,
      format: "mgba-rtc",
      formatLabel: "mGBA RTC-appended save",
      rtcExtensionDetected: true,
      saveDataSize: GBA_SAVE_SIZE,
      extraDataSize: MGBA_RTC_EXTENSION_SIZE,
      saveData: bytes.subarray(0, GBA_SAVE_SIZE)
    };
  }

  return {
    supported: false,
    format: "unsupported",
    formatLabel: "unsupported",
    rtcExtensionDetected: false,
    saveDataSize: 0,
    extraDataSize: 0,
    saveData: bytes
  };
}

export function readU16LE(bytes, offset) {
  const data = toUint8Array(bytes);
  if (offset < 0 || offset + 1 >= data.length) {
    throw new RangeError(
      `Cannot read u16 at offset ${offset}.`
    );
  }

  return data[offset] | (data[offset + 1] << 8);
}

export function readU32LE(bytes, offset) {
  const data = toUint8Array(bytes);
  if (offset < 0 || offset + 3 >= data.length) {
    throw new RangeError(
      `Cannot read u32 at offset ${offset}.`
    );
  }

  return (
    data[offset] |
    (data[offset + 1] << 8) |
    (data[offset + 2] << 16) |
    (data[offset + 3] << 24)
  ) >>> 0;
}

export function calculateGen3SaveChecksum(
  bytes,
  dataSize = bytes.length
) {
  const data = toUint8Array(bytes);

  if (
    !Number.isInteger(dataSize) ||
    dataSize < 0 ||
    dataSize > data.length ||
    dataSize % 4 !== 0
  ) {
    throw new RangeError(
      "Gen III sector checksum size must be a valid 4-byte-aligned data length."
    );
  }

  let sum = 0;
  for (let offset = 0; offset < dataSize; offset += 4) {
    sum =
      (sum + readU32LE(data, offset)) >>> 0;
  }

  return ((sum >>> 16) + sum) & 0xffff;
}

function getPhysicalSectorBytes(
  input,
  physicalIndex
) {
  const bytes = toUint8Array(input);

  if (bytes.length === SECTOR_SIZE) {
    return bytes;
  }

  const sectorOffset = physicalIndex * SECTOR_SIZE;
  if (
    physicalIndex < 0 ||
    sectorOffset + SECTOR_SIZE > bytes.length
  ) {
    throw new RangeError(
      `Physical sector ${physicalIndex} is outside the provided save data.`
    );
  }

  return bytes.subarray(
    sectorOffset,
    sectorOffset + SECTOR_SIZE
  );
}

function stripSectorData(sector) {
  const diagnostic = { ...sector };
  delete diagnostic.data;
  return diagnostic;
}

function stripSlotData(slot) {
  return {
    ...slot,
    sectorsByLogicalId: Object.fromEntries(
      Object.entries(slot.sectorsByLogicalId).map(
        ([logicalId, sector]) => [
          logicalId,
          stripSectorData(sector)
        ]
      )
    )
  };
}

export function parseSaveSector(
  input,
  physicalIndex = 0,
  {
    includeData = false,
    profile = GEN3_FEEBAS_SAVE_PROFILES.emerald
  } = {}
) {
  const sectorBytes = getPhysicalSectorBytes(
    input,
    physicalIndex
  );
  const slotIndex =
    physicalIndex < SECTORS_PER_SLOT
      ? 0
      : physicalIndex < PHYSICAL_SAVE_SLOT_SECTORS
        ? 1
        : null;
  const logicalId = readU16LE(
    sectorBytes,
    SECTOR_ID_OFFSET
  );
  const storedChecksum = readU16LE(
    sectorBytes,
    SECTOR_CHECKSUM_OFFSET
  );
  const signature = readU32LE(
    sectorBytes,
    SECTOR_SIGNATURE_OFFSET
  );
  const counter = readU32LE(
    sectorBytes,
    SECTOR_COUNTER_OFFSET
  );
  const logicalIdValid =
    logicalId >= 0 &&
    logicalId < SECTORS_PER_SLOT;
  const dataSize = logicalIdValid
    ? profile.sectorDataSizes[logicalId]
    : SECTOR_DATA_SIZE;
  const data = sectorBytes.slice(0, SECTOR_DATA_SIZE);
  const calculatedChecksum =
    calculateGen3SaveChecksum(data, dataSize);
  const signatureValid =
    signature === SECTOR_SIGNATURE;
  const checksumValid =
    logicalIdValid &&
    storedChecksum === calculatedChecksum;
  const sector = {
    physicalIndex,
    slotIndex,
    logicalId,
    storedChecksum,
    storedChecksumHex: formatUint16Hex(
      storedChecksum
    ),
    calculatedChecksum,
    calculatedChecksumHex: formatUint16Hex(
      calculatedChecksum
    ),
    signature,
    signatureHex: formatUint32Hex(signature),
    counter,
    counterHex: formatUint32Hex(counter),
    signatureValid,
    checksumValid,
    logicalIdValid,
    valid:
      signatureValid &&
      checksumValid &&
      logicalIdValid
  };

  if (includeData) {
    sector.data = data;
  }

  return sector;
}

export function validateSaveSector(sector) {
  return {
    ...sector,
    valid:
      Boolean(sector.signatureValid) &&
      Boolean(sector.checksumValid) &&
      Boolean(sector.logicalIdValid)
  };
}

export function validateSaveSlot(
  sectors,
  slotIndex
) {
  const errors = [];
  const sectorsByLogicalId = {};
  const seenLogicalIds = new Set();
  const duplicateLogicalIds = [];
  const counters = new Set();

  if (sectors.length !== SECTORS_PER_SLOT) {
    errors.push(
      `Slot ${slotIndex} must contain 14 sectors.`
    );
  }

  sectors.forEach(sector => {
    counters.add(sector.counter);

    if (!sector.signatureValid) {
      errors.push(
        `Physical sector ${sector.physicalIndex} has invalid signature ${sector.signatureHex}.`
      );
    }

    if (!sector.logicalIdValid) {
      errors.push(
        `Physical sector ${sector.physicalIndex} has invalid logical ID ${sector.logicalId}.`
      );
      return;
    }

    if (!sector.checksumValid) {
      errors.push(
        `Physical sector ${sector.physicalIndex} logical ID ${sector.logicalId} checksum failed.`
      );
    }

    if (seenLogicalIds.has(sector.logicalId)) {
      duplicateLogicalIds.push(sector.logicalId);
    } else {
      seenLogicalIds.add(sector.logicalId);
      sectorsByLogicalId[sector.logicalId] = sector;
    }
  });

  const missingLogicalIds = [];
  for (
    let logicalId = 0;
    logicalId < SECTORS_PER_SLOT;
    logicalId += 1
  ) {
    if (!seenLogicalIds.has(logicalId)) {
      missingLogicalIds.push(logicalId);
    }
  }

  if (duplicateLogicalIds.length > 0) {
    errors.push(
      `Duplicate logical sector IDs: ${duplicateLogicalIds.join(", ")}.`
    );
  }

  if (missingLogicalIds.length > 0) {
    errors.push(
      `Missing logical sector IDs: ${missingLogicalIds.join(", ")}.`
    );
  }

  if (counters.size > 1) {
    errors.push(
      "Conflicting counters within save slot."
    );
  }

  const validSectors = sectors.filter(
    sector => sector.valid
  ).length;
  const counter =
    counters.size === 1
      ? sectors[0]?.counter
      : null;

  return {
    slotIndex,
    label: slotIndex === 0 ? "A" : "B",
    valid: errors.length === 0,
    counter,
    counterHex:
      counter === null ? null : formatUint32Hex(counter),
    validSectors,
    logicalIds: [...seenLogicalIds].sort(
      (left, right) => left - right
    ),
    missingLogicalIds,
    duplicateLogicalIds,
    sectorsByLogicalId,
    errors
  };
}

export function compareSaveCounters(left, right) {
  const a = Number(left) >>> 0;
  const b = Number(right) >>> 0;

  if (a === b) return 0;
  if (a === 0 && b === 0xffffffff) return 1;
  if (a === 0xffffffff && b === 0) return -1;

  return a > b ? 1 : -1;
}

export function selectNewestSaveSlot(slots) {
  const validSlots = slots.filter(slot => slot.valid);

  if (validSlots.length === 0) {
    return {
      valid: false,
      slot: null,
      error:
        "No complete save slot with valid Gen III sector signatures and checksums was found."
    };
  }

  if (validSlots.length === 1) {
    return {
      valid: true,
      slot: validSlots[0],
      error: null
    };
  }

  const comparison = compareSaveCounters(
    validSlots[0].counter,
    validSlots[1].counter
  );

  return {
    valid: true,
    slot:
      comparison >= 0 ? validSlots[0] : validSlots[1],
    error: null
  };
}

export function reconstructSaveBlock1(
  slot,
  profile = GEN3_FEEBAS_SAVE_PROFILES.emerald
) {
  if (!slot?.valid) {
    throw new Error(
      "Cannot reconstruct SaveBlock1 from an invalid save slot."
    );
  }

  const saveBlock1 = new Uint8Array(
    profile.saveBlock1Size
  );

  for (const logicalId of SAVE_BLOCK1_LOGICAL_SECTOR_IDS) {
    const sector = slot.sectorsByLogicalId[logicalId];
    if (!sector?.data) {
      throw new Error(
        `Missing logical sector ${logicalId} data for SaveBlock1 reconstruction.`
      );
    }

    const destinationOffset =
      SAVE_BLOCK1_SECTOR_OFFSETS[logicalId];
    const bytesToCopy = Math.min(
      sector.data.length,
      profile.saveBlock1Size - destinationOffset
    );
    saveBlock1.set(
      sector.data.subarray(0, bytesToCopy),
      destinationOffset
    );
  }

  return saveBlock1;
}

export function reconstructEmeraldSaveBlock1(slot) {
  return reconstructSaveBlock1(
    slot,
    GEN3_FEEBAS_SAVE_PROFILES.emerald
  );
}

export function extractFeebasValueFromSaveBlock1(
  saveBlock1,
  profile = GEN3_FEEBAS_SAVE_PROFILES.emerald
) {
  const data = toUint8Array(saveBlock1);
  if (
    profile.feebasValueOffset + 1 >=
    data.length
  ) {
    throw new RangeError(
      "Feebas value offset is outside reconstructed SaveBlock1."
    );
  }

  const decimal = readU16LE(
    data,
    profile.feebasValueOffset
  );

  return {
    decimal,
    value: (decimal & 0xffff)
      .toString(16)
      .toUpperCase()
      .padStart(4, "0"),
    valueHex: formatUint16Hex(decimal),
    offset: profile.feebasValueOffset,
    offsetHex: formatUint16Hex(
      profile.feebasValueOffset
    )
  };
}

export function extractEmeraldFeebasValue(saveBlock1) {
  return extractFeebasValueFromSaveBlock1(
    saveBlock1,
    GEN3_FEEBAS_SAVE_PROFILES.emerald
  );
}

export function extractDewfordTrends(
  saveBlock1,
  profile = GEN3_FEEBAS_SAVE_PROFILES.emerald
) {
  const data = toUint8Array(saveBlock1);
  const trendsEnd =
    profile.dewfordTrendsOffset +
    profile.trendSize * profile.trendCount;

  if (trendsEnd > data.length) {
    throw new RangeError(
      "Dewford Trend structures are outside reconstructed SaveBlock1."
    );
  }

  return Array.from(
    { length: profile.trendCount },
    (_, index) => {
      const baseOffset =
        profile.dewfordTrendsOffset +
        index * profile.trendSize;
      const metadata = readU16LE(
        data,
        baseOffset + DEWFORD_TREND_METADATA_OFFSET
      );
      const rand = readU16LE(
        data,
        baseOffset + DEWFORD_TREND_RAND_OFFSET
      );
      const word0Raw = readU16LE(
        data,
        baseOffset + DEWFORD_TREND_WORD0_OFFSET
      );
      const word1Raw = readU16LE(
        data,
        baseOffset + DEWFORD_TREND_WORD1_OFFSET
      );

      return {
        index,
        current: index === 0,
        baseOffset,
        baseOffsetHex: formatUint16Hex(baseOffset),
        metadata,
        metadataHex: formatUint16Hex(metadata),
        rand,
        randHex: formatUint16Hex(rand).slice(2),
        word0Raw,
        word0RawHex: formatUint16Hex(word0Raw),
        word1Raw,
        word1RawHex: formatUint16Hex(word1Raw),
        firstWord: decodeEmeraldEasyChatWord(
          word0Raw
        ),
        secondWord: decodeEmeraldEasyChatWord(
          word1Raw
        )
      };
    }
  );
}

export function extractEmeraldDewfordTrends(saveBlock1) {
  return extractDewfordTrends(
    saveBlock1,
    GEN3_FEEBAS_SAVE_PROFILES.emerald
  );
}

export function getCurrentTrendWindow(
  saveBlock1,
  profile = GEN3_FEEBAS_SAVE_PROFILES.emerald
) {
  const data = toUint8Array(saveBlock1);
  const base = profile.dewfordTrendsOffset;

  return {
    metadata: {
      offset: base,
      offsetHex: formatUint16Hex(base),
      value: readU16LE(data, base),
      valueHex: formatUint16Hex(readU16LE(data, base))
    },
    rand: {
      offset: base + 0x02,
      offsetHex: formatUint16Hex(base + 0x02),
      value: readU16LE(data, base + 0x02),
      valueHex: formatUint16Hex(
        readU16LE(data, base + 0x02)
      ).slice(2)
    },
    word0: {
      offset: base + 0x04,
      offsetHex: formatUint16Hex(base + 0x04),
      value: readU16LE(data, base + 0x04),
      valueHex: formatUint16Hex(
        readU16LE(data, base + 0x04)
      )
    },
    word1: {
      offset: base + 0x06,
      offsetHex: formatUint16Hex(base + 0x06),
      value: readU16LE(data, base + 0x06),
      valueHex: formatUint16Hex(
        readU16LE(data, base + 0x06)
      )
    }
  };
}

export function getEmeraldCurrentTrendWindow(
  saveBlock1
) {
  return getCurrentTrendWindow(
    saveBlock1,
    GEN3_FEEBAS_SAVE_PROFILES.emerald
  );
}

function readTrainerId(slot) {
  const saveBlock2 =
    slot.sectorsByLogicalId[0]?.data;

  if (!saveBlock2) return null;

  return readU16LE(
    saveBlock2,
    SAVE_BLOCK2_TRAINER_ID_OFFSET
  );
}

function parseSaveSlots(
  bytes,
  profile = GEN3_FEEBAS_SAVE_PROFILES.emerald
) {
  const sectors = [];
  for (
    let physicalIndex = 0;
    physicalIndex < PHYSICAL_SAVE_SLOT_SECTORS;
    physicalIndex += 1
  ) {
    sectors.push(
      parseSaveSector(bytes, physicalIndex, {
        includeData: true,
        profile
      })
    );
  }

  const slots = [
    validateSaveSlot(
      sectors.slice(0, SECTORS_PER_SLOT),
      0
    ),
    validateSaveSlot(
      sectors.slice(
        SECTORS_PER_SLOT,
        PHYSICAL_SAVE_SLOT_SECTORS
      ),
      1
    )
  ];

  return {
    sectors,
    slots
  };
}

export function parseGen3FeebasSave(
  input,
  profile = GEN3_FEEBAS_SAVE_PROFILES.emerald
) {
  const bytes = toUint8Array(input);
  const saveFormat = getEmeraldSaveFormat(bytes);

  if (!saveFormat.supported) {
    return {
      valid: false,
      unsupportedFormat: true,
      fileSize: bytes.length,
      expectedFileSize: GBA_SAVE_SIZE,
      saveDataSize: 0,
      extraDataSize: 0,
      format: saveFormat.format,
      formatLabel: saveFormat.formatLabel,
      rtcExtensionDetected: false,
      errors: [
        "Unsupported save size.",
        `Expected a 128 KiB raw ${profile.gameLabel} .sav file.`,
        `Received: ${bytes.length} bytes.`
      ],
      sectors: [],
      slots: [],
      selectedSlot: null
    };
  }

  const { sectors, slots } = parseSaveSlots(
    saveFormat.saveData,
    profile
  );
  const selected = selectNewestSaveSlot(slots);

  if (!selected.valid) {
    return {
      valid: false,
      unsupportedFormat: false,
      fileSize: bytes.length,
      expectedFileSize: GBA_SAVE_SIZE,
      saveDataSize: saveFormat.saveDataSize,
      extraDataSize: saveFormat.extraDataSize,
      format: saveFormat.format,
      formatLabel: saveFormat.formatLabel,
      rtcExtensionDetected:
        saveFormat.rtcExtensionDetected,
      errors: [
        "This does not appear to be a valid standard Pokémon Emerald save.",
        `Selected profile: ${profile.gameLabel}.`,
        selected.error
      ],
      sectors: sectors.map(stripSectorData),
      slots: slots.map(stripSlotData),
      selectedSlot: null
    };
  }

  try {
    const saveBlock1 =
      reconstructSaveBlock1(selected.slot, profile);
    const feebasValue =
      extractFeebasValueFromSaveBlock1(
        saveBlock1,
        profile
      );
    const storedDewfordTrends =
      extractDewfordTrends(saveBlock1, profile);
    const currentTrendWindow =
      getCurrentTrendWindow(saveBlock1, profile);
    const logicalSector3 =
      selected.slot.sectorsByLogicalId[
        profile.feebasLogicalSectorId
      ];
    const directSectorDecimal = readU16LE(
      logicalSector3.data,
      profile.feebasSectorOffset
    );

    if (directSectorDecimal !== feebasValue.decimal) {
      throw new Error(
        "Direct logical-sector Feebas sanity check did not match reconstructed SaveBlock1."
      );
    }

    return {
      valid: true,
      unsupportedFormat: false,
      fileSize: bytes.length,
      expectedFileSize: GBA_SAVE_SIZE,
      saveDataSize: saveFormat.saveDataSize,
      extraDataSize: saveFormat.extraDataSize,
      format: saveFormat.format,
      formatLabel: saveFormat.formatLabel,
      rtcExtensionDetected:
        saveFormat.rtcExtensionDetected,
      physicalSectorCount: PHYSICAL_SECTOR_COUNT,
      parsedPhysicalSectors:
        PHYSICAL_SAVE_SLOT_SECTORS,
      sectorSize: SECTOR_SIZE,
      sectorDataSize: SECTOR_DATA_SIZE,
      profile: profile.game,
      profileLabel: profile.gameLabel,
      sectors: sectors.map(stripSectorData),
      slots: slots.map(stripSlotData),
      selectedSlot: {
        slotIndex: selected.slot.slotIndex,
        label: selected.slot.label,
        counter: selected.slot.counter,
        counterHex: selected.slot.counterHex
      },
      saveBlock1Reconstructed: true,
      feebasValue,
      storedDewfordTrends,
      currentTrendWindow,
      trainerId: readTrainerId(selected.slot),
      directSectorSanity: {
        logicalSectorId:
          profile.feebasLogicalSectorId,
        sectorOffset:
          profile.feebasSectorOffset,
        sectorOffsetHex:
          profile.feebasSectorOffsetHex,
        decimal: directSectorDecimal,
        value: feebasValue.value,
        matches: true
      },
      errors: []
    };
  } catch (error) {
    return {
      valid: false,
      unsupportedFormat: false,
      fileSize: bytes.length,
      expectedFileSize: GBA_SAVE_SIZE,
      saveDataSize: saveFormat.saveDataSize,
      extraDataSize: saveFormat.extraDataSize,
      format: saveFormat.format,
      formatLabel: saveFormat.formatLabel,
      rtcExtensionDetected:
        saveFormat.rtcExtensionDetected,
      errors: [
        "Unable to reconstruct SaveBlock1 or extract the Feebas value.",
        `Selected profile: ${profile.gameLabel}.`,
        error.message
      ],
      sectors: sectors.map(stripSectorData),
      slots: slots.map(stripSlotData),
      selectedSlot: {
        slotIndex: selected.slot.slotIndex,
        label: selected.slot.label,
        counter: selected.slot.counter,
        counterHex: selected.slot.counterHex
      },
      saveBlock1Reconstructed: false
    };
  }
}

export function parseEmeraldSave(input) {
  return parseGen3FeebasSave(
    input,
    GEN3_FEEBAS_SAVE_PROFILES.emerald
  );
}

export function parseRubySapphireSave(input) {
  return parseGen3FeebasSave(
    input,
    GEN3_FEEBAS_SAVE_PROFILES.rubySapphire
  );
}
