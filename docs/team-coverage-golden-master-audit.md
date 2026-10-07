# Team Coverage golden-master audit

Status: **Phase 10I complete — `/team-coverage` is frozen on noindex Astro staging.** The production page remains the behavioral authority and has no semantic diff.

## Production authority

- Route: `src/pages/TeamCoveragePage.jsx`
- Core: `src/utils/teamCoverage.js`
- Type chart: `src/constants/Types.js`
- Version order: `src/constants/versionOrder.js`
- Move loader: `src/utils/loadMovesData.js` (`/data/movesIndex.json`, with `/data/moves.json` fallback)
- Browser persistence: `src/hooks/useLocalStorageState.js`
- Version datasets: `public/data/teamCoverage/index.json` and the manifest-selected JSON file.

The page is also the authority for recommendation eligibility, scoring orchestration, sorting, pagination, URL canonicalization, and team mutation. Those functions are currently page-local and must be reused or deliberately extracted before any Astro wrapper begins; no independent reimplementation is allowed.

## Frozen observed defaults

- Version: `scarlet-violet`
- Party: six `null` slots
- Party move power: `0` (any); level cap: `50`; machine moves: excluded
- Recommendation move power: `60`; level cap: `50`; machine moves: excluded
- Recommendation sort: `custom-score`; coverage filter: `both`; focus type: `water`
- Legendary and trade-evolution filters: `hide`
- Desktop pagination: 20; mobile `max-width: 540px`: 12; page: 1
- URL precedence: canonical `version` / `team` takes precedence over local storage. Legacy URL aliases are read (`game`, `party`, `pokemon`) and rewritten to canonical parameters.

## Persisted keys

`pokelore:learnset-version`, `pokelore:team-coverage-party`, `pokelore:team-coverage-sort:v3`, `pokelore:team-coverage-recommendation-coverage-filter:v2`, `pokelore:team-coverage-focus-type`, `pokelore:team-coverage-move-power-threshold`, `pokelore:team-coverage-move-level-threshold:v1`, `pokelore:team-coverage-tm-learnsets:v1`, `pokelore:team-coverage-recommendation-move-power-threshold:v2`, `pokelore:team-coverage-recommendation-move-level-threshold:v1`, `pokelore:team-coverage-recommendation-tm-learnsets:v1`, `pokelore:team-coverage-legendary-filter:v1`, `pokelore:team-coverage-trade-evolution-filter:v1`, and `pokelore:team-coverage-recommendation-score-weights:v1`.

Malformed JSON restores the hook default; writes are attempted after every state change and storage events update the current tab's state.

## Page-local state and URL contract

| State | Default / source | Persistence and reset behavior |
| --- | --- | --- |
| Version | URL `version`, legacy `game`, then `pokelore:learnset-version`, then `scarlet-violet` | Canonicalized immediately to `version`; version change resets recommendation page only and retains party/filters. |
| Party | URL `team`, legacy `party`/`pokemon`, then `pokelore:team-coverage-party` | Six numeric IDs, hyphen-delimited; empty slots serialize as `0`; add/remove/clear reset page and update URL plus storage. |
| Party filters | hardcoded defaults then respective storage keys | Move power, level cap, and TM mode affect selected-party coverage; no query parameter. |
| Recommendation filters | hardcoded defaults then respective storage keys | Sort, need, focus type, recommendation move power/level/TM, legendary and trade filters reset page; no query parameter. |
| Recommendation page | hardcoded `1` | Not persisted or encoded. Clamped to available pages and reset by the controls above, party changes, version changes, or media-query changes. |
| Responsive page size | `window.matchMedia('(max-width: 540px)')` | 20 desktop / 12 mobile; a media-query change resets page to 1. |
| Loaded records | selected party IDs and browser fetches | One Pokémon data and one learnset fetch per distinct selected ID; records are keyed by numeric ID. |
| Selected version dataset | canonical selected version | Fetches `/data/teamCoverage/{version}.json`; prior state remains until the next fetch resolves. |

Canonical URL parameters are `version` and `team` only. `team` accepts up to six positive numeric IDs split on `-` or `,`; invalid tokens become empty slots. Legacy `game`, `party`, and `pokemon` are read then removed with a replace navigation. A user-driven version select uses normal push navigation; team updates use push when non-empty and replace when cleared.

No page code reads URL values for sort, filters, power, page, recommendation settings, or expanded UI state. Those values are deliberately storage-backed or ephemeral.

## Core semantics already covered by existing tests

