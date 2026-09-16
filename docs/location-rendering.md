# Location rendering and deployment verification

Location pages now use the existing React location component for build-time HTML. The canonical registry is `public/data/locationsIndex.json`; it currently contains 1,098 entries. The prerender reads location, item, Oak's Notes, Pokémon GO notes and Friend Safari Pokémon data locally. Missing required or malformed build data fails the build instead of publishing a not-found page.

`npm run build` runs location prerendering before homepage prerendering. It first writes `dist/location/{slug}/index.html`, then the location finalizer moves the same bytes to the exact extensionless file `dist/location/{slug}`. This matches the Pokémon/item deployment strategy: a file and directory cannot coexist at the same path, so the intermediate `index.html` does **not** remain after finalization.

Render serves exact resources before rewrite rules. `render.yaml` specifies an HTML Content-Type for `/location/*` and a neutral `/location-fallback.html` rewrite before the generic SPA fallback. Existing Pokémon, item and other routes are preserved. No per-location YAML rules are necessary. Reference: https://render.com/docs/redirects-rewrites

The initial location bundle is embedded in the generated HTML, scoped to its canonical slug. Client rendering starts with that data, including when version query parameters are present. Ordinary client navigation uses a keyed component and ignores late results from unmounted requests.

- Loading: neutral metadata, no canonical, no `noindex`.
- Valid: real content, canonical slug without query parameters, indexable metadata.
- Unknown slug: confirmed against the canonical registry, `Location not found`, `noindex, follow`, no canonical.
- Required data/network failure: unavailable state with retry, no canonical, no `noindex`.

Existing internal links use location `name` fields. Location aliases in the data import pipeline are normalization aliases, not additional public routes. Preserve existing double-hyphen canonical slugs. Sitemap behavior is unchanged; regression tests require an exact match between location files, canonical registry and sitemap location URLs.

Verification commands:

```sh
npx vitest run src/pages/LocationDetailPage.test.jsx scripts/prerenderLocationPages.test.js src/seo/Seo.test.jsx
npm run build
```

The prerender test checks both intermediate HTML and byte-for-byte preservation at the final extensionless path for Pokéathlon Dome, Kanto Route 2, Goldenrod City, Mt. Moon, Friend Safari and Hau'oli City. It checks location content, metadata, escaping, sitemap parity and Render configuration ordering. Component tests cover loading, valid data, 404, network/missing/malformed data failures, retry, embedded data and navigation.

After deployment, inspect the **raw HTTP response** for `/location/pokeathlon-dome` and other representative locations with JavaScript disabled. Verify `Content-Type: text/html; charset=utf-8`, location H1/body, canonical, description and no `noindex`. Confirm Render has applied the repository configuration and that no dashboard overrides serve the homepage. Local build validation does not establish that deployment is fixed. Unknown paths still use a static-host fallback (HTTP 200); their confirmed not-found/noindex state is applied by React.

Run `npm run test:location:e2e` after building to verify six raw HTTP responses and JavaScript-disabled browser pages, then compiled client filtering, navigation, temporary failure, retry and 404 handling. Its local static server models Render exact-file precedence; it does not contact production.

Verified in this change:

- Full `npm run build`: passed; 1,098 final location HTML files audited, with canonical sitemap coverage and no invalid internal location links.
- Focused location/SEO tests: 13 passed, including six representative prerenders.
- Broader Vitest run: 433 passed with two workers and a 20-second timeout, excluding the two existing standalone Node assertion scripts. Both standalone Pokémon scripts passed when run with Node. Plain `npm test` currently tries to collect those scripts as Vitest suites and reports “No test suite found”; the first concurrent run also timed out on the long representative Pokémon test.
- `npm run test:location:e2e`: passed for all six pages without JavaScript and for the compiled-client state/filter/navigation checks.
- ESLint on all changed JavaScript/JSX files and `git diff --check`: passed.
- Existing unrelated checks needing follow-up: after sitemap generation, `test:data` rejects `/tcg-challenge` because the validator omits that existing route; the general browser smoke test stops on its homepage “all types” expectation. Neither check was weakened for this change.
- Build-generated timestamp/sitemap churn was removed from tracked source data. The generated `dist` output remains available for inspection.
