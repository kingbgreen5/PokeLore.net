import { useId } from "react";

function CollapsibleSection({
  title,
  summary,
  expanded,
  onToggle,
  children,
  className,
  contentStyle,
  style
}) {
  const generatedId =
    useId();
  const contentId =
    `collapsible-${generatedId}`;

  return (
    <section
      className={className}
      style={{
        border: "2px solid #706363",
        borderRadius: "12px",
        marginBottom: "1rem",
        padding: ".35rem",
        ...style
      }}
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={onToggle}
        style={{
          alignItems: "center",
          background: "none",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          display: "flex",
          font: "inherit",
          justifyContent:
            "space-between",
          padding: 0,
          textAlign: "left",
          width: "100%"
        }}
      >
        <h2>{title}</h2>

        {summary && (
          <p>{summary}</p>
        )}
      </button>

      <div
        id={contentId}
        className={
          expanded
            ? "collapsible-content open"
            : "collapsible-content collapsed"
        }
        aria-hidden={!expanded}
        style={contentStyle}
      >
        {children}
      </div>
    </section>
  );
}

export default CollapsibleSection;
