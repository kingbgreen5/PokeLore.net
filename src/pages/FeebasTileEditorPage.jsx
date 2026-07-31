import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  FEEBAS_DEFAULT_IMAGE_ALIGNMENT,
  FEEBAS_EXPECTED_TILE_COUNT,
  FEEBAS_GRID_HEIGHT,
  FEEBAS_GRID_WIDTH,
  FEEBAS_GROUP_SIZE,
  FEEBAS_TOTAL_SQUARES,
  createFeebasExportData,
  createTileSetFromCoordinates,
  createValidationSummary,
  normalizeImageAlignment,
  selectedSetToTiles,
  tileKey,
  validateFeebasImportText
} from "../utils/feebasTileEditorUtils";
import "./FeebasTileEditorPage.css";

const LOCAL_STORAGE_KEY =
  "pokelore.feebasTileEditor.v1";
const DEFAULT_MAP_IMAGE =
  "/images/maps/mt-coronet-feebas-lake.png";

const DEFAULT_DISPLAY_SETTINGS = {
  showGridLines: true,
  showCoordinates: false,
  showIndexes: true,
  showHeaders: true,
  dimUnselected: false,
  showGroups: false
};

function readLocalState() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return JSON.parse(
      window.localStorage.getItem(LOCAL_STORAGE_KEY)
    );
  } catch {
    return null;
  }
}

function selectedSetFromSaved(saved) {
  if (Array.isArray(saved?.selectedKeys)) {
    return new Set(saved.selectedKeys);
  }

  if (Array.isArray(saved?.tiles)) {
    return createTileSetFromCoordinates(saved.tiles);
  }

  return new Set();
}

function setToSnapshot(selectedKeys) {
  return Array.from(selectedKeys);
}

function setsEqual(a, b) {
  if (a.size !== b.size) return false;

  for (const key of a) {
    if (!b.has(key)) return false;
  }

  return true;
}

function makeAllKeys() {
  const keys = [];

  for (let y = 0; y < FEEBAS_GRID_HEIGHT; y += 1) {
    for (let x = 0; x < FEEBAS_GRID_WIDTH; x += 1) {
      keys.push(tileKey(x, y));
    }
  }

  return keys;
}

const ALL_TILE_KEYS = makeAllKeys();

