import { useState } from "react";

function capitalize(text) {
  return text
    .split("-")
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function DexEntryCard({ entries }) {
  const [expanded, setExpanded] =
    useState(false);




  return (
    <div
      style={{
        border: "2px solid #706363",
        borderRadius: "12px",
        padding: ".4rem",
        marginBottom: "1rem"
      }}
    >
      {/* Header */}

      <div
        onClick={() =>
          setExpanded(!expanded)
        }
        style={{
          cursor: "pointer",
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center"
        }}
      >
        <h2>Pokédex Entries</h2>

        <p>
          {entries.length} entries
        </p>
      </div>

      {/* Expanded Content */}

      {expanded && (
        <div
          style={{
            marginTop: "1rem"
          }}
        >
          {entries.map(
            (entry, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "1rem",
                  paddingBottom:
                    "1rem",
                  borderBottom:
                    "1px solid #444"
                }}
              >
                <div
                  style={{
                    fontWeight:
                      "bold",
                    marginBottom:
                      ".5rem"
                  }}
                >
         {entry.versions
    ?.map(capitalize)
    .join(" / ")}
                </div>

                <div>
                  {entry.text}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default DexEntryCard;