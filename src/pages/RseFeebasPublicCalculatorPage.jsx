import {
  useMemo,
  useRef,
  useState
} from "react";
import { Link } from "react-router-dom";
import FeebasGuideBreadcrumbs from "../components/feebas/FeebasGuideBreadcrumbs";
import RseRoute119FeebasMap from "../components/feebas/RseRoute119FeebasMap";
import {
  EMERALD_EASY_CHAT_CONDITIONS,
  EMERALD_EASY_CHAT_SECOND_GROUPS
} from "../data/feebas/emeraldEasyChatWords";
import Seo from "../seo/Seo";
import {
  findEmeraldFeebasValueCandidates,
  getDewfordPhraseSignature,
  normalizeTrainerId
} from "../utils/emeraldFeebasRecovery";
import {
  parseEmeraldSave,
  parseRubySapphireSave
} from "../utils/emeraldSaveParser";
import {
  buildPossibleTileSetResult,
  buildPublicPriorityResult,
  buildPublicTileSet
} from "../utils/rseFeebasPublicCalculator";
import {
  findRsDeadBatteryCandidates,
  findRsWorkingBatteryCandidates
} from "../utils/rsFeebasRecovery";
import "./RseFeebasPublicCalculatorPage.css";

const METHODS = {
  SAVE: "save",
  INFO: "info"
};

const BATTERY_MODES = {
  WORKING: "working",
  DEAD: "dead",
  UNSURE: "unsure"
};

const PRIORITY_DISPLAY_MODES = {
  TIERED: "tiered",
  HEATMAP: "heatmap"
};

const DESKTOP_MAP_ZOOM = 0.56;
const MOBILE_MAP_ZOOM = 0.2375;

const GAME_OPTIONS = [
  {
    id: "ruby-sapphire",
    label: "Ruby/Sapphire",
    fullLabel: "Pokemon Ruby or Sapphire"
  },
  {
    id: "emerald",
    label: "Emerald",
    fullLabel: "Pokemon Emerald"
  }
];

const PRIORITY_FILTERS = [
  ["all", "All possible tiles"],
  ["top10", "Top 10"],
  ["top25", "Top 25"],
  ["top50", "Top 50"],
  ["high", "High priority only"]
];

function getGameOption(game) {
  return GAME_OPTIONS.find(option => option.id === game);
}

function sortEasyChatWordsByText(words) {
  return [...words].sort((left, right) => {
    const textComparison = left.text.localeCompare(
      right.text
    );

    if (textComparison !== 0) return textComparison;

    const groupComparison = String(
      left.groupLabel ?? left.group ?? ""
    ).localeCompare(
      String(right.groupLabel ?? right.group ?? "")
    );

    if (groupComparison !== 0) return groupComparison;

    return left.index - right.index;
  });
}

function getSecondWordOptions() {
  return sortEasyChatWordsByText(
    Object.entries(EMERALD_EASY_CHAT_SECOND_GROUPS)
      .flatMap(([group, words]) =>
      words.map(word => ({
        ...word,
        value: `${word.text} (${group})`,
        group,
        groupLabel:
          group === "lifestyle" ? "Lifestyle" : "Hobbies"
      }))
      )
  );
}

function findConditionWord(input) {
  const text = String(input ?? "").trim().toUpperCase();

  return EMERALD_EASY_CHAT_CONDITIONS.find(
    word => word.text === text
  );
}

function findSecondWord(input, options) {
  const text = String(input ?? "").trim().toUpperCase();

  return options.find(
    word =>
      word.value.toUpperCase() === text ||
      `${word.groupLabel}: ${word.text}`.toUpperCase() ===
        text ||
      word.text === text
  );
}

function formatTileLabel(tile) {
  return `Map marker #${tile.rank}`;
}

function getDefaultMapZoom() {
  if (
    typeof window !== "undefined" &&
    window.innerWidth < 640
  ) {
    return MOBILE_MAP_ZOOM;
  }

  return DESKTOP_MAP_ZOOM;
}

function MapControls({
  zoom,
  defaultZoom = DESKTOP_MAP_ZOOM,
  onZoomChange
}) {
  return (
    <div
      className="rse-feebas-map-controls"
      aria-label="Map controls"
    >
      <button
        type="button"
        onClick={() =>
          onZoomChange(Math.max(0.2, zoom - 0.05))
        }
      >
        Zoom Out
      </button>
      <button
        type="button"
        onClick={() =>
          onZoomChange(Math.min(3, zoom + 0.05))
        }
      >
        Zoom In
      </button>
      <button
        type="button"
        onClick={() => onZoomChange(defaultZoom)}
      >
        Reset View
      </button>
      <span>{Math.round(zoom * 100)}%</span>
    </div>
  );
}

