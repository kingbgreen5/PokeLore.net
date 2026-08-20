import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  RSE_FEEBAS_EXPECTED_SPOT_COUNT,
  RSE_FEEBAS_FIRST_MAPPED_SPOT_ID,
  RSE_FEEBAS_GRID_HEIGHT,
  RSE_FEEBAS_INTERNAL_SPOT_COUNT,
  RSE_FEEBAS_LAST_MAPPED_SPOT_ID,
  RSE_FEEBAS_REJECTED_GENERATED_SPOT_IDS,
  RSE_FEEBAS_SECTIONS,
  createRseFeebasExportData,
  createTileSetFromCoordinates,
  createValidationSummary,
  isCoordinateInBounds,
  makeAllTileKeys,
  parseTileKey,
  selectedSetToSpotTiles,
  tileKey,
  validateRseFeebasImportText
} from "../utils/rseFeebasTileEditorUtils";
import "./RseFeebasTileEditorPage.css";

const LOCAL_STORAGE_KEY =
  "pokelore.rseFeebasTileEditor.v1";
const DEFAULT_MAP_IMAGE =
  "/images/maps/route-119-feebas-map.png";
const GRID_WIDTH = 40;
const SECTION_TRANSITION_SPOT_IDS = new Set([
  131,
  132,
  298,
  299
]);
const DEFAULT_CELL_SIZE = 22;
const DEFAULT_IMAGE_ALIGNMENT = {
  offsetX: 0,
  offsetY: 0,
  scaleX: 1,
  scaleY: 1,
  opacity: 1
};

const DEFAULT_DISPLAY_SETTINGS = {
  showGrid: true,
  showCoordinates: false,
  showSpotIds: true,
  showSectionBoundaries: true,
  dimUnselected: false,
  showOnlySelected: false
};

function readLocalState() {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(
      window.localStorage.getItem(LOCAL_STORAGE_KEY)
    );
  } catch {
    return null;
  }
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

function normalizeNumber(value, fallback) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue)
    ? numericValue
    : fallback;
}

function normalizeAlignment(value) {
  return {
    offsetX: normalizeNumber(
      value?.offsetX,
      DEFAULT_IMAGE_ALIGNMENT.offsetX
    ),
    offsetY: normalizeNumber(
      value?.offsetY,
      DEFAULT_IMAGE_ALIGNMENT.offsetY
    ),
    scaleX: Math.max(
      0.01,
      normalizeNumber(
        value?.scaleX,
        DEFAULT_IMAGE_ALIGNMENT.scaleX
      )
    ),
    scaleY: Math.max(
      0.01,
      normalizeNumber(
        value?.scaleY,
        DEFAULT_IMAGE_ALIGNMENT.scaleY
      )
    ),
    opacity: Math.min(
      1,
      Math.max(
        0,
        normalizeNumber(
          value?.opacity,
          DEFAULT_IMAGE_ALIGNMENT.opacity
        )
      )
    )
  };
}

function selectedSetFromSaved(saved) {
  if (Array.isArray(saved?.selectedKeys)) {
    return new Set(
      saved.selectedKeys.filter(key =>
        isCoordinateInBounds(parseTileKey(key), GRID_WIDTH)
      )
    );
  }

  if (Array.isArray(saved?.tiles)) {
    return createTileSetFromCoordinates(
      saved.tiles,
      GRID_WIDTH
    );
  }

  return new Set();
}

