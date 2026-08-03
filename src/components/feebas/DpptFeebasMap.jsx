import { useMemo, useState } from "react";
import {
  DPPT_FEEBAS_BOUNDARY_INDEXES,
  DPPT_FEEBAS_MAP_IMAGE_SRC,
  dpptFeebasAudit,
  dpptFeebasExcludedGridCells,
  dpptFeebasTiles,
  getFeebasMapImageStyle,
  getFeebasTileByIndex,
  getFeebasTileStyle
} from "../../utils/dpptFeebasTiles";
import "./DpptFeebasMap.css";

function normalizeIndexes(indexes) {
  return indexes
    .slice(0, 4)
    .map(index => Number(index))
    .filter(Number.isInteger);
}

function normalizeAreaIndexes(areas) {
  return areas.map((area, areaIndex) => ({
    areaNumber: area.areaNumber ?? areaIndex + 1,
    indexes: Array.isArray(area.indexes)
      ? area.indexes.map(Number).filter(Number.isInteger)
      : []
  }));
}

function DpptFeebasMap({
  highlightedIndexes = [],
  highlightedAreas = [],
  mapImageSrc = DPPT_FEEBAS_MAP_IMAGE_SRC,
  mapImageAlignment,
  blockedTileOpacity = 1,
  showMapImage = true,
  showAllIndexedTiles = false,
  showAllTileIndexes = false,
  showBlockedTiles = true,
  showGridLines = true,
  showGroupBoundaries = false,
  className = ""
}) {
  const [imageFailed, setImageFailed] =
    useState(false);
  const normalizedIndexes = useMemo(
    () => normalizeIndexes(highlightedIndexes),
    [highlightedIndexes]
  );
  const normalizedAreas = useMemo(
    () => normalizeAreaIndexes(highlightedAreas),
    [highlightedAreas]
  );
  const areaEntries = useMemo(() => {
    const byCoordinate = new Map();
    const warnings = [];

    for (const area of normalizedAreas) {
      for (const index of area.indexes) {
        try {
          const tile = getFeebasTileByIndex(index);
          const key = `${tile.x}:${tile.y}`;
          const entry = byCoordinate.get(key) ?? {
            tile,
            areas: []
          };

          entry.areas.push({
            areaNumber: area.areaNumber,
            index
          });
          byCoordinate.set(key, entry);
        } catch (error) {
          warnings.push(error.message);
        }
      }
    }

    return {
      entries: Array.from(byCoordinate.values()),
      warnings
    };
  }, [normalizedAreas]);
  const highlightEntries = useMemo(() => {
    const byCoordinate = new Map();
    const warnings = [];

    for (
      let resultIndex = 0;
      resultIndex < normalizedIndexes.length;
      resultIndex += 1
    ) {
      const index = normalizedIndexes[resultIndex];
      try {
        const tile = getFeebasTileByIndex(index);
        const key = `${tile.x}:${tile.y}`;
        const entry = byCoordinate.get(key) ?? {
          tile,
          results: []
        };
        entry.results.push({
          result: resultIndex + 1,
          index
        });
        byCoordinate.set(key, entry);
      } catch (error) {
        warnings.push(error.message);
      }
    }

    for (const entry of byCoordinate.values()) {
      if (entry.results.length > 1) {
        warnings.push(
          `Multiple results share coordinate x ${entry.tile.x}, y ${entry.tile.y}.`
        );
      }
    }

    return {
      entries: Array.from(byCoordinate.values()),
      warnings
    };
  }, [normalizedIndexes]);
  const visibleBlockedTileOpacity = Number.isFinite(
    blockedTileOpacity
  )
    ? Math.min(1, Math.max(0, blockedTileOpacity))
    : 1;

  if (!dpptFeebasAudit.valid) {
    return (
      <section
        className="dppt-feebas-map-error"
        role="alert"
      >
        <h2>Feebas dataset error</h2>
        <ul>
          {dpptFeebasAudit.errors.map(error => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <figure
      className={`dppt-feebas-map ${className}`}
      aria-label="DPPt Feebas fishable tile map"
      style={{
        "--dppt-feebas-blocked-opacity":
          visibleBlockedTileOpacity
      }}
    >
      <div className="dppt-feebas-map-frame">
        {showMapImage && !imageFailed && (
          <img
            src={mapImageSrc}
            alt="Mt. Coronet Feebas lake map"
            draggable="false"
            style={getFeebasMapImageStyle(
              mapImageAlignment
            )}
            onError={() => setImageFailed(true)}
          />
        )}

        {showMapImage && imageFailed && (
          <div className="dppt-feebas-map-missing">
            Map image not found at {mapImageSrc}
          </div>
        )}

        <div
          className="dppt-feebas-overlay"
          aria-hidden="true"
        >
          {showBlockedTiles &&
            dpptFeebasExcludedGridCells.map(cell => (
              <span
                key={`${cell.x}:${cell.y}`}
                className="dppt-feebas-blocked-tile"
                style={getFeebasTileStyle(cell)}
              />
            ))}

          {showGridLines && (
            <span className="dppt-feebas-grid-lines" />
          )}

          {areaEntries.entries.map(entry => {
            const label = [
              ...new Set(
                entry.areas.map(area => area.areaNumber)
              )
            ].join("+");
            const indexes = entry.areas
              .map(area => area.index)
              .join(", ");

            return (
              <span
                key={`area-${entry.tile.x}:${entry.tile.y}`}
                className="dppt-feebas-area-tile"
                style={getFeebasTileStyle(entry.tile)}
                title={`Search area ${label}; Feebas index ${indexes}; Coordinate x ${entry.tile.x}, y ${entry.tile.y}`}
              />
            );
          })}

          {showAllIndexedTiles &&
            dpptFeebasTiles.map(tile => (
              <span
                key={tile.index}
                className="dppt-feebas-all-tile"
                style={getFeebasTileStyle(tile)}
              >
                {showAllTileIndexes && tile.index}
              </span>
            ))}

          {showGroupBoundaries &&
            DPPT_FEEBAS_BOUNDARY_INDEXES.map(index => {
              const tile = getFeebasTileByIndex(index);
              return (
                <span
                  key={index}
                  className="dppt-feebas-boundary-tile"
                  style={getFeebasTileStyle(tile)}
                >
                  {index}
                </span>
              );
            })}

          {highlightEntries.entries.map(entry => {
            const label = entry.results
              .map(result => result.result)
              .join("+");
            const indexes = entry.results
              .map(result => result.index)
              .join(", ");
            return (
              <span
                key={`${entry.tile.x}:${entry.tile.y}`}
                className="dppt-feebas-highlight-tile"
                style={getFeebasTileStyle(entry.tile)}
                title={`Result ${label}; Feebas index ${indexes}; Coordinate x ${entry.tile.x}, y ${entry.tile.y}`}
              />
            );
          })}
        </div>
      </div>

      {[...areaEntries.warnings, ...highlightEntries.warnings]
        .length > 0 && (
        <figcaption
          className="dppt-feebas-map-warning"
          role="alert"
        >
          {[
            ...areaEntries.warnings,
            ...highlightEntries.warnings
          ].join(" ")}
        </figcaption>
      )}
    </figure>
  );
}

export default DpptFeebasMap;
