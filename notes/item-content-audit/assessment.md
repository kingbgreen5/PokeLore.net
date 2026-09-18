# PokéLore Item Specialized Content Audit

Audit date: 2026-09-17. Investigation only. No production files or behavior changed.

Read this assessment with [the complete measured inventory](inventory.md) and [the per-item JSON evidence](inventory.json). Reproduce the inventory with `node scripts/auditItemSpecializedContent.js`. The script reads local sources and writes only this report directory; it is not registered in the build. This is a repository audit, not external verification of every gameplay claim or a live crawl of Google indexing.

## Decision

Start with a compact, linked classic-fossil family module on 11 items. Distinguish the revived base from its later evolution by joining the curated fossil family to the evolution tree, never by displaying the entire `restoredPokemon` array as revival results. All 11 families pass the unique-base and Pokemon-index checks. Do not include the four Galar halves in this first module.

TM move-by-game data is useful, but a Machine Moves section already exists. Improve that section only if needed, rather than add another one. Its recorded rows are usable; a claim of complete coverage across all games is not supported. Broad evolution modules and exact numerical mechanics are not ready for automatic rollout.

## Population and Taxonomy

| Measure | Count |
| --- | ---: |
| Item detail JSON records | 2,177 |
| Items index records | 2,177 |
| Visible canonical item pages | 1,889 |
| Indexable under project item SEO rules | 1,889 |
| Item URLs in checked-in sitemap | 1,889 |
| Hidden/excluded records | 288 |
| Filename/name mismatches | 0 |
| Explicit item categories | 54 |
| Pockets | 8 |

All three visible populations reconcile by slug, not just count. Hidden records are the unreleased Dynamax Crystals: 300 crystal records, 12 visible. Crucially, the explicit `unused` category still has 122 visible/indexable records. The hidden helper is not a generic unused-item filter. Indexable means eligible under local code, not confirmed indexed by a search engine.

The complete 54-category inventory, counts, and examples are in inventory.md. It also contains all pocket and attribute counts and coverage matrices for every category and the meaningful overlapping groups below.

| Meaningful group | Visible count | Classification and examples |
| --- | ---: | --- |
| Explicit evolution category | 40 | `category.name=evolution`; Fire Stone, Prism Scale, Berry Sweet |
| Evolution candidate union | 48 | Explicit evolution category plus item references in chains/overrides; includes King's Rock, Metal Coat, Auspicious Armor, Leader's Crest |
| TMs | 230 | Name pattern `tm` + digits; TM00 through TM229 |
| HMs | 8 | Name pattern; HM01 through HM08 |
| TRs | 100 | Name pattern; TR00 through TR99 |
| Berries | 73 | Explicit berries pocket; Sitrus, Oran, Pomeg, Occa |
| EV-training items | 7 | Explicit effort-training category; Macho Brace and six Power items |
| Held battle core | 125 | Audit union of held-items, choice, bad-held-items, species-specific, type-enhancement; Leftovers, Choice Band, Metal Coat. Not a universal held-item taxonomy |
| Poké Balls | 38 | Explicit pokeballs pocket; standard-balls 18, special-balls 13, apricorn-balls 7 |
| Fossils | 15 | Explicit curated membership in fossilItems.js; Helix Fossil, Old Amber, Fossilized Bird. All are dex-completion, but that category has 17 records |
| Mega Stones | 47 | Explicit mega-stones; Charizardite X, Charizardite Y, Abomasite |
| Plates | 19 | Explicit plates; Flame Plate, Blank Plate, Legend Plate |
| Memories | 17 | Explicit memories; Fire Memory, Water Memory |
| Drives | 4 | Audit suffix match; Burn, Chill, Douse, Shock Drive |
| Gems | 18 | Explicit jewels; Fire Gem, Normal Gem, Fairy Gem |
| Mulches | 8 | Explicit mulch; all eight requested names exist |
| Incenses | 9 | Audit suffix match; Sea Incense, Luck Incense |
| TM materials | 222 | Explicit tm-materials; Aipom Hair, other Pokemon-named materials |
| Treasures | 38 | Explicit loot; category is the available project grouping, not a new price taxonomy |
| Key items | 392 | Explicit key pocket; spans gameplay, plot-advancement, event-items and others |
| Exp. Candies | 5 | Audit prefix match; Exp. Candy XS through XL |
| Rotom appliance candidates | 1 | Rotom Catalog; explicit seven-name audit search found no separate appliance item records |
| Dynamax Crystals | 12 | Explicit category plus release helper; 288 additional hidden records |

