import {
  isDynamaxCrystalItem,
  isReleasedDynamaxCrystal
} from "./dynamaxCrystals.js";

export function isItemHiddenFromUi(item) {
  return (
    isDynamaxCrystalItem(item) &&
    !isReleasedDynamaxCrystal(item)
  );
}
