function normalizeDisplayText(value) {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .replace(/([A-Za-z])\u00ad\s+(?=[A-Za-z])/g, "$1")
    .replace(/([A-Za-z])\u00ad(?=[A-Za-z])/g, "$1")
    .replace(/\u00ad/g, "")
    .replace(/Pok(?:\u00c3\u00a9|\?|\uFFFD)mon/g, "Pokémon")
    .replace(/Pok(?:\u00c3\u00a9|\?|\uFFFD)athlon/g, "Pokéathlon")
    .replace(/\u00c2\u00b7/g, "·");
}

function normalizeFlavorText(value) {
  if (typeof value !== "string") {
    return value;
  }

  return normalizeDisplayText(value)
    .replace(/[\f\n\r]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDisplayData(value) {
  if (typeof value === "string") {
    return normalizeDisplayText(value);
  }

  if (Array.isArray(value)) {
    return value.map(normalizeDisplayData);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        normalizeDisplayData(entry)
      ])
    );
  }

  return value;
}

export {
  normalizeDisplayData,
  normalizeDisplayText,
  normalizeFlavorText
};