These groups overlap. Do not add them to obtain a total. Several labels are misleading as semantic rules: Auspicious Armor and Leader's Crest are under `picnic`; King's Rock and Razor items are `held-items`; Metal Coat is `type-enhancement`; Rare Candy is `vitamins`. Berry medicine is not the medicine pocket. `holdable` exists on only 175 records, so absence must not mean an item cannot be held.

There are 60 repeated display-name groups among visible records, including bag/held Z-Crystals, multiple Basement Keys and game-specific ball records. Inventory counts canonical slugs, not deduplicated English names. Future joins must use stable slugs/IDs, not display names.

Pocket counts: misc 871, key 392, machines 338, medicine 105, berries 73, pokeballs 38, battle 36, mail 36.

## Architecture and Sources

Paths below are repository-relative.

| Concern | Actual implementation/source | Audit implication |
| --- | --- | --- |
| Item pages | `src/pages/ItemDetailPage.jsx` | Fetches item plus optional sidecars; already renders Machine Moves, berry sections, Found On, TM-material Pokemon, notes and guides |
| Page data merge | `src/utils/itemDetail.js`: `mergeItemDetailData` | Curated acquisition replaces raw acquisition through nullish precedence; TM fallback can then supply missing text/acquisition |
| TM fallback | `src/utils/tmMaterialDetails.js`: `getTmMaterialDetail`, `applyTmMaterialFallback` | 222 material records supplement raw item data; presence is not independent source verification |
| Acquisition | `src/components/AcquisitionMethods.jsx`; `src/utils/itemAcquisitionGrouping.js` | Game grouping, compact restrictions, repeatability and typed related links already exist |
| Acquisition sources | `public/data/items/*.json`; `itemLocationsCurated/*.json`; `itemLocationsCurated.json`; `itemAcquisition/evolution_stones_acquisition.json` | Separate curated/source layers; stone acquisition describes obtaining items, not evolution mechanics |
| Acquisition generation | `scripts/buildItemLocationsCurated.js`, `migrateItemLocations.js`, `generateLocationItems.js` | Aggregate-to-per-item export, location matching, reverse location index. Do not treat reverse data as independent confirmation |
| Raw HTML | `scripts/prerenderItemPages.js`: `getCanonicalItemEntries`, `loadItemPageData`, `renderItemMain` | Uses same merge helper and hidden logic, with separate HTML renderers for existing specialized sections |
| SEO/visibility | `src/seo/seoConfig.js`: `itemSeo`; `src/utils/itemVisibility.js`; `scripts/generateSitemap.js`: `itemRoutes` | Visible records all pass project SEO indexability; hidden crystals excluded; invalid URLs have separate noindex behavior |
| Item index/generation | `scripts/fetchItemData.js`; `public/data/itemsIndex.json`; `src/pages/ItemsPage.jsx` | PokeAPI-derived category/pocket/effect/attributes/fling/held/machine fields; no general exact-mechanics schema |
| Machine mappings | `scripts/enrichItemMachineMoves.js`; item `machines[]`; `src/components/items/TmMoveDetails.jsx`; `src/utils/loadMovesData.js` | Machine ID, move and versionGroup are structured; existing Machine Moves already uses them |
| Berries | `scripts/fetchBerryData.js`; `public/data/berries/generated/details/*.json`; `src/components/items/BerryDetails.jsx` | Numeric cultivation/flavor/Natural Gift data, but HP/status/EV/PP battle effects remain prose |
| Evolution | `scripts/generateEvolutionChains.js`; `public/data/evolutionChains/*.json`; `public/data/evolutionMethodOverrides.json`; `src/utils/evolutionDisplay.js`; `EvolutionNode.jsx` | Trees have item/heldItem/trigger and condition fields; overrides mix structured additions with display text |
| Older evolution representation | `scripts/fetchEvolutionChains.cjs`; `public/data/evolutions.json` | Flat, less expressive; not an alternate complete item-evolution authority |
| Held relationships | item `heldByPokemon[].versionDetails[]`; `scripts/generatePokemonHeldItems.js`; `src/components/HeldItems.jsx` | Reverse index preserves rarity/version, but ItemDetailPage Found On currently shows Pokemon cards without those details |
| Notes | `public/data/oaksNotes/items/*.json`; `src/components/OaksNotes.jsx` | Curated sections, body text and links, not normalized mechanics |
| GO | `public/data/pokemonGo/items/`; `PokemonGoNotes.jsx` | Loader/render support exists, but zero item note JSON files |
| Related guides | `public/data/relatedLinks/items/*.json`; `RelatedLinks.jsx` | 20 nonempty link sidecars; navigation, not gameplay fact records |
| Crystals | `src/data/dynamaxCrystals.js`; `src/utils/dynamaxCrystals.js` | Explicit released raid associations already rendered; no reason to add duplicate sections |
| Fossils | `src/data/fossilItems.js`; `src/topics/FossilPokemonGuide.jsx` | Curated family/outcome associations already used in guide and item SEO, not a clean one-item/one-revival schema |
| EV guide | `src/pages/EvTrainingRoutesPage.jsx` | Six Power-item/stat pairs and Macho Brace calculation exist in code; other exact mechanics are explanatory text |

