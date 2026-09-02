import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getCanonicalItemEntries } from "./prerenderItemPages.js";

const __filename = fileURLToPath(
  import.meta.url
);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const defaultDistDir = path.join(rootDir, "dist");
const defaultItemDistDir = path.join(defaultDistDir, "item");
const defaultFallbackPath = path.join(defaultDistDir, "item-fallback.html");
const defaultDataDir = path.join(rootDir, "public", "data");

const HOMEPAGE_H1 =
  "<h1>Pokémon Pokédex, Tools & Game Guides</h1>";
const HOMEPAGE_CANONICAL =
  '<link rel="canonical" href="https://pokelore.net/">';
const HOMEPAGE_STRUCTURED_DATA =
  'id="seo-structured-data"';

function getSingleMetaDescription(html, label) {
  const matches =
    html.match(
      /<meta\s+name=["']description["']\s+content=["'][^"']+["']\s*\/?>/gi
    ) ?? [];

  if (matches.length !== 1) {
    throw new Error(
      `${label} must contain exactly one meta description. Found ${matches.length}.`
    );
  }

  return matches[0];
}

function finalizeCanonicalRoute(itemDistDir, slug) {
  const routeDir = path.join(itemDistDir, slug);
  const indexPath = path.join(routeDir, "index.html");
  const extensionlessPath = path.join(
    itemDistDir,
    slug
  );

  if (!fs.existsSync(indexPath)) {
    throw new Error(
      `Expected ${slug} item prerender output at ${indexPath}.`
    );
  }

  const html = fs.readFileSync(indexPath, "utf8");

  if (html.includes(HOMEPAGE_H1)) {
    throw new Error(
      `${slug} item prerender contains the homepage H1.`
    );
  }

  if (html.includes(HOMEPAGE_CANONICAL)) {
    throw new Error(
      `${slug} item prerender contains the homepage canonical.`
    );
  }

  getSingleMetaDescription(
    html,
    `${slug} item prerender`
  );

  fs.rmSync(routeDir, {
    recursive: true,
    force: true
  });
  fs.writeFileSync(extensionlessPath, html);

  return extensionlessPath;
}

function assertFinalizedItemRoute(
  itemDistDir,
  slug
) {
  const outputPath = path.join(
    itemDistDir,
    slug
  );
  const oldIndexPath = path.join(
    itemDistDir,
    slug,
    "index.html"
  );

  if (!fs.existsSync(outputPath)) {
    throw new Error(
      `Finalized item output missing: ${outputPath}`
    );
  }

  if (fs.statSync(outputPath).isDirectory()) {
    throw new Error(
      `Finalized item output for "${slug}" must be extensionless.`
    );
  }

  if (fs.existsSync(oldIndexPath)) {
    throw new Error(
      `Item index.html still exists after finalization: ${oldIndexPath}`
    );
  }
}

function assertItemFallback(fallbackPath) {
  if (!fs.existsSync(fallbackPath)) {
    throw new Error(
      `Neutral item fallback missing: ${fallbackPath}`
    );
  }

  if (!fs.statSync(fallbackPath).isFile()) {
    throw new Error(
      `Neutral item fallback is not a regular file: ${fallbackPath}`
    );
  }

  const html = fs.readFileSync(
    fallbackPath,
    "utf8"
  );

  if (!html.trim()) {
    throw new Error(
      `Neutral item fallback is empty: ${fallbackPath}`
    );
  }

  getSingleMetaDescription(
    html,
    "Neutral item fallback"
  );

  if (!/<script[^>]+src=["']\/assets\//i.test(html)) {
    throw new Error(
      "Neutral item fallback is missing application JS references."
    );
  }

  if (html.includes(HOMEPAGE_H1)) {
    throw new Error(
      "Neutral item fallback contains the homepage H1."
    );
  }

  if (html.includes(HOMEPAGE_CANONICAL)) {
    throw new Error(
      "Neutral item fallback contains the homepage canonical."
    );
  }

  if (html.includes(HOMEPAGE_STRUCTURED_DATA)) {
    throw new Error(
      "Neutral item fallback contains homepage structured data."
    );
  }

  if (/<link\s+rel=["']canonical["']/i.test(html)) {
    throw new Error(
      "Neutral item fallback must not contain a canonical URL."
    );
  }
}

function finalizeItemPrerenderRoutes({
  itemDistDir = defaultItemDistDir,
  dataDir = defaultDataDir,
  fallbackPath = defaultFallbackPath
} = {}) {
  const entries = getCanonicalItemEntries({
    dataDir
  });

  if (!fs.existsSync(itemDistDir)) {
    throw new Error(
      `Item prerender output directory not found: ${itemDistDir}`
    );
  }

  for (const { item } of entries) {
    finalizeCanonicalRoute(
      itemDistDir,
      item.name
    );
    assertFinalizedItemRoute(
      itemDistDir,
      item.name
    );
  }

  assertItemFallback(fallbackPath);

  return {
    count: entries.length,
    fallbackPath,
    itemDistDir
  };
}

if (process.argv[1] === __filename) {
  try {
    const result =
      finalizeItemPrerenderRoutes();

    console.log(
      `Finalized ${result.count} item prerender routes as extensionless static files.`
    );
  } catch (error) {
    console.error(
      "Failed to finalize item prerender routes:",
      error
    );
    process.exitCode = 1;
  }
}

export {
  assertFinalizedItemRoute,
  assertItemFallback,
  finalizeCanonicalRoute,
  finalizeItemPrerenderRoutes
};
