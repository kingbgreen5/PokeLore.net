// Run with:
// node scripts/enrichMovesWithMachineItems.js

import fs from "fs";
import path from "path";

const MOVES_FILE =
  "./public/data/moves.json";

const ITEMS_DIR =
  "./public/data/items";

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

function readJson(filePath) {
  return JSON.parse(
    fs.readFileSync(
      filePath,
      "utf8"
    )
  );
}

function machineItemKind(itemName) {
  if (itemName.startsWith("tm")) {
    return "TM";
  }

  if (itemName.startsWith("hm")) {
    return "HM";
  }

  if (itemName.startsWith("tr")) {
    return "TR";
  }

  return "Machine";
}

function generationRank(generation) {
  const index = [
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
  ].indexOf(generation);

  return index === -1
    ? 999
    : index;
}

function clearExistingMachineItems(
  moves
) {
  for (const move of Object.values(
    moves
  )) {
    delete move.machineItems;
  }
}

function addMachineItem(
  move,
  item,
  machine
) {
  if (!move.machineItems) {
    move.machineItems = [];
  }

  move.machineItems.push({
    itemId:
      item.id,

    itemName:
      item.name,

    itemDisplayName:
      item.displayName,

    itemSprite:
      item.sprite,

    itemKind:
      machineItemKind(item.name),

    machineId:
      machine.machineId,

    versionGroup:
      machine.versionGroup,

    generation:
      generationForVersionGroup(
        machine.versionGroup
      )
  });
}

function sortMachineItems(moves) {
  for (const move of Object.values(
    moves
  )) {
    if (!move.machineItems) {
      continue;
    }

    move.machineItems.sort(
      (a, b) => {
        const generationDifference =
          generationRank(a.generation) -
          generationRank(b.generation);

        return (
          generationDifference ||
          a.itemKind.localeCompare(
            b.itemKind
          ) ||
          a.itemName.localeCompare(
            b.itemName,
            undefined,
            { numeric: true }
          ) ||
          a.versionGroup.localeCompare(
            b.versionGroup
          )
        );
      }
    );
  }
}

function main() {
  const moves =
    readJson(MOVES_FILE);

  clearExistingMachineItems(moves);

  const itemFiles =
    fs
      .readdirSync(ITEMS_DIR)
      .filter(file =>
        file.endsWith(".json")
      )
      .sort();

  let machineItems = 0;
  let machineEntries = 0;

  for (const file of itemFiles) {
    const item =
      readJson(
        path.join(
          ITEMS_DIR,
          file
        )
      );

    if (!item.machines?.length) {
      continue;
    }

    machineItems += 1;

    for (const machine of item.machines) {
      const moveName =
        machine.move?.name;

      if (!moveName || !moves[moveName]) {
        continue;
      }

      addMachineItem(
        moves[moveName],
        item,
        machine
      );

      machineEntries += 1;
    }
  }

  sortMachineItems(moves);

  fs.writeFileSync(
    MOVES_FILE,
    `${JSON.stringify(
      moves,
      null,
      2
    )}\n`
  );

  console.log(
    `Read ${machineItems} machine item files.`
  );
  console.log(
    `Added ${machineEntries} machine references to moves.json.`
  );
}

main();
