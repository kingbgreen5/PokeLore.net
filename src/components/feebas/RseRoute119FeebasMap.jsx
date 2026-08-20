import { useMemo, useState } from "react";
import {
  RSE_FEEBAS_GRID_HEIGHT,
  RSE_FEEBAS_GRID_WIDTH,
  getRoute119FeebasTileBySpotId,
  route119FeebasAudit,
  route119FeebasTiles
} from "../../utils/rseFeebasCalculator";
import route119FeebasData from "../../data/feebas/rseRoute119FeebasFishingSpots.draft.json";
import "./RseRoute119FeebasMap.css";

export const RSE_ROUTE_119_MAP_IMAGE_SRC =
  "/images/maps/route-119-feebas-map.png";

const DEFAULT_CELL_SIZE = 32;
const ROUTE_119_IMAGE_NATIVE_WIDTH = 635;
const ROUTE_119_IMAGE_NATIVE_HEIGHT = 1609;
const DEFAULT_ALIGNMENT =
  route119FeebasData.imageAlignment ?? {
    offsetX: 0,
    offsetY: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1
  };

function getTileStyle(tile) {
  return {
    left: `${(tile.x / RSE_FEEBAS_GRID_WIDTH) * 100}%`,
    top: `${(tile.y / RSE_FEEBAS_GRID_HEIGHT) * 100}%`,
    width: `${100 / RSE_FEEBAS_GRID_WIDTH}%`,
    height: `${100 / RSE_FEEBAS_GRID_HEIGHT}%`
  };
}

function buildHighlightEntries(spotIds) {
  const byCoordinate = new Map();
  const warnings = [];

  spotIds.forEach((spotId, index) => {
    try {
      const tile =
        getRoute119FeebasTileBySpotId(Number(spotId));
      const key = `${tile.x}:${tile.y}`;
      const entry = byCoordinate.get(key) ?? {
        tile,
        results: []
      };

      entry.results.push({
        resultNumber: index + 1,
        spotId: Number(spotId)
      });
      byCoordinate.set(key, entry);
    } catch (error) {
      warnings.push(error.message);
    }
  });

  return {
    entries: Array.from(byCoordinate.values()),
    warnings
  };
}

function getPriorityTitle(tile) {
  const values = tile.candidateValues ?? [];
  const visibleValues = values.slice(0, 12);
  const remaining =
    values.length > visibleValues.length
      ? `\n+${values.length - visibleValues.length} more`
      : "";

  return [
    `Tile x${tile.x},y${tile.y}`,
    `Overlap count: ${tile.count}`,
    `Appears in ${tile.count} possible Feebas pattern${tile.count === 1 ? "" : "s"}`,
    values.length > 0
      ? `Candidate values:\n${visibleValues.join(", ")}${remaining}`
      : null
  ]
    .filter(Boolean)
    .join("\n");
}

function getPriorityStyle(tile) {
  const intensity = Math.max(
    0.18,
    Math.min(1, Number(tile.displayIntensity) || 0)
  );

  return {
    ...getTileStyle(tile),
    "--priority-intensity": intensity
  };
}

