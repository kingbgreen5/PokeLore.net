import {
  describe,
  expect,
  it
} from "vitest";
import fs from "fs";
import path from "path";

const renderYaml = fs.readFileSync(
  path.resolve("render.yaml"),
  "utf8"
);

function headerRuleFor(pathPattern) {
  const escapedPath = pathPattern.replace(
    /\*/g,
    "\\*"
  );
  const pattern = new RegExp(
    `- path: ${escapedPath}\\s+name: Content-Type\\s+value: text/html; charset=utf-8`,
    "m"
  );

  return pattern.test(renderYaml);
}

describe("Render static config", () => {
  it("serves extensionless Pokemon and item pages as HTML", () => {
    expect(headerRuleFor("/pokemon/*")).toBe(
      true
    );
    expect(headerRuleFor("/item/*")).toBe(true);
  });

  it("routes unknown item URLs to the real neutral item fallback before the global SPA fallback", () => {
    const itemRewriteIndex =
      renderYaml.indexOf("source: /item/*");
    const itemFallbackIndex =
      renderYaml.indexOf(
        "destination: /item-fallback.html"
      );
    const globalRewriteIndex =
      renderYaml.indexOf("source: /*");

    expect(itemRewriteIndex).toBeGreaterThan(-1);
    expect(itemFallbackIndex).toBeGreaterThan(
      itemRewriteIndex
    );
    expect(globalRewriteIndex).toBeGreaterThan(
      itemFallbackIndex
    );
  });
});