Relevant inspected tests: ItemDetailPage load/fallback/navigation/SEO tests; AcquisitionMethods and itemAcquisitionGrouping restriction/link tests; prerenderItemPages canonical enumeration, curated precedence, every-record rendering and specialized-content tests; evolutionDisplay/EvolutionNode overrides and form tests; sitemap and item-finalization tests. These test rendering/contracts, not comprehensive factual coverage by game.

## Field Coverage and Reliability

Every category and semantic group is measured in inventory.md. JSON retains each visible item and its flags, acquisition rows, machine mappings and candidate evolution edges.

| Field | Visible items with usable/nonempty value |
| --- | ---: |
| Effect, after fallback | 1,167 / 1,889 |
| Short effect, after fallback | 1,177 / 1,889 |
| Raw acquisition | 44 / 1,889 |
| Effective acquisition | 579 / 1,889 |
| Curated acquisition sidecar | 357 / 1,889 |
| Flavor text | 1,326 / 1,889 |
| Cost / positive cost | 1,889 / 1,226 |
| Category and pocket | 1,889 each |
| Nonempty attributes | 248 |
| Fling power / effect | 626 / 33 |
| Wild held-Pokemon relationships | 119 |
| Acquisition/material related Pokemon | 228 |
| Machines with resolvable move and version group | 338 |
| TM material data / nonempty recipes | 222 / 0 |
| Berry sidecars / nonnull mechanics | 73 / 64 |
| Base item-evolution references | 36 |
| Additional structured evolution references | 11 |
| Item links embedded in primary-method prose | 2 |
| Oak's Notes / GO notes / related-link sidecars | 22 / 0 / 20 |
| Acquisition location links | 333 |
| Acquisition repeatability / nonempty requirements | 579 / 444 |
| Explicit true versionExclusive flag | 61 |

Counts for evolution sources overlap. Across all three sources, 39 distinct items have references, versus 48 candidates. Only 29/40 explicit evolution-category items have base edges; 31/40 have some reference when additions and linked prose are included. Acquisition covers 33/40; Oak's Notes 1/40.

There are 2,353 effective acquisition rows. Every row has games, generation, method, type, location, boolean repeatable and boolean versionExclusive. There are 1,276 link-shaped locations and zero missing corresponding location JSON files, 1,199 nonempty requirements, 214 costs, 517 areas, 239 related-Pokemon lists, 200 source URLs, 142 move fields, four notes and two quantities. Eight rows have locationCandidates. Strings and unresolved matches are not links. Repeatability and game restrictions describe acquisition only, not the item's consumption or effect mechanics. A true versionExclusive count is not the total count of narrower game subsets; the existing helper also derives compact restrictions from games.

There is no general structured item effect-history, HP fraction, EV increment, catch bonus, type association or active/inactive-by-game schema in the item records. `gameIndices` (1,320 items) are identifiers, not mechanics history. Flavor version groups (1,326) attach prose to games; they do not normalize those claims. Evolution overrides have limited applicability tokens, machines have version groups, and wild held rows have versions: these are separate domain-specific structures, not substitutes for missing mechanic histories.

Cost zero is present data, not proof the item is free. Fling power is its own mechanic, not evidence for an item's primary effect. Sidecar file counts and valid-link counts likewise do not certify source accuracy.

## Module Matrix

GREEN means reliable for the narrowly stated output from existing structured project data; it does not imply every game is covered. YELLOW needs coverage/semantic work. RED needs new structured facts or prose interpretation. Candidate counts are project-defined populations, not guessed canon totals.

