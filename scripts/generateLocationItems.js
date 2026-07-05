import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "public", "data");
const MIGRATED_DIR = path.join(
  DATA_DIR,
  "itemLocationsCurated"
);
const OUTPUT_DIR = path.join(DATA_DIR, "locationItems");

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

function formatGenerationVersion(generation) {
  return generation
    ? `Generation ${generation}`
    : "Unknown";
}

function methodDetails(method) {
  const details = {
    type:
      method.acquisitionType ??
      method.type ??
      "unknown",
    area: method.area ?? null,
    details:
      method.details ??
      method.method ??
      null,
    notes: method.notes ?? null,
    requirements:
      method.requirements ?? [],
    repeatable:
      method.repeatable ?? null,
    versionExclusive:
      method.versionExclusive ?? null
  };

  if (
    method.cost &&
    method.location?.name === "pokeathlon-dome"
  ) {
    details.cost = method.cost;
  }

  return details;
}

function addMethod({
  locationMap,
  location,
  item,
  version,
  method
}) {
  if (!locationMap.has(location.name)) {
    locationMap.set(location.name, {
      location,
      items: new Map()
    });
  }

  const locationEntry = locationMap.get(
    location.name
  );

  if (
    !locationEntry.items.has(item.name)
  ) {
    locationEntry.items.set(item.name, {
      item,
      versions: new Map()
    });
  }

  const itemEntry = locationEntry.items.get(
    item.name
  );

  if (!itemEntry.versions.has(version)) {
    itemEntry.versions.set(version, []);
  }

  const details = methodDetails(method);
  const existing = itemEntry.versions.get(
    version
  );
  const dedupeKey = JSON.stringify(details);

  if (
    !existing.some(
      existingMethod =>
        JSON.stringify(existingMethod) ===
        dedupeKey
    )
  ) {
    existing.push(details);
  }
}

function getMatchedLocation(method) {
  if (
    method.locationMatchStatus !== "matched" ||
    !method.location ||
    typeof method.location !== "object" ||
    !method.location.name
  ) {
    return null;
  }

  return {
    name: method.location.name,
    displayName:
      method.location.displayName ??
      method.location.name
  };
}

function collectMethods(fileData, item) {
  const collected = [];

  if (Array.isArray(fileData.acquisition)) {
    fileData.acquisition.forEach(method => {
      const games =
        Array.isArray(method.games) &&
        method.games.length > 0
          ? method.games
          : [
              formatGenerationVersion(
                method.generation
              )
            ];

      games.forEach(version => {
        collected.push({
          item,
          version,
          method
        });
      });
    });
  }

  if (
    Array.isArray(fileData.locationsByVersion)
  ) {
    fileData.locationsByVersion.forEach(group => {
      (group.methods ?? []).forEach(method => {
        collected.push({
          item,
          version:
            group.version ??
            formatGenerationVersion(
              group.generation
            ),
          method
        });
      });
    });
  }

  return collected;
}

function serializeLocationEntry(entry) {
  return {
    location: entry.location,
    items: [...entry.items.values()]
      .map(itemEntry => ({
        item: itemEntry.item,
        versions: [...itemEntry.versions.entries()]
          .sort((a, b) =>
            a[0].localeCompare(b[0])
          )
          .map(([version, methods]) => ({
            version,
            methods
          }))
      }))
      .sort((a, b) =>
        a.item.displayName.localeCompare(
          b.item.displayName
        )
      )
  };
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, {
    recursive: true
  });

  const [
    migratedFiles,
    itemsIndex
  ] = await Promise.all([
    fs.readdir(MIGRATED_DIR),
    readJson(
      path.join(DATA_DIR, "itemsIndex.json")
    )
  ]);
  const itemsByName = new Map(
    itemsIndex.map(item => [item.name, item])
  );
  const locationMap = new Map();

  for (const fileName of migratedFiles.filter(
    file => file.endsWith(".json")
  )) {
    const fileData = await readJson(
      path.join(MIGRATED_DIR, fileName)
    );
    const itemName =
      fileData.item ??
      path.basename(fileName, ".json");
    const indexItem = itemsByName.get(itemName);
    const item = {
      name: itemName,
      displayName:
        indexItem?.displayName ??
        fileData.displayName ??
        itemName,
      sprite: indexItem?.sprite ?? null
    };

    collectMethods(fileData, item).forEach(
      entry => {
        const location = getMatchedLocation(
          entry.method
        );

        if (!location) return;

        addMethod({
          locationMap,
          location,
          item,
          version: entry.version,
          method: entry.method
        });
      }
    );
  }

  for (const [
    locationName,
    entry
  ] of locationMap) {
    await writeJson(
      path.join(
        OUTPUT_DIR,
        `${locationName}.json`
      ),
      serializeLocationEntry(entry)
    );
  }

  console.log(
    `Generated ${locationMap.size} location item files.`
  );
  console.log(`Output: ${OUTPUT_DIR}`);
}

main().catch(error => {
  console.error(
    "Generating location items failed:",
    error
  );
  process.exitCode = 1;
});
