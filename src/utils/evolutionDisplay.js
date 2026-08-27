import { formatPokemonDisplayName } from "./pokemonNames.js";

export const LARGE_BRANCH_EVOLUTION_THRESHOLD = 4;

const NON_EVOLUTION_FORM_TOKENS =
  new Set(["mega", "gmax"]);

function capitalizeWord(word) {
  return (
    word.charAt(0).toUpperCase() +
    word.slice(1)
  );
}

export function capitalizeEvolutionText(text) {
  return String(text ?? "")
    .split("-")
    .filter(Boolean)
    .map(capitalizeWord)
    .join(" ");
}

export function getEvolutionOverride(
  pokemonName,
  evolutionMethodOverrides
) {
  return evolutionMethodOverrides?.[
    pokemonName
  ] ?? null;
}

export function getMethodSlug(method) {
  return (
    method.slug ||
    method.item ||
    method.move ||
    ""
  );
}

export function getMethodLabel(method) {
  return (
    method.label ||
    method.text ||
    capitalizeEvolutionText(
      getMethodSlug(method)
    )
  );
}

export function shouldSuppressEvolutionNode(
  node,
  evolutionMethodOverrides
) {
  return Boolean(
    getEvolutionOverride(
      node.pokemon?.name,
      evolutionMethodOverrides
    )?.suppressEvolutionNode
  );
}

export function getSourcePokemonName(
  node,
  evolutionMethodOverrides
) {
  return getEvolutionOverride(
    node.pokemon?.name,
    evolutionMethodOverrides
  )?.sourcePokemonName ?? null;
}

export function shouldShowEvolutionChildNode(
  child,
  displayedPokemon,
  evolutionMethodOverrides
) {
  if (
    shouldSuppressEvolutionNode(
      child,
      evolutionMethodOverrides
    )
  ) {
    return false;
  }

  const sourcePokemonName =
    getSourcePokemonName(
      child,
      evolutionMethodOverrides
    );

  if (!sourcePokemonName) {
    return true;
  }

  return (
    sourcePokemonName ===
    displayedPokemon?.name
  );
}

function findSourceOverrideName(
  node,
  currentPokemonName,
  evolutionMethodOverrides
) {
  if (!currentPokemonName) {
    return null;
  }

  for (const child of node.evolvesTo ?? []) {
    const childNames = [
      child.pokemon?.name,
      ...(child.varieties ?? []).map(
        variety => variety.name
      )
    ].filter(Boolean);

    if (
      childNames.includes(
        currentPokemonName
      )
    ) {
      const matchingOverride =
        getEvolutionOverride(
          currentPokemonName,
          evolutionMethodOverrides
        ) ||
        getEvolutionOverride(
          child.pokemon?.name,
          evolutionMethodOverrides
        );

      if (
        matchingOverride?.sourcePokemonName
      ) {
        return matchingOverride
          .sourcePokemonName;
      }
    }
  }

  return null;
}

function isNonEvolutionFormName(name) {
  return String(name ?? "")
    .split("-")
    .some(part =>
      NON_EVOLUTION_FORM_TOKENS.has(part)
    );
}

export function getDisplayedEvolutionPokemon(
  node,
  activeFormKey,
  currentPokemonName,
  evolutionMethodOverrides
) {
  const matchingCurrentVariety =
    node.varieties?.find(
      variety =>
        variety.name ===
        currentPokemonName
    );

  if (matchingCurrentVariety) {
    if (
      !isNonEvolutionFormName(
        matchingCurrentVariety.name
      )
    ) {
      return matchingCurrentVariety;
    }
  }

  if (!activeFormKey) {
    const sourceOverrideName =
      findSourceOverrideName(
        node,
        currentPokemonName,
        evolutionMethodOverrides
      );

    const sourceOverrideVariety =
      node.varieties?.find(
        variety =>
          variety.name ===
          sourceOverrideName
      );

    return (
      sourceOverrideVariety ||
      node.pokemon
    );
  }

  const matchingVariety =
    node.varieties?.find(
      variety =>
        variety.name.endsWith(
          `-${activeFormKey}`
        )
    );

  return (
    matchingVariety ||
    node.pokemon
  );
}

function addTextPart(parts, text) {
  if (!text) {
    return;
  }

  parts.push({
    text
  });
}

