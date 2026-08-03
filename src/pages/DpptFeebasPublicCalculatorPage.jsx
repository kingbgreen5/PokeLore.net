import {
  useMemo,
  useRef,
  useState
} from "react";
import { Link } from "react-router-dom";
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
const MAP_MODES = {
  HINT: "hint",
  EXACT: "exact"
};
const MAP_MODE_AREA_SIZES = {
  [MAP_MODES.HINT]: 16
};

function getFieldError(value) {
  if (value === "") return null;

  return validateLotteryNumber(value).error;
}

function getAreaHighlights(candidate, areaSize) {
  return candidate.indexes.map((index, resultIndex) => ({
    areaNumber: resultIndex + 1,
    indexes: getFeebasOffsetSearchArea(index, {
      size: areaSize,
      seed: [
        candidate.yesterdaySeedUnsigned,
        candidate.groupSeedUnsigned,
        areaSize,
        resultIndex,
        index
      ].join(":")
    }).indexes
  }));
}

function BackgroundImageSwitch({
  checked,
  onChange
}) {
  return (
    <label className="dppt-feebas-map-switch">
      <span>Show background image</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={event => onChange(event.target.checked)}
      />
      <span aria-hidden="true" className="dppt-feebas-switch-track">
        <span className="dppt-feebas-switch-thumb" />
      </span>
    </label>
  );
}