function RseRoute119FeebasMap({
  spotIds = [],
  priorityTiles = [],
  priorityDisplayMode = "tiered",
  recommendedTiles = [],
  selectedRecommendedTileKey = "",
  onRecommendedTileClick,
  showAllFishingSpots = false,
  showGrid = true,
  showMapImage = true,
  mapImageSrc = RSE_ROUTE_119_MAP_IMAGE_SRC,
  imageAlignment = DEFAULT_ALIGNMENT,
  zoom = 1,
  className = ""
}) {
  const [imageFailed, setImageFailed] =
    useState(false);
  const highlightEntries = useMemo(
    () => buildHighlightEntries(spotIds),
    [spotIds]
  );
  const displayWidth =
    RSE_FEEBAS_GRID_WIDTH * DEFAULT_CELL_SIZE;
  const displayHeight =
    RSE_FEEBAS_GRID_HEIGHT * DEFAULT_CELL_SIZE;
  const safeZoom = Math.max(
    0.2,
    Math.min(3, Number(zoom) || 1)
  );
  const imageStyle = {
    left: `${imageAlignment.offsetX}px`,
    top: `${imageAlignment.offsetY}px`,
    width: `${ROUTE_119_IMAGE_NATIVE_WIDTH * imageAlignment.scaleX}px`,
    height: `${ROUTE_119_IMAGE_NATIVE_HEIGHT * imageAlignment.scaleY}px`,
    opacity: imageAlignment.opacity
  };

  if (!route119FeebasAudit.valid) {
    return (
      <section
        className="rse-route119-map-error"
        role="alert"
      >
        <h2>Route 119 dataset error</h2>
        <ul>
          {route119FeebasAudit.errors.map(error => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <figure
      className={`rse-route119-map ${className}`}
      aria-label="Route 119 Feebas fishing spot map"
    >
      <div className="rse-route119-map-scroll">
        <div
          className="rse-route119-map-zoom-shell"
          style={{
            width: `${displayWidth * safeZoom}px`,
            height: `${displayHeight * safeZoom}px`
          }}
        >
          <div
            className="rse-route119-map-frame"
            style={{
              width: `${displayWidth}px`,
              height: `${displayHeight}px`,
              transform: `scale(${safeZoom})`
            }}
          >
            {showMapImage && !imageFailed && (
              <img
                src={mapImageSrc}
                alt="Route 119 Feebas map"
                draggable="false"
                style={imageStyle}
                onError={() => setImageFailed(true)}
              />
            )}

            {showMapImage && imageFailed && (
              <div className="rse-route119-map-missing">
                Map image not found at {mapImageSrc}
              </div>
            )}

            <div className="rse-route119-map-overlay">
              {showGrid && (
                <span className="rse-route119-grid-lines" />
              )}

              {showAllFishingSpots &&
                route119FeebasTiles.map(tile => (
                  <span
                    key={tile.spotId}
                    className="rse-route119-fishing-spot"
                    style={getTileStyle(tile)}
                    title={`Spot ID ${tile.spotId}; Coordinate x ${tile.x}, y ${tile.y}`}
                  />
                ))}

              {priorityTiles.map(tile => (
                <button
                  key={`priority-${tile.x}:${tile.y}`}
                  type="button"
                  className={`rse-route119-priority-tile ${priorityDisplayMode} ${tile.priorityTier ?? "low"}`}
                  style={getPriorityStyle(tile)}
                  title={getPriorityTitle(tile)}
                  aria-label={`Tile x ${tile.x}, y ${tile.y}; overlap count ${tile.count}`}
                >
                  {tile.displayLabel ?? tile.count}
                </button>
              ))}

              {recommendedTiles.map(tile => {
                const key = `${tile.x}:${tile.y}`;

                return (
                  <button
                    key={`recommended-${key}`}
                    type="button"
                    className={`rse-route119-recommended-tile ${selectedRecommendedTileKey === key ? "selected" : ""}`}
                    style={getTileStyle(tile)}
                    title={tile.title}
                    aria-label={tile.title}
                    onClick={() => onRecommendedTileClick?.(tile)}
                  >
                    {tile.label ?? tile.rank}
                  </button>
                );
              })}

              {highlightEntries.entries.map(entry => {
                const resultLabel = entry.results
                  .map(result => result.resultNumber)
                  .join(",");
                const spotLabel = [
                  ...new Set(
                    entry.results.map(result => result.spotId)
                  )
                ].join(",");

                return (
                  <button
                    key={`${entry.tile.x}:${entry.tile.y}`}
                    type="button"
                    className="rse-route119-highlight"
                    style={getTileStyle(entry.tile)}
                    title={`Result ${resultLabel}; Spot ID ${spotLabel}; Coordinate x ${entry.tile.x}, y ${entry.tile.y}`}
                    aria-label={`Result ${resultLabel}; Spot ID ${spotLabel}; Coordinate x ${entry.tile.x}, y ${entry.tile.y}`}
                  >
                    {resultLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {highlightEntries.warnings.length > 0 && (
        <figcaption
          className="rse-route119-map-warning"
          role="alert"
        >
          {highlightEntries.warnings.join(" ")}
        </figcaption>
      )}
    </figure>
  );
}

export default RseRoute119FeebasMap;