function WordInputs({
  trainerId,
  firstWord,
  secondWord,
  secondWordOptions,
  onTrainerIdChange,
  onFirstWordChange,
  onSecondWordChange
}) {
  const conditionOptions = useMemo(
    () =>
      sortEasyChatWordsByText(
        EMERALD_EASY_CHAT_CONDITIONS
      ),
    []
  );

  return (
    <div className="rse-feebas-public-inputs">
      <label>
        <span>Trainer ID</span>
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          value={trainerId}
          placeholder="22279"
          onChange={event =>
            onTrainerIdChange(event.target.value)
          }
        />
        <small>
          The five-digit ID shown on your Trainer Card.
        </small>
      </label>

      <label>
        <span>Current Dewford Trend: first word</span>
        <input
          type="text"
          list="rse-feebas-conditions"
          value={firstWord}
          placeholder="TIRED"
          onChange={event =>
            onFirstWordChange(event.target.value)
          }
        />
        <datalist id="rse-feebas-conditions">
          {conditionOptions.map(word => (
            <option
              key={word.index}
              value={word.text}
            />
          ))}
        </datalist>
      </label>

      <label>
        <span>Current Dewford Trend: second word</span>
        <input
          type="text"
          list="rse-feebas-second-words"
          value={secondWord}
          placeholder="DIET (hobbies)"
          onChange={event =>
            onSecondWordChange(event.target.value)
          }
        />
        <datalist id="rse-feebas-second-words">
          {secondWordOptions.map(word => (
            <option
              key={`${word.group}:${word.index}`}
              value={word.value}
            >
              {word.groupLabel}
            </option>
          ))}
        </datalist>
      </label>
    </div>
  );
}

function AdvancedDetails({
  result
}) {
  if (!result) return null;

  return (
    <details className="rse-feebas-advanced">
      <summary>Advanced Details</summary>
      {result.type === "exact" && (
        <dl>
          <div>
            <dt>Exact Feebas value</dt>
            <dd>{result.tileSet.value}</dd>
          </div>
          <div>
            <dt>Generated internal spot IDs</dt>
            <dd>
              {result.tileSet.result.generatedSpotIds.join(
                ", "
              )}
            </dd>
          </div>
          <div>
            <dt>Unique reachable locations shown</dt>
            <dd>{result.tileSet.reachableTiles.length}</dd>
          </div>
          {result.parseResult && (
            <>
              <div>
                <dt>Save format</dt>
                <dd>{result.parseResult.formatLabel}</dd>
              </div>
              <div>
                <dt>Selected save slot</dt>
                <dd>
                  {result.parseResult.selectedSlot?.label ??
                    "unknown"}
                </dd>
              </div>
              <div>
                <dt>Trainer ID</dt>
                <dd>
                  {String(
                    result.parseResult.trainerId ?? ""
                  ).padStart(5, "0")}
                </dd>
              </div>
            </>
          )}
        </dl>
      )}

      {result.type === "sets" && (
        <dl>
          <div>
            <dt>Possible Feebas values</dt>
            <dd>{result.sets.values.join(", ")}</dd>
          </div>
          <div>
            <dt>Mode</dt>
            <dd>{result.modeLabel}</dd>
          </div>
          <div>
            <dt>Possible tile sets</dt>
            <dd>{result.sets.tileSets.length}</dd>
          </div>
        </dl>
      )}

      {result.type === "priority" && (
        <dl>
          <div>
            <dt>Possible Feebas values</dt>
            <dd>
              {result.priority.summary.candidateValues.join(
                ", "
              )}
            </dd>
          </div>
          <div>
            <dt>Candidate states</dt>
            <dd>{result.calculation.candidates.length}</dd>
          </div>
          <div>
            <dt>Unique possible Feebas values</dt>
            <dd>
              {
                result.priority.summary
                  .totalCandidateValues
              }
            </dd>
          </div>
        </dl>
      )}
    </details>
  );
}

