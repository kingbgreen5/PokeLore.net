import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import RseRoute119FeebasMap from "../components/feebas/RseRoute119FeebasMap";
import {
  calculateRseFeebasFromValue,
  normalizeFeebasValue,
  route119FeebasAudit,
  runRseFeebasRngSelfTest
} from "../utils/rseFeebasCalculator";
import Seo from "../seo/Seo";
import "./RseFeebasAlgorithmValidatorPage.css";

const RSE_FEEBAS_VALIDATION_VALUES = [
  "0000",
  "0001",
  "0002",
  "0003",
  "000F",
  "0010",
  "0011",
  "007F",
  "0080",
  "00FE",
  "00FF",
  "0100",
  "0123",
  "0FFF",
  "1000",
  "1234",
  "2345",
  "3FFF",
  "4000",
  "5555",
  "7FFE",
  "7FFF",
  "8000",
  "8001",
  "9ABC",
  "ABCD",
  "BEEF",
  "C0DE",
  "D00D",
  "DEAD",
  "EFFF",
  "F000",
  "FEFF",
  "FF00",
  "FFFE",
  "FFFF"
];

const STORAGE_KEY =
  "pokelore-rse-feebas-algorithm-validation-v1";
const STATUS_UNVERIFIED = "unverified";
const STATUS_MATCH = "match";
const STATUS_MISMATCH = "mismatch";
const DATASET_REPAIR_MATCH_VERSION = 1;
const DATASET_REPAIR_MATCH_EVIDENCE = {
  "0002": "Accepted after Route 119 coordinate dataset repair.",
  "0003": "Accepted after Route 119 coordinate dataset repair.",
  "000F": "Accepted after Route 119 coordinate dataset repair.",
  "0010": "Accepted after Route 119 coordinate dataset repair.",
  "0011": "Accepted after Route 119 coordinate dataset repair.",
  "007F": "Accepted after Route 119 coordinate dataset repair."
};

function readSavedState() {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(
      window.localStorage.getItem(STORAGE_KEY)
    );
  } catch {
    return null;
  }
}

function normalizeSavedIndex(value) {
  const index = Number(value);
  return Number.isInteger(index)
    ? Math.min(
        RSE_FEEBAS_VALIDATION_VALUES.length - 1,
        Math.max(0, index)
      )
    : 0;
}

function getInitialEntry(value, saved) {
  const entry = saved?.entries?.[value] ?? {};
  const status = [
    STATUS_UNVERIFIED,
    STATUS_MATCH,
    STATUS_MISMATCH
  ].includes(entry.status)
    ? entry.status
    : STATUS_UNVERIFIED;

  return {
    status:
      saved?.datasetRepairMatchVersion !==
        DATASET_REPAIR_MATCH_VERSION &&
      DATASET_REPAIR_MATCH_EVIDENCE[value]
        ? STATUS_MATCH
        : status,
    notes: String(
      entry.notes ??
        DATASET_REPAIR_MATCH_EVIDENCE[value] ??
        ""
    )
  };
}

function getStatusLabel(status) {
  if (status === STATUS_MATCH) return "Matches";
  if (status === STATUS_MISMATCH) return "Mismatch";
  return "Unverified";
}

function getStatusShort(status) {
  if (status === STATUS_MATCH) return "OK";
  if (status === STATUS_MISMATCH) return "X";
  return "-";
}

function isFormControl(target) {
  const tagName = target?.tagName?.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    tagName === "button" ||
    target?.isContentEditable
  );
}

function buildSavedEntries(saved) {
  return RSE_FEEBAS_VALIDATION_VALUES.reduce(
    (entries, value) => {
      entries[value] = getInitialEntry(value, saved);
      return entries;
    },
    {}
  );
}

