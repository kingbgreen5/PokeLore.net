import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);
const repoRoot = path.resolve(__dirname, "..");
const defaultRoutesPath = path.join(
  repoRoot,
  "public",
  "data",
  "pokemonRoutes.json"
);
const defaultOutputPath = path.join(
  repoRoot,
  "generated",
  "renderPokemonRoutes.json"
);
const pokemonDistDir = path.join(
  repoRoot,
  "dist",
  "pokemon"
);
const defaultBackupDir = path.join(
  repoRoot,
  "generated",
  "render-route-backups"
);

const STRATEGY_EXPLICIT = "explicit";
const STRATEGY_PLACEHOLDER = "placeholder";
const fallbackRules = [
  {
    type: "rewrite",
    source: "/pokemon/*",
    destination: "/index.html"
  },
  {
    type: "rewrite",
    source: "/*",
    destination: "/index.html"
  }
];

function parseArgs(argv) {
  const options = {
    backupDir: defaultBackupDir,
    confirm: false,
    dryRun: true,
    outputPath: defaultOutputPath,
    routesPath: defaultRoutesPath,
    serviceId: process.env.RENDER_SERVICE_ID,
    strategy: STRATEGY_EXPLICIT,
    sync: false
  };

  argv.forEach(arg => {
    if (arg === "--dry-run") {
      options.dryRun = true;
      return;
    }

    if (arg === "--no-dry-run") {
      options.dryRun = false;
      return;
    }

    if (arg === "--sync") {
      options.sync = true;
      return;
    }

    if (arg === "--confirm") {
      options.confirm = true;
      return;
    }

    if (arg.startsWith("--strategy=")) {
      const value = arg
        .slice("--strategy=".length)
        .trim()
        .toLowerCase();

      if (
        value !== STRATEGY_EXPLICIT &&
        value !== STRATEGY_PLACEHOLDER
      ) {
        throw new Error(
          `Unsupported strategy "${value}". Use "explicit" or "placeholder".`
        );
      }

      options.strategy = value;
      return;
    }

    if (arg.startsWith("--output=")) {
      options.outputPath = path.resolve(
        repoRoot,
        arg.slice("--output=".length)
      );
      return;
    }

    if (arg.startsWith("--backup-dir=")) {
      options.backupDir = path.resolve(
        repoRoot,
        arg.slice("--backup-dir=".length)
      );
      return;
    }

    if (arg.startsWith("--routes=")) {
      options.routesPath = path.resolve(
        repoRoot,
        arg.slice("--routes=".length)
      );
      return;
    }

    if (arg.startsWith("--service-id=")) {
      options.serviceId =
        arg.slice("--service-id=".length);
      return;
    }

    throw new Error(`Unknown argument: ${arg}`);
  });

  return options;
}

function readJson(filePath) {
  return JSON.parse(
    fs.readFileSync(filePath, "utf8")
  );
}

function timestampForFileName(date = new Date()) {
  return date
    .toISOString()
    .replace(/[:.]/g, "-");
}

function sortNumericEntries(entries) {
  return [...entries].sort(
    ([first], [second]) =>
      Number(first) - Number(second)
  );
}

function normalizeSlug(slug) {
  return String(slug ?? "")
    .trim()
    .toLowerCase();
}

function isNumericSlug(value) {
  return /^\d+$/.test(String(value ?? ""));
}

function isNumericPokemonPath(source) {
  return /^\/pokemon\/\d+(?:\/|$)/.test(
    source
  );
}

function isNumericPokemonStaticResource(name) {
  return (
    /^\d+$/.test(name) ||
    /^\d+\.html$/.test(name)
  );
}

function getNumericStaticPokemonRoutes() {
  if (!fs.existsSync(pokemonDistDir)) {
    return [];
  }

  return fs
    .readdirSync(pokemonDistDir, {
      withFileTypes: true
    })
    .filter(entry =>
      isNumericPokemonStaticResource(entry.name)
    )
    .map(entry =>
      path.relative(
        repoRoot,
        path.join(pokemonDistDir, entry.name)
      )
    );
}

