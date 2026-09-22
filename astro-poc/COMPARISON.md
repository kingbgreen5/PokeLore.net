# Phase 1B visual and functional comparison

Verified locally on 2026-09-20 (America/Chicago) against repository source, supplied screenshots, live production Kakuna captures and the local React render. The new result is local Astro output; this task has not updated the existing Render POC.

## Visual result

Production and Astro Kakuna were captured at 1440px and 390px. Inspection shows the same major composition: responsive logo/search/menu, centered summary and 250px artwork, name/type images, narrow six-bar stats chart, grouped matchups, evolutionary cards and full-width bordered accordions. Learnsets preserve production columns and type/category images. Size comparison preserves trainer artwork, chart, selector and layering. Approved ability descriptions add height above the stats, shifting later sections naturally.

| Area | Result / implementation |
|---|---|
| Header | Original responsive banner assets; adapted full search and native menu |
| Hero/stats | Production ordering, badges and directly reused SSR BaseStatsChart; total/EV yield retained |
| Matchups/evolution | Original helpers; Astro badge groups, linked cards, conditions and responsive tree |
| Analysis/Dex/biology | Initial HTML, native accordions, production card treatment and biological facts |
| Learnsets | All-generation selector, method tables and canonical move/type/category links; build-time data |
| Encounters | Production version filter, groups, nested disclosures and encounter details |
| Gallery | Original remote gallery; controlled success and failure/retry tests |
| Promo/Misc | Original placement/artwork/CSS/tracking helpers; static Misc data |
| Size/navigation | Original calibrated chart/trainer choices/carousel; ordinary anchors and previous/next |
| Other routes | Same template for Pikachu, Charizard and Alolan Raichu, including forms and hidden abilities |

Evidence in ignored `evidence/phase1b/`:

- `production-{1440,390}-{hero,sections}.png`: live production captures.
- `source-{1440,390}-{hero,sections}.png`: current repository React implementation.
- `astro-{1440,390}-{hero,sections,learnset}.png`: POC captures.
- `astro-size-{desktop,390,900}.png`: enhanced size chart.
- `test-results.json`, `performance.json`, `browser-errors.json`: machine-readable evidence.

This is a practical visual comparison, not pixel-diff certification. Final local screenshots were refreshed after refinements; the last sandboxed live recapture was network-blocked, so earlier successful live captures remain the reference.

## Intentional differences

1. **APPROVED: ability descriptions directly beneath linked names.** The existing In-Game Description (`shortEffect`) appears verbatim in smaller text, without truncation or a disclosure. Hidden Abilities are labeled.
2. Native navigation and details/summary replace router links and JavaScript-only disclosure buttons. Semantic headings retain production visual sizes. Storage-backed selectors and useful accordion state remain enhancements.
3. Four Pokémon route locally; unmigrated references go to production canonical URLs. Previous/next anchors supplement the carousel.
4. Gallery failure has explicit retry instead of repeated automatic requests.
5. Promo selection happens at build time with the existing helper and deterministic first eligible choice. Currently there is one eligible image; a future larger inventory needs a rotation decision. Existing impression/click helper names and payloads remain; cached images loaded before hydration are handled. No analytics loader was added: callbacks use `window.gtag` when available, as before. Tests stubbed that function and did not send analytics or follow an Etsy link.
6. No-JavaScript mobile size charts have a scroll boundary to prevent oversized artwork widening the page. Enhanced mobile behavior retains the original layout.

## Verification results

Build, output verifier and four deliberate-corruption checks pass. Phase 1 assertions remain and now cover the full default learnset, ability descriptions/links, graphical stats, Dex entries, size section and scoped islands. Missing canonical/competitive prose, duplicate H1 and accidental noindex are rejected.

Browser tests pass search/back/forward; menu/Escape; analysis/Dex/biology/learnset/location disclosures; move filtering/persistence; encounter version/area information; ability/evolution/move/location links; gallery success/error/retry; promo callbacks; trainer selection/layering; and carousel recentering. Metadata does not change during interactions.

All four routes pass no-JavaScript checks at 390px: native disclosures open and core content is visible with no horizontal document overflow. All four hydrate tested widgets without page exceptions or React hydration failures. Kakuna additionally passes 1440px captures and 390/900px size checks. Testing caught and fixed no-JS Charizard artwork overflow.

Static title, description, one canonical, OG/Twitter metadata, robots and JSON-LD remain Astro-owned. WebPage, BreadcrumbList, Thing and restored size CreativeWork are in initial HTML. Alolan Raichu still uses National Dex 26 rather than form ID 10100 in schema. No runtime head repair or React Router was introduced.

Gallery tests use deterministic PokeAPI mocks; upstream availability is not certified. The four-page sample does not certify every filter/version/optional-data combination.

## JavaScript and scaling

Kakuna has seven SSR islands: search hydrates immediately; learnset, encounters, gallery, promo, size and carousel hydrate when visible. The generated external JavaScript inventory is **311,744 bytes raw / 131,574 gzip**, across 15 files (about 304 / 128 KiB). Gzip figures compress each file independently; they are estimates rather than observed Render transfer sizes.

At a fresh 1440×1000 hero viewport, measured external scripts total **198,756 raw / 64,046 gzip bytes** (194 / 63 KiB). These comprise ReactDOM client, React/JSX runtimes, search and tiny anchor/link helpers. Scrolling loads all remaining widget files. Collapsed widgets still hydrate when their headers become visible. An additional **5,422 bytes of inline scripts** include Astro/bootstrap/menu code, separately from external totals.

| Chunk / group | Raw bytes | Gzip bytes |
|---|---:|---:|
| ReactDOM client | 185,936 | 58,439 |
| React runtime | 7,614 | 2,914 |
| Global search | 4,312 | 2,016 |
| Learnset | 72,332 | 51,775 |
| Size comparison | 20,370 | 6,868 |
| Encounters | 6,105 | 2,468 |
| Carousel | 5,761 | 2,350 |
| Gallery | 2,457 | 1,336 |
| Promo | 1,595 | 766 |
| JSX, anchor, link, disclosure, version and sprite helpers combined | 5,262 | 2,642 |

The learnset bundle contains original type/category image assets embedded as data URLs, explaining its unusually large compressed size. No production router or SEO component is bundled.

Kakuna HTML is **1,593,930 bytes raw / 119,132 gzip**, driven largely by the complete SSR carousel and serialized Pokémon index, plus interactive reference data. Search separately loads **1,428,192 raw bytes** of generated records on interaction. Carousel imagery outside the selected build assets references production; the optional gallery depends on PokeAPI and remote sprite hosts. Trainer assets retain original sizes.

Before full scale, evaluate a crawlable bounded carousel with progressive index loading, external badge assets and disclosure-triggered hydration where practical. Preserve useful SSR content and behavior while measuring. Adapted component copies need a synchronization policy during migration.

## Gaps and readiness

- Alolan Raichu inherits species biology and incomplete regional evolution restrictions from existing data/helpers. Shared prose is labeled; no form-specific facts were invented.
- Oak/GO note records are absent for the sample. Broad forms, branching evolutions and optional data remain unaudited. Admin-only size-review editing is not part of this port.
- Gallery availability and analytics transport depend on their external services/deployment setup.
- Phase 1B changes are not deployed. Render headers, redirects, status/MIME and deployed interactions still need acceptance on the separate test service.

The template is reusable and meets this four-page parity scope. It is **not yet certified for the full Pokédex**: address payload concerns, broader data coverage and deployed acceptance in a separately authorized phase. Production source/configuration remains unchanged.
