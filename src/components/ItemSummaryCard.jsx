import { Link } from "react-router-dom";

const CARD_SIZES = {
  full: {
    width: "100%",
    maxWidth: "280px",
    minHeight: "220px",
    padding: "1rem",
    spriteSize: "48px",
    titleSize: "1.1rem",
    showEffect: true,
    showCategory: true
  },
  compact: {
    width: "180px",
    maxWidth: "180px",
    minHeight: "150px",
    padding: ".8rem",
    spriteSize: "42px",
    titleSize: ".95rem",
    showEffect: true,
    showCategory: true
  },
  subcompact: {
    width: "110px",
    maxWidth: "110px",
    minHeight: "105px",
    padding: ".55rem",
    spriteSize: "32px",
    titleSize: ".72rem",
    showEffect: false,
    showCategory: false
  }
};

function ItemSummaryCard({
  item,
  variant = "compact"
}) {
  if (!item) {
    return null;
  }

  const size =
    CARD_SIZES[variant] ||
    CARD_SIZES.compact;
  const slug = item.slug ?? item.name;
  const displayName =
    item.displayName ?? item.name ?? slug;

  return (
    <Link
      to={`/item/${slug}`}
      style={{
        backgroundColor: "#2c2c2c",
        border: "1px solid #666",
        borderRadius: "8px",
        boxSizing: "border-box",
        color: "inherit",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        maxWidth: size.maxWidth,
        minHeight: size.minHeight,
        padding: size.padding,
        textAlign: "left",
        textDecoration: "none",
        transition: "transform 0.15s ease",
        width: size.width
      }}
      onMouseEnter={event => {
        event.currentTarget.style.transform =
          "translateY(-4px)";
      }}
      onMouseLeave={event => {
        event.currentTarget.style.transform =
          "translateY(0px)";
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: ".65rem",
          marginBottom: ".55rem",
          minWidth: 0
        }}
      >
        {item.sprite && (
          <img
            src={item.sprite}
            alt={displayName}
            loading="lazy"
            style={{
              flex: "0 0 auto",
              height: size.spriteSize,
              imageRendering: "pixelated",
              objectFit: "contain",
              width: size.spriteSize
            }}
          />
        )}

        <h2
          style={{
            fontSize: size.titleSize,
            lineHeight: 1.15,
            margin: 0,
            overflowWrap: "anywhere"
          }}
        >
          {displayName}
        </h2>
      </div>

      {size.showCategory && item.categoryDisplayName && (
        <div
          style={{
            fontSize: ".8rem",
            opacity: 0.75
          }}
        >
          {item.categoryDisplayName}
        </div>
      )}

      {size.showEffect && item.shortEffect && (
        <p
          style={{
            fontSize: ".84rem",
            lineHeight: 1.45,
            margin: ".65rem 0 0"
          }}
        >
          {item.shortEffect}
        </p>
      )}
    </Link>
  );
}

export default ItemSummaryCard;
