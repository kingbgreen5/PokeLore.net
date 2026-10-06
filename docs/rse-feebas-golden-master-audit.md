# RSE Feebas golden-master audit

This audit freezes the existing React/Vite implementation of `/rse-feebas-calculator` before any Astro route work. It adds no Astro implementation and does not modify production RSE calculator code.

## Scope and production boundary

The public route is `src/pages/RseFeebasPublicCalculatorPage.jsx` (with `RseFeebasPublicCalculatorPage.css`), using `RseRoute119FeebasMap.jsx` for map rendering. The route supports Pokémon Ruby, Sapphire, and Emerald through two paths:

- A local file input calls `File.arrayBuffer()` and then `parseEmeraldSave` or `parseRubySapphireSave` from `src/utils/emeraldSaveParser.js`.
- Game-information recovery uses Trainer ID plus a Dewford trendy phrase. Emerald uses `emeraldFeebasRecovery.js`; Ruby/Sapphire choose dead-RTC or working-battery recovery in `rsFeebasRecovery.js`. Working-battery calculation runs in `src/workers/rsWorkingBatteryFeebasWorker.js` when Workers are available, with a deterministic same-thread fallback.

All successful paths converge on `rseFeebasCalculator.js` (16-bit value → six accepted internal spot IDs → raw Route 119 coordinates). `rseFeebasDisplayRules.js` translates internal IDs to player-facing locations: six inaccessible IDs render nowhere, while ID 132 renders as ten under-bridge fishing positions. `rseFeebasPublicCalculator.js` deduplicates exact physical locations and builds possible-set recommendations. `feebasPriorityMap.js` builds working-battery overlap/ranking/priority results.

There are no query parameters, network saves, server endpoints, localStorage reads/writes, date/time inputs, or random inputs in the public route’s result pipeline. The file is processed locally and cleared from the input after parsing. The initial route state is Emerald, save-file mode, working-battery selection, Exact map mode, tiered priority rendering, and the all-tiles priority filter.

## Parser and game handling

`emeraldSaveParser.js` accepts a 128 KiB raw Gen III save or the 16-byte mGBA RTC-appended variant. It validates the sector signature, logical IDs, profile-specific checksum spans, and complete slot structure, then selects the newest valid slot with rollover handling. It reconstructs SaveBlock1 by logical sector order and confirms the direct logical-sector Feebas offset matches the reconstructed value.

Emerald and Ruby/Sapphire are distinct profiles, not automatic game detection. The selected UI game determines which parser profile runs. Emerald reads the Feebas value at SaveBlock1 `0x2E6A` / logical-sector offset `0xF6A`; Ruby/Sapphire reads `0x2DD6` / `0xED6`. Both expose the Trainer ID and five stored Dewford trend structures. Unsupported sizes, malformed sectors, corrupt checksums, missing complete slots, and reconstruction failures return structured invalid results rather than an exact map.

## Algorithm, phrase, and candidate semantics

The shared Route 119 calculation takes exactly four hexadecimal characters, advances the documented LCRNG until it has six accepted results, rejects only internal IDs 1–3, preserves duplicates, and maps accepted IDs 4–447. A generated internal ID is not rerolled merely because it is inaccessible to the player.

Emerald normal-RNG recovery begins after the production 700-advance minimum, matches the phrase from the condition modulo, word-group bit, and second-word modulo, then returns the first five matching candidate values in scan order. Extended exact-value diagnostics retain the same stream and can identify a match beyond candidate five. Easy Chat source data is audited for 69 condition, 45 lifestyle, and 54 hobbies entries.

Ruby/Sapphire dead-RTC recovery uses the `0x05A0` boot seed and timing gaps 2 and 3. Working-battery recovery enumerates every low 16-bit TID state for both timing gaps (131,072 states), applies any additional phrase filters, deduplicates values only after preserving all matching recovery states, and sends all unique values into the shared overlap pipeline.

## Route 119 and presentation semantics

The Route 119 dataset has a 40×140 coordinate grid, 447 internal spot IDs, and 444 mapped coordinates (IDs 4–447). The checked-in full canonical mapping fixture has SHA-256 `E98F9E4CD50B47F2FB36E42338393491F7848E86B82BF0ED3189383A52BDA040`; `rseRoute119CanonicalMappingGuard.test.js` compares every mapping entry, not only sentinels. The production map uses a 32 px cell coordinate system, grid overlay, optional background image, zoom, accessible labels/titles, and an in-map missing-image message.

