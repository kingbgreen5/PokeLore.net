import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const defaultRoutesPath = path.join(
  repoRoot,
  "public",
  "data",
  "pokemonRoutes.json"
);
const defaultPokemonDistDir = path.join(repoRoot, "dist", "pokemon");
const siteOrigin = "https://pokelore.net";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatPokemonName(slug) {
  return String(slug)
    .split("-")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toOutputPath(baseDir, segment) {
  return path.resolve(baseDir, segment);
}

function ensureInsideBase(baseDir, outputPath) {
  const relativePath = path.relative(baseDir, outputPath);

  return (
    relativePath &&
    !relativePath.startsWith("..") &&
    !path.isAbsolute(relativePath)
  );
}

function isPositiveIntegerString(value) {
  return /^[1-9]\d*$/.test(String(value));
}

function validateSlug(slug) {
  if (typeof slug !== "string" || slug.trim() !== slug || !slug) {
    throw new Error(`Invalid canonical slug "${slug}".`);
  }

  if (
    slug.includes("..") ||
    slug.includes("/") ||
    slug.includes("\\")
  ) {
    throw new Error(
      `Canonical slug "${slug}" must be a single safe path segment.`
    );
  }
}

function validateRoutesData(routes, pokemonDistDir = defaultPokemonDistDir) {
  if (
    !routes ||
    typeof routes.byName !== "object" ||
    typeof routes.byId !== "object"
  ) {
    throw new Error(
      "pokemonRoutes.json must contain byName and byId objects."
    );
  }

  const canonicalSlugs = Object.keys(routes.byName);
  const canonicalSlugSet = new Set();
  const canonicalOutputPaths = new Map();
  const numericOutputPaths = new Map();

  canonicalSlugs.forEach(slug => {
    validateSlug(slug);

    if (canonicalSlugSet.has(slug)) {
      throw new Error(`Duplicate canonical slug "${slug}".`);
    }

    canonicalSlugSet.add(slug);

    const outputPath = toOutputPath(pokemonDistDir, slug);

    if (!ensureInsideBase(pokemonDistDir, outputPath)) {
      throw new Error(
        `Canonical slug "${slug}" resolves outside dist/pokemon.`
      );
    }

    const outputKey = outputPath.toLowerCase();

    if (canonicalOutputPaths.has(outputKey)) {
      throw new Error(
        `Duplicate canonical output path for "${slug}" and "${canonicalOutputPaths.get(outputKey)}".`
      );
    }

    canonicalOutputPaths.set(outputKey, slug);
  });

  const numericEntries = Object.entries(routes.byId).map(
    ([id, slug]) => {
      if (!isPositiveIntegerString(id)) {
        throw new Error(`Numeric Pokemon id "${id}" is not a positive integer.`);
      }

      validateSlug(slug);

      if (!canonicalSlugSet.has(slug)) {
        throw new Error(
          `Numeric Pokemon id ${id} points to missing canonical slug "${slug}".`
        );
      }

      const outputPath = toOutputPath(pokemonDistDir, id);

      if (!ensureInsideBase(pokemonDistDir, outputPath)) {
        throw new Error(
          `Numeric Pokemon id "${id}" resolves outside dist/pokemon.`
        );
      }

      const outputKey = outputPath.toLowerCase();

      if (numericOutputPaths.has(outputKey)) {
        throw new Error(
          `Duplicate numeric output path for "${id}" and "${numericOutputPaths.get(outputKey)}".`
        );
      }

      if (canonicalOutputPaths.has(outputKey)) {
        throw new Error(
          `Numeric Pokemon id "${id}" collides with canonical slug "${canonicalOutputPaths.get(outputKey)}".`
        );
      }

      numericOutputPaths.set(outputKey, id);

      return [id, slug];
    }
  );

  return {
    canonicalSlugs: canonicalSlugs.sort(),
    numericEntries: numericEntries.sort(
      ([firstId], [secondId]) => Number(firstId) - Number(secondId)
    )
  };
}

function assertRegularFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} does not exist: ${filePath}`);
  }

  if (!fs.statSync(filePath).isFile()) {
    throw new Error(`${label} is not a regular file: ${filePath}`);
  }
}

function assertGeneratedCanonicalHtml(html, slug) {
  const canonicalUrl = `${siteOrigin}/pokemon/${slug}`;

  if (!html.includes(canonicalUrl)) {
    throw new Error(
      `Prerendered HTML for "${slug}" is missing canonical URL ${canonicalUrl}.`
    );
  }

  if (/<meta\s+http-equiv=["']refresh["']/i.test(html)) {
    throw new Error(
      `Prerendered HTML for "${slug}" looks like a redirect shell.`
    );
  }

  if (!/<script[^>]+src=["']\/assets\//i.test(html)) {
    throw new Error(
      `Prerendered HTML for "${slug}" is missing application JS references.`
    );
  }
}

function assertFinalizedCanonicalHtml(html, slug) {
  assertGeneratedCanonicalHtml(html, slug);

  if (!/<link[^>]+href=["']\/assets\/[^"']+\.css/i.test(html)) {
    throw new Error(
      `Finalized HTML for "${slug}" is missing application CSS references.`
    );
  }
}

function finalizeCanonicalRoute(pokemonDistDir, slug) {
  const routeDir = path.join(pokemonDistDir, slug);
  const indexPath = path.join(routeDir, "index.html");
  const extensionlessPath = path.join(pokemonDistDir, slug);

  assertRegularFile(
    indexPath,
    `Expected ${slug} canonical prerender output`
  );

  const html = fs.readFileSync(indexPath, "utf8");

  assertGeneratedCanonicalHtml(html, slug);

  fs.rmSync(routeDir, {
    force: true,
    recursive: true
  });
  fs.writeFileSync(extensionlessPath, html);

  return extensionlessPath;
}

function buildNumericRedirectShell(id, slug) {
  const canonicalUrl = `${siteOrigin}/pokemon/${slug}`;
  const routePath = `/pokemon/${slug}`;
  const displayName = formatPokemonName(slug);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(displayName)} - PokeLore</title>
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <meta http-equiv="refresh" content="0; url=${escapeHtml(routePath)}">
</head>
<body>
  <p>
    Redirecting to
    <a href="${escapeHtml(routePath)}">${escapeHtml(displayName)}</a>.
  </p>
</body>
</html>
`;
}

