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
const defaultDataDir = path.join(rootDir, "public", "data");

const HOMEPAGE_H1 =
  "<h1>Pokémon Pokédex, Tools & Game Guides</h1>";
const HOMEPAGE_CANONICAL =
  '<link rel="canonical" href="https://pokelore.net/">';

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

function finalizeItemPrerenderRoutes({
  itemDistDir = defaultItemDistDir,
  dataDir = defaultDataDir
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

  return {
    count: entries.length,
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
  finalizeCanonicalRoute,
  finalizeItemPrerenderRoutes
};