function addSpacedTextPart(parts, text) {
  if (!text) {
    return;
  }

  const previousText =
    parts.at(-1)?.text ?? "";
  const needsSpace =
    parts.length > 0 &&
    !String(previousText).endsWith(" ") &&
    !String(text).startsWith(" ") &&
    text !== " / ";

  addTextPart(
    parts,
    `${needsSpace ? " " : ""}${text}`
  );
}

function addLinkedPart(
  parts,
  type,
  slug,
  text = null
) {
  if (!slug) {
    return;
  }

  parts.push({
    type,
    slug,
    text:
      text ||
      capitalizeEvolutionText(slug)
  });
}

function normalizeMethodSegment(segment) {
  if (typeof segment === "string") {
    return {
      text: segment
    };
  }

  return {
    ...segment,
    text: segment.text ?? ""
  };
}

function methodToParts(method) {
  if (method.segments) {
    return method.segments.map(
      normalizeMethodSegment
    );
  }

  if (
    method.type === "item" ||
    method.type === "use-item"
  ) {
    return [
      {
        type: "item",
        slug: getMethodSlug(method),
        text: getMethodLabel(method)
      }
    ];
  }

  if (method.type === "move") {
    return [
      {
        type: "move",
        slug: getMethodSlug(method),
        text: getMethodLabel(method)
      }
    ];
  }

  if (method.type === "location") {
    return [
      {
        type: "location",
        slug: getMethodSlug(method),
        text: getMethodLabel(method)
      }
    ];
  }

  return [
    {
      text: getMethodLabel(method)
    }
  ];
}

function getBaseEvolutionMethodParts(node) {
  const parts = [];

  if (node.trigger === "level-up") {
    addTextPart(parts, "Lvl. up");
  }

  if (node.trigger === "trade") {
    addTextPart(parts, "Trade");
  }

  if (node.item) {
    addLinkedPart(
      parts,
      "item",
      node.item
    );
  }

  if (node.heldItem) {
    addSpacedTextPart(
      parts,
      "holding "
    );
    addLinkedPart(
      parts,
      "item",
      node.heldItem
    );
  }

  if (node.trigger === "use-move") {
    const moveName =
      node.useMove ||
      node.requiredMove;

    if (moveName) {
      addTextPart(parts, "use ");
      addLinkedPart(
        parts,
        "move",
        moveName
      );

      if (
        node.requiredMoveUses ||
        node.moveUses
      ) {
        addTextPart(
          parts,
          ` ${node.requiredMoveUses || node.moveUses} times`
        );
      }
    } else {
      addTextPart(parts, "Use move");
    }
  }

  const remainingParts = [];

  if (
    node.trigger !== "use-move" &&
    node.minLevel
  ) {
    addTextPart(
      remainingParts,
      `at level ${node.minLevel}`
    );
  }

  if (node.minHappiness) {
    addTextPart(
      remainingParts,
      " high friendship"
    );
  }

  if (node.minBeauty) {
    addTextPart(
      remainingParts,
      "with high beauty"
    );
  }

  if (node.minAffection) {
    addTextPart(
      remainingParts,
      "with high affection"
    );
  }

  if (node.timeOfDay) {
    addTextPart(
      remainingParts,
      node.timeOfDay === "full-moon"
        ? "during a full moon"
        : `during the ${node.timeOfDay}`
    );
  }

  if (node.knownMove) {
    addSpacedTextPart(
      parts,
      "knowing "
    );
    addLinkedPart(
      parts,
      "move",
      node.knownMove
    );
  }

  if (node.knownMoveType) {
    addTextPart(
      remainingParts,
      `knowing a ${capitalizeEvolutionText(
        node.knownMoveType
      )}-type move`
    );
  }

  if (node.location) {
    addSpacedTextPart(parts, "at ");
    addLinkedPart(
      parts,
      "location",
      node.location
    );
  }

  if (node.partySpecies) {
    addTextPart(
      remainingParts,
      `with ${capitalizeEvolutionText(
        node.partySpecies
      )} in party`
    );
  }

  if (node.partyType) {
    addTextPart(
      remainingParts,
      `with a ${capitalizeEvolutionText(
        node.partyType
      )}-type Pokémon in party`
    );
  }

  if (node.tradeSpecies) {
    addTextPart(
      remainingParts,
      `with ${capitalizeEvolutionText(
        node.tradeSpecies
      )}`
    );
  }

  if (node.gender === 1) {
    addTextPart(
      remainingParts,
      "female only"
    );
  }

  if (node.gender === 2) {
    addTextPart(
      remainingParts,
      "male only"
    );
  }

  if (node.relativePhysicalStats === 1) {
    addTextPart(
      remainingParts,
      "Attack > Defense"
    );
  }

  if (node.relativePhysicalStats === -1) {
    addTextPart(
      remainingParts,
      "Attack < Defense"
    );
  }

  if (node.relativePhysicalStats === 0) {
    addTextPart(
      remainingParts,
      "Attack = Defense"
    );
  }

  if (node.needsOverworldRain) {
    addTextPart(
      remainingParts,
      "during rain"
    );
  }

  if (node.turnUpsideDown) {
    addTextPart(
      remainingParts,
      "while holding the console upside down"
    );
  }

  if (remainingParts.length > 0) {
    addSpacedTextPart(
      parts,
      methodPartsToText(remainingParts)
    );
  }

  return parts;
}

