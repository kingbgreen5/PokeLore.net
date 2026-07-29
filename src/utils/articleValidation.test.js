import {
  describe,
  expect,
  it
} from "vitest";
import { createEmptyArticle } from "./articleSchema";
import {
  hasPathTraversal,
  validateArticle
} from "./articleValidation";

describe("article validation", () => {
  it("accepts a minimal valid article", () => {
    const article = {
      ...createEmptyArticle({
        title: "Valid Article",
        slug: "valid-article"
      }),
      excerpt: "A useful summary.",
      sections: [
        {
          id: "block-1",
          type: "paragraph",
          text: "Hello world."
        }
      ]
    };

    expect(validateArticle(article).errors).toEqual([]);
  });

  it("rejects unsafe slugs and traversal paths", () => {
    const article = {
      ...createEmptyArticle({
        title: "Bad",
        slug: "bad-slug"
      }),
      slug: "../bad",
      excerpt: "Summary",
      hero: {
        src: "/images/topics/../bad.png",
        alt: "Bad path"
      }
    };

    const result = validateArticle(article);

    expect(result.errors).toContain(
      "Slug must use lowercase letters, numbers, and hyphens only."
    );
    expect(result.errors).toContain(
      "Hero image path is unsafe."
    );
    expect(hasPathTraversal("a/../b")).toBe(true);
  });

  it("detects duplicate heading anchors", () => {
    const article = {
      ...createEmptyArticle({
        title: "Anchors",
        slug: "anchors"
      }),
      excerpt: "Summary",
      sections: [
        {
          id: "block-1",
          type: "heading",
          level: 2,
          anchor: "same",
          text: "Same"
        },
        {
          id: "block-2",
          type: "heading",
          level: 2,
          anchor: "same",
          text: "Same again"
        }
      ]
    };

    expect(validateArticle(article).errors).toContain(
      'Block 2 duplicates heading anchor "same".'
    );
  });

  it("warns instead of failing unknown block types", () => {
    const article = {
      ...createEmptyArticle({
        title: "Unknown",
        slug: "unknown"
      }),
      excerpt: "Summary",
      sections: [
        {
          id: "block-1",
          type: "mystery-box"
        }
      ]
    };

    const result = validateArticle(article);

    expect(result.errors).toEqual([]);
    expect(result.warnings[0]).toContain(
      'unknown type "mystery-box"'
    );
  });

  it("rejects invalid image display sizes", () => {
    const article = {
      ...createEmptyArticle({
        title: "Image Size",
        slug: "image-size"
      }),
      excerpt: "Summary",
      sections: [
        {
          id: "block-1",
          type: "image",
          src: "/images/topics/image-size/example.webp",
          alt: "Example",
          displaySize: "gigantic"
        }
      ]
    };

    expect(validateArticle(article).errors).toContain(
      "Block 1 image display size is invalid."
    );
  });
});
