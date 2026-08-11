import { useId } from "react";

function CollapsibleSection({
  id,
  title,
  summary,
  expanded,
  onToggle,
  children,
  className,
  contentStyle,
  summaryColor,
  titleColor,
  titleChevron = false,
  seoVisible = true,
  style
}) {
  const generatedId =
    useId();
  const contentId =
    `collapsible-${generatedId}`;

  return (
    <section
      id={id}
      className={className}
      style={{
        border: "2px solid #706363",
        borderRadius: "12px",
        boxSizing: "border-box",
        marginBottom: "1rem",
        maxWidth: "100%",
        minWidth: 0,
        padding: ".35rem",
        width: "100%",
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
          maxWidth: "100%",
          minWidth: 0,
          padding: 0,
          textAlign: "left",
          width: "100%"
        }}
      >
        <h2
          style={{
            alignItems: "center",
            color: titleColor,
            display: "inline-flex",
            gap: ".5rem"
          }}
        >
          {titleChevron && (
            <span
              aria-hidden="true"
              style={{
                borderLeft:
                  ".38rem solid transparent",
                borderRight:
                  ".38rem solid transparent",
                borderTop: expanded
                  ? "none"
                  : ".55rem solid currentColor",
                borderBottom: expanded
                  ? ".55rem solid currentColor"
                  : "none",
                display: "inline-block",
                height: 0,
                width: 0
              }}
            />
          )}
          {title}
        </h2>

        {summary && (
          <p
            style={{
              color: summaryColor
            }}
          >
            {summary}
          </p>
        )}
      </button>

      <div
        id={contentId}
        data-seo-visible={
          seoVisible
            ? "true"
            : "false"
        }
        className={
          expanded
            ? "collapsible-content open"
            : "collapsible-content collapsed"
        }
        aria-hidden={
          seoVisible
            ? undefined
            : !expanded
        }
        style={{
          boxSizing: "border-box",
          maxWidth: "100%",
          minWidth: 0,
          width: "100%",
          ...contentStyle
        }}
      >
        {children}
      </div>
    </section>
  );
}

export default CollapsibleSection;
