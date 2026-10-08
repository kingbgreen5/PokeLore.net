# Phase 11C — Production Cutover Remediation

Status: **NO-GO — do not deploy to production.** No production infrastructure,
DNS, routing, or deployment was changed. Protected staging was not deployed
because the release artifact did not finish building.

## Original blockers and status

| Blocker | Status | Evidence |
| --- | --- | --- |
| Staging-wide `noindex` could reach production | Code remediation implemented; deployment verification blocked | Environment-aware generated `_headers` policy now retains `X-Robots-Tag: noindex` only for staging. |
| Public hubs had direct metadata `noindex` | Fixed in source; generated-artifact verification blocked | Removed the direct directives from public Moves, Abilities, Items, Locations, Types, and Dex Entries hubs. Development and 404 protections remain. |
| `/single-type-coverage` React #418 | Root cause fixed in source; browser regression execution blocked | The first client render read `localStorage` and `window.location.search`, while static HTML used defaults. Hydration now begins with the static defaults and applies browser state in effects after hydration. |
| Production Cloudflare target unspecified | Safe repository configuration prepared | `wrangler.production.jsonc` defines a separate, unbound production Worker and the apex custom-domain intent. No deployment was performed. |
| Analytics/Search Console parity incomplete | GA parity implemented; Search Console ownership remains external | Production currently exposes `G-K4YZXKJHVJ`; the production build enables that same ID once, with the existing delayed idle-load behavior. No Search Console verification meta tag was found in the public production HTML. |

## Root causes

1. `public/_headers` is copied verbatim into every static build. A staging
   blanket policy therefore needed to be generated from an explicit deployment
   environment, rather than kept as a universal public asset.
2. Public hubs carried page-level `robots: 'noindex'` values even though they
   are canonical public routes.
3. The Single Type Coverage island rendered live browser preferences before
   hydration. A direct parameterized navigation or saved preference produced
   different first-render markup from the statically rendered defaults.
4. The current public production page has Google Analytics markup but no
   inspectable Search Console meta token. Ownership may instead be DNS/domain
   based; that cannot be inferred from public HTML.

## Files changed

- `astro.config.mjs` — writes the environment-specific header policy after
  static output is generated.
- `scripts/deployment.mjs` — deployment environment validation and header
  generation.
- `scripts/build.mjs`, `scripts/verify-all.mjs`, `scripts/verify-build.mjs`,
  `scripts/verify-indexability.mjs`, and `scripts/test-cloudflare-http.mjs` —
  separate staging/production build and verification policy.
- `wrangler.production.jsonc` and `package.json` — explicit production build
  and deploy commands; no command was executed to deploy production.
- `src/components/Analytics.astro` and `src/layouts/BaseLayout.astro` —
  production-only GA configuration, preserving the current 4.5-second then
  idle-callback loading behavior and a single `gtag('config', ...)` call.
- `src/islands/SingleTypeCoverageTool.jsx` — hydration-safe initialization.
- `src/pages/{moves,abilities,items,locations,types,dex-entries}.astro` —
  removes unintended public-route `noindex` metadata.
- `scripts/single-type-coverage-browser.mjs` — direct parameterized-load,
  refresh, console-error, and JavaScript-disabled fallback regression test.
- `scripts/generate-editorial-static-fragments.mjs` — resolves React package
  entries with ESM-aware paths so the build wrapper can run from this project.

## Testing evidence

Completed:

- `node --check scripts/single-type-coverage-browser.mjs`
- `node --check scripts/build.mjs`
- `node --check scripts/verify-indexability.mjs`
- Read-only production HTTP inspection:
  - `https://pokelore.net/` — 200; existing GA ID present; no
    `google-site-verification` meta tag detected.
  - `https://www.pokelore.net/` — 301 to `https://pokelore.net/`.
  - `https://pokelore.net/robots.txt` and `/sitemap.xml` — 200.

Blocked (not passed):

- `npm run build` reached static rendering but failed at
  `/rse-feebas-calculator` because Astro's prerender manifest tried to import
  a missing generated chunk:
  `dist/.prerender/chunks/rse-feebas-calculator_CL8FnL5I.mjs`.
- Consequently, `verify-all`, generated HTML checks, staging HTTP checks, and
  the browser regression test were not run against a valid release artifact.
- Staging was deliberately not updated with an unverified artifact.

Several old, long-running Node processes were present in the shared checkout
while the build ran. The missing-chunk behavior is consistent with concurrent
builds sharing `dist`; their ownership has not been established, so they were
not stopped.

## Production binding and cutover plan

1. Obtain owner approval for `wrangler.production.jsonc` and identify the
   current production origin and rollback command/version before binding.
2. Confirm `pokelore.net` is an active Cloudflare zone and bind the new Worker
   to the apex custom domain only after every staging gate passes.
3. Keep `www.pokelore.net` as a permanent 301 to `https://pokelore.net/$1`,
   preserving query strings. The current production response already does so;
   configure the equivalent Cloudflare redirect rule before replacing the
   origin. Do not bind `www` directly to the static Worker.
4. Confirm Cloudflare-managed TLS is active for both hosts and that DNS is
   proxied as required by the custom-domain binding.
5. Preserve Worker static assets, `html_handling: "drop-trailing-slash"`, and
   `not_found_handling: "none"`. This keeps legacy redirects in `_redirects`
   and intentional unknown routes as 404s; no SPA fallback is introduced.
6. Deploy only after an owner-recorded rollback target exists. Roll back by
   restoring the recorded current production deployment/origin binding, not by
   changing the static site to emulate it.

## Analytics and Search Console

The production GA measurement ID observed from the current site is
`G-K4YZXKJHVJ`. The Astro production build emits it only when
`POKELORE_DEPLOY_ENV=production`; staging emits no GA script. The current site
is multi-page/static, so each document load has one page-view configuration;
there is no client-side router to add duplicate navigation tracking to.

Before cutover, the owner must confirm the Search Console property that owns
`pokelore.net` (domain/DNS verification or provide the required verification
token) and submit or retain discovery of `https://pokelore.net/sitemap.xml`.

## Exact remaining steps

1. Identify or stop the other build processes, or run the build in an isolated
   output directory/worktree; then rerun `npm run build` to completion.
2. Run `npm run build:production` to verify the production artifact has no
   blanket robots header and has exactly one GA configuration.
3. Start a local or protected staging Worker from each completed artifact and
   run `scripts/test-cloudflare-http.mjs` with the appropriate environment.
4. Run `npm run verify:single-type-browser -- <origin>` on protected staging
   (or an equivalent local Worker), including direct parameterized navigation
   and refresh.
5. Deploy the verified staging artifact only, recheck its actual headers and
   browser console, and record the results.
6. Obtain owner confirmation of Search Console ownership, Cloudflare zone/DNS,
   TLS, the `www` redirect rule, and a current-production rollback target.
7. Request separate explicit authorization before any production deployment or
   domain binding.
