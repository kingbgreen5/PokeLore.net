import {
  describe,
  expect,
  it
} from "vitest";
import {
  advanceDailyGroupSeed,
  calculateDpptFeebasResults,
  calculateDpptFeebasResultsFromSeed,
  createValidationPairFromSeed
} from "./dpptFeebasCalculator";
import {
  DPPT_RAW_SAVE_SIZE,
  DPPT_SAVE_LAYOUTS,
  calculateCrc16Ccitt,
  inspectDpptSave,
  parseDpptSave
} from "./dpptSaveParser";

function getLayout(game) {
  return DPPT_SAVE_LAYOUTS.find(
    layout => layout.game === game
  );
}

function writeUint16(view, offset, value) {
  view.setUint16(offset, value, true);
}

function writeUint32(view, offset, value) {
  view.setUint32(offset, value >>> 0, true);
}

function writeSyntheticGeneralBlock(
  view,
  bytes,
  {
    game,
    slotIndex = 0,
    saveCounter = 1,
    storageSaveCount = 1,
    feebasSeed = 0x12345678
  }
) {
  const layout = getLayout(game);
  const blockStart = slotIndex === 0 ? 0 : 0x40000;
  const blockEnd = blockStart + layout.generalBlockSize;
  const footerStart = blockEnd - 0x14;

  writeUint32(
    view,
    blockStart + layout.feebasSeedOffset,
    feebasSeed
  );
  writeUint32(view, footerStart, storageSaveCount);
  writeUint32(view, footerStart + 0x04, saveCounter);
  writeUint32(
    view,
    footerStart + 0x08,
    layout.generalBlockSize
  );

  const checksum = calculateCrc16Ccitt(
    bytes,
    blockStart,
    footerStart
  );
  writeUint16(view, footerStart + 0x12, checksum);
}

function createSyntheticSave(blocks) {
  const buffer = new ArrayBuffer(DPPT_RAW_SAVE_SIZE);
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  for (const block of blocks) {
    writeSyntheticGeneralBlock(view, bytes, block);
  }

  return {
    buffer,
    bytes,
    view
  };
}