function loadPokemonRoutes(routesPath) {
  const routes = readJson(routesPath);

  if (
    !routes ||
    typeof routes.byId !== "object" ||
    typeof routes.byName !== "object"
  ) {
    throw new Error(
      "pokemonRoutes.json must contain byId and byName objects."
    );
  }

  return routes;
}

function buildNumericRedirects(routes) {
  return sortNumericEntries(
    Object.entries(routes.byId)
  ).map(([id, slug]) => {
    const canonicalSlug = normalizeSlug(slug);

    if (!isNumericSlug(id)) {
      throw new Error(
        `Pokemon byId key "${id}" is not numeric.`
      );
    }

    if (!canonicalSlug) {
      throw new Error(
        `Numeric Pokemon ${id} has no canonical slug.`
      );
    }

    if (!routes.byName[canonicalSlug]) {
      throw new Error(
        `Numeric Pokemon ${id} points to missing canonical slug "${canonicalSlug}".`
      );
    }

    return {
      type: "redirect",
      source: `/pokemon/${id}`,
      destination: `/pokemon/${canonicalSlug}`
    };
  });
}

function buildExplicitCanonicalRewrites(routes) {
  return Object.keys(routes.byName).map(slug => {
    const canonicalSlug = normalizeSlug(slug);

    if (!canonicalSlug) {
      throw new Error(
        "Encountered empty canonical Pokemon slug."
      );
    }

    return {
      type: "rewrite",
      source: `/pokemon/${canonicalSlug}`,
      destination: `/pokemon/${canonicalSlug}/index.html`
    };
  });
}

function buildPlaceholderCanonicalRewrite() {
  return [
    {
      type: "rewrite",
      source: "/pokemon/:slug",
      destination: "/pokemon/:slug/index.html"
    }
  ];
}

function buildRoutes(routes, strategy) {
  const numericRedirects =
    buildNumericRedirects(routes);
  const explicitRewrites =
    buildExplicitCanonicalRewrites(routes);
  const canonicalRewrites =
    strategy === STRATEGY_PLACEHOLDER
      ? buildPlaceholderCanonicalRewrite()
      : explicitRewrites;

  return {
    numericRedirects,
    explicitRewrites,
    placeholderRewrites:
      buildPlaceholderCanonicalRewrite(),
    renderRoutes: [
      ...numericRedirects,
      ...canonicalRewrites,
      ...fallbackRules
    ]
  };
}

function validateUniqueSources(renderRoutes) {
  const seenSources = new Map();

  renderRoutes.forEach((route, index) => {
    if (seenSources.has(route.source)) {
      throw new Error(
        `Duplicate Render route source "${route.source}" at positions ${seenSources.get(route.source) + 1} and ${index + 1}.`
      );
    }

    seenSources.set(route.source, index);
  });
}

function validateNoNumericRewrites(renderRoutes) {
  const numericRewrite = renderRoutes.find(
    route =>
      route.type === "rewrite" &&
      isNumericPokemonPath(route.source)
  );

  if (numericRewrite) {
    throw new Error(
      `Numeric Pokemon route generated as rewrite: ${numericRewrite.source}`
    );
  }

  const numericDestinationRewrite =
    renderRoutes.find(
      route =>
        route.type === "rewrite" &&
        /^\/pokemon\/\d+(?:\/index\.html)?$/.test(
          route.destination
        )
    );

  if (numericDestinationRewrite) {
    throw new Error(
      `Numeric Pokemon prerender HTML route expected by rewrite: ${numericDestinationRewrite.destination}`
    );
  }
}

function validateNoCanonicalSlugRedirects(
  renderRoutes
) {
  const canonicalRedirect = renderRoutes.find(
    route =>
      route.type === "redirect" &&
      !isNumericPokemonPath(route.source)
  );

  if (canonicalRedirect) {
    throw new Error(
      `Canonical slug route generated as redirect: ${canonicalRedirect.source}`
    );
  }
}

function validateFallbacksLast(renderRoutes) {
  const lastRules = renderRoutes.slice(-2);

  if (
    JSON.stringify(lastRules) !==
    JSON.stringify(fallbackRules)
  ) {
    throw new Error(
      "Fallback rules must be the final two Render routes."
    );
  }
}

