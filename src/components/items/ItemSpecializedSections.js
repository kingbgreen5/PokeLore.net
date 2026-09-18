import { createElement as h } from "react";

// Used directly by React and react-dom/server so headings, facts and links agree.
export default function ItemSpecializedSections({ sections = [] }) {
  return sections.map(section => h("section", {
    key: section.id, "data-item-module": section.id,
    style: { marginBottom: "2rem", overflowWrap: "anywhere" }
  }, h("h2", null, section.title), ...section.rows.map((parts, row) =>
    h("p", {
      key: row,
      style: section.id === "ev-training-effect" && row > 0
        ? { marginTop: "1rem" }
        : undefined
    }, ...parts.map((part, index) => {
      if (part.break) return h("br", { key: index });
      if (part.href) return h("a", { key: index, href: part.href }, part.text);
      if (part.strong) return h("strong", { key: index }, part.text);
      return part.text;
    }))
  )));
}
