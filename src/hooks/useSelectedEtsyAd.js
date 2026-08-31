import { useMemo } from "react";

import { selectEtsyAd } from "../utils/etsyMerch";

export function useSelectedEtsyAd(
  pageTags,
  {
    ads,
    pageViewKey,
    random
  } = {}
) {
  const normalizedPageViewKey =
    pageViewKey ?? (pageTags ?? []).join("|");

  return useMemo(
    () =>
      selectEtsyAd(pageTags, {
        ads,
        random
      }),
    // Selection should remain stable for this mounted page view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [normalizedPageViewKey]
  );
}
