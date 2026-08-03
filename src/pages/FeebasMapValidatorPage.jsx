import {
  useMemo,
  useState
} from "react";
import { Link } from "react-router-dom";
import DpptFeebasMap from "../components/feebas/DpptFeebasMap";
import validationCases from "../data/feebas/dpptFeebasValidationCases.json";
import {
  DPPT_FEEBAS_GROUP_RANGES,
  DPPT_FEEBAS_MAP_IMAGE_SRC,
  DPPT_FEEBAS_TILE_COUNT,
  dpptFeebasAudit,
  getFeebasGroup,
  getFeebasIndexWithinGroup,
  getFeebasTileByIndex,
  getFirstTileOnNextRow,
  getFirstTileOnPreviousRow
} from "../utils/dpptFeebasTiles";
import "./FeebasMapValidatorPage.css";

const DEFAULT_RESULT_INDEXES = [
  "37",
  "186",
  "342",
  "487"
];
const indexValidationCases = validationCases.filter(
  testCase => Array.isArray(testCase.indexes)
);

function parseIndex(value) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue)) return null;
  if (
    numberValue < 0 ||
    numberValue >= DPPT_FEEBAS_TILE_COUNT
  ) {
    return null;
  }

  return numberValue;
}

function parseRawInteger(value) {
  if (String(value).trim() === "") return null;
  const numberValue = Number(value);
  return Number.isInteger(numberValue)
    ? numberValue
    : null;
}

function formatList(values) {
  return values.length === 0 ? "None" : values.join(", ");
}