function validateNoNumericStaticPokemonRoutes() {
  const numericStaticRoutes =
    getNumericStaticPokemonRoutes();

  if (numericStaticRoutes.length > 0) {
    throw new Error(
      [
        "Numeric Pokemon prerender HTML is present in dist:",
        ...numericStaticRoutes,
        "",
        "Numeric Pokemon routes should redirect to canonical slugs, not serve prerender HTML."
      ].join("\n")
    );
  }
}

function validateRoutes(renderRoutes) {
  validateUniqueSources(renderRoutes);
  validateNoNumericRewrites(renderRoutes);
  validateNoCanonicalSlugRedirects(renderRoutes);
  validateFallbacksLast(renderRoutes);
  validateNoNumericStaticPokemonRoutes();
}

function normalizeRenderRoute(route) {
  return {
    type: route?.type,
    source: route?.source,
    destination: route?.destination
  };
}

function normalizeRenderRoutes(routes) {
  return routes.map(normalizeRenderRoute);
}

function extractRenderRoutes(responseBody) {
  if (Array.isArray(responseBody)) {
    return responseBody;
  }

  if (Array.isArray(responseBody?.routes)) {
    return responseBody.routes;
  }

  throw new Error(
    "Render routes response did not contain a route array."
  );
}

function validateRepresentativeRules(renderRoutes) {
  const expectedRules = [
    {
      type: "redirect",
      source: "/pokemon/25",
      destination: "/pokemon/pikachu"
    },
    {
      type: "redirect",
      source: "/pokemon/131",
      destination: "/pokemon/lapras"
    },
    {
      type: "rewrite",
      source: "/pokemon/pikachu",
      destination: "/pokemon/pikachu/index.html"
    },
    {
      type: "rewrite",
      source: "/pokemon/lapras",
      destination: "/pokemon/lapras/index.html"
    }
  ];

  expectedRules.forEach(expectedRule => {
    const matchingRule = renderRoutes.find(
      route => route.source === expectedRule.source
    );

    if (
      !matchingRule ||
      JSON.stringify(matchingRule) !==
        JSON.stringify(expectedRule)
    ) {
      throw new Error(
        `Post-sync representative rule mismatch for ${expectedRule.source}.`
      );
    }
  });
}

function validateSyncedRoutes(
  generatedRoutes,
  liveRoutes
) {
  const normalizedGenerated =
    normalizeRenderRoutes(generatedRoutes);
  const normalizedLive =
    normalizeRenderRoutes(liveRoutes);

  validateRoutes(normalizedLive);
  validateRepresentativeRules(normalizedLive);

  if (
    normalizedLive.length !==
    normalizedGenerated.length
  ) {
    throw new Error(
      `Post-sync route count mismatch. Expected ${normalizedGenerated.length}, received ${normalizedLive.length}.`
    );
  }

  for (
    let index = 0;
    index < normalizedGenerated.length;
    index += 1
  ) {
    const expectedRoute =
      normalizedGenerated[index];
    const actualRoute =
      normalizedLive[index];

    if (
      JSON.stringify(actualRoute) !==
      JSON.stringify(expectedRoute)
    ) {
      throw new Error(
        [
          `Post-sync route mismatch at position ${index + 1}.`,
          `Expected: ${JSON.stringify(expectedRoute)}`,
          `Received: ${JSON.stringify(actualRoute)}`
        ].join("\n")
      );
    }
  }
}

async function writeDryRunOutput(
  outputPath,
  renderRoutes
) {
  await fs.promises.mkdir(
    path.dirname(outputPath),
    {
      recursive: true
    }
  );
  await fs.promises.writeFile(
    outputPath,
    `${JSON.stringify(renderRoutes, null, 2)}\n`
  );
}

function getRenderCredentials(options) {
  return {
    serviceId: options.serviceId,
    token: process.env.RENDER_API_TOKEN
  };
}

function assertLiveSyncAllowed(options) {
  if (
    options.sync &&
    !options.dryRun &&
    !options.confirm
  ) {
    throw new Error(
      "Live Render sync requires --confirm together with --sync --no-dry-run."
    );
  }
}

function assertRenderCredentials({
  serviceId,
  token
}) {
  if (!token) {
    throw new Error(
      "RENDER_API_TOKEN is required to sync Render routes."
    );
  }

  if (!serviceId) {
    throw new Error(
      "RENDER_SERVICE_ID or --service-id is required to sync Render routes."
    );
  }
}

