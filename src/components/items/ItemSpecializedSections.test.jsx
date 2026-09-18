import { describe, expect, it } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import ItemSpecializedSections from "./ItemSpecializedSections.js";
import { loadItemPageData, renderItemPage } from "../../../scripts/prerenderItemPages.js";

const template = '<html><head><title>Test</title></head><body><div id="root"></div></body></html>';
describe("specialized initial HTML and React parity", () => {
  it.each(["helix-fossil", "dome-fossil", "old-amber", "jaw-fossil", "sail-fossil", "metal-coat", "macho-brace", "power-bracer", "power-anklet", "gooey-mulch", "growth-mulch", "rich-mulch"])("renders the same facts and canonical links for %s", name => {
    const item = JSON.parse(fs.readFileSync(`public/data/items/${name}.json`, "utf8"));
    const data = loadItemPageData(item);
    const component = <ItemSpecializedSections sections={data.specializedSections} />;
    const server = renderToStaticMarkup(component);
    const html = renderItemPage(template, data);
    expect(server).not.toBe("");
    expect(html).toContain(server);
    const expected = document.createElement("div");
    expected.innerHTML = server;
    const { container } = render(component);
    expect(container.textContent).toBe(expected.textContent);
    expect([...container.querySelectorAll("a")].map(a => a.getAttribute("href"))).toEqual([...expected.querySelectorAll("a")].map(a => a.getAttribute("href")));
    cleanup();
    if (name === "power-bracer") {
      expect(html).not.toContain("<h2>Effect</h2>");
      expect(html).toContain("+4 Attack EVs");
      expect(html).toContain("+8 Attack EVs");
    }
  });
});
