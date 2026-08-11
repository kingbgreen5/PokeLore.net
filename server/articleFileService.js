import fs from "node:fs/promises";
import path from "node:path";
import {
  createArticleIndexEntry,
  createNewsIndexEntry,
  getArticleContentType,
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
    newsArticlesDir: path.join(
      rootDir,
      "public",
      "data",
      "news",
      "articles"
    ),
    newsIndexPath: path.join(
      rootDir,
      "public",
      "data",
      "news",
      "newsIndex.json"
    ),
    newsImageDir: path.join(
      rootDir,
      "public",
      "images",
      "news"
    ),
    backupRoot: path.join(
      rootDir,
      "backups",
      "article-studio"
    )
  };
}

function resolveContentType(value) {
  return value === "news" ? "news" : "article";
}

function getContentPaths(paths, contentType) {
  const resolvedContentType =
    resolveContentType(contentType);

  if (resolvedContentType === "news") {
    return {
      contentType: "news",
      articlesDir: paths.newsArticlesDir,
      indexPath: paths.newsIndexPath,
      imageDir: paths.newsImageDir,
      indexKey: "articles",
      backupRoot: path.join(paths.backupRoot, "news"),
      indexBackupGroup: "news-index",
      indexBackupSlug: "_news-index",
      indexBackupName: "newsIndex.json"
    };
  }

  return {
    contentType: "article",
    articlesDir: paths.articlesDir,
    indexPath: paths.topicIndexPath,
    imageDir: paths.imageDir,
    indexKey: "topics",
    backupRoot: paths.backupRoot,
    indexBackupGroup: "topic-index",
    indexBackupSlug: "_topic-index",
    indexBackupName: "topicIndex.json"
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

function articlePath(paths, slug, contentType = "article") {
  assertSafeSlug(slug);
  const contentPaths = getContentPaths(
    paths,
    contentType
  );
  const targetPath = path.join(
    contentPaths.articlesDir,
    `${slug}.json`
  );
  assertWithin(contentPaths.articlesDir, targetPath);
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

async function listArticlesForContentType(paths, contentType) {
  const contentPaths = getContentPaths(
    paths,
    contentType
  );

  await fs.mkdir(contentPaths.articlesDir, {
    recursive: true
  });

  const entries = await fs.readdir(
    contentPaths.articlesDir,
    {
      withFileTypes: true
    }
  );
  const articles = [];

  for (const entry of entries) {
    if (
      !entry.isFile() ||
      !entry.name.endsWith(".json")
    ) {
      continue;
    }

    const filePath = path.join(
      contentPaths.articlesDir,
      entry.name
    );

    try {
      const article = await readJsonFile(filePath);
      const stat = await fs.stat(filePath);
      articles.push({
        slug:
          article.slug ??
          entry.name.replace(/\.json$/, ""),
        contentType: getArticleContentType(article),
        title: article.title ?? entry.name,
        active: article.active !== false,
        updatedDate:
          article.updatedAt ??
          article.updatedDate ??
          "",
        modifiedTime: stat.mtime.toISOString(),
        excerpt: article.excerpt ?? ""
      });
    } catch (error) {
      articles.push({
        slug: entry.name.replace(/\.json$/, ""),
        contentType: contentPaths.contentType,
        title: entry.name,
        parseError: error.message
      });
    }
  }

  return articles.sort((a, b) =>
    String(a.title).localeCompare(String(b.title))
  );
}

export async function listArticles(paths, contentType) {
  if (contentType) {
    return listArticlesForContentType(paths, contentType);
  }

  const [topicArticles, newsArticles] =
    await Promise.all([
      listArticlesForContentType(paths, "article"),
      listArticlesForContentType(paths, "news")
    ]);

  return [...topicArticles, ...newsArticles].sort((a, b) =>
    String(a.title).localeCompare(String(b.title))
  );
}

export async function readArticle(paths, slug, contentType = "article") {
  const filePath = articlePath(
    paths,
    slug,
    contentType
  );
  return readJsonFile(filePath);
}

async function readIndex(paths, contentType) {
  const contentPaths = getContentPaths(
    paths,
    contentType
  );

  return readJsonFile(contentPaths.indexPath, {
    [contentPaths.indexKey]: []
  });
}

async function writeIndex(paths, contentType, index) {
  const contentPaths = getContentPaths(
    paths,
    contentType
  );

  await backupFile({
    sourcePath: contentPaths.indexPath,
    backupRoot: contentPaths.backupRoot,
    group: contentPaths.indexBackupGroup,
    slug: contentPaths.indexBackupSlug,
    fallbackName: contentPaths.indexBackupName
  });

  await atomicWriteJson(contentPaths.indexPath, index);
}

async function upsertIndexEntry(paths, article) {
  const contentType = getArticleContentType(article);
  const contentPaths = getContentPaths(paths, contentType);
  const index = await readIndex(paths, contentType);
  const entries = Array.isArray(index[contentPaths.indexKey])
    ? [...index[contentPaths.indexKey]]
    : [];
  const nextEntry =
    contentType === "news"
      ? createNewsIndexEntry(article)
      : createArticleIndexEntry(article);
  const existingIndex = entries.findIndex(
    entry => entry.slug === article.slug
  );

  if (existingIndex >= 0) {
    entries[existingIndex] = {
      ...entries[existingIndex],
      ...nextEntry
    };
  } else {
    entries.push(nextEntry);
  }

  if (contentType === "news") {
    entries.sort(
      (a, b) =>
        new Date(b.publishedAt || 0).getTime() -
        new Date(a.publishedAt || 0).getTime()
    );
  }

  await writeIndex(paths, contentType, {
    ...index,
    [contentPaths.indexKey]: entries
  });
}

async function removeIndexEntry(paths, slug, contentType) {
  const contentPaths = getContentPaths(
    paths,
    contentType
  );
  const index = await readIndex(paths, contentType);
  const entries = Array.isArray(index[contentPaths.indexKey])
    ? index[contentPaths.indexKey]
    : [];
  const nextEntries = entries.filter(
    entry => entry.slug !== slug
  );

  await writeIndex(paths, contentType, {
    ...index,
    [contentPaths.indexKey]: nextEntries
  });
}

export async function saveArticle(paths, article, {
  expectedSlug,
  expectedContentType,
  allowOverwrite = true
} = {}) {
  assertValidArticle(article);
  assertSafeSlug(article.slug);
  const contentType = getArticleContentType(article);
  const contentPaths = getContentPaths(paths, contentType);

  if (expectedSlug && expectedSlug !== article.slug) {
    assertSafeSlug(expectedSlug);
  }

  const destination = articlePath(
    paths,
    article.slug,
    contentType
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
    expectedContentType &&
    resolveContentType(expectedContentType) !== contentType
  ) {
    const oldContentType =
      resolveContentType(expectedContentType);
    const oldPath = articlePath(
      paths,
      expectedSlug,
      oldContentType
    );
    const oldContentPaths = getContentPaths(
      paths,
      oldContentType
    );
    const oldArticle = await readJsonFile(
      oldPath,
      null
    );

    if (oldArticle) {
      await backupFile({
        sourcePath: oldPath,
        backupRoot: oldContentPaths.backupRoot,
        group: "articles",
        slug: expectedSlug
      });
      await fs.unlink(oldPath);
      await removeIndexEntry(
        paths,
        expectedSlug,
        oldContentType
      );
    }
  }

  if (
    expectedSlug &&
    expectedSlug !== article.slug &&
    (!expectedContentType ||
      resolveContentType(expectedContentType) === contentType)
  ) {
    const oldPath = articlePath(
      paths,
      expectedSlug,
      contentType
    );
    const oldArticle = await readJsonFile(
      oldPath,
      null
    );

    if (oldArticle) {
      await backupFile({
        sourcePath: oldPath,
        backupRoot: contentPaths.backupRoot,
        group: "articles",
        slug: expectedSlug
      });
      await fs.unlink(oldPath);
      await removeIndexEntry(paths, expectedSlug, contentType);
    }
  }

  if (existingTarget) {
    await backupFile({
      sourcePath: destination,
      backupRoot: contentPaths.backupRoot,
      group: "articles",
      slug: article.slug
    });
  }

  await atomicWriteJson(destination, article);

  try {
    await upsertIndexEntry(paths, article);
  } catch (error) {
    await backupFile({
      sourcePath: destination,
      backupRoot: contentPaths.backupRoot,
      group: "failed-index-updates",
      slug: article.slug
    });
    throw error;
  }

  return article;
}

export async function deleteArticle(paths, slug, contentType = "article") {
  const contentPaths = getContentPaths(
    paths,
    contentType
  );
  const filePath = articlePath(
    paths,
    slug,
    contentType
  );

  await backupFile({
    sourcePath: filePath,
    backupRoot: contentPaths.backupRoot,
    group: "articles",
    slug
  });
  await fs.unlink(filePath);
  await removeIndexEntry(paths, slug, contentType);

  return {
    slug
  };
}

export {
  articlePath,
  atomicWriteJson,
  getContentPaths,
  readIndex,
  removeIndexEntry,
  upsertIndexEntry
};
