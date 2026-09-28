# Phase 5A — Ability Detail-Page Migration + Stress Test

## 1. Production Ability architecture discovered

Production routes `/ability/:abilityName` through `src/App.jsx` to `src/pages/AbilityDetailPage.jsx`. The React page fetches the entire `/data/abilities.json` object and `/data/pokemonRoutes.json` in the browser, selects one Ability by URL key, then separately fetches one Pokémon JSON file per flattened holder. It optionally fetches `/data/oaksNotes/abilities/{slug}.json`. The visible sections are Ability name, in-game description, detailed effect, optional Oak's Notes, generation, and a compact `PokemonSummaryCard` grid. There are no Ability filters, tabs, accordions, or other page-specific interactions.

Production metadata is inserted client-side with `abilitySeo()`: title, description, and canonical URL. Production Ability pages do not add Ability-specific structured data. A missing Ability renders “Ability not found” inside the SPA rather than a route-level static 404.

## 2. Authoritative Ability data sources

- `public/data/abilities.json` is the production-consumed authoritative Ability catalog and route-key source.
- `public/data/pokemonRoutes.json` is the authoritative 1,352-route Pokémon registry.
- `public/data/pokemonData/{id}.json`, interpreted through the established Astro Pokémon model, is authoritative for each routed form's Ability slot and Hidden status.
- `public/sitemap.xml` independently contains the same 313 Ability URLs.
- `public/data/oaksNotes/abilities/protean.json` is the only optional Ability editorial record.
- `public/data/typeAbilities.json` is a derived type-analysis dataset and is not an Ability route/detail authority.

## 3. Exact canonical Ability count

There are **313 canonical Abilities**. All 313 object keys are unique, valid lowercase hyphenated slugs. All record `name` values are unique and match the route catalog. No aliases, collisions, invalid slugs, or duplicate source IDs were found. Source IDs are not present in the authoritative Ability file, so the model exposes `sourceId: null` instead of inferring IDs from object order.

## 4. Ability data-field inventory

Every authoritative record contains exactly:

- `name`
- `shortEffect`
- `effect`
- `generation`
- `pokemon`

All 313 records have nonempty short effect, detailed effect, and generation values. The source contains no flavor-text collection, historical values, version-specific changes, or structured battle/overworld fields. Battle and overworld behavior appear as prose in `effect`. No placeholder tokens remain in current effect text.

## 5. Holder/form semantics discovered

The flat `ability.pokemon` array identifies holders but cannot describe slots or Hidden status. The Astro model therefore iterates the established 1,352 canonical routed forms and reads each routed form's own `abilities` records. It reuses the Pokémon route registry, form model, display names, card artwork, types, and canonical `/pokemon/{slug}` links. Cosmetic identities are not invented; regional, Mega, gender, permanent alternate, G-Max, and other already-canonical forms are preserved only when they exist in the registry and actually expose the Ability.

## 6. Normal vs Hidden Ability semantics

Pokémon records represent roles with `hidden: boolean` and numeric `slot` values. The model preserves both flags and slot lists per routed form, supports a holder being regular and Hidden if future data requires it, and renders separate **Regular Ability** and **Hidden Ability** sections. Current data contains no single routed form marked both ways for the same Ability.

## 7. Holder-count distribution

Counts use canonical routed Pokémon/form identities:

| Measure | Count |
|---|---:|
| Abilities with zero holders | 1 |
| Minimum nonzero | 1 |
| Median | 4 |
| p75 | 13 |
| p90 | 27 |
| p95 | 33 |
| Maximum | 48 |

## 8. Top 20 Abilities by routed holder count

| Ability | Slug | Total | Regular | Hidden |
|---|---|---:|---:|---:|
| Sturdy | sturdy | 48 | 39 | 9 |
| Swift Swim | swift-swim | 48 | 35 | 13 |
| Intimidate | intimidate | 47 | 39 | 8 |
| Levitate | levitate | 44 | 44 | 0 |
| Keen Eye | keen-eye | 43 | 38 | 5 |
| Chlorophyll | chlorophyll | 39 | 32 | 7 |
| Gluttony | gluttony | 39 | 27 | 12 |
| Frisk | frisk | 38 | 28 | 10 |
| Inner Focus | inner-focus | 38 | 26 | 12 |
| Static | static | 38 | 37 | 1 |
| Lightning Rod | lightning-rod | 37 | 15 | 22 |
| Sheer Force | sheer-force | 37 | 14 | 23 |
| Pressure | pressure | 36 | 31 | 5 |
| Run Away | run-away | 36 | 28 | 8 |
| Own Tempo | own-tempo | 33 | 27 | 6 |
| Thick Fat | thick-fat | 33 | 20 | 13 |
| Blaze | blaze | 32 | 30 | 2 |
| Overgrow | overgrow | 32 | 30 | 2 |
| Shell Armor | shell-armor | 32 | 25 | 7 |
| Swarm | swarm | 32 | 28 | 4 |

## 9. Selected stress-test Abilities and why

1. `sturdy` — largest routed population.
2. `swift-swim` — joint-largest and spans many generations.
3. `sheer-force` — Hidden-heavy population.
4. `levitate` — large all-regular population with many forms.
5. `wonder-guard` — rare signature Ability and complex effect.
6. `protean` — regular and Hidden holders, forms, and the sole Oak's Notes record.
7. `water-absorb` — regional/form coverage and routed female-form expansion.
8. `cursed-body` — mixed roles and routed female-form expansion.
9. `mold-breaker` — one of the longest detailed battle effects.
10. `stench` — percentage/chance text and explicit overworld behavior.
11. `run-away` — concise battle behavior plus overworld behavior.
12. `battle-bond` — unusual form mechanic.
13. `power-construct` — multiple forms of one Pokémon.
14. `as-one-glastrier` — long name and explicit missing-detail source text.
15. `neutralizing-gas` — long in-game description.
16. `supreme-overlord` — new-generation long effect.
17. `embody-aspect` — canonical zero-holder record.
18. `dragonize` — new Generation IX Ability.

