import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isItemHiddenFromUi } from "../src/utils/itemVisibility.js";
import { normalizePokeloreLinkLabel } from "../src/utils/pokeloreTextLinks.js";

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);
const repoRoot = path.resolve(__dirname, "..");
const dataDir = path.join(
  repoRoot,
  "public",
  "data"
);
const outputPath = path.join(
  dataDir,
  "pokeloreLinkTargets.json"
);

const POKEMON_NAME_OVERRIDES = new Map([
  ["farfetchd", "Farfetch'd"],
  ["farfetchd-galar", "Galarian Farfetch'd"],
  ["sirfetchd", "Sirfetch'd"],
  ["mr-mime", "Mr. Mime"],
  ["mr-mime-galar", "Galarian Mr. Mime"],
  ["mr-rime", "Mr. Rime"],
  ["mime-jr", "Mime Jr."],
  ["nidoran-f", "Nidoran F"],
  ["nidoran-m", "Nidoran M"],
  ["ho-oh", "Ho-Oh"],
  ["jangmo-o", "Jangmo-o"],
  ["hakamo-o", "Hakamo-o"],
  ["kommo-o", "Kommo-o"],
  ["porygon-z", "Porygon-Z"],
  ["type-null", "Type: Null"]
]);
const TYPE_NAME_MOVES = new Set([
  "Bug",
  "Dark",
  "Dragon",
  "Electric",
  "Fairy",
  "Fighting",
  "Fire",
  "Flying",
  "Ghost",
  "Grass",
  "Ground",
  "Ice",
  "Normal",
  "Poison",
  "Psychic",
  "Rock",
  "Steel",
  "Water"
]);

function readJson(filePath) {
  return JSON.parse(
    fs.readFileSync(filePath, "utf8")
  );
}

function titleCaseSlug(value = "") {
  return String(value)
    .split("-")
    .filter(Boolean)
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function pokemonLabel(routeName) {
  if (POKEMON_NAME_OVERRIDES.has(routeName)) {
    return POKEMON_NAME_OVERRIDES.get(routeName);
  }

  if (routeName.endsWith("-alola")) {
    return `Alolan ${pokemonLabel(
      routeName.replace(/-alola$/, "")
    )}`;
  }

  if (routeName.endsWith("-galar")) {
    return `Galarian ${pokemonLabel(
      routeName.replace(/-galar$/, "")
    )}`;
  }

  if (routeName.endsWith("-hisui")) {
    return `Hisuian ${pokemonLabel(
      routeName.replace(/-hisui$/, "")
    )}`;
  }

  if (routeName.includes("-paldea-")) {
    const [baseName, formName] =
      routeName.split("-paldea-");
    return `Paldean ${pokemonLabel(
      baseName
    )} ${titleCaseSlug(formName)}`;
  }

  return titleCaseSlug(routeName);
}

function addTarget(targets, seen, target) {
  const normalizedLabel =
    normalizePokeloreLinkLabel(target.label);

  if (
    !normalizedLabel ||
    target.label.length < 3
  ) {
    return;
  }

  const key = `${target.label}|${target.route}`;

  if (seen.has(key)) return;

  seen.add(key);
  targets.push({
    ...target,
    normalizedLabel
  });
}

function addLabelVariants(
  targets,
  seen,
  target
) {
  addTarget(targets, seen, target);

  if (target.label.includes("’")) {
    addTarget(targets, seen, {
      ...target,
      label: target.label.replaceAll("’", "'")
    });
  }
}

function buildPokemonTargets(targets, seen) {
  const routes = readJson(
    path.join(dataDir, "pokemonRoutes.json")
  );

  for (const [routeName, id] of Object.entries(
    routes.byName ?? {}
  )) {
    const label = pokemonLabel(routeName);

    addLabelVariants(targets, seen, {
      label,
      route: `/pokemon/${routeName}`,
      category: "pokemon",
      id
    });

    if (routeName.startsWith("tauros-paldea-")) {
      const breed = routeName
        .replace("tauros-paldea-", "")
        .replace("-breed", " Breed");
      addLabelVariants(targets, seen, {
        label: `${titleCaseSlug(
          breed
        )} Paldean Tauros`,
        route: `/pokemon/${routeName}`,
        category: "pokemon",
        id
      });
      addLabelVariants(targets, seen, {
        label: `${titleCaseSlug(breed)} Tauros`,
        route: `/pokemon/${routeName}`,
        category: "pokemon",
        id
      });
    }
  }
}

function buildMoveTargets(targets, seen) {
  const moves = readJson(
    path.join(dataDir, "movesIndex.json")
  );

  for (const move of moves) {
    const label =
      move.displayName ??
      titleCaseSlug(move.name);

    if (TYPE_NAME_MOVES.has(label)) {
      continue;
    }

    addLabelVariants(targets, seen, {
      label,
      route: `/move/${move.name}`,
      category: "move"
    });
  }
}

function buildAbilityTargets(targets, seen) {
  const abilities = readJson(
    path.join(dataDir, "abilities.json")
  );

  for (const ability of Object.values(abilities)) {
    addLabelVariants(targets, seen, {
      label: titleCaseSlug(ability.name),
      route: `/ability/${ability.name}`,
      category: "ability"
    });
  }
}

function buildItemTargets(targets, seen) {
  const items = readJson(
    path.join(dataDir, "itemsIndex.json")
  );

  for (const item of items) {
    if (isItemHiddenFromUi(item)) {
      continue;
    }

    addLabelVariants(targets, seen, {
      label:
        item.displayName ??
        titleCaseSlug(item.name),
      route: `/item/${item.name}`,
      category: "item"
    });
  }
}

function main() {
  const targets = [];
  const seen = new Set();

  buildPokemonTargets(targets, seen);
  buildMoveTargets(targets, seen);
  buildAbilityTargets(targets, seen);
  buildItemTargets(targets, seen);

  targets.sort(
    (first, second) =>
      second.label.length - first.label.length ||
      first.label.localeCompare(second.label)
  );

  fs.writeFileSync(
    outputPath,
    `${JSON.stringify(targets, null, 2)}\n`
  );

  console.log(
    `Generated ${targets.length} PokeLore link targets at ${outputPath}`
  );
}

main();
