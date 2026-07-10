import { Link } from "react-router-dom";
import { normalizeDisplayText } from "../utils/normalizeText";

function RelatedLinks({
  data,
  title = "Related Guides"
}) {
  const links = Array.isArray(data?.links)
    ? data.links
    : [];

  if (links.length === 0) {
    return null;
  }

  return (
    <section
      style={{
        border: "1px solid #666",
        borderRadius: "12px",
        marginBottom: "2rem",
        padding: "1rem",
        textAlign: "left"
      }}
    >
      <h2>{data?.title ?? title}</h2>

      <div
        style={{
          display: "grid",
          gap: ".75rem"
        }}
      >
        {links.map(link => (
          <Link
            key={`${link.to}-${link.label}`}
            to={link.to}
            style={{
              border: "1px solid #555",
              borderRadius: "10px",
              color: "inherit",
              display: "grid",
              gap: ".25rem",
              padding: ".85rem",
              textDecoration: "none"
            }}
          >
            <strong>
              {normalizeDisplayText(link.label)}
            </strong>

            {link.description && (
              <span
                style={{
                  opacity: 0.82
                }}
              >
                {normalizeDisplayText(link.description)}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default RelatedLinks;