`src/utils/teamCoverage.test.js`: 20 passing tests. It freezes damaging-move treatment, level and machine filtering, inclusive power threshold behavior, DLC learnset aliases, offensive coverage, defensive resistance/immunity aggregation, Fairy availability, and score component boundaries.

Known gaps to cover in the golden master: page-local candidate filtering/ranking, every sort mode, pagination, URL and local-storage interactions, data fetch errors, form candidates, and browser request behavior.

## Dataset universe

`public/data/teamCoverage/index.json` is authoritative and must exactly match `VERSION_GROUP_ORDER`. Its version groups include intentionally empty placeholder datasets (DLC/BDSP/Legends Arceus groups); empty counts are production behavior, not corruption. Run `npm run audit:team-coverage` to validate manifest order, paths, payload identity, declared counts, unique candidate IDs, and unindexed files.

## Data-loading behavior

Initial load requests `/data/pokemonRoutes.json`, moves, and exactly the selected version dataset. Each distinct selected party ID then requests its own `/data/pokemonData/{id}.json` and `/data/pokemonLearnsets/{id}.json`. Switching version requests the newly selected dataset; the page does not inline the full Team Coverage corpus.

## Production-browser evidence

Verified against root Vite at `http://127.0.0.1:5173/team-coverage`:

- A clean navigation returns 200, renders `Pokémon Playthrough Team Builder`, and immediately replaces the URL with `?version=scarlet-violet`.
- The default interactive UI exposes 11 select controls.
- A populated canonical URL such as `?version=scarlet-violet&team=25-6-0-0-0-0` renders the two populated party tiles, four add tiles, Clear Team, Change/Clear slot actions, and recommendation Add to Team actions. This confirms numeric team identity is resolved through the production record/learnset loaders rather than a display-name normalization path.
- The page source resets the recommendation page before all team changes, version changes, sort/filter changes, and breakpoint transitions; result page is additionally clamped when result count changes.
- Empty/zero-count indexed game datasets render the explicit unavailable-version branch; dataset fetch failure and malformed payload both enter the existing `Loading recommendations...` path because the page has no separately rendered fetch-error state or retry action. This is production behavior to preserve, not a migration fix.

## Phase 10H.1 recommendation parity

`src/pages/TeamCoveragePage.jsx` remained untouched. The permanent harness is `src/utils/teamCoverageRecommendationsParity.test.js`; it uses `src/test/helpers/teamCoverageProductionRecommendationOracle.js`, a test-only literal extraction of the page-local recommendation expressions. The oracle is deliberately independent of `src/utils/teamCoverageRecommendations.js`, so the production page remains the golden authority.

The harness compares every eligible ordered ID, every calculated score and component, fallback mode, and desktop (20) / mobile (12) page-two slice. It covers: empty and three-member teams; shared defensive weakness and offensive gap; strict/high move constraints; legendary and trade filters both ways; all four coverage filters; several focus types; default, coverage-emphasized, and zeroed weights; every UI sort mode; a synthetic equal-score/stat/coverage tie case; populated Scarlet/Violet, Emerald, Teal Mask alternate-form data; and an empty unavailable dataset.

One discrepancy was found and fixed only in the new module: its move-power helper did not preserve the page's `attackTypePowersByLevel` fallback when `attackTypePowerLevels` is absent. The module now follows the production fallback exactly. No production code was rewired.

Sort parity includes the exact chain: custom score → BST → coverage score → offensive missing-hit count → defensive missing-hit count → covered-type count → National Dex; statistic sorts use the statistic then National Dex; selected-type-first uses focus eligibility then the coverage chain. The explicit tie fixture freezes National Dex ascending as the final tie-break. Weight, form, and fallback parity are covered by the same oracle comparison.

Compact production-captured fixtures are at `src/test/fixtures/teamCoverage/teamCoverageRecommendationGoldenMaster.json`; they freeze counts, top 20 IDs, leading scores, and both visible page slices. Full candidate eligibility is intentionally asserted directly against the production oracle at test time rather than duplicating multi-hundred-ID lists in fixtures.

## Phase 10H.2 browser/page-state contract

The page-local orchestration deliberately remains in `src/pages/TeamCoveragePage.jsx`. The browser golden-master runner is `scripts/teamCoveragePageGoldenMaster.mjs` (`npm run test:team-coverage-page`); it starts the unchanged Vite application, observes actual requests, and exercises the rendered controls without adding runtime instrumentation.