describe("dpptSaveParser", () => {
  it("reads unsigned little-endian Feebas seeds", () => {
    const { buffer } = createSyntheticSave([
      {
        game: "platinum",
        feebasSeed: 0xf88a4c81
      }
    ]);
    const result = parseDpptSave(buffer);

    expect(result.valid).toBe(true);
    expect(result.feebasSeed).toBe(0xf88a4c81);
  });

  it("reads the Diamond/Pearl Feebas seed offset", () => {
    const { buffer } = createSyntheticSave([
      {
        game: "diamond-pearl",
        feebasSeed: 0x11223344
      }
    ]);

    expect(parseDpptSave(buffer)).toMatchObject({
      valid: true,
      game: "diamond-pearl",
      feebasSeed: 0x11223344
    });
  });

  it("reads the Platinum Feebas seed offset", () => {
    const { buffer } = createSyntheticSave([
      {
        game: "platinum",
        feebasSeed: 0x55667788
      }
    ]);

    expect(parseDpptSave(buffer)).toMatchObject({
      valid: true,
      game: "platinum",
      feebasSeed: 0x55667788
    });
  });

  it("selects the active general block by highest valid save counter", () => {
    const { buffer } = createSyntheticSave([
      {
        game: "platinum",
        slotIndex: 0,
        saveCounter: 4,
        feebasSeed: 0x11111111
      },
      {
        game: "platinum",
        slotIndex: 1,
        saveCounter: 9,
        feebasSeed: 0x22222222
      }
    ]);

    expect(parseDpptSave(buffer)).toMatchObject({
      valid: true,
      saveBlockIndex: 1,
      saveCounter: 9,
      feebasSeed: 0x22222222
    });
  });

  it("uses the older valid fallback when the newer block is corrupt", () => {
    const { buffer, bytes } = createSyntheticSave([
      {
        game: "diamond-pearl",
        slotIndex: 0,
        saveCounter: 4,
        feebasSeed: 0x11111111
      },
      {
        game: "diamond-pearl",
        slotIndex: 1,
        saveCounter: 9,
        feebasSeed: 0x22222222
      }
    ]);
    const newerBlockSeedByte =
      0x40000 + getLayout("diamond-pearl").feebasSeedOffset;
    bytes[newerBlockSeedByte] ^= 0xff;

    const inspection = inspectDpptSave(buffer);

    expect(
      inspection.candidateBlocks.find(
        block =>
          block.game === "diamond-pearl" &&
          block.slotIndex === 1
      ).checksumValid
    ).toBe(false);
    expect(parseDpptSave(buffer)).toMatchObject({
      valid: true,
      saveBlockIndex: 0,
      feebasSeed: 0x11111111
    });
  });

  it("rejects invalid or truncated saves", () => {
    expect(parseDpptSave(new ArrayBuffer(16))).toMatchObject({
      valid: false,
      errorCode: "UNEXPECTED_FILE_SIZE"
    });
  });

  it("rejects unsupported file sizes", () => {
    expect(
      parseDpptSave(new ArrayBuffer(DPPT_RAW_SAVE_SIZE + 1))
    ).toMatchObject({
      valid: false,
      errorCode: "UNEXPECTED_FILE_SIZE"
    });
  });

  it("rejects saves with no valid general save block", () => {
    expect(
      parseDpptSave(new ArrayBuffer(DPPT_RAW_SAVE_SIZE))
    ).toMatchObject({
      valid: false,
      errorCode: "NO_VALID_GENERAL_BLOCK"
    });
  });

  it("reports checksum failure when recognizable blocks are corrupt", () => {
    const { buffer, bytes } = createSyntheticSave([
      {
        game: "platinum",
        slotIndex: 0,
        saveCounter: 1,
        feebasSeed: 0x11111111
      },
      {
        game: "platinum",
        slotIndex: 1,
        saveCounter: 2,
        feebasSeed: 0x22222222
      }
    ]);

    bytes[getLayout("platinum").feebasSeedOffset] ^= 0xff;
    bytes[0x40000 + getLayout("platinum").feebasSeedOffset] ^=
      0xff;

    expect(parseDpptSave(buffer)).toMatchObject({
      valid: false,
      errorCode: "CHECKSUM_FAILURE"
    });
  });

  it("produces expected indexes from a parsed seed", () => {
    const { buffer } = createSyntheticSave([
      {
        game: "platinum",
        feebasSeed: 0x80000000
      }
    ]);
    const saveResult = parseDpptSave(buffer);
    const feebasResult =
      calculateDpptFeebasResultsFromSeed(
        saveResult.feebasSeed
      );

    expect(feebasResult.candidates[0].indexes).toEqual([
      128,
      132,
      264,
      396
    ]);
  });

  it("matches lottery results when supplied an equivalent group seed", () => {
    const yesterdaySeed = 0xa26e0c2b;
    const todaySeed = advanceDailyGroupSeed(yesterdaySeed);
    const pair = createValidationPairFromSeed(yesterdaySeed);
    const { buffer } = createSyntheticSave([
      {
        game: "platinum",
        feebasSeed: todaySeed
      }
    ]);
    const saveResult = parseDpptSave(buffer);
    const fromSave = calculateDpptFeebasResultsFromSeed(
      saveResult.feebasSeed
    );
    const fromLottery = calculateDpptFeebasResults(
      pair.yesterdayLottery,
      pair.todayLottery
    );

    expect(fromSave.candidates[0].indexes).toEqual(
      fromLottery.candidates[0].indexes
    );
    expect(fromSave.candidates[0].results).toEqual(
      fromLottery.candidates[0].results
    );
  });
});
