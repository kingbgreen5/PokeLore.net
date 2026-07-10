import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeFlavorText } from "../src/utils/normalizeText.js";

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
const moveLearnersDir =
  path.join(dataDir, "moveLearners");
const itemsDir =
  path.join(dataDir, "items");
const pokemonDataDir =
  path.join(dataDir, "pokemonData");
const pokemonLearnsetsDir =
  path.join(dataDir, "pokemonLearnsets");
const movesIndexPath =
  path.join(dataDir, "movesIndex.json");
const legacyMovesPath =
  path.join(dataDir, "moves.json");

const API_BASE =
  "https://pokeapi.co/api/v2";
const POKEAPI_CSV_BASE =
  "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv";
const REQUEST_DELAY_MS = 80;
const refreshExisting =
  process.argv.includes("--refresh");

const requestCache = new Map();

function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

function cleanText(text) {
  return normalizeFlavorText(text);
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

function getUrlId(url) {
  const match =
    String(url ?? "").match(/\/(\d+)\/?$/);

  return match ? Number(match[1]) : null;
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(
      await fs.readFile(filePath, "utf8")
    );
  } catch {
    return fallback;
  }
}

async function fetchJson(url) {
  if (requestCache.has(url)) {
    return requestCache.get(url);
  }

  const response = await fetch(url);

  if (!response.ok) {
    const body =
      await response.text();

    throw new Error(
      `${response.status} ${response.statusText} for ${url}${
        body ? `: ${body.slice(0, 160)}` : ""
      }`
    );
  }

  const data = await response.json();
  requestCache.set(url, data);
  await sleep(REQUEST_DELAY_MS);

  return data;
}

async function fetchText(url) {
  const response = await fetch(url);

  if (!response.ok) {
    const body =
      await response.text();

    throw new Error(
      `${response.status} ${response.statusText} for ${url}${
        body ? `: ${body.slice(0, 160)}` : ""
      }`
    );
  }

  const text = await response.text();
  await sleep(REQUEST_DELAY_MS);

  return text;
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
      cleanText(prose.description);
  }

  return detailsById;
}

function englishEntries(entries = []) {
  return entries.filter(
    entry =>
      entry.language?.name === "en"
  );
}

function getEnglishName(data) {
  return (
    data.names?.find(
      entry =>
        entry.language?.name === "en"
    )?.name ?? displayName(data.name)
  );
}

function mapEffectEntries(entries = []) {
  return englishEntries(entries).map(
    entry => ({
      effect: cleanText(entry.effect),
      shortEffect: cleanText(
        entry.short_effect
      )
    })
  );
}

