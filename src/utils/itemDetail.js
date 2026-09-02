import {
  applyTmMaterialFallback,
  getTmMaterialDetail
} from "./tmMaterialDetails.js";

export function capitalizeItemText(text) {
  return String(text ?? "")
    .split("-")
    .filter(Boolean)
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

export function normalizeItemName(itemName) {
  let normalized;

  try {
    normalized = decodeURIComponent(
      String(itemName ?? "")
    );
  } catch {
    normalized = String(itemName ?? "");
  }

  normalized = normalized
    .trim()
    .toLowerCase();

  normalized = normalized.replace(
    /^(tm|hm|tr)-(\d+)$/,
    "$1$2"
  );

  normalized = normalized.replace(
    /^(tm|hm|tr)(\d+)s$/,
    "$1$2"
  );

  return normalized;
}

export function isMachineItem(item) {
  return (
    item?.machines?.length > 0 ||
    /^(tm|hm|tr)\d+/i.test(
      item?.name ?? ""
    )
  );
}

export function formatItemList(values) {
  if (values.length <= 1) {
    return values[0] ?? "";
  }

  if (values.length === 2) {
    return `${values[0]} or ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, or ${
    values[values.length - 1]
  }`;
}

export function buildMachineItemDescription(item) {
  const moveNames = Array.from(
    new Set(
      item?.machines
        ?.map(machine =>
          machine.move?.name
        )
        .filter(Boolean) ?? []
    )
  ).map(capitalizeItemText);

  if (moveNames.length === 0) {
    return null;
  }

  const itemName =
    item.displayName ??
    capitalizeItemText(item.name);
  const moveList =
    formatItemList(moveNames);

  return `${itemName} teaches ${moveList}${
    moveNames.length > 1
      ? " depending on version"
      : ""
  }.`;
}

export function mergeItemDetailData({
  itemData,
  migratedLocationData,
  tmMaterialDetailsData
}) {
  if (!itemData) {
    return null;
  }

  const itemWithAcquisition = {
    ...itemData,
    acquisition:
      migratedLocationData?.acquisition ??
      itemData.acquisition
  };
  const tmMaterialDetail =
    getTmMaterialDetail(
      itemData,
      tmMaterialDetailsData
    );

  return applyTmMaterialFallback(
    itemWithAcquisition,
    tmMaterialDetail
  );
}
