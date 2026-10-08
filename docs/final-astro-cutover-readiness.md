# Final Astro Production Cutover Readiness

Audit date: 2026-10-08 (America/Chicago). **No production deployment, DNS change, nameserver change, custom-domain binding, Render change, or Search Console change was made.**

## Decision

**FINAL ASTRO CUTOVER BLOCKED.** The source is substantially ready, but two release gates are not yet evidenced: (1) the currently deployed staging Single Type Coverage island overwrites direct URL state after hydration, and (2) this background environment cannot complete the production build because of the known Astro filesystem-access failure. The next staging deployment must contain the source correction below and pass all checks before a production authorization can be requested.

## 1. Staging version tested

- Local branch/HEAD: `astro-migration` / `e07c28dcb0412885ac9b24db21fb9ae07292f96c` (`unknown stuff`, 2026-10-08 15:10:34 -05:00).
- Staging Worker: `https://pokelore-astro-test.thebeakeh.workers.dev/`.
- Current 100% Worker deployment returned by `wrangler deployments list`: version `96da8d16-08c1-4bb9-a1eb-01eb52098b42`, created `2026-10-08T20:18:19.690Z` (15:18:19 -05:00). Wrangler records the source as `Unknown (deployment)`, so it does **not** prove a Git commit. The deployment is later than local HEAD by about eight minutes, but commit/artifact equivalence remains unproven until a build embeds or publishes an explicit release identifier.
- Live responses tested on 2026-10-08 returned `200` and `X-Robots-Tag: noindex` for `/`, `/pokemon/pikachu`, `/single-type-coverage?version=scarlet-violet&type=water`, `/robots.txt`, and `/sitemap.xml`.

## 2. Staging browser sweep

Real browser checks on the Worker found visible, substantive content and no console errors for all requested representative routes:

`/`, `/pokemon/pikachu`, `/pokemon/raichu-alola`, `/moves`, `/move/thunderbolt`, `/abilities`, `/ability/levitate`, `/items`, `/item/potion`, `/items/dynamax-crystals`, `/item/dynamax-crystal-and15`, `/locations`, `/location/pokeathlon-dome`, `/types`, `/dex-entries`, `/tools`, `/topics`, `/topic/pokemon-winds-and-waves-everything-we-know`, `/topic/catching-feebas-every-generation`, and `/news`.

This establishes core rendering and representative internal route usability. It is not a substitute for the critical-tool interaction gate below. Lazy images outside the viewport were not treated as broken; visible images loaded and browser console errors were zero.

## 3. Single Type Coverage hard gate

The basic parameterized URL works for the default query:

`/single-type-coverage?version=scarlet-violet&type=water` rendered Scarlet/Violet, Water, results, and no console errors. In-page game and type changes updated the query string and recomputed results.

**Failure:** a fresh direct browser load of `?version=sword-shield&type=fire` visibly reset controls and URL to `?version=scarlet-violet&type=water`. The same happened during refresh testing. Browser history reflects the overwritten state, so the parameterized-refresh gate fails.

Root cause: the static page supplies an empty island query prop. On hydration, the URL-reading effect and the URL-normalizing effect both ran; the normalizer first replaced the direct URL using static defaults. Source correction in `astro-poc/src/islands/SingleTypeCoverageTool.jsx` now waits for the browser URL adoption effect before normalizing. It is not yet built/deployed/retested.

Required proof after build/staging deploy:

```powershell
cd astro-poc
npm run verify:single-type-browser -- https://pokelore-astro-test.thebeakeh.workers.dev
```

Pass only when direct `version=red-blue&type=fire`, hard refresh, version/type changes, and browser back/forward preserve URL/state and browser console errors are empty.

## 4. Critical tools

All seven public tool routes are present in the frozen Astro route universe. Full production-browser interaction proof remains pending a valid build and staging deployment:

- `/dppt-feebas-calculator`
- `/rse-feebas-calculator`
- `/team-coverage`
- `/tcg-challenge`
- `/ev-training-routes`
- `/single-type-coverage` (currently blocked as above)

