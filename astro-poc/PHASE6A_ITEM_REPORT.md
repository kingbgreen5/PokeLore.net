# Phase 6A — Item Detail-Page Migration + Stress Test

Phase 6A intentionally stops before full Item generation. The model and representative Astro pages are ready for review; no production cutover or DNS change was performed.

## 1. Existing production Item architecture

Production uses `src/pages/ItemDetailPage.jsx`, loading `/data/items/{slug}.json` plus optional curated acquisition, Berry, Oak’s Notes, Pokémon GO, related-link, TM-material, fossil-chain, and Dynamax Crystal data. Specialized sections are selected through `src/utils/itemSpecialization.js`; machine descriptions use `src/utils/itemDetail.js`; production prerender support is in `scripts/prerenderItemPages.js`.

## 2. Authoritative Item data sources

The primary source is `public/data/items/*.json`, generated from PokéAPI by `scripts/fetchItemData.js`. Supporting authoritative/derived sources are `itemsIndex.json`, curated item locations, Berry detail files, evolution rules, fossil chains, Oak’s Notes, TM-material details, and the existing Pokémon/Move registries. These were reused rather than duplicated.

## 3. Exact canonical Item count

There are **2,177** source item records. **300 unreleased Dynamax Crystal variants** are hidden by the existing production visibility rule, leaving **1,877 visible canonical Item routes**.

## 4. Canonical routing rules

The canonical format is `/item/{source-name}` with extensionless URLs. Source punctuation is preserved. Examples include `firium-z--bag`, `dna-splicers--merge`, and `meteorite--2`; these are distinct source identities, not normalized aliases. No full catalog was generated.

## 5. Item field inventory

Coverage across 1,877 visible records: price **1,877**, flavor text **1,314**, effect **1,175**, short effect **956**, held-Pokémon records **119**, machine records **338**, Berry details **73**, curated acquisition **357**, and evolution relationships **7**. Source records also carry category, pocket, attributes, fling data, game indices, and optional historical flavor entries.

## 6. Category taxonomy and counts

The source contains **52** category names. Largest categories are all-machines 338, TM materials 222, unused 122, plot advancement 101, gameplay 83, picnic 81, species candies 80, held items 72, sandwich ingredients 59, vitamins 48, Mega Stones 47, evolution 40, loot 38, mail 36, Z-Crystals 29, and data cards 27. Pockets are misc 1,159, key 392, machines 338, medicine 105, berries 73, Poké Balls 38, battle 36, and mail 36.

## 7. Category-specific data requirements

Machines need Move joins and version-group context; Berries use Berry detail files; fossils and reviewed evolution items use specialized sections; TM materials use related Pokémon and crafting data; held items use attributes, fling, and held-by records; acquisition records vary by game and method. The shared template uses conditional sections.

## 8. Pokémon relationship semantics

Held-by and material/acquisition relationships are filtered through the frozen 1,352-route Pokémon registry. The model produced 597 canonical held-Pokémon relationships, with no numeric or unknown Pokémon links.

## 9. Move relationship semantics

Machine records are joined against the frozen 937-route Move registry. The model produced 2,212 canonical machine-to-Move relationships and never invents Move slugs.

## 10. Ability relationship semantics

The current Item source does not expose a useful direct Ability relationship. No Ability links were invented.

## 11. Evolution-item semantics

The model reuses the existing reviewed `evolutionItemRules` and canonical Pokémon routes. Seven Items have eight rendered relationships; source conditions and game scope remain attached where present. Fossil-chain rendering remains available through the existing specialization architecture for Phase 6B expansion.

## 12. TM/HM/TR semantics

Machines are represented by source machine records grouped by version group. There are 338 machine Items; `tm01`, `hm01`, and `tr01` were included in the stress set. Reused numbers are not collapsed into one timeless value.

## 13. Held-item semantics

119 Items have held-Pokémon data. Attributes, fling power/effect, consumable flags, and effects remain source-backed. No unresolved effect placeholders were found.

## 14. Berry semantics

73 canonical Items are Berries with generated Berry detail files. Berry details are rendered conditionally in the shared template; no separate Berry architecture was introduced.

## 15. Price/acquisition semantics

All 1,877 source records have a numeric cost field, including zero-cost and non-sold items. Curated acquisition exists for 357 records and retains game, location, method, repeatability, requirements, and version context. The first template reports source cost and curated acquisition without pretending a single value is universal across games.

## 16. Historical-value semantics

Historical flavor entries and version-group machine records are preserved in source data. The Phase 6A template does not flatten machine version groups or flavor history into unsupported universal claims. A richer historical disclosure can be added in Phase 6B where needed.

## 17. Relationship-count distributions

Held Pokémon: zero 1,758; median 0; p95 2; maximum 26; total 597. Machine Moves: zero 1,539; median 0; p90 2; p95 11; maximum 25; total 2,212. Evolution relationships: zero 1,870; maximum 2; total 8. These distributions strongly support static rendering.

