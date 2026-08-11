const POKEMON_CATEGORY = "pokemon";

function normalizeComparableText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeRouteName(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function isWordCharacter(character) {
  return /[A-Za-z0-9]/.test(character ?? "");
}

function isBoundary(text, index) {
  if (index <= 0 || index >= text.length) {
    return true;
  }

  return !isWordCharacter(text[index]);
}

function hasVisibleCapital(match) {
  const firstLetter = match.match(/[A-Za-z]/)?.[0];
  return !firstLetter || firstLetter === firstLetter.toUpperCase();
}

function routeNameFromPokemon(pokemon) {
  return normalizeRouteName(pokemon?.name);
}

function shouldSkipTarget(target, currentPokemon) {
  if (target.category !== POKEMON_CATEGORY) {
    return false;
  }

  const currentRouteName =
    routeNameFromPokemon(currentPokemon);

  return Boolean(
    currentRouteName &&
      target.route === `/pokemon/${currentRouteName}`
  );
}

function shouldSkipPokemonTarget(
  target,
  currentPokemon,
  excludedPokemonRoutes,
  excludedPokemonLabels
) {
  if (target.category !== POKEMON_CATEGORY) {
    return false;
  }

  return (
    shouldSkipTarget(target, currentPokemon) ||
    excludedPokemonRoutes.has(target.route) ||
    excludedPokemonLabels.has(
      normalizePokeloreLinkLabel(target.label)
    )
  );
}

function rangesOverlap(first, second) {
  return (
    first.start < second.end &&
    second.start < first.end
  );
}

function findProtectedRanges(
  text,
  targets,
  currentPokemon,
  excludedPokemonRoutes,
  excludedPokemonLabels
) {
  const protectedRanges = [];

  for (const target of targets) {
    if (
      !shouldSkipPokemonTarget(
        target,
        currentPokemon,
        excludedPokemonRoutes,
        excludedPokemonLabels
      )
    ) {
      continue;
    }

    const label = target.label;
    let searchIndex = 0;

    while (searchIndex < text.length) {
      const index = text
        .toLowerCase()
        .indexOf(
          label.toLowerCase(),
          searchIndex
        );

      if (index === -1) break;

      const endIndex = index + label.length;
      const matchedText = text.slice(
        index,
        endIndex
      );

      if (
        isBoundary(text, index - 1) &&
        isBoundary(text, endIndex) &&
        hasVisibleCapital(matchedText)
      ) {
        protectedRanges.push({
          start: index,
          end: endIndex
        });
      }

      searchIndex = index + 1;
    }
  }

  return protectedRanges;
}

function findNextMatch(
  text,
  startIndex,
  targets,
  currentPokemon,
  protectedRanges,
  excludedPokemonRoutes,
  excludedPokemonLabels,
  usedRoutes
) {
  let bestMatch = null;

  for (const target of targets) {
    if (
      usedRoutes.has(target.route) ||
      shouldSkipPokemonTarget(
        target,
        currentPokemon,
        excludedPokemonRoutes,
        excludedPokemonLabels
      )
    ) {
      continue;
    }

    const label = target.label;
    let searchIndex = startIndex;

    while (searchIndex < text.length) {
      const index = text
        .toLowerCase()
        .indexOf(
          label.toLowerCase(),
          searchIndex
        );

      if (index === -1) break;

      const endIndex = index + label.length;
      const matchedText = text.slice(
        index,
        endIndex
      );
      const range = {
        start: index,
        end: endIndex
      };

      if (
        isBoundary(text, index - 1) &&
        isBoundary(text, endIndex) &&
        hasVisibleCapital(matchedText) &&
        !protectedRanges.some(protectedRange =>
          rangesOverlap(range, protectedRange)
        )
      ) {
        if (
          !bestMatch ||
          index < bestMatch.index ||
          (index === bestMatch.index &&
            label.length > bestMatch.label.length)
        ) {
          bestMatch = {
            ...target,
            index,
            endIndex,
            text: matchedText
          };
        }

        break;
      }

      searchIndex = index + 1;
    }
  }

  return bestMatch;
}

export function linkifyPokeloreText(
  text,
  targets = [],
  currentPokemon,
  options = {}
) {
  const source = String(text ?? "");
  const excludedPokemonRoutes = new Set(
    options.excludedPokemonRoutes ?? []
  );
  const excludedPokemonLabels = new Set(
    (options.excludedPokemonLabels ?? []).map(label =>
      normalizePokeloreLinkLabel(label)
    )
  );
  const sortedTargets = [...targets].sort(
    (first, second) =>
      second.label.length - first.label.length ||
      first.label.localeCompare(second.label)
  );
  const protectedRanges = findProtectedRanges(
    source,
    sortedTargets,
    currentPokemon,
    excludedPokemonRoutes,
    excludedPokemonLabels
  );
  const parts = [];
  const usedRoutes =
    options.usedRoutes instanceof Set
      ? options.usedRoutes
      : new Set(options.usedRoutes ?? []);
  let cursor = 0;

  while (cursor < source.length) {
    const match = findNextMatch(
      source,
      cursor,
      sortedTargets,
      currentPokemon,
      protectedRanges,
      excludedPokemonRoutes,
      excludedPokemonLabels,
      usedRoutes
    );

    if (!match) {
      parts.push({
        text: source.slice(cursor)
      });
      break;
    }

    if (match.index > cursor) {
      parts.push({
        text: source.slice(cursor, match.index)
      });
    }

    parts.push({
      text: match.text,
      href: match.route,
      category: match.category
    });
    usedRoutes.add(match.route);

    cursor = match.endIndex;
  }

  return parts.filter(part => part.text);
}

export function normalizePokeloreLinkLabel(label) {
  return normalizeComparableText(label);
}

export function getPokeloreLinePokemonLabels(analysis) {
  return (analysis?.linePokemon ?? []).flatMap(pokemon => {
    const name = String(pokemon.name ?? "").trim();
    const form = String(pokemon.form ?? "").trim();
    const labels = name ? [name] : [];

    if (
      form &&
      !["Kantonian", "Johtonian"].includes(form)
    ) {
      labels.push(`${form} ${name}`);

      if (form.startsWith("Paldean ")) {
        const breed = form.replace(
          /^Paldean\s+/,
          ""
        );

        labels.push(`${breed} Paldean ${name}`);
        labels.push(`${breed} ${name}`);
      }
    }

    return labels;
  });
}