| Module | Eligible/candidate items | Reliable coverage | Source | Confidence | Recommended? |
| --- | ---: | --- | --- | --- | --- |
| Classic fossil base + later evolution | 11 | 11/11 unique family bases and valid Pokemon links | fossilItems + evolutionChains + pokemonIndex | GREEN, bounded | Phase 1 |
| All fossil revival/combination recipes | 15 | 11 classic family derivations; 0/4 explicit paired-input recipes | fossilItems | YELLOW | Normalize four Galar combinations first |
| Existing recorded machine rows | 338 | 338/338; 2,212 valid rows, no same-group conflicting moves | item machines + moves files | GREEN, recorded rows only | Keep/improve existing section, no duplicate |
| Complete TM move-by-every-game table | 230 TMs (plus 8 HMs, 100 TRs) | All have a mapping; full game coverage not established | same | YELLOW | Fill/version-audit gaps first |
| Complete item evolution relationships | 48 candidates | 36 base-item mappings; 39 with additions/prose links; completeness not certified | chains + overrides | YELLOW | Phase 2, allowlist only after fixes |
| Berry cultivation/flavor/firmness | 73 | 64/73; each numeric field covered for those 64 | berry mechanics | GREEN for scoped existing snapshot | Already rendered; no duplicate |
| Berry Natural Gift across generations | 73 | 64 snapshots; 0 normalized histories | berry mechanics | YELLOW | Existing display already warns about scope |
| Berry HP/status/PP/EV/type-resistance effects | 73 | 0 normalized effect records | item effect/shortEffect only | RED | No automatic exact-mechanic answers |
| EV-training complete mechanics | 7 | 6 stat mappings in page code; 0 complete versioned item records | EV guide + item prose | YELLOW for curation; RED for direct automation | Small structured dataset first |
| Generic held battle mechanics | 125 core category union | 0 normalized primary-mechanic records | effect/shortEffect | RED | No generic How It Works |
| Mulch exact effect and later-game functionality | 8 | 0 normalized mechanic histories; 8 prose effects | item effect/flavor | RED | Prioritize manual data work for Gooey Mulch |
| Related-mulch navigation | 8 | 8/8 explicit membership | category.name=mulch | GREEN | Optional links, not a new factual answer section |
| Ball catch mechanics | 38 | 0 structured modifiers/conditions/histories | effect/flavor | RED | No |
| Mega Stone to base/Mega form | 47 | 0 explicit item-to-form foreign keys | item prose + Pokemon varieties | RED | Curated join needed |
| Plate/Memory/Drive/Gem/type boost mechanics | 19 / 17 / 4 / 18 / 22 | 0 dedicated item-type/effect records | categories + names + prose | RED | No name-based inference |
| Material drop sources | 222 | 222 populated; independent gameplay-verified coverage unknown | generateTmMaterialData | YELLOW | Validate generator assumptions before expanding |
| Material recipes | 222 | 0/222 nonempty usedFor | tmMaterialDetails | RED | New recipes required |
| Wild held chances by game | 119 | 5,448 version rows; 5,037 resolve in current Pokemon index; 86 items have no unresolved rows | heldByPokemon + Pokemon index | YELLOW | Resolve form/availability issues, then enrich Found On |
| Released crystal raid associations | 12 visible | 12/12 curated | dynamaxCrystals data/helpers | GREEN | Already rendered; no duplicate |
| Incense/breeding mechanics | 9 suffix-selected | 0 typed breeding rules/history | item prose | RED | No |
| Exp. Candy amounts / Rare Candy exceptions | 5 + Rare Candy | 0 typed amounts or versioned exceptions | item prose, vitamins category | RED | No |
| Healing/PP/revival items | 13 / 4 / 5 category counts | 0 normalized restore-rule schema | prose; item.cost is separate | RED | No repetitive sections |
| Treasures/sale prices | 38 loot | No versioned merchant/sell-price schema | cost and prose | RED | No sale table from cost |
| Key items/Rotom Catalog | 392 key-pocket; 1 Rotom candidate | No general structured unlock/appliance mapping | category/prose | RED | No generic module |

Battle consumables (`stat-boosts` 9, `miracle-shooter` 24), nature mints (21), species candies (80), tera shards (18), Z-Crystals (29), cooking/sandwich/picnic records, mail and miscellaneous categories have category membership but no independently normalized specialized rule sets in this audit. No specialized module recommended. Category grouping alone is not enough to justify more content.

## A. Evolution Findings

The primary tree generator uses `chainNode.evolution_details?.[0]`. It preserves `trigger`, `item`, `heldItem`, gender, time, location, minHappiness/minBeauty/minAffection and other conditions from that one entry. It does not preserve all alternate methods or a version/form applicability table. The old flat evolution file also takes the first method and is less expressive. A varieties list is not a mapping of each variety to an evolution method.