| State | Default/source | Persistence and browser behavior |
| --- | --- | --- |
| Version | `scarlet-violet`; canonical `version`, then legacy `game`, then storage | `pokelore:learnset-version`; URL wins, legacy is replaced, change retains team and resets page. |
| Team slots | six empty slots; canonical `team`, then legacy `party`/`pokemon`, then storage | `pokelore:team-coverage-party`; URL wins, mutations write storage and canonical URL; clearing replaces history. |
| Recommendation page | 1 | ephemeral only; reset by team, version, sort/filter, and media-query changes; clamped when result count falls. |
| Page size | 20 desktop / 12 at `max-width: 540px` | `matchMedia` only; breakpoint transition resets page. |
| Party filters | power 0, level 50, TM excluded | respective local-storage keys; affect selected team coverage, not URL. |
| Recommendation filters | power 60, level 50, TM excluded, both, water, hide/hide, suggested sort | respective local-storage keys; each relevant control resets page; no query parameters. |
| Score weights | core defaults | `pokelore:team-coverage-recommendation-score-weights:v1`; storage-backed and consumed by the already-proven module pipeline. |
| Base/party data | browser fetches | initial `pokemonRoutes`, moves, and one selected version dataset; distinct selected IDs additionally fetch record and learnset JSON. |
| Loading/unavailable | selected version dataset identity/count | mismatched or failed dataset remains `Loading recommendations...`; zero-count valid dataset renders the unavailable-version branch. |
| Picker state | no active slot | ephemeral; opened by Add/Change and closed by selection/Close. |

The runner freezes clean-route canonicalization, canonical and legacy URL precedence over seeded storage, selected-party record/learnset requests, version retention of team, clear-team URL/storage behavior, pagination reset, 540px pagination size, storage-event updates, unavailable-version rendering, and fetch-failure loading behavior. It does not alter production routing, sitemap, or page code.

### Verified execution

The runner now launches Vite directly with the local Vite Node entry point on `127.0.0.1:4174` and `--strictPort`; it does not use `cmd`, npm shell wrappers, `taskkill`, or process-tree termination. Child stdout/stderr are retained for startup diagnostics. Each scenario has a 30-second upper bound, browser waits have concrete 20-second limits, and the final summary is printed after browser/Vite cleanup while `process.exitCode` communicates failure.

The prior apparent stall was not a lifecycle deadlock: the unavailable-version assertion expected `Legends Arceus`, while production's formatter renders `Legends / Arceus`. Splitting the cases made this visible. Both isolated cases passed, then two consecutive complete runs passed with `TEAM_COVERAGE_PAGE_GOLDEN_MASTER: PASS; scenarios=6; passed=6; failed=0`. The dedicated port had no listener after the second run. `vite-cleanup=not-running` means the exact owned child had already exited before the cleanup branch, not that an external process was killed.

The following contracts are now mechanically verified: clean canonical URL; legacy aliases; URL-over-storage precedence; selected-party record/learnset requests; clear-team persistence/URL; team retention across version changes; recommendation-page reset; responsive 20/12 pagination; storage events; zero-count unavailable datasets; and failed-dataset loading behavior.

## Phase 10I live Astro staging parity

The Astro route was deployed to noindex staging at `https://pokelore-astro-test.thebeakeh.workers.dev/team-coverage`.

- The live route returned `200 OK` with `X-Robots-Tag: noindex`.
- Its unhydrated HTML contains the canonical `https://pokelore.net/team-coverage`, the static H1, Team Coverage guide, no-JS notice, and the `TeamCoverageTool` `client:only` island. The Team Coverage corpus is not serialized into the document.
- Required runtime assets returned 200: Pokémon routes, moves index, coverage manifest, selected Scarlet/Violet dataset, and representative Pokémon/learnset records.
- The calculator hydrated with no console errors, no router or React runtime errors, and no `/[object Object]` request. Type badges render correctly; inlined badge assets remain valid data URLs and emitted badge assets (for example `/_astro/WATER.CrKDiUHq.png`) are valid route assets.
- The frozen browser runner was executed against the external staging target twice consecutively. Both runs passed all six scenarios: canonical URL and initial requests; URL/storage precedence plus legacy rewrite; party requests/version retention/clear; page reset/mobile pagination/storage event; unavailable version; and intercepted selected-dataset failure/loading behavior.
- A representative three-member Scarlet/Violet team (`25-6-7`) was compared side-by-side against production. Offensive coverage, defensive coverage, and weaknesses matched. All 11 sort modes had the same ordered visible mobile slice (12 cards); local parity already freezes the full 20-card desktop slice and tie behavior.
- Final regression rerun: 62 Team Coverage tests passed and the 30-version data audit passed (`23,037,813` bytes of separately loaded corpus). `src/pages/TeamCoveragePage.jsx` remains unmodified.
