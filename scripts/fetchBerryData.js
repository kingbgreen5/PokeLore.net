// Run with:
// node scripts/fetchBerryData.js

import axios from "axios";
import fs from "fs";
import path from "path";

const BASE_URL =
  "https://pokeapi.co/api/v2";

const ITEMS_INDEX_FILE =
  "./public/data/itemsIndex.json";

const BERRY_ROOT_DIR =
  "./public/data/berries";

const GENERATED_DIR =
  path.join(
    BERRY_ROOT_DIR,
    "generated"
  );

const GENERATED_DETAILS_DIR =
  path.join(
    GENERATED_DIR,
    "details"
  );

const BERRY_INDEX_FILE =
  path.join(
    GENERATED_DIR,
    "index.json"
  );

const BERRY_META_FILE =
  path.join(
    GENERATED_DIR,
    "_meta.json"
  );

const CURATED_OVERRIDES_FILE =
  path.join(
    BERRY_ROOT_DIR,
    "curatedOverrides.json"
  );

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(
      dir,
      { recursive: true }
    );
  }
}

function resetGeneratedDetailsDir() {
  fs.rmSync(
    GENERATED_DETAILS_DIR,
    {
      recursive: true,
      force: true
    }
  );

  ensureDir(
    GENERATED_DETAILS_DIR
  );
}

function readJson(file) {
  return JSON.parse(
    fs.readFileSync(
      file,
      "utf8"
    )
  );
}

function writeJson(file, data) {
  fs.writeFileSync(
    file,
    `${JSON.stringify(
      data,
      null,
      2
    )}\n`
  );
}

function getIdFromUrl(url) {
  return Number(
    url
      .split("/")
      .filter(Boolean)
      .pop()
  );
}

