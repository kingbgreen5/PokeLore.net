import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeDisplayText } from "../src/utils/normalizeText.js";

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "public", "data");
const ITEM_LOCATIONS_DIR = path.join(DATA_DIR, "itemLocations");
const ITEMS_DIR = path.join(DATA_DIR, "items");
const OUTPUT_DIR = path.join(DATA_DIR, "itemLocationsCurated");
const REPORT_PATH = path.join(
  DATA_DIR,
  "itemLocationMigrationReport.json"
);

const VERSION_TO_REGION = {
  red: "kanto",
  blue: "kanto",
  yellow: "kanto",
  firered: "kanto",
  leafgreen: "kanto",
  "lets-go-pikachu": "kanto",
  "lets-go-eevee": "kanto",

  gold: "johto",
  silver: "johto",
  crystal: "johto",
  heartgold: "johto",
  soulsilver: "johto",

  ruby: "hoenn",
  sapphire: "hoenn",
  emerald: "hoenn",
  "omega-ruby": "hoenn",
  "alpha-sapphire": "hoenn",

  diamond: "sinnoh",
  pearl: "sinnoh",
  platinum: "sinnoh",
  "brilliant-diamond": "sinnoh",
  "shining-pearl": "sinnoh",

  black: "unova",
  white: "unova",
  "black-2": "unova",
  "white-2": "unova",

  x: "kalos",
  y: "kalos",

  sun: "alola",
  moon: "alola",
  "ultra-sun": "alola",
  "ultra-moon": "alola",

  sword: "galar",
  shield: "galar",

  "legends-arceus": "hisui",

  scarlet: "paldea",
  violet: "paldea"
};

