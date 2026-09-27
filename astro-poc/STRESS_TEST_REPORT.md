# Phase 2B Pokémon template report

## Result

Both Phase 2 blockers are resolved without generating the full catalog, changing production source, changing routing, or deploying. The 30-route stress build, JavaScript-off browser run, interactive learnset test, routing/SEO verifier, form audit, and 1,352-route page-model audit pass.

## Form semantics

The Astro data layer now resolves a route to an explicit category, evolution behavior, and field inheritance policy before it builds the page. The authoritative evolution chain still supplies every node and condition. Semantics only decides whether the routed form participates, replaces a node, selects a regional branch, or shows the base relationship with a clarification.

The route audit found 327 non-default canonical names: the 325 source records previously reported plus shared-record aliases `frillish-female` and `jellicent-female`. Of these, 319 use deterministic rules, eight use documented overrides, and zero remain unresolved. Category counts are: 27 battle-state, 35 cosmetic, 4 environment, 6 gender, 34 Gigantamax, 27 item, 96 Mega, 28 permanent alternate, 59 regional, 1 stance, and 10 Totem.

Battle/state, stance, Mega, Gigantamax, cosmetic, item, environment, and Totem forms use a clarified base relationship and are not inserted as stages. Regional forms use existing regional branches. Gender and permanent alternates may replace their corresponding node. Regression checks cover Alolan Raichu, Deoxys Attack, Rotom Heat, Giratina Origin, Galarian Darmanitan, Dusk Lycanroc, gender forms, the three cosmetic-policy species, Palafin Hero, Aegislash Blade, Minior, Ogerpon, Mega Charizard X, and regional branches.

Analysis and Biology & Behavior are unsafe to inherit and remain omitted without explicit form prose. Pokédex entries, evolution, learnsets, and artwork are conditional. Direct routed facts remain safe. Encounters and size comparison do not fall back; absent data omits the section. Full policy and override maintenance are in [FORM_SEMANTICS_AUDIT.md](FORM_SEMANTICS_AUDIT.md).

## Learnset architecture

Before Phase 2B, the React island server-rendered all-generation rows and serialized the same complete `pokemonData` and `movesData` as hydration props. The initial document therefore paid for the dataset twice.

Now `LearnsetStatic.astro` renders the latest available level-up table, headings, type/category badges, and canonical move links directly into HTML. The React island receives only a local payload URL, version labels, default version, and static element ID. Selecting another game or “All Generations” fetches `data/learnsets/<slug>.json` and renders all existing methods, including `form-change`; no external API or React Router is involved. Game preference still uses local storage. JavaScript-disabled users retain the complete latest level-up reference table.

Verification caps learnset hydration props at 10 KB and rejects `pokemonData` or `movesData` in those props. Measured props are 670 bytes or less across the stress suite. The LearnsetCard bundle is 73,189 bytes, essentially unchanged because the same optional table UI remains available; the large data transfer is deferred until interaction. Prebuilt on-demand payloads range from 8,250 bytes for Kakuna to 538,136 bytes for Mewtwo.

## Page-size measurements

| Route | Before HTML | After HTML | Reduction | Before gzip | After gzip | Optional payload |
|---|---:|---:|---:|---:|---:|---:|
| Kakuna | 1,573,870 B | 1,535,843 B | 38,027 B (2.4%) | 119,031 B | 110,427 B | 8,250 B |
| Pikachu | 2,859,462 B | 1,551,638 B | 1,307,824 B (45.7%) | 204,236 B | 99,534 B | 316,240 B |
| Charizard | 3,430,152 B | 1,607,600 B | 1,822,552 B (53.1%) | 387,708 B | 118,077 B | 417,343 B |
| Eevee | 2,710,150 B | 1,581,757 B | 1,128,393 B (41.6%) | 228,762 B | 116,123 B | 227,038 B |
| Mewtwo | 3,842,379 B | 1,513,691 B | 2,328,688 B (60.6%) | 393,586 B | 97,371 B | 538,136 B |
| Ogerpon Wellspring Mask | 1,982,718 B | 1,502,696 B | 480,022 B (24.2%) | 178,866 B | 99,341 B | 133,569 B |

The remaining roughly 1.5 MB initial document baseline is largely other existing island data, especially the complete navigation carousel index. It is no longer caused by learnset duplication and is outside the two Phase 2B blockers.

## Verification

- `npm run build`: 32 documents, all static SEO/routing/content assertions, 1,350 numeric redirects, two normalization rules, generated local learnset assets, and lightweight hydration checks passed.
- `npm run verify:stress-browser`: all 30 pages passed with JavaScript disabled at 390 px; six difficult routes passed at 768 px and 1440 px; interactive Charizard switching fetched an alternate learnset, preserved move links/method groups, and restored the static latest table.
- `npm run audit:form-semantics`: 327 non-default canonical routes; 319 automatic, 8 override, 0 unresolved; no battle forms inserted as stages.
- `npm run audit:catalog-readiness`: all 1,352 canonical page models succeeded with 0 fatal records, 0 unresolved form semantics, 0 model failures, and 0 battle forms inserted as stages.

Initial HTML still contains name, summary, types, abilities and descriptions, stats, matchups, evolution, available Playthrough/Competitive/Nuzlocke prose, biological data, latest level-up moves, Pokédex entries, encounter links where available, and crawlable canonical links.

## Remaining source-data issues

These are visible optional omissions, not blockers: 158 routes lack complete explicit form analysis, 12 routes lack local manifest detail artwork and use routed sprites, 592 routes have no routed encounter locations, and 8 IDs have no sprite bounds. The source still lacks egg-group data. The eight explicit form overrides remain intentional reviewed exceptions and are checked by the audit.

No material blocker remains before generating the full Pokémon catalog. Generation was deliberately not started by this task.

**A. READY TO GENERATE ALL POKÉMON**
