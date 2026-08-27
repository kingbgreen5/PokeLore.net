# Pokemon Static Routing

The production build owns Pokemon static-route finalization. After Vite builds the app and `scripts/prerenderPokemonPages.js` writes canonical prerender directories, `scripts/finalizePokemonPrerenderRoutes.js` is the single production step that converts those outputs into exact extensionless files and validates them.

## Canonical Pokemon

`/pokemon/{slug}` is served from the exact physical file `dist/pokemon/{slug}`. That file contains the full prerendered Pokemon detail HTML, canonical SEO tags, asset references, and normal React hydration.

## Numeric Legacy Alias

`/pokemon/{id}` is served from the exact physical file `dist/pokemon/{id}`. It is a tiny HTML redirect shell with an absolute canonical URL, a zero-second meta refresh to `/pokemon/{slug}`, and a visible fallback anchor.

Numeric aliases are not HTTP 301 routes in Render. Do not recreate thousands of Render Redirects or Rewrites for Pokemon.

## Invalid Pokemon

Invalid Pokemon URLs have no exact physical static resource, so Render falls through to the `/pokemon/* -> /index.html` SPA fallback. React then handles confirmed not-found state and noindex behavior.

## Render Requirements

Render must serve `/pokemon/*` extensionless physical files as `Content-Type: text/html; charset=utf-8`; otherwise extensionless files may default to binary/octet-stream.

Exact static resources are served before rewrite fallbacks. The live Render dashboard route list should stay minimal:

```yaml
- type: rewrite
  source: /pokemon/*
  destination: /index.html
- type: rewrite
  source: /*
  destination: /index.html
```

Avoid saving stale Render dashboard route state: Render Save replaces the route list. The old `scripts/generateRenderPokemonRoutes.js` file is retained only as archived diagnostic tooling for the abandoned Render-rule strategy and must not be used for production routing.