## 10. Astro Ability architecture implemented

The data path is `abilities.json` + canonical Pokémon model → `abilityData.js` → static Astro template. The shared model owns identity, display formatting, generation, effects, routed role-aware holders, source discrepancies, optional Oak's Notes, SEO, and JSON-LD. The template renders only the 18 stress routes. Core content and holder cards are static HTML. The only island is the already-shared global site search.

Structured data uses a `WebPage`, an Ability `Thing`, and `BreadcrumbList`, containing only facts supported by the model.

## 11. Files created/modified

Created:

- `src/lib/abilityData.js`
- `src/lib/abilityRoutes.js`
- `src/pages/ability/[slug].astro`
- `scripts/audit-abilities.mjs`
- `scripts/verify-abilities.mjs`
- `scripts/ability-browser.mjs`
- `PHASE5A_ABILITY_REPORT.md`

Modified:

- `src/styles/reference.css`
- `scripts/generate-redirects.mjs`
- `scripts/validate-redirects.mjs`
- `scripts/verify-build.mjs`
- `package.json`

Existing uncommitted Move work remains present and was not refactored for this phase.

## 12. Stress-page HTML/page-size measurements

Across 18 pages:

- minimum HTML: **10,528 bytes** (`embody-aspect`)
- median HTML: **51,104 bytes**
- maximum HTML: **326,276 bytes** (`sturdy`)
- maximum gzip size: **100,727 bytes** (`levitate`)
- median-based projected full 313-page HTML: **15,995,552 bytes** (about 15.3 MiB)

The large end is caused by fully static holder cards and their build-resolved artwork/type asset references. The maximum holder population is still only 48.

## 13. Hydration/data-asset measurements

Ability-specific hydration props: **0 bytes**. The reported 2-byte island props belong to the shared global search island. Ability supporting JSON assets: **0 bytes**. No holder registry or Ability payload is sent to the browser.

## 14. Full catalog model-audit results

- 313 canonical Abilities
- 313 successful models
- 0 fatal model failures
- 0 duplicate routes
- 0 invalid slugs
- 0 missing required effects
- 0 invalid canonical URLs
- 0 broken required Pokémon links
- 0 numeric Pokémon links
- 0 duplicate routed holder identities
- 0 malformed regular/Hidden roles
- 0 unresolved effect placeholders

Machine-readable evidence is in `evidence/abilities/model-audit.json` and `evidence/abilities/stress-metrics.json`.

## 15. Broken/missing/ambiguous source-data cases

- `embody-aspect` is canonical but has zero routed holders in current source data.
- `as-one-glastrier` and `as-one-spectrier` have useful short descriptions, but their detailed effect is literally “No effect description.” The model preserves this source limitation.
- Ability source IDs are unavailable and are not inferred.
- Historical effects, flavor text, and version-specific changes are unavailable in the authoritative file.
- Only `protean` has Oak's Notes.
- Raw/routed count differences occur only for `damp` (20→22), `water-absorb` (30→32), and `cursed-body` (15→17). Each difference is the explicit canonical `frillish-female` and `jellicent-female` route pair, which shares source species data but is independently routed.

## 16. Local test results

Passed:

- complete 2,309-page Astro build
- existing 1,352 Pokémon-page verification
- existing 937 Move-page verification
- 313-model Ability audit
- 18 stress-page static verification
- 18 no-JavaScript browser pages at 390px
- responsive checks at 768px and 1440px
- real invalid Ability 404
- canonical Pokémon holder links
- normal/Hidden section counts
- no horizontal overflow
- no Ability-specific hydration

## 17. Cloudflare staging test results

Deployed to `https://pokelore-astro-test.thebeakeh.workers.dev/`, version `6e9150d9-ba48-4cdf-a25d-25d712fb50bc`.

All 18 stress routes returned 200. The live suite verified static content with JavaScript disabled, canonical metadata, holder roles and links, responsive layouts, a real invalid-route 404, trailing-slash normalization, and `X-Robots-Tag: noindex`.

## 18. Pokémon/Move regression results

Live and local no-JavaScript checks passed for:

- `/pokemon/chikorita`
- `/pokemon/charizard-mega-x`
- `/move/vine-whip`
- `/move/protect`

The full existing Pokémon and Move verification suites also passed. No frozen-family implementation change was needed for Phase 5A.

## 19. Recommendation for holder rendering architecture

Keep all Ability holders static. The median is four and the maximum is 48, so an on-demand island would add complexity while weakening no-JavaScript and crawl behavior. Separate static role sections provide the only needed grouping. A client filter is not justified by the measured population.

## 20. Exact remaining work required for Phase 5B full Ability generation

After explicit authorization:

1. Change Ability `getStaticPaths()` from the 18 stress slugs to all 313 canonical slugs.
2. Add all 313 Ability URLs to the Astro sitemap generation/verification path.
3. Extend exact-document verification from the stress set to all Ability routes.
4. Run the existing full build, full 313-page Ability static audit, browser samples, link crawl, invalid-route test, and Cloudflare deployment.
5. Measure actual full-family footprint against the 15.3 MiB projection.
6. Verify every deployed canonical Ability URL and normalization behavior.
7. Update navigation/search ownership only when the full family is available locally.
8. Freeze the Ability family after review and acceptance.

Phase 5A stops here. No additional Ability routes were generated.