function ExactResult({
  result,
  zoom,
  onZoomChange
}) {
  const shownCount =
    result.tileSet.reachableTiles.length;
  const generatedCount =
    result.tileSet.result.generatedSpotIds.length;

  return (
    <section className="rse-feebas-result-card">
      <div className="rse-feebas-section-heading">
        <div>
          <h2>Your Feebas Tiles</h2>
          <p>
            We found the exact Feebas value stored in your
            save. Fish on any highlighted reachable tile
            below.
          </p>
        </div>
        <strong>
          {shownCount} reachable Feebas tile
          {shownCount === 1 ? "" : "s"} found
        </strong>
      </div>
      <MapControls
        zoom={zoom}
        defaultZoom={getDefaultMapZoom()}
        onZoomChange={onZoomChange}
      />
      <RseRoute119FeebasMap
        spotIds={result.tileSet.result.generatedSpotIds}
        showGrid
        showMapImage
        zoom={zoom}
      />
      {shownCount !== generatedCount && (
        <p className="rse-feebas-note">
          {generatedCount} locations were generated
          internally; {shownCount} reachable physical
          locations are shown.
        </p>
      )}
      <AdvancedDetails result={result} />
    </section>
  );
}

function PossibleSetsResult({
  result,
  zoom,
  selectedTileKey,
  onZoomChange,
  onRecommendedTileClick
}) {
  return (
    <section className="rse-feebas-result-card">
      <div className="rse-feebas-section-heading">
        <div>
          <h2>Where to Check First</h2>
          <p>
            Fish each recommended marker once or twice,
            then move to the next one. Stop as soon as
            Feebas appears.
          </p>
        </div>
        <strong>
          {result.sets.tileSets.length} possible tile set
          {result.sets.tileSets.length === 1 ? "" : "s"}
        </strong>
      </div>

      <p className="rse-feebas-note">
        Feebas does not appear on every fishing encounter
        even on the correct tile. No Feebas yet after one
        pass? Make another pass through the same
        recommended tiles.
      </p>

      <MapControls
        zoom={zoom}
        defaultZoom={getDefaultMapZoom()}
        onZoomChange={onZoomChange}
      />
      <RseRoute119FeebasMap
        recommendedTiles={result.sets.recommendedTiles}
        selectedRecommendedTileKey={selectedTileKey}
        onRecommendedTileClick={onRecommendedTileClick}
        showGrid
        showMapImage
        zoom={zoom}
      />

      <div className="rse-feebas-recommendations">
        <h3>Recommended Search Order</h3>
        {result.sets.recommendedTiles.map(tile => (
          <button
            key={`${tile.x}:${tile.y}`}
            type="button"
            className={
              selectedTileKey === `${tile.x}:${tile.y}`
                ? "selected"
                : ""
            }
            onClick={() => onRecommendedTileClick(tile)}
          >
            <strong>{formatTileLabel(tile)}</strong>
            <span>
              Covers possible set
              {tile.setNumbers.length === 1 ? "" : "s"}{" "}
              {tile.setNumbers.join(", ")}
            </span>
            <small>
              Appears in {tile.overlapCount} possible
              pattern
              {tile.overlapCount === 1 ? "" : "s"}
            </small>
          </button>
        ))}
      </div>

      <div className="rse-feebas-set-grid">
        {result.sets.tileSets.map(tileSet => (
          <article
            key={tileSet.value}
            className="rse-feebas-set-card"
          >
            <h3>
              Possible Tile Set {tileSet.setNumber}
            </h3>
            <p>
              {tileSet.reachableTiles.length} reachable
              tile
              {tileSet.reachableTiles.length === 1
                ? ""
                : "s"}
              .
            </p>
          </article>
        ))}
      </div>

      <AdvancedDetails result={result} />
    </section>
  );
}

