const QUOTE_PAIRS = new Map([
  ['"', '"'],
  ["'", "'"],
  ["\u201c", "\u201d"],
  ["\u2018", "\u2019"]
]);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function removeWrappingQuotes(value) {
  const trimmed = value.trim();

  if (trimmed.length < 2) {
    return {
      isQuoted: false,
      term: trimmed
    };
  }

  const openingQuote = trimmed[0];
  const closingQuote = QUOTE_PAIRS.get(openingQuote);

  if (!closingQuote || trimmed.at(-1) !== closingQuote) {
    return {
      isQuoted: false,
      term: trimmed
    };
  }

  return {
    isQuoted: true,
    term: trimmed.slice(1, -1).trim()
  };
}

export function parseDexEntrySearchQuery(
  search,
  exactWordEnabled = false
) {
  const quotedQuery = removeWrappingQuotes(
    String(search ?? "")
  );

  return {
    exactWord: exactWordEnabled || quotedQuery.isQuoted,
    term: quotedQuery.term.toLowerCase()
  };
}

export function matchesDexEntrySearch(
  searchableText,
  searchTerm,
  exactWord = false
) {
  const normalizedText = String(
    searchableText ?? ""
  ).toLowerCase();
  const normalizedTerm = String(searchTerm ?? "")
    .trim()
    .toLowerCase();

  if (!normalizedTerm) {
    return true;
  }

  if (!exactWord) {
    return normalizedText.includes(normalizedTerm);
  }

  const exactWordPattern = new RegExp(
    `(^|[^\\p{L}\\p{N}])${escapeRegExp(
      normalizedTerm
    )}(?=$|[^\\p{L}\\p{N}])`,
    "iu"
  );

  return exactWordPattern.test(normalizedText);
}