function DpptFeebasPublicCalculatorPage() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [inputMethod, setInputMethod] = useState(
    INPUT_METHODS.LOTTERY
  );
  const [mode, setMode] = useState(MAP_MODES.HINT);
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
        message: `${parsed.gameLabel} Version detected.`
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
        title="Feebas Tile Calculator for Diamond, Pearl, and Platinum - | PokeLore"
        description="Upload your save file or enter two consecutive lottery numbers to instantly locate today's Feebas fishing spots in Mt. Coronet."
        canonical="https://pokelore.net/dppt-feebas-calculator"
      />

      <header className="dppt-feebas-public-header">
        <Link
          className="dppt-feebas-back-link"
          to="/topic/catching-feebas-in-pokemon-diamond-pearl-and-platinum"
        >
          <span aria-hidden="true">←</span>
          Back to Catching Feebas in Pokemon Diamond, Pearl, and Platinum
        </Link>
        <p>DPPt Feebas Calculator</p>
        <h1>
          Pokemon Diamond, Pearl, and Platinum Feebas Calculator
        </h1>
      </header>

      <section className="dppt-feebas-public-tool">
        <div className="dppt-feebas-public-controls">
          <section>
            <strong> <h2>Map Mode</h2> </strong>
            <div
              className="dppt-feebas-segmented"
              role="group"
              aria-label="Map mode"
            >
              <button
                type="button"
                aria-pressed={mode === MAP_MODES.HINT}
                onClick={() => setMode(MAP_MODES.HINT)}
              >
                Hint
              </button>
              <button
                type="button"
                aria-pressed={mode === MAP_MODES.EXACT}
                onClick={() => setMode(MAP_MODES.EXACT)}
              >
                Exact
              </button>
            </div>
            <p className="dppt-feebas-mode-help">
              {mode === MAP_MODES.EXACT
                ? "Show the exact tile"
                : "Show a 16 tile approximate location"}
            </p>
          </section>

          <section className="input-method-section">
            <h2>Input Method</h2>
            <div
              className="dppt-feebas-tabs"
              role="tablist"
              aria-label="Input method"
            >
              <button
                id="dppt-feebas-save-tab"
                type="button"
                role="tab"
                aria-selected={
                  inputMethod === INPUT_METHODS.SAVE_FILE
                }
                aria-controls="dppt-feebas-save-panel"
                onClick={() =>
                  setInputMethod(INPUT_METHODS.SAVE_FILE)
                }
              >
                Upload Save File
              </button>
              <button
                id="dppt-feebas-lottery-tab"
                type="button"
                role="tab"
                aria-selected={
                  inputMethod === INPUT_METHODS.LOTTERY
                }
                aria-controls="dppt-feebas-lottery-panel"
                onClick={() =>
                  setInputMethod(INPUT_METHODS.LOTTERY)
                }
              >
                Lottery Numbers
              </button>
            </div>

            {inputMethod === INPUT_METHODS.SAVE_FILE && (
              <div className="dppt-feebas-save-panel">
                <div
                  id="dppt-feebas-save-panel"
                  role="tabpanel"
                  aria-labelledby="dppt-feebas-save-tab"
                >
                  <label>
                    <span>Diamond, Pearl, or Platinum .sav</span>
                    <input
                      ref={saveFileInputRef}
                      type="file"
                      accept=".sav"
                      onChange={handleSaveFileChange}
                    />
                  </label>
                </div>
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
            )}

            {inputMethod === INPUT_METHODS.LOTTERY && (
              <div
                id="dppt-feebas-lottery-panel"
                className="dppt-feebas-input-panel"
                role="tabpanel"
                aria-labelledby="dppt-feebas-lottery-tab"
              >
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
                    Calculate
                  </button>
                  <button type="button" onClick={reset}>
                    Reset
                  </button>
                </div>
              </div>
            )}
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
              <BackgroundImageSwitch
                checked={showMapImage}
                onChange={setShowMapImage}
              />
            </section>
          )}

          {result?.candidates.map(candidate => {
            const areaSize = MAP_MODE_AREA_SIZES[mode];
            const highlightedAreas =
              areaSize
                ? getAreaHighlights(candidate, areaSize)
                : [];

            return (
              <section
                key={candidate.groupSeedUnsigned}
                className="dppt-feebas-public-result"
              >
                <DpptFeebasMap
                  blockedTileOpacity={blockedTileOpacity}
                  highlightedIndexes={
                    mode === MAP_MODES.EXACT
                      ? candidate.indexes
                      : []
                  }
                  highlightedAreas={highlightedAreas}
                  showMapImage={showMapImage}
                  showGroupBoundaries={false}
                />
                <BackgroundImageSwitch
                  checked={showMapImage}
                  onChange={setShowMapImage}
                />
              </section>
            );
          })}
        </div>
      </section>

      <aside className="dppt-feebas-oaks-note">
        <h2>Beauty and the &apos;Bas</h2>
        <p>
          Once you have caught Feebas, please see our guide{" "}
          <Link to="/topic/evolving-feebas-into-milotic-via-beauty">
            Evolving Feebas to Milotic Via Beauty
          </Link>
          .
        </p>
      </aside>

      <article className="dppt-feebas-public-guide">
        <p>
          Find your active Feebas fishing tiles in Pokemon Diamond,
          Pearl, or Platinum. Upload your save file, or enter two
          consecutive Jubilife TV lottery numbers if you are playing
          on original hardware.
        </p>
        <p>
          The calculator highlights the fishing tiles where Feebas
          can appear until the end of day in the Mt. Coronet B1F.
        </p>

        <h2>How to Find Feebas in Pokemon Platinum, Diamond, and Pearl</h2>
        <p>To find your active tiles, choose one of the two methods.</p>

        <h3>Option 1: Upload Your Save File</h3>
        <p>
          This is the fastest and easiest method if you are playing
          on emulation.
        </p>
        <ol>
          <li>
            Create a backup of your Pokemon Diamond, Pearl, or
            Platinum save.
          </li>
          <li>Select the `.sav` file using the upload button.</li>
        </ol>
        <p>
          Your save file is processed locally in your browser. It is
          never uploaded, stored, or sent to PokeLore.
        </p>
        <p>This method is useful for players using:</p>
        <ul>
          <li>melonDS or another Nintendo DS emulator</li>
          <li>a flashcart</li>
          <li>a hacked Nintendo 3DS</li>
          <li>a cartridge save backed up with homebrew tools</li>
        </ul>
        <p>
          Only the information needed to calculate the Feebas tiles
          is read from the file.
        </p>

        <h3>Option 2: Enter Two Lottery Numbers</h3>
        <p>
          Players using original Nintendo hardware or an unmodified
          cartridge can use two consecutive Jubilife TV lottery
          numbers instead.
        </p>
        <ol>
          <li>
            Visit the Pokemon Lottery Corner inside Jubilife TV.
          </li>
          <li>Record the lottery number shown for one day.</li>
          <li>
            Return on the following day and record the new number.
          </li>
          <li>Enter the older number under <strong>Yesterday</strong>.</li>
          <li>Enter the newer number under <strong>Today</strong>.</li>
          <li>Select <strong>Calculate</strong>.</li>
        </ol>
        <p>
          The two numbers must come from consecutive in-game days.
          Changing the Nintendo DS clock manually may delay or
          disable daily events, so naturally collected lottery
          numbers are recommended.
        </p>

        <h2>Understanding Map Modes</h2>
        <p>Use the map controls to switch between two display modes.</p>

        <h3>Exact</h3>
        <p>
          Exact mode highlights the specific fishing squares
          where Feebas can appear.
        </p>
        <p>
          The highlighted tile is the tile you fish into, not the
          tile you stand on.
        </p>
        <p>
          Feebas is a 50% fishing encounter, so it is not guaranteed
          even if you are fishing in the right tile.
        </p>

        <h3>Hint</h3>
        <p>
          Hint mode highlights a 16-tile search zone around each
          Feebas tile. This way you still have to put in some effort,
          but do not have to search the entire map.
        </p>

        <h2>Important Feebas Fishing Tips</h2>
        <p>
          A highlighted tile means that Feebas can appear there, not
          that every encounter will be Feebas.
        </p>
        <p>
          It is a 50% encounter rate, so you may need to fish the
          correct tile several times before you encounter Feebas.
          Make sure you are fishing INTO the highlighted tile, not
          surfing on it.
        </p>
        <p>
          The active tiles change daily, so make sure you are using
          information from that day.
        </p>

        <h2>Supported Games</h2>
        <p>This calculator is designed for:</p>
        <ul>
          <li>Pokemon Diamond</li>
          <li>Pokemon Pearl</li>
          <li>Pokemon Platinum</li>
        </ul>

        <h2>Frequently Asked Questions</h2>
        <h3>Can I find Feebas without lottery numbers?</h3>
        <p>
          Yes. Uploading a compatible Diamond, Pearl, or Platinum
          save file allows the calculator to provide the tiles
          without needing lottery numbers.
        </p>

        <h3>Is my Pokemon save uploaded to PokeLore?</h3>
        <p>
          No. The file is read locally by your web browser and is not
          sent to a server or stored by PokeLore.
        </p>

        <h3>Why is Feebas not appearing on a highlighted tile?</h3>
        <p>
          Feebas is only one of the possible encounters on an active
          tile. It is a 50% encounter rate, so you may need to fish
          the correct tile several times before you encounter Feebas.
        </p>

        <h3>Do the Feebas tiles change every day?</h3>
        <p>
          They can change when the game processes a new daily
          rollover. Save files and lottery numbers should therefore
          reflect the day on which you plan to search.
        </p>
      </article>
    </main>
  );
}

export default DpptFeebasPublicCalculatorPage;
