import {
  encodeEmeraldEasyChatWord,
  decodeEmeraldEasyChatWord
} from "../data/feebas/emeraldEasyChatWords";
import {
  describe,
  expect,
  it
} from "vitest";
import {
  EMERALD_FEEBAS_VALUE_OFFSET,
  EMERALD_DEWFORD_TRENDS_OFFSET,
  EMERALD_DEWFORD_TREND_SIZE,
  GEN3_FEEBAS_SAVE_PROFILES,
  GBA_SAVE_SIZE,
  MGBA_RTC_APPENDED_SAVE_SIZE,
  MGBA_RTC_EXTENSION_SIZE,
  RS_DEWFORD_TRENDS_OFFSET,
  RS_FEEBAS_SECTOR_OFFSET,
  RS_FEEBAS_VALUE_OFFSET,
  RS_SECTOR_DATA_SIZES,
  parseRubySapphireSave,
  SECTOR_CHECKSUM_OFFSET,
  SECTOR_COUNTER_OFFSET,
  SECTOR_ID_OFFSET,
  SECTOR_SIGNATURE,
  SECTOR_SIGNATURE_OFFSET,
  SECTOR_SIZE,
  SECTORS_PER_SLOT,
  calculateGen3SaveChecksum,
  compareSaveCounters,
  extractEmeraldFeebasValue,
  extractEmeraldDewfordTrends,
  parseEmeraldSave,
  parseSaveSector,
  readU16LE,
  readU32LE,
  reconstructEmeraldSaveBlock1,
  selectNewestSaveSlot,
  validateSaveSlot
} from "./emeraldSaveParser";

function writeU16LE(bytes, offset, value) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
}

function writeU32LE(bytes, offset, value) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}

function makeSector(
  logicalId,
  counter,
  mutateData = () => {},
  profile = GEN3_FEEBAS_SAVE_PROFILES.emerald
) {
  const sector = new Uint8Array(SECTOR_SIZE);
  mutateData(sector);
  const checksum = calculateGen3SaveChecksum(
    sector,
    profile.sectorDataSizes[logicalId]
  );

  writeU16LE(sector, SECTOR_ID_OFFSET, logicalId);
  writeU16LE(
    sector,
    SECTOR_CHECKSUM_OFFSET,
    checksum
  );
  writeU32LE(
    sector,
    SECTOR_SIGNATURE_OFFSET,
    SECTOR_SIGNATURE
  );
  writeU32LE(
    sector,
    SECTOR_COUNTER_OFFSET,
    counter
  );

  return sector;
}

function makeSlotBytes({
  counter,
  order = [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13
  ],
  feebasValue = 0xabcd,
  trainerId = 12345,
  profile = GEN3_FEEBAS_SAVE_PROFILES.emerald
}) {
  const slot = new Uint8Array(
    SECTOR_SIZE * SECTORS_PER_SLOT
  );

  order.forEach((logicalId, physicalIndex) => {
    const sector = makeSector(
      logicalId,
      counter,
      bytes => {
        bytes[0] = logicalId;
        if (logicalId === 0) {
          writeU16LE(bytes, 0x0a, trainerId);
        }
        if (logicalId === 1) {
          bytes[0] = 0x11;
        }
        if (logicalId === 2) {
          bytes[0] = 0x22;
        }
        if (logicalId === 3) {
          bytes[0] = 0x33;
          writeU16LE(
            bytes,
            profile.feebasSectorOffset,
            feebasValue
          );
          for (let trendIndex = 0; trendIndex < 5; trendIndex += 1) {
            const saveBlockTrendOffset =
              profile.dewfordTrendsOffset +
              trendIndex * profile.trendSize;
            const trendOffset =
              saveBlockTrendOffset - 0x1f00;

            if (
              trendOffset < 0 ||
              trendOffset + profile.trendSize >
                SECTOR_SIZE
            ) {
              continue;
            }

            writeU16LE(
              bytes,
              trendOffset,
              0x0100 + trendIndex
            );
            writeU16LE(
              bytes,
              trendOffset + 2,
              trendIndex === 0
                ? feebasValue
                : 0x2000 + trendIndex
            );
            writeU16LE(
              bytes,
              trendOffset + 4,
              encodeEmeraldEasyChatWord(
                "conditions",
                trendIndex
              )
            );
            writeU16LE(
              bytes,
              trendOffset + 6,
              encodeEmeraldEasyChatWord(
                trendIndex % 2 === 0
                  ? "hobbies"
                  : "lifestyle",
                trendIndex
              )
            );
          }
        }
        if (logicalId === 4) {
          bytes[0] = 0x44;
          for (let trendIndex = 3; trendIndex < 5; trendIndex += 1) {
            const saveBlockTrendOffset =
              profile.dewfordTrendsOffset +
              trendIndex * profile.trendSize;
            const trendOffset =
              saveBlockTrendOffset - 0x2e80;

            if (
              trendOffset < 0 ||
              trendOffset + profile.trendSize >
                SECTOR_SIZE
            ) {
              continue;
            }

            writeU16LE(
              bytes,
              trendOffset,
              0x0100 + trendIndex
            );
            writeU16LE(
              bytes,
              trendOffset + 2,
              0x2000 + trendIndex
            );
            writeU16LE(
              bytes,
              trendOffset + 4,
              encodeEmeraldEasyChatWord(
                "conditions",
                trendIndex
              )
            );
            writeU16LE(
              bytes,
              trendOffset + 6,
              encodeEmeraldEasyChatWord(
                trendIndex % 2 === 0
                  ? "hobbies"
                  : "lifestyle",
                trendIndex
              )
            );
          }
        }
      },
      profile
    );
    slot.set(sector, physicalIndex * SECTOR_SIZE);
  });

  return slot;
}

