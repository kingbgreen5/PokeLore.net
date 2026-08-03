import {
  useMemo,
  useRef,
  useState
} from "react";
import DpptFeebasMap from "../components/feebas/DpptFeebasMap";
import Seo from "../seo/Seo";
import {
  calculateDpptFeebasResults,
  calculateDpptFeebasResultsFromSeed,
  validateLotteryNumber
} from "../utils/dpptFeebasCalculator";
import { parseDpptSaveFile } from "../utils/dpptSaveParser";
import {
  dpptFeebasAudit,
  getFeebasOffsetSearchArea
} from "../utils/dpptFeebasTiles";
import "./DpptFeebasPublicCalculatorPage.css";

const DEFAULT_FORM = {
  yesterdayLottery: "",
  todayLottery: ""
};
const INPUT_METHODS = {
  SAVE_FILE: "save-file",
  LOTTERY: "lottery"
};
const PUBLIC_AREA_SIZE = 12;

function getFieldError(value) {
  if (value === "") return null;

  return validateLotteryNumber(value).error;
}

function getAreaHighlights(candidate) {
  return candidate.indexes.map((index, resultIndex) => ({
    areaNumber: resultIndex + 1,
    indexes: getFeebasOffsetSearchArea(index, {
      size: PUBLIC_AREA_SIZE,
      seed: [
        candidate.yesterdaySeedUnsigned,
        candidate.groupSeedUnsigned,
        PUBLIC_AREA_SIZE,
        resultIndex,
        index
      ].join(":")
    }).indexes
  }));
}

