import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DYNAMAX_CRYSTAL_CATEGORY,
  RELEASED_DYNAMAX_CRYSTAL_COUNT,
  dynamaxCrystalData,
  validateReleasedDynamaxCrystals
} from "../src/utils/dynamaxCrystals.js";

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);
const repoRoot = path.resolve(__dirname, "..");
const itemsIndexPath = path.join(
  repoRoot,
  "public",
  "data",
  "itemsIndex.json"
);

function readJson(filePath) {
  return JSON.parse(
    fs.readFileSync(filePath, "utf8")
  );
}

validateReleasedDynamaxCrystals();

const itemsIndex = readJson(itemsIndexPath);
const crystalItems = itemsIndex.filter(
  item => item.category === DYNAMAX_CRYSTAL_CATEGORY
);
const itemSlugs = new Set(
  itemsIndex.map(item => item.name)
);
const missingReleasedSlugs = Object.keys(
  dynamaxCrystalData
).filter(slug => !itemSlugs.has(slug));

if (missingReleasedSlugs.length > 0) {
  throw new Error(
    `Released Dynamax Crystal slugs missing from itemsIndex.json: ${missingReleasedSlugs.join(", ")}`
  );
}

if (
  Object.keys(dynamaxCrystalData).length !==
  RELEASED_DYNAMAX_CRYSTAL_COUNT
) {
  throw new Error(
    `Expected ${RELEASED_DYNAMAX_CRYSTAL_COUNT} released Dynamax Crystals.`
  );
}

console.log(
  `Validated ${Object.keys(dynamaxCrystalData).length} released Dynamax Crystals and ${crystalItems.length} total Dynamax Crystal item records.`
);
