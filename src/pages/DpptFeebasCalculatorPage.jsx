import {
  useMemo,
  useState
} from "react";
import { Link } from "react-router-dom";
import DpptFeebasMap from "../components/feebas/DpptFeebasMap";
import validationCases from "../data/feebas/dpptFeebasValidationCases.json";
import Seo from "../seo/Seo";
import {
  DPPT_FEEBAS_SUGGESTED_VALIDATION_PAIRS,
  calculateDpptFeebasResults,
  createRandomValidationPair,
  validateLotteryNumber
} from "../utils/dpptFeebasCalculator";
import {
  DPPT_FEEBAS_MAP_IMAGE_SRC,
  dpptFeebasAudit
} from "../utils/dpptFeebasTiles";
import "./DpptFeebasCalculatorPage.css";

const VISUAL_MATCH_STATUSES = [
  "unverified",
  "matches-external",
  "does-not-match-external"
];

const DEFAULT_FORM = {
  yesterdayLottery: "",
  todayLottery: ""
};

function formatList(values) {
  if (!values || values.length === 0) return "None";
  return values.join(", ");
}

function getInitialVisualStatus() {
  if (typeof window === "undefined") {
    return VISUAL_MATCH_STATUSES[0];
  }

  const saved = window.localStorage.getItem(
    "dppt-feebas-calculator-visual-status"
  );

  return VISUAL_MATCH_STATUSES.includes(saved)
    ? saved
    : VISUAL_MATCH_STATUSES[0];
}

function getInitialSuggestedPairIndex() {
  if (typeof window === "undefined") {
    return 0;
  }

  const saved = Number.parseInt(
    window.localStorage.getItem(
      "dppt-feebas-calculator-suggested-pair-index"
    ),
    10
  );

  return Number.isInteger(saved) && saved >= 0
    ? saved % DPPT_FEEBAS_SUGGESTED_VALIDATION_PAIRS.length
    : 0;
}

