# PokéLore Astro proof of concept — Phase 1B

The four-page POC now uses the production Pokémon-detail layout and interactive widgets while Astro owns the document, core content and SEO. Kakuna is the visual reference; Pikachu, Charizard and Alolan Raichu use the same template. Work remains local on `astro-migration`; this phase does not deploy, change production or start the full migration.

```sh
cd astro-poc
npm ci
npm run build
npm run verify
node scripts/check-verifier.mjs
```

Tested with Node 24.18.0, Astro 6.4.8, @astrojs/react 6.0.6, React/ReactDOM 19.2.5 and development-only linkedom 0.18.13. The lockfile pins installed versions. Build inputs include parent source/data, so this directory is not a standalone repository.

## Implementation map

| Files | Responsibility / provenance |
|---|---|
| `src/pages/pokemon/[slug].astro` | Shared static summary, hero, abilities, matchups, evolution, analysis, Dex entries, biology, Misc, forms, optional held items and previous/next links |
| `src/layouts/BaseLayout.astro`, `src/styles/reference.css` | Production banner assets and root CSS; adapted production spacing/markup; native menu with Escape/outside-click enhancement |
| `src/components/{Accordion,TypeBadge,PokemonCard,EvolutionNode}.astro` | Native details/summary, original badge images, production-style evolutionary cards/connectors |
| `src/islands/GlobalSiteSearch.jsx` | Adapted production search/ranking; generated search records loaded on interaction |
| `src/islands/{LearnsetCard,WhereToFind}.jsx` | Adapted production filters/tables/grouping; SSR build-time props; storage restored after hydration |
| `src/islands/AdditionalImages.jsx` | Production gallery behavior; on-open PokeAPI request with explicit failure/retry |
| `src/islands/SizeComparison.jsx`, `src/lib/sizeComparisonCharacters.js` | Original chart/calibration/responsive logic and trainer assets; build-time props |
| `src/islands/PokemonSpriteCarousel.jsx` | Original drag/scroll/recenter navigation; build-time index and ordinary anchors |
| `src/islands/EtsyMerchPromo.jsx` | Original promo/tracking helpers/CSS; SSR ad and cached-image load handling |
| `src/islands/{Anchor,CollapsibleSection,TypeBadge}.jsx`, `src/hooks/` | Canonical anchors, SSR-native accordions, original badges and hydration-safe persistence |
| `src/lib/{pokemonData,routes,links,searchRecords,seo}.js` | Cached filesystem data, validation, allowlisted routes, search records, static metadata |
| `astro.config.mjs`, `package*.json` | Isolated React integration, selected artwork/promo copying, generated search data |
| `scripts/verify-build.mjs`, `scripts/check-verifier.mjs` | Expanded Phase 1 assertions and deliberate-corruption checks |
| `scripts/{parity-browser,test-parity,measure-parity}.mjs` | Screenshots, interaction/no-JS checks and JavaScript measurement |

Direct reuse without hydration: production `BaseStatsChart.jsx`. Other direct imports include global CSS, Etsy CSS/helpers, banner/type/trainer assets and pure names, evolution, matchup, prose-link, learnset and SEO helpers. Adaptations live here; parent files are read only.

## Static content and islands

Seven React islands: search (`client:load`); learnset, encounters, gallery, promo, size comparison and carousel (`client:visible`). Stats render on the server without a client directive. No whole-page React root, React Router, client head repair, SPA fallback or runtime Pokémon-data fetch was introduced.

Native accordions work without JavaScript. Summary, abilities/in-game descriptions, six stats, matchups, evolution, all analysis, Dex entries, biology, default all-generation moves and encounters are in original HTML. Filters require JavaScript; static defaults remain useful. The Phase 1 latest-level-up subset remains included and verified.

Ability descriptions show the existing In-Game Description (`shortEffect` in `abilities.json`) verbatim beneath each name in smaller text, matching the production ability detail page. Names link to canonical ability pages and Hidden Abilities are labeled. No ability prose was invented.

Four Pokémon link locally; other references use production canonical URLs. Static JSON-LD includes the size-comparison CreativeWork/hasPart now that the section exists. Phase 1 form National Dex normalization, artwork metadata and initial-HTML SEO remain.

Output: six HTML documents (`/`, four Pokémon, `/404.html`), CSS/JS, original bundled assets, selected official artwork, promo image and `data/search.json`. No numeric Pokémon documents, sitemap, normalizer or catch-all.

## Validation

Build, output verification and four deliberate-corruption checks pass. Browser checks cover all four POC routes with/without JavaScript; desktop/mobile; 900px chart layout; search/back/forward; menu/accordions; move and encounter filters; gallery success/failure/retry; promo callbacks; trainer selection and carousel recentering. No page exceptions or hydration errors were recorded. See [comparison and payload report](COMPARISON.md) and [completed inventory](PARITY_PLAN.md).

Browser scripts use the root repository's existing Playwright installation. Start preview on port 4321:

```sh
npm run preview -- --host 127.0.0.1 --port 4321
# In another terminal, from astro-poc:
node scripts/test-parity.mjs
node scripts/measure-parity.mjs
node scripts/parity-browser.mjs
```

Screenshot comparison additionally uses live production HTTPS and root Vite on 5180, started from repository root with `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5180 --strictPort`. The older `scripts/compare-pages.mjs` remains an optional Phase 1 raw-output comparison. Generated evidence is ignored by Git. The root build lifecycle was not run in Phase 1B because it rewrites production datasets.

## Before scaling

The template is reusable, but full-Pokédex readiness is not certified. The complete navigation index makes HTML large; embedded badge assets increase JS. Broader form/evolution/optional-content coverage needs audit. Alolan Raichu's inherited species biology and regional evolution restrictions remain documented data limitations. Gallery images still depend on PokeAPI. No production analytics loader or admin-only size-review tools were added. No Oak/GO note records exist for this sample; those optional features are not certified.

Review these limits and perform deployed Phase 1B acceptance before scaling. [Render instructions](RENDER_TESTING.md) preserve the static routing policy; this task did not deploy changes.

Development serves the same selected public artwork and generated search records through Vite middleware. The shared allowlist in scripts/public-assets.mjs is also used by the build copier, so a prior build is not required for dev images or search. Restart npm run dev after configuration changes.

Learnset categories now follow the Gen I–III type split for selected legacy games across all methods. See [historical category rules and tests](LEARNSET_CATEGORIES.md).
