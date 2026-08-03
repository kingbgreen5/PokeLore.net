export const DPPT_RAW_SAVE_SIZE = 0x80000;
export const DPPT_GENERAL_COPY_OFFSETS = [
  0x00000,
  0x40000
];
export const DPPT_SAVE_LAYOUTS = [
  {
    game: "diamond-pearl",
    label: "Pokemon Diamond/Pearl",
    generalBlockSize: 0xc100,
    feebasSeedOffset: 0x53c8
  },
  {
    game: "platinum",
    label: "Pokemon Platinum",
    generalBlockSize: 0xcf2c,
    feebasSeedOffset: 0x5664
  }
];

const FOOTER_LENGTH = 0x14;
const FOOTER_STORAGE_SAVE_COUNT_OFFSET = 0x00;
const FOOTER_GENERAL_SAVE_COUNT_OFFSET = 0x04;
const FOOTER_BLOCK_SIZE_OFFSET = 0x08;
const FOOTER_CHECKSUM_OFFSET = 0x12;

export const DPPT_SAVE_ERROR_MESSAGES = {
  NO_FILE: "Choose a .sav file first.",
  UNSUPPORTED_EXTENSION: "Choose a raw .sav file.",
  UNEXPECTED_FILE_SIZE:
    "This file is not the expected 512 KiB raw DPPt save size.",
  MALFORMED_SAVE:
    "This save file is malformed or truncated.",
  NO_VALID_GENERAL_BLOCK:
    "No valid DPPt general save block could be found.",
  CHECKSUM_FAILURE:
    "The save file looks like DPPt, but its general save blocks failed checksum validation.",
  AMBIGUOUS_GAME:
    "This save matches more than one DPPt layout, so the game could not be determined.",
  FILE_READ_FAILED:
    "The save file could not be read."
};

function parserError(errorCode, message) {
  return {
    valid: false,
    errorCode,
    message:
      message ?? DPPT_SAVE_ERROR_MESSAGES[errorCode]
  };
}

function getUint16(view, offset) {
  return view.getUint16(offset, true);
}

function getUint32(view, offset) {
  return view.getUint32(offset, true) >>> 0;
}

export function calculateCrc16Ccitt(
  bytes,
  start = 0,
  end = bytes.length
) {
  let checksum = 0xffff;

  for (let offset = start; offset < end; offset += 1) {
    checksum ^= bytes[offset] << 8;

    for (let bit = 0; bit < 8; bit += 1) {
      checksum =
        checksum & 0x8000
          ? ((checksum << 1) ^ 0x1021) & 0xffff
          : (checksum << 1) & 0xffff;
    }
  }

  return checksum & 0xffff;
}

function inspectGeneralBlock(bytes, view, layout, slotIndex) {
  const blockStart = DPPT_GENERAL_COPY_OFFSETS[slotIndex];
  const blockEnd = blockStart + layout.generalBlockSize;
  const footerStart = blockEnd - FOOTER_LENGTH;
  const checksumOffset =
    footerStart + FOOTER_CHECKSUM_OFFSET;

  if (blockEnd > bytes.length) {
    return {
      game: layout.game,
      slotIndex,
      blockStart,
      valid: false,
      checksumValid: false,
      blockSizeValid: false,
      errorCode: "MALFORMED_SAVE"
    };
  }

  const footerBlockSize = getUint32(
    view,
    footerStart + FOOTER_BLOCK_SIZE_OFFSET
  );
  const storedChecksum = getUint16(view, checksumOffset);
  const calculatedChecksum = calculateCrc16Ccitt(
    bytes,
    blockStart,
    footerStart
  );
  const blockSizeValid =
    footerBlockSize === layout.generalBlockSize;
  const checksumValid =
    storedChecksum === calculatedChecksum;
  const feebasSeedOffset =
    blockStart + layout.feebasSeedOffset;

  return {
    game: layout.game,
    slotIndex,
    blockStart,
    generalBlockSize: layout.generalBlockSize,
    feebasSeedOffset: layout.feebasSeedOffset,
    storageSaveCount: getUint32(
      view,
      footerStart + FOOTER_STORAGE_SAVE_COUNT_OFFSET
    ),
    saveCounter: getUint32(
      view,
      footerStart + FOOTER_GENERAL_SAVE_COUNT_OFFSET
    ),
    footerBlockSize,
    storedChecksum,
    calculatedChecksum,
    checksumValid,
    blockSizeValid,
    valid: blockSizeValid && checksumValid,
    feebasSeed:
      feebasSeedOffset + 4 <= bytes.length
        ? getUint32(view, feebasSeedOffset)
        : null
  };
}

