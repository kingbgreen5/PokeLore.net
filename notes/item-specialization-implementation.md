# Item Specialization Implementation

This release follows the audit's stop condition. It implements 11 classic fossil modules, eight scoped evolution relationships across seven items, all seven EV-training items, and related-mulch links on eight items. It does not claim complete evolution support and does not publish unverified mulch mechanics.

## Files

- `src/data/itemSpecializationRules.js`: reviewed rules, fossil chain IDs, evolution review allowlist, EV scopes, pending Gooey Mulch curation.
- `src/utils/itemSpecialization.js`: pure validation, fossil root derivation, shared section models.
- `src/components/items/ItemSpecializedSections.js`: one React renderer used by both the client and react-dom/server.
- `src/pages/ItemDetailPage.jsx`: optional fossil/index data loading, prerender-seeded sections, module placement and EV prose suppression.
- `scripts/prerenderItemPages.js`: loads the same source data, builds the same model, renders the same component and embeds the model for initial client rendering.
- `src/utils/itemSpecialization.test.js`: focused rules, scope, failure and exclusion tests.
- `src/components/items/ItemSpecializedSections.test.jsx`: React/raw HTML parity tests.
- This report. Earlier audit artifacts remain separate and unchanged.

## Fossils

Supported: Helix Fossil, Dome Fossil, Old Amber, Root Fossil, Claw Fossil, Skull Fossil, Armor Fossil, Cover Fossil, Plume Fossil, Jaw Fossil, Sail Fossil.

Excluded: Fossilized Bird, Fossilized Drake, Fossilized Dino, Fossilized Fish. No Galar combination is inferred.

The helper joins curated classic-family membership to its evolution chain and Pokemon index. It derives the unique member with no incoming edge from another family member; it never picks `restoredPokemon[0]`. It requires every member to be found, every Pokemon link to resolve, a single root and a complete tree. Missing/duplicate members, unexpected conditions, invalid levels and unknown times suppress the module. Later evolutions are separate rows, with level and day/night retained. Old Amber has only Aerodactyl.

Raw Helix Fossil HTML (formatting only added for readability):

```html
<section data-item-module="fossil-family" style="margin-bottom:2rem;overflow-wrap:anywhere">
  <h2>Pokémon Revived From the Helix Fossil</h2>
  <p>Revived Pokémon: <a href="/pokemon/omanyte">Omanyte</a></p>
  <p>Later evolution: <a href="/pokemon/omanyte">Omanyte</a> → <a href="/pokemon/omastar">Omastar</a> at level 40.</p>
</section>
```

## Evolution Rules

The normalized layer includes item, source/target species, explicit form identifiers and canonical slugs, item role, trigger, `conditions.all`, exact game groups, alternate-method records, coverage scope, provenance and review flags. No rule is generated from effect text or a raw tree at runtime.

Eight records on seven items are publishable for **Legends: Arceus only**:

| Item | Explicit relationships | Role |
| --- | --- | --- |
| Metal Coat | Onix -> Steelix; Scyther -> Scizor | Used directly |
| Up-Grade | Porygon -> Porygon2 | Used directly |
| Dubious Disc | Porygon2 -> Porygon-Z | Used directly |
| Reaper Cloth | Dusclops -> Dusknoir | Used directly |
| Protector | Rhydon -> Rhyperior | Used directly |
| Electirizer | Electabuzz -> Electivire | Used directly |
| Magmarizer | Magmar -> Magmortar | Used directly |

These relationships are explicitly present as item alternatives in `evolutionMethodOverrides.json`; their parent species are confirmed by the tree. The game-slug applicability is bounded to Legends: Arceus, never interpreted as all subsequent games. The renderer names that game and direct-use role on each row. It makes no universal held-trade claim.

Validation requires canonical source and target resolution, explicit forms, nonempty game scope/provenance, consistent role and trigger, and an exact match to the reviewed normalized record. Removing or mutating qualifiers fails validation. The current renderer additionally requires the supported condition-free, default-form, direct-use Arceus shape; adding a more complex rule cannot silently lose its conditions in this renderer. An incomplete set of an item's reviewed rules is suppressed.

