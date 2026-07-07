import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeDisplayData } from "../src/utils/normalizeText.js";

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "public", "data");
const SOURCE_FILE = path.join(
  DATA_DIR,
  "itemLocationsCurated.json"
);
const OUTPUT_DIR = path.join(
  DATA_DIR,
  "itemLocationsCurated"
);

async function readJson(filePath) {
  return normalizeDisplayData(
    JSON.parse(await fs.readFile(filePath, "utf8"))
  );
}

async function writeJson(filePath, data) {
  await fs.writeFile(
    filePath,
    `${JSON.stringify(data, null, 2)}\n`
  );
}

function sortedItems(items) {
  return [...items].sort((a, b) =>
    String(a.item).localeCompare(
      String(b.item),
      undefined,
      {
        numeric: true
      }
    )
  );
}

async function exportSourceFromFolder() {
  const files = (
    await fs.readdir(OUTPUT_DIR)
  ).filter(file => file.endsWith(".json"));

  const items = [];

  for (const file of files) {
    const itemData = await readJson(
      path.join(OUTPUT_DIR, file)
    );

    items.push({
      item:
        itemData.item ??
        path.basename(file, ".json"),
      displayName: itemData.displayName,
      source: itemData.source,
      sourceTitle: itemData.sourceTitle,
      schemaVersion:
        itemData.schemaVersion ?? 1,
      acquisition:
        itemData.acquisition ?? []
    });
  }

  await writeJson(SOURCE_FILE, {
    schemaVersion: 1,
    description:
      "Canonical editable source for curated item acquisition/location data. Run node scripts/buildItemLocationsCurated.js to fan this out into public/data/itemLocationsCurated/*.json for the app.",
    items: sortedItems(items)
  });

  console.log(
    `Exported ${items.length} curated item records to ${SOURCE_FILE}`
  );
}

async function buildFolderFromSource() {
  const source = await readJson(SOURCE_FILE);
  const items = Array.isArray(source.items)
    ? source.items
    : [];
  const sourceItemNames = new Set(
    items
      .map(item => item.item)
      .filter(Boolean)
  );

  await fs.mkdir(OUTPUT_DIR, {
    recursive: true
  });

  const existingFiles = await fs.readdir(
    OUTPUT_DIR
  );

  for (const file of existingFiles) {
    if (!file.endsWith(".json")) continue;

    const itemName = path.basename(
      file,
      ".json"
    );

    if (!sourceItemNames.has(itemName)) {
      await fs.unlink(
        path.join(OUTPUT_DIR, file)
      );
    }
  }

  for (const item of sortedItems(items)) {
    if (!item.item) {
      throw new Error(
        "Curated item entry is missing item"
      );
    }

    await writeJson(
      path.join(OUTPUT_DIR, `${item.item}.json`),
      {
        item: item.item,
        displayName:
          item.displayName ?? item.item,
        source:
          item.source ??
          "itemLocationsCurated.json",
        sourceTitle: item.sourceTitle,
        schemaVersion:
          item.schemaVersion ?? 1,
        acquisition:
          item.acquisition ?? []
      }
    );
  }

  console.log(
    `Built ${items.length} curated item location files from ${SOURCE_FILE}`
  );
}

async function main() {
  if (process.argv.includes("--from-folder")) {
    await exportSourceFromFolder();
    return;
  }

  await buildFolderFromSource();
}

main().catch(error => {
  console.error(
    "Building curated item locations failed:",
    error
  );
  process.exitCode = 1;
});