function formatSaveTime(value) {
  if (!value) return "Never";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatPixel(value) {
  return Number.isFinite(Number(value))
    ? Number(value).toFixed(2)
    : "-";
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
    <label className="rse-feebas-field">
      <span>{label}</span>
      <div className="rse-feebas-range-row">
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
    <label className="rse-feebas-toggle-field">
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

function AuditRow({
  label,
  value,
  ok
}) {
  return (
    <div className={ok ? "is-ok" : "is-warning"}>
      <dt>{label}</dt>
      <dd>
        {value} <span>{ok ? "OK" : "Needs work"}</span>
      </dd>
    </div>
  );
}

function sectionName(sectionId) {
  return sectionId ? `Section ${sectionId}` : "None";
}

function RseFeebasTileEditorPage() {
  const saved = useMemo(() => readLocalState(), []);
  const [selectedKeys, setSelectedKeys] = useState(() =>
    selectedSetFromSaved(saved)
  );
  const [alignment, setAlignment] = useState(() =>
    normalizeAlignment(
      saved?.manualImageAlignment ??
        saved?.imageAlignment ??
        DEFAULT_IMAGE_ALIGNMENT
    )
  );
  const [displaySettings, setDisplaySettings] =
    useState(() => ({
      ...DEFAULT_DISPLAY_SETTINGS,
      ...(saved?.displaySettings ?? {})
    }));
  const [tool, setTool] = useState(
    saved?.tool || "select"
  );
  const [cellSize, setCellSize] = useState(
    Number(saved?.cellSize) || DEFAULT_CELL_SIZE
  );
  const [editorZoom, setEditorZoom] = useState(
    Number(saved?.editorZoom) || 1
  );
  const [imageSrc, setImageSrc] = useState(
    DEFAULT_MAP_IMAGE
  );
  const [usingTemporaryImage, setUsingTemporaryImage] =
    useState(false);
  const [imageAvailable, setImageAvailable] =
    useState(true);
  const [imageNaturalSize, setImageNaturalSize] =
    useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [status, setStatus] = useState("");
  const [importDraft, setImportDraft] = useState("");
  const [selectedSearch, setSelectedSearch] =
    useState("");
  const [focusedKey, setFocusedKey] = useState(null);
  const [goToSpotId, setGoToSpotId] = useState("");
  const [rowTarget, setRowTarget] = useState(0);
  const [columnTarget, setColumnTarget] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState(
    saved?.savedAt || null
  );
  const [inspectedCoordinate, setInspectedCoordinate] =
    useState(null);
  const hasHydratedRef = useRef(false);
  const selectedKeysRef = useRef(selectedKeys);
  const gridRef = useRef(null);
  const dragRef = useRef(null);
  const objectUrlRef = useRef(null);

  useEffect(() => {
    selectedKeysRef.current = selectedKeys;
  }, [selectedKeys]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const allTileKeys = useMemo(
    () => makeAllTileKeys(GRID_WIDTH),
    []
  );
  const allCells = useMemo(
    () =>
      allTileKeys.map(key => ({
        key,
        ...parseTileKey(key)
      })),
    [allTileKeys]
  );
  const selectedTiles = useMemo(
    () => selectedSetToSpotTiles(selectedKeys, GRID_WIDTH),
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
    () => createValidationSummary(selectedKeys, GRID_WIDTH),
    [selectedKeys]
  );
  const exportData = useMemo(
    () =>
      createRseFeebasExportData({
        selectedKeys,
        gridWidth: GRID_WIDTH,
        imageAlignment: alignment
      }),
    [alignment, selectedKeys]
  );
  const exportJson = useMemo(
    () => JSON.stringify(exportData, null, 2),
    [exportData]
  );
  const selectedCount = selectedTiles.length;
  const countDelta =
    selectedCount - RSE_FEEBAS_EXPECTED_SPOT_COUNT;
  const countStatus =
    countDelta === 0
      ? "Exactly 444 mapped spots selected"
      : countDelta < 0
        ? `Under target by ${Math.abs(countDelta)} spots`
        : `Over target by ${countDelta} spots`;
  const potentialFeebasLocations = selectedTiles.filter(
    tile => tile.feebasSelectable
  ).length;
  const displayCellSize = cellSize * editorZoom;
  const gridWidthPx = GRID_WIDTH * displayCellSize;
  const gridHeightPx = RSE_FEEBAS_GRID_HEIGHT * displayCellSize;
  const nativeImageWidth = imageNaturalSize?.width ?? 0;
  const nativeImageHeight = imageNaturalSize?.height ?? 0;
  const displayedImageWidth =
    nativeImageWidth * alignment.scaleX * editorZoom;
  const displayedImageHeight =
    nativeImageHeight * alignment.scaleY * editorZoom;
  const imageLeft = alignment.offsetX * editorZoom;
  const imageTop = alignment.offsetY * editorZoom;
  const workspacePadding = 96;
  const workspaceWidth = Math.max(
    gridWidthPx,
    imageLeft + displayedImageWidth,
    displayedImageWidth
  );
  const workspaceHeight = Math.max(
    gridHeightPx,
    imageTop + displayedImageHeight,
    displayedImageHeight
  );
  const inspectedDetails = useMemo(() => {
    if (!inspectedCoordinate) return null;

    const key = tileKey(
      inspectedCoordinate.x,
      inspectedCoordinate.y
    );
    const meta = tileMeta.get(key);

    return {
      ...inspectedCoordinate,
      selected: selectedKeys.has(key),
      spotId: meta?.spotId ?? null,
      section: meta?.section ?? null,
      feebasSelectable: meta?.feebasSelectable ?? null
    };
  }, [
    inspectedCoordinate,
    selectedKeys,
    tileMeta
  ]);
  const filteredTiles = selectedTiles.filter(tile => {
    const query = selectedSearch.trim().toLowerCase();
    if (!query) return true;

    return [
      tile.spotId,
      tile.x,
      tile.y,
      tile.section,
      `${tile.x},${tile.y}`,
      `section ${tile.section}`,
      tile.feebasSelectable ? "yes" : "no"
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  const createLocalSnapshot = useCallback(savedAt => {
    return {
      selectedKeys: setToSnapshot(
        selectedKeysRef.current
      ),
      gridWidth: GRID_WIDTH,
      manualImageAlignment: alignment,
      imageAlignment: alignment,
      displaySettings,
      tool,
      cellSize,
      editorZoom,
      savedAt
    };
  }, [
    alignment,
    cellSize,
    displaySettings,
    editorZoom,
    tool
  ]);

  const writeLocalSnapshot = useCallback(snapshot => {
    try {
      window.localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(snapshot)
      );
      return true;
    } catch {
      setStatus("Could not save editor state locally.");
      return false;
    }
  }, []);

  function saveLocal(nextStatus = "Saved locally.") {
    const savedAt = new Date().toISOString();
    if (writeLocalSnapshot(createLocalSnapshot(savedAt))) {
      setLastSavedAt(savedAt);
      setStatus(nextStatus);
    }
  }

  useEffect(() => {
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      return undefined;
    }

    const timer = window.setTimeout(() => {
      const savedAt = new Date().toISOString();
      if (
        writeLocalSnapshot(createLocalSnapshot(savedAt))
      ) {
        setLastSavedAt(savedAt);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [
    alignment,
    cellSize,
    createLocalSnapshot,
    displaySettings,
    editorZoom,
    selectedKeys,
    tool,
    writeLocalSnapshot
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
    if (tool === "inspect") {
      setInspectedCoordinate({ x, y });
      setFocusedKey(tileKey(x, y));
      return;
    }

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
    setInspectedCoordinate({ x, y });
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
    const key = tileKey(x, y);
    setInspectedCoordinate({ x, y });

    if (tool === "inspect") {
      setFocusedKey(key);
      return;
    }

    const action = event.shiftKey ? "erase" : tool;

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
  }, []);

  function patchDisplaySetting(key, value) {
    setDisplaySettings(current => ({
      ...current,
      [key]: value
    }));
  }

  function patchAlignment(patch) {
    setAlignment(current =>
      normalizeAlignment({
        ...current,
        ...patch
      })
    );
  }

  function resetAlignment() {
    setAlignment(DEFAULT_IMAGE_ALIGNMENT);
    setStatus(
      "Image reset to native size at scale 1. It is not fitted to the grid."
    );
  }

  function centerImage() {
    setAlignment(current =>
      normalizeAlignment({
        ...current,
        offsetX:
          (GRID_WIDTH * cellSize -
            nativeImageWidth * current.scaleX) /
          2,
        offsetY:
          (RSE_FEEBAS_GRID_HEIGHT * cellSize -
            nativeImageHeight * current.scaleY) /
          2
      })
    );
    setStatus("Image centered under the logical grid.");
  }

  function handleImageUpload(file) {
    if (!file) return;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setImageSrc(objectUrl);
    setImageAvailable(true);
    setImageNaturalSize(null);
    setUsingTemporaryImage(true);
    setStatus(
      "Temporary image loaded. It will not be restored after refresh."
    );
  }

  function useDefaultImage() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setImageSrc(DEFAULT_MAP_IMAGE);
    setImageAvailable(true);
    setImageNaturalSize(null);
    setUsingTemporaryImage(false);
    setStatus("Using the default project map image.");
  }

  function selectRow(row, selected) {
    if (
      !Number.isInteger(row) ||
      row < 0 ||
      row >= RSE_FEEBAS_GRID_HEIGHT
    ) {
      setStatus("Rows must be 0-139.");
      return;
    }

    const nextSet = new Set(selectedKeysRef.current);
    for (let x = 0; x < GRID_WIDTH; x += 1) {
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
    if (
      !Number.isInteger(column) ||
      column < 0 ||
      column >= GRID_WIDTH
    ) {
      setStatus(`Columns must be 0-${GRID_WIDTH - 1}.`);
      return;
    }

    const nextSet = new Set(selectedKeysRef.current);
    for (let y = 0; y < RSE_FEEBAS_GRID_HEIGHT; y += 1) {
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
        "Clear all selected Route 119 fishing spots?"
      )
    ) {
      return;
    }

    commitSelection(new Set(), "All tiles cleared.");
  }

  function invertSelection() {
    if (
      !window.confirm(
        `Invert all ${allTileKeys.length} logical cells?`
      )
    ) {
      return;
    }

    const nextSet = new Set();
    for (const key of allTileKeys) {
      if (!selectedKeysRef.current.has(key)) {
        nextSet.add(key);
      }
    }

    commitSelection(
      nextSet,
      `Inverted all ${allTileKeys.length} logical cells.`
    );
  }

  function shiftSelection(deltaX, deltaY, label) {
    if (selectedKeysRef.current.size === 0) {
      setStatus("No selected tiles to shift.");
      return;
    }

    const shiftedCoordinates = Array.from(
      selectedKeysRef.current
    ).map(key => {
      const coordinate = parseTileKey(key);
      return {
        x: coordinate.x + deltaX,
        y: coordinate.y + deltaY
      };
    });
    const inBoundsCoordinates =
      shiftedCoordinates.filter(coordinate =>
        isCoordinateInBounds(coordinate, GRID_WIDTH)
      );
    const droppedCount =
      shiftedCoordinates.length - inBoundsCoordinates.length;

    if (
      droppedCount > 0 &&
      !window.confirm(
        `Shifting ${label} would move ${droppedCount} selected tile${droppedCount === 1 ? "" : "s"} outside the grid. Drop those out-of-bounds tiles and continue?`
      )
    ) {
      return;
    }

    commitSelection(
      createTileSetFromCoordinates(
        inBoundsCoordinates,
        GRID_WIDTH
      ),
      droppedCount > 0
        ? `Shifted selected tiles ${label}; dropped ${droppedCount} out-of-bounds tile${droppedCount === 1 ? "" : "s"}.`
        : `Shifted selected tiles ${label}.`
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
      "rse-route119-feebas-fishing-spots.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("JSON download started.");
  }

  function applyImportedText(text) {
    const result = validateRseFeebasImportText(
      text,
      GRID_WIDTH
    );

    if (!result.ok) {
      setStatus(result.errors.join(" "));
      return;
    }

    commitSelection(
      result.selectedKeys,
      "Imported coordinates. Spot IDs were recalculated from row-major ordering."
    );

    const importedAlignment =
      result.data?.manualImageAlignment ??
      result.data?.imageAlignment;
    if (importedAlignment) {
      setAlignment(normalizeAlignment(importedAlignment));
    }

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
    selectedKeysRef.current = nextSet;
    setSelectedKeys(nextSet);
    setAlignment(
      normalizeAlignment(
        nextSaved.manualImageAlignment ??
          nextSaved.imageAlignment
      )
    );
    setDisplaySettings({
      ...DEFAULT_DISPLAY_SETTINGS,
      ...(nextSaved.displaySettings ?? {})
    });
    setTool(nextSaved.tool || "select");
    setCellSize(
      Number(nextSaved.cellSize) || DEFAULT_CELL_SIZE
    );
    setEditorZoom(Number(nextSaved.editorZoom) || 1);
    setLastSavedAt(nextSaved.savedAt || null);
    setFocusedKey(null);
    setStatus("Restored local save.");
  }

  function clearLocalSave() {
    if (
      !window.confirm(
        "Clear this browser's saved Route 119 editor state?"
      )
    ) {
      return;
    }

    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    setLastSavedAt(null);
    setStatus("Local save cleared.");
  }

  function focusTile(key, message) {
    setFocusedKey(key);
    setStatus(message);

    window.setTimeout(() => {
      const cell = gridRef.current?.querySelector(
        `[data-tile-key="${key}"]`
      );
      cell?.focus();
      cell?.scrollIntoView({
        block: "center",
        inline: "center",
        behavior: "smooth"
      });
    }, 0);
  }

  function focusSpotId(spotId) {
    if (
      !Number.isInteger(spotId) ||
      spotId < RSE_FEEBAS_FIRST_MAPPED_SPOT_ID ||
      spotId > RSE_FEEBAS_LAST_MAPPED_SPOT_ID
    ) {
      setStatus("Enter a mapped spot ID from 4-447.");
      return;
    }

    const tile =
      selectedTiles[
        spotId - RSE_FEEBAS_FIRST_MAPPED_SPOT_ID
      ];
    if (!tile) {
      setStatus(
        `Spot ${spotId} does not exist because only ${selectedTiles.length} spots are selected.`
      );
      return;
    }

    focusTile(
      tileKey(tile.x, tile.y),
      `Focused spot ${spotId}.`
    );
  }

  function focusSpotById() {
    focusSpotId(Number(goToSpotId));
  }

  function jumpToRow(row, label) {
    const visibleRow = Math.min(
      RSE_FEEBAS_GRID_HEIGHT - 1,
      Math.max(0, Math.round(row))
    );
    const key = tileKey(0, visibleRow);
    const suffix =
      visibleRow === row
        ? "."
        : `; nearest visible editor row is ${visibleRow}.`;
    focusTile(key, `Jumped to ${label}${suffix}`);
  }

  return (
    <main className="rse-feebas-editor">
      <header className="rse-feebas-editor-top">
        <div>
          <h1>
            RSE Route 119 Feebas Tile Mapping Tool
          </h1>
          <p>
            Manual 40-column Route 119 grid with a movable native-size image reference underneath.
          </p>
        </div>
        <div
          className="rse-feebas-count-card"
          aria-live="polite"
        >
          <strong>
            Mapped fishing tiles: {selectedCount} / {RSE_FEEBAS_EXPECTED_SPOT_COUNT}
          </strong>
          <span>
            Internal game spot IDs: 1-{RSE_FEEBAS_INTERNAL_SPOT_COUNT}
          </span>
          <span>
            Mapped spot IDs: {RSE_FEEBAS_FIRST_MAPPED_SPOT_ID}-{RSE_FEEBAS_LAST_MAPPED_SPOT_ID}
          </span>
          <span>
            Mapped Feebas locations: {potentialFeebasLocations}
          </span>
          <span
            className={
              countDelta === 0
                ? "rse-feebas-good"
                : countDelta > 0
                  ? "rse-feebas-warn"
                  : "rse-feebas-muted"
            }
          >
            {countStatus}
          </span>
          <span>
            Grid: {GRID_WIDTH} x {RSE_FEEBAS_GRID_HEIGHT}
          </span>
        </div>
      </header>

      <p
        className="rse-feebas-status"
        aria-live="polite"
      >
        {status}
      </p>

      <div className="rse-feebas-layout">
        <section className="rse-feebas-map-panel">
          <div className="rse-feebas-map-toolbar">
            <NumberControl
              label="Cell size"
              value={cellSize}
              min={12}
              max={42}
              step={1}
              onChange={setCellSize}
            />
            <NumberControl
              label="Editor zoom"
              value={editorZoom}
              min={0.25}
              max={4}
              step={0.05}
              onChange={setEditorZoom}
            />
            <div className="rse-feebas-jump-actions">
              <button
                type="button"
                onClick={() => jumpToRow(0, "top")}
              >
                Top
              </button>
              {RSE_FEEBAS_SECTIONS.map(section => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() =>
                    focusSpotId(section.spotIdStart)
                  }
                >
                  Jump to {section.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => jumpToRow(139, "bottom")}
              >
                Bottom
              </button>
            </div>
          </div>

          <div className="rse-feebas-map-scroll">
            <div
              className="rse-feebas-workspace"
              style={{
                padding: `${workspacePadding}px`,
                width: `${workspaceWidth + workspacePadding * 2}px`,
                height: `${workspaceHeight + workspacePadding * 2}px`
              }}
            >
              {imageAvailable ? (
                <img
                  className="rse-feebas-map-image"
                  src={imageSrc}
                  alt=""
                  draggable="false"
                  onLoad={event => {
                    setImageAvailable(true);
                    setImageNaturalSize({
                      width:
                        event.currentTarget.naturalWidth,
                      height:
                        event.currentTarget.naturalHeight
                    });
                  }}
                  onError={() => setImageAvailable(false)}
                  style={{
                    left: `${workspacePadding + imageLeft}px`,
                    top: `${workspacePadding + imageTop}px`,
                    width: `${displayedImageWidth}px`,
                    height: `${displayedImageHeight}px`,
                    opacity: alignment.opacity
                  }}
                />
              ) : (
                <div className="rse-feebas-missing-image">
                  Add /public/images/maps/route-119-feebas-map.png or upload a temporary image.
                </div>
              )}

              <div
                className="rse-feebas-map-stage"
                style={{
                  left: `${workspacePadding}px`,
                  top: `${workspacePadding}px`,
                  width: `${gridWidthPx}px`,
                  height: `${gridHeightPx}px`
                }}
              >
                <div
                  ref={gridRef}
                  className={[
                    "rse-feebas-tile-grid",
                    displaySettings.showGrid
                      ? "show-grid"
                      : "",
                    displaySettings.dimUnselected
                      ? "dim-unselected"
                      : "",
                    displaySettings.showOnlySelected
                      ? "show-only-selected"
                      : "",
                    displaySettings.showSectionBoundaries
                      ? "show-section-boundaries"
                      : ""
                  ].join(" ")}
                  style={{
                    gridTemplateColumns: `repeat(${GRID_WIDTH}, ${displayCellSize}px)`,
                    gridTemplateRows: `repeat(${RSE_FEEBAS_GRID_HEIGHT}, ${displayCellSize}px)`
                  }}
                  onPointerUp={finishPaintAction}
                >
                  {allCells.map(({ key, x, y }) => {
                    const selected =
                      selectedKeys.has(key);
                    const meta = tileMeta.get(key);
                    const isSectionTransition =
                      Boolean(meta) &&
                      SECTION_TRANSITION_SPOT_IDS.has(
                        meta.spotId
                      );
                    const classes = [
                      "rse-feebas-cell",
                      selected ? "is-selected" : "",
                      focusedKey === key
                        ? "is-focused-target"
                        : "",
                      inspectedCoordinate?.x === x &&
                      inspectedCoordinate?.y === y
                        ? "is-inspected"
                        : "",
                      isSectionTransition
                        ? "is-section-transition"
                        : ""
                    ].join(" ");

                    return (
                      <button
                        key={key}
                        type="button"
                        data-tile-key={key}
                        className={classes}
                        aria-pressed={selected}
                        aria-label={`Map coordinate x ${x}, y ${y}, ${selected ? "selected" : "unselected"}${meta ? `, spot ${meta.spotId}, ${sectionName(meta.section)}` : ""}`}
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
                        <span className="rse-feebas-cell-mark">
                          {selected ? "+" : ""}
                        </span>
                        {displaySettings.showSpotIds &&
                          meta && (
                            <strong>
                              {meta.spotId}
                            </strong>
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

          <section className="rse-feebas-panel">
            <h2>Map Display</h2>
            <div className="rse-feebas-toggle-grid">
              <ToggleField
                label="Show grid"
                checked={displaySettings.showGrid}
                onChange={value =>
                  patchDisplaySetting("showGrid", value)
                }
              />
              <ToggleField
                label="Show coordinates"
                checked={
                  displaySettings.showCoordinates
                }
                onChange={value =>
                  patchDisplaySetting(
                    "showCoordinates",
                    value
                  )
                }
              />
              <ToggleField
                label="Show spot IDs"
                checked={displaySettings.showSpotIds}
                onChange={value =>
                  patchDisplaySetting(
                    "showSpotIds",
                    value
                  )
                }
              />
              <ToggleField
                label="Show section transitions"
                checked={
                  displaySettings.showSectionBoundaries
                }
                onChange={value =>
                  patchDisplaySetting(
                    "showSectionBoundaries",
                    value
                  )
                }
              />
              <ToggleField
                label="Dim unselected cells"
                checked={displaySettings.dimUnselected}
                onChange={value =>
                  patchDisplaySetting(
                    "dimUnselected",
                    value
                  )
                }
              />
              <ToggleField
                label="Show only selected cells"
                checked={
                  displaySettings.showOnlySelected
                }
                onChange={value =>
                  patchDisplaySetting(
                    "showOnlySelected",
                    value
                  )
                }
              />
            </div>
          </section>
        </section>

        <aside className="rse-feebas-side-panel">
          <section className="rse-feebas-panel">
            <h2>Selection Tools</h2>
            <div className="rse-feebas-segmented">
              {["select", "erase", "toggle", "inspect"].map(
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
            <p className="rse-feebas-help">
              Shift + click or drag erases. The image is only a movable reference layer.
            </p>
            <div className="rse-feebas-actions">
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

          <section className="rse-feebas-panel rse-feebas-alignment-controls">
            <h2>Image Alignment</h2>
            <label className="rse-feebas-file-input">
              <span>Temporary Route 119 image</span>
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
            <p className="rse-feebas-help">
              {usingTemporaryImage
                ? "Using a temporary object URL. The image itself is not saved to localStorage."
                : "Using /images/maps/route-119-feebas-map.png when it exists."}
            </p>
            <NumberControl
              label="Image X offset"
              value={alignment.offsetX}
              min={-3000}
              max={3000}
              step={0.25}
              onChange={value =>
                patchAlignment({ offsetX: value })
              }
            />
            <NumberControl
              label="Image Y offset"
              value={alignment.offsetY}
              min={-6000}
              max={6000}
              step={0.25}
              onChange={value =>
                patchAlignment({ offsetY: value })
              }
            />
            <NumberControl
              label="Image scale X"
              value={alignment.scaleX}
              min={0.05}
              max={8}
              step={0.01}
              onChange={value =>
                patchAlignment({ scaleX: value })
              }
            />
            <NumberControl
              label="Image scale Y"
              value={alignment.scaleY}
              min={0.05}
              max={8}
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
            <div className="rse-feebas-actions">
              <button
                type="button"
                onClick={resetAlignment}
              >
                Reset Native Image
              </button>
              <button
                type="button"
                onClick={centerImage}
              >
                Center Image
              </button>
              <button
                type="button"
                onClick={useDefaultImage}
              >
                Use Default Image
              </button>
            </div>
          </section>

          <section className="rse-feebas-panel">
            <h2>Image Diagnostics</h2>
            <dl className="rse-feebas-diagnostics">
              <div>
                <dt>Image natural width</dt>
                <dd>{nativeImageWidth || "-"}</dd>
              </div>
              <div>
                <dt>Image natural height</dt>
                <dd>{nativeImageHeight || "-"}</dd>
              </div>
              <div>
                <dt>Image displayed width</dt>
                <dd>{formatPixel(displayedImageWidth)}</dd>
              </div>
              <div>
                <dt>Image displayed height</dt>
                <dd>{formatPixel(displayedImageHeight)}</dd>
              </div>
              <div>
                <dt>Grid displayed width</dt>
                <dd>{formatPixel(gridWidthPx)}</dd>
              </div>
              <div>
                <dt>Grid displayed height</dt>
                <dd>{formatPixel(gridHeightPx)}</dd>
              </div>
              <div>
                <dt>Image X offset</dt>
                <dd>{formatPixel(alignment.offsetX)}</dd>
              </div>
              <div>
                <dt>Image Y offset</dt>
                <dd>{formatPixel(alignment.offsetY)}</dd>
              </div>
            </dl>
          </section>

          <section className="rse-feebas-panel">
            <h2>Map Click Diagnostics</h2>
            {inspectedDetails ? (
              <dl className="rse-feebas-diagnostics">
                <div>
                  <dt>Map coordinate</dt>
                  <dd>
                    x {inspectedDetails.x}, y {inspectedDetails.y}
                  </dd>
                </div>
                <div>
                  <dt>Selected</dt>
                  <dd>
                    {inspectedDetails.selected
                      ? "Yes"
                      : "No"}
                  </dd>
                </div>
                <div>
                  <dt>Spot ID</dt>
                  <dd>
                    {inspectedDetails.spotId ?? "-"}
                  </dd>
                </div>
                <div>
                  <dt>Section</dt>
                  <dd>
                    {sectionName(
                      inspectedDetails.section
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Feebas selectable</dt>
                  <dd>
                    {inspectedDetails.feebasSelectable ===
                    null
                      ? "-"
                      : inspectedDetails.feebasSelectable
                        ? "Yes"
                        : "No"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="rse-feebas-help">
                Hover or inspect a tile to view coordinate metadata.
              </p>
            )}
          </section>

          <section className="rse-feebas-panel">
            <h2>Section Validation</h2>
            <dl className="rse-feebas-section-counts">
              {RSE_FEEBAS_SECTIONS.map(section => {
                const count =
                  validation.sectionCounts[
                    section.id
                  ] ?? 0;
                const ok =
                  count === section.mappedExpectedSpotCount;
                return (
                  <div
                    key={section.id}
                    className={
                      ok ? "is-ok" : "is-warning"
                    }
                  >
                    <dt>
                      {section.label}: internal IDs {section.spotIdStart}-{section.spotIdEnd}
                    </dt>
                    <dd>
                      mapped {count} / {section.mappedExpectedSpotCount}
                    </dd>
                  </div>
                );
              })}
              <div
                className={
                  selectedCount ===
                  RSE_FEEBAS_EXPECTED_SPOT_COUNT
                    ? "is-ok"
                    : "is-warning"
                }
              >
                <dt>Total</dt>
                <dd>
                  {selectedCount} / {RSE_FEEBAS_EXPECTED_SPOT_COUNT}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rse-feebas-panel">
            <h2>Bulk Editing</h2>
            <div className="rse-feebas-bulk-row">
              <label className="rse-feebas-field">
                <span>Row 0-139</span>
                <input
                  type="number"
                  min="0"
                  max="139"
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
            <div className="rse-feebas-bulk-row">
              <label className="rse-feebas-field">
                <span>Column 0-39</span>
                <input
                  type="number"
                  min="0"
                  max={GRID_WIDTH - 1}
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
            <div className="rse-feebas-actions">
              <button
                type="button"
                className="rse-feebas-danger"
                onClick={clearAllTiles}
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={invertSelection}
              >
                Invert Selection
              </button>
            </div>
            <div className="rse-feebas-shift-pad">
              <button
                type="button"
                onClick={() =>
                  shiftSelection(0, -1, "up")
                }
              >
                Shift Up
              </button>
              <button
                type="button"
                onClick={() =>
                  shiftSelection(-1, 0, "left")
                }
              >
                Shift Left
              </button>
              <button
                type="button"
                onClick={() =>
                  shiftSelection(1, 0, "right")
                }
              >
                Shift Right
              </button>
              <button
                type="button"
                onClick={() =>
                  shiftSelection(0, 1, "down")
                }
              >
                Shift Down
              </button>
            </div>
          </section>

          <section className="rse-feebas-panel">
            <h2>Structural Validation</h2>
            <dl className="rse-feebas-audit-list">
              <AuditRow
                label="Grid height"
                value="140"
                ok={validation.gridHeightValid}
              />
              <AuditRow
                label="Selected coordinates"
                value={`${selectedCount} / ${RSE_FEEBAS_EXPECTED_SPOT_COUNT}`}
                ok={
                  selectedCount ===
                  RSE_FEEBAS_EXPECTED_SPOT_COUNT
                }
              />
              <AuditRow
                label="Unique coordinates"
                value={validation.uniqueCoordinateCount}
                ok={
                  validation.uniqueCoordinateCount ===
                    selectedCount &&
                  validation.duplicateCoordinates === 0
                }
              />
              {RSE_FEEBAS_SECTIONS.map(section => (
                <AuditRow
                  key={section.id}
                  label={`${section.label} mapped IDs ${section.mappedSpotIdStart}-${section.mappedSpotIdEnd}`}
                  value={`${validation.sectionCounts[section.id] ?? 0} / ${section.mappedExpectedSpotCount}`}
                  ok={
                    validation.sectionCounts[
                      section.id
                    ] === section.mappedExpectedSpotCount
                  }
                />
              ))}
              <AuditRow
                label="Mapped spot IDs"
                value={
                  selectedCount > 0
                    ? `${RSE_FEEBAS_FIRST_MAPPED_SPOT_ID}-${selectedCount + RSE_FEEBAS_FIRST_MAPPED_SPOT_ID - 1}`
                    : "None"
                }
                ok={validation.spotIdsCoverRange}
              />
              <AuditRow
                label="Internal game spot IDs"
                value={`1-${RSE_FEEBAS_INTERNAL_SPOT_COUNT}`}
                ok={true}
              />
              <AuditRow
                label="Out of bounds"
                value={validation.invalidCoordinates.length}
                ok={validation.coordinatesInBounds}
              />
              <AuditRow
                label="Rejected generated IDs"
                value={RSE_FEEBAS_REJECTED_GENERATED_SPOT_IDS.join(
                  ", "
                )}
                ok={true}
              />
            </dl>
            <p className="rse-feebas-ready">
              Dataset structurally ready: {validation.ready ? "YES" : "NO"}
            </p>
          </section>

          <section className="rse-feebas-panel">
            <h2>Local Persistence</h2>
            <p className="rse-feebas-help">
              Most recent local save: {formatSaveTime(lastSavedAt)}
            </p>
            <div className="rse-feebas-actions">
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
                Restore Save
              </button>
              <button
                type="button"
                className="rse-feebas-danger"
                onClick={clearLocalSave}
              >
                Clear Local Save
              </button>
            </div>
          </section>

          <section className="rse-feebas-panel">
            <h2>Import / Export JSON</h2>
            {!validation.ready && (
              <p className="rse-feebas-warning">
                Warning: export is allowed, but the dataset is not structurally ready.
              </p>
            )}
            <div className="rse-feebas-actions">
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
            <label className="rse-feebas-file-input">
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
            <label className="rse-feebas-field">
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
                className="rse-feebas-json-preview"
                readOnly
                value={exportJson}
                rows="10"
              />
            </details>
          </section>

          <section className="rse-feebas-panel">
            <h2>Selected Spot List</h2>
            <label className="rse-feebas-field">
              <span>Search selected spots</span>
              <input
                value={selectedSearch}
                onChange={event =>
                  setSelectedSearch(event.target.value)
                }
                placeholder="spot id, x,y, section, yes/no"
              />
            </label>
            <div className="rse-feebas-jump-row">
              <label className="rse-feebas-field">
                <span>Go to spot ID</span>
                <input
                  type="number"
                  min={RSE_FEEBAS_FIRST_MAPPED_SPOT_ID}
                  max={RSE_FEEBAS_LAST_MAPPED_SPOT_ID}
                  value={goToSpotId}
                  onChange={event =>
                    setGoToSpotId(event.target.value)
                  }
                />
              </label>
              <button
                type="button"
                onClick={focusSpotById}
              >
                Go
              </button>
            </div>
            <div className="rse-feebas-selected-list">
              {filteredTiles.length === 0 ? (
                <p>No selected spots match.</p>
              ) : (
                filteredTiles.map(tile => {
                  const key = tileKey(tile.x, tile.y);
                  return (
                    <button
                      key={key}
                      type="button"
                      className={[
                        focusedKey === key
                          ? "active"
                          : "",
                        SECTION_TRANSITION_SPOT_IDS.has(
                          tile.spotId
                        )
                          ? "is-section-transition"
                          : ""
                      ].join(" ")}
                      onClick={() =>
                        focusTile(
                          key,
                          `Focused spot ${tile.spotId}.`
                        )
                      }
                    >
                      <strong>
                        Spot ID {tile.spotId}
                      </strong>
                      <span>x {tile.x}</span>
                      <span>y {tile.y}</span>
                      <span>
                        {sectionName(tile.section)}
                      </span>
                      <span>
                        Mapped coordinate
                      </span>
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

export default RseFeebasTileEditorPage;