export function getEvolutionMethodOverride(
  node,
  displayedPokemon,
  evolutionMethodOverrides
) {
  return (
    getEvolutionOverride(
      displayedPokemon?.name,
      evolutionMethodOverrides
    ) ||
    getEvolutionOverride(
      node.pokemon?.name,
      evolutionMethodOverrides
    )
  );
}

export function getEvolutionMethodParts(
  node,
  displayedPokemon,
  evolutionMethodOverrides
) {
  const override =
    getEvolutionMethodOverride(
      node,
      displayedPokemon,
      evolutionMethodOverrides
    );
  const parts = override?.primaryMethod
    ? methodToParts(override.primaryMethod)
    : getBaseEvolutionMethodParts(node);
  const additionalItems =
    override?.additionalMethods?.filter(
      method =>
        method.type === "use-item" ||
        method.type === "item"
    ) ?? [];

  additionalItems.forEach(method => {
    addTextPart(parts, " / ");
    parts.push(
      ...methodToParts(method)
    );
  });

  return parts;
}

export function methodPartsToText(parts) {
  return parts
    .map(part => part.text ?? "")
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

export function getEvolutionDescriptionText(
  node,
  displayedPokemon,
  evolutionMethodOverrides
) {
  return methodPartsToText(
    getEvolutionMethodParts(
      node,
      displayedPokemon,
      evolutionMethodOverrides
    )
  );
}

export function collectPokemonSummaries(
  node,
  summaries = {}
) {
  if (!node) {
    return summaries;
  }

  [
    node.pokemon,
    ...(node.varieties ?? [])
  ]
    .filter(Boolean)
    .forEach(pokemon => {
      if (pokemon.name) {
        summaries[pokemon.name] = pokemon;
      }
    });

  (node.evolvesTo ?? []).forEach(
    child =>
      collectPokemonSummaries(
        child,
        summaries
      )
  );

  return summaries;
}

export function getVersionNotes(path) {
  const notes = [];

  if (path.versionNote) {
    notes.push(path.versionNote);
  }

  if (Array.isArray(path.versionNotes)) {
    notes.push(...path.versionNotes);
  }

  if (path.versionException?.note) {
    notes.push(path.versionException.note);
  }

  if (
    Array.isArray(path.versionExceptions)
  ) {
    path.versionExceptions.forEach(
      exception => {
        if (exception.note) {
          notes.push(exception.note);
        }
      }
    );
  }

  return notes;
}

export function getFallbackPokemonSummary(name) {
  return {
    id: 0,
    name,
    sprite: "",
    types: []
  };
}

export function getVisibleFormEvolutionPaths(
  paths = [],
  currentPokemonName
) {
  const matchingPaths =
    currentPokemonName
      ? paths.filter(
          path =>
            path.basePokemon ===
              currentPokemonName ||
            path.evolvesTo ===
              currentPokemonName
        )
      : paths;

  return matchingPaths.length > 0
    ? matchingPaths
    : paths;
}

export function buildEvolutionDisplayModel(
  node,
  {
    activeFormKey = null,
    currentPokemonName = null,
    evolutionMethodOverrides = {}
  } = {}
) {
  if (!node) {
    return null;
  }

  const displayedPokemon =
    getDisplayedEvolutionPokemon(
      node,
      activeFormKey,
      currentPokemonName,
      evolutionMethodOverrides
    );
  const visibleChildren =
    (node.evolvesTo ?? []).filter(
      child =>
        shouldShowEvolutionChildNode(
          child,
          displayedPokemon,
          evolutionMethodOverrides
        )
    );
  const methodParts = node.trigger
    ? getEvolutionMethodParts(
        node,
        displayedPokemon,
        evolutionMethodOverrides
      )
    : [];

  return {
    node,
    pokemon: displayedPokemon,
    methodParts,
    methodText: methodPartsToText(methodParts),
    note:
      getEvolutionMethodOverride(
        node,
        displayedPokemon,
        evolutionMethodOverrides
      )?.note ?? null,
    children: visibleChildren
      .map(child =>
        buildEvolutionDisplayModel(
          child,
          {
            activeFormKey,
            currentPokemonName,
            evolutionMethodOverrides
          }
        )
      )
      .filter(Boolean)
  };
}

function startsWithVowelSound(text) {
  return /^[aeiou]/i.test(
    String(text).trim()
  );
}

function withArticle(text) {
  const trimmed = String(text).trim();
  const lower = trimmed.toLowerCase();

  if (
    lower.startsWith("a ") ||
    lower.startsWith("an ") ||
    lower.startsWith("the ")
  ) {
    return trimmed;
  }

  return `${startsWithVowelSound(trimmed) ? "an" : "a"} ${trimmed}`;
}

function lowerFirst(text) {
  const trimmed = String(text).trim();

  return (
    trimmed.charAt(0).toLowerCase() +
    trimmed.slice(1)
  );
}

function sentenceCase(text) {
  const trimmed = String(text).trim();

  return (
    trimmed.charAt(0).toUpperCase() +
    trimmed.slice(1)
  );
}

function joinList(items, conjunction = "and") {
  const filtered = items.filter(Boolean);

  if (filtered.length <= 1) {
    return filtered[0] ?? "";
  }

  if (filtered.length === 2) {
    return `${filtered[0]} ${conjunction} ${filtered[1]}`;
  }

  return `${filtered
    .slice(0, -1)
    .join(", ")}, ${conjunction} ${filtered.at(-1)}`;
}

function splitAlternativeMethods(text) {
  return String(text)
    .split(/\s+\/\s+/)
    .map(method => method.trim())
    .filter(Boolean);
}

function looksLikeItemLabel(text) {
  return /^[A-Z][A-Za-z0-9' -]+$/.test(
    String(text).trim()
  );
}

function formatDisplayMethodForSummary(
  text,
  {
    itemOnly = false
  } = {}
) {
  const trimmed = String(text)
    .replace(/\s+/g, " ")
    .trim();

  if (!trimmed) {
    return "";
  }

  if (
    /^Lvl\. up with high beauty$/i.test(trimmed)
  ) {
    return "by raising its Beauty and leveling up";
  }

  if (/^Lvl\. up at level \d+$/i.test(trimmed)) {
    return trimmed.replace(
      /^Lvl\. up /i,
      ""
    );
  }

  if (/^Lvl\. up /i.test(trimmed)) {
    return `by leveling up ${trimmed
      .replace(/^Lvl\. up /i, "")
      .trim()}`;
  }

  if (/^Trade holding /i.test(trimmed)) {
    return `by trading while holding ${withArticle(
      trimmed
        .replace(/^Trade holding /i, "")
        .trim()
    )}`;
  }

  if (/^Trade while holding /i.test(trimmed)) {
    return `by trading while holding ${withArticle(
      trimmed
        .replace(/^Trade while holding /i, "")
        .trim()
    )}`;
  }

  if (/^Trade with /i.test(trimmed)) {
    return `by trading with ${trimmed
      .replace(/^Trade with /i, "")
      .trim()}`;
  }

  if (/^Trade$/i.test(trimmed)) {
    return "by trading";
  }

  if (/^Use /i.test(trimmed)) {
    return `by using ${lowerFirst(
      trimmed.replace(/^Use /i, "")
    )}`;
  }

  if (/^use /i.test(trimmed)) {
    return `by using ${trimmed
      .replace(/^use /i, "")
      .trim()}`;
  }

  if (/^level \d+/i.test(trimmed)) {
    return `at ${lowerFirst(trimmed)}`;
  }

  if (
    itemOnly ||
    looksLikeItemLabel(trimmed)
  ) {
    return `with ${withArticle(trimmed)}`;
  }

  return `by ${lowerFirst(trimmed)}`;
}

function getEvolutionSummaryMethodText(
  model
) {
  if (!model?.methodText) {
    return "";
  }

  const methods = splitAlternativeMethods(
    model.methodText
  ).map(method =>
    formatDisplayMethodForSummary(
      method,
      {
        itemOnly:
          model.node?.trigger ===
          "use-item"
      }
    )
  );

  return joinList(methods, "or");
}

function getPokemonDisplayName(pokemon) {
  return formatPokemonDisplayName(pokemon);
}

function getEdgePhrase(child) {
  const name = getPokemonDisplayName(
    child.pokemon
  );
  const method =
    getEvolutionSummaryMethodText(child);

  return method
    ? `${name} ${method}`
    : name;
}

function summarizeLargeBranchNode(model) {
  const name = getPokemonDisplayName(
    model.pokemon
  );
  const children = model.children.map(
    child =>
      getPokemonDisplayName(child.pokemon)
  );

  return `${name} has ${children.length} possible evolutions: ${joinList(children)}, with the required method varying by evolution.`;
}

function summarizeBranchNode(
  model,
  useThen = false
) {
  const name = getPokemonDisplayName(
    model.pokemon
  );
  const childPhrases =
    model.children.map(getEdgePhrase);

  return `${name} can${useThen ? " then" : ""} evolve into ${joinList(childPhrases, "or")}.`;
}

function collectSummarySentences(
  model,
  sentences = [],
  useThen = false
) {
  if (!model?.children?.length) {
    return sentences;
  }

  if (
    model.children.length >
    LARGE_BRANCH_EVOLUTION_THRESHOLD
  ) {
    sentences.push(
      summarizeLargeBranchNode(model)
    );
    return sentences;
  }

  if (model.children.length > 1) {
    sentences.push(
      summarizeBranchNode(model, useThen)
    );

    model.children.forEach(child =>
      collectSummarySentences(
        child,
        sentences,
        true
      )
    );
    return sentences;
  }

  const [child] = model.children;
  const parentName = getPokemonDisplayName(
    model.pokemon
  );
  const childName = getPokemonDisplayName(
    child.pokemon
  );
  const method =
    getEvolutionSummaryMethodText(child);

  sentences.push(
    `${parentName} evolves into ${childName}${method ? ` ${method}` : ""}.`
  );

  collectSummarySentences(
    child,
    sentences,
    true
  );
  return sentences;
}

function compactLinearSentences(sentences) {
  if (sentences.length !== 2) {
    return sentences.join(" ");
  }

  return `${sentences[0].replace(/\.$/, "")}, and ${sentences[1]}`;
}

function pathToSummaryText(path) {
  if (path.accessibleLabel) {
    return path.accessibleLabel.trim();
  }

  const baseName =
    getPokemonDisplayName(
      path.basePokemon
    );
  const evolvedName =
    getPokemonDisplayName(
      path.evolvesTo
    );
  const condition =
    path.displayCondition ||
    path.condition ||
    "the required method varies";

  return `${baseName} evolves into ${evolvedName} by ${lowerFirst(condition)}.`;
}

function summarizeFormEvolutionPaths(
  root,
  paths,
  currentPokemonName
) {
  const visiblePaths =
    getVisibleFormEvolutionPaths(
      paths,
      currentPokemonName
    );
  const sentences =
    visiblePaths.map(pathToSummaryText);

  if (sentences.length === 0) {
    const displayName =
      formatPokemonDisplayName(
        root?.pokemon
      );

    return `${displayName} does not evolve into or from any other Pokémon.`;
  }

  return sentences.join(" ");
}

export function getEvolutionSummaryText(
  root,
  {
    activeFormKey = null,
    currentPokemonName = null,
    evolutionMethodOverrides = {}
  } = {}
) {
  if (!root) {
    return "";
  }

  const rootOverride =
    getEvolutionOverride(
      root.pokemon?.name,
      evolutionMethodOverrides
    );

  if (
    rootOverride?.replaceDefaultEvolutionDisplay &&
    Array.isArray(
      rootOverride.formEvolutionPaths
    )
  ) {
    return summarizeFormEvolutionPaths(
      root,
      rootOverride.formEvolutionPaths,
      currentPokemonName
    );
  }

  const model =
    buildEvolutionDisplayModel(root, {
      activeFormKey,
      currentPokemonName,
      evolutionMethodOverrides
    });

  if (!model?.children?.length) {
    const displayName =
      formatPokemonDisplayName(
        model?.pokemon ?? root.pokemon
      );

    return `${displayName} does not evolve into or from any other Pokémon.`;
  }

  return sentenceCase(
    compactLinearSentences(
      collectSummarySentences(model)
    )
  );
}

export function getEvolutionSummaryMeta() {
  return {
    largeBranchThreshold:
      LARGE_BRANCH_EVOLUTION_THRESHOLD
  };
}