Do not change tool business logic without a demonstrated regression. For each, record initial UI, one meaningful interaction, `/data/*` requests, refresh/query/local-storage behavior where applicable, missing asset errors, and console exceptions.

## 5. Production build and verifier

`npm run build:production` was attempted without deployment. It failed before Astro build/verifier completion with the known background-environment problem:

`Cannot read directory "../../..": Access is denied.`

The failure subsequently prevented resolving generated editorial fragments and React dependencies. Per the migration instruction, no architectural workaround was made; the foreground user build is authoritative. Therefore the production artifact, full verifier, production sitemap generation, and generated asset checks are **not passed in this environment**.

The production command is `npm run build:production`, which sets `POKELORE_DEPLOY_ENV=production` and runs `verify-all.mjs production`. Do not deploy as part of that test.

## 6. Noindex audit

Staging and production are deliberately separated by `astro-poc/scripts/deployment.mjs`:

| Scope | Generated `dist/_headers` | Analytics |
| --- | --- | --- |
| staging | `/*` => `X-Robots-Tag: noindex` | suppressed |
| production | comment only; no `X-Robots-Tag` directive | GA4 enabled |

The staging header was live-verified. The production absence is source-configured but unverified because the production build failed. Public route metadata is intended to be indexable. Expected intentional page-level noindex is limited to real 404 and private/development pages (including `/dev/*`); inactive content must remain absent from routes/sitemap. **No site-wide production noindex is allowed.**

## 7. Analytics

Production build code injects `G-K4YZXKJHVJ` only when `PUBLIC_GA_MEASUREMENT_ID` is set by the production build wrapper. `Analytics.astro` creates one Google tag script and one `gtag('config', measurementId)` after 4.5 seconds/idle; staging passes an empty ID and injects none. Existing live React production was previously observed with the same ID.

This source design is correct, but exact-once production-output proof is pending a successful production build. Do not generate unnecessary production events while testing.

## 8. Canonicals, sitemap, robots, redirects, 404s, and assets

`astro.config.mjs` fixes `site` to `https://pokelore.net`, uses `trailingSlash: 'never'`, and emits static output. Existing verifier rules require canonical host `https://pokelore.net`, no `.html`, no numeric Pokémon canonical, no staging/Render/localhost references, and exactly one canonical per public page.

The prior verified artifact reported:

- sitemap URLs: `5,648`
- missing HTML targets: `0`
- duplicates: `0`
- malformed entries: `0`
- no `/learnsets`, `/DexEntries`, `.html`, numeric Pokémon, dev-only, staging-host, or inactive-topic URLs.
- numeric Pokémon redirects: `1,350` exact 301 mappings; generated `_redirects` is independently validated by `verify-build.mjs`.
- `/DexEntries` => `/dex-entries` is a 301; Cloudflare static assets use `drop-trailing-slash` and `not_found_handling: "none"` (no SPA fallback).

These are prior-artifact results, not a fresh production-mode result in this environment. Fresh acceptance must test all numeric redirects, `.html` and trailing slash normalization, redirect chain/loop count, arbitrary invalid routes, invalid entity/topic/news paths, `/learnsets`, `/dev/*`, and `/og-preview/*` as true 404s. The `_headers` policy must be rechecked alongside `/robots.txt` and `/sitemap.xml`.

Static-assets gate: crawl generated production output or the freshly deployed staging candidate for CSS, JS, images/sprites/artwork/editorial images, `/data/*`, Team Coverage JSON, TCG data/artwork, both Feebas map assets, and Dynamax assets. Fail for any 404, invalid MIME, stale Render/localhost/staging references, or broken relative path.

## 9. Search Console and current DNS

Public DNS is currently Namecheap BasicDNS, not Cloudflare authoritative DNS:

