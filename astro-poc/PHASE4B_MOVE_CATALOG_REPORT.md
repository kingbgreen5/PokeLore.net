# Phase 4B full Move catalog report

Run date: September 27, 2026. Branch: `astro-migration`. Staging Worker version: `30130f6f-ef82-4ee6-911b-858e3bcf36c2`.

## 1. Expected Move route count

The authoritative `movesIndex.json` manifest contains **937** unique canonical Move slugs. Its records exactly match `public/data/moves/*.json` and the current production sitemap Move URLs.

## 2. Generated count

The shared `src/pages/move/[slug].astro` template generated **937** Move documents. The combined build generated 2,291 pages: 1,352 Pokémon, 937 Moves, homepage, and 404.

## 3. Route parity

Missing routes: **0**. Unexpected routes: **0**. Duplicate routes or canonicals: **0**.

## 4. Full Move model audit

All pages passed identity, slug, type, category, generation, PP, power, accuracy, priority, target, effect, effect chance, flags, historical values, learner data, version availability, machine data, structured links, heading, ID, and visible-value checks. Fatal model failures: **0**.

## 5. Nullable mechanics

The exact catalog counts are **288 null-accuracy Moves** and **338 null-power Moves**. All render an em dash instead of `0%` or zero power. Fixed, variable, status, and OHKO effects retain their source descriptions.

## 6. Historical values

Exactly **168 Moves** contain historical values. Every affected page renders a static Version History disclosure from the shared model.

## 7. Effect placeholders

Unresolved placeholders, raw template tokens, malformed interpolations, visible `undefined`, invalid `null`, `NaN`, or object stringification: **0**. The audit accounts for the legitimate Pokémon name Type: Null.

## 8. SEO verification

All 937 pages have exactly one title, description, canonical, robots directive, H1, Open Graph set, Twitter set, parseable JSON-LD graph, and BreadcrumbList. Canonical mismatches, trailing-slash canonicals, `.html` canonicals, staging hostnames, and browser SEO repair: **0**.

## 9. Learner links

Every source learner maps to the frozen 1,352-route Pokémon registry. Broken learner destinations: **0**. Numeric Pokémon hrefs: **0**. `.html` or trailing-slash learner links: **0**. Generated payload groups contain unique Pokémon cards per version and method.

## 10. Learner preview architecture

The latest available game group remains static and useful without JavaScript, capped at 80 cards and 20 per method. Complete and historical groups remain on demand. Sparse lists render normally. The 104 Moves without learner data render a clear static no-records message, no island, no fake data, and no empty payload.

## 11. Hydration props

Across 833 interactive pages: minimum **164 B**, median **413 B**, p75 **528 B**, p90 **630 B**, p95 **647 B**, p99 **654 B**, maximum **655 B**. No complete learner dataset is serialized into hydration props.

## 12. HTML size distribution

Minimum **11,001 B**; median **23,448 B**; p75 **29,152 B**; p90 **32,789 B**; p95 **34,495 B**; p99 **36,814 B**; maximum **39,347 B**. The 937 Move documents total **22,350,430 B**.

## 13. Largest Move pages

The 20 largest are Double-Edge 39,347 B; Knock Off 39,007; Toxic 38,645; Curse 38,441; Endeavor 37,899; Haze 37,560; Confuse Ray 37,091; Roar 37,003; Sunny Day 36,934; Solar Beam 36,814; Psychic 36,610; Rest 36,458; Spite 36,393; Substitute 36,032; Encore 36,012; Hyper Beam 35,920; Feather Dance 35,835; Protect 35,756; Light Screen 35,738; Blizzard 35,668. The largest measured gzip size among these is 12,010 B for Substitute.

## 14. Learner payload distribution

There are **833** optional learner JSON assets totaling **34,325,826 B**. Minimum **189 B**; median **13,206 B**; p75 **41,831 B**; p90 **106,310 B**; p95 **191,277 B**; p99 **470,030 B**; maximum **651,792 B**.

## 15. Largest learner payloads

