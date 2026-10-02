# DPPt Feebas golden-master audit

This artifact freezes the currently deployed React/Vite calculator's deterministic core behavior before its Astro migration. It deliberately imports the existing production calculator, parser, tile map, and Great Marsh modules; it does not implement a second algorithm. No production calculator source or route was changed for this audit.

## Inventory and production boundary

The public route is `src/pages/DpptFeebasPublicCalculatorPage.jsx`, registered in `src/App.jsx`. It uses `src/utils/dpptFeebasCalculator.js` for lottery recovery and seed-to-tile calculation, `src/utils/dpptSaveParser.js` for local raw-save reading, `src/utils/dpptFeebasTiles.js` and `src/data/feebas/dpptFeebasFishableTiles.json` for the map, and `src/utils/dpptGreatMarsh.js` with `src/data/feebas/dpptGreatMarshPokemon.js` for Great Marsh results. Its visual components are `src/components/feebas/DpptFeebasMap.jsx` and `src/components/feebas/DpptGreatMarshResults.jsx`; their CSS, the Mt. Coronet image, breadcrumbs, SEO component, Pokémon names/URLs, and `/data/pokemonIndex.json` supply presentation or metadata.

The browser-only surface is the file input and `File.arrayBuffer()` in `parseDpptSaveFile`; the parser creates `Uint8Array` and `DataView` views. No save bytes are fetched, posted, stored, or otherwise leave this code path. Great Marsh loads the static Pokémon index only to turn deterministic IDs into names/sprites/links.

The public route has no query parameters, storage, date/time source, or randomness. It defaults to Lottery Numbers, Hint map mode, and the background image enabled. The developer-only `/dev/dppt-feebas-calculator` is not part of the public route, but it does persist its visual-validation status and suggested-pair index in `localStorage`, and its optional generated validation pair uses `Math.random()`.

## Production semantics frozen here

`recoverDpptGroupSeed` accepts two five-digit, consecutive-day lottery observations in older-then-newer order. Each must be decimal-only; values over 65535 pass shape validation but are rejected as impossible RNG outputs. A valid pair can produce zero, one, or multiple candidates; candidate order is production order. The fixture includes one externally visually confirmed pair and the two-candidate `61249 -> 33671` case.

`calculateDpptFeebasResultsFromSeed` reads the raw unsigned seed bytes, divides them across four groups of 132 indexes, and produces **four** Feebas indexes/results. This is the actual production behavior; despite the audit request's reference to six tiles, no production path returns six Feebas tiles. Six is relevant to the Great Marsh's six areas. Negative signed display values retain their unsigned identity and a diagnostic signed-absolute alternate, but the public map uses the raw unsigned-byte result.

The Mt. Coronet coordinate system is 18 columns by 34 rows (612 cells): origin is top-left `(x:0,y:0)`, x increases to the right, y increases down. The dataset has 528 unique fishable coordinates and 84 excluded cells. The golden map checksum plus boundary sentinels detect mirroring, transposition, altered dimensions, group-boundary shifts, and tile-ID mapping changes. Exact mode highlights primary and alternate candidate tiles; Hint mode creates deterministic 16-fishable-tile offset search areas. Secondary candidates are shown in a distinct visual state.

The save parser accepts only a 512 KiB `.sav` file, validates either copy of a version-specific general block by CRC-16/CCITT, and selects the valid highest save-counter block (slot index breaks ties). Diamond/Pearl uses a `0xc100` block and `0x53c8` seed offset; Platinum uses `0xcf2c` and `0x5664`. Diamond and Pearl are intentionally one parser identity (`diamond-pearl`), so this implementation cannot distinguish them. Feebas math and map mapping do not branch by game. Great Marsh does branch: it derives six 5-bit values from the seed and maps them through distinct Diamond/Pearl and Platinum tables; a detected save version changes which table is shown first.

The UI clears previous exact results as soon as a new save is selected, and invalid save parsing leaves no candidate map/result. Invalid lottery submission displays the structured errors. Changing input tabs does not itself clear a previous result; Reset clears lottery form/results/detected save game. Map mode and background-image state persist during the mounted session. The map handles invalid supplied indexes by omitting them and rendering an alert caption, while a failed background image shows an in-map warning.

## Evidence and known limits

Existing production tests are `dpptFeebasCalculator.test.js`, `dpptSaveParser.test.js`, `dpptFeebasTiles.test.js`, and `dpptGreatMarsh.test.js`: 79 passed, no skips. The added golden suite has 28 tests; the combined targeted run has 107 passed, no skips.

The fixture covers boundary and representative unsigned seeds, signed-looking seeds, exact map indexes, a known visually confirmed lottery case, an ambiguous lottery pair, malformed/missing/out-of-range lottery values, Great Marsh boundaries and version tables, valid synthetic Diamond/Pearl and Platinum raw saves, and file/parser failures. Existing parser coverage additionally proves newer-valid-copy selection, corrupt-newer fallback, checksum failure, and lottery/save equivalence.

There is no legitimate full D/P/Pt save file in this repository. The save fixtures are deliberately marked synthetic and prove parser layout/CRC/selection behavior only; they are not independent evidence from a cartridge or emulator dump. No production UI component test was found for this route. The image alignment is covered by the tile tests, but visual screenshot/browser-layout regression is not part of this core harness.

The legacy signed-absolute diagnostic is intentionally retained in the core result. Historical validation data marks some old signed-absolute cases as externally mismatched, while raw unsigned results are the active production behavior. That is a documented production characteristic, not a change made here.

## Future Astro boundary

Reuse unchanged: `dpptFeebasCalculator.js`, `dpptSaveParser.js`, `dpptFeebasTiles.js`, `dpptGreatMarsh.js`, both DPPt data files, and the map/Great Marsh components unless a wrapper can prove equivalent structured output and map semantics. Astro can own static guide/FAQ/SEO/breadcrumb shell content. The React calculator island must own file input, browser APIs, calculator state, map state, `fetch('/data/pokemonIndex.json')`, and error/result rendering. There must be no server endpoint or save upload.

Risks during wrapping are client-only module timing, React hydration/state resets, static asset paths for the map and Pokémon index, route canonicality, CSS/grid layering, and any coordinate rendering change. The parity gate is strict deep equality of structured core outputs from this fixture before presentation changes are accepted.

Run it with:

```powershell
npm test -- src/utils/dpptFeebasGoldenMaster.test.js
```

Run all existing DPPt coverage plus the golden master with:

```powershell
npm test -- src/utils/dpptFeebasCalculator.test.js src/utils/dpptSaveParser.test.js src/utils/dpptFeebasTiles.test.js src/utils/dpptGreatMarsh.test.js src/utils/dpptFeebasGoldenMaster.test.js
```

The durable fixture is `src/test/fixtures/feebas/dpptGoldenMaster.json`. Future Astro work must use strict equality against these structured core results before UI comparison. A real D/P/Pt `.sav` file was not found in this repository, so save coverage is valid synthetic raw-save construction plus parser-error tests—not evidence from a real save dump.