| Requested item | Base edges | Structured additions | Main limitation |
| --- | ---: | ---: | --- |
| Fire Stone | 5 | 0 | Default-species edges omit explicit regional conditions; effect prose also omits Capsakid despite its tree edge |
| Water Stone | 6 | 0 | Recorded direct edges usable; game availability is not encoded |
| Thunder Stone | 4 | 3 | Regional outcomes plus later alternative location/item methods |
| Leaf Stone | 5 | 1 | Regional outcomes and Leafeon alternative |
| Moon Stone | 6 | 0 | Recorded direct edges usable; no per-game applicability |
| Sun Stone | 5 | 0 | Regional outcome conditions not attached to edges |
| Shiny Stone | 4 | 0 | Form variants must not all inherit a default-species rule |
| Dusk Stone | 4 | 0 | Includes form slug aegislash-shield; use route/display helpers |
| Dawn Stone | 2 | 0 | Gender explicitly stored: Kirlia 2, Snorunt 1; preserve the condition |
| Ice Stone | 1 | 2 | Only Cetoddle in base tree; Glaceon/Crabominable additions do not fill regional-form omissions |
| Prism Scale | 0 | 0 | One item link in Milotic primary-method prose; Feebas tree only records Beauty 170 |
| King's Rock | 2 | 0 | Trade + held item; Slowpoke regional applicability not resolved |
| Metal Coat | 2 | 2 | Trade edges plus Legends: Arceus item additions |
| Upgrade (`up-grade`) | 1 | 1 | Same trade/direct-use distinction; exact slug matters |
| Dubious Disc | 1 | 1 | Same |
| Razor Claw | 2 | 0 | Sneasler incorrectly shares default parent name sneasel in tree; day/night recorded, form qualification missing |
| Razor Fang | 1 | 0 | Night held-level condition recorded; no full game-specific alternatives |
| Reaper Cloth | 1 | 1 | Trade/direct-use distinction |
| Protector | 1 | 1 | Trade/direct-use distinction |
| Electirizer | 1 | 1 | Trade/direct-use distinction |
| Magmarizer | 1 | 1 | Trade/direct-use distinction |
| Sachet | 1 | 0 | Structured trade + held item, no availability history |
| Whipped Dream | 1 | 0 | Structured trade + held item, no availability history |

All rows above are YELLOW for a complete game-aware module. Simple recorded use-item edges (Water/Moon stones, for example) are deterministic as individual relationships, but this audit does not certify an exhaustive list across all forms/games. Do not advertise 36 mapped items as 36 fully supported pages.

Nine explicit evolution-category items have no usable item reference in any of these sources: seven Sweets, Chipped Pot and Masterpiece Teacup. Other pitfalls: Cracked Pot/Unremarkable Teacup default-form conditions; Peat Block's `full-moon` token must not be treated as ordinary time-of-day; Oval Stone's day/held-level rule; multiple outcomes for branch families. The tree has zero item-bearing edges with nonnull friendship or location conditions, which shows no represented combination, not proof there are no gameplay edge cases. Location alternatives occur in non-item base methods and overrides.

`additionalMethods[].appliesFrom` mixes generation strings and a game slug such as legends-arceus. It is not a universally safe chronological range: an alternative in one game cannot be extended to every later game. Milotic's override combines Beauty and trade in linked prose; Leader's Crest is a linked item in an opponent-held defeat condition, not necessarily an item used/held by the evolving Pokemon. Do not invert every item link into the same evolution rule.

Phase 2 needs explicit source form, target form, method, held/used role, AND/OR conditions, exact supported games and alternate rules. The current display helpers can inform rendering, but rendered strings should not become the data source.

## B. Machine Findings

All 230 TM, 8 HM and 100 TR records have at least one complete local machine row. All 2,212 rows have a move file and versionGroup; no duplicate item/version/move rows or conflicting moves within an item's version group were found. Keep item family and numeric identity together. The canonical requested TM026 is `tm26`, display name TM26. `normalizeItemName` handles hyphens/plurals but does not strip leading zeros: do not invent `/item/tm026`.

TM26 has 23 rows and four moves: Earthquake for its recorded older groups, Poison Jab in Let's Go, Scary Face in Sword/Shield, Poison Tail in Scarlet/Violet. Its static effect still says Earthquake; the current machine-description helper already substitutes a version-aware summary. TM229 has Upper Hand for Scarlet/Violet and The Indigo Disk despite null effect/shortEffect. HM01 has Cut in 19 groups. TR00 has Swords Dance for Sword/Shield. These demonstrate why item prose is not the mapping authority.

