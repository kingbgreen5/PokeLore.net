# Phase 4A Move migration report

## 1. Production architecture

Production routes `/move/:moveName` through a lazy React `MoveDetailPage`. Core Move data, learner data, Pokémon index data, editorial notes, metadata, and the not-found view are resolved in the browser. Move detail pages are not included in the production postbuild prerender set.

## 2. Authoritative route source

`public/data/movesIndex.json` is the route manifest. Its slugs match both `public/data/moves/*.json` and the Move URLs in `public/sitemap.xml` with no additions, omissions, or duplicates.

## 3. Exact canonical count

The authoritative catalog contains **937** canonical Move routes. Phase 4A generates only 19 reviewed stress routes.

## 4. Stress set

The stress set is: 10,000,000 Volt Thunderbolt, Thunderbolt, Protect, Eruption, Population Bomb, Fissure, Seismic Toss, Quick Attack, Trick Room, Tackle, Leech Life, Knock Off, Curse, Aura Wheel, Sketch, Swift, Earthquake, Flower Trick, and Tera Starstorm.

## 5. Selection rationale

The set covers a long slug and missing learner file, maximum learner volume, one-learner and restricted moves, null power, null accuracy, OHKO and fixed damage, variable power, priority extremes, historical values, multi-hit behavior, unusual targeting, signature/form-dependent mechanics, and recent generations.

## 6. Data issues found

- 288 Moves have null accuracy and 338 have null power; these values cannot be presented as zero.
- 168 Moves contain historical values.
- 104 Moves have no generated learner file.
- Learner counts range from one to 1,246 canonical Pokémon. The largest source learner JSON is 2,825,048 bytes; Protect's source file is 2,780,322 bytes.
- Form learners must resolve through the canonical Pokémon registry. Unknown and numeric targets are unsafe.
- Upstream effect text can contain `$effect_chance` placeholders and requires resolution before rendering.

## 7. Fixes implemented

A shared Astro data model now validates canonical routes, preserves null semantics, resolves effect placeholders, derives latest and historical learner groups, validates Pokémon links, and produces static SEO. The shared template renders the full core page and a bounded learner preview. Generated compact learner payloads support historical browsing. Move trailing-slash and `.html` requests now receive explicit 301 redirects.

## 8. Visual parity

The Astro page follows the production hierarchy: centered detail column, Move title, type divider, category badge, prominent power/accuracy facts, supporting facts, effect panel, context pills, bordered detail disclosures, and grouped learner cards. The browser suite found no horizontal overflow in the tested layouts.

## 9. SEO and static output

Every stress page contains title, description, production canonical, robots, Open Graph, Twitter metadata, WebPage/Thing JSON-LD, BreadcrumbList JSON-LD, H1, core facts, effect text, generation context, and canonical learner anchors in the initial HTML. Unknown Move slugs are not generated and return a real HTTP 404.

## 10. Learner architecture

The initial document contains the exact learner total and up to 80 latest-game learner cards, capped at 20 per method. The only Move-specific React island fetches the compact payload when a visitor changes games or asks to show all latest learners. With JavaScript disabled, the useful latest-game preview remains available.

## 11. Payload behavior

Hydration props stay below 10 KB and contain only the payload URL, version labels, and initial selection data. Learner payload records contain `{id,name,displayName}` grouped by version and method. The 19 generated payloads total **1,900,069 bytes**; Protect is the largest at **630,450 bytes**, fetched only after interaction.

## 12. JavaScript-disabled result

All 19 stress routes passed no-JavaScript checks for static identity, facts, effects, SEO, context, bounded learner content, canonical links, and overflow. The long-name Move with no learner source renders a clear no-records state without requiring an island.

## 13. Responsive result

All 19 pages passed at 390 px. Protect, Curse, Population Bomb, and Tera Starstorm also passed at 768 and 1,440 px. The checks cover long names, large and tiny learner groups, unusual facts, selectors, disclosures, and horizontal overflow.

## 14. Production comparison

Thunderbolt, Protect, Fissure, Swift, Tackle, and Tera Starstorm were compared with live production. H1, type, category, power, accuracy, PP, effect, and generation matched the production source semantics. Deliberate differences are static delivery, real 404s, em dashes for null facts, and deferred complete learner data.

## 15. Invalid-route behavior

`/move/not-a-real-move` returns HTTP 404. Wrangler parsed all **1,354** redirect rules. `/move/thunderbolt/` and `/move/thunderbolt.html` return 301 to `/move/thunderbolt`; the clean route returns 200.

## 16. Performance measurements

The final build contains 1,373 pages and 6,823 files totaling **818,452,997 bytes**. The 19 Move documents total **502,019 bytes**. Their largest HTML is Knock Off at 39,007 bytes; the long no-learner route is 12,201 bytes and 4,430 bytes gzip. Total JavaScript is **315,885 bytes**, only 2,583 bytes above the Phase 3B baseline; the Move explorer chunk is approximately 2.2 KB. The full build and all structural verification completed successfully.

## 17. Remaining gaps

The Phase 4A island does not reproduce production's learner stat sorting or learner size chart. Those are optional parity candidates; core Move meaning, latest learner discovery, game switching, complete learner expansion, and SEO do not depend on them. Production Oak and Pokémon GO editorial files were absent for this stress set, so those optional sections were not exercised.

## 18. Exceptions and route semantics

No Move-specific rendering conditionals were introduced. Stress selection is a manifest, while all pages use one template and one data model. Z-Move `--physical` and `--special` records are distinct canonical source records rather than aliases. There is no Move numeric legacy registry, so no numeric Move redirects were invented.

## 19. Pokémon regression

All **1,352** canonical Pokémon documents, homepage, 404, sitemap parity, 1,350 numeric Pokémon redirects, four dynamic normalization rules, and both Pokémon catalog audits passed. Local Wrangler confirmed `/pokemon/14` still returns 301 to `/pokemon/kakuna`.

## 20. Scale decision

The shared template, route manifest, data model, static SEO, learner payload strategy, redirect behavior, real 404 behavior, responsive layout, and regression gates are ready for the full 937-route Move build. Phase 4A intentionally stops before enabling that expansion.

**A. READY TO GENERATE ALL MOVES**
