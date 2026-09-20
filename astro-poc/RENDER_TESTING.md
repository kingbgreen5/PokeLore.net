# Separate Render staging test

Do not change the production service, its domains, Blueprint, redirects, or headers. The Phase 1 test service already exists; this Phase 1B work has not been deployed. Reuse the separate test service when deployment is authorized. HTTP results below are acceptance targets, not claimed observations.

## Create the service manually

1. Commit/push the POC on **astro-migration** when ready. In Render choose **New → Static Site**, connect this repository, and select branch **astro-migration**. Do not create a service from the production Blueprint.
2. Use a separate name such as `pokelore-astro-test`. Attach **no custom domain**; use its assigned `*.onrender.com` address.
3. Leave **Root Directory empty** (repository root). The build needs parent `src/` and `public/data/`; selecting `astro-poc` as a restricted monorepo root can exclude them.
4. Build command: `cd astro-poc && npm ci && npm run build && npm run verify`
5. Publish directory: **astro-poc/dist** (relative to repository root).
6. Set environment **NODE_VERSION=24.18.0** (the locally tested version) and **SKIP_INSTALL_DEPS=true**. The latter prevents automatic installation of the root production package; the build command explicitly installs the POC. No application secrets or other environment variables are required. Do not omit dev dependencies: the verifier uses linkedom.
7. Add this HTTP response header in the **test service only**, then verify it before sharing the URL:

| Path | Header | Value |
|---|---|---|
| `/*` | `X-Robots-Tag` | `noindex` |

Canonical documents intentionally retain indexable robots metadata and canonical origin `https://pokelore.net`. Staging indexing protection is the HTTP header, not client JavaScript.

Render documents manual dependency installation and service-specific headers in its [Static Sites guide](https://render.com/docs/static-sites).

## Redirect rules

Add these rules in the test site's Redirects/Rewrites dashboard, in this order. Each action is **Redirect** (Render's permanent HTTP 301 action).

| Source | Destination | Action |
|---|---|---|
| `/pokemon/14` | `/pokemon/kakuna` | Redirect |
| `/pokemon/25` | `/pokemon/pikachu` | Redirect |
| `/pokemon/6` | `/pokemon/charizard` | Redirect |
| `/pokemon/10100` | `/pokemon/raichu-alola` | Redirect |
| `/pokemon/:slug/` | `/pokemon/:slug` | Redirect |

All four numeric pairs are checked against both directions of `public/data/pokemonRoutes.json` by `npm run verify`. No numeric resource, meta-refresh shell, or Astro redirect page is generated. Numeric URLs with a slash may take two redirects; the requested non-slash aliases should take one.

