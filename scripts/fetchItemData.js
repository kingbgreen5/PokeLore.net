// Run with:
// node scripts/fetchItemData.js

import axios from "axios";
import fs from "fs";
import path from "path";
import { normalizeFlavorText } from "../src/utils/normalizeText.js";

const BASE_URL =
  "https://pokeapi.co/api/v2";

const ITEMS_DIR =
  "./public/data/items";

const ITEM_INDEX_FILE =
  "./public/data/itemsIndex.json";

//-----------------------------------------
// Helpers
//-----------------------------------------

function sleep(ms) {
  return new Promise(
    resolve => setTimeout(resolve, ms)
  );
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(
      dir,
      { recursive: true }
    );
  }
}

function cleanText(text) {
  if (!text) return null;

  return normalizeFlavorText(text);
}

function getEnglishName(names, fallback) {
  return (
    names.find(
      entry =>
        entry.language.name === "en"
    )?.name || fallback
  );
}

function getEnglishEffect(effectEntries) {
  const englishEntry =
    effectEntries.find(
      entry =>
        entry.language.name === "en"
    );

  return {
    effect:
      cleanText(
        englishEntry?.effect
      ),

    shortEffect:
      cleanText(
        englishEntry?.short_effect
      )
  };
}

function condenseFlavorTextEntries(
  flavorTextEntries
) {
  const englishEntries =
    flavorTextEntries
      .filter(
        entry =>
          entry.language.name === "en"
      )
      .map(
        entry => ({
          versionGroup:
            entry.version_group.name,

          text:
            cleanText(
              entry.text
            )
        })
      );

  const grouped = {};

  for (const entry of englishEntries) {
    if (!entry.text) continue;

    if (!grouped[entry.text]) {
      grouped[entry.text] = {
        versionGroups: [],
        text: entry.text
      };
    }

    grouped[entry.text]
      .versionGroups
      .push(
        entry.versionGroup
      );
  }

  return Object.values(grouped);
}

function getIdFromUrl(url) {
  return Number(
    url
      .split("/")
      .filter(Boolean)
      .pop()
  );
}

const machineCache = new Map();

async function fetchMachineData(url) {
  if (machineCache.has(url)) {
    return machineCache.get(url);
  }

  const response =
    await axios.get(url);

  machineCache.set(
    url,
    response.data
  );

  return response.data;
}

//-----------------------------------------
// Main
//-----------------------------------------

async function main() {
  try {
    ensureDir(ITEMS_DIR);

    console.log(
      "Fetching item list..."
    );

    const listResponse =
      await axios.get(
        `${BASE_URL}/item?limit=100000`
      );

    const itemList =
      listResponse.data.results;

    console.log(
      `Found ${itemList.length} items`
    );

    const itemsIndex = [];

    for (const itemEntry of itemList) {
      try {
        console.log(
          `Fetching ${itemEntry.name}...`
        );

        const itemResponse =
          await axios.get(
            itemEntry.url
          );

        const item =
          itemResponse.data;

        //---------------------------------
        // English display name
        //---------------------------------

        const displayName =
          getEnglishName(
            item.names,
            item.name
          );

        //---------------------------------
        // Effects
        //---------------------------------

        const {
          effect,
          shortEffect
        } =
          getEnglishEffect(
            item.effect_entries
          );

        //---------------------------------
        // Category / Pocket
        //---------------------------------

        const categoryUrl =
          item.category?.url || null;

        let categoryData = null;

        if (categoryUrl) {
          const categoryResponse =
            await axios.get(
              categoryUrl
            );

          const category =
            categoryResponse.data;

          categoryData = {
            id:
              category.id,

            name:
              category.name,

            displayName:
              getEnglishName(
                category.names,
                category.name
              ),

            pocket:
              category.pocket?.name || null
          };
        }

        //---------------------------------
        // Attributes
        //---------------------------------

        const attributes =
          item.attributes.map(
            attribute =>
              attribute.name
          );

        //---------------------------------
        // Fling
        //---------------------------------

        const fling = {
          power:
            item.fling_power,

          effect:
            item.fling_effect?.name || null
        };

        //---------------------------------
        // Held By Pokémon
        //---------------------------------

        const heldByPokemon =
          item.held_by_pokemon.map(
            heldEntry => ({
              pokemon:
                heldEntry.pokemon.name,

              pokemonId:
                getIdFromUrl(
                  heldEntry.pokemon.url
                ),

              versionDetails:
                heldEntry.version_details.map(
                  detail => ({
                    version:
                      detail.version.name,

                    rarity:
                      detail.rarity
                  })
                )
            })
          );

        //---------------------------------
        // Game Indices
        //---------------------------------

        const gameIndices =
          item.game_indices.map(
            index => ({
              gameIndex:
                index.game_index,

              generation:
                index.generation.name
            })
          );

        //---------------------------------
        // Machines
        //---------------------------------

        const machines =
          await Promise.all(
            item.machines.map(
              async machine => {
                const machineUrl =
                  machine.machine.url;

                const versionGroup =
                  machine.version_group.name;

                try {
                  const machineData =
                    await fetchMachineData(
                      machineUrl
                    );

                  return {
                    machineId:
                      machineData.id,

                    machineUrl,

                    versionGroup,

                    move:
                      machineData.move
                        ? {
                            id:
                              getIdFromUrl(
                                machineData
                                  .move
                                  .url
                              ),

                            name:
                              machineData
                                .move
                                .name
                          }
                        : null
                  };
                } catch (error) {
                  console.error(
                    `Failed machine ${machineUrl}:`,
                    error.message
                  );

                  return {
                    machineId:
                      getIdFromUrl(
                        machineUrl
                      ),

                    machineUrl,

                    versionGroup,

                    move:
                      null
                  };
                }
              }
            )
          );

        //---------------------------------
        // Final item detail object
        //---------------------------------

        const itemData = {
          id:
            item.id,

          name:
            item.name,

          displayName,

          cost:
            item.cost,

          sprite:
            item.sprites?.default || null,

          category:
            categoryData,

          attributes,

          effect,

          shortEffect,

          flavorTextEntries:
            condenseFlavorTextEntries(
              item.flavor_text_entries
            ),

          fling,

          heldByPokemon,

          gameIndices,

          machines
        };

        //---------------------------------
        // Save detail file by item name
        //---------------------------------

        fs.writeFileSync(
          path.join(
            ITEMS_DIR,
            `${item.name}.json`
          ),
          JSON.stringify(
            itemData,
            null,
            2
          )
        );

        //---------------------------------
        // Add lightweight index entry
        //---------------------------------

        itemsIndex.push({
          id:
            item.id,

          name:
            item.name,

          displayName,

          sprite:
            item.sprites?.default || null,

          category:
            categoryData?.name || null,

          categoryDisplayName:
            categoryData?.displayName || null,

          pocket:
            categoryData?.pocket || null,

          cost:
            item.cost,

          shortEffect
        });

        await sleep(75);

      } catch (error) {
        console.error(
          `Failed on ${itemEntry.name}:`,
          error.message
        );
      }
    }

    //-------------------------------------
    // Save index
    //-------------------------------------

    fs.writeFileSync(
      ITEM_INDEX_FILE,
      JSON.stringify(
        itemsIndex,
        null,
        2
      )
    );

    console.log(
      `Finished. Created ${itemsIndex.length} item files.`
    );

  } catch (error) {
    console.error(
      "Script failed:"
    );

    console.error(error);
  }
}

main();
