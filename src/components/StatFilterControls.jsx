import {
  hasActiveStatFilters,
  normalizeStatFilters,
  STAT_FILTER_FIELDS
} from "../utils/statFilters";

function StatFilterControls({
  filters,
  onChange
}) {
  const normalizedFilters =
    normalizeStatFilters(filters);
  const hasFilters =
    hasActiveStatFilters(
      normalizedFilters
    );

  function updateFilter(key, value) {
    onChange({
      ...normalizedFilters,
      [key]: value
    });
  }

  return (
    <section
      aria-label="Stat filters"
      style={{
        backgroundColor: "#202020",
        border: "1px solid #4a4a4a",
        borderRadius: "8px",
        boxSizing: "border-box",
        margin: "0 auto 1rem",
        maxWidth: "760px",
        padding: ".85rem"
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: ".75rem",
          justifyContent: "space-between",
          marginBottom: ".75rem"
        }}
      >
        <h3
          style={{
            color: "#f3f4f6",
            fontSize: "1rem",
            margin: 0
          }}
        >
          Minimum Stats
        </h3>
        {hasFilters && (
          <button
            type="button"
            onClick={() =>
              onChange(
                normalizeStatFilters({})
              )
            }
            style={{
              backgroundColor: "transparent",
              border: "1px solid #666",
              borderRadius: "6px",
              color: "#d1d5db",
              cursor: "pointer",
              fontSize: ".8rem",
              padding: ".25rem .55rem"
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gap: ".65rem",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(92px, 1fr))"
        }}
      >
        {STAT_FILTER_FIELDS.map(field => (
          <label
            key={field.key}
            style={{
              color: "#d1d5db",
              display: "grid",
              fontSize: ".8rem",
              gap: ".25rem",
              textAlign: "left"
            }}
          >
            {field.label}
            <input
              inputMode="numeric"
              min="0"
              type="number"
              value={
                normalizedFilters[
                  field.key
                ]
              }
              onChange={event =>
                updateFilter(
                  field.key,
                  event.target.value
                )
              }
              placeholder="Any"
              style={{
                backgroundColor: "#2c2c2c",
                border: "1px solid #555",
                borderRadius: "6px",
                boxSizing: "border-box",
                color: "white",
                fontSize: ".9rem",
                padding: ".45rem",
                width: "100%"
              }}
            />
          </label>
        ))}
      </div>
    </section>
  );
}

export default StatFilterControls;
