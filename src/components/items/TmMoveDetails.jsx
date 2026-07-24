import {
  useEffect,
  useMemo,
  useState
} from "react";
import CollapsibleSection from "../CollapsibleSection";
import MoveSummaryCard from "../MoveSummaryCard";
import { compareVersionGroups } from "../../constants/versionOrder";
import { loadMovesMap } from "../../utils/loadMovesData";

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
      "brilliant-diamond-shining-pearl",
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

function generationRank(generation) {
  const order = [
    "Generation I",
    "Generation II",
    "Generation III",
    "Generation IV",
    "Generation V",
    "Generation VI",
    "Generation VII",
    "Generation VIII",
    "Generation IX",
    "Other Games"
  ];
  const index =
    order.indexOf(generation);

  return index === -1
    ? order.length
    : index;
}

function TmMoveDetails({
  item
}) {
  const [movesData, setMovesData] =
    useState({});
  const [expanded, setExpanded] =
    useState(false);
  const [
    selectedGeneration,
    setSelectedGeneration
  ] = useState("all");

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
        const data =
          await loadMovesMap();

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

  const generations = useMemo(
    () => [
      "all",
      ...Array.from(
        new Set(
          machineRows.map(
            row => row.generation
          )
        )
      ).sort(
        (a, b) =>
          generationRank(a) -
            generationRank(b) ||
          a.localeCompare(b)
      )
    ],
    [machineRows]
  );

  const filteredMachineRows =
    useMemo(
      () =>
        selectedGeneration === "all"
          ? machineRows
          : machineRows.filter(
              row =>
                row.generation ===
                selectedGeneration
            ),
      [
        machineRows,
        selectedGeneration
      ]
    );

  if (!machineEntries.length) {
    return null;
  }

  return (
    <CollapsibleSection
      title="Machine Moves"
      summary={`${machineRows.length} entries`}
      expanded={expanded}
      onToggle={() =>
        setExpanded(
          isExpanded => !isExpanded
        )
      }
      titleColor="#7dd3fc"
      style={{
        marginBottom: "2rem"
      }}
      contentStyle={{
        display: "grid",
        gap: "1rem",
        marginTop: "1rem"
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          justifyContent:
            "space-between"
        }}
      >
        <label
          style={{
            display: "grid",
            gap: ".35rem"
          }}
        >
          <span
            style={{
              color: "#ccc",
              fontSize: ".9rem"
            }}
          >
            Filter by generation
          </span>

          <select
            value={selectedGeneration}
            onChange={event =>
              setSelectedGeneration(
                event.target.value
              )
            }
            style={{
              backgroundColor:
                "#2c2c2c",
              border:
                "2px solid #555",
              borderRadius: "12px",
              color: "white",
              fontSize: "1rem",
              padding: ".55rem .8rem"
            }}
          >
            {generations.map(
              generation => (
                <option
                  key={generation}
                  value={generation}
                >
                  {generation === "all"
                    ? "All Generations"
                    : generation}
                </option>
              )
            )}
          </select>
        </label>
      </div>

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
        {filteredMachineRows.map(row => {
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
    </CollapsibleSection>
  );
}

export default TmMoveDetails;
