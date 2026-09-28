# Phase 4C — Move learner tools

1. **Scope.** Phase 4C restores learner stat sorting, filters, and a height comparison on the 937 canonical Astro Move routes. Production source files were not changed.
2. **Production audit.** Production supports National Dex order; BST, HP, Attack, Defense, Sp. Atk, Sp. Def, and Speed sorts; ascending/descending direction; min/max thresholds; Reset; stat values beside results; and a height chart with largest first, feet/inches labels, horizontal scrolling, and zoom controls.
3. **Static baseline.** The latest-game learner preview remains ordinary HTML. With JavaScript disabled, Move identity, facts, effect, disclosures, and up to 80 canonical learner links remain available.
4. **Activation.** Historical and complete learner tools load automatically when the learner section approaches the viewport. The island remains `client:visible`, and the static preview stays visible as its loading and no-JavaScript fallback.
5. **Data architecture.** Per-Move payloads remain identity-only. A shared `/data/pokemon/learner-facts.json` registry supplies routed stats, BST, height, weight, display name, and a local sprite path.
6. **Why shared data.** Repeating stats and size facts through 833 Move payloads would multiply the same Pokémon records across tens of megabytes. The shared artifact is 349,377 bytes raw and 51,661 bytes gzip, and browsers can cache it between Move pages.
7. **Requests.** Activating the tools makes two data requests: the selected Move's existing learner payload and the shared facts registry. It makes no per-Pokémon JSON requests.
8. **Canonical identity.** The facts registry is generated from all 1,352 canonical routed Pokémon models. Forms use their own slug, routed ID, routed stats, height, weight, and sprite selection.
9. **Missing data.** A missing learner facts join is omitted safely. Missing or non-positive height is excluded from the chart. Missing images leave an empty scale stage while retaining the canonical name and measured height.
10. **Game filter.** The existing ordered version-group selector remains the primary filter and uses the Move's recorded source version groups.
11. **Method filter.** A second selector filters the current game to Level Up, machine, breeding, tutor, form-change, XD purification, or another recorded method. Method headings and counts update with it.
12. **Sort fields.** The available fields are Base Stat Total, HP, Attack, Defense, Sp. Atk, Sp. Def, and Speed. National Dex number remains the default order.
13. **Sort semantics.** Numeric sorts support highest-first and lowest-first. Ties always resolve by routed numeric ID and canonical slug, so repeated renders and both directions are deterministic and forms sharing an ID remain distinct.
14. **Range filters.** Minimum and maximum thresholds apply to the selected stat. Choosing a new stat clears both bounds; Reset restores all methods, National Dex order, highest-first direction, and empty bounds.
15. **Grouping and counts.** Sorting happens within the selected game's method groups. The displayed result count deduplicates Pokémon that occur in more than one method.
16. **Chart semantics.** Matching production, the chart uses the deduplicated union of every recorded learner across every game and method. It is independent of the learner explorer's current filters, so historical learners and forms such as Tangrowth and Mega Venusaur remain represented.
17. **Chart presentation.** The chart restores production's corrected true-scale calculation using each routed Pokémon's height, sprite correction factor, visible image bounds, transparent bottom padding, and adaptive initial zoom. Ordering is corrected visual height, raw height, routed ID, then canonical slug. It retains the production title and description, feet/inches labels, canonical links, horizontal scrolling, Zoom out, Zoom in, Reset, and “One true scale at current zoom.”
18. **Automated validation.** `test-move-learner-tools.mjs` covers all seven fields in both directions, deterministic ties, method and threshold filters, distinct forms, all-generation union behavior, and imperial labels. `verify-moves.mjs` validates the shared artifact, all facts joins, BST sums, nullable size rules, complete all-generation chart populations, corrected visual-height ordering, and small hydration props across all 937 routes.
19. **Regression results.** The full build produced 2,291 pages. All 937 Move documents and 833 learner payloads passed; 1,350 numeric redirects and four dynamic rules passed; form semantics and catalog readiness report zero fatal/model failures. The local HTTP crawl reached all 937 canonical Move URLs with canonical internal links and real 404s. The browser suite passed 28 no-JS samples, 768/1440 responsive checks, complete learner interaction, filtering/sorting/chart behavior, links, Back navigation, and invalid-route behavior.
20. **Payload, deployment, and limitation.** Per-Move learner payloads are unchanged: 189-byte minimum, 13,206-byte median, 191,277-byte p95, 651,792-byte maximum, and 34,325,826 bytes total. Hydration props changed from 164/413/647/655 bytes (min/median/p95/max) to 214/463/697/705 bytes. Total built JavaScript changed from 315,581 to 319,960 bytes; the Move island changed from about 2.2 KB to 6,605 bytes. The deployment contains 8,556 files and 872,487,321 bytes. Cloudflare staging version `d3ec1984-744e-43ed-b85d-efc544e9cd96` passed live pages, data artifacts, interactive tools, and real-404 checks while retaining staging noindex. Live production comparison was attempted but `pokelore.net/move/thunderbolt` returned HTTP 503 during the run, so the production HTTP leg must be rerun when production is healthy; the audited production source behavior and complete local/live staging acceptance remain documented above.

## Representative commands

```bash
npm run build
npm run verify:move-crawl -- http://127.0.0.1:4325
npm run verify:move-browser -- http://127.0.0.1:4325 --local-only
npm run verify:move-browser -- http://127.0.0.1:4325
```
