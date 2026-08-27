import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Archived diagnostic tooling for the abandoned Render-rule strategy.
// Production Pokemon routing is now finalized by finalizePokemonPrerenderRoutes.js
// into exact extensionless static files; do not use this script for deploys.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
const defaultBackupDir = path.join(repoRoot, "generated");
const pokemonDistDir = path.join(repoRoot, "dist", "pokemon");

const STRATEGY_EXPLICIT = "explicit";
const STRATEGY_PLACEHOLDER = "placeholder";
const slugPattern = "[a-z0-9-]+";
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

const representativePokemon = {
  2: "ivysaur",
  25: "pikachu",
  131: "lapras"
};

function parseNonNegativeInteger(value, label) {
  if (!/^\d+$/.test(value)) {
    throw new Error(
      `${label} must be a non-negative integer.`
    );
  }

  return Number(value);
}

function parseIncludeIds(value) {
  if (!value.trim()) {
    return [];
  }

  const seenIds = new Set();

  return value.split(",").reduce((ids, rawId) => {
    const trimmedId = rawId.trim();

    if (!/^\d+$/.test(trimmedId)) {
      throw new Error(
        `Included Pokemon id "${rawId}" is not numeric.`
      );
    }

    const normalizedId = String(Number(trimmedId));

    if (!seenIds.has(normalizedId)) {
      seenIds.add(normalizedId);
      ids.push(normalizedId);
    }

    return ids;
  }, []);
}

