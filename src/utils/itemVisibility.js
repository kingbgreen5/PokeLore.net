const HIDDEN_ITEM_CATEGORIES = new Set([
  "dynamax-crystals"
]);

export function isItemHiddenFromUi(item) {
  return HIDDEN_ITEM_CATEGORIES.has(
    item?.category?.name ?? item?.category
  );
}
