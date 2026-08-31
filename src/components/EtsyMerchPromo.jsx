import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  trackEtsyMerchClick,
  trackEtsyMerchImpression
} from "../utils/etsyMerch";
import "./EtsyMerchPromo.css";

function EtsyMerchPromo({
  ad,
  pagePath,
  placement = "unknown"
}) {
  const [imageStatus, setImageStatus] =
    useState({
      key: null,
      status: "pending"
    });
  const impressionKeyRef = useRef(null);
  const imageKey = [
    ad?.id,
    ad?.img,
    pagePath,
    placement
  ].join("|");
  const resolvedImageStatus =
    imageStatus.key === imageKey
      ? imageStatus.status
      : "pending";

  useEffect(() => {
    if (
      !ad ||
      resolvedImageStatus !== "loaded"
    ) {
      return;
    }

    const impressionKey = [
      ad.id,
      ad.listingId,
      pagePath,
      placement
    ].join("|");

    if (
      impressionKeyRef.current ===
      impressionKey
    ) {
      return;
    }

    impressionKeyRef.current =
      impressionKey;
    trackEtsyMerchImpression({
      ad,
      pagePath,
      placement
    });
  }, [
    ad,
    pagePath,
    placement,
    resolvedImageStatus
  ]);

  if (
    !ad ||
    resolvedImageStatus === "error"
  ) {
    return null;
  }

  return (
    <aside
      aria-label="Pokemon-inspired merchandise"
      className="etsy-merch-promo"
    >
      <p className="etsy-merch-promo__eyebrow">
        Pokemon-inspired merch
      </p>
      <a
        className="etsy-merch-promo__link"
        href={ad.link}
        onClick={() =>
          trackEtsyMerchClick({
            ad,
            pagePath,
            placement
          })
        }
        rel="sponsored noopener"
        target="_blank"
      >
        <span className="etsy-merch-promo__image-shell">
          <img
            alt={
              ad.alt ??
              "Pokemon-inspired Etsy merchandise"
            }
            className="etsy-merch-promo__image"
            loading="lazy"
            onError={() =>
              setImageStatus({
                key: imageKey,
                status: "error"
              })
            }
            onLoad={() =>
              setImageStatus({
                key: imageKey,
                status: "loaded"
              })
            }
            src={ad.img}
          />
        </span>
        <span className="etsy-merch-promo__cta">
          Shop on Etsy{" "}
          <span aria-hidden="true">-&gt;</span>
        </span>
      </a>
    </aside>
  );
}

export default EtsyMerchPromo;
