import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Link } from "react-router-dom";
import FeebasGuideBreadcrumbs from "../components/feebas/FeebasGuideBreadcrumbs";
import RseRoute119FeebasMap from "../components/feebas/RseRoute119FeebasMap";
import PokemonSummaryCard from "../components/PokemonSummaryCard";
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
  route119FeebasTiles
} from "../utils/rseFeebasCalculator";
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

const DEFAULT_GAME = "emerald";

const PRIORITY_DISPLAY_MODES = {
  TIERED: "tiered",
  HEATMAP: "heatmap"
};

const MAP_MODES = {
  HINT: "hint",
  EXACT: "exact"
};

const RSE_HINT_AREA_SIZE = 4;
const RSE_HINT_TILE_COUNT =
  RSE_HINT_AREA_SIZE * RSE_HINT_AREA_SIZE;

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

const FEEBAS_EVOLUTION_POKEMON = [
  {
    id: 349,
    name: "feebas",
    species: "feebas",
    types: ["water"],
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/349.png"
  },
  {
    id: 350,
    name: "milotic",
    species: "milotic",
    types: ["water"],
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/350.png"
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

function hashSearchAreaSeed(seed) {
  const seedText = String(seed ?? "");
  let hash = 0x811c9dc5;

  for (let index = 0; index < seedText.length; index += 1) {
    hash ^= seedText.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash;
}

function coordinateKey(tile) {
  return `${tile.x}:${tile.y}`;
}

function getHintDistanceScore(tile, exactTile) {
  const deltaX = Math.abs(tile.x - exactTile.x);
  const deltaY = Math.abs(tile.y - exactTile.y);

  return {
    chebyshev: Math.max(deltaX, deltaY),
    manhattan: deltaX + deltaY,
    squared: deltaX * deltaX + deltaY * deltaY
  };
}

function getFishableHintTiles(location, seed) {
  const exactTile = {
    x: Number(location.x),
    y: Number(location.y)
  };
  const fishableByCoordinate = new Map();

  route119FeebasTiles
    .filter(tile => tile.feebasSelectable !== false)
    .forEach(tile => {
      fishableByCoordinate.set(coordinateKey(tile), tile);
    });
  fishableByCoordinate.set(coordinateKey(exactTile), {
    ...location,
    ...exactTile
  });

  return [...fishableByCoordinate.values()]
    .sort((left, right) => {
      const leftScore = getHintDistanceScore(
        left,
        exactTile
      );
      const rightScore = getHintDistanceScore(
        right,
        exactTile
      );

      return (
        leftScore.chebyshev - rightScore.chebyshev ||
        leftScore.manhattan - rightScore.manhattan ||
        leftScore.squared - rightScore.squared ||
        (hashSearchAreaSeed(
          `${seed}:${coordinateKey(left)}`
        ) %
          7) -
          (hashSearchAreaSeed(
            `${seed}:${coordinateKey(right)}`
          ) %
            7) ||
        left.y - right.y ||
        left.x - right.x
      );
    })
    .slice(0, RSE_HINT_TILE_COUNT)
    .map(tile => ({
      x: tile.x,
      y: tile.y,
      sourceSpotId:
        location.sourceSpotId ??
        location.spotId ??
        location.spotIds?.[0]
    }));
}

function getRseHintAreaForLocation(location, seed, index = 0) {
  return {
    areaNumber:
      location.resultNumbers?.[0] ??
      location.resultNumber ??
      index + 1,
    sourceSpotId:
      location.sourceSpotId ??
      location.spotId ??
      location.spotIds?.[0],
    exactCoordinate: {
      x: Number(location.x),
      y: Number(location.y)
    },
    tiles: getFishableHintTiles(location, seed)
  };
}

function getRseHintAreasForLocations(locations, seedPrefix) {
  return locations.map((location, index) =>
    getRseHintAreaForLocation(
      location,
      [
        seedPrefix,
        index,
        location.sourceSpotId ??
          location.spotId ??
          location.spotIds?.join(","),
        location.x,
        location.y
      ].join(":"),
      index
    )
  );
}

function buildSetNumberDisplayTiles(priorityTiles) {
  return priorityTiles.map(tile => {
    const setNumbers = [
      ...new Set(
        tile.setNumbers ??
          (tile.candidateIndexes ?? []).map(
            candidateIndex => candidateIndex + 1
          )
      )
    ];
    const visibleSetNumbers = setNumbers.slice(0, 4);
    const remainingCount =
      setNumbers.length - visibleSetNumbers.length;
    const displayLabel = `${visibleSetNumbers.join(",")}${remainingCount > 0 ? "+" : ""}`;

    return {
      ...tile,
      displayLabel,
      setNumbers,
      title: [
        `Possible set${setNumbers.length === 1 ? "" : "s"} ${setNumbers.join(", ")}`,
        `Overlap strength: ${tile.count} possible pattern${tile.count === 1 ? "" : "s"}`,
        `Tile x${tile.x}, y${tile.y}`
      ].join("\n")
    };
  });
}

function buildSetCoverageTiles(tileSets) {
  const tilesByCoordinate = new Map();

  tileSets.forEach(tileSet => {
    const seenCoordinates = new Set();

    tileSet.reachableTiles.forEach(tile => {
      const key = coordinateKey(tile);
      if (seenCoordinates.has(key)) return;
      seenCoordinates.add(key);

      const existing = tilesByCoordinate.get(key) ?? {
        ...tile,
        count: 0,
        setNumbers: [],
        candidateValues: [],
        spotIds: []
      };

      existing.count += 1;
      existing.setNumbers.push(tileSet.setNumber);
      existing.candidateValues.push(tileSet.value);
      existing.spotIds.push(...(tile.spotIds ?? []));
      tilesByCoordinate.set(key, existing);
    });
  });

  const tiles = [...tilesByCoordinate.values()];
  const maxOverlap = tiles.reduce(
    (max, tile) => Math.max(max, tile.count),
    0
  );

  return tiles.map(tile => ({
    ...tile,
    overlapCount: tile.count,
    displayIntensity:
      maxOverlap === 0 ? 0 : tile.count / maxOverlap
  }));
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
        value: word.text,
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
      {/* <span>{Math.round(zoom * 100)}%</span> */}
    </div>
  );
}

function MapModeControls({
  mode,
  onModeChange
}) {
  return (
    <div className="rse-feebas-map-mode">
      <div
        className="rse-feebas-segmented"
        role="group"
        aria-label="Map mode"
      >
        <button
          type="button"
          aria-pressed={mode === MAP_MODES.HINT}
          onClick={() => onModeChange(MAP_MODES.HINT)}
        >
          Hint
        </button>
        <button
          type="button"
          aria-pressed={mode === MAP_MODES.EXACT}
          onClick={() => onModeChange(MAP_MODES.EXACT)}
        >
          Exact
        </button>
      </div>
      <p className="rse-feebas-mode-help">
        {mode === MAP_MODES.EXACT
          ? "Show the exact fishing locations."
          : "Show a 16 tile approximate location for each possible Feebas spot."}
      </p>
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
          placeholder="00000"
          onChange={event =>
            onTrainerIdChange(event.target.value)
          }
        />
        <small>
          The five-digit ID shown on your Trainer Card.
        </small>
      </label>

      <label>
        <span>Current Dewford Trend</span>
        <input
          type="text"
          list="rse-feebas-conditions"
          value={firstWord}
          placeholder="First word"
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
     
        <input
          type="text"
          list="rse-feebas-second-words"
          value={secondWord}
          placeholder="Second word"
          onChange={event =>
            onSecondWordChange(event.target.value)
          }
        />
        <datalist id="rse-feebas-second-words">
          {secondWordOptions.map(word => (
            <option
              key={`${word.group}:${word.index}`}
              value={word.value}
            />
          ))}
        </datalist>
      </label>
      <p>
        Use the trendy phrase currently being discussed in{" "}
        <Link to="/location/dewford-town">Dewford Town</Link>.
      </p>
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
          <div>
            <dt>Inaccessible internal results</dt>
            <dd>{result.tileSet.inaccessible.length}</dd>
          </div>
          <div>
            <dt>Under-bridge internal results</dt>
            <dd>{result.tileSet.underBridge.length}</dd>
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
  mapMode,
  onMapModeChange,
  onZoomChange
}) {
  const shownCount =
    result.tileSet.reachableTiles.length;
  const generatedCount =
    result.tileSet.result.generatedSpotIds.length;
  const hintAreas =
    mapMode === MAP_MODES.HINT
      ? getRseHintAreasForLocations(
          result.tileSet.reachableTiles,
          result.tileSet.value
        )
      : [];

  return (
    <section className="rse-feebas-result-card">
      <div className="rse-feebas-section-heading">
        <div>
          <h2>Your Feebas Tiles</h2>
          <p>
            We found the exact Feebas value stored in your
            save. Fish on any highlighted location below.
          </p>
        </div>
        {/* <strong>
          {shownCount} highlighted Feebas location
          {shownCount === 1 ? "" : "s"}
        </strong> */}
      </div>
      <MapModeControls
        mode={mapMode}
        onModeChange={onMapModeChange}
      />
      <RseRoute119FeebasMap
        displayLocations={
          mapMode === MAP_MODES.EXACT
            ? result.tileSet.reachableTiles
            : []
        }
        highlightedAreas={hintAreas}
        showGrid
        showMapImage
        zoom={zoom}
        fitHeightToMapImage
        showHighlightLabels={false}
      />
      <MapControls
        zoom={zoom}
        defaultZoom={getDefaultMapZoom()}
        onZoomChange={onZoomChange}
      />
      {shownCount !== generatedCount && (
        <p className="rse-feebas-note">
          {generatedCount} internal Feebas spots were
          generated; {shownCount} player-facing fishing
          locations are shown.
        </p>
      )}
      {/* <AdvancedDetails result={result} /> */}
    </section>
  );
}

function PossibleSetsResult({
  result,
  zoom,
  onZoomChange
}) {
  const resultKey = result.sets.values.join("|");
  const [hiddenSetNumbers, setHiddenSetNumbers] = useState(
    () => new Set()
  );

  useEffect(() => {
    setHiddenSetNumbers(new Set());
  }, [resultKey]);

  const [onlyTileSet] = result.sets.tileSets;
  const showSingleSixTileSet =
    result.sets.tileSets.length === 1 &&
    onlyTileSet.reachableTiles.length === 6;
  const visibleTileSets = result.sets.tileSets.filter(
    tileSet => !hiddenSetNumbers.has(tileSet.setNumber)
  );
  const setNumberDisplayTiles = buildSetNumberDisplayTiles(
    buildSetCoverageTiles(visibleTileSets)
  );

  return (
    <section className="rse-feebas-result-card">
      <div className="rse-feebas-section-heading">
        <div>
          <h2>Possible Feebas Tile Layouts</h2>
          <p>
            There are {result.sets.tileSets.length} possible
            Feebas Tile Layouts revealed by your game info.
            All tiles within a set have the same number on
            the map below.
          </p>
        </div>
      </div>

      {visibleTileSets.length > 1 && (
        <p className="rse-feebas-search-note">
          Fish one encounter on each tile number once, then
          repeat through again if you have not found Feebas.
          Each number represents one possible Feebas tile
          layout. So checking each number once checks as
          many sets as possible as quickly as possible.
        </p>
      )}

      <RseRoute119FeebasMap
        displayLocations={
          showSingleSixTileSet &&
          visibleTileSets.length === 1
            ? onlyTileSet.reachableTiles
            : []
        }
        priorityTiles={
          !showSingleSixTileSet
            ? setNumberDisplayTiles
            : []
        }
        priorityDisplayMode={PRIORITY_DISPLAY_MODES.HEATMAP}
        showGrid
        showMapImage
        zoom={zoom}
        fitHeightToMapImage
        showHighlightLabels={false}
      />
      <MapControls
        zoom={zoom}
        defaultZoom={getDefaultMapZoom()}
        onZoomChange={onZoomChange}
      />

      <div className="rse-feebas-set-grid">
        {result.sets.tileSets.map(tileSet => {
          const isVisible = !hiddenSetNumbers.has(
            tileSet.setNumber
          );

          return (
            <article
              key={tileSet.value}
              className={`rse-feebas-set-card ${isVisible ? "" : "is-hidden"}`}
            >
              <h3>
                Possible Tile Set {tileSet.setNumber}
              </h3>
              <label>
                <input
                  type="checkbox"
                  checked={!isVisible}
                  onChange={() => {
                    setHiddenSetNumbers(current => {
                      const next = new Set(current);

                      if (next.has(tileSet.setNumber)) {
                        next.delete(tileSet.setNumber);
                      } else {
                        next.add(tileSet.setNumber);
                      }

                      return next;
                    });
                  }}
                />
                <span>Hide Set</span>
              </label>
            </article>
          );
        })}
      </div>

      {/* <AdvancedDetails result={result} /> */}
    </section>
  );
}

function PriorityResult({
  result,
  priorityMode,
  priorityFilter,
  zoom,
  onPriorityModeChange,
  onPriorityFilterChange,
  onZoomChange
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
            Start with the tiles showing the highest overlap
            counts.
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
        information. The number on each tile is the count of
        matching Feebas patterns that include that tile.
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

      <RseRoute119FeebasMap
        priorityTiles={publicPriority.visibleTiles}
        priorityDisplayMode={priorityMode}
        showGrid
        showMapImage
        zoom={zoom}
        fitHeightToMapImage
      />
      <MapControls
        zoom={zoom}
        defaultZoom={getDefaultMapZoom()}
        onZoomChange={onZoomChange}
      />

      <p className="rse-feebas-save-nudge">
        Want exact results? Upload your .sav file.
      </p>
      {/* <AdvancedDetails result={result} /> */}
    </section>
  );
}

function RseFeebasPublicCalculatorPage() {
  const [selectedGame, setSelectedGame] =
    useState(DEFAULT_GAME);
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
  const [mapMode, setMapMode] = useState(MAP_MODES.EXACT);
  const [priorityMode, setPriorityMode] = useState(
    PRIORITY_DISPLAY_MODES.TIERED
  );
  const [priorityFilter, setPriorityFilter] =
    useState("all");
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
    setSelectedGame(DEFAULT_GAME);
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
    setMapMode(MAP_MODES.EXACT);
    setPriorityMode(PRIORITY_DISPLAY_MODES.TIERED);
    setPriorityFilter("all");
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
          Upload your save file for best results, or use
          your Trainer ID and Dewford trendy phrase to
          narrow down where to fish.
        </span>
      </header>

      <section className="rse-feebas-public-tool">
        <div className="rse-feebas-public-controls">
          <section>
            {/* <h2>Version Selection</h2> */}
            <div className="rse-feebas-game-grid">
              {GAME_OPTIONS.map(option => (
                <button
                  key={option.id}
                  type="button"
                  className={`rse-feebas-game-button rse-feebas-game-button--${option.id}`}
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
              {/* <h2>Input Method</h2> */}
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
                  Upload Save
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
                  Manual
                </button>
              </div>

              {method === METHODS.SAVE && (
                <div className="rse-feebas-panel">
              
                  <p>
                    Upload your .sav file to find the current Feebas tiles in your game.
                  </p>
                  <label>
                    {/* <span>
                      {gameOption.fullLabel} .sav file
                    </span> */}
                    <input
                      ref={saveInputRef}
                      type="file"
                      accept=".sav,application/octet-stream"
                      onChange={handleSaveChange}
                    />
                  </label>
          
                  <details>
                    <summary>Privacy</summary>
                    <p>
                  The save is read directly in your browser, it is not uploaded or stored.
                    </p>
                  </details>
                </div>
              )}

              {method === METHODS.INFO && (
                <div className="rse-feebas-panel">
                  {selectedGame !== "emerald" && (
                    <fieldset className="rse-feebas-battery">
                      {/* <legend>
                      Is your battery working, or does your emulator support RTC?
                      </legend> */}
                      <p>
                 When you started the game, did you receive a warning such as 
                        "The internal battery has run dry. Clock based events will no longer occur."?
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
                        NO 
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
                        YES 
                      </label>
                      {/* <label>
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
                      </label> */}


                      <details>
                    <summary>Playing on an emulator? </summary>
                    <p>
             If the game did not show the “internal battery has run dry” message when this save was first created, choose NO. 
             Most modern emulators such as mGBA emulate the clock normally. If the game showed the dry-battery warning when the save was created, choose YES.
                    </p>
                  </details>
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

                  <details className="rse-feebas-help">
                    <summary>
                      Has your Dewford phrase been changed?
                    </summary>
                    <p>
              Naturally changing trends are fine. However, manually submitted phrases will not display the correct results. 
              You must wait until a game generated phrase resurfaces, or upload your .sav file.
                    </p>
                  </details>

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

              {/* <button
                type="button"
                className="rse-feebas-start-over"
                onClick={resetPublicState}
              >
                Start Over
              </button> */}
            </section>
          )}
        </div>

        <div className="rse-feebas-public-map-stack">
          {!result && (
            <section className="rse-feebas-result-card">
              <div className="rse-feebas-section-heading">
                <div>
                  {/* <h2>Route 119</h2> */}
                  {/* <p>
                    Your highlighted Feebas tiles will appear
                    here after you upload a save or calculate
                    from game information.
                  </p> */}
                </div>
              </div>
              <RseRoute119FeebasMap
                showGrid
                showMapImage
                zoom={zoom}
              />
              <MapControls
                zoom={zoom}
                defaultZoom={getDefaultMapZoom()}
                onZoomChange={setZoom}
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
              mapMode={mapMode}
              onMapModeChange={setMapMode}
              onZoomChange={setZoom}
            />
          )}

          {result?.type === "sets" && (
            <PossibleSetsResult
              result={result}
              zoom={zoom}
              onZoomChange={setZoom}
            />
          )}

          {result?.type === "priority" && (
            <PriorityResult
              result={result}
              priorityMode={priorityMode}
              priorityFilter={priorityFilter}
              zoom={zoom}
              onPriorityModeChange={setPriorityMode}
              onPriorityFilterChange={setPriorityFilter}
              onZoomChange={setZoom}
            />
          )}
        </div>
      </section>

      <section
        className="rse-feebas-pokemon-summary"
        aria-label="Feebas and Milotic"
      >
        {FEEBAS_EVOLUTION_POKEMON.map(pokemon => (
          <PokemonSummaryCard
            key={pokemon.name}
            pokemon={pokemon}
          />
        ))}
      </section>

      <aside className="rse-feebas-guide-note">
        <p>
          For more info, see our guide:{" "}
          <Link to="/topic/catching-feebas-in-pokemon-emerald">
            Catching Feebas in Pokemon Emerald
          </Link>
          .
        </p>
      </aside>

      <aside className="rse-feebas-beauty-note">
        <h2>Beauty and the &apos;Bas</h2>
        <p>
          Once you have caught Feebas, please see our guide{" "}
          <Link to="/topic/evolving-feebas-into-milotic-via-beauty">
            Evolving Feebas to Milotic Via Beauty
          </Link>
          .
        </p>
      </aside>

      <article className="rse-feebas-public-guide">
        <h2>
          How to Find Feebas in Pokémon Ruby, Sapphire,
          and Emerald
        </h2>
        <p>
          Feebas is found by fishing on{" "}
          <Link to="/location/hoenn-route-119">Route 119</Link>{" "}
          in Pokémon Ruby, Pokémon Sapphire, and Pokémon
          Emerald, but it does not appear throughout the
          river normally. Instead, each save has a small set
          of specific Feebas fishing tiles, making Feebas
          notoriously difficult to find by searching{" "}
          <Link to="/location/hoenn-route-119">Route 119</Link>{" "}
          manually.
        </p>
        <p>
          The Feebas Tile Calculator above can use
          information from your game to determine or narrow
          down those locations. If you can upload a
          compatible .sav file, PokéLore can read the Feebas
          value stored in the save and show your exact{" "}
          <Link to="/location/hoenn-route-119">Route 119</Link>{" "}
          Feebas locations. If you don&apos;t have access
          to your save file, your Trainer ID and{" "}
          <Link to="/location/dewford-town">Dewford Town</Link>{" "}
          trendy phrase can still be used to narrow the
          search.
        </p>

        <h2>
          How Feebas Tiles Work in Ruby, Sapphire, and
          Emerald
        </h2>
        <p>
          The game generates six internal Feebas fishing
          spots on{" "}
          <Link to="/location/hoenn-route-119">Route 119</Link>{" "}
          from a value stored in your
          save. Most correspond to individual places where
          you can fish, although a few possible results are
          inaccessible because of{" "}
          <Link to="/location/hoenn-route-119">Route 119</Link>
          &apos;s map layout,
          and one special result corresponds to fishable
          water beneath a bridge. Feebas is not guaranteed
          on every encounter even when you are fishing the
          correct location, so try a valid tile more than
          once before moving on.
        </p>
        <p>
          Any fishing rod can catch Feebas on a valid tile.
          Because you are trying to check locations quickly
          rather than catch high-level Pokémon, the{" "}
          <Link to="/item/old-rod">Old Rod</Link>{" "}
          is often the fastest choice for searching. The rod
          you use does not determine which{" "}
          <Link to="/location/hoenn-route-119">Route 119</Link>{" "}
          tiles
          are Feebas tiles.
        </p>

        <h2>Why Does the Dewford Trendy Phrase Matter?</h2>
        <p>
          The trendy phrase in{" "}
          <Link to="/location/dewford-town">Dewford Town</Link>{" "}
          is connected to
          the data used for your Feebas locations. However,
          simply copying another player&apos;s trendy phrase
          will not give you their Feebas tiles; the phrase
          alone does not uniquely determine the locations.
          Additional information, such as your Trainer ID,
          is needed to recover useful possible results.
        </p>
        <p>
          For best results, use the naturally generated
          trendy phrase from your save. If the phrase has
          been manually changed or affected by record
          mixing, the visible phrase may no longer provide
          enough information to predict the original Feebas
          value. In that situation, save-file upload is the
          most reliable method because it reads the value
          used by the game directly.
        </p>

        <h2>
          Ruby and Sapphire: Working Battery vs. Dead
          Battery
        </h2>
        <p>
          Pokémon Ruby and Sapphire behave differently
          depending on whether the cartridge&apos;s internal
          clock was working when the save was originally
          created. A save started with a dead or invalid
          battery is much easier to narrow down from its
          Trainer ID and Dewford phrase, while a save
          created with a working clock can have many more
          possible Feebas patterns.
        </p>
        <p>
          For working-battery saves, PokéLore combines all
          matching patterns into a priority map instead of
          overwhelming you with dozens of separate
          possibilities. Tiles that occur in more matching
          patterns are highlighted as higher priority,
          giving you the best places to search first.
        </p>
        <p>
          Uploading a save file bypasses this uncertainty
          entirely. If the exact value can be read from your
          save, it does not matter whether the battery was
          working or dead when the game was created.
        </p>

        <h2>Does the Battery Matter in Pokémon Emerald?</h2>
        <p>
          No, not for this Feebas calculation. Pokémon
          Emerald initializes the relevant random data
          differently from Ruby and Sapphire, so you do not
          need to know whether Emerald&apos;s internal battery
          was working when your save was created.
        </p>
        <p>
          A dead battery can still affect other clock-based
          features in Emerald, but it does not require a
          separate dead-battery Feebas calculation.
        </p>

        <h2>
          Playing Pokémon Ruby, Sapphire, or Emerald on an
          Emulator?
        </h2>
        <p>
          An emulator does not automatically count as having
          a dead battery. Modern emulators such as mGBA can
          emulate the Game Boy Advance real-time clock, so a
          Ruby or Sapphire save created normally with a
          functioning emulated clock should be treated like a
          working-battery save.
        </p>
        <p>
          A useful rule is to remember what happened when
          the save was first created: if Ruby or Sapphire
          displayed the &quot;internal battery has run
          dry&quot; warning at that time, choose the
          dead-battery option. If the game did not show that
          warning, choose working battery.
        </p>
        <p>
          If you have access to the emulator&apos;s .sav
          file, use the save upload option instead; the
          calculator can determine your exact Feebas
          locations without requiring you to answer the
          battery question.
        </p>

        <h2>
          Will This Feebas Calculator Work With Pokémon
          Emerald on Nintendo Switch?
        </h2>
        <p>
          As of August 20, 2026, Pokémon Ruby, Sapphire,
          and Emerald have not been officially announced for
          Nintendo Switch. Recent reports claim that Switch
          versions of the three Hoenn games may be planned
          for late September or October 2026, following the
          February 27, 2026 releases of Pokémon FireRed and
          LeafGreen, but Nintendo and The Pokémon Company
          have not confirmed those reports.
        </p>
        <p>
          If Pokémon Emerald, Ruby, or Sapphire are released
          on Switch using the original Game Boy Advance
          mechanics, PokéLore will test the new versions as
          soon as they are available and update this
          calculator with confirmed compatibility. Bookmark
          this page if you&apos;re planning to catch Feebas
          in Pokémon Emerald on Switch.
        </p>

        <h2>What Should I Do Once I Find a Feebas Tile?</h2>
        <p>
          Once you catch Feebas from one of the highlighted
          locations, you have found a working tile and do not
          need to continue searching the rest of{" "}
          <Link to="/location/hoenn-route-119">Route 119</Link>.
          You can keep fishing at that same location if you
          want additional Feebas with different stats or
          Natures.
        </p>
        <p>
          Catching Feebas is only half of the challenge in
          Generation III:{" "}
          <Link to="/topic/evolving-feebas-into-milotic-via-beauty">
            evolving it into Milotic requires raising its
            Beauty and then leveling it up
          </Link>
          .
        </p>

        <h2>FAQ</h2>
        <h3>Where is Feebas in Pokémon Emerald?</h3>
        <p>
          Feebas is found by fishing on{" "}
          <Link to="/location/hoenn-route-119">Route 119</Link>,
          but only
          at a small set of fishing locations determined by
          your save. Use the Emerald Feebas calculator above
          to narrow down the locations rather than checking
          the entire river manually.
        </p>
        <h3>Where is Feebas in Pokémon Ruby and Sapphire?</h3>
        <p>
          Like Emerald, Feebas is found by fishing at
          specific locations on{" "}
          <Link to="/location/hoenn-route-119">Route 119</Link>.
          Ruby and
          Sapphire calculations can also depend on whether
          the internal battery or RTC was working when the
          save was originally created.
        </p>
        <h3>How many Feebas tiles are there in Emerald?</h3>
        <p>
          The game generates six internal Feebas spots,
          although map quirks mean not every generated
          result necessarily corresponds to a normally
          accessible fishing tile.
        </p>
        <h3>What is the best fishing rod for Feebas?</h3>
        <p>
          Any rod can encounter Feebas on a valid tile. The
          <Link to="/item/old-rod">Old Rod</Link> is
          convenient for searching because
          encounters can be checked quickly.
        </p>

        <h3>Can I find my exact Feebas tiles from a save file?</h3>
        <p>
          Yes. If you have a compatible Ruby, Sapphire, or
          Emerald .sav, the calculator can read the value
          stored by the game and use it to identify your
          exact player-accessible Feebas locations.
        </p>
      </article>
    </main>
  );
}

export default RseFeebasPublicCalculatorPage;