function sortNewestFirst(first, second) {
  return (
    second.saveCounter - first.saveCounter ||
    second.slotIndex - first.slotIndex
  );
}

export function inspectDpptSave(buffer) {
  if (!(buffer instanceof ArrayBuffer)) {
    return {
      valid: false,
      errorCode: "MALFORMED_SAVE",
      message: DPPT_SAVE_ERROR_MESSAGES.MALFORMED_SAVE,
      detectedGame: null,
      candidateBlocks: [],
      selectedBlock: null
    };
  }

  if (buffer.byteLength !== DPPT_RAW_SAVE_SIZE) {
    return {
      valid: false,
      errorCode: "UNEXPECTED_FILE_SIZE",
      message:
        DPPT_SAVE_ERROR_MESSAGES.UNEXPECTED_FILE_SIZE,
      detectedGame: null,
      candidateBlocks: [],
      selectedBlock: null
    };
  }

  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const candidateBlocks = DPPT_SAVE_LAYOUTS.flatMap(
    layout =>
      DPPT_GENERAL_COPY_OFFSETS.map((_, slotIndex) =>
        inspectGeneralBlock(
          bytes,
          view,
          layout,
          slotIndex
        )
      )
  );
  const validLayouts = DPPT_SAVE_LAYOUTS.map(layout => ({
    ...layout,
    blocks: candidateBlocks
      .filter(
        block =>
          block.game === layout.game && block.valid
      )
      .sort(sortNewestFirst)
  })).filter(layout => layout.blocks.length > 0);

  if (validLayouts.length === 0) {
    const hasRecognizedGeneralBlock =
      candidateBlocks.some(block => block.blockSizeValid);
    const errorCode = hasRecognizedGeneralBlock
      ? "CHECKSUM_FAILURE"
      : "NO_VALID_GENERAL_BLOCK";

    return {
      valid: false,
      errorCode,
      message: DPPT_SAVE_ERROR_MESSAGES[errorCode],
      detectedGame: null,
      candidateBlocks,
      selectedBlock: null
    };
  }

  if (validLayouts.length > 1) {
    return {
      valid: false,
      errorCode: "AMBIGUOUS_GAME",
      message: DPPT_SAVE_ERROR_MESSAGES.AMBIGUOUS_GAME,
      detectedGame: validLayouts
        .map(layout => layout.game)
        .join(","),
      candidateBlocks,
      selectedBlock: null
    };
  }

  const [detectedLayout] = validLayouts;
  const selectedBlock = detectedLayout.blocks[0];

  return {
    valid: true,
    detectedGame: detectedLayout.game,
    gameLabel: detectedLayout.label,
    candidateBlocks,
    selectedBlock,
    saveCounter: selectedBlock.saveCounter,
    checksumValid: selectedBlock.checksumValid,
    feebasSeed: selectedBlock.feebasSeed
  };
}

export function parseDpptSave(buffer) {
  const inspection = inspectDpptSave(buffer);

  if (!inspection.valid) {
    return parserError(
      inspection.errorCode,
      inspection.message
    );
  }

  return {
    valid: true,
    game: inspection.detectedGame,
    gameLabel: inspection.gameLabel,
    feebasSeed: inspection.feebasSeed >>> 0,
    saveBlockIndex: inspection.selectedBlock.slotIndex,
    saveCounter: inspection.saveCounter
  };
}

export async function parseDpptSaveFile(file) {
  if (!file) {
    return parserError("NO_FILE");
  }

  if (!/\.sav$/i.test(file.name ?? "")) {
    return parserError("UNSUPPORTED_EXTENSION");
  }

  try {
    const buffer = await file.arrayBuffer();
    return parseDpptSave(buffer);
  } catch {
    return parserError("FILE_READ_FAILED");
  }
}