function DetailList({
  rows
}) {
  return (
    <dl className="dppt-feebas-calc-detail-list">
      {rows.map(row => (
        <div key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ResultTable({
  results
}) {
  return (
    <div className="dppt-feebas-result-table">
      <div className="dppt-feebas-result-row dppt-feebas-result-head">
        <span>Result</span>
        <span>Index</span>
        <span>Group</span>
        <span>In group</span>
        <span>Coordinate</span>
      </div>
      {results.map(result => (
        <div
          className="dppt-feebas-result-row"
          key={result.resultNumber}
        >
          <span>{result.resultNumber}</span>
          <span>{result.index}</span>
          <span>{result.group}</span>
          <span>{result.indexWithinGroup}</span>
          <span>
            x {result.x}, y {result.y}
          </span>
        </div>
      ))}
    </div>
  );
}

function createTestCaseJson({
  form,
  result,
  visualStatus
}) {
  const singleCandidate =
    result?.candidates?.length === 1
      ? result.candidates[0]
      : null;

  return {
    name: `Lottery pair ${form.yesterdayLottery} -> ${form.todayLottery}`,
    yesterdayLottery: form.yesterdayLottery,
    todayLottery: form.todayLottery,
    expectedIndexes: singleCandidate?.indexes ?? null,
    expectedCoordinates:
      singleCandidate?.results.map(entry => ({
        resultNumber: entry.resultNumber,
        index: entry.index,
        x: entry.x,
        y: entry.y
      })) ?? null,
    externalVisualMatch: visualStatus,
    notes:
      result?.candidates?.length > 1
        ? `${result.candidates.length} candidates were produced; compare each map result.`
        : ""
  };
}

function DpptFeebasCalculatorPage() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [result, setResult] = useState(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [visualStatus, setVisualStatus] = useState(
    getInitialVisualStatus
  );
  const [
    suggestedPairIndex,
    setSuggestedPairIndex
  ] = useState(getInitialSuggestedPairIndex);
  const [generatedPair, setGeneratedPair] =
    useState(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const fieldErrors = useMemo(
    () => ({
      yesterdayLottery:
        form.yesterdayLottery === ""
          ? null
          : validateLotteryNumber(form.yesterdayLottery)
              .error,
      todayLottery:
        form.todayLottery === ""
          ? null
          : validateLotteryNumber(form.todayLottery).error
    }),
    [form]
  );
  const canCalculate =
    dpptFeebasAudit.valid;
  const testCaseJson = JSON.stringify(
    createTestCaseJson({
      form,
      result,
      visualStatus
    }),
    null,
    2
  );

  function updateField(field, value) {
    setForm(current => ({
      ...current,
      [field]: value.slice(0, 5)
    }));
    setCopyStatus("");
  }

  function calculate() {
    const nextResult = calculateDpptFeebasResults(
      form.yesterdayLottery,
      form.todayLottery
    );
    setResult(nextResult);
    setCopyStatus("");
  }

  function loadGeneratedPair(pair) {
    const nextForm = {
      yesterdayLottery: pair.yesterdayLottery,
      todayLottery: pair.todayLottery
    };

    setForm(nextForm);
    setResult(
      calculateDpptFeebasResults(
        nextForm.yesterdayLottery,
        nextForm.todayLottery
      )
    );
    setGeneratedPair(pair);
    setVisualStatus(VISUAL_MATCH_STATUSES[0]);
    setCopyStatus("");
  }

  function loadNextSuggestedPair() {
    const pair =
      DPPT_FEEBAS_SUGGESTED_VALIDATION_PAIRS[
        suggestedPairIndex
      ];
    const nextIndex =
      (suggestedPairIndex + 1) %
      DPPT_FEEBAS_SUGGESTED_VALIDATION_PAIRS.length;

    setSuggestedPairIndex(nextIndex);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "dppt-feebas-calculator-suggested-pair-index",
        String(nextIndex)
      );
    }
    loadGeneratedPair(pair);
  }

  function loadRandomPair() {
    loadGeneratedPair(createRandomValidationPair());
  }

  function reset() {
    setForm(DEFAULT_FORM);
    setResult(null);
    setCopyStatus("");
    setGeneratedPair(null);
  }

  function loadCase(testCase) {
    setForm({
      yesterdayLottery: testCase.yesterdayLottery,
      todayLottery: testCase.todayLottery
    });
    const nextStatus =
      testCase.externalVisualMatch ??
      VISUAL_MATCH_STATUSES[0];
    setVisualStatus(nextStatus);
    setResult(
      calculateDpptFeebasResults(
        testCase.yesterdayLottery,
        testCase.todayLottery
      )
    );
    setGeneratedPair(null);
    setCopyStatus("");
  }

  async function copyCurrentTestCase() {
    try {
      await navigator.clipboard.writeText(testCaseJson);
      setCopyStatus("Copied test-case JSON.");
    } catch {
      setCopyStatus(
        "Clipboard copy failed. The JSON is displayed below."
      );
      setShowRawJson(true);
    }
  }

  function updateVisualStatus(value) {
    setVisualStatus(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "dppt-feebas-calculator-visual-status",
        value
      );
    }
  }

  return (
    <main className="dppt-feebas-calculator">
      <Seo
        title="DPPt Feebas Calculator - Developer Validation | PokeLore"
        description="Private local DPPt Feebas calculator validation page."
        canonical="https://pokelore.net/dev/dppt-feebas-calculator"
        robots="noindex, nofollow"
      />

      <header className="dppt-feebas-calculator-top">
        <div>
          <p className="dppt-feebas-kicker">
            Developer-only
          </p>
          <h1>
            DPPt Feebas Calculator - Developer Validation
          </h1>
          <p>
            Enter two consecutive Lottery Corner numbers to recover
            today&apos;s daily group seed, calculate four Feebas
            indexes, and compare the highlighted Mt. Coronet map
            squares.
          </p>
        </div>
        <nav aria-label="Feebas developer tools">
          <Link to="/dev/feebas-map-validator">
            Map validator
          </Link>
          <Link to="/dev/feebas-tile-editor">
            Tile editor
          </Link>
        </nav>
      </header>

      <div className="dppt-feebas-calculator-layout">
        <section className="dppt-feebas-main-panel">
          <section className="dppt-feebas-panel">
            <h2>Lottery Inputs</h2>
            <div className="dppt-feebas-input-grid">
              <label>
                <span>Yesterday&apos;s Lottery number</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={form.yesterdayLottery}
                  placeholder="01234"
                  onChange={event =>
                    updateField(
                      "yesterdayLottery",
                      event.target.value
                    )
                  }
                />
                {fieldErrors.yesterdayLottery && (
                  <small role="alert">
                    {fieldErrors.yesterdayLottery}
                  </small>
                )}
              </label>

              <label>
                <span>Today&apos;s Lottery number</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={form.todayLottery}
                  placeholder="65432"
                  onChange={event =>
                    updateField(
                      "todayLottery",
                      event.target.value
                    )
                  }
                />
                {fieldErrors.todayLottery && (
                  <small role="alert">
                    {fieldErrors.todayLottery}
                  </small>
                )}
              </label>
            </div>

            <div className="dppt-feebas-actions">
              <button
                type="button"
                disabled={!canCalculate}
                onClick={calculate}
              >
                Calculate
              </button>
              <button type="button" onClick={reset}>
                Reset
              </button>
            </div>

            {!dpptFeebasAudit.valid && (
              <ul
                className="dppt-feebas-errors"
                role="alert"
              >
                {dpptFeebasAudit.errors.map(error => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}
          </section>

          {result?.errors.length > 0 && (
            <section
              className="dppt-feebas-panel dppt-feebas-error-panel"
              role="alert"
            >
              <h2>Calculation Errors</h2>
              <ul>
                {result.errors.map(error => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </section>
          )}

          {result?.candidates.map(candidate => (
            <section
              className="dppt-feebas-panel"
              key={candidate.groupSeedUnsigned}
            >
              <div className="dppt-feebas-candidate-header">
                <div>
                  <h2>
                    Candidate {candidate.candidateNumber}
                  </h2>
                  <p>
                    Today&apos;s group seed {candidate.seedHex}
                  </p>
                </div>
                <strong>
                  {candidate.indexes.join(", ")}
                </strong>
                {candidate.hasSignedAbsoluteAlternate && (
                  <span className="dppt-feebas-alt-badge">
                    Legacy alternate available
                  </span>
                )}
              </div>

              <DpptFeebasMap
                highlightedIndexes={candidate.indexes}
                showGroupBoundaries
              />
              <p className="dppt-feebas-note">
                Map image path: {DPPT_FEEBAS_MAP_IMAGE_SRC}
              </p>

              {candidate.hasSignedAbsoluteAlternate && (
                <section className="dppt-feebas-alternate">
                  <div className="dppt-feebas-candidate-header">
                    <div>
                      <h3>
                        Signed-absolute legacy alternate
                      </h3>
                      <p>
                        This is the previous local method for
                        negative seeds. Use it only to compare old
                        mismatch notes.
                      </p>
                    </div>
                    <strong>
                      {candidate.signedAbsoluteIndexes.join(", ")}
                    </strong>
                  </div>
                  <DpptFeebasMap
                    highlightedIndexes={
                      candidate.signedAbsoluteIndexes
                    }
                    showGroupBoundaries
                  />
                  <DetailList
                    rows={[
                      {
                        label: "Signed-absolute bytes",
                        value:
                          candidate.signedAbsoluteBytes.join(", ")
                      },
                      {
                        label: "Signed-absolute indexes",
                        value:
                          candidate.signedAbsoluteIndexes.join(", ")
                      }
                    ]}
                  />
                  <ResultTable
                    results={candidate.signedAbsoluteResults}
                  />
                </section>
              )}

              <section className="dppt-feebas-diagnostics">
                <h3>Diagnostics</h3>
                <DetailList
                  rows={[
                    {
                      label: "Yesterday Lottery",
                      value: result.yesterdayLottery
                    },
                    {
                      label: "Today Lottery",
                      value: result.todayLottery
                    },
                    {
                      label: "Yesterday recovered seed",
                      value: `${candidate.yesterdaySeedSigned} / ${candidate.yesterdaySeedUnsigned}`
                    },
                    {
                      label: "Yesterday seed hex",
                      value: candidate.yesterdaySeedHex
                    },
                    {
                      label: "Today signed seed",
                      value: candidate.groupSeedSigned
                    },
                    {
                      label: "Today unsigned seed",
                      value: candidate.groupSeedUnsigned
                    },
                    {
                      label: "Today seed hex",
                      value: candidate.seedHex
                    },
                    {
                      label: "Absolute seed",
                      value: candidate.absoluteSeed
                    },
                    {
                      label: "Extracted bytes",
                      value: candidate.bytes.join(", ")
                    },
                    {
                      label: "Global Feebas indexes",
                      value: candidate.indexes.join(", ")
                    }
                  ]}
                />
                <ResultTable results={candidate.results} />
              </section>
            </section>
          ))}
        </section>

        <aside className="dppt-feebas-side-panel">
          <section className="dppt-feebas-panel">
            <h2>Dataset Audit</h2>
            <DetailList
              rows={[
                {
                  label: "Coordinate entries",
                  value: dpptFeebasAudit.coordinateEntries
                },
                {
                  label: "Unique indexes",
                  value: dpptFeebasAudit.uniqueIndexes
                },
                {
                  label: "Unique coordinates",
                  value: dpptFeebasAudit.uniqueCoordinates
                },
                {
                  label: "Lowest index",
                  value: dpptFeebasAudit.lowestIndex
                },
                {
                  label: "Highest index",
                  value: dpptFeebasAudit.highestIndex
                },
                {
                  label: "Excluded grid cells",
                  value: dpptFeebasAudit.excludedGridCells
                },
                {
                  label: "Missing indexes",
                  value: formatList(
                    dpptFeebasAudit.missingIndexes
                  )
                },
                {
                  label: "Dataset valid",
                  value: dpptFeebasAudit.valid
                    ? "Yes"
                    : "No"
                }
              ]}
            />
          </section>

          <section className="dppt-feebas-panel">
            <h2>Compare with External Calculator</h2>
            <ol className="dppt-feebas-steps">
              <li>
                Enter the same consecutive lottery numbers in
                the PokeMow DPPt Feebas calculator.
              </li>
              <li>Enter them here.</li>
              <li>
                Compare all four highlighted physical map
                squares.
              </li>
              <li>Record whether they match.</li>
            </ol>
            <label>
              <span>Manual visual status</span>
              <select
                value={visualStatus}
                onChange={event =>
                  updateVisualStatus(event.target.value)
                }
              >
                {VISUAL_MATCH_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="dppt-feebas-panel">
            <h2>Generate Validation Pair</h2>
            <div className="dppt-feebas-actions">
              <button
                type="button"
                onClick={loadNextSuggestedPair}
              >
                Next Suggested Pair
              </button>
              <button
                type="button"
                onClick={loadRandomPair}
              >
                Random Pair
              </button>
            </div>
            {generatedPair && (
              <div className="dppt-feebas-generated-pair">
                <strong>{generatedPair.label}</strong>
                <code>
                  {generatedPair.yesterdayLottery} {"->"}{" "}
                  {generatedPair.todayLottery}
                </code>
                <span>{generatedPair.profile}</span>
                <span>
                  Yesterday seed {generatedPair.yesterdaySeedHex}
                </span>
                <span>
                  Today seed {generatedPair.todaySeedHex}
                </span>
              </div>
            )}
          </section>

          <section className="dppt-feebas-panel">
            <h2>Saved Validation Cases</h2>
            <div className="dppt-feebas-case-list">
              {validationCases.map(testCase => (
                <article key={testCase.name}>
                  <strong>{testCase.name}</strong>
                  <code>
                    {testCase.yesterdayLottery} {"->"}{" "}
                    {testCase.todayLottery}
                  </code>
                  <span>
                    {testCase.externalVisualMatch ??
                      "unverified"}
                  </span>
                  {testCase.notes && (
                    <p>{testCase.notes}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => loadCase(testCase)}
                  >
                    Load Case
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="dppt-feebas-panel">
            <h2>Import / Export Test Case</h2>
            <div className="dppt-feebas-actions">
              <button
                type="button"
                onClick={copyCurrentTestCase}
              >
                Copy Current Test Case
              </button>
              <button
                type="button"
                onClick={() =>
                  setShowRawJson(current => !current)
                }
              >
                {showRawJson ? "Hide JSON" : "Show JSON"}
              </button>
            </div>
            {copyStatus && <p>{copyStatus}</p>}
            {showRawJson && (
              <pre className="dppt-feebas-json">
                {testCaseJson}
              </pre>
            )}
          </section>

          {result && (
            <section className="dppt-feebas-panel">
              <h2>Raw Calculation Result</h2>
              <pre className="dppt-feebas-json">
                {JSON.stringify(result, null, 2)}
              </pre>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}

export default DpptFeebasCalculatorPage;