| Record | Exact observed value | TTL |
| --- | --- | --- |
| NS | `dns1.registrar-servers.com`, `dns2.registrar-servers.com` | 1800 |
| apex CNAME | `pokelore.net` => `pokelore-net.onrender.com` | ~1674 at query |
| `www` CNAME | `www.pokelore.net` => `pokelore-net.onrender.com` | ~1673 at query |
| apex TXT | `google-site-verification=fiowfuY0gfgPX8LfcpqA2qQc81_TQk_GbzttS9R1guQ` | ~1799 |
| apex TXT | `fiowfuY0gfgPX8LfcpqA2qQc81_TQk_GbzttS9R1guQ` | ~1799 |
| apex TXT | `v=spf1 include:spf.efwd.registrar-servers.com ~all` | ~1799 |
| MX | `eforward1..5.registrar-servers.com` (preferences 10,10,10,15,20) | 1800 |

The visible DNS verification TXT is strong owner evidence for DNS-based Search Console verification, but account ownership cannot be confirmed without the owner’s Search Console access. Preserve all three TXT records, especially the exact `google-site-verification` record, and all five MX records during a nameserver migration.

## 10. Cloudflare custom domain and www plan

Cloudflare Workers Custom Domains require an active Cloudflare zone and do not allow a hostname already holding a CNAME. Because this apex is presently Namecheap BasicDNS, a normal Workers Custom Domain cutover requires adding `pokelore.net` as a Cloudflare zone and changing Namecheap nameservers to the two Cloudflare-assigned nameservers. (Partial/CNAME setup is not a documented general apex solution; do not guess it.)

After the zone is active, remove the conflicting apex Render CNAME only as part of cutover, then deploy/bind the static production Worker using `wrangler.production.jsonc` with:

```json
"routes": [{ "pattern": "pokelore.net", "custom_domain": true }]
```

Cloudflare creates the DNS record and certificate for a Worker Custom Domain. Bind the apex only. For approved policy `www.pokelore.net/*` => `https://pokelore.net/*`, create a proxied placeholder DNS A record (`www`, `192.0.2.1`) and a Cloudflare Bulk Redirect rule/list: source `www.pokelore.net`, target `https://pokelore.net`, status `301`, **preserve query string**, **subpath matching**, and **preserve path suffix**. Do not bind `www` to the static Worker.

## 11. Rollback target and exact DNS rollback

Primary rollback remains the untouched Render static service:

- service name: `pokelore-net`
- origin: `https://pokelore-net.onrender.com`
- branch: `master`
- known-good commit: `330e2b9c060acdbb88ecc74e7583b4ff3ebe323d`
- Astro fallback reference: `astro-migration` / `b1d15f526e78ff99bfde83a5c9a5f63e35776bae` (`fix4`), not the disaster rollback.

Never delete, disable, rebranch, or alter the Render service/commit during cutover.

If reverting from a Cloudflare nameserver cutover:

1. In Namecheap, change nameservers back to `dns1.registrar-servers.com` and `dns2.registrar-servers.com`.
2. In Namecheap BasicDNS, restore apex CNAME `@` => `pokelore-net.onrender.com` and `www` CNAME => `pokelore-net.onrender.com` (current TTLs: apex observed 300 before CNAME chase; www 1800; retain intended current TTLs or 1800 where dashboard requires one).
3. Restore/preserve exact Google verification TXT, token-only TXT, SPF TXT, and all five eforward MX records above.
4. Wait through DNS propagation (current observed maximum 30 minutes; allow resolver/cache variation), then verify `https://pokelore.net/` reaches Render over valid HTTPS.
5. Verify homepage, `/pokemon/pikachu`, major tools, sitemap, robots, and representative assets before declaring rollback complete.

## 12. Ordered production procedure (do not execute without authorization)