Recorded mapping coverage is not complete game coverage. TM26 lacks a BDSP row; across all TMs only TM10, 21, 27, 43, 49, 62, 63, 78 and 83 explicitly carry that group. No Legends Z-A machine group occurs. Scarlet/Violet has 229 machine records; DLC groups are partial sets, not exhaustive availability declarations. The generation classifier sends Japanese Red/Green and Blue groups to Other Games. Do not silently fill missing rows by assuming earlier mappings persisted.

Move links can use the stored move slug with `/move/{slug}`. Existing `TmMoveDetails` and prerender Machine Moves already implement this content. A compact table would be a replacement presentation, not an additional SEO module.

## C. Berry Findings

73/73 berry sidecars exist; only 64 have nonnull mechanics. Each of firmness, growthTime, maxHarvest, naturalGiftPower/type, size, smoothness, soilDryness and flavorPotencies exists on those same 64. Missing: Kee, Maranga, Roseli, and the six Golden/Silver Nanab/Pinap/Razz variants. Effects exist for 67/73; acquisition and Oak's Notes for 5/73 each.

Explicit subtype counts: baking-only 14, catching-bonus 6, effort-drop 6, in-a-pinch 9, medicine 10, other 5, picky-healing 5, type-protection 18. These can group berries, but medicine does not distinguish HP from status or PP. The affected stat/type is not a dedicated field. Natural Gift type is not the resisted attack type.

The eight requested berries all have cultivation mechanics. Sitrus/Oran HP recovery, Lum status cure, Leppa PP restoration, Pomeg/Kelpsy EV reduction, Occa resisted type and Salac stat boost are found only in effect prose. Zero of those eight has a normalized battle-effect record. Do not parse their percentages, numbers or type names into supposedly authoritative rules.

BerryDetails already renders What This Berry Does, Growth and Harvest, Contest/Cooking/Crafting, Legacy Battle Mechanics, physical properties and game descriptions. Its direct/held-use and uses-by-game heuristics use regular expressions over prose; they are not new structured evidence. Cultivation is explicitly scoped to Generation IV. Natural Gift display explicitly says generation changes are not modeled. These sections should not be duplicated or generalized across games.

## D-F. EV Items, Held Items and Mulches

All seven EV-training items have effects, flavor, acquisition, cost, attributes and fling power. All are marked holdable. The item schema has no affected-stat, added-EV, speed-multiplier or versioned effect fields. However, EvTrainingRoutesPage contains six explicit Power-item/stat pairs and a Macho Brace 2x calculation. This is partial reusable structure, not a complete mechanics dataset. The guide prose distinguishes +4 versus +8 eras while all six item effects describe +4. A numerical module must reconcile those sources and attach game scope before publication.

All twelve requested held battle examples were inspected: Leftovers, Black Sludge, Choice Band/Specs/Scarf, Focus Sash, Life Orb, Eviolite, Rocky Helmet, Assault Vest, Weakness Policy, Expert Belt. Their primary numerical rules and exceptions are prose. For example Focus Sash's text includes multi-hit/Future Sight qualifications without a version key; nothing in the schema tells a generator where those statements apply. Do not rewrite this into generic How It Works sections. Fling fields and wild held sources remain distinct facts.

Exactly eight mulches exist: Gooey, Growth, Damp, Stable, Rich, Surprise, Boost, Amaze. All eight have effects/flavor/fling/cost; four have acquisition (Gooey, Growth, Damp, Stable). None has curated Oak's Notes, typed mechanics, generation histories or a functional/inactive flag. Their later flavor entries mention unsuitable Hoenn soil/no effect, and older ones mention maniac sales, but these are version-tagged prose and do not establish a full functionality table. Category-based related mulch links are safe. Exact-effect/later-game answers require curated rules; do not extrapolate a regional text sentence to all later games. Gooey Mulch is a good small manual-data priority, not a reason to automate all mulches from prose.

## G-J. Balls, Fossils, Mega Stones and Type Items

Poké Ball, Great Ball, Ultra Ball, Quick Ball, Dusk Ball, Timer Ball, Heavy Ball, Beast Ball and Master Ball were inspected. No structured catch modifiers, target conditions or special-use exceptions exist. Numeric rules (including Heavy Ball's additive thresholds versus other balls' multipliers) are embedded in effect text. No version key governs those effects. Pokemon `catchRate` is species capture rate, not an item modifier. No catch module yet.