function normalizeText(text) {
  return String(normalizeDisplayText(text) ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/\bmt\./gi, "mt")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeVersionName(version) {
  return normalizeText(version)
    .replace(/^pokemon\s+/, "")
    .replace(/\s+version$/, "")
    .replace(/\s+/g, "-");
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
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

function addAlias(map, key, value) {
  const normalizedKey = normalizeText(key);
  if (!normalizedKey) return;

  if (!map.has(normalizedKey)) {
    map.set(normalizedKey, new Set());
  }

  map.get(normalizedKey).add(value);
}

function buildAliasIndexes(aliases) {
  const byRegion = new Map();
  const global = new Map();

  Object.entries(aliases).forEach(
    ([region, regionAliases]) => {
      const regionMap = new Map();

      Object.entries(regionAliases).forEach(
        ([alias, locationName]) => {
          addAlias(regionMap, alias, locationName);
          addAlias(global, alias, locationName);
        }
      );

      byRegion.set(region, regionMap);
    }
  );

  return {
    byRegion,
    global
  };
}

function getLocationDisplay(locationName, locationsByName) {
  const location = locationsByName.get(locationName);

  return (
    location?.displayName ??
    locationName
      .split("-")
      .map(
        word =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ")
  );
}

function inferRegionFromGames(games = []) {
  const regions = new Set(
    games
      .map(game =>
        VERSION_TO_REGION[
          normalizeVersionName(game)
        ]
      )
      .filter(Boolean)
  );

  if (regions.size === 1) {
    return [...regions][0];
  }

  return null;
}

function findCandidateNames({
  locationText,
  region,
  aliasIndexes,
  conflictIndexes,
  locationsByName
}) {
  const normalizedLocation =
    normalizeText(locationText);
  const candidates = new Set();

  if (region) {
    const regionMatches =
      aliasIndexes.byRegion
        .get(region)
        ?.get(normalizedLocation) ??
      new Set();

    regionMatches.forEach(candidate =>
      candidates.add(candidate)
    );
  }

  if (candidates.size === 0) {
    const globalMatches =
      aliasIndexes.global.get(
        normalizedLocation
      ) ?? new Set();

    globalMatches.forEach(candidate =>
      candidates.add(candidate)
    );
  }

  if (candidates.size === 0) {
    (
      conflictIndexes.get(normalizedLocation) ??
      []
    ).forEach(candidate =>
      candidates.add(candidate)
    );
  }

  return [...candidates].filter(candidate =>
    locationsByName.has(candidate)
  );
}

function migrateMethod({
  method,
  itemName,
  version,
  aliasIndexes,
  conflictIndexes,
  locationsByName,
  report
}) {
  if (
    !method.location ||
    typeof method.location !== "string"
  ) {
    report.summary.methodsWithoutLocation += 1;
    return {
      ...method,
      locationMatchStatus: method.location?.name
        ? "matched"
        : "no-location"
    };
  }

  const games =
    Array.isArray(method.games) &&
    method.games.length > 0
      ? method.games
      : version
        ? [version]
        : [];
  const region = inferRegionFromGames(games);
  const normalizedLocation = normalizeText(
    method.location
  );
  const candidates = findCandidateNames({
    locationText: method.location,
    region,
    aliasIndexes,
    conflictIndexes,
    locationsByName
  });

  const reportEntry = {
    item: itemName,
    version:
      version ??
      (games.length > 0
        ? games.join(", ")
        : null),
    games,
    location: method.location,
    normalizedLocation,
    region,
    candidates
  };

  if (candidates.length === 1) {
    const locationName = candidates[0];

    report.summary.matched += 1;
    report.matched.push({
      ...reportEntry,
      matchedLocation: locationName
    });

    return {
      ...method,
      location: {
        name: locationName,
        displayName: getLocationDisplay(
          locationName,
          locationsByName
        )
      },
      originalLocationText: method.location,
      locationMatchStatus: "matched"
    };
  }

  if (candidates.length > 1) {
    report.summary.ambiguous += 1;
    report.ambiguous.push({
      ...reportEntry,
      reason: "multiple-candidates"
    });

    return {
      ...method,
      locationMatchStatus: "ambiguous",
      locationCandidates: candidates
    };
  }

  report.summary.unmatched += 1;
  report.unmatched.push({
    ...reportEntry,
    reason: "no-alias-match"
  });

  return {
    ...method,
    locationMatchStatus: "unmatched"
  };
}

function migrateAcquisitionFile({
  fileData,
  sourceFile,
  aliasIndexes,
  conflictIndexes,
  locationsByName,
  report
}) {
  const itemName =
    fileData.item ??
    fileData.name ??
    fileData.slug ??
    path.basename(sourceFile, ".json");
  const migrated = {
    item: itemName,
    displayName: fileData.displayName ?? fileData.name,
    source: sourceFile,
    schemaVersion: 1
  };

  if (Array.isArray(fileData.acquisition)) {
    migrated.acquisition =
      fileData.acquisition.map(method => {
        report.summary.methodsProcessed += 1;
        return migrateMethod({
          method,
          itemName,
          aliasIndexes,
          conflictIndexes,
          locationsByName,
          report
        });
      });
  }

  if (
    Array.isArray(fileData.locationsByVersion)
  ) {
    migrated.locationsByVersion =
      fileData.locationsByVersion.map(group => ({
        ...group,
        methods: (group.methods ?? []).map(
          method => {
            report.summary.methodsProcessed += 1;
            return migrateMethod({
              method,
              itemName,
              version: group.version,
              aliasIndexes,
              conflictIndexes,
              locationsByName,
              report
            });
          }
        )
      }));
  }

  return migrated;
}

async function collectSourceFiles() {
  if (await pathExists(ITEM_LOCATIONS_DIR)) {
    const fileNames = await fs.readdir(
      ITEM_LOCATIONS_DIR
    );

    return fileNames
      .filter(fileName =>
        fileName.endsWith(".json")
      )
      .map(fileName => ({
        sourceFile: `itemLocations/${fileName}`,
        inputPath: path.join(
          ITEM_LOCATIONS_DIR,
          fileName
        ),
        outputName: fileName
      }));
  }

  const fileNames = await fs.readdir(ITEMS_DIR);

  return fileNames
    .filter(fileName => fileName.endsWith(".json"))
    .map(fileName => ({
      sourceFile: `items/${fileName}`,
      inputPath: path.join(ITEMS_DIR, fileName),
      outputName: fileName
    }));
}

async function main() {
  const [
    aliases,
    conflicts,
    locationsIndex
  ] = await Promise.all([
    readJson(
      path.join(DATA_DIR, "locationAliases.json")
    ),
    readJson(
      path.join(
        DATA_DIR,
        "locationAliasConflicts.json"
      )
    ),
    readJson(
      path.join(DATA_DIR, "locationsIndex.json")
    )
  ]);

  const locationsByName = new Map(
    locationsIndex.map(location => [
      location.name,
      location
    ])
  );
  const aliasIndexes = buildAliasIndexes(aliases);
  const conflictIndexes = new Map(
    Object.entries(conflicts).map(
      ([alias, candidates]) => [
        normalizeText(alias),
        candidates
      ]
    )
  );
  const sourceFiles = await collectSourceFiles();
  const report = {
    generatedAt: new Date().toISOString(),
    source:
      (await pathExists(ITEM_LOCATIONS_DIR))
        ? "public/data/itemLocations"
        : "public/data/items acquisition fields",
    summary: {
      filesProcessed: 0,
      methodsProcessed: 0,
      matched: 0,
      unmatched: 0,
      ambiguous: 0,
      methodsWithoutLocation: 0,
      filesWithoutAcquisition: 0
    },
    matched: [],
    unmatched: [],
    ambiguous: []
  };

  await fs.mkdir(OUTPUT_DIR, {
    recursive: true
  });

  for (const source of sourceFiles) {
    const fileData = await readJson(source.inputPath);
    const hasAcquisition =
      Array.isArray(fileData.acquisition) ||
      Array.isArray(fileData.locationsByVersion);

    if (!hasAcquisition) {
      report.summary.filesWithoutAcquisition += 1;
      continue;
    }

    const migrated = migrateAcquisitionFile({
      fileData,
      sourceFile: source.sourceFile,
      aliasIndexes,
      conflictIndexes,
      locationsByName,
      report
    });

    await writeJson(
      path.join(OUTPUT_DIR, source.outputName),
      migrated
    );
    report.summary.filesProcessed += 1;
  }

  await writeJson(REPORT_PATH, report);

  console.log("Item location migration complete");
  console.table(report.summary);
  console.log(`Report: ${REPORT_PATH}`);
  console.log(`Migrated files: ${OUTPUT_DIR}`);
}

main().catch(error => {
  console.error(
    "Item location migration failed:",
    error
  );
  process.exitCode = 1;
});