Example:

```html
<h2>Pokémon That Evolve With Metal Coat</h2>
<p><a href="/pokemon/onix">Onix</a> → <a href="/pokemon/steelix">Steelix</a>. Legends: Arceus: use Metal Coat directly on Onix.</p>
<p><a href="/pokemon/scyther">Scyther</a> → <a href="/pokemon/scizor">Scizor</a>. Legends: Arceus: use Metal Coat directly on Scyther.</p>
```

The other 16 requested items remain unsupported: Fire, Water, Thunder, Leaf, Moon, Sun, Shiny, Dusk, Dawn and Ice Stones; Prism Scale; King's Rock; Razor Claw; Razor Fang; Sachet; Whipped Dream. Cracked/Chipped Pot and other unreviewed evolution items remain unsupported too.

Fire Stone, Dawn Stone and Prism Scale therefore have **no new evolution module and no specialized raw HTML**. Their existing content is retained. This is deliberate use of the requested stop condition, not a claim that they have no evolutions.

Specific remaining facts:

- Fire/Thunder/Leaf/Sun/Ice Stones: exact regional source and target forms, supported game sets and alternate location methods.
- Water/Moon/Dusk/Shiny Stones: reviewed complete game/form applicability rather than default-tree membership alone.
- Dawn Stone: gender is known in the tree, but complete scoped records are not reviewed. The male/female restriction must not be dropped to make it publishable.
- Prism Scale: a typed held-trade rule with exact games and its relationship to Beauty evolution. The current override mixes those methods in display prose.
- King's Rock: distinguish Slowpoke regional outcomes and game scope.
- Razor Claw: resolve Hisuian Sneasel versus the default Sneasel parent in the tree; preserve day/night and direct-use/held-level distinctions. Razor Fang also needs its game-specific alternatives.
- Traditional trade-held methods for the seven currently scoped items, Sachet and Whipped Dream: exact supported game sets; do not copy a Legends direct-use rule into other games.
- Cracked/Chipped Pot: explicit form identity and game scope. Similar source/target names are insufficient.

## EV Rules

All seven are explicit, manually normalized repository facts. The source is the existing EV guide/stat mapping/calculation, with the Power items' consistent half-Speed effects and Macho Brace's curated acquisition scope. There is no runtime extraction of numbers from prose.

| Item | EV effect | Battle Speed |
| --- | --- | --- |
| Macho Brace | 2x battle EVs | 50% of normal |
| Power Weight | Additional HP EVs | 50% |
| Power Bracer | Additional Attack EVs | 50% |
| Power Belt | Additional Defense EVs | 50% |
| Power Lens | Additional Special Attack EVs | 50% |
| Power Band | Additional Special Defense EVs | 50% |
| Power Anklet | Additional Speed EVs | 50% |

Power-item amounts: +4 for Diamond/Pearl, Platinum, HGSS, Black/White, Black 2/White 2, X/Y and ORAS. +8 for Sun/Moon, USUM, Sword/Shield, BDSP and Scarlet/Violet. These are closed game lists, not an open-ended "generation VII onward" assertion. Let's Go and Legends: Arceus are excluded.

Macho Brace's listed scope is Ruby/Sapphire/Emerald, FireRed/LeafGreen, Diamond/Pearl/Platinum, HGSS, Black/White, Black 2/White 2, X/Y, ORAS, Sword/Shield and BDSP. Omitted games are unclaimed, not declared mechanically inactive. No Scarlet/Violet availability is invented.

The earlier item Effect text's universal +4 wording conflicts with the explicitly versioned EV guide. The module uses the guide's stated +4/+8 distinction and replaces the generic Effect/Short Effect display on these seven pages. Source item JSON and SEO text remain unchanged. No EV cap, rounding, Pokerus stacking, availability or encounter-yield rules beyond this bounded scope are added. The existing metadata may still summarize old prose; it was intentionally not changed automatically.

