# PokéLore Astro proof of concept — Phase 1

**Result: the static document architecture works locally and supports proceeding with a staged Astro migration, subject to the Render HTTP acceptance tests.** This is not authorization to cut over production or begin Phase 2.

All new files live here on `astro-migration`. Production source, data, routing, root packages, prerender/finalizer scripts, sitemap and `render.yaml` are unchanged. No service was deployed or configured.

```sh
cd astro-poc
npm ci
npm run build
npm run verify
```

Node 24.18.0 was used locally; the package requires Node >=22.12.0. Direct packages: **astro 6.4.8** and development-only **linkedom 0.18.13**, pinned transitively by the committed lockfile. No React integration/island was tested: no interaction is required for this routing/content proof. The POC emits no browser JavaScript or data fetches.

## Files and output

- `astro.config.mjs`: static file output and a build hook copying only four existing local artwork files.
- `src/pages/index.astro`, `src/pages/pokemon/[slug].astro`, `src/pages/404.astro`: six documents total.
- `src/layouts/BaseLayout.astro`, `src/components/{SeoHead,Breadcrumbs,EvolutionNode,LinkedText}.astro`: static document, metadata and reference markup.
- `src/lib/{routes,pokemonData,seo}.js`: allowlisted routes, filesystem data loading, validation and SEO normalization.
- `src/styles/reference.css`: existing PokéLore colors/typeface with a small responsive reference layout.
- `scripts/verify-build.mjs`: DOM assertions on generated output; optional alternate output directory argument supports regression tests.
- `scripts/check-verifier.mjs`: proves that missing canonical/analysis, duplicate H1 and accidental noindex fail verification, using isolated corrupted output copies.
- `scripts/compare-pages.mjs`: optional local browser comparison using the repository's existing Playwright installation.
- `RENDER_TESTING.md`, `COMPARISON.md`: deployment instructions and baseline findings.
- `.gitignore`, `package.json`, `package-lock.json`: isolated dependencies; generated output/evidence are ignored.

Generated routes: `/`, `/pokemon/kakuna`, `/pokemon/pikachu`, `/pokemon/charizard`, `/pokemon/raichu-alola`, and `/404.html`. The edge case resolves to form ID 10100, species National Dex 26. The directory contains `dist/index.html`, `dist/404.html`, `dist/pokemon/<slug>.html`, one `_astro/*.css` stylesheet, and four `images/pokemon/official/detail/*.webp` files. No numeric documents, directory-index aliases, copied production data, catch-all, sitemap or output normalizer.

## Authoritative inputs (read only)

| Concern | Existing source / pure helper |
|---|---|
| Canonical routes, numeric mapping | `public/data/pokemonRoutes.json`; allowlist validates `byName`, verifier checks `byId` |
| Name, types, abilities, stats, size, species, form | `public/data/pokemonData/<registry id>.json`; `src/utils/pokemonNames.js` |
| Ability descriptions and slugs | `public/data/abilities.json` |
| Factual prose, line analysis, Biology & Behavior | `public/data/PokeloreAnalysis.json`; `resolvePokeloreAnalysis` |
| Defensive matchups | `src/utils/typeEffectiveness.js`, `src/constants/Types.js`, `typeColors.js` |
| Evolution and regional selection | `public/data/evolutionChains/<id>.json`, `evolutionMethodOverrides.json`; `evolutionDisplay.js` |
| Latest/default static level-up preview | `public/data/pokemonLearnsets/<id>.json`, `movesIndex.json`; `learnsetDisplay.js` and its version ordering |
| Encounters and valid location links | `public/data/pokemonEncounters/<form id>.json`, `public/data/locations/*.json`; `encounterDisplay.js` |
| Local detail artwork | `public/data/pokemonArtworkManifest.json` and `public/images/pokemon/official/detail/*.webp`; existing `pokemonSprites.js` confirms path policy |
| Titles, descriptions, JSON-LD semantics | `src/seo/seoConfig.js`: `pokemonSeo`, `homeSeo`; no `Seo.jsx` import |
| Prose links | `public/data/pokeloreLinkTargets.json`; `pokeloreTextLinks.js` |
| Appearance | Palette/typeface from `src/index.css`; isolated CSS avoids global production selectors |

JSON reads are cached per build process and use `node:fs`, never HTTP. Required registry identity, six stats, types, abilities, summary, all three analyses, biology, evolution, latest level-up moves and local artwork fail the build if absent/invalid. Missing optional encounter data emits a warning and an explicit availability note; malformed JSON fails. Learnset fallback follows the existing helper and reports when used. Shared species biology is labeled and warned. HTML strings are escaped by Astro; prose links use structured parts; JSON-LD escapes `<`.

Non-POC references use absolute production canonical URLs so staging links do not falsely imply those page families were migrated. The four POC Pokémon link locally. All Pokémon references use registered slugs.

## Validation and limits

Local install, build and verifier passed. Six documents were produced in about 2.3 seconds in the first build. Browser checks confirmed complete reference content with JavaScript disabled, loaded local images, and no horizontal overflow at 390px for Kakuna, Pikachu and Charizard. Desktop/mobile screenshots were inspected. Local preview returned the custom 404 with HTTP 404 for both invalid test paths.

`npm ci` was repeated against the lockfile, followed by a successful fresh build. On this Windows agent, running npm ci while the preview server held package files open initially caused EPERM; stopping that server resolved it. The subsequent build needed the agent's elevated sandbox execution because esbuild could not traverse newly installed package directories. This was an execution-environment issue, not a required Render configuration. Four deliberately corrupted output copies were correctly rejected by `node scripts/check-verifier.mjs`.

Existing React production compilation also passed using `node node_modules/vite/bin/vite.js build --outDir astro-poc/evidence/production-build` from repository root. The full root npm lifecycle was deliberately not executed: its prebuild scripts rewrite source datasets and sitemap, contrary to this task's scope. The existing root `dist` baseline was read, not rebuilt or changed. Tracked production files remain unchanged.

The optional comparison command requires root dependencies, root Vite on port 5180, and Astro preview on 4321. Run `node scripts/compare-pages.mjs` from this directory; snapshots and screenshots go to ignored `evidence/`. These are local checks, not proof of the live production deployment's current state.

Known limitations before full migration:

- Alolan Raichu resolves to shared standard-Raichu biology in current data. The POC labels it and derives its summary from form facts instead of presenting the incorrect Electric-only species summary. Form-specific prose needs a data audit.
- The inherited Alolan evolution summary does not fully explain game/region restrictions. Evolution override coverage needs testing across other nontrivial forms before broad rollout. No source data was changed to conceal this gap.
- `pokemonSeo` claims a visual size-comparison section; this POC omits that optional UI, its `CreativeWork` node and `hasPart`. WebPage, BreadcrumbList and Thing remain. Form IDs are normalized to species National Dex IDs in JSON-LD. These changes are POC-only.
- Galleries, all-version learnset filters, Dex entry selectors, extended biological facts, size comparison and other interactive UI are outside this proof. React islands and all-family scale/performance remain unproven.
- Render extensionless resolution, slash redirects, MIME types, custom 404 status and `.html` aliases must pass staging checks. See [exact commands and rules](RENDER_TESTING.md).

No architectural blocker appeared in this four-Pokémon sample. Deployment acceptance and wider form/content audits remain prerequisites to a safe full migration.