## 18. Selected stress-test Items and why

The 20-page set covers ordinary held (`leftovers`), Berry (`oran-berry`), evolution stone (`fire-stone`), trade evolution (`reaper-cloth`), Poké Ball (`master-ball`), medicine (`potion`), battle item (`x-attack`), fossil (`old-amber`), TM/HM/TR (`tm01`, `hm01`, `tr01`), Mega Stone, Z-Crystal source variant (`firium-z--bag`), Plate, Memory, Drive, Incense, Ability Patch, key item, and TM material. It includes relationship-heavy, long-content, and punctuation-heavy cases.

## 19. Astro Item model architecture

`src/lib/itemData.js` reads the canonical source, applies the existing visibility rule, joins frozen Pokémon and Move registries, reuses reviewed evolution rules, and exposes SEO plus compact conditional relationships. `[slug].astro` contains presentation only. Core content is server-rendered static HTML.

## 20. Files created/modified

Created: `src/lib/itemData.js`, `src/pages/item/[slug].astro`, `scripts/audit-items.mjs`, `scripts/verify-items.mjs`, `scripts/item-browser.mjs`, and this report. Updated: `scripts/verify-build.mjs`, `package.json`, and the existing stylesheet through the Item page’s scoped style.

## 21. Stress-page HTML size measurements

The 20 stress pages range from **12,698** to **22,024 bytes**, with a median of **13,285 bytes**, total **283,842 bytes**, and gzip total **95,350 bytes**. `fire-stone` is largest at 22,024 bytes because its effect and specialized fossil/evolution content are longer than the ordinary pages.

## 22. Hydration/supporting-data measurements

Item-specific React islands: **0**. Item-specific hydration bytes: **0**. Supporting Item JSON embedded or fetched by the page: **0**. Only the shared global search island remains.

## 23. Projected full-catalog artifact size

Using the stress median, the projected 1,877-page Item HTML contribution is approximately **24,935,945 bytes (23.78 MiB)** before gzip. Relationship distributions do not indicate a need for lazy loading.

## 24. Full catalog model-audit results

**1,877** model successes; **0** fatal failures; **0** duplicate routes; **0** unresolved placeholders; **0** broken Pokémon links; **0** broken Move links. Source punctuation-heavy names are retained as valid canonical identities and are documented in section 25.

## 25. Broken/missing/ambiguous source cases

The audit flags 104 source names containing consecutive hyphens under a simplistic single-hyphen validator. These are legitimate source identities for form, bag/held, regional, and numbered variants; they are not broken routes. Unreleased Dynamax Crystal records are intentionally hidden by the existing production rule. Some records lack effects or short effects, especially unused/game-data entries.

## 26. Local routing/404 results

All 20 stress routes returned 200 locally. Trailing-slash normalization resolved to the canonical extensionless route. Invalid Item routes returned real 404 responses with no SPA fallback.

## 27. JavaScript-disabled results

All 20 stress pages showed Item identity, category, summary/effect, factual details, and applicable relationships with JavaScript disabled.

## 28. Responsive/browser results

Local and live browser checks passed at 320, 390, 768, 1,440, and 1,920 pixels with no page-wide overflow. Long names, relationship links, machine records, Berry data, and icons remained usable.

## 29. Pokémon regression results

The complete shared build verifier continued to pass the frozen 1,352-route Pokémon family, including canonical links, metadata, forms, and static content.

## 30. Move regression results

The complete shared build verifier continued to pass all 937 frozen Move pages and existing learner-tool checks. No Move architecture was changed.

## 31. Ability regression results

The complete shared build verifier continued to pass all 313 frozen Ability pages and the prior live Ability verification. No Ability architecture was changed.

## 32. Cloudflare staging version

The 20-page Item stress set was deployed successfully to staging as version **a3336d65-8c62-4f7c-95b9-bed3c36a137f** at `https://pokelore-astro-test.thebeakeh.workers.dev/`.

## 33. Live staging results

All 20 stress pages passed live direct 200 checks, static content checks, JavaScript-disabled checks, responsive checks, canonical normalization, invalid 404, and staging `X-Robots-Tag: noindex` verification.

## 34. Recommendation for Phase 6B architecture

Proceed with the same shared static template and full-catalog generation. Keep relationships compact and static. Add focused conditional disclosures for historical flavor, machine version groups, Berry mechanics, fossil chains, and curated acquisition rather than introducing an Item explorer or JSON payloads.

## 35. Exact remaining work for full Item generation

Phase 6B should switch `getStaticPaths()` from the 20 stress slugs to all 1,877 visible canonical slugs, add an exhaustive built-HTML catalog audit, verify full route parity and sitemap parity, run the full live Item sweep, and then obtain explicit review before any further family migration.

Phase 6A stops here as requested; the full Item catalog has not been generated.
