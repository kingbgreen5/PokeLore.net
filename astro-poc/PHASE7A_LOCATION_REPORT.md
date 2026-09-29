# Phase 7A — Location Detail-Page Migration and Stress Test

## 1. Existing production Location architecture

Production uses `src/pages/LocationDetailPage.jsx`, `src/utils/locationData.js`, `scripts/prerenderLocationPages.js`, and the existing CollapsibleSection, ItemLocationCards, PokemonSummaryCard, OaksNotes, and PokemonGoNotes components. The prerender flow embeds validated Location data into static HTML and preserves loading/error behavior for the client route.

## 2. Authoritative Location data sources

`public/data/locationsIndex.json` is the canonical registry. Per-Location records come from `public/data/locations/{slug}.json`; optional item, Oak notes, and Pokémon GO data are loaded from their corresponding directories. The normalization model is in `astro-poc/src/lib/locationData.js`.

## 3. Exact canonical Location count

1,098 canonical Location records.

## 4. Canonical routing rules

Phase 7A uses `/location/{slug}` with lowercase source slugs. The Astro static output is `location/{slug}.html`; Cloudflare normalizes a trailing slash with a 307 redirect.

## 5. Location field inventory

Source coverage includes name, display name, source ID, region, generation/game indices, areas, encounter method rates, encounter Pokémon, versions, levels, chances, conditions, optional location Items, and optional Oak/Pokémon GO notes. Shops and services are represented through Location Item methods where present.

## 6. Region/game/version semantics

The source preserves region and game/version records. The model retains version-specific encounter rows and does not flatten them into a timeless encounter list.

## 7. Location hierarchy/subarea semantics

The 1,098 canonical records remain independently routed source Locations. Areas, floors, rooms, and facilities are rendered as subareas within the parent page; no new routes were invented.

## 8. Encounter data semantics

Encounter rows preserve Pokémon identity, area, version, method, minimum/maximum level, chance, and conditions. Source methods include walking, fishing rods, surfing, headbutt, special slots, and other represented mechanics.

## 9. Encounter count distribution

Across the full catalog there are 64,456 encounter rows: 551 zero-encounter Locations, minimum nonzero 1, median 0, p75 60, p90 195, p95 282, maximum 1,214.

## 10. Unique routed Pokémon distribution

Unique routed Pokémon per Location: 551 zero, minimum nonzero 1, median 0, p75 10, p90 21, p95 29, maximum 189; 7,195 total unique Location-to-Pokémon appearances.

## 11. Item/shop/service semantics

1,113 Item relationships are available across Locations. Item links resolve through the frozen 1,877-Item registry, while versioned acquisition methods remain attached to each source Item row.

## 12. Move relationship semantics

No direct Location-to-Move relationship field is present in the authoritative Location records. Move-linked services are not invented by the Astro model.

## 13. Special facility/location semantics

Zero-encounter facilities such as Pokéathlon Dome and Battle Frontier remain valid pages with item/service content and factual summaries rather than being treated as missing Locations.

## 14. SEO summary architecture

SEO follows the production `locationSeo` behavior: name, region, content-aware Items/Pokémon labels, version context when concise, canonical URL, and a factual summary. The Astro model preserves this structure in static HTML.

## 15. Structured-data architecture

No unsupported geographic, address, or coordinate claims were added. The shared BaseLayout supplies the existing page metadata behavior.

## 16. Selected stress-test Locations

The 20-page stress set covers Great Marsh, Friend Safari, Mt. Coronet, Mt. Silver, Cerulean Cave, Poké Pelago, Seafoam Islands, Reversal Mountain, Johto Safari Zone, Pokémon Mansion, Celadon City, Kanto Route 2, Ultra Space Wilds, Lost Cave, Pokéathlon Dome, Akala Meadow, Aether Paradise, Unova Victory Road, Battle Frontier, and Hoenn Safari Zone. It includes encounter-heavy, zero-encounter, multi-area, version-specific, facility, item-heavy, and special-mechanic cases.

## 17. Astro Location model architecture

The model follows `source JSON → canonical registry → normalized locationModel → shared Astro template`. Core content is static; no Location-specific React island or duplicated registry payload was introduced.

## 18. Files created/modified

Created `src/lib/locationData.js`, `src/pages/location/[slug].astro`, `scripts/audit-locations.mjs`, `scripts/verify-locations.mjs`, `scripts/location-browser.mjs`, and this report. Updated `scripts/verify-build.mjs` to include the Location stress routes.

## 19. Stress-page HTML size measurements

The 20 stress pages range from 11,347 to 109,216 bytes. Median is 102,306 bytes, p75 104,208, p90 106,812, p95 108,734, total 1,641,018 bytes, gzip total 148,602 bytes.

## 20. Hydration/supporting-data measurements

Location-specific hydration is 0. Supporting Location JSON is 0. Encounter content is emitted as static HTML.

## 21. Projected full-catalog artifact size

The stress median is approximately 102 KB because encounter tables dominate large pages. A naive full-catalog projection is approximately 112 MB uncompressed HTML before shared-asset effects; this is a planning estimate, not a generated artifact.

## 22. Full catalog model-audit results

All 1,098 models succeeded. Fatal failures 0, duplicate routes 0, invalid slugs 0, missing summaries 0, broken Pokémon links 0, broken Item links 0, and broken Move links 0.

## 23. Broken/missing/ambiguous source-data cases

The source contains duplicate-looking encounter rows in some games and areas, usually representing separate source slots or conditions. They are documented in `evidence/locations/model-audit.json` and were not silently collapsed.

## 24. Local routing/404 results

All 20 canonical stress routes returned 200 from the Astro preview. Invalid Location routes returned real 404s. The local preview does not implement Cloudflare’s trailing-slash redirect; staging does.

## 25. JavaScript-disabled results

All 20 stress pages expose identity, region, summary, area context, encounters, and Item content in initial HTML. Essential Location content is not hidden behind JavaScript.

## 26. Responsive/browser results

The browser suite passed 320, 768, 1,440, and 1,920 pixel checks, including dense encounter tables, long names, item links, and zero-encounter facility pages.

## 27. Pokémon regression results

The frozen 1,352-route Pokémon verification passed.

## 28. Move regression results

The frozen 937-route Move verification and learner-tool tests passed.

## 29. Ability regression results

The frozen 313-route Ability audit and verification passed.

## 30. Item regression results

The frozen 1,877-route Item build and full HTML audit remained intact in the full Astro build.

## 31. Cloudflare staging version

Location Phase 7A deployed successfully as version `9c362bd0-a194-46cb-b322-c79cc34fb846`.

## 32. Live staging results

All 20 stress pages returned direct 200 responses. Representative pages retained title, description, canonical, static summaries, encounter content, and Item links. Staging returned `X-Robots-Tag: noindex`; invalid routes returned 404; trailing slashes returned Cloudflare 307 normalization.

## 33. Recommended encounter rendering architecture

Keep encounter identity, area, version, method, level, and chance statically rendered. For Phase 7B, add a small version/area filter island only if full-catalog generation demonstrates unacceptable HTML or usability costs. Do not duplicate Pokémon registries into hydration props.

## 34. Exact remaining work for Phase 7B

Review this report, resolve whether source duplicate encounter rows should be visually grouped, then explicitly authorize full generation of all 1,098 Location pages followed by exhaustive HTML and live route verification. Types and later families remain out of scope.

LOCATION FAMILY STATUS:
PHASE 7A COMPLETE — NOT YET FROZEN
