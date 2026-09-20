# Phase 1B parity inventory (before implementation)

Source of truth: current repository components, user screenshots and production `/pokemon/kakuna`. Phase 1 POC is the comparison baseline. Scope remains four Pokémon on `astro-migration`, all changes inside `astro-poc`.

| Area | Production | Phase 1 gap | Implementation decision |
|---|---|---|---|
| Header | Responsive Banner asset, 520px global fuzzy search, Menu: Pokémon dropdown | Text brand, no search/menu | Astro picture + native navigation; adapt search island using existing ranking/data records |
| Width/background/type | Dark #16171d, centered reference page, existing root typography | Narrow editorial layout, left alignment | Extract applicable production CSS/inline dimensions |
| Hero | Summary first (42rem), centered 250px artwork, H1, image badges | Side-by-side artwork/text | Astro markup matching order and alignment; no hero Dex number in current JSX |
| Abilities | Linked pills, hidden label | Full effects below names | Preserve descriptions as APPROVED difference, subordinate centered text |
| Stats | 300px chart, six bars scaled /255, threshold colors, total, EV yield | Plain table | Reuse production BaseStatsChart server-rendered only |
| Matchups | Weak To / Resists / Immune To with multiplier + badge | Text lists | Static badge groups using existing type helpers |
| Evolution | Compact artwork cards, Dex numbers, type badges, conditions, horizontal >=769px | Text list | Astro recursive cards; reuse evolution model and CSS |
| Analysis | Collapsible; three prose cards | Permanently open sections | Native details/summary; initial HTML prose and H3 children |
| Learnsets | Persistent all-generation selector, level-up/machine/tutor/egg columns, move/type/category links | Latest-only two-column table | SSR React filter island with full build-time learnset; preserve latest preview rows within the complete all-generation SSR default |
| Dex entries | Collapsible version labels + complete text | Absent | Static native accordion |
| Encounters | Persistent game selector, area grouping, expandable records, chance/level/conditions | Flat always-open records | Adapt production island to accept filesystem-loaded data; native accordion wrapper |
| Images | On-open PokeAPI request, recursive unique sprite gallery | Absent | Small adapted island; remote API optional, explicit loading/failure/retry state |
| Biology | Accordion, prose card, six biological facts | Open prose only | Static accordion; keep form-prose caveat |
| Promo | Etsy image between biology and Misc, selection and event helpers | Absent | Reuse component/tracking helpers, SSR selected ad with hydration; document selection policy |
| Misc | Catch rate, base experience, hatch counter | Absent | Static data |
| Size | Trainer selector, layering, calibrated artwork/corrections, mobile chart scrolling | Absent | Adapt existing SizeComparison with prop data and ordinary navigation; preserve calculation logic |
| Navigation | Pokémon sprite carousel; no separate footer in detail JSX | Generic footer only | Inspect/adapt carousel for anchor navigation; build-time index |
| Forms/extra data | Forms for Pikachu/Charizard/Raichu; optional Held Items/Oak/GO notes | Absent | Retain shared template, inspect available optional data; disclose remaining gaps |
| Links | Router links in SPA | Canonical anchors | Ordinary anchors; out-of-POC targets stay on production, no numeric Pokémon URLs |
| Semantics/SEO | Some repeated heading levels; client SEO effects | Astro-owned head, logical headings | Preserve Astro head and improve hierarchy without enlarging headings |
| Responsive | 1440 desktop, narrow/tablet, 390 mobile | Basic responsive layout | Screenshot and overflow/interaction checks at these sizes |
| State/history | Storage-backed selectors/accordions, SPA navigation | None | Preserve useful selector persistence; native document back/forward and native accordion keyboard behavior |

## Acceptance checklist

- [x] Match header, hero, stats, matchups, evolution and accordion order/spacing on Kakuna.
- [x] Preserve ability descriptions and hidden labels from existing data.
- [x] Search/menu, learnset/game filters, gallery, size comparison and navigation work.
- [x] Analysis, biology, Dex entries, default moves and encounters exist without JS.
- [x] Static SEO remains correct and singular; no Router or runtime SEO repair.
- [x] Verify all four POC routes, desktop/mobile, links, back/forward and no-JS.
- [x] Record screenshot evidence, shipped JS, intentional differences and remaining gaps.
- [x] Confirm no production file modifications; do not deploy or expand route families.

Completed for the four-page scope. See COMPARISON.md for measured payload, screenshot evidence, intentional differences, test results and remaining wider-migration limits. Native details provide no-JS reference access; seven SSR React islands provide stateful features. No Oak/GO records exist for these four Pokémon, and no standalone Related Links/footer is rendered by the current production detail implementation. Gender information is not displayed in the current production hero. No deployment or production edits were made.