async function fetchRenderRoutes({
  serviceId,
  token
}) {
  const response = await fetch(
    `https://api.render.com/v1/services/${encodeURIComponent(serviceId)}/routes`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Render route fetch failed with ${response.status}: ${body}`
    );
  }

  return extractRenderRoutes(
    await response.json()
  );
}

async function backupRenderRoutes(
  routes,
  options
) {
  const backupPath = path.join(
    options.backupDir,
    `live-render-routes-${timestampForFileName()}.json`
  );

  await fs.promises.mkdir(
    path.dirname(backupPath),
    {
      recursive: true
    }
  );
  await fs.promises.writeFile(
    backupPath,
    `${JSON.stringify(routes, null, 2)}\n`
  );

  return backupPath;
}

async function putRenderRoutes(
  renderRoutes,
  {
    serviceId,
    token
  }
) {
  const response = await fetch(
    `https://api.render.com/v1/services/${encodeURIComponent(serviceId)}/routes`,
    {
      method: "PUT",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(renderRoutes)
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Render route sync failed with ${response.status}: ${body}`
    );
  }

  return response.json();
}

async function syncRenderRoutes(
  renderRoutes,
  options
) {
  assertLiveSyncAllowed(options);
  const credentials =
    getRenderCredentials(options);

  assertRenderCredentials(credentials);

  console.log(
    "Fetching current live Render routes before sync..."
  );
  const currentRoutes =
    await fetchRenderRoutes(credentials);
  const backupPath =
    await backupRenderRoutes(
      currentRoutes,
      options
    );

  console.log(
    [
      `Current live Render route count: ${currentRoutes.length}`,
      `Proposed Render route count: ${renderRoutes.length}`,
      `Live route backup written: ${path.relative(repoRoot, backupPath)}`
    ].join("\n")
  );

  await putRenderRoutes(
    renderRoutes,
    credentials
  );

  console.log(
    "Render PUT completed. Fetching routes again for verification..."
  );
  const postSyncRoutes =
    await fetchRenderRoutes(credentials);

  validateSyncedRoutes(
    renderRoutes,
    postSyncRoutes
  );

  return postSyncRoutes;
}

function printReport({
  explicitRewrites,
  numericRedirects,
  options,
  renderRoutes
}) {
  const strategyATotal =
    numericRedirects.length +
    explicitRewrites.length +
    fallbackRules.length;
  const strategyBTotal =
    numericRedirects.length +
    1 +
    fallbackRules.length;

  console.log(
    [
      "Render Pokemon route generation complete.",
      `Mode: ${options.dryRun ? "dry-run" : "sync"}`,
      `Selected output strategy: ${options.strategy}`,
      `Numeric redirects generated: ${numericRedirects.length}`,
      `Canonical slug rewrites under Strategy A: ${explicitRewrites.length}`,
      `Total rule count under Strategy A: ${strategyATotal}`,
      `Total rule count if Strategy B proves usable: ${strategyBTotal}`,
      `Rules in generated output: ${renderRoutes.length}`,
      `Output file: ${path.relative(repoRoot, options.outputPath)}`,
      "Validation: passed"
    ].join("\n")
  );
}

async function main() {
  const options = parseArgs(
    process.argv.slice(2)
  );
  assertLiveSyncAllowed(options);
  const pokemonRoutes = loadPokemonRoutes(
    options.routesPath
  );
  const {
    explicitRewrites,
    numericRedirects,
    renderRoutes
  } = buildRoutes(
    pokemonRoutes,
    options.strategy
  );

  validateRoutes(renderRoutes);
  await writeDryRunOutput(
    options.outputPath,
    renderRoutes
  );
  printReport({
    explicitRewrites,
    numericRedirects,
    options,
    renderRoutes
  });

  if (!options.sync || options.dryRun) {
    console.log(
      "Render API sync skipped."
    );
    return;
  }

  const result = await syncRenderRoutes(
    renderRoutes,
    options
  );
  console.log(
    `Render API sync completed. Updated ${Array.isArray(result) ? result.length : "unknown"} routes.`
  );
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