The 20 largest are Rest 651,792 B; Protect 630,450; Substitute 565,037; Facade 563,392; Double Team 548,863; Toxic 525,800; Sleep Talk 479,616; Attract 474,888; Hidden Power 470,030; Swagger 463,105; Return 461,458; Frustration 461,148; Rain Dance 436,811; Sunny Day 427,887; Hyper Beam 369,121; Round 305,548; Snore 286,263; Endure 282,066; Giga Impact 262,956; Thief 256,305. All remain on demand.

## 16. Link crawl

Broken Move links: **0**. Broken Pokémon links: **0**. Numeric Pokémon links: **0**. Accidental `.html`, trailing-slash, empty, local-filesystem, localhost, or staging canonical links: **0**.

## 17. Invalid routes

Both `/move/not-a-real-move` and `/random-invalid-move-like-path` return real HTTP 404 responses locally and live. There is no SPA fallback or homepage substitution.

## 18. Dist file count

The final physical artifact contains **8,555 files**. Wrangler identified **8,575 logical upload assets**. This adds 1,771 physical files over the Phase 3B Pokémon-only baseline, primarily 937 HTML documents and 833 learner assets.

## 19. Artifact size

The artifact totals **872,034,867 B**, up 55,939,326 B from Phase 3B. JavaScript is 315,581 B across 16 files, an increase of 2,279 B. CSS is one 25,081 B file. The Move expansion adds no image assets; the complete artifact has 4,058 images totaling 230,420,722 B. The largest physical file remains `pokemon/magikarp.html` at 1,953,654 B.

## 20. Cloudflare assessment

The conservative Wrangler asset count leaves **11,425 files** of headroom below the Workers Free 20,000-file limit. The largest file is about 1.86 MiB, below the 25 MiB individual-file limit. Redirect usage is 1,350/2,000 static and 4/100 dynamic. The combined catalog remains comfortably deployable.

## 21. Durations

Final Astro generation completed in **4m 09s**; the complete build plus structural verification took about **5m 25s**. The exhaustive Move verifier took **11.7s**. The 937-route local HTTP crawl took **1.314s**. The representative local browser suite took about **35s**. Staging deployment took **49.0s**, including a 34.23s asset upload.

## 22. Browser sample

The browser suite passed 28 no-JavaScript pages: the original 19 stress routes plus nine distributed catalog samples. It also passed 390px mobile checks, difficult 768px and 1,440px layouts, full learner expansion, historical selection, browser Back, console errors, and overflow checks locally and live.

## 23. Production parity

Thunderbolt, Protect, Fissure, Swift, Tackle, and Tera Starstorm match production identity, type, category, power, accuracy, PP, priority, effect, generation, learner presence, disclosures, and visual hierarchy. Approved static-delivery and null-rendering differences remain.

## 24. Sitemap parity

Production sitemap Move URLs: **937**. Generated staging canonical manifest URLs: **937**. Missing: **0**. Unexpected: **0**. The staging manifest is saved in `evidence/moves/staging-move-urls.txt`; production sitemap was not modified.

## 25. Pokémon regression

All **1,352** Pokémon documents, navigation records, route parity checks, 1,350 numeric redirects, catalog audits, canonical links, and representative live routes remain clean. `/pokemon/14` still redirects to `/pokemon/kakuna` and the canonical route returns 200.

## 26. Live staging

Worker version `30130f6f-ef82-4ee6-911b-858e3bcf36c2` passed canonical Move samples, distributed/random catalog samples, large learner Moves, null mechanics, historical Moves, Shadow Rush, slash and `.html` normalization, both invalid 404s, Pokémon redirects, Pokémon canonicals, browser interaction, and `X-Robots-Tag: noindex`.

## 27. Remaining source-data gaps

The source has 104 canonical Moves without learner files and one canonical Shadow type without a badge image. Missing learner data is clearly represented without fabricated records. Shadow now uses a generic text badge fallback. Some learner records have no sprite, so their static cards omit only the unavailable image while preserving canonical identity and navigation.

## 28. Remaining blocker

There is no blocker in the Move family. Learner stat sorting and the learner size chart remain optional later parity features. No other page family was started.

**A. MOVE FAMILY COMPLETE — READY TO MOVE TO NEXT PAGE FAMILY**
