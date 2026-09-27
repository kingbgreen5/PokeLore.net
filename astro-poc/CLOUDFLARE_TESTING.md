# Cloudflare staging contract

The Astro catalog is hosted as Workers Static Assets at [pokelore-astro-test.thebeakeh.workers.dev](https://pokelore-astro-test.thebeakeh.workers.dev). It has no Worker entry point, SSR adapter, SPA fallback, production custom domain, or DNS change. `public/_headers` applies `X-Robots-Tag: noindex` to staging.

The deployed Phase 3B version is `8a18fb4e-16be-42d0-9f2e-c55bc0381b1c`.

## Build and deploy

From `astro-poc`:

```sh
npm run build
npx wrangler deploy --config wrangler.jsonc
```

The first command generates and verifies the exact `dist` artifact. The second deploys that artifact without rebuilding it. `npm run deploy` combines both commands when a fresh build is desired.

Wrangler uses `drop-trailing-slash` and `404-page`. The generated `_redirects` contains 1,350 exact numeric 301 rules and two dynamic normalization rules. `_headers` contains the single staging noindex rule.

## Local Cloudflare routing acceptance

Astro preview proves pages, but Wrangler proves `_redirects`, `_headers`, HTML handling, and custom 404 behavior:

```sh
npx wrangler dev --local --port 8787 --config wrangler.jsonc
# In another terminal:
node scripts/test-cloudflare-http.mjs http://127.0.0.1:8787
```

## Live acceptance

```sh
node scripts/test-cloudflare-http.mjs https://pokelore-astro-test.thebeakeh.workers.dev
```

This checks HEAD and GET for every numeric redirect, representative canonical/slash/optional HTML routes, a two-hop numeric slash, invalid paths, canonical metadata, MIME types, local assets, and noindex headers.

Representative manual commands:

```sh
curl -I https://pokelore-astro-test.thebeakeh.workers.dev/pokemon/kakuna
curl -I https://pokelore-astro-test.thebeakeh.workers.dev/pokemon/charizard-mega-x
curl -I https://pokelore-astro-test.thebeakeh.workers.dev/pokemon/palafin-hero
curl -I https://pokelore-astro-test.thebeakeh.workers.dev/pokemon/frillish-female
curl -I https://pokelore-astro-test.thebeakeh.workers.dev/pokemon/10325
curl -IL --max-redirs 5 https://pokelore-astro-test.thebeakeh.workers.dev/pokemon/14/
curl -I https://pokelore-astro-test.thebeakeh.workers.dev/pokemon/definitely-not-a-pokemon
curl -I https://pokelore-astro-test.thebeakeh.workers.dev/random-garbage-path
```

Expected results: canonical routes return 200; canonical trailing slashes and numeric legacy routes return 301 to their canonical paths; unknown paths return the custom 404; HTML responses carry staging noindex.

The physical artifact has 6,784 files and its largest HTML document is 1.95 MB. Cloudflare currently allows 20,000 static files per Worker version on Free (100,000 paid), 25 MiB per file, 2,000 static redirects, and 100 dynamic redirects. See [Workers limits](https://developers.cloudflare.com/workers/platform/limits/).