function toDisplayName(name) {
  return name
    .split("-")
    .map(
      part =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

function toFlavorPotencies(flavors) {
  return Object.fromEntries(
    flavors.map(
      entry => [
        entry.flavor.name,
        entry.potency
      ]
    )
  );
}

function getDominantFlavors(flavorPotencies) {
  const maxPotency =
    Math.max(
      ...Object.values(
        flavorPotencies
      )
    );

  if (maxPotency <= 0) {
    return [];
  }

  return Object.entries(
    flavorPotencies
  )
    .filter(
      ([, potency]) =>
        potency === maxPotency
    )
    .map(
      ([flavor]) => flavor
    );
}

function getNonzeroFlavors(flavorPotencies) {
  return Object.entries(
    flavorPotencies
  )
    .filter(
      ([, potency]) =>
        potency > 0
    )
    .map(
      ([flavor, potency]) => ({
        flavor,
        potency
      })
    );
}

function buildBerryMechanics(berry) {
  if (!berry) {
    return null;
  }

  const flavorPotencies =
    toFlavorPotencies(
      berry.flavors
    );

  return {
    pokeApiBerryId:
      berry.id,

    berryName:
      berry.name,

    itemName:
      berry.item.name,

    firmness:
      berry.firmness.name,

    growthTime:
      berry.growth_time,

    maxHarvest:
      berry.max_harvest,

    naturalGiftPower:
      berry.natural_gift_power,

    naturalGiftType:
      berry.natural_gift_type.name,

    size:
      berry.size,

    smoothness:
      berry.smoothness,

    soilDryness:
      berry.soil_dryness,

    flavorPotencies,

    nonzeroFlavors:
      getNonzeroFlavors(
        flavorPotencies
      ),

    dominantFlavors:
      getDominantFlavors(
        flavorPotencies
      )
  };
}

function buildIndexEntry(item, mechanics) {
  const flavorPotencies =
    mechanics?.flavorPotencies || {};

  return {
    itemId:
      item.id,

    itemName:
      item.name,

    displayName:
      item.displayName,

    sprite:
      item.sprite,

    category:
      item.category,

    categoryDisplayName:
      item.categoryDisplayName,

    pocket:
      item.pocket,

    cost:
      item.cost,

    shortEffect:
      item.shortEffect,

    hasPokeApiBerryData:
      Boolean(mechanics),

    pokeApiBerryId:
      mechanics?.pokeApiBerryId || null,

    berryName:
      mechanics?.berryName ||
      item.name.replace(
        /-berry$/,
        ""
      ),

    firmness:
      mechanics?.firmness || null,

    growthTime:
      mechanics?.growthTime || null,

    maxHarvest:
      mechanics?.maxHarvest || null,

    naturalGiftPower:
      mechanics?.naturalGiftPower || null,

    naturalGiftType:
      mechanics?.naturalGiftType || null,

    size:
      mechanics?.size || null,

    smoothness:
      mechanics?.smoothness || null,

    soilDryness:
      mechanics?.soilDryness || null,

    flavorPotencies,

    nonzeroFlavors:
      mechanics?.nonzeroFlavors || [],

    dominantFlavors:
      mechanics?.dominantFlavors || []
  };
}

function buildDetail(item, mechanics) {
  return {
    item: {
      id:
        item.id,

      name:
        item.name,

      displayName:
        item.displayName,

      sprite:
        item.sprite,

      category:
        item.category,

      categoryDisplayName:
        item.categoryDisplayName,

      pocket:
        item.pocket,

      cost:
        item.cost,

      shortEffect:
        item.shortEffect
    },

    mechanics,

    source: {
      generatedFrom:
        mechanics
          ? "pokeapi-berry"
          : "pokeapi-item",

      berryUrl:
        mechanics
          ? `${BASE_URL}/berry/${mechanics.pokeApiBerryId}`
          : null,

      itemUrl:
        `${BASE_URL}/item/${item.id}`
    }
  };
}

async function fetchList(endpoint) {
  const response =
    await axios.get(
      `${BASE_URL}/${endpoint}?limit=1000`
    );

  return response.data;
}

async function fetchResource(url) {
  const response =
    await axios.get(url);

  return response.data;
}

async function main() {
  ensureDir(
    GENERATED_DIR
  );

  resetGeneratedDetailsDir();

  ensureDir(
    BERRY_ROOT_DIR
  );

  const itemsIndex =
    readJson(
      ITEMS_INDEX_FILE
    );

  const localBerryItems =
    itemsIndex
      .filter(
        item =>
          item.pocket === "berries"
      )
      .sort(
        (left, right) =>
          left.name.localeCompare(
            right.name
          )
      );

  console.log(
    `Found ${localBerryItems.length} local berry-pocket items.`
  );

  const [
    berryList,
    firmnessList,
    flavorList
  ] = await Promise.all([
    fetchList("berry"),
    fetchList("berry-firmness"),
    fetchList("berry-flavor")
  ]);

  console.log(
    `Found ${berryList.count} PokeAPI berry records.`
  );

  const berryDetails =
    await Promise.all(
      berryList.results.map(
        result =>
          fetchResource(
            result.url
          )
      )
    );

  const berryByItemName =
    new Map(
      berryDetails.map(
        berry => [
          berry.item.name,
          berry
        ]
      )
    );

  const index =
    localBerryItems.map(
      item => {
        const mechanics =
          buildBerryMechanics(
            berryByItemName.get(
              item.name
            )
          );

        return buildIndexEntry(
          item,
          mechanics
        );
      }
    );

  for (const item of localBerryItems) {
    const mechanics =
      buildBerryMechanics(
        berryByItemName.get(
          item.name
        )
      );

    writeJson(
      path.join(
        GENERATED_DETAILS_DIR,
        `${item.name}.json`
      ),
      buildDetail(
        item,
        mechanics
      )
    );
  }

  const missingLocalItems =
    berryDetails
      .filter(
        berry =>
          !localBerryItems.some(
            item =>
              item.name === berry.item.name
          )
      )
      .map(
        berry =>
          berry.item.name
      );

  const itemOnlyBerryItems =
    index
      .filter(
        entry =>
          !entry.hasPokeApiBerryData
      )
      .map(
        entry =>
          entry.itemName
      );

  const meta = {
    source:
      "https://pokeapi.co/api/v2",

    generatedAt:
      new Date().toISOString(),

    localBerryItemCount:
      localBerryItems.length,

    pokeApiBerryCount:
      berryList.count,

    berryIndexCount:
      index.length,

    berryMechanicsCount:
      index.filter(
        entry =>
          entry.hasPokeApiBerryData
      ).length,

    itemOnlyBerryCount:
      itemOnlyBerryItems.length,

    itemOnlyBerryItems,

    pokeApiBerriesMissingLocalItems:
      missingLocalItems,

    firmnesses:
      firmnessList.results.map(
        entry => ({
          id:
            getIdFromUrl(
              entry.url
            ),

          name:
            entry.name,

          displayName:
            toDisplayName(
              entry.name
            )
        })
      ),

    flavors:
      flavorList.results.map(
        entry => ({
          id:
            getIdFromUrl(
              entry.url
            ),

          name:
            entry.name,

          displayName:
            toDisplayName(
              entry.name
            )
        })
      )
  };

  writeJson(
    BERRY_INDEX_FILE,
    index
  );

  writeJson(
    BERRY_META_FILE,
    meta
  );

  if (!fs.existsSync(CURATED_OVERRIDES_FILE)) {
    writeJson(
      CURATED_OVERRIDES_FILE,
      {
        notes:
          "Curated berry data lives here. Generated files under public/data/berries/generated can be refreshed from PokeAPI.",

        overrides:
          {}
      }
    );
  }

  console.log(
    `Wrote ${index.length} berry index entries.`
  );

  console.log(
    `Wrote ${localBerryItems.length} berry detail files.`
  );

  if (missingLocalItems.length > 0) {
    console.warn(
      "PokeAPI berry records missing matching local item files:",
      missingLocalItems.join(", ")
    );
  }
}

main().catch(error => {
  console.error(
    "Berry data fetch failed:"
  );

  console.error(error);

  process.exit(1);
});
