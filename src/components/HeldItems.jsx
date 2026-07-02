import {
  useEffect,
  useMemo,
  useState
} from "react";
import { Link } from "react-router-dom";
import CollapsibleSection from "./CollapsibleSection";
import useSessionState from "../hooks/useSessionState";
import { sortVersions } from "../constants/versionOrder";

function capitalize(text) {
  return String(text ?? "")
    .split("-")
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function groupVersionsByRarity(
  versionDetails = []
) {
  const grouped = new Map();

  versionDetails.forEach(detail => {
    const rarity =
      detail.rarity ?? "unknown";

    if (!grouped.has(rarity)) {
      grouped.set(rarity, []);
    }

    grouped
      .get(rarity)
      .push(detail.version);
  });

  return Array.from(grouped.entries())
    .map(([rarity, versions]) => ({
      rarity,
      versions: sortVersions(versions)
    }))
    .sort(
      (a, b) =>
        Number(b.rarity) -
          Number(a.rarity) ||
        String(a.rarity).localeCompare(
          String(b.rarity)
        )
    );
}

function HeldItems({
  pokemonId
}) {
  const [expanded, setExpanded] =
    useSessionState(
      `pokemon:${pokemonId}:held-items-expanded`,
      false
    );
  const [heldItemData, setHeldItemData] =
    useState(null);

  useEffect(() => {
    async function loadHeldItems() {
      try {
        setHeldItemData(null);

        const response = await fetch(
          `/data/pokemonHeldItems/${pokemonId}.json`
        );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        if (data.heldItems?.length) {
          setHeldItemData(data);
        }
      } catch (error) {
        console.warn(
          "Failed to load held item data:",
          error
        );
      }
    }

    loadHeldItems();
  }, [pokemonId]);

  const heldItems = useMemo(
    () =>
      heldItemData?.heldItems ?? [],
    [heldItemData]
  );

  if (!heldItems.length) {
    return null;
  }

  return (
    <CollapsibleSection
      title="Held Items"
      summary={`${heldItems.length} item${
        heldItems.length === 1 ? "" : "s"
      }`}
      expanded={expanded}
      onToggle={() =>
        setExpanded(!expanded)
      }
      style={{
        marginTop: "1rem"
      }}
      contentStyle={{
        display: "grid",
        gap: "1rem",
        marginTop: "1rem",
        textAlign: "left"
      }}
    >
      {heldItems.map(heldItem => (
        <article
          key={heldItem.item.name}
          style={{
            border: "1px solid #666",
            borderRadius: "12px",
            padding: "1rem"
          }}
        >
          <Link
            to={`/item/${heldItem.item.name}`}
            style={{
              alignItems: "center",
              display: "flex",
              gap: ".75rem",
              marginBottom: ".75rem"
            }}
          >
            {heldItem.item.sprite && (
              <img
                src={heldItem.item.sprite}
                alt=""
                style={{
                  height: "32px",
                  imageRendering: "pixelated",
                  width: "32px"
                }}
              />
            )}
            <strong>
              {heldItem.item.displayName}
            </strong>
          </Link>

          <div
            style={{
              display: "grid",
              gap: ".75rem"
            }}
          >
            {groupVersionsByRarity(
              heldItem.versionDetails
            ).map(group => (
              <div
                key={group.rarity}
                style={{
                  borderTop: "1px solid #444",
                  paddingTop: ".75rem"
                }}
              >
                <strong>
                  {group.rarity === "unknown"
                    ? "Unknown rate"
                    : `${group.rarity}% chance`}
                </strong>
                <p
                  style={{
                    margin: ".35rem 0 0"
                  }}
                >
                  {group.versions
                    .map(capitalize)
                    .join(", ")}
                </p>
              </div>
            ))}
          </div>
        </article>
      ))}
    </CollapsibleSection>
  );
}

export default HeldItems;
