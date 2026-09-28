# Move migration audit

## Scope and production route

Phase 4A changes only `astro-poc/`. The production React/Vite application remains the reference implementation and was not modified. `src/App.jsx` lazy-loads `MoveDetailPage` for `/move/:moveName`; the `/moves` index uses `MovesPage`. Move detail routes are client-rendered and are absent from the production `postbuild` prerender list, which currently prerenders selected Pokémon, item, location, tool, and home routes. An unknown Move therefore reaches the React route and renders a client-side “Move not found” view after a failed data load rather than being represented by a route-specific static document.

## Authoritative routes

`public/data/movesIndex.json`, the filenames under `public/data/moves/`, and the Move URLs in `public/sitemap.xml` contain the same 937 unique slugs. There are no mismatches. The manifest uses the source `name` directly; names are not guessed from display labels. Distinct records such as Z-Move physical/special variants with `--physical` and `--special` suffixes are canonical records, not aliases. No separate Move alias or numeric legacy-route registry exists, so Phase 4A adds no numeric Move redirects. All 937 records are currently in the production sitemap and are treated as indexable canonical records. Only the 19 reviewed stress slugs are generated in Phase 4A.

## Data pipeline

`scripts/generateMoves.js` builds the Move datasets from PokeAPI resources and PokeAPI CSV data. It writes the compact index, one core file per Move, and one learner file per Move. Core files contain identity, type, category, power, accuracy, PP, priority, target, generation, effect chance, short/long effects, flavor text, meta mechanics, stat changes, historical values, machine items, and flags. The generator also resolves normalized flavor text and enriches machine and flag information.

Learners are derived from Pokémon learnsets and written to `public/data/moveLearners/{slug}.json`. They include a unique Pokémon list, every recorded method/version relationship, and method groups. Methods observed include level-up, machine, egg, tutor, form-change, and XD purification. Production merges these records with `pokemonIndex.json` in the browser. If a generated learner file is missing, it falls back to scanning the full `learnsets.json` dataset in the browser.

## Production browser behavior

`MoveDetailPage.jsx` fetches core Move data through `loadMoveDetail`, then separately fetches Oak's Notes, Pokémon GO notes, learner data, and Pokémon index data. Core facts, effects, learners, and invalid-route state therefore depend on JavaScript. Production uses React Router links, session-backed collapsible sections, stat filters/sorting for learners, machine cards, version history, in-game descriptions, and a learner size chart. `moveSeo()` supplies title, description, and canonical metadata through the runtime React SEO component.

The visual reference is a centered 1,120 px detail page with a large Move title, type divider, category badge, prominent power/accuracy stack, smaller facts, an outlined effect panel, pill context, and bordered disclosures. Learners use grouped Pokémon cards. Most layout rules are inline in `MoveDetailPage.jsx`; shared presentation comes from `src/index.css`, `TypeBadge`, `CollapsibleSection`, `PokemonSummaryCard`, `MoveMachineItems`, and `TypeSizeChart`.

## Data-model findings

- 288 of 937 Moves have null accuracy; null means not applicable or always-hit semantics and must not become `0%`.
- 338 Moves have null power; status, fixed-damage, OHKO, and variable-power mechanics must not become zero-power Moves.
- 168 Moves have historical values.
- 104 Moves have no learner records in the generated dataset.
- Learner sets range from one Pokémon to 1,246. The largest source learner payload measured 2,825,048 bytes (`rest`); `protect` has the most learners and a 2,780,322-byte source payload.
- Effects can contain effect-chance templates in upstream data. Generated text must be checked for unresolved `$effect_chance` tokens.
- Form learners use names from the completed canonical Pokémon registry. Unknown or numeric Pokémon targets are excluded rather than broadened to a base species.

## Astro architecture

`src/pages/move/[slug].astro` is the only Move detail template. Core identity, badges, facts, effects, context, stat changes, in-game descriptions, machine data, version history, and a bounded latest-game learner preview are static HTML. The latest preview contains canonical ordinary Pokémon anchors, method groups, exact totals, and up to 80 representative cards.

`MoveLearnerExplorer.jsx` is the only Move-specific island. Its hydration props contain the payload URL, version labels, and the latest version. Changing games or requesting the complete latest list fetches `/data/move-learners/{slug}.json`. The generated payload contains compact `{id,name,displayName}` learner records grouped by version and method; artwork, types, stats, and redundant source method records are not duplicated. The complete source remains authoritative in the parent repository.

Astro writes title, description, canonical, robots, Open Graph, Twitter tags, Move structured data, and breadcrumb structured data into the initial document. Canonicals always use `https://pokelore.net/move/{slug}`. Unknown slugs are not generated. Wrangler serves them as 404 and uses explicit permanent rules for trailing-slash and `.html` normalization.

## Intentional production differences

- Core content and metadata no longer wait for browser fetches.
- Unknown Move routes are real HTTP 404 responses.
- Null facts render as an em dash rather than a misleading zero.
- Large learner lists begin with a useful static preview and load complete historical data only after interaction.
- Native `<details>` preserves disclosure behavior without hydration.
- The learner stat-sort and size-chart features have not been copied into the Phase 4A island. The game/version learner explorer covers the high-value relationship browsing with a much smaller payload. This is the principal parity item to review before full generation.

## Issue classification

- **A — source data:** null facts, 104 Moves without learners, and source descriptions/history availability.
- **B — page model:** distinguish null from zero; choose the latest version; canonicalize forms; compact learner records.
- **C — rendering:** prevent placeholder tokens, invalid values, duplicate canonicals, and oversized static learner output.
- **D — responsive CSS:** long titles, fact stacks, disclosure widths, learner grids, and selectors.
- **E — island:** defer full learner data, preserve retry behavior, and keep props below 10 KB.
- **F — intentionally not copied:** client-side core loading, runtime SEO repair, HTTP-200 not-found rendering, and multi-megabyte initial learner datasets.
