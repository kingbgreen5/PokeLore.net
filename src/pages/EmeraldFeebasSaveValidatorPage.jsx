import {
  useMemo,
  useState
} from "react";
import RseRoute119FeebasMap from "../components/feebas/RseRoute119FeebasMap";
import {
  EMERALD_EASY_CHAT_CONDITIONS,
  EMERALD_EASY_CHAT_SECOND_GROUPS
} from "../data/feebas/emeraldEasyChatWords";
import Seo from "../seo/Seo";
import {
  calculateRseFeebasFromValue,
  route119FeebasAudit
} from "../utils/rseFeebasCalculator";
import {
  EMERALD_PARITY_CANDIDATE_COUNT,
  EXTENDED_CANDIDATE_LIMIT,
  findExactFeebasValueInPredictionStream,
  findEmeraldFeebasValueCandidates,
  getDewfordPhraseSignature
} from "../utils/emeraldFeebasRecovery";
import {
  EMERALD_FEEBAS_SECTOR_OFFSET,
  EMERALD_FEEBAS_VALUE_OFFSET,
  GBA_SAVE_SIZE,
  PHYSICAL_SECTOR_COUNT,
  SECTOR_CHECKSUM_OFFSET,
  SECTOR_COUNTER_OFFSET,
  SECTOR_DATA_SIZE,
  SECTOR_ID_OFFSET,
  SECTOR_SIGNATURE,
  SECTOR_SIGNATURE_OFFSET,
  SECTOR_SIZE,
  parseEmeraldSave
} from "../utils/emeraldSaveParser";
import "./EmeraldFeebasSaveValidatorPage.css";

const DEFAULT_SECOND_WORD = "lifestyle:0";
const INITIAL_EXTENDED_ROWS = 20;

function formatOffset(value) {
  return `0x${Number(value)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0")}`;
}

function getSecondWordSelection(value) {
  const [group, rawIndex] = value.split(":");
  return {
    secondWordGroup: group,
    secondWordIndex: Number(rawIndex)
  };
}

function isTrendPhraseUsableForRecovery(trend) {
  return (
    trend?.firstWord?.decoded &&
    trend.firstWord.group === "conditions" &&
    trend?.secondWord?.decoded &&
    ["lifestyle", "hobbies"].includes(
      trend.secondWord.group
    )
  );
}

function getTrendPhraseText(trend) {
  if (!isTrendPhraseUsableForRecovery(trend)) {
    return "unresolved";
  }

  return `${trend.firstWord.text} / ${trend.secondWord.text}`;
}

function getClassification({
  parseResult,
  trend0,
  phraseMatchesSave,
  exactAppearsInCandidates,
  extendedSearch
}) {
  if (!parseResult?.valid || !trend0) {
    return {
      key: "structure",
      title:
        "Save structure/word decoding cannot be validated",
      detail:
        "A valid save and decoded current Dewford Trend are required before prediction diagnostics are meaningful."
    };
  }

  if (!isTrendPhraseUsableForRecovery(trend0)) {
    return {
      key: "structure",
      title:
        "Save structure/word decoding cannot be validated",
      detail:
        "Trend 0 raw words are visible, but one or both words could not be decoded into the loaded Conditions/Lifestyle/Hobbies data."
    };
  }

  if (!phraseMatchesSave) {
    return {
      key: "phrase",
      title:
        "The phrase selected for prediction does not match the phrase stored in dewfordTrends[0].",
      detail:
        "Use the stored phrase or adjust the selected phrase before drawing conclusions from prediction results."
    };
  }

  if (exactAppearsInCandidates) {
    return {
      key: "first-five",
      title:
        "Exact value is contained in the standard first-five prediction.",
      detail:
        "The ordinary parity candidate list already includes the stored save value."
    };
  }

  if (extendedSearch?.exactValueFound) {
    return {
      key: "after-five",
      title:
        "Exact value is recoverable from the same phrase sequence, but lies outside the first-five prediction cutoff.",
      detail: `First occurrence: candidate #${extendedSearch.firstMatchingCandidateRank}.`
    };
  }

  if (extendedSearch) {
    return {
      key: "not-found",
      title:
        "Exact value was not found within the first 500 matching phrase occurrences.",
      detail:
        "This suggests that the saved Feebas value cannot be explained by the current Trainer ID + phrase recovery sequence within the tested search range."
    };
  }

  return {
    key: "pending",
    title:
      "Run the extended prediction search to classify this mismatch.",
    detail:
      "The first-five result is only the Muck-parity cutoff."
  };
}

