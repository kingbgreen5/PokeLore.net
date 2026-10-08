# Phase 11B — Production Cutover Readiness Audit

**Status: NOT READY TO AUTHORIZE PRODUCTION CUTOVER**

Audit date: 2026-10-08. This was an audit-only phase: no production Worker,
custom domain, DNS record, or production React/Vite deployment was changed.

## Proven architecture

- The migration is an Astro static build (`output: 'static'`) with `dist` as
  the Workers Static Assets directory.
- `wrangler.jsonc` names the staging Worker `pokelore-astro-test`, uses
  `html_handling: "drop-trailing-slash"`, and uses
  `not_found_handling: "none"`.
- There is no Worker `main`, SSR adapter, `run_worker_first`, or origin
  fallback. The built artifact contains static HTML plus `_redirects` and
  `_headers`; it is not an SPA fallback.
- `npm run build` generates the artifact and verifies it. The staging deploy
  command is `npx wrangler deploy --config wrangler.jsonc` (or `npm run deploy`
  for build plus deploy). The checked-in config is staging-only; it does not
  define a production Worker name, custom-domain route, or binding.
- The current latest staging deployment listed by Wrangler is
  `a6941727-48ea-40d4-8813-bdcb62874204` (created 2026-10-08 02:29 UTC).

Therefore, production cannot safely be deployed with the existing config: it
would deploy to the staging Worker, not to `pokelore.net`.

## Completed checks

- `npm run verify` passed against the current artifact. This covers the
  generated route universe, redirects, canonical output, metadata and
  JSON-LD for frozen catalogs, editorial routes, the Dynamax guide, and all
  seven public tools.
- The repository's live `test-cloudflare-http.mjs` staging suite passed. It
  verified all 1,350 numeric Pokémon redirects through both HEAD and GET,
  canonical pages, slash and `.html` normalization, invalid routes, MIME,
  assets, custom 404 behavior, and staging noindex.
- Representative staging pages across hubs, Pokémon forms, moves, abilities,
  items, locations, types, tools, and news returned their expected 200/301/404
  contracts. `/DexEntries` redirects 301 to `/dex-entries`; `/pokemon/25`
  redirects 301 to `/pokemon/pikachu`; `/learnsets`, `/dev/foo`, and arbitrary
  paths return true 404s. No SPA fallback was observed.
- The final `dist/sitemap.xml` has 5,648 URLs, zero duplicates, zero `.html`,
  numeric Pokémon, staging-host, `/learnsets`, or `/DexEntries` URLs, exactly
  one `/items/dynamax-crystals`, and 24 active topic URLs.
- Fresh browser checks verified team-selection state changes, a successful
  DPPt Feebas calculation, and functional DPPt hydration with no console
  warnings/errors. All public-tool routes load their expected Astro islands.
- No Google Analytics/GA4, Cloudflare Web Analytics beacon, Search Console
  meta verification, or other measurement/verification code was found in the
  Astro application. Analytics parity with the current production app is thus
  not established.

## Blocking findings

### 1. Production noindex is not safely separated from staging

`public/_headers` applies `X-Robots-Tag: noindex` to `/*`; it is copied into
`dist/_headers`, and staging visibly returns that header. The file itself says
it must be removed before a production-domain deployment. The build verifier
currently requires this staging rule, so the release needs an explicitly
tested production-header mode rather than a manual artifact edit.

More importantly, these public hub sources independently emit a `<meta
name="robots" content="noindex">`: `/moves`, `/abilities`, `/items`,
`/locations`, `/types`, and `/dex-entries`. Removing only `_headers` would
still instruct crawlers not to index these important production hubs. The
source locations are `src/pages/moves.astro`, `abilities.astro`,
`items.astro`, `locations.astro`, `types.astro`, and `dex-entries.astro`.

The only documents that should retain noindex after release are true 404s,
intentionally non-public/development pages, and the documented inactive
Dynamax Crystal item records.

### 2. Single Type Coverage has a real hydration mismatch

On a fresh staging load of `/single-type-coverage`, data ultimately loads and
15 recommendation cards render, but the browser logs React production error
`#418` during hydration. This is a hydration mismatch, even though the
client-side recovery succeeds. It must be reproduced locally, corrected, and
retested without that console error before release.

### 3. The production hostname plan is absent

The repo has no production Worker config, route/custom-domain binding, DNS
record declaration, or documented `www` behavior. A read-only Wrangler
deployment listing only identifies staging. The Cloudflare dashboard/account
must establish whether `pokelore.net` is on Cloudflare, how `www` behaves, and
which existing production deployment/domain binding is to be replaced. Until
that is written down and tested, DNS, HTTPS, root/www redirects, rollback, and
the exact production deploy command cannot be proven.

### 4. Analytics and Search Console parity are unproven

No analytics tag, Web Analytics beacon, or Search Console verification token
exists in the Astro source. This may be intentional, but it must be compared
with the live production implementation and documented before authorization.

## Required remediation and release gate

1. Add a deliberate, tested production configuration (separate config or
   environment-controlled build) with the production Worker/domain binding;
   leave the staging config and its noindex behavior unchanged.
2. Make indexability environment-aware. Production public hubs must render
   `index,follow,max-image-preview:large`; staging must continue to return
   `X-Robots-Tag: noindex`. Update the verifier so both contracts are tested.
3. Fix the Single Type Coverage hydration mismatch and run a fresh browser
   console audit for all seven tools, including data-loading interactions.
4. Confirm production analytics and Search Console verification requirements
   from the existing production deployment. Add only the required production
   configuration, then verify it without generating needless test events.
5. In Cloudflare, document the exact root-domain and `www` bindings, TLS
   behavior, and the currently active production deployment/version to retain
   for rollback.

## Cutover procedure after all blockers are closed

1. Freeze source changes and record the Git commit plus staging Worker version.
2. Run `npm run build`, `npm run verify`, and the full live staging HTTP suite.
3. Deploy the production-specific static artifact to the explicitly named
   production Worker; do not run the staging `wrangler.jsonc` command for this
   step.
4. Bind/route only `pokelore.net` according to the approved Cloudflare domain
   plan, preserving the confirmed `www` redirect policy and HTTPS.
5. Immediately verify root, representative public families, all seven tools,
   numeric redirects, `/DexEntries`, `.html` and slash normalization, real
   404s, canonical host, `robots.txt`, sitemap, key assets, and that the
   production `X-Robots-Tag` is absent from indexable documents.
6. Inspect browser console for every interactive tool and confirm analytics and
   Search Console verification behavior.
7. Submit/check the production sitemap in Search Console and monitor URL
   Inspection, Page Indexing, redirects, and crawl errors.

## Rollback procedure after authorization

1. Keep the former production deployment/version and hostname binding recorded
   before switching traffic.
2. If a release check fails, immediately restore the former deployment's
   production binding/traffic allocation in Cloudflare; do not attempt an
   in-place hot fix first.
3. Verify the former site on the production hostname, including a canonical
   route, legacy redirect, static asset, and 404.
4. Leave the failed Astro version on staging for diagnosis, with staging
   noindex intact; capture the failing URL, response headers, browser error,
   and deployment version.

## Final gate

The Astro artifact is static and staging routing is healthy, but the blockers
above mean this audit cannot truthfully issue **PHASE 11B READY — SAFE TO
AUTHORIZE PRODUCTION CUTOVER** yet.
