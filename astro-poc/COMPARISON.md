# Current reference output versus Astro POC

Captured locally on 2026-09-19 (America/Chicago). Three separate baselines were inspected: existing **raw `dist/pokemon/<slug>`** files; **rendered React DOM** from the current checkout served by Vite, with collapsed controls expanded; and **Astro HTML/DOM with JavaScript disabled**. Raw `dist` can predate this checkout; it was not regenerated. This is not a live-site crawl. `scripts/compare-pages.mjs` reproduces the capture into ignored `evidence/comparison.json`.

The React baseline's optional held-item and remote additional-image loaders logged fetch errors in this local environment. Core reference content rendered and was captured; the comparison does not certify those optional widgets or remote asset availability.

| Area | Raw prerendered baseline | Rendered React baseline | Astro POC |
|---|---|---|---|
| Title | `<Name> Pokédex: Stats, Moves, Evolution & Analysis \| PokéLore` | Same for all three | Exact match via shared policy |
| Description | `<Name> stats, moves, weaknesses, evolution, locations, Pokédex entries, plus playthrough, competitive and Nuzlocke analysis—all in one place.` | Same for all three | Exact match |
| Canonical | One production-origin, extensionless slug URL | Same for all three | Exact match; no head mutation |
| H1 | One: Kakuna / Pikachu / Charizard | Same | Same |
| Headings | Stats/matchups/evolution plus analysis subheads and collapsed reference sections | Adds abilities, forms, selectors, galleries, size comparison; duplicate Biology heading | One logical H1; H2 sections; H3 analysis/matchup/learnset/location subsections |
| Structured data | **No JSON-LD** in any of the three captured raw pages | WebPage, BreadcrumbList, Thing, CreativeWork via client effect | WebPage, BreadcrumbList, Thing in original HTML: **intentional improvement**; size-comparison CreativeWork omitted because that UI is outside POC |
| Summary | Existing analysis descriptions | Same descriptions | Full exact descriptions for all three |
| Abilities/stats | Core values present | Same primary dataset | Full ability effects, hidden labels, six stats and total |
| Weakness/resistance/immunity | Type-chart reference | Shared type chart | Same pure helper; explicitly before ability effects; prints “None” for empty groups |
| Evolution | Shared display policy | Shared policy plus richer visual cards/forms | Same summary/model for these three; semantic linked tree |
| Analysis | Complete playthrough, competitive, Nuzlocke prose present | Same | All three exact prose strings present and visible without JS |
| Biology | Complete prose present | Same, plus extended biological facts | Exact biology prose, always visible; extended facts not migrated |
| Learnset | Latest level-up preview plus embedded data | Interactive all-generation/method options after expansion | Complete shared latest level-up preview only; no browser fetch |
| Locations | Areas displayed as reference headings; collapsible data | Interactive selectors and location grouping | All source locations/areas/versions/encounter methods, levels, chance and conditions rendered openly; location-level H3 and area labels beneath |
| Internal links | Relevant reference links | Also includes global navigation, forms and all-version moves | Same canonical route policy; POC Pokémon local, other references absolute to production; no numeric links |

## Per-Pokémon checks

| Pokémon | Stats (HP / Atk / Def / SpA / SpD / Spe), total | Latest level-up preview | Evolution | Unique links raw / React / Astro |
|---|---|---|---|---|
| Kakuna | 45 / 25 / 50 / 25 / 25 / 35 = **205** | Brilliant Diamond Shining Pearl, **2** rows | Weedle → Kakuna at 7 → Beedrill at 10 | 47 / 1074 / 48 |
| Pikachu | 35 / 55 / 40 / 50 / 50 / 90 = **320** | Scarlet Violet, **20** rows | Pichu → Pikachu (friendship) → Raichu (Thunder Stone) | 56 / 1190 / 56 |
| Charizard | 78 / 84 / 78 / 109 / 85 / 100 = **534** | Scarlet Violet, **15** rows | Charmander → Charmeleon at 16 → Charizard at 36 | 67 / 1207 / 68 |

Link totals reflect expanded React navigation and interactive content, not missing core prose in Astro. Astro includes its skip link. Name/description/canonical comparisons and complete analysis/biology presence passed for each Pokémon. The static verifier independently compares six stats, totals, matchup entries, evolutionary summary, every latest-level-up row and each available encounter-location link against the build-time model.

Kakuna remains weak to Fire, Flying, Psychic and Rock; Pikachu to Ground; Charizard to Rock (4×), Electric and Water, and immune to Ground. Resistances are emitted from the same production type chart. All encounter data is preserved in initial HTML; presentation uses source location display names (e.g. Route rather than some existing Road labels), and keeps individual area names below each location.

SEO image URLs now reference the existing local PokéLore artwork at the production origin, with OG/Twitter alt metadata, instead of upstream GitHub sprites. Indexable documents use explicit `index,follow,max-image-preview:large`; 404 alone uses `noindex,follow`. Staging must apply its separate noindex HTTP header.

The fourth route, Alolan Raichu, verifies form-specific typing/stats/artwork and slug identity. It also exposed shared-species biology and incomplete regional evolution restrictions in existing helpers. These are documented data limitations, not silently asserted form parity. Its JSON-LD uses National Dex 26 rather than form ID 10100.