function EmeraldFeebasSaveValidatorPage() {
  const [parseResult, setParseResult] = useState(null);
  const [fileMeta, setFileMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [firstWordIndex, setFirstWordIndex] =
    useState(0);
  const [secondWordValue, setSecondWordValue] =
    useState(DEFAULT_SECOND_WORD);
  const [showAllFishingSpots, setShowAllFishingSpots] =
    useState(false);
  const [extendedSearch, setExtendedSearch] =
    useState(null);
  const [extendedError, setExtendedError] =
    useState("");
  const [extendedRowsShown, setExtendedRowsShown] =
    useState(INITIAL_EXTENDED_ROWS);
  const [copyFeedback, setCopyFeedback] = useState("");

  const downstreamResult = useMemo(() => {
    if (!parseResult?.valid) return null;

    try {
      return calculateRseFeebasFromValue(
        parseResult.feebasValue.value
      );
    } catch {
      return null;
    }
  }, [parseResult]);
  const secondWordSelection = useMemo(
    () => getSecondWordSelection(secondWordValue),
    [secondWordValue]
  );
  const phraseSignature = useMemo(() => {
    try {
      return getDewfordPhraseSignature({
        firstWordIndex,
        secondWordGroup:
          secondWordSelection.secondWordGroup,
        secondWordIndex:
          secondWordSelection.secondWordIndex
      });
    } catch {
      return null;
    }
  }, [
    firstWordIndex,
    secondWordSelection.secondWordGroup,
    secondWordSelection.secondWordIndex
  ]);
  const predictedCandidates = useMemo(() => {
    if (
      !parseResult?.valid ||
      parseResult.trainerId === null ||
      !phraseSignature
    ) {
      return null;
    }

    try {
      return findEmeraldFeebasValueCandidates({
        trainerId: parseResult.trainerId,
        phraseSignature
      });
    } catch {
      return null;
    }
  }, [parseResult, phraseSignature]);
  const exactAppearsInCandidates = useMemo(() => {
    if (!predictedCandidates || !parseResult?.valid) {
      return false;
    }

    return predictedCandidates.candidates.some(
      candidate =>
        candidate.value ===
        parseResult.feebasValue.value
    );
  }, [parseResult, predictedCandidates]);
  const trend0 =
    parseResult?.storedDewfordTrends?.[0] ?? null;
  const phraseMatchesSave = useMemo(() => {
    if (!trend0 || !phraseSignature) return false;
    if (!isTrendPhraseUsableForRecovery(trend0)) {
      return false;
    }

    return (
      trend0.firstWord.index ===
        phraseSignature.firstWordIndex &&
      trend0.secondWord.group ===
        phraseSignature.secondWordGroup &&
      trend0.secondWord.index ===
        phraseSignature.secondWordIndex
    );
  }, [phraseSignature, trend0]);
  const classification = useMemo(
    () =>
      getClassification({
        parseResult,
        trend0,
        phraseMatchesSave,
        exactAppearsInCandidates,
        extendedSearch
      }),
    [
      exactAppearsInCandidates,
      extendedSearch,
      parseResult,
      phraseMatchesSave,
      trend0
    ]
  );
  const displayedExtendedCandidates = useMemo(() => {
    if (!extendedSearch) return [];
    const rows = extendedSearch.candidates.slice(
      0,
      extendedRowsShown
    );
    const firstMatch = extendedSearch.firstMatch;

    if (
      firstMatch &&
      !rows.some(row => row.rank === firstMatch.rank)
    ) {
      return [...rows, firstMatch];
    }

    return rows;
  }, [extendedRowsShown, extendedSearch]);
  const secondWordOptions = useMemo(
    () =>
      Object.entries(
        EMERALD_EASY_CHAT_SECOND_GROUPS
      ).flatMap(([group, words]) =>
        words.map(word => ({
          value: `${group}:${word.index}`,
          label: `${group.toUpperCase()} ${word.index}: ${word.text}`
        }))
      ),
    []
  );

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    setFileError("");
    setParseResult(null);
    setFileMeta(null);
    setExtendedSearch(null);
    setExtendedError("");
    setExtendedRowsShown(INITIAL_EXTENDED_ROWS);

    if (!file) return;

    setLoading(true);
    setFileMeta({
      name: file.name,
      size: file.size,
      lastModified: file.lastModified
    });

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseEmeraldSave(buffer);
      setParseResult(parsed);
    } catch (error) {
      setFileError(
        error instanceof Error
          ? error.message
          : "Unable to read this save file."
      );
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  function useStoredPhrase() {
    if (!isTrendPhraseUsableForRecovery(trend0)) {
      return;
    }

    setFirstWordIndex(trend0.firstWord.index);
    setSecondWordValue(
      `${trend0.secondWord.group}:${trend0.secondWord.index}`
    );
    setExtendedSearch(null);
    setExtendedError("");
    setExtendedRowsShown(INITIAL_EXTENDED_ROWS);
  }

  function runExtendedSearch() {
    setExtendedError("");
    setExtendedSearch(null);
    setExtendedRowsShown(INITIAL_EXTENDED_ROWS);

    if (
      !parseResult?.valid ||
      parseResult.trainerId === null ||
      !phraseSignature
    ) {
      setExtendedError(
        "A valid save, Trainer ID, and phrase are required."
      );
      return;
    }

    try {
      setExtendedSearch(
        findExactFeebasValueInPredictionStream({
          trainerId: parseResult.trainerId,
          phraseSignature,
          exactValue: parseResult.feebasValue.decimal,
          maxCandidateMatches:
            EXTENDED_CANDIDATE_LIMIT
        })
      );
    } catch (error) {
      setExtendedError(
        error instanceof Error
          ? error.message
          : "Extended search failed."
      );
    }
  }

  async function copyDiagnosticReport() {
    if (!parseResult?.valid) return;

    const selectedSlotIndex =
      parseResult.selectedSlot.slotIndex;
    const logicalSector3 =
      parseResult.sectors.find(
        sector =>
          sector.slotIndex === selectedSlotIndex &&
          sector.logicalId === 3
      );
    const report = {
      trainerId:
        parseResult.trainerId === null
          ? null
          : String(parseResult.trainerId).padStart(5, "0"),
      exactSaveValue: parseResult.feebasValue.value,
      saveValidation: {
        slot: parseResult.selectedSlot.label,
        sector3ChecksumValid:
          logicalSector3?.checksumValid ?? null,
        saveBlockOffsetValue:
          parseResult.feebasValue.value,
        directSectorValue:
          parseResult.directSectorSanity?.value ?? null,
        directSectorAgrees:
          parseResult.directSectorSanity?.matches ?? null
      },
      storedTrend0: trend0
        ? {
            firstWordRaw: trend0.word0RawHex,
            firstWord: trend0.firstWord.text ?? null,
            firstWordGroup:
              trend0.firstWord.groupLabel ?? null,
            firstWordIndex:
              trend0.firstWord.index ?? null,
            secondWordRaw: trend0.word1RawHex,
            secondWord:
              trend0.secondWord.text ?? null,
            secondWordGroup:
              trend0.secondWord.groupLabel ?? null,
            secondWordIndex:
              trend0.secondWord.index ?? null,
            rand: trend0.randHex
          }
        : null,
      selectedPredictionPhrase: phraseSignature
        ? {
            firstWord: phraseSignature.firstWordText,
            secondWord:
              phraseSignature.secondWordText,
            firstWordIndex:
              phraseSignature.firstWordIndex,
            secondWordGroup:
              phraseSignature.secondWordGroup,
            secondWordIndex:
              phraseSignature.secondWordIndex
          }
        : null,
      firstFive:
        predictedCandidates?.candidates.map(
          candidate => candidate.value
        ) ?? [],
      extendedSearch: extendedSearch
        ? {
            phraseMatchesExamined:
              extendedSearch.phraseMatchesExamined,
            rngAdvancesScanned:
              extendedSearch.rngAdvancesScanned,
            exactValueFound:
              extendedSearch.exactValueFound,
            firstMatchingCandidateRank:
              extendedSearch.firstMatchingCandidateRank,
            additionalMatchingRanks:
              extendedSearch.additionalMatchingRanks
          }
        : null
    };

    try {
      await navigator.clipboard.writeText(
        JSON.stringify(report, null, 2)
      );
      setCopyFeedback("Diagnostic report copied.");
    } catch {
      setCopyFeedback(
        "Could not copy diagnostic report."
      );
    }
  }

  return (
    <main className="emerald-save-validator">
      <Seo
        title="Emerald .sav Exact Feebas Validator | PokeLore"
        description="Developer-only read-only Emerald save parser for exact Route 119 Feebas values."
        canonical="https://pokelore.net/dev/emerald-feebas-save-validator"
        robots="noindex, nofollow"
      />

      <header className="emerald-save-header">
        <div>
          <h1>Emerald .sav Exact Feebas Validator</h1>
          <p>
            Pokémon Emerald .sav → exact stored Feebas value → exact Route 119 tiles.
          </p>
        </div>
        <section className="emerald-save-privacy">
          <strong>No file leaves your browser.</strong>
          <span>
            Your save file is processed entirely in your browser and is not uploaded to PokéLore.
          </span>
        </section>
      </header>

      <section className="emerald-save-upload">
        <label className="emerald-save-file-field">
          <span>Choose .sav File</span>
          <input
            type="file"
            accept=".sav,application/octet-stream"
            onChange={handleFileChange}
          />
        </label>
        <p>
          Vanilla Pokémon Emerald raw 128 KiB saves only. This tool is read-only and does not edit or download modified saves.
        </p>
      </section>

      {loading && (
        <section className="emerald-save-card">
          Reading save locally...
        </section>
      )}

      {fileError && (
        <section
          className="emerald-save-alert"
          role="alert"
        >
          {fileError}
        </section>
      )}

      {parseResult && !parseResult.valid && (
        <section
          className="emerald-save-alert"
          role="alert"
        >
          <h2>Save Read Failed</h2>
          {parseResult.errors.map(error => (
            <p key={error}>{error}</p>
          ))}
        </section>
      )}

      {parseResult?.valid && (
        <section className="emerald-save-success">
          <span>SAVE READ SUCCESSFULLY</span>
          <h2>Exact Feebas Value</h2>
          <strong>{parseResult.feebasValue.value}</strong>
          <p>
            This value was read directly from your current Emerald save. No candidate guessing is required.
          </p>
        </section>
      )}

      {parseResult?.valid && downstreamResult && (
        <section className="emerald-save-results-grid">
          <article className="emerald-save-card">
            <h2>Generated Spots</h2>
            <dl>
              <div>
                <dt>Exact Feebas Value</dt>
                <dd>{parseResult.feebasValue.value}</dd>
              </div>
              <div>
                <dt>Decimal</dt>
                <dd>
                  {parseResult.feebasValue.decimal}
                </dd>
              </div>
              <div>
                <dt>Spot IDs</dt>
                <dd>
                  {downstreamResult.generatedSpotIds.join(
                    ", "
                  )}
                </dd>
              </div>
              <div>
                <dt>Coordinates</dt>
                <dd>
                  {downstreamResult.coordinates
                    .map(
                      tile =>
                        `${tile.spotId}: ${tile.x},${tile.y}`
                    )
                    .join(" / ")}
                </dd>
              </div>
            </dl>
          </article>

          <article className="emerald-save-card">
            <h2>Developer Diagnostics</h2>
            <dl>
              <div>
                <dt>Selected save slot</dt>
                <dd>
                  {parseResult.selectedSlot.label}
                </dd>
              </div>
              <div>
                <dt>Save counter</dt>
                <dd>
                  {parseResult.selectedSlot.counter}
                </dd>
              </div>
              <div>
                <dt>Logical Feebas sector</dt>
                <dd>3</dd>
              </div>
              <div>
                <dt>SaveBlock1 offset</dt>
                <dd>0x2E6A</dd>
              </div>
              <div>
                <dt>Save Trainer ID</dt>
                <dd>
                  {parseResult.trainerId === null
                    ? "not available"
                    : String(parseResult.trainerId).padStart(
                        5,
                        "0"
                      )}
                </dd>
              </div>
            </dl>
          </article>
        </section>
      )}

      {parseResult?.valid && (
        <section className="emerald-save-card">
          <div className="emerald-save-section-header">
            <div>
              <h2>Stored Dewford Trends</h2>
              <p>
                Raw SaveBlock1 DewfordTrend data. Only Trend 0 rand is used for Feebas.
              </p>
            </div>
            {isTrendPhraseUsableForRecovery(trend0) && (
              <button
                type="button"
                onClick={useStoredPhrase}
              >
                Use Stored Phrase
              </button>
            )}
          </div>

          <div className="emerald-trend-grid">
            {parseResult.storedDewfordTrends.map(trend => (
              <article
                className={
                  trend.current
                    ? "emerald-trend-card current"
                    : "emerald-trend-card"
                }
                key={trend.index}
              >
                <h3>
                  Trend {trend.index}
                  {trend.current ? " — CURRENT" : ""}
                </h3>
                <dl>
                  <div>
                    <dt>Base</dt>
                    <dd>{trend.baseOffsetHex}</dd>
                  </div>
                  <div>
                    <dt>Metadata</dt>
                    <dd>{trend.metadataHex}</dd>
                  </div>
                  <div>
                    <dt>Rand</dt>
                    <dd>
                      {trend.randHex} / {trend.rand}
                    </dd>
                  </div>
                  <div>
                    <dt>First word</dt>
                    <dd>
                      {trend.firstWord.decoded
                        ? `${trend.firstWord.text} (${trend.firstWord.groupLabel} ${trend.firstWord.index})`
                        : "unresolved"}
                    </dd>
                  </div>
                  <div>
                    <dt>First raw</dt>
                    <dd>{trend.word0RawHex}</dd>
                  </div>
                  <div>
                    <dt>Second word</dt>
                    <dd>
                      {trend.secondWord.decoded
                        ? `${trend.secondWord.text} (${trend.secondWord.groupLabel} ${trend.secondWord.index})`
                        : "unresolved"}
                    </dd>
                  </div>
                  <div>
                    <dt>Second raw</dt>
                    <dd>{trend.word1RawHex}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          <div className="emerald-save-nearby">
            <h3>Trend 0 Nearby Bytes</h3>
            <dl>
              <div>
                <dt>0x2E68 metadata</dt>
                <dd>
                  {
                    parseResult.currentTrendWindow
                      .metadata.valueHex
                  }
                </dd>
              </div>
              <div>
                <dt>0x2E6A rand</dt>
                <dd>
                  {
                    parseResult.currentTrendWindow.rand
                      .valueHex
                  }
                </dd>
              </div>
              <div>
                <dt>0x2E6C word 0</dt>
                <dd>
                  {
                    parseResult.currentTrendWindow.word0
                      .valueHex
                  }
                </dd>
              </div>
              <div>
                <dt>0x2E6E word 1</dt>
                <dd>
                  {
                    parseResult.currentTrendWindow.word1
                      .valueHex
                  }
                </dd>
              </div>
            </dl>
          </div>
        </section>
      )}

      {parseResult?.valid && downstreamResult && (
        <section className="emerald-save-map-card">
          <div className="emerald-save-section-header">
            <div>
              <h2>Exact Route 119 Tiles</h2>
              <p>
                Rendered through the existing corrected Route 119 map and 444-coordinate dataset.
              </p>
            </div>
            <label className="emerald-save-toggle">
              <input
                type="checkbox"
                checked={showAllFishingSpots}
                onChange={event =>
                  setShowAllFishingSpots(
                    event.target.checked
                  )
                }
              />
              Show all fishing spots
            </label>
          </div>
          <RseRoute119FeebasMap
            spotIds={downstreamResult.generatedSpotIds}
            showAllFishingSpots={showAllFishingSpots}
            showGrid
            showMapImage
          />
        </section>
      )}

      {parseResult?.valid &&
        parseResult.trainerId !== null && (
        <section className="emerald-save-card">
          <div className="emerald-save-section-header">
            <div>
              <h2>Candidate Recovery Cross-Check</h2>
              <p>
                Optional debugging aid. Save extraction remains authoritative.
              </p>
            </div>
            <span>
              Trainer ID from save:{" "}
              {String(parseResult.trainerId).padStart(
                5,
                "0"
              )}
            </span>
          </div>

          <div className="emerald-save-crosscheck-controls">
            <label className="emerald-save-field">
              <span>Current Dewford Trend: Conditions</span>
              <select
                value={firstWordIndex}
                onChange={event => {
                  setFirstWordIndex(
                    Number(event.target.value)
                  );
                  setExtendedSearch(null);
                  setExtendedError("");
                }}
              >
                {EMERALD_EASY_CHAT_CONDITIONS.map(word => (
                  <option
                    key={word.index}
                    value={word.index}
                  >
                    {word.index}: {word.text}
                  </option>
                ))}
              </select>
            </label>
            <label className="emerald-save-field">
              <span>Current Dewford Trend: second word</span>
              <select
                value={secondWordValue}
                onChange={event => {
                  setSecondWordValue(
                    event.target.value
                  );
                  setExtendedSearch(null);
                  setExtendedError("");
                }}
              >
                {secondWordOptions.map(option => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="emerald-save-candidate-check">
            <div>
              <strong>Stored current trend</strong>
              <p>{getTrendPhraseText(trend0)}</p>
            </div>
            <div>
              <strong>Selected recovery phrase</strong>
              <p>{phraseSignature?.phrase ?? "invalid"}</p>
              <p>
                {phraseMatchesSave
                  ? "✓ Phrase matches save"
                  : "⚠ Selected phrase does not match the save"}
              </p>
            </div>
          </div>

          {predictedCandidates && (
            <div className="emerald-save-candidate-check">
              <div>
                <strong>Predicted candidates</strong>
                <ol>
                  {predictedCandidates.candidates.map(
                    candidate => (
                      <li key={candidate.candidateNumber}>
                        {candidate.value}
                      </li>
                    )
                  )}
                </ol>
              </div>
              <div>
                <strong>Exact save value</strong>
                <p>{parseResult.feebasValue.value}</p>
                <p>
                  {exactAppearsInCandidates
                    ? "✓ Exact value appears in predicted candidates"
                    : `Exact value is not in the first ${EMERALD_PARITY_CANDIDATE_COUNT} predicted candidates`}
                </p>
              </div>
            </div>
          )}

          <section
            className={`emerald-classification ${classification.key}`}
          >
            <h3>{classification.title}</h3>
            <p>{classification.detail}</p>
          </section>

          <div className="emerald-save-button-row">
            <button
              type="button"
              onClick={runExtendedSearch}
              disabled={!phraseSignature}
            >
              Run Extended Search
            </button>
            <button
              type="button"
              onClick={copyDiagnosticReport}
              disabled={!parseResult?.valid}
            >
              Copy Diagnostic Report
            </button>
            <span>{copyFeedback}</span>
          </div>

          {extendedError && (
            <section
              className="emerald-save-alert"
              role="alert"
            >
              {extendedError}
            </section>
          )}

          {parseResult.feebasValue.value === "FFFF" && (
            <section className="emerald-ffff-card">
              <h3>Exact value is 0xFFFF.</h3>
              <dl>
                <div>
                  <dt>Selected save slot valid</dt>
                  <dd>YES</dd>
                </div>
                <div>
                  <dt>Sector 3 checksum valid</dt>
                  <dd>
                    {parseResult.sectors.some(
                      sector =>
                        sector.slotIndex ===
                          parseResult.selectedSlot
                            .slotIndex &&
                        sector.logicalId === 3 &&
                        sector.checksumValid
                    )
                      ? "YES"
                      : "NO"}
                  </dd>
                </div>
                <div>
                  <dt>SaveBlock1 reconstructed</dt>
                  <dd>
                    {parseResult.saveBlock1Reconstructed
                      ? "YES"
                      : "NO"}
                  </dd>
                </div>
                <div>
                  <dt>Stored current trend words decoded</dt>
                  <dd>
                    {isTrendPhraseUsableForRecovery(trend0)
                      ? "YES"
                      : "NO"}
                  </dd>
                </div>
                <div>
                  <dt>Trend 0 rand address</dt>
                  <dd>0x2E6A</dd>
                </div>
                <div>
                  <dt>Direct sector read agrees</dt>
                  <dd>
                    {parseResult.directSectorSanity.matches
                      ? "YES"
                      : "NO"}
                  </dd>
                </div>
              </dl>
              {parseResult.directSectorSanity.matches && (
                <p>
                  ✓ Exact-value extraction internally consistent
                </p>
              )}
            </section>
          )}

          {extendedSearch && (
            <section className="emerald-extended-search">
              <h3>
                {extendedSearch.exactValueFound
                  ? "EXACT SAVE VALUE FOUND IN PREDICTION STREAM"
                  : "EXACT SAVE VALUE NOT FOUND"}
              </h3>
              <dl>
                <div>
                  <dt>Exact save value</dt>
                  <dd>{extendedSearch.exactValue}</dd>
                </div>
                <div>
                  <dt>Phrase searched</dt>
                  <dd>
                    {extendedSearch.phraseSignature.phrase}
                  </dd>
                </div>
                <div>
                  <dt>Phrase matches examined</dt>
                  <dd>
                    {
                      extendedSearch.phraseMatchesExamined
                    }
                  </dd>
                </div>
                <div>
                  <dt>RNG advances scanned</dt>
                  <dd>
                    {extendedSearch.rngAdvancesScanned.toLocaleString()}
                  </dd>
                </div>
                {extendedSearch.firstMatch && (
                  <>
                    <div>
                      <dt>Prediction rank</dt>
                      <dd>
                        #
                        {
                          extendedSearch
                            .firstMatchingCandidateRank
                        }
                      </dd>
                    </div>
                    <div>
                      <dt>RNG scan advance</dt>
                      <dd>
                        {
                          extendedSearch.firstMatch
                            .scanAdvance
                        }
                      </dd>
                    </div>
                    <div>
                      <dt>First-word RNG state</dt>
                      <dd>
                        {
                          extendedSearch.firstMatch
                            .firstWordStateHex
                        }
                      </dd>
                    </div>
                    <div>
                      <dt>Feebas rand offset</dt>
                      <dd>
                        +
                        {
                          extendedSearch.firstMatch
                            .trendRandOffset
                        }
                      </dd>
                    </div>
                  </>
                )}
              </dl>

              {extendedSearch.exactValueFound &&
                extendedSearch.firstMatchingCandidateRank >
                  EMERALD_PARITY_CANDIDATE_COUNT && (
                <p>
                  The first-five prediction cutoff would not have included this value.
                </p>
              )}

              {!extendedSearch.exactValueFound && (
                <ul>
                  <li>
                    The Dewford phrase may have been manually changed.
                  </li>
                  <li>
                    The save may have received Dewford trends through record mixing.
                  </li>
                  <li>
                    The active trend may have been generated later in the save's history.
                  </li>
                  <li>
                    The Trainer ID + original-new-game prediction assumptions may not apply to this save.
                  </li>
                  <li>
                    There may still be an unresolved issue in phrase decoding or recovery.
                  </li>
                </ul>
              )}

              {extendedSearch.additionalMatchingRanks.length >
                0 && (
                <p>
                  Additional occurrences:{" "}
                  {extendedSearch.additionalMatchingRanks.join(
                    ", "
                  )}
                </p>
              )}

              <div className="emerald-save-sector-table">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Feebas Value</th>
                      <th>RNG Advance</th>
                      <th>Offset</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedExtendedCandidates.map(
                      candidate => (
                        <tr
                          key={candidate.rank}
                          className={
                            candidate.exactMatch
                              ? "exact"
                              : ""
                          }
                        >
                          <td>{candidate.rank}</td>
                          <td>{candidate.value}</td>
                          <td>
                            {candidate.scanAdvance}
                          </td>
                          <td>
                            +{candidate.trendRandOffset}
                            {candidate.exactMatch
                              ? " ← EXACT SAVE VALUE"
                              : ""}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {extendedRowsShown <
                extendedSearch.candidates.length && (
                <button
                  type="button"
                  onClick={() =>
                    setExtendedRowsShown(
                      current =>
                        current + INITIAL_EXTENDED_ROWS
                    )
                  }
                >
                  Show More
                </button>
              )}
            </section>
          )}
        </section>
      )}

      {parseResult && (
        <details className="emerald-save-diagnostics">
          <summary>Save Diagnostics</summary>
          <div className="emerald-save-results-grid">
            <article className="emerald-save-card">
              <h2>Save Details</h2>
              <dl>
                <div>
                  <dt>File size</dt>
                  <dd>
                    {parseResult.fileSize} bytes
                  </dd>
                </div>
                <div>
                  <dt>Expected raw size</dt>
                  <dd>
                    {GBA_SAVE_SIZE} bytes
                  </dd>
                </div>
                <div>
                  <dt>Save data size</dt>
                  <dd>
                    {parseResult.saveDataSize ?? 0} bytes
                  </dd>
                </div>
                <div>
                  <dt>Extra data</dt>
                  <dd>
                    {parseResult.extraDataSize ?? 0} bytes
                  </dd>
                </div>
                <div>
                  <dt>Format</dt>
                  <dd>
                    {parseResult.formatLabel ?? "-"}
                  </dd>
                </div>
                <div>
                  <dt>RTC extension</dt>
                  <dd>
                    {parseResult.rtcExtensionDetected
                      ? "detected"
                      : "none"}
                  </dd>
                </div>
                <div>
                  <dt>File name</dt>
                  <dd>{fileMeta?.name ?? "-"}</dd>
                </div>
                <div>
                  <dt>Physical save sectors</dt>
                  <dd>{PHYSICAL_SECTOR_COUNT}</dd>
                </div>
                <div>
                  <dt>Sector size</dt>
                  <dd>
                    {SECTOR_SIZE} bytes
                  </dd>
                </div>
                <div>
                  <dt>Logical data size</dt>
                  <dd>
                    {SECTOR_DATA_SIZE} bytes
                  </dd>
                </div>
                <div>
                  <dt>Chosen slot</dt>
                  <dd>
                    {parseResult.selectedSlot?.label ?? "-"}
                  </dd>
                </div>
                <div>
                  <dt>SaveBlock1 reconstructed</dt>
                  <dd>
                    {parseResult.saveBlock1Reconstructed
                      ? "yes"
                      : "no"}
                  </dd>
                </div>
                <div>
                  <dt>Feebas offset</dt>
                  <dd>
                    {formatOffset(
                      EMERALD_FEEBAS_VALUE_OFFSET
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Direct sector sanity offset</dt>
                  <dd>
                    logical sector 3 +{" "}
                    {formatOffset(
                      EMERALD_FEEBAS_SECTOR_OFFSET
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Extracted value</dt>
                  <dd>
                    {parseResult.feebasValue?.value ?? "-"}
                  </dd>
                </div>
              </dl>
            </article>

            {parseResult.slots.map(slot => (
              <article
                className="emerald-save-card"
                key={slot.slotIndex}
              >
                <h2>Slot {slot.label}</h2>
                <dl>
                  <div>
                    <dt>Valid</dt>
                    <dd>{slot.valid ? "yes" : "no"}</dd>
                  </div>
                  <div>
                    <dt>Counter</dt>
                    <dd>{slot.counter ?? "-"}</dd>
                  </div>
                  <div>
                    <dt>Valid sectors</dt>
                    <dd>{slot.validSectors}</dd>
                  </div>
                  <div>
                    <dt>Logical IDs</dt>
                    <dd>
                      {slot.logicalIds.join(", ") || "-"}
                    </dd>
                  </div>
                </dl>
                {slot.errors.length > 0 && (
                  <ul>
                    {slot.errors.map(error => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>

          <article className="emerald-save-card">
            <h2>Sector Footer Offsets</h2>
            <dl>
              <div>
                <dt>ID</dt>
                <dd>{formatOffset(SECTOR_ID_OFFSET)}</dd>
              </div>
              <div>
                <dt>Checksum</dt>
                <dd>
                  {formatOffset(SECTOR_CHECKSUM_OFFSET)}
                </dd>
              </div>
              <div>
                <dt>Signature</dt>
                <dd>
                  {formatOffset(SECTOR_SIGNATURE_OFFSET)}
                </dd>
              </div>
              <div>
                <dt>Counter</dt>
                <dd>
                  {formatOffset(SECTOR_COUNTER_OFFSET)}
                </dd>
              </div>
              <div>
                <dt>Signature value</dt>
                <dd>{formatOffset(SECTOR_SIGNATURE)}</dd>
              </div>
            </dl>
          </article>

          {parseResult.sectors.length > 0 && (
            <article className="emerald-save-card">
              <h2>Physical / Logical Sector Table</h2>
              <div className="emerald-save-sector-table">
                <table>
                  <thead>
                    <tr>
                      <th>Physical</th>
                      <th>Slot</th>
                      <th>Logical ID</th>
                      <th>Signature</th>
                      <th>Checksum</th>
                      <th>Counter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseResult.sectors.map(sector => (
                      <tr key={sector.physicalIndex}>
                        <td>{sector.physicalIndex}</td>
                        <td>
                          {sector.slotIndex === 0
                            ? "A"
                            : "B"}
                        </td>
                        <td>{sector.logicalId}</td>
                        <td>
                          {sector.signatureValid
                            ? "✓"
                            : "x"}
                        </td>
                        <td>
                          {sector.checksumValid
                            ? "✓"
                            : "x"}
                        </td>
                        <td>{sector.counter}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          )}
        </details>
      )}

      {!route119FeebasAudit.valid && (
        <section
          className="emerald-save-alert"
          role="alert"
        >
          Route 119 dataset is not ready; exact tiles cannot be rendered.
        </section>
      )}
    </main>
  );
}

export default EmeraldFeebasSaveValidatorPage;
