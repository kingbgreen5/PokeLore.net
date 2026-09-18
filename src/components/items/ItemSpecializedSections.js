import { createElement as h } from "react";

// Used directly by React and react-dom/server so headings, facts and links agree.
export default function ItemSpecializedSections({ sections = [] }) {
  return sections.map(section => h("section", {
    key: section.id, "data-item-module": section.id,
    style: { marginBottom: "2rem", overflowWrap: "anywhere" }
  }, h("h2", null, section.title), ...section.rows.map((parts, row) =>
    h("p", { key: row }, ...parts.map((part, index) => part.href
      ? h("a", { key: index, href: part.href }, part.text)
      : part.text))
  )));
}