function parseArgs(argv) {
  const options = {
    backupDir: defaultBackupDir,
    confirm: false,
    dryRun: true,
    includeIds: [],
    inspectLiveShape: false,
    limit: null,
    outputPath: defaultOutputPath,
    routesPath: defaultRoutesPath,
    strategy: STRATEGY_EXPLICIT,
    sync: false,
    verifyLive: false
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

    if (arg === "--verify-live") {
      options.verifyLive = true;
      return;
    }

    if (arg === "--inspect-live-shape") {
      options.inspectLiveShape = true;
      return;
    }

    if (arg.startsWith("--limit=")) {
      options.limit = parseNonNegativeInteger(
        arg.slice("--limit=".length),
        "--limit"
      );
      return;
    }

    if (arg.startsWith("--include=")) {
      options.includeIds = parseIncludeIds(
        arg.slice("--include=".length)
      );
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
      throw new Error(
        "Use RENDER_SERVICE_ID for live sync. Service IDs must not be passed on the command line."
      );
    }

    throw new Error(`Unknown argument: ${arg}`);
  });

  return options;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function timestampForFileName(date = new Date()) {
  const pad = value => String(value).padStart(2, "0");

  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function sortNumericEntries(entries) {
  return [...entries].sort(
    ([first], [second]) => Number(first) - Number(second)
  );
}

function normalizeSlug(slug) {
  return String(slug ?? "").trim().toLowerCase();
}

function isNumericSlug(value) {
  return /^\d+$/.test(String(value ?? ""));
}

function isCanonicalSlug(value) {
  return new RegExp(`^${slugPattern}$`).test(
    String(value ?? "")
  );
}

function isNumericPokemonPath(source) {
  return /^\/pokemon\/\d+(?:\/|$)/.test(source);
}

function isNumericPokemonStaticResource(name) {
  return /^\d+$/.test(name) || /^\d+\.html$/.test(name);
}

function getNumericStaticPokemonRoutes() {
  if (!fs.existsSync(pokemonDistDir)) {
    return [];
  }

  return fs
    .readdirSync(pokemonDistDir, { withFileTypes: true })
    .filter(entry => isNumericPokemonStaticResource(entry.name))
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

function getSortedPokemonIdEntries(routes) {
  return sortNumericEntries(Object.entries(routes.byId)).map(
    ([id, slug]) => {
      const canonicalSlug = normalizeSlug(slug);
      const normalizedId = String(Number(id));

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

      if (!isCanonicalSlug(canonicalSlug)) {
        throw new Error(
          `Numeric Pokemon ${id} points to malformed canonical slug "${canonicalSlug}".`
        );
      }

      if (!routes.byName[canonicalSlug]) {
        throw new Error(
          `Numeric Pokemon ${id} points to missing canonical slug "${canonicalSlug}".`
        );
      }

      return [normalizedId, canonicalSlug];
    }
  );
}

function selectPokemonEntries(routes, options) {
  const allEntries = getSortedPokemonIdEntries(routes);
  const selectedIds = new Set();

  if (options.limit === null) {
    allEntries.forEach(([id]) => selectedIds.add(id));
  } else {
    allEntries
      .slice(0, options.limit)
      .forEach(([id]) => selectedIds.add(id));
  }

  options.includeIds.forEach(id => {
    if (!routes.byId[id]) {
      throw new Error(
        `Included Pokemon id ${id} is not present in pokemonRoutes.json.`
      );
    }

    selectedIds.add(id);
  });

  return allEntries.filter(([id]) => selectedIds.has(id));
}

function buildNumericRedirects(selectedEntries) {
  return selectedEntries.map(([id, canonicalSlug]) => ({
    type: "redirect",
    source: `/pokemon/${id}`,
    destination: `/pokemon/${canonicalSlug}`
  }));
}

function buildCanonicalRewrite(slug) {
  const canonicalSlug = normalizeSlug(slug);

  if (!isCanonicalSlug(canonicalSlug)) {
    throw new Error(
      `Encountered malformed canonical Pokemon slug "${slug}".`
    );
  }

  return {
    type: "rewrite",
    source: `/pokemon/${canonicalSlug}`,
    destination: `/pokemon/${canonicalSlug}/index.html`
  };
}

function buildAllExplicitCanonicalRewrites(routes) {
  return Object.keys(routes.byName).map(slug =>
    buildCanonicalRewrite(slug)
  );
}

function buildSelectedExplicitCanonicalRewrites(selectedEntries) {
  const seenSlugs = new Set();
  const rewrites = [];

  selectedEntries.forEach(([, slug]) => {
    if (seenSlugs.has(slug)) {
      return;
    }

    seenSlugs.add(slug);
    rewrites.push(buildCanonicalRewrite(slug));
  });

  return rewrites;
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

function buildRoutes(routes, options) {
  const selectedEntries = selectPokemonEntries(routes, options);
  const numericRedirects = buildNumericRedirects(selectedEntries);
  const explicitRewrites =
    options.limit === null
      ? buildAllExplicitCanonicalRewrites(routes)
      : buildSelectedExplicitCanonicalRewrites(selectedEntries);
  const placeholderRewrites = buildPlaceholderCanonicalRewrite();
  const canonicalRewrites =
    options.strategy === STRATEGY_PLACEHOLDER
      ? placeholderRewrites
      : explicitRewrites;
  const renderRoutes = [
    ...numericRedirects,
    ...canonicalRewrites,
    ...fallbackRules
  ];

  return {
    explicitRewrites,
    fallbackCount: fallbackRules.length,
    numericRedirects,
    placeholderRewrites,
    renderRoutes,
    selectedEntries,
    selectedIds: selectedEntries.map(([id]) => id),
    expectedRouteCount:
      numericRedirects.length +
      canonicalRewrites.length +
      fallbackRules.length,
    strategyATotal:
      numericRedirects.length +
      explicitRewrites.length +
      fallbackRules.length,
    strategyBTotal:
      numericRedirects.length +
      placeholderRewrites.length +
      fallbackRules.length
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

  const numericDestinationRewrite = renderRoutes.find(
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

function validateNoCanonicalSlugRedirects(renderRoutes) {
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
    JSON.stringify(lastRules) !== JSON.stringify(fallbackRules)
  ) {
    throw new Error(
      "Fallback rules must be the final two Render routes."
    );
  }

  renderRoutes.slice(0, -2).forEach((route, index) => {
    const isFallback =
      fallbackRules.some(
        fallback =>
          JSON.stringify(route) === JSON.stringify(fallback)
      ) ||
      route.source === "/pokemon/*" ||
      route.source === "/*";

    if (isFallback) {
      throw new Error(
        `Fallback route appears before the final two routes at position ${index + 1}.`
      );
    }
  });
}

function validateNoNumericStaticPokemonRoutes() {
  const numericStaticRoutes = getNumericStaticPokemonRoutes();

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

function validateNoPlaceholderPokemonRewrite(renderRoutes) {
  const placeholderRoute = renderRoutes.find(
    route =>
      route.source === "/pokemon/:slug" ||
      route.destination === "/pokemon/:slug/index.html" ||
      String(route.source).includes(":slug") ||
      String(route.destination).includes(":slug")
  );

  if (placeholderRoute) {
    throw new Error(
      "Placeholder Pokemon rewrites are not production-safe for live sync because missing destinations return an empty HTTP 200. Use explicit Strategy A routes."
    );
  }
}

function validateDestinations(renderRoutes) {
  renderRoutes.forEach((route, index) => {
    if (
      route.type !== "redirect" &&
      route.type !== "rewrite"
    ) {
      throw new Error(
        `Route at position ${index + 1} has unsupported type "${route.type}".`
      );
    }

    if (
      typeof route.source !== "string" ||
      typeof route.destination !== "string" ||
      !route.source.startsWith("/") ||
      !route.destination.startsWith("/")
    ) {
      throw new Error(
        `Route at position ${index + 1} has a malformed source or destination.`
      );
    }

    if (
      fallbackRules.some(
        fallback =>
          JSON.stringify(route) === JSON.stringify(fallback)
      )
    ) {
      return;
    }

    if (route.type === "redirect") {
      if (
        !/^\/pokemon\/\d+$/.test(route.source) ||
        !new RegExp(`^/pokemon/${slugPattern}$`).test(
          route.destination
        )
      ) {
        throw new Error(
          `Malformed Pokemon redirect route at position ${index + 1}: ${JSON.stringify(route)}`
        );
      }

      return;
    }

    if (
      !new RegExp(`^/pokemon/${slugPattern}$`).test(
        route.source
      )
    ) {
      throw new Error(
        `Malformed Pokemon rewrite source at position ${index + 1}: ${route.source}`
      );
    }

    const expectedDestination = `${route.source}/index.html`;

    if (route.destination !== expectedDestination) {
      throw new Error(
        `Canonical slug rewrite ${route.source} must point to ${expectedDestination}, not ${route.destination}.`
      );
    }
  });
}

function validateIncludedPokemonPairs(renderRoutes, selectedEntries) {
  const routesBySource = new Map(
    renderRoutes.map(route => [route.source, route])
  );

  selectedEntries.forEach(([id, slug]) => {
    const redirect = routesBySource.get(`/pokemon/${id}`);
    const rewrite = routesBySource.get(`/pokemon/${slug}`);

    if (
      !redirect ||
      redirect.type !== "redirect" ||
      redirect.destination !== `/pokemon/${slug}`
    ) {
      throw new Error(
        `Missing redirect/rewrite pair for included Pokemon ${id} (${slug}): redirect is absent or incorrect.`
      );
    }

    if (
      !rewrite ||
      rewrite.type !== "rewrite" ||
      rewrite.destination !== `/pokemon/${slug}/index.html`
    ) {
      throw new Error(
        `Missing redirect/rewrite pair for included Pokemon ${id} (${slug}): canonical rewrite is absent or incorrect.`
      );
    }
  });
}

function validateRepresentativeRules(renderRoutes, selectedIds) {
  const selectedIdSet = new Set(selectedIds);
  const expectedRules = [];

  Object.entries(representativePokemon).forEach(([id, slug]) => {
    if (!selectedIdSet.has(id)) {
      return;
    }

    expectedRules.push(
      {
        type: "redirect",
        source: `/pokemon/${id}`,
        destination: `/pokemon/${slug}`
      },
      {
        type: "rewrite",
        source: `/pokemon/${slug}`,
        destination: `/pokemon/${slug}/index.html`
      }
    );
  });

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
        `Representative rule mismatch for ${expectedRule.source}.`
      );
    }
  });
}

function validateRouteCounts(renderRoutes, generation) {
  const numericRedirectCount = renderRoutes.filter(
    route =>
      route.type === "redirect" &&
      /^\/pokemon\/\d+$/.test(route.source)
  ).length;
  const canonicalRewriteCount = renderRoutes.filter(
    route =>
      route.type === "rewrite" &&
      new RegExp(`^/pokemon/${slugPattern}$`).test(route.source)
  ).length;
  const fallbackCount = renderRoutes.filter(route =>
    fallbackRules.some(
      fallback =>
        JSON.stringify(route) === JSON.stringify(fallback)
    )
  ).length;

  if (numericRedirectCount !== generation.numericRedirects.length) {
    throw new Error(
      `Numeric redirect count mismatch. Expected ${generation.numericRedirects.length}, received ${numericRedirectCount}.`
    );
  }

  if (canonicalRewriteCount !== generation.explicitRewrites.length) {
    throw new Error(
      `Canonical rewrite count mismatch. Expected ${generation.explicitRewrites.length}, received ${canonicalRewriteCount}.`
    );
  }

  if (fallbackCount !== fallbackRules.length) {
    throw new Error(
      `Fallback count mismatch. Expected ${fallbackRules.length}, received ${fallbackCount}.`
    );
  }

  if (renderRoutes.length !== generation.expectedRouteCount) {
    throw new Error(
      `Generated route count mismatch. Expected ${generation.expectedRouteCount}, received ${renderRoutes.length}.`
    );
  }
}

function validateRoutes(renderRoutes, generation) {
  validateUniqueSources(renderRoutes);
  validateNoNumericRewrites(renderRoutes);
  validateNoCanonicalSlugRedirects(renderRoutes);
  validateFallbacksLast(renderRoutes);
  validateNoNumericStaticPokemonRoutes();
  validateNoPlaceholderPokemonRewrite(renderRoutes);
  validateDestinations(renderRoutes);
  validateIncludedPokemonPairs(
    renderRoutes,
    generation.selectedEntries
  );
  validateRepresentativeRules(
    renderRoutes,
    generation.selectedIds
  );
  validateRouteCounts(renderRoutes, generation);
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

function extractRouteItems(responseBody) {
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

function unwrapRenderRouteItem(item) {
  if (item?.route && typeof item.route === "object") {
    return item.route;
  }

  return item;
}

function normalizeFetchedRenderRoutes(routeItems) {
  return routeItems.map(item =>
    normalizeRenderRoute(unwrapRenderRouteItem(item))
  );
}

function getLastCursor(routeItems) {
  if (routeItems.length === 0) {
    return null;
  }

  const lastItem = routeItems[routeItems.length - 1];

  return typeof lastItem?.cursor === "string"
    ? lastItem.cursor
    : null;
}

function getSafeRouteShapeSample(routeItems) {
  return routeItems.slice(0, 2).map(item => {
    const route = unwrapRenderRouteItem(item);

    return {
      topLevelKeys: Object.keys(item ?? {}),
      cursorType: typeof item?.cursor,
      routeKeys:
        item?.route && typeof item.route === "object"
          ? Object.keys(item.route)
          : [],
      routeSample: {
        id: route?.id ? "<redacted-route-id>" : undefined,
        type: route?.type,
        source: route?.source,
        destination: route?.destination,
        priority: route?.priority
      }
    };
  });
}

function findRouteDiff(expectedRoutes, actualRoutes) {
  if (actualRoutes.length !== expectedRoutes.length) {
    return `route count differs: expected ${expectedRoutes.length}, received ${actualRoutes.length}`;
  }

  for (let index = 0; index < expectedRoutes.length; index += 1) {
    const expectedRoute = expectedRoutes[index];
    const actualRoute = actualRoutes[index];

    if (
      JSON.stringify(actualRoute) !== JSON.stringify(expectedRoute)
    ) {
      return [
        `route ${index + 1} differs`,
        `expected ${JSON.stringify(expectedRoute)}`,
        `received ${JSON.stringify(actualRoute)}`
      ].join("; ");
    }
  }

  return null;
}

function validateSyncedRoutes(
  generatedRoutes,
  liveRoutes,
  generation
) {
  const normalizedGenerated = normalizeRenderRoutes(generatedRoutes);
  const normalizedLive = normalizeRenderRoutes(liveRoutes);

  validateRoutes(normalizedLive, generation);

  const diff = findRouteDiff(
    normalizedGenerated,
    normalizedLive
  );

  if (diff) {
    throw new Error(
      `Post-sync Render route verification failed: ${diff}`
    );
  }
}

async function writeDryRunOutput(outputPath, renderRoutes) {
  await fs.promises.mkdir(path.dirname(outputPath), {
    recursive: true
  });
  await fs.promises.writeFile(
    outputPath,
    `${JSON.stringify(renderRoutes, null, 2)}\n`
  );
}

function getRenderCredentials() {
  return {
    serviceId: process.env.RENDER_SERVICE_ID,
    token: process.env.RENDER_API_TOKEN
  };
}

function assertSyncModeAllowed(options) {
  if (
    options.strategy === STRATEGY_PLACEHOLDER &&
    options.sync
  ) {
    throw new Error(
      "Refusing to sync placeholder Pokemon rewrites: missing destinations return an empty HTTP 200, so Strategy B is unsafe until Render behavior changes."
    );
  }

  if (options.sync && options.dryRun) {
    throw new Error(
      "Live Render sync requires --sync --no-dry-run --confirm. Dry-run mode never calls the Render API."
    );
  }

  if (options.sync && !options.confirm) {
    throw new Error(
      "Live Render sync requires --confirm together with --sync --no-dry-run."
    );
  }

  if (
    options.sync &&
    (options.verifyLive || options.inspectLiveShape)
  ) {
    throw new Error(
      "--sync cannot be combined with --verify-live or --inspect-live-shape."
    );
  }
}

function assertRenderCredentials({ serviceId, token }) {
  if (!token) {
    throw new Error(
      "RENDER_API_TOKEN is required to access Render routes."
    );
  }

  if (!serviceId) {
    throw new Error(
      "RENDER_SERVICE_ID is required to access Render routes."
    );
  }
}

async function fetchRenderRoutePage({
  cursor,
  serviceId,
  token
}) {
  const url = new URL(
    `https://api.render.com/v1/services/${encodeURIComponent(serviceId)}/routes`
  );

  url.searchParams.set("limit", "100");

  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Render route fetch failed with ${response.status}: ${body}`
    );
  }

  return extractRouteItems(await response.json());
}

async function fetchRenderRoutes(credentials) {
  const rawItems = [];
  let cursor = null;
  let pageCount = 0;

  for (;;) {
    const pageItems = await fetchRenderRoutePage({
      ...credentials,
      cursor
    });

    pageCount += 1;
    rawItems.push(...pageItems);

    if (pageItems.length < 100) {
      break;
    }

    const nextCursor = getLastCursor(pageItems);

    if (!nextCursor || nextCursor === cursor) {
      break;
    }

    cursor = nextCursor;
  }

  return {
    pageCount,
    rawItems,
    routes: normalizeFetchedRenderRoutes(rawItems)
  };
}

async function backupRenderRoutes(routes, options) {
  const backupPath = path.join(
    options.backupDir,
    `render-routes-backup-${timestampForFileName()}.json`
  );

  await fs.promises.mkdir(path.dirname(backupPath), {
    recursive: true
  });
  await fs.promises.writeFile(
    backupPath,
    `${JSON.stringify(routes, null, 2)}\n`
  );

  return backupPath;
}

async function putRenderRoutes(renderRoutes, { serviceId, token }) {
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

function printSyncSummary(
  currentRouteSnapshot,
  generation,
  options,
  backupPath
) {
  console.log(
    [
      `Current live Render route count: ${currentRouteSnapshot.routes.length}`,
      `Proposed live Render route count: ${generation.renderRoutes.length}`,
      `Numeric redirects: ${generation.numericRedirects.length}`,
      `Canonical slug rewrites: ${generation.explicitRewrites.length}`,
      `Fallback rules: ${generation.fallbackCount}`,
      `Limit used: ${options.limit === null ? "none" : options.limit}`,
      `Explicit included IDs: ${options.includeIds.length ? options.includeIds.join(",") : "none"}`,
      `Live route backup written: ${path.relative(repoRoot, backupPath)}`
    ].join("\n")
  );
}

async function syncRenderRoutes(generation, options) {
  assertSyncModeAllowed(options);
  const credentials = getRenderCredentials();

  assertRenderCredentials(credentials);

  console.log(
    "Fetching current live Render routes before sync..."
  );
  const currentRoutes = await fetchRenderRoutes(credentials);
  const backupPath = await backupRenderRoutes(
    currentRoutes.rawItems,
    options
  );

  printSyncSummary(
    currentRoutes,
    generation,
    options,
    backupPath
  );

  await putRenderRoutes(generation.renderRoutes, credentials);

  console.log(
    "Render PUT completed. Fetching routes again for verification..."
  );
  const postSyncRoutes = await fetchRenderRoutes(credentials);

  try {
    validateSyncedRoutes(
      generation.renderRoutes,
      postSyncRoutes.routes,
      generation
    );
  } catch (error) {
    throw new Error(
      [
        error.message,
        `Backup file: ${path.relative(repoRoot, backupPath)}`,
        "No automatic restore was attempted."
      ].join("\n"),
      { cause: error }
    );
  }

  return postSyncRoutes;
}

async function inspectLiveRouteShape() {
  const credentials = getRenderCredentials();

  assertRenderCredentials(credentials);

  const liveSnapshot = await fetchRenderRoutes(credentials);

  console.log(
    [
      "Render live route response shape inspection complete.",
      `Pages fetched: ${liveSnapshot.pageCount}`,
      `Wrapped route items fetched: ${liveSnapshot.rawItems.length}`,
      "First route item samples:",
      JSON.stringify(
        getSafeRouteShapeSample(liveSnapshot.rawItems),
        null,
        2
      )
    ].join("\n")
  );
}

async function verifyLiveRoutes(generation) {
  const credentials = getRenderCredentials();

  assertRenderCredentials(credentials);

  const liveSnapshot = await fetchRenderRoutes(credentials);

  validateSyncedRoutes(
    generation.renderRoutes,
    liveSnapshot.routes,
    generation
  );

  console.log(
    [
      "Read-only live Render route verification complete.",
      `Pages fetched: ${liveSnapshot.pageCount}`,
      `Live route count: ${liveSnapshot.routes.length}`,
      `Expected route count: ${generation.renderRoutes.length}`,
      "Exact count/order/type/source/destination match: yes",
      "Render API mutations executed: none"
    ].join("\n")
  );
}

function printReport({ generation, options }) {
  console.log(
    [
      "Render Pokemon route generation complete.",
      `Mode: ${options.dryRun ? "dry-run" : "sync"}`,
      `Selected output strategy: ${options.strategy}`,
      `Limit used: ${options.limit === null ? "none" : options.limit}`,
      `Explicit included IDs: ${options.includeIds.length ? options.includeIds.join(",") : "none"}`,
      `Numeric redirects generated: ${generation.numericRedirects.length}`,
      `Canonical slug rewrites under Strategy A: ${generation.explicitRewrites.length}`,
      `Fallback rules generated: ${generation.fallbackCount}`,
      `Total rule count under Strategy A: ${generation.strategyATotal}`,
      `Total rule count if Strategy B proves usable: ${generation.strategyBTotal}`,
      `Rules in generated output: ${generation.renderRoutes.length}`,
      `Output file: ${path.relative(repoRoot, options.outputPath)}`,
      "Validation: passed"
    ].join("\n")
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  assertSyncModeAllowed(options);

  if (options.inspectLiveShape) {
    await inspectLiveRouteShape();

    if (!options.verifyLive) {
      return;
    }
  }

  const pokemonRoutes = loadPokemonRoutes(options.routesPath);
  const generation = buildRoutes(pokemonRoutes, options);

  validateRoutes(generation.renderRoutes, generation);

  if (options.verifyLive) {
    await verifyLiveRoutes(generation);
    return;
  }

  await writeDryRunOutput(
    options.outputPath,
    generation.renderRoutes
  );
  printReport({ generation, options });

  if (!options.sync) {
    console.log("Render API sync skipped.");
    return;
  }

  const result = await syncRenderRoutes(generation, options);

  console.log(
    `Render API sync completed. Updated ${result.routes.length} routes.`
  );
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