function mapFlavorTextEntries(entries = []) {
  const seen = new Set();

  return englishEntries(entries)
    .map(entry => ({
      versionGroup:
        entry.version_group?.name,
      text: cleanText(entry.flavor_text)
    }))
    .filter(entry => {
      const key =
        `${entry.versionGroup}:${entry.text}`;

      if (
        !entry.versionGroup ||
        !entry.text ||
        seen.has(key)
      ) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function mapNamedResource(resource) {
  return resource?.name ?? null;
}

function mapMeta(meta) {
  if (!meta) {
    return null;
  }

  return {
    ailment:
      mapNamedResource(meta.ailment),
    category:
      mapNamedResource(meta.category),
    minHits: meta.min_hits,
    maxHits: meta.max_hits,
    minTurns: meta.min_turns,
    maxTurns: meta.max_turns,
    drain: meta.drain,
    healing: meta.healing,
    critRate: meta.crit_rate,
    ailmentChance:
      meta.ailment_chance,
    flinchChance:
      meta.flinch_chance,
    statChance: meta.stat_chance
  };
}

function mapStatChanges(statChanges = []) {
  return statChanges.map(change => ({
    stat: change.stat?.name,
    change: change.change
  }));
}

function mapPastValues(pastValues = []) {
  return pastValues.map(value => ({
    accuracy: value.accuracy,
    effectChance:
      value.effect_chance,
    power: value.power,
    pp: value.pp,
    type: value.type?.name ?? null,
    versionGroup:
      value.version_group?.name ?? null,
    effectEntries: mapEffectEntries(
      value.effect_entries
    )
  }));
}

function generationForVersionGroup(
  versionGroup
) {
  if (
    [
      "red-green-japan",
      "blue-japan",
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

const learnerMethodOrder = [
  "level-up",
  "machine",
  "egg",
  "tutor"
];

function learnerMethodLabel(method) {
  if (method === "level-up") {
    return "Level Up";
  }

  if (method === "machine") {
    return "TMs, HMs, and TRs";
  }

  if (method === "egg") {
    return "Via Breeding";
  }

  if (method === "tutor") {
    return "Move Tutor";
  }

  return displayName(method ?? "other");
}

function learnerMethodRank(method) {
  const index =
    learnerMethodOrder.indexOf(method);

  return index === -1
    ? learnerMethodOrder.length
    : index;
}

function sortLearnerMethods(a, b) {
  return (
    learnerMethodRank(a.method) -
      learnerMethodRank(b.method) ||
    (a.level ?? 0) - (b.level ?? 0) ||
    String(a.versionGroup ?? "").localeCompare(
      String(b.versionGroup ?? "")
    )
  );
}

async function buildMachineItemsByMove() {
  const byMove = new Map();

  let files = [];
  try {
    files = await fs.readdir(itemsDir);
  } catch {
    return byMove;
  }

  for (const file of files.filter(file =>
    file.endsWith(".json")
  )) {
    const item =
      await readJson(
        path.join(itemsDir, file),
        null
      );

    if (!item?.machines?.length) {
      continue;
    }

    for (const machine of item.machines) {
      const moveName =
        machine.move?.name;

      if (!moveName) {
        continue;
      }

      if (!byMove.has(moveName)) {
        byMove.set(moveName, []);
      }

      byMove.get(moveName).push({
        itemId: item.id,
        itemName: item.name,
        itemDisplayName:
          item.displayName,
        itemSprite: item.sprite,
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
  }

  return byMove;
}

async function buildExistingMoveFlagsByMove() {
  const byMove = new Map();

  let files = [];
  try {
    files = await fs.readdir(movesDir);
  } catch {
    return byMove;
  }

  for (const file of files.filter(file =>
    file.endsWith(".json")
  )) {
    const move =
      await readJson(
        path.join(movesDir, file),
        null
      );

    if (move?.name && Array.isArray(move.flags)) {
      byMove.set(move.name, move.flags);
    }
  }

  return byMove;
}

async function buildMoveFlagsByMove() {
  const byMove = new Map();

  try {
    console.log("Fetching move flags...");

    const [
      flagsCsv,
      flagProseCsv,
      flagMapCsv,
      moveList
    ] = await Promise.all([
      fetchText(
        `${POKEAPI_CSV_BASE}/move_flags.csv`
      ),
      fetchText(
        `${POKEAPI_CSV_BASE}/move_flag_prose.csv`
      ),
      fetchText(
        `${POKEAPI_CSV_BASE}/move_flag_map.csv`
      ),
      fetchJson(
        `${API_BASE}/move?limit=100000`
      )
    ]);
    const flagDetailsById =
      buildFlagDetailsById(
        flagsCsv,
        flagProseCsv
      );
    const movesById =
      new Map(
        (moveList.results ?? [])
          .map(move => [
            getUrlId(move.url),
            move.name
          ])
          .filter(
            ([id, name]) =>
              id && name
          )
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

      if (!byMove.has(moveName)) {
        byMove.set(moveName, []);
      }

      byMove
        .get(moveName)
        .push(flagDetails);
    }

    return byMove;
  } catch (error) {
    console.warn(
      `Could not fetch move flags, using local flags instead: ${error.message}`
    );

    return buildExistingMoveFlagsByMove();
  }
}

async function getPokemonSummary(
  pokemonId
) {
  const pokemon =
    await readJson(
      path.join(
        pokemonDataDir,
        `${pokemonId}.json`
      ),
      null
    );

  if (!pokemon) {
    return null;
  }

  return {
    id: pokemon.id,
    name: pokemon.name,
    sprite: pokemon.sprite,
    types: pokemon.types
  };
}

async function buildMoveLearners() {
  const learners = new Map();

  let files = [];
  try {
    files = await fs.readdir(
      pokemonLearnsetsDir
    );
  } catch {
    return learners;
  }

  for (const file of files.filter(file =>
    file.endsWith(".json")
  )) {
    const learnset =
      await readJson(
        path.join(
          pokemonLearnsetsDir,
          file
        ),
        null
      );

    if (!learnset?.moves?.length) {
      continue;
    }

    const pokemon =
      await getPokemonSummary(
        learnset.id
      );

    if (!pokemon) {
      continue;
    }

    for (const moveEntry of learnset.moves) {
      if (!learners.has(moveEntry.move)) {
        learners.set(moveEntry.move, {
          move: moveEntry.move,
          pokemonById: new Map(),
          methodGroupsByMethod: new Map()
        });
      }

      const learnerData =
        learners.get(moveEntry.move);
      const methodRecord = {
        method: moveEntry.method,
        level: moveEntry.level,
        versionGroup:
          moveEntry.versionGroup
      };

      if (
        !learnerData.pokemonById.has(
          pokemon.id
        )
      ) {
        learnerData.pokemonById.set(
          pokemon.id,
          {
            ...pokemon,
            methods: []
          }
        );
      }

      const pokemonRecord =
        learnerData.pokemonById.get(
          pokemon.id
        );
      const methodKey =
        `${methodRecord.method}:${methodRecord.level}:${methodRecord.versionGroup}`;

      if (
        !pokemonRecord.methods.some(
          existing =>
            `${existing.method}:${existing.level}:${existing.versionGroup}` ===
            methodKey
        )
      ) {
        pokemonRecord.methods.push(
          methodRecord
        );
      }

      const groupMethod =
        moveEntry.method ?? "other";

      if (
        !learnerData.methodGroupsByMethod.has(
          groupMethod
        )
      ) {
        learnerData.methodGroupsByMethod.set(
          groupMethod,
          {
            method: groupMethod,
            label:
              learnerMethodLabel(
                groupMethod
              ),
            pokemonById: new Map()
          }
        );
      }

      const methodGroup =
        learnerData.methodGroupsByMethod.get(
          groupMethod
        );

      if (
        !methodGroup.pokemonById.has(
          pokemon.id
        )
      ) {
        methodGroup.pokemonById.set(
          pokemon.id,
          {
            ...pokemon,
            method: groupMethod,
            levels: [],
            versionGroups: []
          }
        );
      }

      const methodPokemon =
        methodGroup.pokemonById.get(
          pokemon.id
        );

      if (
        moveEntry.level &&
        !methodPokemon.levels.includes(
          moveEntry.level
        )
      ) {
        methodPokemon.levels.push(
          moveEntry.level
        );
      }

      if (
        moveEntry.versionGroup &&
        !methodPokemon.versionGroups.includes(
          moveEntry.versionGroup
        )
      ) {
        methodPokemon.versionGroups.push(
          moveEntry.versionGroup
        );
      }
    }
  }

  for (const learnerData of learners.values()) {
    learnerData.pokemon = Array.from(
      learnerData.pokemonById.values()
    )
      .map(pokemon => {
        const methods = pokemon.methods.sort(
          sortLearnerMethods
        );
        const primaryMethod =
          methods[0] ?? {};

        return {
          ...pokemon,
          method: primaryMethod.method,
          level: primaryMethod.level,
          versionGroup:
            primaryMethod.versionGroup,
          methods
        };
      })
      .sort((a, b) => a.id - b.id);

    learnerData.methodGroups = Array.from(
      learnerData.methodGroupsByMethod.values()
    )
      .sort(
        (a, b) =>
          learnerMethodRank(a.method) -
            learnerMethodRank(b.method) ||
          a.method.localeCompare(b.method)
      )
      .map(group => ({
        method: group.method,
        label: group.label,
        pokemon: Array.from(
          group.pokemonById.values()
        )
          .map(pokemon => {
            const levels =
              pokemon.levels.sort(
                (a, b) => a - b
              );

            return {
              ...pokemon,
              levels,
              lowestLevel:
                levels[0] ?? null,
              versionGroups:
                pokemon.versionGroups.sort()
            };
          })
          .sort(
            (a, b) => a.id - b.id
          )
      }));

    delete learnerData.pokemonById;
    delete learnerData.methodGroupsByMethod;
  }

  return learners;
}

function buildMoveRecord(
  data,
  machineItems,
  flags
) {
  const effectEntries =
    mapEffectEntries(data.effect_entries);
  const primaryEffect =
    effectEntries[0] ?? {};

  return {
    id: data.id,
    name: data.name,
    displayName: getEnglishName(data),
    type: data.type?.name ?? null,
    category:
      data.damage_class?.name ?? null,
    power: data.power,
    accuracy: data.accuracy,
    pp: data.pp,
    priority: data.priority,
    effectChance:
      data.effect_chance,
    target:
      data.target?.name ?? null,
    generation:
      data.generation?.name ?? null,
    effect:
      primaryEffect.effect ?? null,
    shortEffect:
      primaryEffect.shortEffect ?? null,
    description:
      primaryEffect.shortEffect ?? null,
    effectEntries,
    flavorTextEntries:
      mapFlavorTextEntries(
        data.flavor_text_entries
      ),
    meta: mapMeta(data.meta),
    statChanges: mapStatChanges(
      data.stat_changes
    ),
    flags: flags ?? [],
    pastValues: mapPastValues(
      data.past_values
    ),
    machineItems:
      machineItems ?? []
  };
}

function buildIndexRecord(move) {
  return {
    id: move.id,
    name: move.name,
    displayName: move.displayName,
    type: move.type,
    category: move.category,
    power: move.power,
    accuracy: move.accuracy,
    pp: move.pp,
    priority: move.priority,
    effectChance: move.effectChance,
    target: move.target,
    generation: move.generation,
    description: move.description,
    shortEffect: move.shortEffect,
    machineItems: move.machineItems
  };
}

async function writeJson(filePath, data) {
  await fs.writeFile(
    filePath,
    `${JSON.stringify(data, null, 2)}\n`
  );
}

async function getMoveList() {
  try {
    console.log("Fetching move list...");

    const list =
      await fetchJson(
        `${API_BASE}/move?limit=100000`
      );

    return list.results ?? [];
  } catch (error) {
    console.warn(
      `Could not fetch move list, using local move files instead: ${error.message}`
    );

    const files =
      await fs.readdir(movesDir);

    return files
      .filter(file =>
        file.endsWith(".json")
      )
      .map(file => ({
        name: file.replace(/\.json$/, ""),
        url: null
      }));
  }
}

async function main() {
  await fs.mkdir(movesDir, {
    recursive: true
  });
  await fs.mkdir(moveLearnersDir, {
    recursive: true
  });

  const machineItemsByMove =
    await buildMachineItemsByMove();
  const moveFlagsByMove =
    await buildMoveFlagsByMove();
  const learnersByMove =
    await buildMoveLearners();
  const failures = [];

  const moveList =
    await getMoveList();
  const movesIndex = [];
  const legacyMoves = {};

  console.log(
    `Found ${moveList.length} moves.`
  );

  for (const [index, move] of moveList.entries()) {
    try {
      if (
        index % 25 === 0 ||
        index === moveList.length - 1
      ) {
        console.log(
          `[${index + 1}/${moveList.length}] ${move.name}`
        );
      }

      const moveFilePath =
        path.join(
          movesDir,
          `${move.name}.json`
        );

      let moveRecord =
        !refreshExisting
          ? await readJson(
              moveFilePath,
              null
            )
          : null;

      if (!moveRecord?.name) {
        if (!move.url) {
          throw new Error(
            "No local move file and no API URL available"
          );
        }

        const data =
          await fetchJson(move.url);
        const machineItems =
          machineItemsByMove.get(
            data.name
          ) ?? [];

        moveRecord =
          buildMoveRecord(
            data,
            machineItems,
            moveFlagsByMove.get(data.name) ?? []
          );

        await writeJson(
          moveFilePath,
          moveRecord
        );
      }

      moveRecord.flags =
        moveFlagsByMove.get(moveRecord.name) ??
        moveRecord.flags ??
        [];

      movesIndex.push(
        buildIndexRecord(moveRecord)
      );

      legacyMoves[moveRecord.name] =
        buildIndexRecord(moveRecord);

      const learners =
        learnersByMove.get(
          moveRecord.name
        );

      if (learners) {
        await writeJson(
          path.join(
            moveLearnersDir,
            `${moveRecord.name}.json`
          ),
          learners
        );
      }
    } catch (error) {
      failures.push({
        move: move.name,
        error: error.message
      });
      console.warn(
        `Failed to generate ${move.name}: ${error.message}`
      );
    }
  }

  movesIndex.sort(
    (a, b) => a.id - b.id
  );

  await writeJson(
    movesIndexPath,
    movesIndex
  );
  await writeJson(
    legacyMovesPath,
    legacyMoves
  );

  console.log(
    `Generated ${movesIndex.length} moves.`
  );
  console.log(
    `Generated ${learnersByMove.size} move learner files.`
  );

  if (failures.length) {
    console.warn(
      `Failed ${failures.length} moves:`
    );
    for (const failure of failures) {
      console.warn(
        `- ${failure.move}: ${failure.error}`
      );
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