function PriorityResult({
  result,
  priorityMode,
  priorityFilter,
  zoom,
  selectedTileKey,
  onPriorityModeChange,
  onPriorityFilterChange,
  onZoomChange,
  onRecommendedTileClick
}) {
  const publicPriority = buildPublicPriorityResult(
    result.priority.summary.candidateValues,
    priorityFilter
  );
  const { summary } = publicPriority;

  return (
    <section className="rse-feebas-result-card">
      <div className="rse-feebas-section-heading">
        <div>
          <h2>Priority Map</h2>
          <p>
            Your save has many possible Feebas patterns.
            Start with the highest-priority tiles.
          </p>
        </div>
        <strong>
          {summary.totalCandidateValues} possible Feebas
          patterns
        </strong>
      </div>

      <p className="rse-feebas-note">
        Higher-priority tiles appear in more of the
        possible Feebas patterns that match your
        information. This is a search-priority map, not a
        true probability model.
      </p>

      <div className="rse-feebas-priority-stats">
        <span>
          Possible highlighted tiles:{" "}
          {summary.totalUniqueTiles}
        </span>
        <span>
          Highest overlap: {summary.maxOverlapCount}{" "}
          patterns
        </span>
        <span>
          High priority: {summary.tierCounts.high}
        </span>
      </div>

      <div className="rse-feebas-priority-controls">
        <div
          className="rse-feebas-segmented"
          role="group"
          aria-label="Priority display mode"
        >
          <button
            type="button"
            aria-pressed={
              priorityMode ===
              PRIORITY_DISPLAY_MODES.TIERED
            }
            onClick={() =>
              onPriorityModeChange(
                PRIORITY_DISPLAY_MODES.TIERED
              )
            }
          >
            Priority Tiers
          </button>
          <button
            type="button"
            aria-pressed={
              priorityMode ===
              PRIORITY_DISPLAY_MODES.HEATMAP
            }
            onClick={() =>
              onPriorityModeChange(
                PRIORITY_DISPLAY_MODES.HEATMAP
              )
            }
          >
            Heatmap
          </button>
        </div>

        <label>
          <span>Show</span>
          <select
            value={priorityFilter}
            onChange={event =>
              onPriorityFilterChange(event.target.value)
            }
          >
            {PRIORITY_FILTERS.map(([value, label]) => (
              <option
                key={value}
                value={value}
              >
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rse-feebas-priority-legend">
        {priorityMode === PRIORITY_DISPLAY_MODES.TIERED ? (
          <>
            <span className="high">High Priority</span>
            <span className="medium">Medium Priority</span>
            <span className="low">Low Priority</span>
          </>
        ) : (
          <span className="heat">
            Lower overlap to higher overlap
          </span>
        )}
      </div>

      <MapControls
        zoom={zoom}
        defaultZoom={getDefaultMapZoom()}
        onZoomChange={onZoomChange}
      />
      <RseRoute119FeebasMap
        priorityTiles={publicPriority.visibleTiles}
        priorityDisplayMode={priorityMode}
        recommendedTiles={publicPriority.recommendedTiles}
        selectedRecommendedTileKey={selectedTileKey}
        onRecommendedTileClick={onRecommendedTileClick}
        showGrid
        showMapImage
        zoom={zoom}
      />

      <div className="rse-feebas-recommendations">
        <h3>Best Tiles to Check First</h3>
        {publicPriority.recommendedTiles.map(tile => (
          <button
            key={`${tile.x}:${tile.y}`}
            type="button"
            className={
              selectedTileKey === `${tile.x}:${tile.y}`
                ? "selected"
                : ""
            }
            onClick={() => onRecommendedTileClick(tile)}
          >
            <strong>{formatTileLabel(tile)}</strong>
            <span>
              Appears in {tile.count} possible Feebas
              pattern
              {tile.count === 1 ? "" : "s"}
            </span>
          </button>
        ))}
      </div>

      <p className="rse-feebas-save-nudge">
        Want exact results? Upload your .sav file.
      </p>
      <AdvancedDetails result={result} />
    </section>
  );
}

function RseFeebasPublicCalculatorPage() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [method, setMethod] = useState(METHODS.SAVE);
  const [batteryMode, setBatteryMode] =
    useState(BATTERY_MODES.WORKING);
  const [trainerId, setTrainerId] = useState("");
  const [firstWord, setFirstWord] = useState("");
  const [secondWord, setSecondWord] = useState("");
  const [status, setStatus] = useState({
    type: "idle",
    message: ""
  });
  const [result, setResult] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [zoom, setZoom] = useState(() => getDefaultMapZoom());
  const [priorityMode, setPriorityMode] = useState(
    PRIORITY_DISPLAY_MODES.TIERED
  );
  const [priorityFilter, setPriorityFilter] =
    useState("all");
  const [
    selectedRecommendedTileKey,
    setSelectedRecommendedTileKey
  ] = useState("");
  const saveInputRef = useRef(null);
  const workerRef = useRef(null);
  const secondWordOptions = useMemo(
    () => getSecondWordOptions(),
    []
  );
  const gameOption = getGameOption(selectedGame);

  function resetPublicState() {
    workerRef.current?.terminate();
    workerRef.current = null;
    if (saveInputRef.current) {
      saveInputRef.current.value = "";
    }
    setSelectedGame(null);
    setMethod(METHODS.SAVE);
    setBatteryMode(BATTERY_MODES.WORKING);
    setTrainerId("");
    setFirstWord("");
    setSecondWord("");
    setStatus({
      type: "idle",
      message: ""
    });
    setResult(null);
    setCalculating(false);
    setZoom(getDefaultMapZoom());
    setPriorityMode(PRIORITY_DISPLAY_MODES.TIERED);
    setPriorityFilter("all");
    setSelectedRecommendedTileKey("");
  }

  function setSelectedTile(tile) {
    setSelectedRecommendedTileKey(`${tile.x}:${tile.y}`);
  }

  function getPhraseSignatureOrError() {
    const normalized = normalizeTrainerId(trainerId);
    if (!normalized.valid) {
      return {
        error:
          "That Trainer ID isn't valid. Enter the five-digit ID shown on your Trainer Card."
      };
    }

    const condition = findConditionWord(firstWord);
    const second = findSecondWord(
      secondWord,
      secondWordOptions
    );

    if (!condition || !second) {
      return {
        error:
          "Choose both words from the current Dewford trendy phrase."
      };
    }

    return {
      trainerId: normalized.trainerId,
      phraseSignature: getDewfordPhraseSignature({
        firstWordIndex: condition.index,
        secondWordGroup: second.group,
        secondWordIndex: second.index
      })
    };
  }

  async function handleSaveChange(event) {
    const file = event.target.files?.[0];
    setResult(null);
    setSelectedRecommendedTileKey("");

    if (!selectedGame) {
      setStatus({
        type: "error",
        message: "Choose Ruby/Sapphire or Emerald first."
      });
      return;
    }

    if (!file) return;

    setStatus({
      type: "pending",
      message: "Reading save file locally..."
    });

    try {
      const buffer = await file.arrayBuffer();
      const parseResult =
        selectedGame === "emerald"
          ? parseEmeraldSave(buffer)
          : parseRubySapphireSave(buffer);

      if (!parseResult.valid) {
        setStatus({
          type: "error",
          message: `This save does not match the expected format for ${gameOption.fullLabel}. Check that you selected the correct game.`
        });
        setResult({
          type: "error",
          errors: parseResult.errors,
          parseResult
        });
        return;
      }

      setResult({
        type: "exact",
        source: "save",
        game: selectedGame,
        tileSet: buildPublicTileSet(
          parseResult.feebasValue.value
        ),
        parseResult
      });
      setStatus({
        type: "success",
        message:
          "Save read successfully. Your save stays on your device."
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          "We couldn't read this save file. Make sure you selected the correct game and uploaded a raw .sav file."
      });
      setResult({
        type: "error",
        errors: [
          error instanceof Error
            ? error.message
            : "Unable to read save file."
        ]
      });
    } finally {
      event.target.value = "";
    }
  }

  function finishWorkingBatteryCalculation(calculation) {
    const values = calculation.uniqueValues.map(
      entry => entry.value
    );

    if (values.length === 0) {
      setResult({
        type: "error",
        errors: [
          "No possible Feebas patterns matched that Trainer ID and Dewford Trend."
        ]
      });
      return;
    }

    setResult({
      type: "priority",
      modeLabel:
        "Ruby/Sapphire working-battery no-save search",
      game: selectedGame,
      calculation,
      priority: buildPublicPriorityResult(values, "all")
    });
  }

  function calculateWorkingBattery(input) {
    setCalculating(true);
    setStatus({
      type: "pending",
      message: "Calculating possible Feebas patterns..."
    });

    if (typeof Worker === "undefined") {
      window.setTimeout(() => {
        try {
          finishWorkingBatteryCalculation(
            findRsWorkingBatteryCandidates(input)
          );
          setStatus({
            type: "success",
            message:
              "Working-battery priority map calculated."
          });
        } catch (error) {
          setResult({
            type: "error",
            errors: [
              error instanceof Error
                ? error.message
                : "Working-battery calculation failed."
            ]
          });
          setStatus({
            type: "error",
            message:
              "Working-battery calculation failed."
          });
        } finally {
          setCalculating(false);
        }
      }, 0);
      return;
    }

    workerRef.current?.terminate();
    const worker = new Worker(
      new URL(
        "../workers/rsWorkingBatteryFeebasWorker.js",
        import.meta.url
      ),
      { type: "module" }
    );
    workerRef.current = worker;
    worker.onmessage = event => {
      if (event.data.ok) {
        finishWorkingBatteryCalculation(event.data.result);
        setStatus({
          type: "success",
          message:
            "Working-battery priority map calculated."
        });
      } else {
        setResult({
          type: "error",
          errors: [event.data.error]
        });
        setStatus({
          type: "error",
          message:
            "Working-battery calculation failed."
        });
      }
      setCalculating(false);
      worker.terminate();
      workerRef.current = null;
    };
    worker.postMessage(input);
  }

  function calculateFromGameInfo() {
    setResult(null);
    setSelectedRecommendedTileKey("");
    const input = getPhraseSignatureOrError();

    if (input.error) {
      setStatus({
        type: "error",
        message: input.error
      });
      return;
    }

    if (selectedGame === "emerald") {
      const calculation = findEmeraldFeebasValueCandidates({
        trainerId: input.trainerId,
        phraseSignature: input.phraseSignature
      });
      const values = calculation.candidates.map(
        candidate => candidate.value
      );

      setResult({
        type: "sets",
        modeLabel: "Emerald no-save search",
        game: selectedGame,
        calculation,
        sets: buildPossibleTileSetResult(values)
      });
      setStatus({
        type: "success",
        message: "Possible tile sets calculated."
      });
      return;
    }

    if (batteryMode === BATTERY_MODES.UNSURE) {
      setStatus({
        type: "error",
        message:
          "Choose whether the internal battery was working when this save was first created, or upload your save for exact results."
      });
      return;
    }

    if (batteryMode === BATTERY_MODES.DEAD) {
      const calculation = findRsDeadBatteryCandidates({
        trainerId: input.trainerId,
        phraseSignature: input.phraseSignature
      });
      const values = calculation.uniqueValues.map(
        candidate => candidate.value
      );

      setResult({
        type: "sets",
        modeLabel:
          "Ruby/Sapphire dead-battery no-save search",
        game: selectedGame,
        calculation,
        sets: buildPossibleTileSetResult(values)
      });
      setStatus({
        type: "success",
        message: "Possible tile sets calculated."
      });
      return;
    }

    calculateWorkingBattery({
      trainerId: input.trainerId,
      phraseSignature: input.phraseSignature,
      additionalPhrases: []
    });
  }

  return (
    <main className="rse-feebas-public-page">
      <Seo
        title="Pokemon Ruby, Sapphire & Emerald Feebas Tile Calculator | PokeLore"
        description="Find Feebas tiles on Route 119 in Pokemon Ruby, Sapphire, and Emerald. Upload your save for exact spots or use your Trainer ID and Dewford trendy phrase to narrow your search."
        canonical="https://pokelore.net/rse-feebas-calculator"
      />

      <header className="rse-feebas-public-header">
        <FeebasGuideBreadcrumbs pageId="rse-feebas-calculator" />
        <p>Route 119 Feebas Calculator</p>
        <h1>
          Pokemon Ruby, Sapphire & Emerald Feebas Tile
          Calculator
        </h1>
        <span>
          Find the Route 119 tiles where Feebas can appear.
          Upload your save file for exact results, or use
          your Trainer ID and Dewford trendy phrase to
          narrow down where to fish.
        </span>
      </header>

      <section className="rse-feebas-public-tool">
        <div className="rse-feebas-public-controls">
          <section>
            <h2>Which game are you playing?</h2>
            <div className="rse-feebas-game-grid">
              {GAME_OPTIONS.map(option => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={
                    selectedGame === option.id
                  }
                  onClick={() => {
                    setSelectedGame(option.id);
                    setResult(null);
                    setStatus({
                      type: "idle",
                      message: ""
                    });
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          {selectedGame && (
            <section>
              <h2>How would you like to find Feebas?</h2>
              <div
                className="rse-feebas-tabs"
                role="tablist"
                aria-label="Input method"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={method === METHODS.SAVE}
                  onClick={() => {
                    setMethod(METHODS.SAVE);
                    setResult(null);
                    setStatus({
                      type: "idle",
                      message: ""
                    });
                  }}
                >
                  Exact Save File
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={method === METHODS.INFO}
                  onClick={() => {
                    setMethod(METHODS.INFO);
                    setResult(null);
                    setStatus({
                      type: "idle",
                      message: ""
                    });
                    if (saveInputRef.current) {
                      saveInputRef.current.value = "";
                    }
                  }}
                >
                  No Save File
                </button>
              </div>

              {method === METHODS.SAVE && (
                <div className="rse-feebas-panel">
                  <h3>Exact Results</h3>
                  <p>
                    Upload your .sav file and PokeLore can
                    read the Feebas value currently stored
                    in your game.
                  </p>
                  <label>
                    <span>
                      {gameOption.fullLabel} .sav file
                    </span>
                    <input
                      ref={saveInputRef}
                      type="file"
                      accept=".sav,application/octet-stream"
                      onChange={handleSaveChange}
                    />
                  </label>
                  <strong>Your save stays on your device.</strong>
                  <details>
                    <summary>Privacy details</summary>
                    <p>
                      PokeLore reads the save directly in
                      your browser to find the stored Feebas
                      value. The save itself is not uploaded
                      or stored.
                    </p>
                  </details>
                </div>
              )}

              {method === METHODS.INFO && (
                <div className="rse-feebas-panel">
                  {selectedGame !== "emerald" && (
                    <fieldset className="rse-feebas-battery">
                      <legend>
                        Was the internal battery working
                        when this save was first created?
                      </legend>
                      <p>
                        This means when the save was
                        originally started, not whether the
                        battery works today.
                      </p>
                      <label>
                        <input
                          type="radio"
                          name="rse-feebas-battery"
                          checked={
                            batteryMode ===
                            BATTERY_MODES.WORKING
                          }
                          onChange={() =>
                            setBatteryMode(
                              BATTERY_MODES.WORKING
                            )
                          }
                        />
                        Yes / Working
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="rse-feebas-battery"
                          checked={
                            batteryMode ===
                            BATTERY_MODES.DEAD
                          }
                          onChange={() =>
                            setBatteryMode(
                              BATTERY_MODES.DEAD
                            )
                          }
                        />
                        No / Dead or invalid
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="rse-feebas-battery"
                          checked={
                            batteryMode ===
                            BATTERY_MODES.UNSURE
                          }
                          onChange={() =>
                            setBatteryMode(
                              BATTERY_MODES.UNSURE
                            )
                          }
                        />
                        Not sure
                      </label>
                    </fieldset>
                  )}

                  {batteryMode === BATTERY_MODES.UNSURE &&
                    selectedGame !== "emerald" && (
                      <p className="rse-feebas-note">
                        The battery state when the save was
                        created changes how much can be
                        predicted in Ruby and Sapphire. For
                        exact results, upload your save file.
                      </p>
                    )}

                  <WordInputs
                    trainerId={trainerId}
                    firstWord={firstWord}
                    secondWord={secondWord}
                    secondWordOptions={secondWordOptions}
                    onTrainerIdChange={setTrainerId}
                    onFirstWordChange={setFirstWord}
                    onSecondWordChange={setSecondWord}
                  />

                  {selectedGame === "emerald" && (
                    <details className="rse-feebas-help">
                      <summary>
                        Has your Dewford phrase been
                        changed?
                      </summary>
                      <p>
                        This method works best with the
                        phrase originally generated for the
                        save. Changing the Dewford trendy
                        phrase or receiving trends through
                        record mixing can break the
                        connection between the visible
                        phrase and your Feebas value.
                      </p>
                    </details>
                  )}

                  <button
                    type="button"
                    disabled={
                      calculating ||
                      (selectedGame !== "emerald" &&
                        batteryMode ===
                          BATTERY_MODES.UNSURE)
                    }
                    onClick={calculateFromGameInfo}
                  >
                    {calculating
                      ? "Calculating..."
                      : "Calculate"}
                  </button>
                </div>
              )}

              {status.message && (
                <p
                  className={`rse-feebas-status ${status.type}`}
                  role={
                    status.type === "error"
                      ? "alert"
                      : "status"
                  }
                >
                  {status.message}
                </p>
              )}

              <button
                type="button"
                className="rse-feebas-start-over"
                onClick={resetPublicState}
              >
                Start Over
              </button>
            </section>
          )}
        </div>

        <div className="rse-feebas-public-map-stack">
          {!result && (
            <section className="rse-feebas-result-card">
              <div className="rse-feebas-section-heading">
                <div>
                  <h2>Route 119 Map</h2>
                  <p>
                    Your highlighted Feebas tiles will appear
                    here after you upload a save or calculate
                    from game information.
                  </p>
                </div>
              </div>
              <MapControls
                zoom={zoom}
                defaultZoom={getDefaultMapZoom()}
                onZoomChange={setZoom}
              />
              <RseRoute119FeebasMap
                showGrid
                showMapImage
                zoom={zoom}
              />
            </section>
          )}

          {result?.type === "error" && (
            <section
              className="rse-feebas-result-card rse-feebas-error"
              role="alert"
            >
              <h2>We could not get results yet</h2>
              <p>
                This does not appear to be a supported
                Pokemon Ruby, Sapphire, or Emerald save
                file.
              </p>
              <details>
                <summary>Show details</summary>
                <ul>
                  {result.errors.map(error => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </details>
            </section>
          )}

          {result?.type === "exact" && (
            <ExactResult
              result={result}
              zoom={zoom}
              onZoomChange={setZoom}
            />
          )}

          {result?.type === "sets" && (
            <PossibleSetsResult
              result={result}
              zoom={zoom}
              selectedTileKey={selectedRecommendedTileKey}
              onZoomChange={setZoom}
              onRecommendedTileClick={setSelectedTile}
            />
          )}

          {result?.type === "priority" && (
            <PriorityResult
              result={result}
              priorityMode={priorityMode}
              priorityFilter={priorityFilter}
              zoom={zoom}
              selectedTileKey={selectedRecommendedTileKey}
              onPriorityModeChange={setPriorityMode}
              onPriorityFilterChange={setPriorityFilter}
              onZoomChange={setZoom}
              onRecommendedTileClick={setSelectedTile}
            />
          )}
        </div>
      </section>

      <aside className="rse-feebas-more-tools">
        <h2>More Feebas Tools</h2>
        <Link to="/dppt-feebas-calculator">
          Diamond, Pearl, and Platinum Feebas Calculator
        </Link>
        <Link to="/topic/evolving-feebas-into-milotic-via-beauty">
          Evolving Feebas into Milotic
        </Link>
      </aside>

      <article className="rse-feebas-public-guide">
        <h2>
          How Feebas Tiles Work in Ruby, Sapphire & Emerald
        </h2>
        <p>
          Feebas is tied to a small set of Route 119 fishing
          spots. The game stores a value in the save file,
          and that value determines which spots can produce
          Feebas.
        </p>
        <p>
          A correct tile does not guarantee every encounter
          will be Feebas. Once you catch Feebas on a tile,
          that tile is confirmed, so keep fishing there.
        </p>

        <h2>Why Does Ruby/Sapphire Ask About the Battery?</h2>
        <p>
          Ruby and Sapphire use RTC-dependent initialization.
          A dead or invalid battery when the save was first
          created makes the initial search much more
          predictable. Emerald uses a different method here,
          so this calculator does not ask about battery
          status for Emerald.
        </p>

        <h2>Why Does Save Upload Give Exact Results?</h2>
        <p>
          The save directly contains the value the game uses
          for Feebas. Uploading a compatible save lets the
          calculator skip prediction and show the current
          Route 119 tiles immediately. The file is processed
          locally in your browser.
        </p>

        <h2>
          Why Are There So Many Possible Tiles in Ruby and
          Sapphire?
        </h2>
        <p>
          If the battery was working when a Ruby or Sapphire
          save was created, the Trainer ID and current
          Dewford phrase may still match many possible
          Feebas patterns. PokeLore combines those patterns
          into a priority map so the best tiles to try first
          are easy to see.
        </p>

        <h2>Frequently Asked Questions</h2>
        <h3>Does the battery matter in Emerald?</h3>
        <p>Not for this Feebas calculation.</p>
        <h3>Do I need a save file?</h3>
        <p>
          No, but a save file gives exact results and is the
          fastest method.
        </p>
        <h3>What if I do not find Feebas on the first try?</h3>
        <p>
          Keep trying. A correct Feebas tile does not make
          every fishing encounter Feebas.
        </p>
        <h3>Once I catch Feebas, should I move?</h3>
        <p>
          No. Once you have confirmed a Feebas tile, keep
          fishing that tile.
        </p>
      </article>
    </main>
  );
}

export default RseFeebasPublicCalculatorPage;
