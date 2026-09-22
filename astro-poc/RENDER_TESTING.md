# Render staging: extensionless-output acceptance test

Scope: `https://pokelore-net-astro-test.onrender.com` only. Production source, Render configuration, finalizers and domains are unchanged. This task prepares local output; it does not deploy, configure the dashboard or begin the full migration.

## First live test — reported by the user

| Request | Reported status | Assessment |
|---|---|---|
| `/pokemon/kakuna` | 200 | Correct |
| `/pokemon/kakuna/` | 200 | Needs normalization |
| `/pokemon/14` | 404 | Numeric redirect not configured/proven |
| `/pokemon/not-a-real-pokemon` | 404 | Correct |
| `/random-garbage-path` | 404 | Correct |
| `/pokemon/kakuna.html` | 200 | Undesired alias |
| Staging `X-Robots-Tag: noindex` | Working | Retain |

These are the supplied live observations, not a newly performed crawl. The second test below remains pending deployment.

Render [serves existing resources before redirect/rewrite rules](https://render.com/docs/redirects-rewrites). The working hypothesis is that replacing the physical `.html` resources with extensionless files will let the slash redirect run. This is an experiment: only the next live HTTP test can confirm Render's slash and alias resolution.

## Build and final output

Keep the existing separate static site on `astro-migration`, with no custom domain:

- Root Directory: empty (repository root; the POC reads parent source/data).
- Build command: `cd astro-poc && npm ci && npm run build`
- Publish directory: `astro-poc/dist`
- Environment: `NODE_VERSION=24.18.0`, `SKIP_INSTALL_DEPS=true`.
- Do not omit dev dependencies; linkedom is used by normalization and verification.

`npm run build` now runs `astro build` → `scripts/normalize-output.mjs` → `npm run verify`. The existing longer command ending with `&& npm run verify` also works but verifies twice. No production finalizer is reused.

```text
astro-poc/dist/
  index.html
  404.html
  pokemon/
    kakuna
    pikachu
    charizard
    raichu-alola
  _astro/*                   CSS, JavaScript and bundled assets
  images/pokemon/official/*  selected existing artwork
  images/etsy/*              selected promo
  data/search.json
```

No `pokemon/<slug>.html`, `pokemon/<slug>/index.html`, numeric document or meta-refresh shell is generated.

The generic normalizer scans `.html` files but only renames a file when its single HTTPS PokéLore canonical exactly matches its own extensionless path. `index.html` and `404.html` are always preserved, including nested special files. Documents without a matching canonical, external canonicals, asset-shaped paths and non-HTML assets are left alone. Slug path segments are restricted to letters, digits, underscores and hyphens. All destinations are checked before any rename; collisions and symlinks fail the build. Renames preserve document bytes exactly, including metadata, JSON-LD, content and links. Re-running normalization is a no-op.

The normalizer is generic; the verifier still enforces this experiment's four-page allowlist. Adding another route family is not part of this task.

## Manual staging redirects

In the test service's Redirects/Rewrites dashboard, add or retain these five rules. Each action is **Redirect** (301), not Rewrite:

| Source | Destination | Action |
|---|---|---|
| `/pokemon/14` | `/pokemon/kakuna` | Redirect |
| `/pokemon/25` | `/pokemon/pikachu` | Redirect |
| `/pokemon/6` | `/pokemon/charizard` | Redirect |
| `/pokemon/10100` | `/pokemon/raichu-alola` | Redirect |
| `/pokemon/:slug/` | `/pokemon/:slug` | Redirect |

These four numeric redirects are temporary HTTP proof rules, not a full redirect migration. The build verifies their IDs against the existing registry. Numeric URLs with a slash may take two redirects; plain numeric URLs should take one.

Remove any old test rewrites from `/pokemon/<slug>` to `/pokemon/<slug>.html`: those target files no longer exist. Do not introduce `.html` aliases to compensate. Do not add `/* → /index.html`, `/pokemon/* → /index.html`, or a catch-all rewrite to `404.html`. Missing routes must retain HTTP 404.

## Headers and MIME: required release gate

Retain the existing staging header:

| Path | Header | Value |
|---|---|---|
| `/*` | `X-Robots-Tag` | `noindex` |

**Extensionless documents must return `Content-Type: text/html` (optionally `charset=utf-8`).** A 200 response with an octet-stream/plain-text content type is a failed acceptance test, even if the body contains valid HTML. HTML meta tags cannot repair an incorrect HTTP content type.

First inspect Render's actual response after deployment. If MIME is wrong, add these narrowly scoped staging headers and retest:

| Path | Header | Value |
|---|---|---|
| `/pokemon/kakuna` | `Content-Type` | `text/html; charset=utf-8` |
| `/pokemon/pikachu` | `Content-Type` | `text/html; charset=utf-8` |
| `/pokemon/charizard` | `Content-Type` | `text/html; charset=utf-8` |
| `/pokemon/raichu-alola` | `Content-Type` | `text/html; charset=utf-8` |

Render supports [custom static-site response headers](https://render.com/docs/static-site-headers), but verify the final effective Content-Type rather than assuming an override succeeded. Do not apply HTML Content-Type to `/*`; CSS, JavaScript, JSON and images need their own MIME types. If a header override cannot fix it cleanly, stop this experiment rather than declaring acceptance.

Expected assets: CSS `text/css`; JavaScript `text/javascript` or `application/javascript`; search `application/json`; artwork `image/webp` or `image/png`; promo `image/jpeg`. All should still return 200 and the staging noindex header.

## Exact second-test commands

These commands work in Git Bash. In PowerShell use `curl.exe` instead of `curl`. Do not follow redirects for the initial status/Location checks:

```sh
curl -I https://pokelore-net-astro-test.onrender.com/
curl -I https://pokelore-net-astro-test.onrender.com/pokemon/kakuna
curl -I https://pokelore-net-astro-test.onrender.com/pokemon/kakuna/
curl -I https://pokelore-net-astro-test.onrender.com/pokemon/14
curl -I https://pokelore-net-astro-test.onrender.com/pokemon/pikachu
curl -I https://pokelore-net-astro-test.onrender.com/pokemon/25
curl -I https://pokelore-net-astro-test.onrender.com/pokemon/charizard
curl -I https://pokelore-net-astro-test.onrender.com/pokemon/6
curl -I https://pokelore-net-astro-test.onrender.com/pokemon/raichu-alola
curl -I https://pokelore-net-astro-test.onrender.com/pokemon/10100
curl -I https://pokelore-net-astro-test.onrender.com/pokemon/not-a-real-pokemon
curl -I https://pokelore-net-astro-test.onrender.com/random-garbage-path
curl -I https://pokelore-net-astro-test.onrender.com/pokemon/kakuna.html
curl -I https://pokelore-net-astro-test.onrender.com/pokemon/kakuna/index.html
curl -I https://pokelore-net-astro-test.onrender.com/404.html
curl -I https://pokelore-net-astro-test.onrender.com/images/pokemon/official/detail/14.webp
curl -I https://pokelore-net-astro-test.onrender.com/data/search.json
```

Also test real GET responses (HEAD alone cannot verify the HTML):

```sh
mkdir -p astro-poc/evidence/render-normalized
curl -sS -D astro-poc/evidence/render-normalized/kakuna.headers -o astro-poc/evidence/render-normalized/kakuna.html https://pokelore-net-astro-test.onrender.com/pokemon/kakuna
curl -sS -D astro-poc/evidence/render-normalized/invalid.headers -o astro-poc/evidence/render-normalized/invalid.html https://pokelore-net-astro-test.onrender.com/pokemon/not-a-real-pokemon
curl -sS -D astro-poc/evidence/render-normalized/random.headers -o astro-poc/evidence/render-normalized/random.html https://pokelore-net-astro-test.onrender.com/random-garbage-path
curl -sS -D astro-poc/evidence/render-normalized/alias.headers -o astro-poc/evidence/render-normalized/alias.html https://pokelore-net-astro-test.onrender.com/pokemon/kakuna.html
curl -IL --max-redirs 5 https://pokelore-net-astro-test.onrender.com/pokemon/kakuna/
curl -IL --max-redirs 5 https://pokelore-net-astro-test.onrender.com/pokemon/14
```

Run the file-saving commands from repository root. Inspect Kakuna's source for its title, exactly one production canonical, JSON-LD and full body. The missing-path bodies should be the custom not-found page, not the homepage. Get current hashed CSS/JS URLs from Kakuna's HTML or browser Network panel and test those exact URLs with `curl -I` too; filenames change per build. Check desktop/mobile rendering and no-JS core content after confirming MIME.

| Request | Second-test requirement | Observed after normalized deployment |
|---|---|---|
| Four canonical slugs | 200, correct HTML, text/html, noindex header | Pending |
| `/pokemon/kakuna/` | 301, Location `/pokemon/kakuna` | Pending |
| Four numeric aliases | 301, corresponding slug Location | Pending |
| Invalid Pokémon and random path | 404, custom not-found body | Pending |
| `/pokemon/kakuna.html` | Preferably 404; a 200 means alias normalization is not proved | Pending |
| `/pokemon/kakuna/index.html` | 404 | Pending |
| Assets/search | 200, correct MIME, noindex header | Pending |

Absolute Location values with the staging origin are equivalent. Check other POC slash/HTML aliases as well before accepting the contract. No local tool emulates Render's edge resolver; passing local builds proves files, not the deployed HTTP contract.

## Local checks and scale limits

Run from `astro-poc`: `npm ci`, `npm run build`, `node --test scripts/normalize-output.test.mjs`, `node scripts/check-verifier.mjs`. The build already runs verification; `npm run verify` remains available independently. `npm run dev` is unchanged and remains the local UI workflow. Generic static preview servers may assign the wrong MIME to extensionless files; do not use local preview MIME or redirects as evidence of Render behavior.

Before scaling, prove MIME/redirect/404 behavior on Render and consider route collisions: a physical `/pokemon/example` file cannot also be a directory containing `/pokemon/example/details`. The normalizer rejects destination collisions. Unicode/encoded/dotted canonical paths and directory-index route layouts need an explicit future policy; they are not blindly renamed. Header and redirect management at full scale is also unproven. No full Pokédex migration should begin on the strength of local normalization alone.