function FeebasMapValidatorPage() {
  const [resultInputs, setResultInputs] = useState(
    DEFAULT_RESULT_INDEXES
  );
  const [inspectIndex, setInspectIndex] =
    useState("217");
  const [inspectionMode, setInspectionMode] =
    useState(false);
  const [showAllIndexedTiles, setShowAllIndexedTiles] =
    useState(false);
  const [showAllTileIndexes, setShowAllTileIndexes] =
    useState(false);
  const [showGroupBoundaries, setShowGroupBoundaries] =
    useState(false);

  const resultIndexes = resultInputs
    .map(parseRawInteger)
    .filter(index => index !== null);
  const inspectedIndex = parseIndex(inspectIndex);
  const inspectedTile =
    inspectedIndex === null
      ? null
      : getFeebasTileByIndex(inspectedIndex);
  const highlightedIndexes =
    inspectionMode && inspectedIndex !== null
      ? [inspectedIndex]
      : resultIndexes;
  const resultWarnings = useMemo(
    () =>
      resultInputs
        .map((value, index) => {
          const parsed = parseIndex(value);
          const range = DPPT_FEEBAS_GROUP_RANGES[index];
          if (parsed === null) {
            return `Result ${index + 1} must be 0-527.`;
          }
          if (
            parsed < range.min ||
            parsed > range.max
          ) {
            return `Result ${index + 1} is outside expected range ${range.min}-${range.max}.`;
          }
          return null;
        })
        .filter(Boolean),
    [resultInputs]
  );

  function updateResultInput(index, value) {
    setResultInputs(current =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? value : entry
      )
    );
  }

  function loadCase(testCase) {
    setResultInputs(
      testCase.indexes.map(index => String(index))
    );
    setInspectionMode(false);
  }

  function stepInspect(amount) {
    const current = parseIndex(inspectIndex) ?? 0;
    const next = Math.min(
      DPPT_FEEBAS_TILE_COUNT - 1,
      Math.max(0, current + amount)
    );
    setInspectIndex(String(next));
    setInspectionMode(true);
  }

  function stepInspectRow(direction) {
    const current = parseIndex(inspectIndex) ?? 0;
    const nextTile =
      direction < 0
        ? getFirstTileOnPreviousRow(current)
        : getFirstTileOnNextRow(current);
    setInspectIndex(String(nextTile.index));
    setInspectionMode(true);
  }

  return (
    <main className="feebas-map-validator">
      <header className="feebas-validator-top">
        <div>
          <h1>DPPt Feebas Map Validator</h1>
          <p>
            Developer-only validation for confirming that indexes 0-527 map to the intended Mt. Coronet lake squares.
          </p>
        </div>
        <Link to="/dev/feebas-tile-editor">
          Edit coordinate dataset
        </Link>
      </header>

      <div className="feebas-validator-layout">
        <section className="feebas-validator-map-panel">
          <DpptFeebasMap
            highlightedIndexes={highlightedIndexes}
            showAllIndexedTiles={showAllIndexedTiles}
            showAllTileIndexes={showAllTileIndexes}
            showGroupBoundaries={showGroupBoundaries}
          />
          <p className="feebas-validator-note">
            Map image path: {DPPT_FEEBAS_MAP_IMAGE_SRC}
          </p>
        </section>

        <aside className="feebas-validator-controls">
          <section className="feebas-validator-panel">
            <h2>Four Result Inputs</h2>
            <div className="feebas-result-grid">
              {resultInputs.map((value, index) => {
                const range =
                  DPPT_FEEBAS_GROUP_RANGES[index];
                return (
                  <label key={index}>
                    <span>
                      Result {index + 1} index
                    </span>
                    <small>
                      Expected {range.min}-{range.max}
                    </small>
                    <input
                      type="number"
                      min="0"
                      max="527"
                      value={value}
                      onChange={event =>
                        updateResultInput(
                          index,
                          event.target.value
                        )
                      }
                    />
                  </label>
                );
              })}
            </div>
            {resultWarnings.length > 0 && (
              <ul className="feebas-validator-warnings">
                {resultWarnings.map(warning => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="feebas-validator-panel">
            <h2>Single Index Inspection</h2>
            <label className="feebas-inspect-toggle">
              <input
                type="checkbox"
                checked={inspectionMode}
                onChange={event =>
                  setInspectionMode(
                    event.target.checked
                  )
                }
              />
              <span>Inspect single index</span>
            </label>
            <label>
              <span>Inspect index</span>
              <input
                type="number"
                min="0"
                max="527"
                value={inspectIndex}
                onChange={event => {
                  setInspectIndex(event.target.value);
                  setInspectionMode(true);
                }}
              />
            </label>
            <div className="feebas-validator-actions">
              <button
                type="button"
                onClick={() => stepInspect(-1)}
              >
                Previous Index
              </button>
              <button
                type="button"
                onClick={() => stepInspect(1)}
              >
                Next Index
              </button>
              <button
                type="button"
                onClick={() => stepInspectRow(-1)}
              >
                Previous Row
              </button>
              <button
                type="button"
                onClick={() => stepInspectRow(1)}
              >
                Next Row
              </button>
            </div>
            {inspectedTile ? (
              <dl className="feebas-inspection-list">
                <div>
                  <dt>Global index</dt>
                  <dd>{inspectedTile.index}</dd>
                </div>
                <div>
                  <dt>Group</dt>
                  <dd>
                    {getFeebasGroup(inspectedTile.index)}
                  </dd>
                </div>
                <div>
                  <dt>Position within group</dt>
                  <dd>
                    {getFeebasIndexWithinGroup(
                      inspectedTile.index
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Coordinate</dt>
                  <dd>
                    x {inspectedTile.x}, y {inspectedTile.y}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="feebas-validator-warning">
                Inspect index must be 0-527.
              </p>
            )}
          </section>

          <section className="feebas-validator-panel">
            <h2>Display Modes</h2>
            <label className="feebas-inspect-toggle">
              <input
                type="checkbox"
                checked={showAllIndexedTiles}
                onChange={event =>
                  setShowAllIndexedTiles(
                    event.target.checked
                  )
                }
              />
              <span>Show all indexed tiles</span>
            </label>
            <label className="feebas-inspect-toggle">
              <input
                type="checkbox"
                checked={showAllTileIndexes}
                disabled={!showAllIndexedTiles}
                onChange={event =>
                  setShowAllTileIndexes(
                    event.target.checked
                  )
                }
              />
              <span>Show all index labels</span>
            </label>
            <label className="feebas-inspect-toggle">
              <input
                type="checkbox"
                checked={showGroupBoundaries}
                onChange={event =>
                  setShowGroupBoundaries(
                    event.target.checked
                  )
                }
              />
              <span>Show group boundaries</span>
            </label>
          </section>

          <section className="feebas-validator-panel">
            <h2>Dataset Audit</h2>
            <dl className="feebas-inspection-list">
              <div>
                <dt>Coordinate entries</dt>
                <dd>{dpptFeebasAudit.coordinateEntries}</dd>
              </div>
              <div>
                <dt>Unique indexes</dt>
                <dd>{dpptFeebasAudit.uniqueIndexes}</dd>
              </div>
              <div>
                <dt>Unique coordinates</dt>
                <dd>{dpptFeebasAudit.uniqueCoordinates}</dd>
              </div>
              <div>
                <dt>Lowest index</dt>
                <dd>{dpptFeebasAudit.lowestIndex}</dd>
              </div>
              <div>
                <dt>Highest index</dt>
                <dd>{dpptFeebasAudit.highestIndex}</dd>
              </div>
              <div>
                <dt>Missing indexes</dt>
                <dd>
                  {formatList(
                    dpptFeebasAudit.missingIndexes
                  )}
                </dd>
              </div>
              <div>
                <dt>Out-of-bounds coordinates</dt>
                <dd>
                  {dpptFeebasAudit
                    .outOfBoundsCoordinates.length === 0
                    ? "None"
                    : dpptFeebasAudit
                        .outOfBoundsCoordinates.length}
                </dd>
              </div>
              <div>
                <dt>Dataset structurally valid</dt>
                <dd>
                  {dpptFeebasAudit.valid ? "Yes" : "No"}
                </dd>
              </div>
            </dl>
            <p className="feebas-validator-note">
              Structural validation does not prove that the physical tile ordering matches the game. Compare known calculator results or save-file results before public release.
            </p>
          </section>

          <section className="feebas-validator-panel">
            <h2>Validation Test Cases</h2>
            <div className="feebas-test-case-list">
              {indexValidationCases.length === 0 && (
                <p className="feebas-validator-note">
                  No raw-index validation cases are configured.
                </p>
              )}
              {indexValidationCases.map(testCase => (
                <article key={testCase.name}>
                  <strong>{testCase.name}</strong>
                  <code>
                    {testCase.indexes.join(", ")}
                  </code>
                  {testCase.notes && (
                    <p>{testCase.notes}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => loadCase(testCase)}
                  >
                    Load Test Case
                  </button>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

export default FeebasMapValidatorPage;
