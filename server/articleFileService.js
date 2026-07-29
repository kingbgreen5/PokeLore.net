import fs from "node:fs/promises";
import path from "node:path";
import {
  createArticleIndexEntry,
  isSafeSlug
} from "../src/utils/articleSchema.js";
import {
  assertValidArticle,
  hasPathTraversal
} from "../src/utils/articleValidation.js";
import { backupFile } from "./articleBackupService.js";

const jsonSpace = 2;

export function createArticlePaths(rootDir) {
  return {
    rootDir,
    articlesDir: path.join(
      rootDir,
      "public",
      "data",
      "topics",
      "articles"
    ),
    topicIndexPath: path.join(
      rootDir,
      "public",
      "data",
      "topics",
      "topicIndex.json"
    ),
    imageDir: path.join(
      rootDir,
      "public",
      "images",
      "topics"
    ),
    backupRoot: path.join(
      rootDir,
      "backups",
      "article-studio"
    )
  };
}

export function assertSafeSlug(slug) {
  if (!isSafeSlug(slug) || hasPathTraversal(slug)) {
    throw Object.assign(
      new Error("Invalid or unsafe article slug."),
      {
        statusCode: 400
      }
    );
  }
}

function assertWithin(baseDir, targetPath) {
  const relative = path.relative(
    baseDir,
    targetPath
  );

  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative)
  ) {
    throw Object.assign(
      new Error("Resolved path escapes the allowed directory."),
      {
        statusCode: 400
      }
    );
  }
}

function articlePath(paths, slug) {
  assertSafeSlug(slug);
  const targetPath = path.join(
    paths.articlesDir,
    `${slug}.json`
  );
  assertWithin(paths.articlesDir, targetPath);
  return targetPath;
}

async function readJsonFile(filePath, fallback) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    return JSON.parse(text);
  } catch (error) {
    if (error.code === "ENOENT") {
      return fallback;
    }

    throw error;
  }
}

async function atomicWriteJson(filePath, data) {
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  const text = `${JSON.stringify(
    data,
    null,
    jsonSpace
  )}\n`;

  await fs.mkdir(path.dirname(filePath), {
    recursive: true
  });
  await fs.writeFile(tempPath, text, "utf8");
  await fs.rename(tempPath, filePath);
}

export async function listArticles(paths) {
  await fs.mkdir(paths.articlesDir, {
    recursive: true
  });

  const entries = await fs.readdir(paths.articlesDir, {
    withFileTypes: true
  });
  const articles = [];

  for (const entry of entries) {
    if (
      !entry.isFile() ||
      !entry.name.endsWith(".json")
    ) {
      continue;
    }

    const filePath = path.join(
      paths.articlesDir,
      entry.name
    );

    try {
      const article = await readJsonFile(filePath);
      const stat = await fs.stat(filePath);
      articles.push({
        slug:
          article.slug ??
          entry.name.replace(/\.json$/, ""),
        title: article.title ?? entry.name,
        active: article.active !== false,
        updatedDate: article.updatedDate ?? "",
        modifiedTime: stat.mtime.toISOString(),
        excerpt: article.excerpt ?? ""
      });
    } catch (error) {
      articles.push({
        slug: entry.name.replace(/\.json$/, ""),
        title: entry.name,
        parseError: error.message
      });
    }
  }

  return articles.sort((a, b) =>
    String(a.title).localeCompare(String(b.title))
  );
}

export async function readArticle(paths, slug) {
  const filePath = articlePath(paths, slug);
  return readJsonFile(filePath);
}

async function readTopicIndex(paths) {
  return readJsonFile(paths.topicIndexPath, {
    topics: []
  });
}

async function writeTopicIndex(paths, index) {
  await backupFile({
    sourcePath: paths.topicIndexPath,
    backupRoot: paths.backupRoot,
    group: "topic-index",
    slug: "_topic-index",
    fallbackName: "topicIndex.json"
  });

  await atomicWriteJson(paths.topicIndexPath, index);
}

async function upsertTopicIndexEntry(paths, article) {
  const index = await readTopicIndex(paths);
  const topics = Array.isArray(index.topics)
    ? [...index.topics]
    : [];
  const nextEntry = createArticleIndexEntry(article);
  const existingIndex = topics.findIndex(
    topic => topic.slug === article.slug
  );

  if (existingIndex >= 0) {
    topics[existingIndex] = {
      ...topics[existingIndex],
      ...nextEntry
    };
  } else {
    topics.push(nextEntry);
  }

  await writeTopicIndex(paths, {
    ...index,
    topics
  });
}

async function removeTopicIndexEntry(paths, slug) {
  const index = await readTopicIndex(paths);
  const topics = Array.isArray(index.topics)
    ? index.topics
    : [];
  const nextTopics = topics.filter(
    topic => topic.slug !== slug
  );

  await writeTopicIndex(paths, {
    ...index,
    topics: nextTopics
  });
}

export async function saveArticle(paths, article, {
  expectedSlug,
  allowOverwrite = true
} = {}) {
  assertValidArticle(article);
  assertSafeSlug(article.slug);

  if (expectedSlug && expectedSlug !== article.slug) {
    assertSafeSlug(expectedSlug);
  }

  const destination = articlePath(
    paths,
    article.slug
  );
  const existingTarget = await readJsonFile(
    destination,
    null
  );

  if (existingTarget && !allowOverwrite) {
    throw Object.assign(
      new Error("Article slug already exists."),
      {
        statusCode: 409
      }
    );
  }

  if (
    expectedSlug &&
    expectedSlug !== article.slug
  ) {
    const oldPath = articlePath(paths, expectedSlug);
    const oldArticle = await readJsonFile(
      oldPath,
      null
    );

    if (oldArticle) {
      await backupFile({
        sourcePath: oldPath,
        backupRoot: paths.backupRoot,
        group: "articles",
        slug: expectedSlug
      });
      await fs.unlink(oldPath);
      await removeTopicIndexEntry(paths, expectedSlug);
    }
  }

  if (existingTarget) {
    await backupFile({
      sourcePath: destination,
      backupRoot: paths.backupRoot,
      group: "articles",
      slug: article.slug
    });
  }

  await atomicWriteJson(destination, article);

  try {
    await upsertTopicIndexEntry(paths, article);
  } catch (error) {
    await backupFile({
      sourcePath: destination,
      backupRoot: paths.backupRoot,
      group: "failed-index-updates",
      slug: article.slug
    });
    throw error;
  }

  return article;
}

export async function deleteArticle(paths, slug) {
  const filePath = articlePath(paths, slug);

  await backupFile({
    sourcePath: filePath,
    backupRoot: paths.backupRoot,
    group: "articles",
    slug
  });
  await fs.unlink(filePath);
  await removeTopicIndexEntry(paths, slug);

  return {
    slug
  };
}

export {
  articlePath,
  atomicWriteJson,
  readTopicIndex,
  upsertTopicIndexEntry
};