The placeholder rule is the recommended trailing-slash experiment: it preserves one Pokémon path component. Render supports placeholders, but existing-resource precedence may affect matching. Its [redirect documentation](https://render.com/docs/redirects-rewrites) says existing resources are served before dashboard rules. Consequently this rule's actual status and location must be verified on staging.

**Never add `/* → /index.html` or `/pokemon/* → /index.html`.** No SPA fallback is required. Do not add a catch-all rewrite to `404.html` either: that could turn missing resources into successful responses. Render should serve the root `404.html` for missing resources with status 404; verify both the status and body.

## Output and URL resolution

Astro is configured with `output: 'static'`, `trailingSlash: 'never'`, `build.format: 'file'`, and `site: 'https://pokelore.net'`. The [Astro configuration reference](https://docs.astro.build/en/reference/configuration-reference/#buildformat) describes file output. These settings produce:

```text
astro-poc/dist/
  index.html
  404.html
  pokemon/kakuna.html
  pokemon/pikachu.html
  pokemon/charizard.html
  pokemon/raichu-alola.html
  _astro/* (CSS, island JavaScript and bundled assets)
  images/pokemon/official/{card,detail,full}/* (selected existing artwork)
  images/etsy/* (selected promo)
  data/search.json
```

There are no extensionless output copies or `pokemon/<slug>/index.html` files. Canonicals and navigational links have neither `.html` nor trailing slash. Astro's file layout does not itself dictate Render's HTTP behavior.

First test whether Render resolves `/pokemon/kakuna` to `pokemon/kakuna.html` automatically. **This is an expectation to test, not a deployment guarantee.** If it does not, add these four explicit **Rewrite** rules after the redirects, and retest:

| Source | Destination |
|---|---|
| `/pokemon/kakuna` | `/pokemon/kakuna.html` |
| `/pokemon/pikachu` | `/pokemon/pikachu.html` |
| `/pokemon/charizard` | `/pokemon/charizard.html` |
| `/pokemon/raichu-alola` | `/pokemon/raichu-alola.html` |

These serve each real document at its canonical URL and preserve missing-path 404s. No normalization script is currently justified. If neither native resolution nor these exact rewrites preserves the acceptance targets, stop the rollout and record the HTTP evidence before considering a POC-only normalizer.

Expected MIME types: HTML documents `text/html` (optional charset), CSS `text/css`, JavaScript `text/javascript` or `application/javascript`, search data `application/json`, artwork `image/webp`. Standard extension-based files should need no MIME override. Do not apply `Content-Type: text/html` to `/*`; that would break CSS/images. If a future experiment creates extensionless files, its MIME behavior needs a separate decision.

## HTTP tests (do not follow redirects initially)

Use the actual assigned hostname in place of the placeholder. On Windows use `curl.exe` if `curl` aliases PowerShell's web cmdlet. These commands intentionally omit `-L`:

```sh
curl -I https://POKELORE-ASTRO-TEST.onrender.com/
curl -I https://POKELORE-ASTRO-TEST.onrender.com/pokemon/kakuna
curl -I https://POKELORE-ASTRO-TEST.onrender.com/pokemon/kakuna/
curl -I https://POKELORE-ASTRO-TEST.onrender.com/pokemon/14
curl -I https://POKELORE-ASTRO-TEST.onrender.com/pokemon/pikachu
curl -I https://POKELORE-ASTRO-TEST.onrender.com/pokemon/25
curl -I https://POKELORE-ASTRO-TEST.onrender.com/pokemon/charizard
curl -I https://POKELORE-ASTRO-TEST.onrender.com/pokemon/6
curl -I https://POKELORE-ASTRO-TEST.onrender.com/pokemon/raichu-alola
curl -I https://POKELORE-ASTRO-TEST.onrender.com/pokemon/10100
curl -I https://POKELORE-ASTRO-TEST.onrender.com/pokemon/not-a-real-pokemon
curl -I https://POKELORE-ASTRO-TEST.onrender.com/random-garbage-path
curl -I https://POKELORE-ASTRO-TEST.onrender.com/pokemon/kakuna.html
curl -I https://POKELORE-ASTRO-TEST.onrender.com/pokemon/kakuna/index.html
curl -I https://POKELORE-ASTRO-TEST.onrender.com/404.html
curl -I https://POKELORE-ASTRO-TEST.onrender.com/images/pokemon/official/detail/14.webp
```

Also inspect real GET responses, because HEAD alone cannot confirm the document:

```sh
curl -sS -D kakuna.headers -o kakuna.html https://POKELORE-ASTRO-TEST.onrender.com/pokemon/kakuna
curl -sS -D invalid.headers -o invalid.html https://POKELORE-ASTRO-TEST.onrender.com/pokemon/not-a-real-pokemon
curl -sS -D random.headers -o random.html https://POKELORE-ASTRO-TEST.onrender.com/random-garbage-path
```

Confirm Kakuna's title, one production-origin canonical, JSON-LD and complete body in View Source; disable JavaScript and verify content and artwork. Inspect the actual `_astro/*.css` URL from that HTML and request it with `curl -I`. After recording original redirects, use `curl -IL --max-redirs 5 URL` to check the chain has no loop and ends at the intended slug.

| Request | Required result | Observed on Render |
|---|---|---|
| Each canonical slug | 200, correct document, text/html, X-Robots-Tag: noindex | Pending deployment |
| `/pokemon/kakuna/` | 301, Location `/pokemon/kakuna` (absolute equivalent allowed) | Pending |
| Numeric aliases | 301 to corresponding slug | Pending |
| Invalid Pokémon / random path | 404, custom not-found body, no homepage | Pending |
| `/pokemon/kakuna.html` | Record actual status/location/body; do not assume | Pending |
| `/pokemon/kakuna/index.html` | Record actual status/location/body; do not assume | Pending |
| CSS / JS / search JSON / images | 200, correct MIME, noindex header | Pending |

Do not try to hide `.html` aliases with redirects before observing default behavior; existing-resource precedence may make such rules ineffective. Alias behavior, slash normalization, custom 404 handling, MIME and noindex coverage remain release gates. Local Astro preview is not an emulator of Render.
