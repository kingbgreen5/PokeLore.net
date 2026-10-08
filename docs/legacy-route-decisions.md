# Legacy Route Decisions

Route-classification audit for the final Phase 11A static cutover. This document
records source and generated-artifact evidence as of 2026-10-07. It does not
authorize migration of the routes classified as internal.

## Cutover constraint

`astro-poc/wrangler.jsonc` deploys only `./dist` as static assets, with
`html_handling: "drop-trailing-slash"` and `not_found_handling: "none"`. It has
no Worker entry point, SPA fallback, origin proxy, or routing rule for the
legacy Vite application. Therefore the React application will not be reachable
at `pokelore.net` after Astro becomes the production deployment. A
React-only route will stop functioning unless it is explicitly preserved as an
Astro artifact or a redirect.

## Decisions

| Route / Pattern | Public? | Current behavior | Sitemap? | Internal links? | Needed after cutover? | Final classification | Astro action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/DexEntries` | Legacy public alias, but not canonical | React Router renders `DexEntriesPage`, exactly as `/dex-entries`; live response is HTTP 200 SPA shell, not a redirect. | No | No; navigation, canonical data, and content use lowercase only. | Alias convenience only. | redirect | **Implemented:** explicit static `301` to `/dex-entries`; lowercase route unchanged. |
| `/dex-entries` | Public canonical route | Existing canonical Astro page. | Yes, once | Yes: navigation and article links. | Yes | canonical preserve | Frozen; no implementation work in this audit. |
| `/seo-review` | Internal | React route exists, but `SeoReviewPage` renders a localhost-only notice off localhost and emits `noindex,nofollow`. | No | Only `DevToolsPage` local review listing. | No public need. | dev-only | Leave React-only. It will be an Astro 404 after cutover; do not add an SPA fallback. |
| `/dev/feebas-tile-editor` | Internal | React route is compiled only when `import.meta.env.DEV`; interactive editor with local save/import-export. | No | Local `DevToolsPage`, calculator/validator cross-links only. | Local workflow only. | dev-only | Leave original React implementation unmigrated. No Astro route is emitted, so it 404s after cutover. |
| `/dev/rse-feebas-tile-editor` | Internal | DEV-gated interactive Route 119 editor. | No | Local `DevToolsPage` only. | Local workflow only. | dev-only | Same as above. |
| `/dev/rse-feebas-algorithm-validator` | Internal | DEV-gated validator with local diagnostic state. | No | Local `DevToolsPage` only. | Local workflow only. | dev-only | Same as above. |
| `/dev/emerald-feebas-recovery-validator` | Internal | DEV-gated recovery validator. | No | Local `DevToolsPage` only. | Local workflow only. | dev-only | Same as above. |
| `/dev/emerald-feebas-save-validator` | Internal | DEV-gated local save parser/validator. | No | Local `DevToolsPage` only. | Local workflow only. | dev-only | Same as above. |
| `/dev/rs-feebas-recovery-validator` | Internal | DEV-gated Ruby/Sapphire recovery validator. | No | Local `DevToolsPage` only. | Local workflow only. | dev-only | Same as above. |
| `/dev/feebas-map-validator` | Internal | DEV-gated DPPt map validator. | No | Local `DevToolsPage` and the separate DEV-only DPPt validator. | Local workflow only. | dev-only | Same as above. |
| `/dev/dppt-feebas-calculator` | Internal | DEV-gated calibration/visual-validation tool. This is distinct from the public `/dppt-feebas-calculator`. | No | Local `DevToolsPage` only. | Local workflow only. | dev-only | Leave React-only; retain the public calculator separately. |
| `/og-preview` | Internal preview route | React preview index without public navigation, sitemap entry, or canonical public purpose. | No | Local `DevToolsPage` preview listing and its own preview controls. | No public need. | dev-only | Leave React-only. It will be an Astro 404 after cutover. |
| `/og-preview/pokemon/:id` | Internal preview route | React OG Pokémon-card preview. | No | Local `DevToolsPage` sample plus OG preview index. | No public need. | dev-only | Leave React-only; no Astro preview/status route is emitted. |
| `/og-preview/move/:moveName` | Internal preview route | React OG move-card preview. | No | Local `DevToolsPage` sample plus OG preview index. | No public need. | dev-only | Leave React-only; no Astro preview/status route is emitted. |
| `/og-preview/topic/:topicSlug` | Internal preview route | React OG topic-card preview. | No | Local `DevToolsPage` sample plus OG preview index. | No public need. | dev-only | Leave React-only; no Astro preview/status route is emitted. |
| `/og-preview/item/:itemName` | Internal preview route | React OG item-card preview. | No | Local `DevToolsPage` sample plus OG preview index. | No public need. | dev-only | Leave React-only; no Astro preview/status route is emitted. |
| `/items/dynamax-crystals` | Public canonical guide | React route `DynamaxCrystalsGuidePage`; public sitemap entry; `DYNAMAX_CRYSTAL_GUIDE_PATH` is used by item detail and prerendered item-page links. | Yes | Yes: item detail and item-prerender output. | Yes | canonical preserve | **Implemented:** static Astro guide with source data, exact public SEO, 12 released-crystal cards, item/Pokémon links, and sitemap parity verification. |

## Evidence and consequences

- Production `App.jsx` registers both `/DexEntries` and `/dex-entries` with the
  same `DexEntriesPage`; neither redirects in application code. The public
  response for `/DexEntries` is currently HTTP 200 and serves the generic SPA
  shell. It is absent from `public/sitemap.xml`; lowercase `/dex-entries` is
  present and is the only route used by navigation.
- All listed Feebas validator/editor routes are guarded by `import.meta.env.DEV`
  in `App.jsx`. In a production Vite build their React routes are absent and the
  SPA's catch-all page handles them. Their own canonical metadata uses `/dev/*`
  and they are absent from the sitemap and public navigation.
- `/seo-review` and `/og-preview/*` are currently registered React routes, but
  they are absent from the sitemap and public navigation. `/seo-review` itself
  explicitly renders a localhost-only message and `noindex,nofollow` outside
  localhost. Their presence in the React source does not make them public
  preserve routes.
- Astro's `/dev` index is intentionally noindex/localhost-only. It lists only
  the explicitly preserved Astro utilities; legacy React-only workflows are not
  emitted as Astro placeholder pages.
- `DYNAMAX_CRYSTAL_GUIDE_PATH` is exactly `/items/dynamax-crystals`. It is now a
  real static Astro artifact and remains a single canonical sitemap route.
- `/learnsets` remains the separately approved intentional removal and is now
  absent from the Astro sitemap. No other unexplained public route was found
  within this audit scope.
