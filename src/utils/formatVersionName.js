const VERSION_DISPLAY_OVERRIDES = {
  firered: "FireRed",
  leafgreen: "LeafGreen",
  heartgold: "HeartGold",
  soulsilver: "SoulSilver",
  xd: "XD"
};

export function formatVersionName(value = "") {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (!normalized) {
    return "";
  }

  return normalized
    .split("-")
    .filter(Boolean)
    .map(
      word =>
        VERSION_DISPLAY_OVERRIDES[word] ??
        word.charAt(0).toUpperCase() +
          word.slice(1)
    )
    .join(" ");
}