function DpptFeebasPublicCalculatorPage() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [inputMethod, setInputMethod] = useState(
    INPUT_METHODS.LOTTERY
  );
  const [mode, setMode] = useState("area");
  const [showMapImage, setShowMapImage] = useState(true);
  const [result, setResult] = useState(null);
  const [saveFileStatus, setSaveFileStatus] = useState({
    type: "idle",
    message: ""
  });
  const saveFileInputRef = useRef(null);
  const fieldErrors = useMemo(
    () => ({
      yesterdayLottery: getFieldError(form.yesterdayLottery),
      todayLottery: getFieldError(form.todayLottery)
    }),
    [form]
  );
  const canCalculate =
    dpptFeebasAudit.valid &&
    !fieldErrors.yesterdayLottery &&
    !fieldErrors.todayLottery &&
    form.yesterdayLottery.length === 5 &&
    form.todayLottery.length === 5;
  const blockedTileOpacity = showMapImage ? 0 : 1;

  function updateField(field, value) {
    setForm(current => ({
      ...current,
      [field]: value.slice(0, 5)
    }));
  }

  function calculate() {
    setResult(
      calculateDpptFeebasResults(
        form.yesterdayLottery,
        form.todayLottery
      )
    );
  }

  function reset() {
    setForm(DEFAULT_FORM);
    setResult(null);
  }

  function clearSaveFileResult() {
    if (saveFileInputRef.current) {
      saveFileInputRef.current.value = "";
    }

    setSaveFileStatus({
      type: "idle",
      message: ""
    });
    setResult(null);
  }

  async function handleSaveFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setSaveFileStatus({
        type: "error",
        message: "Choose a .sav file first."
      });
      setResult(null);
      return;
    }

    setSaveFileStatus({
      type: "pending",
      message: "Reading save file locally..."
    });
    setResult(null);

    try {
      const parsed = await parseDpptSaveFile(file);

      if (!parsed.valid) {
        setSaveFileStatus({
          type: "error",
          message: parsed.message
        });
        return;
      }

      setResult(
        calculateDpptFeebasResultsFromSeed(
          parsed.feebasSeed
        )
      );
      setSaveFileStatus({
        type: "success",
        message: `${parsed.gameLabel} save parsed locally. Feebas tiles are shown on the map.`
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      setSaveFileStatus({
        type: "error",
        message: "The save file could not be read."
      });
    }
  }

  return (
    <main className="dppt-feebas-public-page">
      <Seo
        title="DPPt Feebas Calculator | PokeLore"
        description="Find Feebas tiles in Pokemon Diamond, Pearl, and Platinum using two consecutive Lottery Corner numbers."
        canonical="https://pokelore.net/dppt-feebas-calculator"
      />

      <header className="dppt-feebas-public-header">
        <p>DPPt Feebas Calculator</p>
        <h1>Find Feebas In Mt. Coronet</h1>
      </header>

      <section className="dppt-feebas-public-tool">
        <div className="dppt-feebas-public-controls">
          <section>
            <h2>Input Method</h2>
            <div
              className="dppt-feebas-segmented"
              role="group"
              aria-label="Input method"
            >
              <button
                type="button"
                aria-pressed={
                  inputMethod === INPUT_METHODS.SAVE_FILE
                }
                onClick={() =>
                  setInputMethod(INPUT_METHODS.SAVE_FILE)
                }
              >
                Upload Save File
              </button>
              <button
                type="button"
                aria-pressed={
                  inputMethod === INPUT_METHODS.LOTTERY
                }
                onClick={() =>
                  setInputMethod(INPUT_METHODS.LOTTERY)
                }
              >
                Enter Lottery Numbers
              </button>
            </div>
          </section>

          {inputMethod === INPUT_METHODS.SAVE_FILE && (
            <section>
              <h2>Upload Save File</h2>
              <div className="dppt-feebas-save-panel">
                <label>
                  <span>Diamond, Pearl, or Platinum .sav</span>
                  <input
                    ref={saveFileInputRef}
                    type="file"
                    accept=".sav"
                    onChange={handleSaveFileChange}
                  />
                </label>
                <p>
                  Your save file is processed locally in your
                  browser. It is never uploaded or stored.
                </p>
                {saveFileStatus.message && (
                  <p
                    className={`dppt-feebas-save-status ${saveFileStatus.type}`}
                    role={
                      saveFileStatus.type === "error"
                        ? "alert"
                        : "status"
                    }
                  >
                    {saveFileStatus.message}
                  </p>
                )}
                <button
                  type="button"
                  onClick={clearSaveFileResult}
                >
                  Remove Save File
                </button>
              </div>
            </section>
          )}

          {inputMethod === INPUT_METHODS.LOTTERY && (
            <section>
              <h2>Lottery Numbers</h2>
              <div className="dppt-feebas-public-inputs">
                <label>
                  <span>Yesterday</span>
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
                    <small>{fieldErrors.yesterdayLottery}</small>
                  )}
                </label>

                <label>
                  <span>Today</span>
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
                    <small>{fieldErrors.todayLottery}</small>
                  )}
                </label>
              </div>

              <div className="dppt-feebas-public-actions">
                <button
                  type="button"
                  disabled={!canCalculate}
                  onClick={calculate}
                >
                  Show Feebas Map
                </button>
                <button type="button" onClick={reset}>
                  Reset
                </button>
              </div>
            </section>
          )}

          <section>
            <h2>Map Mode</h2>
            <div
              className="dppt-feebas-segmented"
              role="group"
              aria-label="Map mode"
            >
              <button
                type="button"
                aria-pressed={mode === "area"}
                onClick={() => setMode("area")}
              >
                Area
              </button>
              <button
                type="button"
                aria-pressed={mode === "exact"}
                onClick={() => setMode("exact")}
              >
                Exact Tile
              </button>
            </div>

          </section>

          <section>
            <h2>Map Display</h2>
            <label className="dppt-feebas-toggle">
              <input
                type="checkbox"
                checked={showMapImage}
                onChange={event =>
                  setShowMapImage(event.target.checked)
                }
              />
              <span>Show background image</span>
            </label>
          </section>
        </div>

        <div className="dppt-feebas-public-map-stack">
          {result?.errors.length > 0 && (
            <section
              className="dppt-feebas-public-message"
              role="alert"
            >
              {result.errors.map(error => (
                <p key={error}>{error}</p>
              ))}
            </section>
          )}

          {!result && (
            <section className="dppt-feebas-public-result">
              <DpptFeebasMap
                blockedTileOpacity={blockedTileOpacity}
                showMapImage={showMapImage}
                showGroupBoundaries={false}
              />
            </section>
          )}

          {result?.candidates.map(candidate => {
            const highlightedAreas =
              mode === "area"
                ? getAreaHighlights(candidate)
                : [];

            return (
              <section
                key={candidate.groupSeedUnsigned}
                className="dppt-feebas-public-result"
              >
                <DpptFeebasMap
                  blockedTileOpacity={blockedTileOpacity}
                  highlightedIndexes={
                    mode === "exact"
                      ? candidate.indexes
                      : []
                  }
                  highlightedAreas={highlightedAreas}
                  showMapImage={showMapImage}
                  showGroupBoundaries={false}
                />
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default DpptFeebasPublicCalculatorPage;
