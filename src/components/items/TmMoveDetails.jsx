import {
  useEffect,
  useMemo,
  useState
} from "react";
import MoveSummaryCard from "../MoveSummaryCard";
import { compareVersionGroups } from "../../constants/versionOrder";

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

function generationForVersionGroup(
  versionGroup
) {
  if (
    [
      "red-blue",
      "yellow"
    ].includes(versionGroup)
  ) {
    return "Generation I";
  }

  if (
    [
      "gold-silver",
      "crystal"
    ].includes(versionGroup)
  ) {
    return "Generation II";
  }

  if (
    [
      "ruby-sapphire",
      "emerald",
      "firered-leafgreen",
      "colosseum",
      "xd"
    ].includes(versionGroup)
  ) {
    return "Generation III";
  }

  if (
    [
      "diamond-pearl",
      "platinum",
      "heartgold-soulsilver"
    ].includes(versionGroup)
  ) {
    return "Generation IV";
  }

  if (
    [
      "black-white",
      "black-2-white-2"
    ].includes(versionGroup)
  ) {
    return "Generation V";
  }

  if (
    [
      "x-y",
      "omega-ruby-alpha-sapphire"
    ].includes(versionGroup)
  ) {
    return "Generation VI";
  }

  if (
    [
      "sun-moon",
      "ultra-sun-ultra-moon",
      "lets-go-pikachu-lets-go-eevee"
    ].includes(versionGroup)
  ) {
    return "Generation VII";
  }

  if (
    [
      "sword-shield",
      "the-isle-of-armor",
      "the-crown-tundra",
      "brilliant-diamond-and-shining-pearl",
      "legends-arceus"
    ].includes(versionGroup)
  ) {
    return "Generation VIII";
  }

  if (
    [
      "scarlet-violet",
      "the-teal-mask",
      "the-indigo-disk"
    ].includes(versionGroup)
  ) {
    return "Generation IX";
  }

  return "Other Games";
}

function TmMoveDetails({
  item
}) {
  const [movesData, setMovesData] =
    useState({});

  const hasMachineData =
    item?.machines?.some(
      machine =>
        machine.move?.name ||
        machine.versionGroup
    ) ?? false;

  useEffect(() => {
    if (!hasMachineData) {
      return undefined;
    }

    let ignore = false;

    async function loadMoves() {
      try {
        const response =
          await fetch(
            "/data/moves.json"
          );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        if (!ignore) {
          setMovesData(data);
        }
      } catch (error) {
        console.error(
          "Failed to load move data:",
          error
        );
      }
    }

    loadMoves();

    return () => {
      ignore = true;
    };
  }, [hasMachineData]);

  const machineEntries =
    useMemo(
      () =>
        item?.machines?.filter(
          machine =>
            machine.move?.name ||
            machine.versionGroup
        ) ?? [],
      [item]
    );

  const machineRows =
    useMemo(
      () =>
        machineEntries
          .map((entry, index) => ({
            generation:
              generationForVersionGroup(
                entry.versionGroup
              ),
            key:
              entry.machineId ??
              entry.machineUrl ??
              `${entry.versionGroup}-${entry.move?.name}-${index}`,
            moveName:
              entry.move?.name,
            versionGroup:
              entry.versionGroup
          }))
          .filter(row => row.moveName)
          .sort(
            (a, b) =>
              compareVersionGroups(
                a.versionGroup,
                b.versionGroup
              )
          ),
      [machineEntries]
    );

  if (!machineEntries.length) {
    return null;
  }

  return (
    <section
      style={{
        border: "1px solid #666",
        borderRadius: "12px",
        marginBottom: "2rem",
        padding: "1rem"
      }}
    >
      <h2>Machine Moves</h2>





      <div
        style={{
          alignItems: "start",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          justifyContent: "center",
                   border:'1px',
                borderColor:"AccentColor"
        }}
      >
        {machineRows.map(row => {
          const move =
            movesData[row.moveName];

          return (
            <div
              key={row.key}
              style={{
                alignItems: "center",
                display: "flex",
                flexDirection: "column",
                // gap: ".5rem",
                width: "150px",
               border: "2px solid #555",
                // backgroundColor:"AccentColor"
                padding:".5rem",
                    borderRadius: "18px",
       
              }}
            >
              <h3
                style={{
                  fontSize: ".95rem",
                  margin: 0,
                  textAlign: "center"
                }}
              >
                {row.generation}
              </h3>

              <div
                style={{
                  fontSize: ".78rem",
                  minHeight: "2.1rem",
                  opacity: 0.82,
                  textAlign: "center"
                }}
              >
                {capitalize(
                  row.versionGroup
                )}
              </div>

              {move ? (
                <MoveSummaryCard
                  name={row.moveName}
                  move={move}
                />
              ) : (
                <div
                  style={{
                    alignItems: "center",
                    backgroundColor:
                      "#2c2c2c",
                    border: "2px solid #555",
                    borderRadius: "18px",
                    boxSizing: "border-box",
                    display: "flex",
                    minHeight: "150px",
                    padding: ".35rem",
                    textAlign: "center",
                    width: "150px"
                  }}
                >
                  {capitalize(
                    row.moveName
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default TmMoveDetails;