Fossils are explicitly listed in fossilItems.js: 11 classics and four Galar halves. Classic `restoredPokemon` mixes bases and later evolutions: Helix lists Omanyte and Omastar. For the bounded Phase 1 family module, use the unique member with no incoming evolution edge from another family member; show later evolutions separately. All 11 curated classic families satisfy that check and all links resolve. This is a structural derivation checked against both sources, not an array-order assumption. Old Amber is a singleton. Galar entries list two outcomes each, with pairing instructions only in `evolutionSummary` prose. No typed two-input recipe exists. Do not label both outcomes as independently revived from one half. An explicit pair/outcome dataset is needed for Phase 2.

47 Mega Stones have effect and flavor text but zero dedicated base-Pokemon/Mega-form links and zero acquisition sidecars. Charizard's varieties include Mega X/Y, but no item foreign key ties Charizardite X to one variety. Matching names would be inference; it is not GREEN. Version restrictions are also not structured here.

Plates (19), Memories (17), Drives (4), Gems (18) and type-enhancement items (22) can be located by category or declared suffix. Their associated type, form effects and boost amounts are not normalized. Blank Plate and Legend Plate warn against assuming every Plate is an ordinary one-type booster. Memories/Drives can affect a form or move; a slug-derived type does not describe that mechanic. None should get automatic type-mechanics tables yet.

## K. Additional Opportunities and Constraints

Wild held chances are more useful than new prose: item source data has 5,448 Pokemon/version/rarity rows across 119 items. Current Found On resolves only via pokemonIndex and discards unresolved entries. The audit finds 411 rows that fail that index/validity check, affecting 33 items; examples include regional/Totem/Mega form names. The remaining 86 items have no such failures. This check is only reference/schema validation: it does not verify that a form is actually encounterable in every stated game. Treat the whole module as YELLOW until route/form resolution and encounter applicability are checked; enhance existing Found On rather than duplicate Pokemon cards. `generatePokemonHeldItems` is a reverse copy, not independent corroboration.

TM materials deserve the same caution. The generator matches Pokemon names from item slugs and expands their evolution families. All 222 entries are populated and all `usedFor` arrays are empty. These generated assumptions should not become a second authoritative drop/recipe section. Existing material-source display already uses them.

Dynamax Crystals have explicit released status, raid Pokemon/type, acquisition summary, availability and occasional version notes. The 12 released items already have specialized UI and prerender content. Keep it. Acquisition/availability/version notes are partly prose, not a general event scheduling engine.

Oak's Notes (22), GO notes (0) and related guides (20) are content infrastructure, not uniform factual coverage. Notes such as Prism Scale's Feebas guide links add navigation, not a complete structured evolution method. Other categories should receive no new sections merely to increase word count.

## Representative Item Reports

| Item | Category; measured data | Potential module/source | Confidence and edge cases |
| --- | --- | --- | --- |
| Fire Stone | evolution; 76 effective acquisition rows; effect/flavor/cost/fling; 5 direct evolution edges | Pokemon evolution list from chains + overrides | YELLOW: default-species/form and game scope; Capsakid is in chain but absent from effect prose; do not multiply every variety into an edge |
| Prism Scale | evolution; 26 acquisition rows; effect/flavor/fling; Oak's Notes; zero direct item edges | Feebas -> Milotic with method alternatives | YELLOW: Beauty 170 is structured; trade with Prism Scale is linked display prose; needs normalized held-trade rule and game scope |
| Macho Brace | effort-training; 11 acquisition rows; holdable; effect/flavor/fling; related Pokemon in acquisition | Exact EV/Speed explanation from future structured EV rules | YELLOW for data work, RED for prose-only automation: 2x exists in EV calculator, half-Speed only prose; a restated effect adds little |
| Leftovers | held-items; no acquisition; heldByPokemon/version rarity; effect/flavor/cost/fling | Enrich Found On with game/chance, using heldByPokemon | YELLOW for broader held-source rollout; RED for primary-mechanic module: 1/16 recovery only prose, no rule history |
| TM026 (actual TM26) | all-machines; 23 machine rows, 4 moves; 3 acquisition rows | Existing Machine Moves, sourced from machines + local moves | GREEN for recorded rows, YELLOW for exhaustive table; missing BDSP row, numbering reused, tm026 is not canonical |
| Sitrus Berry | medicine, berries pocket; cultivation/Natural Gift/flavor mechanics; held sources; no acquisition | Existing berry details; future versioned HP question | RED for HP automation: fraction/threshold only prose; 64-berry mechanics coverage does not include healing amounts |
| Gooey Mulch | mulch; one acquisition row; effect/flavor/cost/fling | Future exact effect and functionality-by-game answer | RED today; acquisition is HGSS-scoped and cannot establish mechanic history; no structured multiplier or active flag |
| Master Ball | standard-balls; one acquisition row; effect/flavor/attributes; cost 0 | No new module until catch/use restrictions are curated | RED: guaranteed catch and exceptions are prose; zero cost is not a purchase offer |
| Rare Candy | vitamins; 10 acquisition rows; effect/flavor/attributes/cost/fling | No additional section currently warranted | RED: +1 level and happiness values are prose; no level-cap/evolution/game exception schema; not an EV-vitamin rule |

