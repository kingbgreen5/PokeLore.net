import { useState } from "react";
import CollapsibleSection from "./CollapsibleSection";

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

function DexEntryCard({
  entries,
  titleColor,
  titleChevron = false
}) {
  const [expanded, setExpanded] =
    useState(false);




  return (
    <CollapsibleSection
      title="Pokédex Entries"
      summary={`${entries.length} entries`}
      titleColor={titleColor}
      titleChevron={titleChevron}
      expanded={expanded}
      onToggle={() =>
        setExpanded(!expanded)
      }
      style={{
        padding: ".4rem"
      }}
      contentStyle={{
        marginTop: "1rem",
        textAlign: "left"
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
                      ".5rem",
                    textAlign: "left"
                  }}
                >
         {entry.versions
    ?.map(capitalize)
    .join(" / ")}
                </div>

                <div
                  style={{
                    textAlign: "left"
                  }}
                >
                  {entry.text}
                </div>
              </div>
            )
          )}
    </CollapsibleSection>
  );
}

export default DexEntryCard;
