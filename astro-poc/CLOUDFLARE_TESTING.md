# Cloudflare Workers Static Assets acceptance

This is the current hosting contract for the Astro POC. RENDER_TESTING.md is historical only. No production React files, production hosting, page designs or Pokémon content were changed. Only four Pokémon pages are generated. This task did not deploy the new configuration.

## Architecture and output

The existing deployment is an assets-only Cloudflare Worker named `pokelore-astro-test`, at https://pokelore-astro-test.thebeakeh.workers.dev/. It has no Worker JavaScript entry point, SSR adapter or SPA fallback.

`wrangler.jsonc` now uses:

```json
{
  "name": "pokelore-astro-test",
  "compatibility_date": "2026-09-23",
  "assets": {
    "directory": "./dist",
    "html_handling": "drop-trailing-slash",
    "not_found_handling": "404-page"
  }
}
```

Cloudflare documents that `drop-trailing-slash` serves `/file.html` at `/file`. Its automatic alias redirects use 307; the generated `_redirects` file supplies explicit 301 rules for the Pokémon slash and `.html` forms. Redirects take precedence even when an asset exists. Sources: [HTML handling](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/), [redirect behavior and limits](https://developers.cloudflare.com/workers/static-assets/redirects/), [custom 404s](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/).

The Render-only normalizer and its tests were removed. Build pipeline:

```text
registry → public/_redirects → astro build → verify-build.mjs
```

Final files include:

```text
dist/index.html
dist/404.html
dist/pokemon/kakuna.html
dist/pokemon/pikachu.html
dist/pokemon/charizard.html
dist/pokemon/raichu-alola.html
dist/_redirects
dist/_headers
dist/_astro/*
dist/images/*
dist/data/search.json
```

No extensionless physical page copies, numeric documents or other Pokémon pages are generated. Native `.html` files restore automatic HTML MIME handling; the manual Content-Type override and `/ → /index.html` rewrite were removed. Canonicals remain HTTPS production URLs with no slash or `.html` suffix on Pokémon pages.

## Generated redirects

`node scripts/generate-redirects.mjs` reads the authoritative parent `public/data/pokemonRoutes.json`, checks both byId and byName and writes `astro-poc/public/_redirects`. Astro copies that to `astro-poc/dist/_redirects`. The generated source is checked in for review, but is regenerated on every build and must not be hand-maintained.

Exact count: **1,350 static numeric redirects**, plus **2 dynamic normalization rules**, **1,352 total**. Cloudflare allows 2,000 static plus 100 dynamic rules. The build intentionally fails at 2,000 static rules to enforce remaining strictly below that requested threshold. Static numeric rules precede the dynamic rules.

Examples:

```text
/pokemon/1 /pokemon/bulbasaur 301
/pokemon/14 /pokemon/kakuna 301
/pokemon/25 /pokemon/pikachu 301
/pokemon/10100 /pokemon/raichu-alola 301
/pokemon/10325 /pokemon/baxcalibur-mega 301
/pokemon/:slug/ /pokemon/:slug 301
/pokemon/:slug.html /pokemon/:slug 301
```

Validation rejects duplicate byId keys before JSON parsing can overwrite them, invalid/zero/padded numeric IDs, numeric or unsafe destinations, conflicting reverse mappings, empty registries and limit overflow. No numeric redirect targets itself. Form IDs preserve the source mapping.

`/pokemon/14/` takes two 301 hops through `/pokemon/14` to Kakuna. `/pokemon/14.html` similarly normalizes then follows its numeric rule. Canonical slug requests do not redirect. Unrecognized slash/HTML aliases may normalize once before their canonical-looking target returns 404.

## Staging headers and links

`public/_headers` retains only:

```text
/*
  X-Robots-Tag: noindex
```

This is **staging-only** and is labeled in the file. Before any future production-domain deployment, remove this rule from the production artifact and update the verifier's staging-header expectation. Do not deploy this staging artifact unchanged to pokelore.net. Source-page robots metadata and production canonicals remain unchanged; no permanent noindex is embedded in the Pokémon HTML. Cloudflare [header documentation](https://developers.cloudflare.com/workers/static-assets/headers/).

All Pokémon-to-Pokémon links are relative canonical slug paths, including `/pokemon/weedle` and `/pokemon/beedrill`. No staging hostname is embedded. Moves, abilities, items, locations and other unmigrated route families continue to the production origin during the POC.

Only four Pokémon exist locally: valid-but-unmigrated Pokémon links therefore intentionally return 404 on staging. Likewise `/pokemon/10325` redirects correctly to `/pokemon/baxcalibur-mega`, which returns 404 until that page is migrated. Complete redirect coverage is not complete page coverage.

## Verification performed

- `npm run build`: passed; generator, normal Astro file output and expanded static verification.
- `node --test scripts/generate-redirects.test.mjs`: five tests passed, including duplicate/conflicting mapping rejection and budget boundary.
- `node scripts/check-verifier.mjs`: five negative checks passed (canonical, analysis, H1, noindex regression and unwanted extensionless file).
- `node scripts/test-cloudflare-http.mjs`: passed against Wrangler 4.137.0 locally, with HEAD and GET requests for **all 1,350 numeric rules**, all four canonical/slash/HTML routes, two-hop numeric slash, invalid routes, high form mapping, CSS/image/JSON MIME and noindex headers.
- Wrangler parsed **1,352 valid redirect rules and one header rule** with no custom Worker runtime.
- The four pages retain verified source content, structured data, metadata, asset references and scoped islands. Only Pokémon link destinations changed as requested.

Local HTTP results are written to ignored `evidence/cloudflare/http-results.json`. These prove behavior in Cloudflare's local runtime, not deployment of these changes.

Live baseline checked before redeployment:

| Request | Existing live response | New local result |
|---|---|---|
| `/` | 200, HTML, noindex | 200, HTML, noindex |
| `/pokemon/kakuna` | 200, HTML, noindex | 200, HTML, noindex |
| `/pokemon/kakuna/` | 301 to Kakuna | 301 to Kakuna |
| `/pokemon/kakuna.html` | 404 | 301 to Kakuna |
| `/pokemon/14` | 301 to Kakuna | 301 to Kakuna |
| `/pokemon/10325` | 404 | 301 to `/pokemon/baxcalibur-mega` |
| Invalid Pokémon / random path | 404 | 404, custom body |

## Cloudflare build fields

Keep repository root as the root directory, branch `astro-migration`, and no production custom domain.

- Build: `cd astro-poc && npm ci && npm run build`
- Deploy: `cd astro-poc && npx wrangler deploy`
- Build variables: `NODE_VERSION=24.18.0`, `SKIP_DEPENDENCY_INSTALL=true`.

Wrangler 4.137.0 is pinned as a POC development dependency for reproducible local and CI checks. Keep dev dependencies installed. The deploy command above uses that pinned version. No dashboard redirect rules are necessary.

Local routing test, from `astro-poc`:

```sh
npx wrangler dev --local --port 8787
# In a second terminal:
node scripts/test-cloudflare-http.mjs
```

`npm run dev` remains the UI workflow; Astro dev/preview does not emulate Cloudflare's redirect rules. Use Wrangler for routing acceptance.

## Exact live checks after redeployment

Git Bash commands (use `curl.exe` in PowerShell). Inspect status and Location without following redirects first:

```sh
curl -I https://pokelore-astro-test.thebeakeh.workers.dev/pokemon/kakuna
curl -I https://pokelore-astro-test.thebeakeh.workers.dev/pokemon/kakuna/
curl -I https://pokelore-astro-test.thebeakeh.workers.dev/pokemon/kakuna.html
curl -I https://pokelore-astro-test.thebeakeh.workers.dev/pokemon/14
curl -I https://pokelore-astro-test.thebeakeh.workers.dev/pokemon/25
curl -I https://pokelore-astro-test.thebeakeh.workers.dev/pokemon/10100
curl -I https://pokelore-astro-test.thebeakeh.workers.dev/pokemon/10325
curl -I https://pokelore-astro-test.thebeakeh.workers.dev/pokemon/not-a-real-pokemon
curl -I https://pokelore-astro-test.thebeakeh.workers.dev/random-garbage-path
curl -I https://pokelore-astro-test.thebeakeh.workers.dev/pokemon/14/
curl -IL --max-redirs 5 https://pokelore-astro-test.thebeakeh.workers.dev/pokemon/14/
curl -sS -D - -o /dev/null https://pokelore-astro-test.thebeakeh.workers.dev/pokemon/kakuna
```

Expected: canonical 200; slash/HTML/numeric 301 with exact slug Location; unknown paths 404; correct text/html and noindex on page responses. Repeat for Pikachu, Charizard and Alolan Raichu. `/pokemon/10100` is a form redirect whose destination exists; `/pokemon/10325` tests the highest source ID whose destination intentionally does not yet exist.

To rerun the complete HEAD/GET matrix after redeploy, from `astro-poc`:

```sh
node scripts/test-cloudflare-http.mjs https://pokelore-astro-test.thebeakeh.workers.dev
```

Remaining acceptance gate: deploy these changes to staging and pass that live matrix. No local routing blocker was found. Existing large carousel payload and wider form/content auditing remain relevant before full-Pokédex work. No next phase was started.