Raw Macho Brace HTML:

```html
<section data-item-module="ev-training-effect" style="margin-bottom:2rem;overflow-wrap:anywhere">
  <h2>How the Macho Brace Works</h2>
  <p>Battle EVs: 2× the holder&#x27;s normal gain.</p>
  <p>Games: Ruby/Sapphire/Emerald, FireRed/LeafGreen, Diamond/Pearl/Platinum, HeartGold/SoulSilver, Black/White, Black 2/White 2, X/Y, Omega Ruby/Alpha Sapphire, Sword/Shield, Brilliant Diamond/Shining Pearl.</p>
  <p>While held in battle, Speed is reduced to 50% of its normal value.</p>
  <p><a href="/ev-training-routes">EV training routes</a></p>
</section>
```

## Mulch

No exact Gooey Mulch gameplay rule was added. Its pending record explicitly has `status: needs-curation`, empty `rules`, unknown `games`, unknown `active` and unknown `modifier`, plus a regrowth-count topic, provenance and missing-fact list. Unknown is not false/inactive. This record is never rendered as a factual answer.

The repository's unscoped "25% more times" sentence does not establish a game-specific regrowth count, rounding or later-game applicability. Regional flavor text about Hoenn cannot establish inactivity in all subsequent games. Required curation: verified numeric behavior and rounding for each supported game, and independently established active/inactive status for each later game. Other seven mulches similarly receive no mechanic rules until scoped facts are reviewed. No heuristic prose parsing or inferred scope is used.

All eight canonical mulch pages get related links derived from explicit `category=mulch` membership: Gooey, Growth, Damp, Stable, Rich, Surprise, Boost, Amaze. Each page links to the other seven and omits its self-link.

Gooey Mulch raw HTML contains navigation only:

```html
<section data-item-module="related-mulches" style="margin-bottom:2rem;overflow-wrap:anywhere">
  <h2>Related Mulches</h2>
  <p><a href="/item/amaze-mulch">Amaze Mulch</a></p>
  <p><a href="/item/boost-mulch">Boost Mulch</a></p>
  <p><a href="/item/damp-mulch">Damp Mulch</a></p>
  <p><a href="/item/growth-mulch">Growth Mulch</a></p>
  <p><a href="/item/rich-mulch">Rich Mulch</a></p>
  <p><a href="/item/stable-mulch">Stable Mulch</a></p>
  <p><a href="/item/surprise-mulch">Surprise Mulch</a></p>
</section>
```

## Preservation and Verification

Machine Moves, BerryDetails, Dynamax Crystal content and TM-material source content are unchanged and unduplicated. No RED mechanics generators were added. No routing, canonical, title, description, sitemap or fallback architecture changed. Build-generated unrelated public-file changes are removed before handoff.

Focused unit, item page, acquisition, prerender and evolution tests: **79 passing across eight files**. ESLint passes for all seven changed/new JavaScript/JSX files. React/raw HTML parity tests cover 12 representative pages. Desktop (1280px) and mobile (390px) browser checks cover fossils, Metal Coat, Power Bracer, Gooey Mulch and unsupported Fire Stone, with no horizontal overflow. Existing externally hosted item sprite loading is independent of these modules; a sprite failed to load in the local screenshot and was not changed.

The first full `npm run build` passed. Final verification reruns encountered Windows `UNKNOWN: open` errors in unrelated `generatePokedexTopics.js` and `generateEvTrainingRoutes.js` output writes, including a retry with expanded permissions. Those generators were not modified. The final code independently passed `npx vite build` and the complete `npm run postbuild` pipeline, including all 1,889 item pages.

A final scan of generated HTML found exactly 11 fossil modules, seven evolution modules, seven EV modules and eight related-mulch modules. Unsupported evolution items, Galar fossil halves and unrelated RED examples had none. Machine Moves, the Sitrus Berry main section and Dynamax Crystal content each appeared once in representative raw HTML. All unrelated generated public-data and sitemap changes were restored; only the scoped source/test/report work remains.