function writeNumericRedirectShell(pokemonDistDir, id, slug) {
  const outputPath = path.join(pokemonDistDir, id);
  const html = buildNumericRedirectShell(id, slug);

  fs.writeFileSync(outputPath, html);

  return outputPath;
}

function validateFinalizedCanonicalRoute(pokemonDistDir, slug) {
  const outputPath = path.join(pokemonDistDir, slug);
  const oldIndexPath = path.join(outputPath, "index.html");

  assertRegularFile(
    outputPath,
    `Finalized canonical output for ${slug}`
  );

  if (path.extname(outputPath) !== "") {
    throw new Error(
      `Finalized canonical output for "${slug}" must be extensionless.`
    );
  }

  if (fs.existsSync(oldIndexPath)) {
    throw new Error(
      `Canonical index.html still exists after finalization: ${oldIndexPath}`
    );
  }

  assertFinalizedCanonicalHtml(
    fs.readFileSync(outputPath, "utf8"),
    slug
  );
}

function validateNumericRedirectShell(pokemonDistDir, id, slug) {
  const outputPath = path.join(pokemonDistDir, id);

  assertRegularFile(
    outputPath,
    `Numeric redirect shell for ${id}`
  );

  if (path.extname(outputPath) !== "") {
    throw new Error(
      `Numeric redirect shell for "${id}" must be extensionless.`
    );
  }

  const html = fs.readFileSync(outputPath, "utf8");
  const canonicalUrl = `${siteOrigin}/pokemon/${slug}`;
  const routePath = `/pokemon/${slug}`;

  if (!html.includes(canonicalUrl)) {
    throw new Error(
      `Numeric redirect shell ${id} is missing canonical URL ${canonicalUrl}.`
    );
  }

  if (
    !html.includes(
      `<meta http-equiv="refresh" content="0; url=${routePath}">`
    )
  ) {
    throw new Error(
      `Numeric redirect shell ${id} is missing meta refresh to ${routePath}.`
    );
  }

  if (!html.includes(`<a href="${routePath}">`)) {
    throw new Error(
      `Numeric redirect shell ${id} is missing fallback anchor to ${routePath}.`
    );
  }

  if (/noindex/i.test(html)) {
    throw new Error(
      `Numeric redirect shell ${id} must not include noindex.`
    );
  }

  if (
    html.length > 1500 ||
    /<script[^>]+src=["']\/assets\//i.test(html)
  ) {
    throw new Error(
      `Numeric redirect shell ${id} looks like a full prerendered page.`
    );
  }
}

function getRepresentativeEntries(numericEntries) {
  const entriesById = new Map(numericEntries);
  const requestedIds = [
    "1",
    "25",
    "26",
    "131",
    "251",
    "349"
  ];
  const highestEntry = numericEntries.at(-1);
  const seenIds = new Set();

  return [
    ...requestedIds
      .filter(id => entriesById.has(id))
      .map(id => [id, entriesById.get(id)]),
    highestEntry
  ].filter(entry => {
    if (!entry || seenIds.has(entry[0])) {
      return false;
    }

    seenIds.add(entry[0]);
    return true;
  });
}

function validateRepresentativeCanonicalContent(
  pokemonDistDir,
  id,
  slug
) {
  const html = fs.readFileSync(
    path.join(pokemonDistDir, slug),
    "utf8"
  );
  const displayName = formatPokemonName(slug);

  if (
    !new RegExp(
      `<title>[^<]*${displayName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^<]*</title>`,
      "i"
    ).test(html)
  ) {
    throw new Error(
      `Representative ${id}/${slug} is missing expected title text "${displayName}".`
    );
  }

  if (
    !new RegExp(
      `<h1[^>]*>\\s*${displayName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*</h1>`,
      "i"
    ).test(html)
  ) {
    throw new Error(
      `Representative ${id}/${slug} is missing expected H1 "${displayName}".`
    );
  }

  if (!/Base Stats/i.test(html)) {
    throw new Error(
      `Representative ${id}/${slug} is missing Base Stats content.`
    );
  }

  if (
    !/prerender-analysis|Pokelore|Playthrough|Nuzlocke|Competitive/i.test(
      html
    )
  ) {
    throw new Error(
      `Representative ${id}/${slug} is missing rich prerender content.`
    );
  }
}

function validateFinalizedOutputs(
  pokemonDistDir,
  canonicalSlugs,
  numericEntries
) {
  canonicalSlugs.forEach(slug => {
    validateFinalizedCanonicalRoute(pokemonDistDir, slug);
  });

  numericEntries.forEach(([id, slug]) => {
    validateNumericRedirectShell(pokemonDistDir, id, slug);
  });

  const representativeEntries =
    getRepresentativeEntries(numericEntries);

  representativeEntries.forEach(([id, slug]) => {
    validateRepresentativeCanonicalContent(
      pokemonDistDir,
      id,
      slug
    );
  });

  return representativeEntries;
}

function finalizePokemonPrerenderRoutes({
  pokemonDistDir = defaultPokemonDistDir,
  routesPath = defaultRoutesPath
} = {}) {
  const routes = readJson(routesPath);
  const { canonicalSlugs, numericEntries } = validateRoutesData(
    routes,
    pokemonDistDir
  );

  canonicalSlugs.forEach(slug => {
    finalizeCanonicalRoute(pokemonDistDir, slug);
  });

  numericEntries.forEach(([id, slug]) => {
    writeNumericRedirectShell(pokemonDistDir, id, slug);
  });

  const representativeEntries = validateFinalizedOutputs(
    pokemonDistDir,
    canonicalSlugs,
    numericEntries
  );

  return {
    canonicalCount: canonicalSlugs.length,
    numericCount: numericEntries.length,
    highestNumericId: numericEntries.at(-1)?.[0] ?? null,
    highestNumericSlug: numericEntries.at(-1)?.[1] ?? null,
    representatives: representativeEntries
  };
}

function main() {
  const result = finalizePokemonPrerenderRoutes();

  console.log(
    [
      "Finalized Pokemon prerender routes as extensionless static files.",
      `Canonical exact files generated: ${result.canonicalCount}`,
      `Numeric redirect shells generated: ${result.numericCount}`,
      `Highest numeric route: ${result.highestNumericId ?? "none"}${result.highestNumericSlug ? ` -> ${result.highestNumericSlug}` : ""}`,
      `Representative validation: ${result.representatives.map(([id, slug]) => `${id}/${slug}`).join(", ")}`
    ].join("\n")
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export {
  buildNumericRedirectShell,
  finalizeCanonicalRoute,
  finalizePokemonPrerenderRoutes,
  validateFinalizedOutputs,
  validateRoutesData,
  writeNumericRedirectShell
};
