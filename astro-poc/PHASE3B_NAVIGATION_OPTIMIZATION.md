# Phase 3B navigation optimization

Run date: September 27, 2026. Branch: `astro-migration`. Staging Worker version: `8a18fb4e-16be-42d0-9f2e-c55bc0381b1c`.

## Architecture

1. **Previous navigation:** `PokemonSpriteCarousel.jsx` received the complete filtered `pokemonIndex.json` array in hydration props and server-rendered every entry on every detail page. The source held 1,025 indexed records with `id`, `name`, `species`, `sprite`, and `types`, sorted by numeric ID. Kakuna's navigation island occupied about 1.32 MB; median hydration props were 215,246 bytes. Dragging used a native horizontal overflow container, pointer events, per-card refs, normal anchors, and `window.location.assign`. Search is independent and loads `/data/search.json`.
2. **New navigation:** `pokemonNavigation.js` resolves every canonical by-name route, keeps only `id`, `name`, and the best local sprite path, sorts by source ID and then canonical name for shared-ID stability, and produces the current route's compact context. Each page passes nine records, the current ID/name, total count, and a shared-data URL to the island.
3. **Shared registry:** `/data/navigation/pokemon-navigation.json`, generated from the authoritative 1,352-name route registry. It is 109,864 bytes and contains exactly 1,352 unique `{id,name,sprite}` records. No stats, abilities, learnsets, analysis, or encounter data is included.
4. **Initial static window:** nine entries centered on the routed canonical name, shifted at catalog boundaries. Every card is an ordinary canonical anchor; the current card has `aria-current="page"`. Separate previous/next anchors remain. This also corrects form routes that were absent from the old 1,025-record index.
5. **Client loading:** the full shared registry is fetched only after pointer, wheel, focus, or explicit “Browse full Pokédex” interaction. The existing drag, scroll, recenter, images, highlighting, and normal document navigation remain. A failed request exposes a retry button.

## Measurements

| Metric | Phase 3 | Phase 3B |
|---|---:|---:|
| Navigation hydration props, median | 215,246 B | 1,016 B |
| Navigation hydration props, range | 213,184–221,097 B | 883–1,185 B |
| Representative navigation markup | ~1.32 MB | ~11.7 KB |
| Total physical files | 6,783 | 6,784 |
| Total artifact | 2,508,804,336 B | 816,095,541 B |
| Total HTML | ~1,973,223,077 B | 280,403,541 B |
| JSON files / bytes | 1,353 / ~304,777,848 B | 1,354 / 304,887,712 B |
| JavaScript bytes | ~312,425 B | 313,302 B |
| Carousel bundle | 5,761 B | 6,638 B |
| Full build plus verification | 677.44 s | 345.64 s |
| Full local crawl | 23.399 s | 4.888 s |
| Staging asset upload | 314.30 s | 23.87 s |
| Staging deployment | 339.75 s | 36.17 s |

The artifact shrank by 1,692,708,795 bytes, or 67.47%. Total HTML shrank by about 1.693 GB. The shared registry adds one file and 109,864 bytes. The carousel bundle adds 877 bytes for validated on-demand loading and retry state.

### Representative HTML and gzip

| Route | Before HTML | After HTML | Before gzip | After gzip |
|---|---:|---:|---:|---:|
| Kakuna | 1,535,844 | 224,964 | 110,428 | 60,385 |
| Pikachu | 1,551,639 | 233,157 | 99,534 | 49,424 |
| Charizard | 1,607,601 | 294,987 | 118,079 | 67,761 |
| Eevee | 1,581,758 | 268,712 | 116,124 | 66,597 |
| Mewtwo | 1,513,692 | 201,648 | 97,372 | 47,449 |
| Magikarp | 3,267,050 | 1,953,774 | 125,706 | 75,253 |

### Full HTML distribution

| Percentile | Before | After |
|---|---:|---:|
| Minimum | 407,356 | 87,857 |
| Median | 1,502,267 | 196,738 |
| p75 | 1,534,740 | 227,193 |
| p90 | 1,574,603 | 267,917 |
| p95 | 1,610,680 | 314,848 |
| p99 | 1,840,863 | 527,498 |
| Maximum | 3,267,050 | 1,953,774 |

No page now exceeds 2 MB. The twenty largest-page ordering remains driven by unusually large source content, especially encounters, rather than shared navigation duplication.

## Behavior and acceptance

6. **JavaScript disabled:** all 30 stress routes expose nine nearby canonical links plus previous/next navigation. Current-route identity, forms, images, responsive layout, and the rest of each page remain intact at 390, 768, and 1,440 px.
7. **JavaScript enabled:** user interaction loads all 1,352 records once from the shared asset. Current highlighting, drag/scroll/recenter behavior, regional and shared-ID form identity, ordinary document navigation, and browser Back pass locally and live. The only visible difference is the initial nearby window and explicit “Browse full Pokédex” control before full expansion.
8. **Catalog regression:** expected/generated 1,352; missing 0; unexpected 0; duplicates 0. Numeric redirects 1,350 with broken destinations 0. Unresolved form semantics 0. SEO, canonical, JSON-LD, internal-link, numeric-href, asset, and fatal model failures all remain 0.
9. **Browser regression:** 30 JavaScript-disabled mobile pages, six difficult tablet/desktop pages, interactive desktop navigation, interactive mobile regional-form navigation, on-demand learnsets, console errors, navigation/back, and production parity all pass.
10. **Live staging:** all 1,350 numeric redirects and representative canonical/slash/form/invalid routes pass HEAD and GET. The responsive browser suite also passes live. `X-Robots-Tag: noindex` remains. No production domain or DNS was changed.
11. **Remaining blocker:** none within the Pokémon page family. Known optional source-data omissions remain safely labeled or absent as documented in Phase 3; they are not navigation or migration blockers.

A. POKÉMON FAMILY COMPLETE — READY TO MOVE TO NEXT PAGE FAMILY
