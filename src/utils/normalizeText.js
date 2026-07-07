function normalizeDisplayText(value) {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .replace(/Pok(?:\u00c3\u00a9|\?|\uFFFD)mon/g, "Pokémon")
    .replace(/Pok(?:\u00c3\u00a9|\?|\uFFFD)athlon/g, "Pokéathlon")
    .replace(/\u00c2\u00b7/g, "·");
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
  normalizeDisplayText
};
