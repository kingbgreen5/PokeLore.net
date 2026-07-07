import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename =
  fileURLToPath(import.meta.url);
const __dirname =
  path.dirname(__filename);
const rootDir =
  path.resolve(__dirname, "..");
const dataDir =
  path.join(rootDir, "public", "data");
const movesDir =
  path.join(dataDir, "moves");
const movesIndexPath =
  path.join(dataDir, "movesIndex.json");
const legacyMovesPath =
  path.join(dataDir, "moves.json");

const POKEAPI_CSV_BASE =
  "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv";
const REQUEST_DELAY_MS = 80;
const args = new Set(process.argv.slice(2));
const shouldWrite = args.has("--write");
const isDryRun =
  args.has("--dry-run") || !shouldWrite;

function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

async function readJson(filePath) {
  return JSON.parse(
    await fs.readFile(filePath, "utf8")
  );
}

async function writeJson(filePath, data) {
  await fs.writeFile(
    filePath,
    `${JSON.stringify(data, null, 2)}\n`
  );
}

async function fetchText(url) {
  const response = await fetch(url);

  if (!response.ok) {
    const body =
      await response.text();

    throw new Error(
      `PokeAPI CSV returned ${response.status} for ${url}${
        body ? `: ${body.slice(0, 160)}` : ""
      }`
    );
  }

  const text = await response.text();
  await sleep(REQUEST_DELAY_MS);

  return text;
}

function cleanCsvText(text) {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function displayName(slug) {
  return String(slug ?? "")
    .split("-")
    .filter(Boolean)
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const source = String(text ?? "");

  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    const nextChar = source[index + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }

      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\r" || char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";

      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      continue;
    }

    field += char;
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter(currentRow =>
    currentRow.some(value => value !== "")
  );
}

function parseCsvRecords(text) {
  const [
    header = [],
    ...rows
  ] = parseCsvRows(text);

  return rows.map(row =>
    Object.fromEntries(
      header.map((key, index) => [
        key,
        row[index] ?? ""
      ])
    )
  );
}

function buildFlagDetailsById(
  flagsCsv,
  flagProseCsv
) {
  const detailsById = new Map();

  for (const flag of parseCsvRecords(flagsCsv)) {
    if (!flag.id || !flag.identifier) {
      continue;
    }

    detailsById.set(flag.id, {
      name: flag.identifier,
      displayName:
        displayName(flag.identifier),
      description: null
    });
  }

  for (const prose of parseCsvRecords(flagProseCsv)) {
    if (
      prose.local_language_id !== "9" ||
      !detailsById.has(prose.move_flag_id)
    ) {
      continue;
    }

    const details =
      detailsById.get(prose.move_flag_id);

    details.displayName =
      prose.name || details.displayName;
    details.description =
      cleanCsvText(prose.description);
  }

  return detailsById;
}

async function buildMoveFlagsByMove(
  movesById
) {
  const flagsByMove = new Map();
  const [
    flagsCsv,
    flagProseCsv,
    flagMapCsv
  ] = await Promise.all([
    fetchText(
      `${POKEAPI_CSV_BASE}/move_flags.csv`
    ),
    fetchText(
      `${POKEAPI_CSV_BASE}/move_flag_prose.csv`
    ),
    fetchText(
      `${POKEAPI_CSV_BASE}/move_flag_map.csv`
    )
  ]);
  const flagDetailsById =
    buildFlagDetailsById(
      flagsCsv,
      flagProseCsv
    );

  console.log(
    `Found ${flagDetailsById.size} move flags.`
  );

  for (const mapping of parseCsvRecords(
    flagMapCsv
  )) {
    const moveName =
      movesById.get(
        Number(mapping.move_id)
      );
    const flagDetails =
      flagDetailsById.get(
        mapping.move_flag_id
      );

    if (!moveName || !flagDetails) {
      continue;
    }

    if (!flagsByMove.has(moveName)) {
      flagsByMove.set(moveName, []);
    }

    flagsByMove
      .get(moveName)
      .push(flagDetails);
  }

  return flagsByMove;
}

