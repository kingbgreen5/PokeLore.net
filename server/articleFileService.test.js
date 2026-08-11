import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it
} from "vitest";
import {
  assertSafeSlug,
  createArticlePaths,
  getContentPaths,
  readArticle,
  saveArticle
} from "./articleFileService";

let tempRoot;
let paths;

function testArticle(slug = "test-article") {
  return {
    slug,
    contentType: "article",
    active: true,
    title: "Test Article",
    subtitle: "",
    excerpt: "A summary.",
    publishedDate: "2026-07-24",
    updatedDate: "2026-07-24",
    author: "PokeLore",
    category: "Tests",
    tags: [],
    hero: {
      src: "",
      alt: "",
      caption: "",
      width: null,
      height: null
    },
    relatedPokemon: [25],
    sections: [
      {
        id: "block-1",
        type: "paragraph",
        text: "Body text."
      }
    ],
    sources: [],
    relatedTopics: []
  };
}

function testNewsArticle(slug = "test-news") {
  return {
    ...testArticle(slug),
    contentType: "news",
    active: true,
    newsLabel: "News",
    featured: true,
    publishedAt: "2026-08-10T10:42:00-05:00",
    updatedAt: "",
    publishedDate: undefined,
    updatedDate: undefined
  };
}

describe("article file service", () => {
  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "article-studio-")
    );
    paths = createArticlePaths(tempRoot);
    await fs.mkdir(paths.articlesDir, {
      recursive: true
    });
    await fs.mkdir(
      path.dirname(paths.topicIndexPath),
      {
        recursive: true
      }
    );
    await fs.writeFile(
      paths.topicIndexPath,
      JSON.stringify(
        {
          topics: [
            {
              slug: "untouched",
              title: "Untouched"
            }
          ]
        },
        null,
        2
      )
    );
  });

  afterEach(async () => {
    await fs.rm(tempRoot, {
      recursive: true,
      force: true
    });
  });

  it("rejects traversal slugs", () => {
    expect(() => assertSafeSlug("../bad")).toThrow(
      "Invalid or unsafe article slug."
    );
  });

  it("saves articles and updates only the matching index entry", async () => {
    await saveArticle(paths, testArticle());

    const saved = await readArticle(
      paths,
      "test-article"
    );
    const index = JSON.parse(
      await fs.readFile(paths.topicIndexPath, "utf8")
    );

    expect(saved.title).toBe("Test Article");
    expect(index.topics).toHaveLength(2);
    expect(index.topics[0]).toEqual({
      slug: "untouched",
      title: "Untouched"
    });
    expect(index.topics[1]).toMatchObject({
      slug: "test-article",
      contentType: "article",
      title: "Test Article"
    });
  });

  it("creates backups before overwriting article and topic index files", async () => {
    await saveArticle(paths, testArticle());
    await saveArticle(paths, {
      ...testArticle(),
      title: "Updated Article"
    });

    const articleBackups = await fs.readdir(
      path.join(
        paths.backupRoot,
        "articles",
        "test-article"
      )
    );
    const indexBackups = await fs.readdir(
      path.join(
        paths.backupRoot,
        "topic-index",
        "_topic-index"
      )
    );

    expect(articleBackups.length).toBeGreaterThan(0);
    expect(indexBackups.length).toBeGreaterThan(0);
  });

  it("saves News articles into the News storage and index only", async () => {
    await saveArticle(paths, testNewsArticle());

    const newsPaths = getContentPaths(paths, "news");
    const saved = await readArticle(
      paths,
      "test-news",
      "news"
    );
    const newsIndex = JSON.parse(
      await fs.readFile(newsPaths.indexPath, "utf8")
    );
    const topicIndex = JSON.parse(
      await fs.readFile(paths.topicIndexPath, "utf8")
    );

    expect(saved.contentType).toBe("news");
    expect(newsIndex.articles).toHaveLength(1);
    expect(newsIndex.articles[0]).toMatchObject({
      slug: "test-news",
      contentType: "news",
      featured: true,
      publishedAt: "2026-08-10T10:42:00-05:00"
    });
    expect(
      topicIndex.topics.some(
        topic => topic.slug === "test-news"
      )
    ).toBe(false);
  });
});