Exact results use player-facing locations; duplicate physical locations are merged. Hint areas are deterministic 4×4 selections of fishable tiles around an exact location, with a deterministic FNV-like seed tie-breaker. The map defaults to Exact. Possible Emerald/dead-battery sets retain per-set results and deterministic recommended tiles. Working-battery mode uses ranked overlap counts, ties sorted by y then x, and relative priority thresholds: high `>= ceil(max × .67)`, medium `>= ceil(max × .34)`, low otherwise.

The user-visible errors checked in the route include invalid/missing Trainer ID, missing Dewford words, unknown battery state, no matching candidate patterns, wrong selected game/save format, malformed local `.sav`, worker errors, and map image failure. A successful save is exact; recovery modes deliberately produce candidate sets or priority results, not an asserted single exact location.

## Golden fixture and test coverage

`src/test/fixtures/feebas/rseGoldenMaster.json` is machine-readable and intentionally contains only expected values. `src/utils/rseFeebasGoldenMaster.test.js` invokes existing production code; it does not implement a second calculator. It freezes:

- Representative exact values including ordinary mapping, duplicate internal result preservation, the under-bridge display override, and a known Emerald value.
- Invalid Feebas value validation.
- The first five Emerald recovery candidates and an extended exact-match rank.
- Valid synthetic Emerald and Ruby/Sapphire saves with profile-specific offsets, plus unsupported-size and malformed-save paths.
- Route dimensions, audit state, and mapping sentinels.

Existing RSE tests additionally cover RNG fixtures, rejected internal IDs, all-map canonical equality, inaccessible display behavior, full 10-cell under-bridge behavior, parser slot selection/rollover/checksums/mGBA extension, Easy Chat decoding, dead-RTC and working-battery recovery, worker-compatible result semantics, priority sorting/filtering, and editor helpers.

The targeted suite was run unchanged plus the new golden suite:

```powershell
npm test -- src/utils/rseFeebasCalculator.test.js src/utils/rseFeebasPublicCalculator.test.js src/utils/rseFeebasDisplayRules.test.js src/utils/emeraldSaveParser.test.js src/utils/emeraldFeebasRecovery.test.js src/utils/emeraldFeebasRegressionGuard.test.js src/utils/rsFeebasRecovery.test.js src/utils/feebasPriorityMap.test.js src/utils/rseFeebasTileEditorUtils.test.js src/utils/rseRoute119CanonicalMappingGuard.test.js src/utils/rseFeebasGoldenMaster.test.js
```

## Evidence assessment and release gaps

**Core deterministic parity evidence: PASS.** The baseline and golden suite exercise the actual parser/profile, calculator, mapping, display, recovery, and priority modules with fixed expected outputs.

**Production audit sufficiency for migration: PARTIAL.** The deterministic core is sufficiently characterized to begin a future compatibility wrapper, but the repository contains no legitimate Ruby, Sapphire, or Emerald `.sav` fixture. Synthetic saves prove format/layout/selection behavior but are not independent proof from emulator or cartridge bytes. There is also no browser-level component test or screenshot baseline for the public route, worker-path timing, file-picker behavior, responsive layout, or map-image loading. Before declaring a migrated route release-ready, validate at least one non-sensitive real save for Emerald and Ruby/Sapphire (including an mGBA RTC-appended sample if supported), compare the rendered exact map and recovery modes in a browser, and retain those results as a manual release checklist rather than committing personal save data.

## Future Astro boundary

Reuse unchanged in a future client island: the parser, all recovery modules, shared calculator, display rules, public-result helpers, priority helpers, Route 119 data, Easy Chat data, worker, and map component unless a replacement proves identical structured outputs against this fixture. Astro can own only the static route shell, guide/FAQ content, metadata, and breadcrumbs. The island must retain the file input, browser-only File/Worker APIs, reset behavior, async states, errors, game/method/battery controls, map controls, and all result render branches. No save upload endpoint should be introduced.

Likely migration risks are changing the selected-profile boundary, accidentally rerolling inaccessible internal IDs, turning the 132 override into its raw coordinate, losing duplicate semantics, changing candidate order or recommendation tie-breaks, changing worker/fallback behavior, and static map-image path failures. The parity gate is strict expected-output equality from the golden fixture plus the existing complete mapping guard before presentation work is accepted.

## Astro build workspace rule

Astro's static build uses `astro-poc/dist/.prerender` as a temporary shared workspace. Never run overlapping Astro builds against the same `astro-poc/dist` directory: concurrent processes can replace prerender chunks while another build imports them, causing an `ERR_MODULE_NOT_FOUND` during route rendering. Run one build at a time and wait for its process to exit before inspecting `dist`, running verifiers, or starting another build.
