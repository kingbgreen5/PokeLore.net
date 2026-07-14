export const TM_MATERIAL_CATEGORY =
  "tm-materials";

export function isTmMaterialItem(item) {
  return (
    (item?.category?.name ?? item?.category) ===
    TM_MATERIAL_CATEGORY
  );
}

export function getTmMaterialDetail(
  item,
  tmMaterialDetails
) {
  if (!isTmMaterialItem(item)) {
    return null;
  }

  return (
    tmMaterialDetails?.materials?.[item.name] ??
    null
  );
}

export function applyTmMaterialFallback(
  item,
  tmMaterialDetail
) {
  if (!item || !tmMaterialDetail) {
    return item;
  }

  return {
    ...item,
    effect:
      item.effect ?? tmMaterialDetail.effect,
    shortEffect:
      item.shortEffect ??
      tmMaterialDetail.shortEffect,
    acquisition:
      item.acquisition?.length > 0
        ? item.acquisition
        : tmMaterialDetail.acquisition,
    tmMaterialDetail
  };
}