function formatSaveTime(value) {
  if (!value) return "Never";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function NumberControl({
  label,
  value,
  min,
  max,
  step = 1,
  onChange
}) {
  function handleChange(nextValue) {
    const numericValue = Number(nextValue);
    if (!Number.isFinite(numericValue)) return;
    onChange(numericValue);
  }

  return (
    <label className="feebas-field">
      <span>{label}</span>
      <div className="feebas-range-row">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={event =>
            handleChange(event.target.value)
          }
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={event =>
            handleChange(event.target.value)
          }
        />
      </div>
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange
}) {
  return (
    <label className="feebas-toggle-field">
      <input
        type="checkbox"
        checked={checked}
        onChange={event =>
          onChange(event.target.checked)
        }
      />
      <span>{label}</span>
    </label>
  );
}

function groupLabelForIndex(index) {
  if (index === undefined) return "";
  return `G${Math.floor(index / FEEBAS_GROUP_SIZE) + 1}`;
}

function FeebasTileEditorPage() {
  const saved = useMemo(() => readLocalState(), []);
  const [selectedKeys, setSelectedKeys] = useState(() =>
    selectedSetFromSaved(saved)
  );
  const [alignment, setAlignment] = useState(() =>
    normalizeImageAlignment(saved?.imageAlignment)
  );
  const [displaySettings, setDisplaySettings] =
    useState(() => ({
      ...DEFAULT_DISPLAY_SETTINGS,
      ...(saved?.displaySettings ?? {})
    }));
  const [tool, setTool] = useState(
    saved?.tool || "select"
  );
  const [editorWidth, setEditorWidth] = useState(
    Number(saved?.editorWidth) || 620
  );
  const [editorZoom, setEditorZoom] = useState(
    Number(saved?.editorZoom) || 1
  );
  const [imageSrc, setImageSrc] =
    useState(DEFAULT_MAP_IMAGE);
  const [objectUrl, setObjectUrl] =
    useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [status, setStatus] = useState("");
  const [importDraft, setImportDraft] = useState("");
  const [selectedSearch, setSelectedSearch] =
    useState("");
  const [focusedKey, setFocusedKey] = useState(null);
  const [goToIndex, setGoToIndex] = useState("");
  const [rowTarget, setRowTarget] = useState(0);
  const [columnTarget, setColumnTarget] = useState(0);
  const [alignmentNudgeActive, setAlignmentNudgeActive] =
    useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(
    saved?.savedAt || null
  );
  const hasHydratedRef = useRef(false);
  const selectedKeysRef = useRef(selectedKeys);
  const gridRef = useRef(null);
  const mapStageRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    selectedKeysRef.current = selectedKeys;
  }, [selectedKeys]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  const selectedTiles = useMemo(
    () => selectedSetToTiles(selectedKeys),
    [selectedKeys]
  );
  const tileMeta = useMemo(
    () =>
      new Map(
        selectedTiles.map(tile => [
          tileKey(tile.x, tile.y),
          tile
        ])
      ),
    [selectedTiles]
  );
  const validation = useMemo(
    () => createValidationSummary(selectedKeys),
    [selectedKeys]
  );
  const exportData = useMemo(
    () =>
      createFeebasExportData({
        selectedKeys,
        imageAlignment: alignment
      }),
    [selectedKeys, alignment]
  );
  const exportJson = useMemo(
    () => JSON.stringify(exportData, null, 2),
    [exportData]
  );
  const countDelta =
    selectedTiles.length - FEEBAS_EXPECTED_TILE_COUNT;
  const countStatus =
    countDelta === 0
      ? "Exactly 528 tiles selected"
      : countDelta < 0
        ? `Under target by ${Math.abs(countDelta)} tiles`
        : `Over target by ${countDelta} tiles`;
  const displayedMapWidth = Math.round(
    editorWidth * editorZoom
  );
  const filteredTiles = selectedTiles.filter(tile => {
    const query = selectedSearch.trim().toLowerCase();
    if (!query) return true;

    return [
      tile.index,
      tile.x,
      tile.y,
      tile.group,
      `${tile.x},${tile.y}`,
      `g${tile.group}`
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  function saveLocal(nextStatus = "Saved locally.") {
    const savedAt = new Date().toISOString();
    window.localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        selectedKeys: setToSnapshot(
          selectedKeysRef.current
        ),
        imageAlignment: alignment,
        displaySettings,
        tool,
        editorWidth,
        editorZoom,
        savedAt
      })
    );
    setLastSavedAt(savedAt);
    setStatus(nextStatus);
  }

  useEffect(() => {
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      return undefined;
    }

    const timer = window.setTimeout(() => {
      const savedAt = new Date().toISOString();
      window.localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          selectedKeys: setToSnapshot(
            selectedKeysRef.current
          ),
          imageAlignment: alignment,
          displaySettings,
          tool,
          editorWidth,
          editorZoom,
          savedAt
        })
      );
      setLastSavedAt(savedAt);
      setStatus("Autosaved locally.");
    }, 350);

    return () => window.clearTimeout(timer);
  }, [
    alignment,
    displaySettings,
    editorWidth,
    editorZoom,
    selectedKeys,
    tool
  ]);

  function pushHistory(previousSet) {
    setUndoStack(stack => [
      ...stack.slice(-99),
      setToSnapshot(previousSet)
    ]);
    setRedoStack([]);
  }

  function commitSelection(nextSet, message) {
    const previousSet = selectedKeysRef.current;
    if (setsEqual(previousSet, nextSet)) {
      if (message) setStatus(message);
      return;
    }

    pushHistory(previousSet);
    selectedKeysRef.current = nextSet;
    setSelectedKeys(nextSet);
    if (message) setStatus(message);
  }

  function applyTileAction(currentSet, key, action) {
    const nextSet = new Set(currentSet);

    if (action === "erase") {
      nextSet.delete(key);
    } else if (action === "toggle") {
      if (nextSet.has(key)) {
        nextSet.delete(key);
      } else {
        nextSet.add(key);
      }
    } else {
      nextSet.add(key);
    }

    return nextSet;
  }

  function handleCellKeyboard(event, x, y) {
    if (
      event.key !== "Enter" &&
      event.key !== " "
    ) {
      return;
    }

    event.preventDefault();
    const action = event.shiftKey ? "erase" : tool;
    const key = tileKey(x, y);
    commitSelection(
      applyTileAction(
        selectedKeysRef.current,
        key,
        action
      ),
      `Updated tile ${x},${y}.`
    );
  }

  function processPaintCell(x, y) {
    const drag = dragRef.current;
    if (!drag || drag.action === "toggle") return;

    const key = tileKey(x, y);
    if (drag.processed.has(key)) return;

    drag.processed.add(key);
    setSelectedKeys(current => {
      const next = applyTileAction(
        current,
        key,
        drag.action
      );
      selectedKeysRef.current = next;
      return next;
    });
  }

  function finishPaintAction() {
    const drag = dragRef.current;
    if (!drag) return;

    const nextSet = selectedKeysRef.current;
    if (!setsEqual(drag.startSet, nextSet)) {
      setUndoStack(stack => [
        ...stack.slice(-99),
        setToSnapshot(drag.startSet)
      ]);
      setRedoStack([]);
      setStatus("Paint action applied.");
    }

    dragRef.current = null;
  }

  useEffect(() => {
    function endOnWindowRelease() {
      finishPaintAction();
    }

    window.addEventListener(
      "pointerup",
      endOnWindowRelease
    );
    window.addEventListener(
      "pointercancel",
      endOnWindowRelease
    );

    return () => {
      window.removeEventListener(
        "pointerup",
        endOnWindowRelease
      );
      window.removeEventListener(
        "pointercancel",
        endOnWindowRelease
      );
    };
  }, []);

  function startPaint(event, x, y) {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }

    event.preventDefault();
    const action = event.shiftKey ? "erase" : tool;
    const key = tileKey(x, y);

    if (action === "toggle") {
      commitSelection(
        applyTileAction(
          selectedKeysRef.current,
          key,
          "toggle"
        ),
        `Toggled tile ${x},${y}.`
      );
      return;
    }

    dragRef.current = {
      action,
      startSet: new Set(selectedKeysRef.current),
      processed: new Set()
    };
    processPaintCell(x, y);
  }

  function undoSelection() {
    setUndoStack(stack => {
      if (stack.length === 0) return stack;

      const previousSnapshot = stack.at(-1);
      const nextUndoStack = stack.slice(0, -1);
      setRedoStack(current => [
        ...current,
        setToSnapshot(selectedKeysRef.current)
      ]);
      const previousSet = new Set(previousSnapshot);
      selectedKeysRef.current = previousSet;
      setSelectedKeys(previousSet);
      setStatus("Undo applied.");
      return nextUndoStack;
    });
  }

  function redoSelection() {
    setRedoStack(stack => {
      if (stack.length === 0) return stack;

      const nextSnapshot = stack.at(-1);
      const nextRedoStack = stack.slice(0, -1);
      setUndoStack(current => [
        ...current,
        setToSnapshot(selectedKeysRef.current)
      ]);
      const nextSet = new Set(nextSnapshot);
      selectedKeysRef.current = nextSet;
      setSelectedKeys(nextSet);
      setStatus("Redo applied.");
      return nextRedoStack;
    });
  }

  useEffect(() => {
    function handleShortcuts(event) {
      const target = event.target;
      const tagName = target?.tagName?.toLowerCase();
      const isEditable =
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable;
      const isAlignmentKey =
        event.key.startsWith("Arrow") &&
        (alignmentNudgeActive ||
          target?.closest?.(
            ".feebas-alignment-controls"
          ));

      if (isAlignmentKey) {
        event.preventDefault();
        const amount = event.shiftKey ? 10 : 1;
        const patch = {};

        if (event.key === "ArrowLeft") {
          patch.offsetX = alignment.offsetX - amount;
        }
        if (event.key === "ArrowRight") {
          patch.offsetX = alignment.offsetX + amount;
        }
        if (event.key === "ArrowUp") {
          patch.offsetY = alignment.offsetY - amount;
        }
        if (event.key === "ArrowDown") {
          patch.offsetY = alignment.offsetY + amount;
        }

        setAlignment(current => ({
          ...current,
          ...patch
        }));
        return;
      }

      if (!event.ctrlKey || isEditable) return;

      const key = event.key.toLowerCase();
      if (key === "z" && event.shiftKey) {
        event.preventDefault();
        redoSelection();
      } else if (key === "z") {
        event.preventDefault();
        undoSelection();
      } else if (key === "y") {
        event.preventDefault();
        redoSelection();
      }
    }

    window.addEventListener("keydown", handleShortcuts);
    return () =>
      window.removeEventListener(
        "keydown",
        handleShortcuts
      );
  }, [alignment, alignmentNudgeActive]);

  function patchDisplaySetting(key, value) {
    setDisplaySettings(current => ({
      ...current,
      [key]: value
    }));
  }

  function patchAlignment(patch) {
    setAlignment(current =>
      normalizeImageAlignment({
        ...current,
        ...patch
      })
    );
  }

  function fitImageToGrid() {
    setAlignment(FEEBAS_DEFAULT_IMAGE_ALIGNMENT);
    setStatus("Image fitted to the logical grid.");
  }

  function centerImage() {
    const bounds =
      mapStageRef.current?.getBoundingClientRect();
    if (!bounds) {
      setAlignment(current => ({
        ...current,
        offsetX: 0,
        offsetY: 0
      }));
      return;
    }

    setAlignment(current => ({
      ...current,
      offsetX:
        (bounds.width - bounds.width * current.scaleX) /
        2,
      offsetY:
        (bounds.height - bounds.height * current.scaleY) /
        2
    }));
    setStatus("Image centered under the grid.");
  }

  function handleImageUpload(file) {
    if (!file) return;

    const nextUrl = URL.createObjectURL(file);
    if (objectUrl) URL.revokeObjectURL(objectUrl);

    setObjectUrl(nextUrl);
    setImageSrc(nextUrl);
    setStatus(
      "Temporary image loaded for this browser session."
    );
  }

  function selectRow(row, selected) {
    if (row < 0 || row >= FEEBAS_GRID_HEIGHT) {
      setStatus("Rows must be 0-33.");
      return;
    }

    const nextSet = new Set(selectedKeysRef.current);
    for (let x = 0; x < FEEBAS_GRID_WIDTH; x += 1) {
      const key = tileKey(x, row);
      if (selected) {
        nextSet.add(key);
      } else {
        nextSet.delete(key);
      }
    }

    commitSelection(
      nextSet,
      selected
        ? `Selected row ${row}.`
        : `Cleared row ${row}.`
    );
  }

  function selectColumn(column, selected) {
    if (column < 0 || column >= FEEBAS_GRID_WIDTH) {
      setStatus("Columns must be 0-17.");
      return;
    }

    const nextSet = new Set(selectedKeysRef.current);
    for (let y = 0; y < FEEBAS_GRID_HEIGHT; y += 1) {
      const key = tileKey(column, y);
      if (selected) {
        nextSet.add(key);
      } else {
        nextSet.delete(key);
      }
    }

    commitSelection(
      nextSet,
      selected
        ? `Selected column ${column}.`
        : `Cleared column ${column}.`
    );
  }

  function clearAllTiles() {
    if (
      !window.confirm(
        "Clear all selected Feebas tiles?"
      )
    ) {
      return;
    }

    commitSelection(new Set(), "All tiles cleared.");
  }

  function invertSelection() {
    if (
      !window.confirm(
        "Invert all 612 tiles? This may produce more than 528 selected tiles."
      )
    ) {
      return;
    }

    const nextSet = new Set();
    for (const key of ALL_TILE_KEYS) {
      if (!selectedKeysRef.current.has(key)) {
        nextSet.add(key);
      }
    }

    commitSelection(
      nextSet,
      "Inverted all 612 logical cells."
    );
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(exportJson);
      setStatus("Copied formatted JSON.");
    } catch {
      setStatus(
        "Could not copy JSON. Select the text and copy manually."
      );
    }
  }

  function downloadJson() {
    const blob = new Blob([exportJson], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      "dppt-feebas-fishable-tiles.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("JSON download started.");
  }

  function applyImportedText(text) {
    const result = validateFeebasImportText(text);

    if (!result.ok) {
      setStatus(result.errors.join(" "));
      return;
    }

    commitSelection(
      result.selectedKeys,
      "Imported tile coordinates. Indexes and groups were recalculated."
    );
    setAlignment(result.imageAlignment);

    if (result.data?.displaySettings) {
      setDisplaySettings(current => ({
        ...current,
        ...result.data.displaySettings
      }));
    }

    if (result.warnings.length > 0) {
      setStatus(
        `Imported with warnings: ${result.warnings.slice(0, 3).join(" ")}`
      );
    }
  }

  function importJsonFile(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () =>
      applyImportedText(String(reader.result ?? ""));
    reader.onerror = () =>
      setStatus("Could not read the JSON file.");
    reader.readAsText(file);
  }

  function restoreLocalSave() {
    const nextSaved = readLocalState();
    if (!nextSaved) {
      setStatus("No local save was found.");
      return;
    }

    const nextSet = selectedSetFromSaved(nextSaved);
    commitSelection(
      nextSet,
      "Restored local save."
    );
    setAlignment(
      normalizeImageAlignment(nextSaved.imageAlignment)
    );
    setDisplaySettings({
      ...DEFAULT_DISPLAY_SETTINGS,
      ...(nextSaved.displaySettings ?? {})
    });
    setTool(nextSaved.tool || "select");
    setEditorWidth(Number(nextSaved.editorWidth) || 620);
    setEditorZoom(Number(nextSaved.editorZoom) || 1);
    setLastSavedAt(nextSaved.savedAt || null);
  }

  function clearLocalSave() {
    if (
      !window.confirm(
        "Clear this browser's saved Feebas editor state?"
      )
    ) {
      return;
    }

    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    setLastSavedAt(null);
    setStatus("Local save cleared.");
  }

  function focusTileByIndex() {
    const index = Number(goToIndex);
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index > FEEBAS_EXPECTED_TILE_COUNT - 1
    ) {
      setStatus("Enter an index from 0-527.");
      return;
    }

    const tile = selectedTiles[index];
    if (!tile) {
      setStatus(
        `Index ${index} does not exist because only ${selectedTiles.length} tiles are selected.`
      );
      return;
    }

    const key = tileKey(tile.x, tile.y);
    setFocusedKey(key);
    setStatus(`Focused index ${index}.`);

    window.setTimeout(() => {
      gridRef.current
        ?.querySelector(`[data-tile-key="${key}"]`)
        ?.focus();
    }, 0);
  }

  const groupRows = [1, 2, 3, 4].filter(
    group =>
      validation.groupCounts[group] !== undefined ||
      selectedTiles.length >= (group - 1) * FEEBAS_GROUP_SIZE
  );

  return (
    <main className="feebas-editor">
      <header className="feebas-editor-top">
        <div>
          <h1>DPPt Feebas Tile Mapping Tool</h1>
          <p>
            Developer tool - changes are stored only in this browser unless the JSON is exported.
          </p>
        </div>
        <div
          className="feebas-count-card"
          aria-live="polite"
        >
          <strong>
            Selected fishable tiles: {selectedTiles.length} / {FEEBAS_EXPECTED_TILE_COUNT}
          </strong>
          <span>Total map squares: {FEEBAS_TOTAL_SQUARES}</span>
          <span
            className={
              countDelta === 0
                ? "feebas-good"
                : countDelta > 0
                  ? "feebas-warn"
                  : "feebas-muted"
            }
          >
            {countStatus}
          </span>
        </div>
      </header>

      <p
        className="feebas-status"
        aria-live="polite"
      >
        {status}
      </p>

      <div className="feebas-layout">
        <section className="feebas-map-panel">
          <div className="feebas-map-toolbar">
            <NumberControl
              label="Editor width"
              value={editorWidth}
              min={360}
              max={1100}
              step={10}
              onChange={setEditorWidth}
            />
            <NumberControl
              label="Editor zoom"
              value={editorZoom}
              min={0.5}
              max={2.5}
              step={0.05}
              onChange={setEditorZoom}
            />
          </div>

          <div className="feebas-map-scroll">
            <div
              className={
                displaySettings.showHeaders
                  ? "feebas-map-shell has-headers"
                  : "feebas-map-shell"
              }
              style={{
                width: `${displayedMapWidth}px`
              }}
            >
              {displaySettings.showHeaders && (
                <div className="feebas-corner-header" />
              )}

              {displaySettings.showHeaders && (
                <div className="feebas-column-headers">
                  {Array.from({
                    length: FEEBAS_GRID_WIDTH
                  }).map((_, x) => (
                    <span key={x}>{x}</span>
                  ))}
                </div>
              )}

              {displaySettings.showHeaders && (
                <div className="feebas-row-headers">
                  {Array.from({
                    length: FEEBAS_GRID_HEIGHT
                  }).map((_, y) => (
                    <span key={y}>{y}</span>
                  ))}
                </div>
              )}

              <div
                ref={mapStageRef}
                className="feebas-map-stage"
              >
                <img
                  className="feebas-map-image"
                  src={imageSrc}
                  alt=""
                  draggable="false"
                  style={{
                    left: `${alignment.offsetX}px`,
                    top: `${alignment.offsetY}px`,
                    width: `${alignment.scaleX * 100}%`,
                    height: `${alignment.scaleY * 100}%`,
                    opacity: alignment.opacity
                  }}
                />

                <div
                  ref={gridRef}
                  className={[
                    "feebas-tile-grid",
                    displaySettings.showGridLines
                      ? "show-grid-lines"
                      : "",
                    displaySettings.dimUnselected
                      ? "dim-unselected"
                      : "",
                    displaySettings.showGroups
                      ? "show-groups"
                      : ""
                  ].join(" ")}
                  onPointerLeave={() => {
                    if (dragRef.current) {
                      dragRef.current.paused = true;
                    }
                  }}
                  onPointerUp={finishPaintAction}
                >
                  {ALL_TILE_KEYS.map(key => {
                    const [xValue, yValue] =
                      key.split(":");
                    const x = Number(xValue);
                    const y = Number(yValue);
                    const selected =
                      selectedKeys.has(key);
                    const meta = tileMeta.get(key);
                    const groupLabel = meta
                      ? groupLabelForIndex(meta.index)
                      : "";
                    const classes = [
                      "feebas-cell",
                      selected ? "is-selected" : "",
                      focusedKey === key
                        ? "is-focused-target"
                        : "",
                      meta
                        ? `group-${meta.group}`
                        : ""
                    ].join(" ");

                    return (
                      <button
                        key={key}
                        type="button"
                        data-tile-key={key}
                        className={classes}
                        aria-pressed={selected}
                        aria-label={`Tile x ${x}, y ${y}, ${selected ? "selected" : "unselected"}${meta ? `, fishable index ${meta.index}` : ""}`}
                        onPointerDown={event =>
                          startPaint(event, x, y)
                        }
                        onPointerEnter={() =>
                          processPaintCell(x, y)
                        }
                        onKeyDown={event =>
                          handleCellKeyboard(
                            event,
                            x,
                            y
                          )
                        }
                      >
                        <span className="feebas-cell-check">
                          {selected ? "+" : ""}
                        </span>
                        {displaySettings.showIndexes &&
                          meta && (
                            <strong>{meta.index}</strong>
                          )}
                        {displaySettings.showGroups &&
                          meta && (
                            <em>{groupLabel}</em>
                          )}
                        {displaySettings.showCoordinates && (
                          <small>
                            {x},{y}
                          </small>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <section className="feebas-panel feebas-display-panel">
            <h2>Map Display</h2>
            <div className="feebas-toggle-grid">
              <ToggleField
                label="Show grid lines"
                checked={displaySettings.showGridLines}
                onChange={value =>
                  patchDisplaySetting(
                    "showGridLines",
                    value
                  )
                }
              />
              <ToggleField
                label="Show coordinates"
                checked={displaySettings.showCoordinates}
                onChange={value =>
                  patchDisplaySetting(
                    "showCoordinates",
                    value
                  )
                }
              />
              <ToggleField
                label="Show selected-tile indexes"
                checked={displaySettings.showIndexes}
                onChange={value =>
                  patchDisplaySetting(
                    "showIndexes",
                    value
                  )
                }
              />
              <ToggleField
                label="Show row and column headers"
                checked={displaySettings.showHeaders}
                onChange={value =>
                  patchDisplaySetting(
                    "showHeaders",
                    value
                  )
                }
              />
              <ToggleField
                label="Dim unselected tiles"
                checked={displaySettings.dimUnselected}
                onChange={value =>
                  patchDisplaySetting(
                    "dimUnselected",
                    value
                  )
                }
              />
              <ToggleField
                label="Show 132-tile groups"
                checked={displaySettings.showGroups}
                onChange={value =>
                  patchDisplaySetting(
                    "showGroups",
                    value
                  )
                }
              />
            </div>
          </section>
        </section>

        <aside className="feebas-side-panel">
          <section className="feebas-panel">
            <h2>Selection Tools</h2>
            <div className="feebas-segmented">
              {["select", "erase", "toggle"].map(
                option => (
                  <button
                    key={option}
                    type="button"
                    className={
                      tool === option ? "active" : ""
                    }
                    aria-pressed={tool === option}
                    onClick={() => setTool(option)}
                  >
                    {option[0].toUpperCase() +
                      option.slice(1)}
                  </button>
                )
              )}
            </div>
            <p className="feebas-help">
              Shift + click or drag erases. Toggle mode only changes the clicked cell.
            </p>
            <div className="feebas-actions">
              <button
                type="button"
                onClick={undoSelection}
                disabled={undoStack.length === 0}
              >
                Undo
              </button>
              <button
                type="button"
                onClick={redoSelection}
                disabled={redoStack.length === 0}
              >
                Redo
              </button>
            </div>
          </section>

          <section className="feebas-panel">
            <h2>Bulk Tools</h2>
            <div className="feebas-bulk-row">
              <label className="feebas-field">
                <span>Row 0-33</span>
                <input
                  type="number"
                  min="0"
                  max="33"
                  value={rowTarget}
                  onChange={event =>
                    setRowTarget(
                      Number(event.target.value)
                    )
                  }
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  selectRow(rowTarget, true)
                }
              >
                Select Row
              </button>
              <button
                type="button"
                onClick={() =>
                  selectRow(rowTarget, false)
                }
              >
                Clear Row
              </button>
            </div>
            <div className="feebas-bulk-row">
              <label className="feebas-field">
                <span>Column 0-17</span>
                <input
                  type="number"
                  min="0"
                  max="17"
                  value={columnTarget}
                  onChange={event =>
                    setColumnTarget(
                      Number(event.target.value)
                    )
                  }
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  selectColumn(columnTarget, true)
                }
              >
                Select Column
              </button>
              <button
                type="button"
                onClick={() =>
                  selectColumn(columnTarget, false)
                }
              >
                Clear Column
              </button>
            </div>
            <div className="feebas-actions">
              <button
                type="button"
                className="feebas-danger"
                onClick={clearAllTiles}
              >
                Clear All Selected Tiles
              </button>
              <button
                type="button"
                onClick={invertSelection}
              >
                Invert Selection
              </button>
            </div>
          </section>

          <section className="feebas-panel feebas-alignment-controls">
            <h2>Image Alignment</h2>
            <label className="feebas-file-input">
              <span>Temporary map image</span>
              <input
                type="file"
                accept="image/*"
                onChange={event =>
                  handleImageUpload(
                    event.target.files?.[0]
                  )
                }
              />
            </label>
            <NumberControl
              label="Image X offset"
              value={alignment.offsetX}
              min={-600}
              max={600}
              step={0.1}
              onChange={value =>
                patchAlignment({ offsetX: value })
              }
            />
            <NumberControl
              label="Image Y offset"
              value={alignment.offsetY}
              min={-900}
              max={900}
              step={0.1}
              onChange={value =>
                patchAlignment({ offsetY: value })
              }
            />
            <NumberControl
              label="Image horizontal scale"
              value={alignment.scaleX}
              min={0.1}
              max={4}
              step={0.01}
              onChange={value =>
                patchAlignment({ scaleX: value })
              }
            />
            <NumberControl
              label="Image vertical scale"
              value={alignment.scaleY}
              min={0.1}
              max={4}
              step={0.01}
              onChange={value =>
                patchAlignment({ scaleY: value })
              }
            />
            <NumberControl
              label="Image opacity"
              value={alignment.opacity}
              min={0}
              max={1}
              step={0.01}
              onChange={value =>
                patchAlignment({ opacity: value })
              }
            />
            <ToggleField
              label="Enable arrow-key nudging"
              checked={alignmentNudgeActive}
              onChange={setAlignmentNudgeActive}
            />
            <div className="feebas-actions">
              <button
                type="button"
                onClick={() =>
                  setAlignment(
                    FEEBAS_DEFAULT_IMAGE_ALIGNMENT
                  )
                }
              >
                Reset Image Alignment
              </button>
              <button
                type="button"
                onClick={fitImageToGrid}
              >
                Fit Image To Grid
              </button>
              <button
                type="button"
                onClick={centerImage}
              >
                Center Image
              </button>
            </div>
          </section>

          <section className="feebas-panel">
            <h2>Validation Audit</h2>
            <dl className="feebas-audit-list">
              <div>
                <dt>Grid dimensions valid</dt>
                <dd>Yes</dd>
              </div>
              <div>
                <dt>Coordinates in bounds</dt>
                <dd>Yes</dd>
              </div>
              <div>
                <dt>Duplicate coordinates</dt>
                <dd>
                  {validation.duplicateCoordinates}
                </dd>
              </div>
              <div>
                <dt>Selected count</dt>
                <dd>{validation.selectedCount}</dd>
              </div>
              {[1, 2, 3, 4].map(group => (
                <div key={group}>
                  <dt>Group {group} count</dt>
                  <dd>
                    {validation.groupCounts[group] ?? 0}
                  </dd>
                </div>
              ))}
              <div>
                <dt>Ready for calculator use</dt>
                <dd>
                  {validation.ready ? "Yes" : "No"}
                </dd>
              </div>
            </dl>
            <p className="feebas-help">
              This validates the dataset structure only; it does not prove the selected physical tiles are correct.
            </p>
          </section>

          <section className="feebas-panel">
            <h2>132-Tile Groups</h2>
            <div className="feebas-group-summary">
              {groupRows.length === 0 ? (
                <p>No selected groups yet.</p>
              ) : (
                groupRows.map(group => (
                  <span
                    key={group}
                    className={`feebas-group-pill group-${group}`}
                  >
                    G{group}: {validation.groupCounts[group] ?? 0}
                  </span>
                ))
              )}
            </div>
          </section>

          <section className="feebas-panel">
            <h2>Local Persistence</h2>
            <p className="feebas-help">
              Most recent local save: {formatSaveTime(lastSavedAt)}
            </p>
            <div className="feebas-actions">
              <button
                type="button"
                onClick={() => saveLocal()}
              >
                Save Locally
              </button>
              <button
                type="button"
                onClick={restoreLocalSave}
              >
                Restore Local Save
              </button>
              <button
                type="button"
                className="feebas-danger"
                onClick={clearLocalSave}
              >
                Clear Local Save
              </button>
            </div>
          </section>

          <section className="feebas-panel">
            <h2>Import / Export JSON</h2>
            {selectedTiles.length !==
              FEEBAS_EXPECTED_TILE_COUNT && (
              <p className="feebas-warning">
                Warning: this file contains {selectedTiles.length} selected tiles; 528 are expected.
              </p>
            )}
            <div className="feebas-actions">
              <button
                type="button"
                onClick={copyJson}
              >
                Copy JSON
              </button>
              <button
                type="button"
                onClick={downloadJson}
              >
                Download JSON
              </button>
            </div>
            <label className="feebas-file-input">
              <span>Import JSON file</span>
              <input
                type="file"
                accept="application/json,.json"
                onChange={event =>
                  importJsonFile(
                    event.target.files?.[0]
                  )
                }
              />
            </label>
            <label className="feebas-field">
              <span>Paste JSON</span>
              <textarea
                value={importDraft}
                onChange={event =>
                  setImportDraft(event.target.value)
                }
                rows="7"
              />
            </label>
            <button
              type="button"
              onClick={() =>
                applyImportedText(importDraft)
              }
              disabled={!importDraft.trim()}
            >
              Import Pasted JSON
            </button>
            <details>
              <summary>Preview exported JSON</summary>
              <textarea
                className="feebas-json-preview"
                readOnly
                value={exportJson}
                rows="10"
              />
            </details>
          </section>

          <section className="feebas-panel">
            <h2>Selected-Tile List</h2>
            <label className="feebas-field">
              <span>Search selected tiles</span>
              <input
                value={selectedSearch}
                onChange={event =>
                  setSelectedSearch(event.target.value)
                }
                placeholder="index, x,y, or G2"
              />
            </label>
            <div className="feebas-jump-row">
              <label className="feebas-field">
                <span>Go to fishable index</span>
                <input
                  type="number"
                  min="0"
                  max="527"
                  value={goToIndex}
                  onChange={event =>
                    setGoToIndex(event.target.value)
                  }
                />
              </label>
              <button
                type="button"
                onClick={focusTileByIndex}
              >
                Go
              </button>
            </div>
            <div className="feebas-selected-list">
              {filteredTiles.length === 0 ? (
                <p>No selected tiles match.</p>
              ) : (
                filteredTiles.map(tile => {
                  const key = tileKey(tile.x, tile.y);
                  return (
                    <button
                      key={key}
                      type="button"
                      className={
                        focusedKey === key
                          ? "active"
                          : ""
                      }
                      onClick={() => {
                        setFocusedKey(key);
                        window.setTimeout(() => {
                          gridRef.current
                            ?.querySelector(
                              `[data-tile-key="${key}"]`
                            )
                            ?.focus();
                        }, 0);
                      }}
                    >
                      <strong>Index {tile.index}</strong>
                      <span>X: {tile.x}</span>
                      <span>Y: {tile.y}</span>
                      <span>Group: {tile.group}</span>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

export default FeebasTileEditorPage;
