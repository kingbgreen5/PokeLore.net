// Run with:
// node scripts/enrichItemMachineMoves.js

import fs from "fs";
import path from "path";

const ITEMS_DIR =
  "./public/data/items";

const machineCache =
  new Map();

function sleep(ms) {
  return new Promise(
    resolve => setTimeout(resolve, ms)
  );
}

function getIdFromUrl(url) {
  if (!url) return null;

  return Number(
    url
      .split("/")
      .filter(Boolean)
      .pop()
  );
}

async function fetchJson(url) {
  if (machineCache.has(url)) {
    return machineCache.get(url);
  }

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `${response.status} ${response.statusText}`
    );
  }

  const data =
    await response.json();

  machineCache.set(
    url,
    data
  );

  await sleep(25);

  return data;
}

async function enrichMachine(machine) {
  if (
    machine.machineId &&
    machine.move?.name
  ) {
    return machine;
  }

  const machineUrl =
    machine.machineUrl ??
    machine.machine?.url ??
    machine.url;

  if (!machineUrl) {
    return machine;
  }

  const machineData =
    await fetchJson(machineUrl);

  return {
    ...machine,

    machineId:
      machineData.id ??
      machine.machineId ??
      getIdFromUrl(machineUrl),

    machineUrl,

    versionGroup:
      machine.versionGroup ??
      machineData.version_group?.name ??
      null,

    move:
      machineData.move
        ? {
            id:
              getIdFromUrl(
                machineData.move.url
              ),

            name:
              machineData.move.name
          }
        : machine.move ?? null
  };
}

async function main() {
  const itemFiles =
    fs
      .readdirSync(ITEMS_DIR)
      .filter(file =>
        file.endsWith(".json")
      )
      .sort();

  let itemCount = 0;
  let machineCount = 0;
  let skippedCount = 0;
  let changedCount = 0;
  const failures = [];

  for (const file of itemFiles) {
    const itemPath =
      path.join(
        ITEMS_DIR,
        file
      );

    const item =
      JSON.parse(
        fs.readFileSync(
          itemPath,
          "utf8"
        )
      );

    if (!item.machines?.length) {
      continue;
    }

    itemCount += 1;

    const original =
      JSON.stringify(
        item.machines
      );

    const enrichedMachines = [];

    for (const machine of item.machines) {
      try {
        const enrichedMachine =
          await enrichMachine(machine);

        if (enrichedMachine === machine) {
          skippedCount += 1;
        }

        enrichedMachines.push(enrichedMachine);
        machineCount += 1;
      } catch (error) {
        failures.push({
          item:
            item.name,

          machineUrl:
            machine.machineUrl,

          error:
            error.message
        });

        enrichedMachines.push(machine);
      }
    }

    item.machines =
      enrichedMachines;

    if (
      JSON.stringify(item.machines) !==
      original
    ) {
      fs.writeFileSync(
        itemPath,
        `${JSON.stringify(
          item,
          null,
          2
        )}\n`
      );

      changedCount += 1;
    }
  }

  console.log(
    `Checked ${itemCount} machine items.`
  );
  console.log(
    `Processed ${machineCount} machine entries.`
  );
  console.log(
    `Skipped ${skippedCount} already-enriched entries.`
  );
  console.log(
    `Updated ${changedCount} item files.`
  );

  if (failures.length) {
    console.log(
      `Failed ${failures.length} machine entries:`
    );
    console.log(
      JSON.stringify(
        failures.slice(0, 20),
        null,
        2
      )
    );

    if (failures.length > 20) {
      console.log(
        `...and ${failures.length - 20} more.`
      );
    }
  }
}

main().catch(error => {
  console.error(
    "Failed to enrich item machines:",
    error
  );
});