function normalizeFlag(flag) {
  if (typeof flag === "string") {
    return {
      name: flag,
      displayName: displayName(flag),
      description: null
    };
  }

  return {
    name: flag?.name ?? "",
    displayName:
      flag?.displayName ??
      displayName(flag?.name),
    description:
      flag?.description ?? null
  };
}

function normalizeFlags(flags = []) {
  return flags
    .map(normalizeFlag)
    .filter(flag => flag.name);
}

function flagsMatch(currentFlags, nextFlags) {
  return (
    JSON.stringify(
      normalizeFlags(currentFlags)
    ) ===
    JSON.stringify(
      normalizeFlags(nextFlags)
    )
  );
}

function updateIndexRecordFlags(
  record,
  flags
) {
  if (!record) {
    return false;
  }

  if (
    "flags" in record &&
    flagsMatch(record.flags, flags)
  ) {
    return false;
  }

  record.flags = flags;
  return true;
}

async function updateMoveFlags() {
  const files = (
    await fs.readdir(movesDir)
  )
    .filter(file => file.endsWith(".json"))
    .sort();

  const movesIndex =
    await readJson(movesIndexPath);
  const legacyMoves =
    await readJson(legacyMovesPath);
  const indexByName = new Map(
    movesIndex.map(move => [
      move.name,
      move
    ])
  );
  const movesById = new Map();

  for (const file of files) {
    const move =
      await readJson(
        path.join(movesDir, file)
      );

    if (move?.id && move?.name) {
      movesById.set(
        move.id,
        move.name
      );
    }
  }

  const flagsByMove =
    await buildMoveFlagsByMove(
      movesById
    );

  const summary = {
    checked: 0,
    changedDetails: 0,
    changedIndexRecords: 0,
    changedLegacyRecords: 0,
    writtenDetails: 0,
    failed: 0
  };
  const failures = [];

  console.log(
    isDryRun
      ? "Running move flag update in dry-run mode."
      : "Running move flag update in write mode."
  );

  for (const file of files) {
    const filePath =
      path.join(movesDir, file);
    const move =
      await readJson(filePath);

    try {
      const nextFlags =
        flagsByMove.get(move.name) ?? [];

      summary.checked += 1;

      if (
        !("flags" in move) ||
        !flagsMatch(
          move.flags,
          nextFlags
        )
      ) {
        summary.changedDetails += 1;

        console.log(
          `${move.name}: ${JSON.stringify(
            move.flags ?? []
          )} -> ${JSON.stringify(
            nextFlags
          )}`
        );

        move.flags = nextFlags;

        if (!isDryRun) {
          await writeJson(
            filePath,
            move
          );
          summary.writtenDetails += 1;
        }
      }

      if (
        updateIndexRecordFlags(
          indexByName.get(move.name),
          nextFlags
        )
      ) {
        summary.changedIndexRecords += 1;
      }

      if (
        updateIndexRecordFlags(
          legacyMoves[move.name],
          nextFlags
        )
      ) {
        summary.changedLegacyRecords += 1;
      }
    } catch (error) {
      summary.failed += 1;
      failures.push({
        move: move.name,
        error: error.message
      });

      console.error(
        `Skipping ${move.name}: ${error.message}`
      );
    }
  }

  if (!isDryRun) {
    await writeJson(
      movesIndexPath,
      movesIndex
    );
    await writeJson(
      legacyMovesPath,
      legacyMoves
    );
  }

  console.log("\nMove flag update summary:");
  console.log(
    `Checked: ${summary.checked}`
  );
  console.log(
    `Changed detail files: ${summary.changedDetails}`
  );
  console.log(
    `Changed movesIndex records: ${summary.changedIndexRecords}`
  );
  console.log(
    `Changed legacy moves records: ${summary.changedLegacyRecords}`
  );
  console.log(
    `Written detail files: ${summary.writtenDetails}`
  );
  console.log(
    `Failed: ${summary.failed}`
  );

  if (failures.length) {
    console.log("\nFailures:");
    failures.forEach(failure => {
      console.log(
        `- ${failure.move}: ${failure.error}`
      );
    });
  }

  if (isDryRun) {
    console.log(
      "\nNo files were written. Run with --write to apply changes."
    );
  }
}

updateMoveFlags().catch(error => {
  console.error(
    "Move flag update failed:",
    error
  );
  process.exitCode = 1;
});