Counts above are effective merged acquisition entries, not unique locations or claims of exhaustive coverage. Exact rows are preserved in inventory.json.

## Phased Rollout

### Phase 1: One New Bounded Module

Implement only the classic fossil family module for the 11 checked classic fossils. This adds linked, explicitly separated revival/evolution facts to item pages rather than another paragraph of effect prose. Keep the current TM, berry and crystal sections; do not add duplicates. Safe related-mulch navigation is optional, lower value, and not a new factual module.

Proposed example output, not implemented:

> **Pokemon Revived From the Helix Fossil**
>
> Revived Pokemon: [Omanyte](/pokemon/omanyte)
>
> Later evolution: Omanyte -> [Omastar](/pokemon/omastar), level 40.

Implementation must verify unique root and all links, separate later evolutions, retain time conditions if showing them (Jaw/Sail fossils), and suppress the module if those checks fail. Do not assume `restoredPokemon[0]` always means revived base. Do not present game availability or revival lab locations without their own evidence. For Old Amber, show Aerodactyl without inventing a later evolution.

The TM table is already present as a section, so it is not a second Phase 1 module. Any later presentation cleanup should show explicit stored groups and mark coverage as recorded data. No blanket promise that all TMs are covered in every game.

### Phase 2: Repair Valuable Structured Gaps

1. Evolution data first: preserve all source methods; normalize Prism Scale; attach regional/form and exact game conditions; resolve held-trade versus direct use; then select a reviewed allowlist. Fire/Water/Moon/Dawn Stone and Prism Scale are useful evaluation cases, not preapproved complete datasets.
2. Add four explicit Galar fossil pair/outcome recipes and separate revived base from relatives in the fossil schema. Retain exact input roles.
3. Audit machine coverage against a declared per-game inventory, especially BDSP; retain TM/HM/TR separation and canonical slug rules. Improve the current table after gaps are resolved.
4. Normalize the seven EV-training items into a small per-game rules dataset, reusing six existing stat mappings and reconciling prose/calculator behavior. Add useful exact-mechanic answers only after this.
5. Fix Pokemon form resolution and verify encounter applicability before adding version/chance detail to Found On. Its data is useful, but syntactically populated rows are not sufficient.

### Phase 3: Selective Manual Curation

Prioritize Gooey Mulch and, if worthwhile, the eight-mulch group: record source, game, active/inactive status, exact modifier and exceptions. Next consider a small Berry battle-effect dataset or explicit Mega Stone/form mapping if there is demonstrated demand. Ball mechanics and held battle effects need versioned rules and are larger projects. Do not implement every category. Defer generic item prose, recipe generation without recipes, merchant prices from cost, and universal mechanic tables from flavor text.

## Audit Artifacts and Verification

Created only `scripts/auditItemSpecializedContent.js`, `notes/item-content-audit/inventory.json`, `notes/item-content-audit/inventory.md`, and this assessment. Inventory covers all 1,889 visible items, 54 categories, 18 overlapping semantic groups, and 38 coverage flags per item. The JSON also retains evolution rows and specialized diagnostics for traceability.

The script's read-only imports do not invoke production generators. No normal build integration was added. A production build is intentionally unnecessary for this audit and would run generators that write public data. The audit ran successfully; population sums, unique item identities, category/pocket denominators, coverage bounds, index/sitemap reconciliation, machine row validity, classic fossil roots and location-file resolution checks passed. An independent comparison with the production `getCanonicalItemEntries` helper matched every visible item slug. ESLint passed for the audit script. Production UI, source data, acquisition curation, routing, prerender output, SEO, sitemap and related pages remain unchanged.