function makeSave({
  slotA = null,
  slotB = null
} = {}) {
  const save = new Uint8Array(GBA_SAVE_SIZE);

  if (slotA) {
    save.set(slotA, 0);
  }

  if (slotB) {
    save.set(
      slotB,
      SECTOR_SIZE * SECTORS_PER_SLOT
    );
  }

  return save;
}

function parseSlotFromBytes(slotBytes, slotIndex) {
  const physicalOffset = slotIndex * SECTORS_PER_SLOT;
  const save = makeSave(
    slotIndex === 0
      ? { slotA: slotBytes }
      : { slotB: slotBytes }
  );
  const sectors = Array.from(
    { length: SECTORS_PER_SLOT },
    (_, index) =>
      parseSaveSector(
        save,
        physicalOffset + index,
        { includeData: true }
      )
  );

  return validateSaveSlot(sectors, slotIndex);
}

describe("emeraldSaveParser", () => {
  it("reads little-endian u16 and u32 values", () => {
    expect(
      readU16LE(new Uint8Array([0xcd, 0xab]), 0)
    ).toBe(0xabcd);
    expect(
      readU32LE(
        new Uint8Array([
          0x25,
          0x20,
          0x01,
          0x08
        ]),
        0
      )
    ).toBe(0x08012025);
  });

  it("calculates Gen III sector checksums from u32 words", () => {
    const bytes = new Uint8Array(8);
    writeU32LE(bytes, 0, 0x00010002);
    writeU32LE(bytes, 4, 0x00000003);

    expect(calculateGen3SaveChecksum(bytes, 8)).toBe(
      0x0006
    );

    const wrapped = new Uint8Array(4);
    writeU32LE(wrapped, 0, 0xffffffff);
    expect(
      calculateGen3SaveChecksum(wrapped, 4)
    ).toBe(0xfffe);
  });

  it("parses sector footer fields from documented offsets", () => {
    const sector = new Uint8Array(SECTOR_SIZE);
    writeU32LE(sector, 0, 0x00010002);
    writeU32LE(sector, 4, 0x00000003);
    writeU16LE(sector, SECTOR_ID_OFFSET, 3);
    writeU16LE(
      sector,
      SECTOR_CHECKSUM_OFFSET,
      0x0006
    );
    writeU32LE(
      sector,
      SECTOR_SIGNATURE_OFFSET,
      SECTOR_SIGNATURE
    );
    writeU32LE(
      sector,
      SECTOR_COUNTER_OFFSET,
      42
    );

    expect(parseSaveSector(sector, 0)).toMatchObject({
      logicalId: 3,
      storedChecksum: 0x0006,
      signature: 0x08012025,
      counter: 42,
      signatureValid: true,
      checksumValid: true,
      logicalIdValid: true,
      valid: true
    });
  });

  it("detects checksum, signature, and logical ID failures", () => {
    const valid = makeSector(3, 50);
    expect(parseSaveSector(valid, 0).valid).toBe(true);

    const changedByte = valid.slice();
    changedByte[0] = 0x99;
    expect(
      parseSaveSector(changedByte, 0).checksumValid
    ).toBe(false);

    const wrongSignature = valid.slice();
    writeU32LE(
      wrongSignature,
      SECTOR_SIGNATURE_OFFSET,
      0x12345678
    );
    expect(
      parseSaveSector(wrongSignature, 0).signatureValid
    ).toBe(false);

    const wrongLogicalId = valid.slice();
    writeU16LE(wrongLogicalId, SECTOR_ID_OFFSET, 14);
    expect(
      parseSaveSector(wrongLogicalId, 0).logicalIdValid
    ).toBe(false);
  });

  it("reconstructs SaveBlock1 by logical IDs, not physical sector order", () => {
    const rotatedOrder = [
      8,
      9,
      10,
      11,
      12,
      13,
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7
    ];
    const slot = parseSlotFromBytes(
      makeSlotBytes({
        counter: 77,
        order: rotatedOrder,
        feebasValue: 0xabcd
      }),
      0
    );
    const saveBlock1 =
      reconstructEmeraldSaveBlock1(slot);

    expect(slot.valid).toBe(true);
    expect(saveBlock1[0x0000]).toBe(0x11);
    expect(saveBlock1[0x0f80]).toBe(0x22);
    expect(saveBlock1[0x1f00]).toBe(0x33);
    expect(readU16LE(saveBlock1, 0x2e80)).toBe(
      0x0103
    );
    expect(
      readU16LE(
        saveBlock1,
        EMERALD_FEEBAS_VALUE_OFFSET
      )
    ).toBe(0xabcd);
  });

  it("selects the newest valid slot by save counter", () => {
    const parsed = parseEmeraldSave(
      makeSave({
        slotA: makeSlotBytes({ counter: 50 }),
        slotB: makeSlotBytes({ counter: 51 })
      })
    );

    expect(parsed.valid).toBe(true);
    expect(parsed.selectedSlot.label).toBe("B");
    expect(parsed.selectedSlot.counter).toBe(51);
  });

  it("handles exact save-counter rollover", () => {
    expect(
      compareSaveCounters(0, 0xffffffff)
    ).toBe(1);
    expect(
      compareSaveCounters(0xffffffff, 0)
    ).toBe(-1);

    const rolloverForward = parseEmeraldSave(
      makeSave({
        slotA: makeSlotBytes({
          counter: 0xffffffff
        }),
        slotB: makeSlotBytes({ counter: 0 })
      })
    );
    expect(rolloverForward.selectedSlot.label).toBe(
      "B"
    );

    const rolloverReverse = parseEmeraldSave(
      makeSave({
        slotA: makeSlotBytes({ counter: 0 }),
        slotB: makeSlotBytes({
          counter: 0xffffffff
        })
      })
    );
    expect(rolloverReverse.selectedSlot.label).toBe(
      "A"
    );
  });

  it("handles one-valid-slot and neither-valid-slot cases", () => {
    const oneValid = parseEmeraldSave(
      makeSave({
        slotA: makeSlotBytes({ counter: 99 })
      })
    );
    expect(oneValid.valid).toBe(true);
    expect(oneValid.selectedSlot.label).toBe("A");

    const neitherValid = parseEmeraldSave(makeSave());
    expect(neitherValid.valid).toBe(false);
    expect(neitherValid.selectedSlot).toBe(null);
    expect(neitherValid.errors.join(" ")).toContain(
      "No complete save slot"
    );
  });

  it("extracts Feebas value from 0x2E6A and ignores stale 0x2E66", () => {
    const saveBlock1 = new Uint8Array(0x3d88);
    writeU16LE(saveBlock1, 0x2e66, 0x1111);
    writeU16LE(
      saveBlock1,
      EMERALD_FEEBAS_VALUE_OFFSET,
      0xabcd
    );

    expect(
      extractEmeraldFeebasValue(saveBlock1)
    ).toMatchObject({
      decimal: 0xabcd,
      value: "ABCD",
      offset: 0x2e6a
    });
  });

  it("decodes stored Easy Chat words from encoded group/index values", () => {
    expect(
      decodeEmeraldEasyChatWord(0x1442)
    ).toMatchObject({
      decoded: true,
      group: "conditions",
      groupLabel: "CONDITIONS",
      index: 66,
      text: "SIMPLE"
    });
    expect(
      decodeEmeraldEasyChatWord(0x1a31)
    ).toMatchObject({
      decoded: true,
      group: "hobbies",
      groupLabel: "HOBBIES",
      index: 49,
      text: "HOLIDAY"
    });
    expect(
      decodeEmeraldEasyChatWord(0xffff)
    ).toMatchObject({
      decoded: false,
      empty: true
    });
  });

  it("reads all five DewfordTrend structures at 8-byte intervals", () => {
    const saveBlock1 = new Uint8Array(0x3d88);

    for (let trendIndex = 0; trendIndex < 5; trendIndex += 1) {
      const base =
        EMERALD_DEWFORD_TRENDS_OFFSET +
        trendIndex * EMERALD_DEWFORD_TREND_SIZE;
      writeU16LE(saveBlock1, base, 0x1000 + trendIndex);
      writeU16LE(saveBlock1, base + 2, 0x2000 + trendIndex);
      writeU16LE(
        saveBlock1,
        base + 4,
        encodeEmeraldEasyChatWord("conditions", trendIndex)
      );
      writeU16LE(
        saveBlock1,
        base + 6,
        encodeEmeraldEasyChatWord("hobbies", trendIndex)
      );
    }

    const trends =
      extractEmeraldDewfordTrends(saveBlock1);

    expect(trends).toHaveLength(5);
    expect(trends[0]).toMatchObject({
      baseOffset: 0x2e68,
      rand: 0x2000,
      word0Raw:
        encodeEmeraldEasyChatWord("conditions", 0),
      word1Raw: encodeEmeraldEasyChatWord(
        "hobbies",
        0
      )
    });
    expect(trends[1].baseOffset).toBe(0x2e70);
    expect(trends[4].baseOffset).toBe(0x2e88);
    expect(trends[4]).toMatchObject({
      rand: 0x2004,
      firstWord: expect.objectContaining({
        group: "conditions",
        index: 4
      }),
      secondWord: expect.objectContaining({
        group: "hobbies",
        index: 4
      })
    });
  });

  it("verifies direct-sector Feebas sanity offset matches SaveBlock1", () => {
    const parsed = parseEmeraldSave(
      makeSave({
        slotA: makeSlotBytes({
          counter: 111,
          feebasValue: 0xbeef
        })
      })
    );

    expect(parsed.valid).toBe(true);
    expect(parsed.feebasValue.value).toBe("BEEF");
    expect(parsed.storedDewfordTrends[0]).toMatchObject({
      baseOffset: 0x2e68,
      rand: 0xbeef,
      randHex: "BEEF"
    });
    expect(parsed.directSectorSanity).toMatchObject({
      logicalSectorId: 3,
      sectorOffset: 0x0f6a,
      value: "BEEF",
      matches: true
    });
  });

  it("keeps Emerald and Ruby/Sapphire save profiles isolated", () => {
    expect(
      GEN3_FEEBAS_SAVE_PROFILES.emerald
        .feebasValueOffset
    ).toBe(0x2e6a);
    expect(
      GEN3_FEEBAS_SAVE_PROFILES.rubySapphire
        .feebasValueOffset
    ).toBe(0x2dd6);
    expect(
      GEN3_FEEBAS_SAVE_PROFILES.emerald
        .feebasSectorOffset
    ).toBe(0x0f6a);
    expect(
      GEN3_FEEBAS_SAVE_PROFILES.rubySapphire
        .feebasSectorOffset
    ).toBe(0x0ed6);
    expect(RS_FEEBAS_VALUE_OFFSET).toBe(0x2dd6);
    expect(RS_DEWFORD_TRENDS_OFFSET).toBe(0x2dd4);
    expect(RS_FEEBAS_SECTOR_OFFSET).toBe(0x0ed6);
    expect(RS_SECTOR_DATA_SIZES).toEqual([
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
    ]);
  });

  it("parses Ruby/Sapphire exact Feebas value and trends with the R/S profile", () => {
    const parsed = parseRubySapphireSave(
      makeSave({
        slotA: makeSlotBytes({
          counter: 77,
          feebasValue: 0xcafe,
          trainerId: 22279,
          profile:
            GEN3_FEEBAS_SAVE_PROFILES.rubySapphire
        })
      })
    );

    expect(parsed.valid).toBe(true);
    expect(parsed.profile).toBe("ruby-sapphire");
    expect(parsed.trainerId).toBe(22279);
    expect(parsed.feebasValue).toMatchObject({
      value: "CAFE",
      decimal: 0xcafe,
      offset: RS_FEEBAS_VALUE_OFFSET,
      offsetHex: "0x2DD6"
    });
    expect(parsed.directSectorSanity).toMatchObject({
      logicalSectorId: 3,
      sectorOffset: RS_FEEBAS_SECTOR_OFFSET,
      sectorOffsetHex: "0xED6",
      value: "CAFE",
      matches: true
    });
    expect(parsed.storedDewfordTrends).toHaveLength(5);
    expect(parsed.storedDewfordTrends[0]).toMatchObject({
      baseOffset: 0x2dd4,
      rand: 0xcafe,
      randHex: "CAFE"
    });
    expect(parsed.storedDewfordTrends[4]).toMatchObject({
      baseOffset: 0x2df4,
      rand: 0x2004
    });
  });

  it("rejects unsupported non-128 KiB save sizes", () => {
    const parsed = parseEmeraldSave(
      new Uint8Array(65536)
    );

    expect(parsed.valid).toBe(false);
    expect(parsed.unsupportedFormat).toBe(true);
    expect(parsed.errors.join(" ")).toContain(
      "Expected a 128 KiB raw Pokémon Emerald .sav file"
    );
  });

  it("supports mGBA RTC-appended saves by parsing only the first 0x20000 bytes", () => {
    const standardSave = makeSave({
      slotA: makeSlotBytes({
        counter: 111,
        feebasValue: 0xbeef,
        trainerId: 54321
      }),
      slotB: makeSlotBytes({
        counter: 112,
        feebasValue: 0xabcd,
        trainerId: 54321
      })
    });
    const mgbaSave = new Uint8Array(
      MGBA_RTC_APPENDED_SAVE_SIZE
    );
    mgbaSave.set(standardSave, 0);

    for (
      let index = 0;
      index < MGBA_RTC_EXTENSION_SIZE;
      index += 1
    ) {
      mgbaSave[GBA_SAVE_SIZE + index] =
        0xa0 + index;
    }

    const standard = parseEmeraldSave(standardSave);
    const appended = parseEmeraldSave(mgbaSave);

    expect(standard.valid).toBe(true);
    expect(appended.valid).toBe(true);
    expect(appended).toMatchObject({
      fileSize: MGBA_RTC_APPENDED_SAVE_SIZE,
      saveDataSize: GBA_SAVE_SIZE,
      extraDataSize: MGBA_RTC_EXTENSION_SIZE,
      format: "mgba-rtc",
      formatLabel: "mGBA RTC-appended save",
      rtcExtensionDetected: true
    });
    expect(standard.selectedSlot).toEqual(
      appended.selectedSlot
    );
    expect(standard.trainerId).toBe(
      appended.trainerId
    );
    expect(standard.feebasValue).toEqual(
      appended.feebasValue
    );
    expect(standard.storedDewfordTrends).toEqual(
      appended.storedDewfordTrends
    );
  });

  it("reports duplicate, missing, and conflicting-counter slot errors", () => {
    const sectorA = makeSector(0, 1);
    const sectorB = makeSector(0, 2);
    const sectors = [
      parseSaveSector(sectorA, 0, {
        includeData: true
      }),
      parseSaveSector(sectorB, 1, {
        includeData: true
      }),
      ...Array.from(
        { length: SECTORS_PER_SLOT - 2 },
        (_, index) =>
          parseSaveSector(
            makeSector(index + 2, 1),
            index + 2,
            { includeData: true }
          )
      )
    ];

    const slot = validateSaveSlot(sectors, 0);

    expect(slot.valid).toBe(false);
    expect(slot.duplicateLogicalIds).toEqual([0]);
    expect(slot.missingLogicalIds).toContain(1);
    expect(slot.errors.join(" ")).toContain(
      "Conflicting counters"
    );
  });

  it("returns no newest slot when neither slot is valid", () => {
    const result = selectNewestSaveSlot([
      { valid: false },
      { valid: false }
    ]);

    expect(result.valid).toBe(false);
    expect(result.slot).toBe(null);
  });
});