function RseFeebasAlgorithmValidatorPage() {
  const saved = useMemo(() => readSavedState(), []);
  const selfTest = useMemo(
    () => runRseFeebasRngSelfTest(),
    []
  );
  const [testIndex, setTestIndex] = useState(() =>
    normalizeSavedIndex(saved?.currentTestIndex)
  );
  const [currentValue, setCurrentValue] = useState(
    () =>
      RSE_FEEBAS_VALIDATION_VALUES[
        normalizeSavedIndex(saved?.currentTestIndex)
      ]
  );
  const [customInput, setCustomInput] = useState(
    () =>
      RSE_FEEBAS_VALIDATION_VALUES[
        normalizeSavedIndex(saved?.currentTestIndex)
      ]
  );
  const [entries, setEntries] = useState(() =>
    buildSavedEntries(saved)
  );
  const [autoAdvance, setAutoAdvance] = useState(
    Boolean(saved?.autoAdvance)
  );
  const [copyOnAutoAdvance, setCopyOnAutoAdvance] =
    useState(Boolean(saved?.copyOnAutoAdvance));
  const [showDiagnostics, setShowDiagnostics] =
    useState(Boolean(saved?.showDiagnostics));
  const [showAllFishingSpots, setShowAllFishingSpots] =
    useState(false);
  const [tableFilter, setTableFilter] = useState(
    saved?.tableFilter || "all"
  );
  const [feedback, setFeedback] = useState("");

  const normalized = useMemo(
    () => normalizeFeebasValue(currentValue),
    [currentValue]
  );
  const currentPredefinedIndex =
    RSE_FEEBAS_VALIDATION_VALUES.indexOf(
      normalized.value
    );
  const currentEntry =
    currentPredefinedIndex >= 0
      ? entries[normalized.value]
      : null;
  const canCalculate =
    normalized.valid &&
    route119FeebasAudit.valid &&
    selfTest.valid;
  const result = useMemo(() => {
    if (!canCalculate) return null;

    try {
      return calculateRseFeebasFromValue(
        normalized.value
      );
    } catch {
      return null;
    }
  }, [canCalculate, normalized.value]);
  const progress = useMemo(() => {
    return RSE_FEEBAS_VALIDATION_VALUES.reduce(
      (counts, value) => {
        const status =
          entries[value]?.status ?? STATUS_UNVERIFIED;
        counts[status] += 1;
        counts.total += 1;
        return counts;
      },
      {
        [STATUS_MATCH]: 0,
        [STATUS_MISMATCH]: 0,
        [STATUS_UNVERIFIED]: 0,
        total: 0
      }
    );
  }, [entries]);
  const filteredValidationValues =
    RSE_FEEBAS_VALIDATION_VALUES.filter(value => {
      if (tableFilter === "all") return true;
      return (
        entries[value]?.status === tableFilter
      );
    });

  useEffect(() => {
    const snapshot = {
      currentTestIndex: testIndex,
      datasetRepairMatchVersion:
        DATASET_REPAIR_MATCH_VERSION,
      entries,
      autoAdvance,
      copyOnAutoAdvance,
      showDiagnostics,
      tableFilter
    };

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(snapshot)
    );
  }, [
    autoAdvance,
    copyOnAutoAdvance,
    entries,
    showDiagnostics,
    tableFilter,
    testIndex
  ]);

  const loadTestIndex = useCallback(index => {
    const nextIndex = normalizeSavedIndex(index);
    const value = RSE_FEEBAS_VALIDATION_VALUES[nextIndex];

    setTestIndex(nextIndex);
    setCurrentValue(value);
    setCustomInput(value);
    setFeedback(`Loaded ${value}.`);
  }, []);

  const copyText = useCallback(async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback(message);
      return true;
    } catch {
      setFeedback("Could not copy to clipboard.");
      return false;
    }
  }, []);

  const copyCurrentValue = useCallback(() => {
    if (!normalized.valid) {
      setFeedback(normalized.error);
      return Promise.resolve(false);
    }

    return copyText(
      normalized.value,
      `Copied ${normalized.value}`
    );
  }, [copyText, normalized]);

  const goPrevious = useCallback(() => {
    if (testIndex <= 0) return;
    loadTestIndex(testIndex - 1);
  }, [loadTestIndex, testIndex]);

  const goNext = useCallback(() => {
    if (
      testIndex >=
      RSE_FEEBAS_VALIDATION_VALUES.length - 1
    ) {
      return;
    }
    loadTestIndex(testIndex + 1);
  }, [loadTestIndex, testIndex]);

  const nextAndCopy = useCallback(async () => {
    if (
      testIndex >=
      RSE_FEEBAS_VALIDATION_VALUES.length - 1
    ) {
      return;
    }

    const nextIndex = testIndex + 1;
    const nextValue =
      RSE_FEEBAS_VALIDATION_VALUES[nextIndex];

    setTestIndex(nextIndex);
    setCurrentValue(nextValue);
    setCustomInput(nextValue);
    await copyText(nextValue, `Copied ${nextValue}`);
  }, [copyText, testIndex]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (isFormControl(event.target)) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "Enter") {
        event.preventDefault();
        copyCurrentValue();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [copyCurrentValue, goNext, goPrevious]);

  function calculateCustomValue() {
    const next = normalizeFeebasValue(customInput);
    if (!next.valid) {
      setFeedback(next.error);
      return;
    }

    const predefinedIndex =
      RSE_FEEBAS_VALIDATION_VALUES.indexOf(next.value);
    if (predefinedIndex >= 0) {
      setTestIndex(predefinedIndex);
    }

    setCurrentValue(next.value);
    setCustomInput(next.value);
    setFeedback(
      predefinedIndex >= 0
        ? `Loaded predefined test ${predefinedIndex + 1}.`
        : `Calculated custom value ${next.value}.`
    );
  }

  async function markCurrent(status) {
    if (!currentEntry || !normalized.valid) {
      setFeedback(
        "Only predefined test values can be marked."
      );
      return;
    }

    setEntries(current => ({
      ...current,
      [normalized.value]: {
        ...current[normalized.value],
        status
      }
    }));

    setFeedback(
      `${normalized.value} marked ${getStatusLabel(status)}.`
    );

    if (
      status === STATUS_MATCH &&
      autoAdvance &&
      testIndex <
        RSE_FEEBAS_VALIDATION_VALUES.length - 1
    ) {
      const nextIndex = testIndex + 1;
      const nextValue =
        RSE_FEEBAS_VALIDATION_VALUES[nextIndex];

      setTestIndex(nextIndex);
      setCurrentValue(nextValue);
      setCustomInput(nextValue);

      if (copyOnAutoAdvance) {
        await copyText(nextValue, `Copied ${nextValue}`);
      }
    }
  }

  function updateCurrentNotes(notes) {
    if (!currentEntry || !normalized.valid) return;

    setEntries(current => ({
      ...current,
      [normalized.value]: {
        ...current[normalized.value],
        notes
      }
    }));
  }

  function clearCurrentStatus() {
    if (!currentEntry || !normalized.valid) return;

    setEntries(current => ({
      ...current,
      [normalized.value]: {
        ...current[normalized.value],
        status: STATUS_UNVERIFIED
      }
    }));
    setFeedback(`${normalized.value} status cleared.`);
  }

  function resetAllStatuses() {
    if (
      !window.confirm(
        "Reset all RSE Feebas validation statuses and notes?"
      )
    ) {
      return;
    }

    setEntries(buildSavedEntries(null));
    setFeedback("All validation statuses reset.");
  }

  function buildDebugJson() {
    return JSON.stringify(
      {
        feebasValue: normalized.value,
        decimalSeed: result?.decimalSeed ?? null,
        generatedSpotIds:
          result?.generatedSpotIds ?? [],
        uniqueSpotIds: result?.uniqueSpotIds ?? [],
        coordinates: result?.coordinates ?? [],
        rngAdvances: result?.rngAdvances ?? [],
        status:
          currentEntry?.status ?? STATUS_UNVERIFIED,
        notes: currentEntry?.notes ?? ""
      },
      null,
      2
    );
  }

  function copyDebugJson() {
    return copyText(
      buildDebugJson(),
      `Copied debug JSON for ${normalized.value}`
    );
  }

  function copyResultSummary() {
    if (!result) {
      setFeedback("No calculated result to copy.");
      return Promise.resolve(false);
    }

    return copyText(
      `Feebas Value: ${result.feebasValue}\nSpots: ${result.generatedSpotIds.join(", ")}`,
      `Copied result summary for ${result.feebasValue}`
    );
  }

  const predefinedHint =
    currentPredefinedIndex >= 0
      ? `Predefined test ${currentPredefinedIndex + 1} of ${RSE_FEEBAS_VALIDATION_VALUES.length}`
      : "Custom value";
  const hasMismatch =
    currentEntry?.status === STATUS_MISMATCH;

  return (
    <main className="rse-feebas-validator">
      <Seo
        title="RSE Feebas Algorithm Validator | PokeLore"
        description="Private local Route 119 Feebas algorithm validator."
        canonical="https://pokelore.net/dev/rse-feebas-algorithm-validator"
        robots="noindex, nofollow"
      />

      <header className="rse-feebas-validator-header">
        <div>
          <h1>RSE Feebas Algorithm Validator</h1>
          <p>
            Validate Custom Feebas Values against the Route 119 fishing-spot dataset.
          </p>
        </div>
        <section className="rse-feebas-progress-card">
          <h2>Validation Progress</h2>
          <dl>
            <div>
              <dt>Matches</dt>
              <dd>{progress[STATUS_MATCH]}</dd>
            </div>
            <div>
              <dt>Mismatches</dt>
              <dd>{progress[STATUS_MISMATCH]}</dd>
            </div>
            <div>
              <dt>Unverified</dt>
              <dd>{progress[STATUS_UNVERIFIED]}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{progress.total}</dd>
            </div>
          </dl>
        </section>
      </header>

      <p className="rse-feebas-feedback" aria-live="polite">
        {feedback}
      </p>

      {(!route119FeebasAudit.valid || !selfTest.valid) && (
        <section className="rse-feebas-alert" role="alert">
          <h2>Validator blocked</h2>
          {!route119FeebasAudit.valid && (
            <ul>
              {route119FeebasAudit.errors.map(error => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
          {!selfTest.valid && (
            <p>
              RSE Feebas RNG self-test failed. Calculation is disabled.
            </p>
          )}
        </section>
      )}

      <section className="rse-feebas-workflow">
        <section className="rse-feebas-current-card">
          <span>{predefinedHint}</span>
          <h2>Current Muck Test Value</h2>
          <strong>{normalized.valid ? normalized.value : "----"}</strong>
          <p>
            Current test: {normalized.valid ? normalized.value : "Invalid"} - {getStatusLabel(currentEntry?.status)}
          </p>
          {result && (
            <p>
              Decimal seed: {result.decimalSeed}
            </p>
          )}
          {!normalized.valid && (
            <p className="rse-feebas-warning">
              {normalized.error}
            </p>
          )}
        </section>

        <section className="rse-feebas-controls-card">
          <div className="rse-feebas-test-nav">
            <button
              type="button"
              onClick={goPrevious}
              disabled={testIndex === 0}
            >
              Previous Test
            </button>
            <strong>
              Test {testIndex + 1} of {RSE_FEEBAS_VALIDATION_VALUES.length}
            </strong>
            <button
              type="button"
              onClick={goNext}
              disabled={
                testIndex ===
                RSE_FEEBAS_VALIDATION_VALUES.length - 1
              }
            >
              Next Test
            </button>
          </div>

          <div className="rse-feebas-actions">
            <button
              type="button"
              onClick={copyCurrentValue}
              disabled={!normalized.valid}
            >
              Copy Value
            </button>
            <button
              type="button"
              onClick={nextAndCopy}
              disabled={
                testIndex ===
                RSE_FEEBAS_VALIDATION_VALUES.length - 1
              }
            >
              Next + Copy
            </button>
            <button
              type="button"
              onClick={copyResultSummary}
              disabled={!result}
            >
              Copy Result Summary
            </button>
          </div>

          <label className="rse-feebas-field">
            <span>Jump to test</span>
            <select
              value={testIndex}
              onChange={event =>
                loadTestIndex(Number(event.target.value))
              }
            >
              {RSE_FEEBAS_VALIDATION_VALUES.map(
                (value, index) => (
                  <option key={value} value={index}>
                    {index + 1} - {value}
                  </option>
                )
              )}
            </select>
          </label>

          <div className="rse-feebas-custom-row">
            <label className="rse-feebas-field">
              <span>Custom Feebas Value</span>
              <input
                value={customInput}
                maxLength={4}
                onChange={event =>
                  setCustomInput(
                    event.target.value.toUpperCase()
                  )
                }
                placeholder="ABCD"
              />
            </label>
            <button
              type="button"
              onClick={calculateCustomValue}
            >
              Calculate
            </button>
          </div>
        </section>

        <section className="rse-feebas-comparison-card">
          <h2>External Comparison</h2>
          <ol>
            <li>Click Copy Value.</li>
            <li>Paste the four-character value into Muck&apos;s Custom Feebas Value.</li>
            <li>Compare Muck&apos;s highlighted Route 119 squares with PokeLore&apos;s.</li>
            <li>Mark the result below.</li>
          </ol>

          <div className="rse-feebas-actions">
            <button
              type="button"
              onClick={() => markCurrent(STATUS_MATCH)}
              disabled={!currentEntry}
            >
              Matches
            </button>
            <button
              type="button"
              className="is-danger"
              onClick={() =>
                markCurrent(STATUS_MISMATCH)
              }
              disabled={!currentEntry}
            >
              Mismatch
            </button>
            <button
              type="button"
              onClick={clearCurrentStatus}
              disabled={!currentEntry}
            >
              Clear
            </button>
          </div>

          <label className="rse-feebas-toggle">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={event =>
                setAutoAdvance(event.target.checked)
              }
            />
            <span>Auto-advance after marking match</span>
          </label>
          <label className="rse-feebas-toggle">
            <input
              type="checkbox"
              checked={copyOnAutoAdvance}
              onChange={event =>
                setCopyOnAutoAdvance(
                  event.target.checked
                )
              }
            />
            <span>Copy next value when auto-advancing</span>
          </label>

          <label className="rse-feebas-field">
            <span>Notes</span>
            <textarea
              value={currentEntry?.notes ?? ""}
              disabled={!currentEntry}
              onChange={event =>
                updateCurrentNotes(event.target.value)
              }
              rows="4"
            />
          </label>
        </section>
      </section>

      <section
        className={`rse-feebas-main-grid ${hasMismatch ? "has-mismatch" : ""}`}
      >
        <section className="rse-feebas-map-card">
          <div className="rse-feebas-map-card-header">
            <h2>Route 119 Highlights</h2>
            <label className="rse-feebas-toggle">
              <input
                type="checkbox"
                checked={showAllFishingSpots}
                onChange={event =>
                  setShowAllFishingSpots(
                    event.target.checked
                  )
                }
              />
              <span>Show all fishing spots</span>
            </label>
          </div>
          <RseRoute119FeebasMap
            spotIds={result?.generatedSpotIds ?? []}
            showAllFishingSpots={showAllFishingSpots}
          />
        </section>

        <section className="rse-feebas-results-card">
          <h2>Result Diagnostics</h2>
          {result ? (
            <>
              <dl className="rse-feebas-summary-list">
                <div>
                  <dt>Feebas Value</dt>
                  <dd>{result.feebasValue}</dd>
                </div>
                <div>
                  <dt>Decimal seed</dt>
                  <dd>{result.decimalSeed}</dd>
                </div>
                <div>
                  <dt>Generated results</dt>
                  <dd>{result.generatedResults}</dd>
                </div>
                <div>
                  <dt>Unique physical spots</dt>
                  <dd>{result.uniqueSpotIds.length}</dd>
                </div>
                <div>
                  <dt>Duplicate spot IDs</dt>
                  <dd>
                    {result.duplicateSpotIds.length > 0
                      ? result.duplicateSpotIds.join(", ")
                      : "None"}
                  </dd>
                </div>
              </dl>

              <div className="rse-feebas-result-list">
                {result.coordinates.map(coordinate => (
                  <article key={coordinate.resultNumber}>
                    <h3>
                      Result {coordinate.resultNumber}
                    </h3>
                    <p>Spot ID: {coordinate.spotId}</p>
                    <p>
                      Coordinate: x {coordinate.x}, y {coordinate.y}
                    </p>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p>No valid calculation is available.</p>
          )}

          <div className="rse-feebas-actions">
            <label className="rse-feebas-toggle">
              <input
                type="checkbox"
                checked={showDiagnostics}
                onChange={event =>
                  setShowDiagnostics(
                    event.target.checked
                  )
                }
              />
              <span>Show RNG diagnostics</span>
            </label>
            <button
              type="button"
              onClick={copyDebugJson}
              disabled={!result}
            >
              Copy Debug JSON
            </button>
          </div>

          {showDiagnostics && result && (
            <div className="rse-feebas-rng-table-wrap">
              <table className="rse-feebas-rng-table">
                <thead>
                  <tr>
                    <th>Advance</th>
                    <th>Before</th>
                    <th>After</th>
                    <th>After hex</th>
                    <th>Upper16</th>
                    <th>Modulo</th>
                    <th>Spot</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rngAdvances.map(advance => (
                    <tr
                      key={advance.advanceNumber}
                      className={
                        advance.accepted
                          ? ""
                          : "is-rejected"
                      }
                    >
                      <td>{advance.advanceNumber}</td>
                      <td>{advance.stateBeforeHex}</td>
                      <td>{advance.stateAfter}</td>
                      <td>{advance.stateAfterHex}</td>
                      <td>{advance.upper16Hex}</td>
                      <td>{advance.moduloResult}</td>
                      <td>{advance.spotId}</td>
                      <td>
                        {advance.accepted
                          ? `Accepted result ${advance.resultNumber}`
                          : `Rejected: ${advance.rejectionReason}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      <section className="rse-feebas-validation-table-card">
        <div className="rse-feebas-table-header">
          <h2>Validation Table</h2>
          <div className="rse-feebas-segmented">
            {[
              ["all", "All"],
              [STATUS_UNVERIFIED, "Unverified"],
              [STATUS_MATCH, "Matches"],
              [STATUS_MISMATCH, "Mismatches"]
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  tableFilter === value ? "active" : ""
                }
                onClick={() => setTableFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rse-feebas-validation-table-wrap">
          <table className="rse-feebas-validation-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Value</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredValidationValues.map(value => {
                const index =
                  RSE_FEEBAS_VALIDATION_VALUES.indexOf(
                    value
                  );
                const entry = entries[value];
                return (
                  <tr
                    key={value}
                    className={
                      value === normalized.value
                        ? "active"
                        : ""
                    }
                    onClick={() => loadTestIndex(index)}
                  >
                    <td>{index + 1}</td>
                    <td>{value}</td>
                    <td>
                      {getStatusShort(entry.status)}
                    </td>
                    <td>{entry.notes ? "Yes" : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rse-feebas-actions">
          <button
            type="button"
            onClick={clearCurrentStatus}
            disabled={!currentEntry}
          >
            Reset current test status
          </button>
          <button
            type="button"
            className="is-danger"
            onClick={resetAllStatuses}
          >
            Reset all validation statuses
          </button>
        </div>
      </section>
    </main>
  );
}

export default RseFeebasAlgorithmValidatorPage;