1. Freeze and record exact `astro-migration` commit, source diff, Worker deployment ID, and a content/hash release identifier.
2. In the foreground environment, run `cd astro-poc; npm run build:production`; require success.
3. Run `npm run verify:production`; inspect generated production `_headers`, canonicals, one GA config, robots, sitemap, redirects, and asset crawl.
4. Deploy only the verified artifact to the separate Worker: `npx wrangler deploy --config wrangler.production.jsonc`; do not bind a domain until the owner authorizes cutover.
5. Verify its Worker URL before domain binding using the full browser and HTTP suites.
6. Add/verify the Cloudflare zone. Copy every current DNS record, including Search Console TXT, SPF, and MX records; verify mail forwarding records before nameserver change.
7. Change Namecheap nameservers to the Cloudflare-assigned pair; wait until zone is active.
8. Remove the conflicting Render apex CNAME in the Cloudflare zone, bind `pokelore.net` with the production Worker configuration, and wait for TLS active.
9. Create proxied `www` placeholder plus the 301 Bulk Redirect rule specified above.
10. Verify TLS, absence of production `X-Robots-Tag`, homepage, redirects, tools, sitemap/robots, analytics, canonicals, and assets.
11. Monitor Cloudflare errors, browser console/error monitoring, Search Console indexing/coverage, redirects, and GA realtime health. Roll back immediately if any trigger below occurs.

## 13. Rollback triggers

Rollback to Render immediately for a site-wide noindex, homepage outage, widespread 404s, broad numeric redirect failure, major static asset outage, unusable Team Coverage/DPPt Feebas/Single Type Coverage, widespread runtime errors, site-wide wrong canonical host, invalid sitemap, TLS failure, redirect loop, or `www` duplication/incorrect redirect that risks indexing.

## Remaining blockers

1. Build/deploy/retest the corrected Single Type Coverage URL-state source on staging.
2. Successful foreground `build:production` plus full production verifier and artifact crawl.
3. Full real-browser interaction sweep for all seven tools on that exact artifact.
4. Owner confirmation of Search Console property access; DNS record preservation is evidenced, ownership is not.
5. Owner must add/activate Cloudflare zone and confirm its assigned nameservers; the exact two values are account-generated and unavailable until then.
6. Before cutover, record a release-to-Worker-version mapping; Wrangler currently returns `Unknown (deployment)` source metadata.

## 2026-10-08 staging remediation addendum

- The authoritative foreground `npm run build:production` passed: 5,652 pages, all 1,350 numeric redirects, production header policy, full catalog, editorial, Dynamax, tools, Move, and Ability suites. The redirect artifact SHA-256 is `bbf4de6a80debeb9fcdcd0ce4173123c2452814c65895f4cc9f4bcaa628a4ef4`.
- Exact source baseline is `astro-migration` commit `e07c28dcb0412885ac9b24db21fb9ae07292f96c`. The staging artifact also includes the recorded uncommitted, reviewed fixes to `scripts/deployment.mjs` and `src/islands/SingleTypeCoverageTool.jsx`; its app/redirect files are the foreground-verified production artifact, with only `_headers` regenerated for staging.
- Protected staging Worker deployment: `9d12e273-6830-4e1d-87ac-c5594bc0c5af`, deployed 2026-10-08 21:38:59 UTC. `wrangler deployments list` confirms it receives 100% traffic. Cloudflare labels its source `Unknown (deployment)`, so the explicit mapping evidence is the Git baseline, the two-file diff, the deployment command/log, redirect hash, and staging header hash rather than Cloudflare-native Git metadata.
- Staging `/` returned `200` with `X-Robots-Tag: noindex` after this deployment.
- `npm run verify:single-type-browser -- https://pokelore-astro-test.thebeakeh.workers.dev` passed. Manual browser testing also passed direct `red-blue/fire` load, hard refresh, game/type changes, back/forward, results, and zero console errors.
- Meaningful browser interactions passed with no console errors for DPPt Feebas (lottery calculation), RSE Feebas (game selector), Team Coverage (version selector), TCG Challenge (Start Challenge), EV Training Routes (stat filter), and Single Type Coverage. The initial core-page browser sweep had already passed.

Production is still not authorized: DNS/zone/TLS/www/Search Console owner gates and the remaining full production artifact audits must be completed first. No production or DNS action was taken.
