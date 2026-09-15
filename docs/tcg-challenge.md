# Pokémon Card Challenge

Implemented at `/tcg-challenge`, linked from `/tools`. This is a static React/Vite tool with no backend, accounts, secrets or server persistence. The checked-in English cache contains **1,070 cards across 11 sets**. Only the manifest loads initially; starting/resuming a challenge loads its set and the existing Pokémon index. Card images load lazily. Learnsets and compact TM lists load on demand.

## Experience and integration

Choose a game/version group, card set and optional seed. Open a pack to display every card face down in a compact responsive grid. Either of the first two cards can be flipped first; later cards unlock one at a time after all preceding cards are revealed. Cards reveal in place, with expandable details and team actions. There is no Reveal all bypass. The grid and completion controls use the actual pack length. The next pack is available after the current pack is revealed. Opening frequency is entirely manual. One starting pack and one per badge are suggestions.

The six party slots expand into reserves instead of rejecting a seventh species. Removing a teammate preserves every pulled card. A paginated collection shows each distinct revealed card; repeated pulls remain in saved pack history. Evolution stages grant the depicted species directly. The simulator never filters by videogame availability. Species absent from a game's software may require a compatible modified game; missing learnsets do not block team selection.

Game identifiers come from `VERSION_GROUP_ORDER`, matching the existing Team Builder. Pokémon names, URLs, type badges and learnset filtering reuse existing utilities. A compact game-information panel links level-up and TM/HM moves to existing move pages, plus the Pokémon's full stats/evolution page. The team shows historical type changes for these first 251 species. Team analysis uses `/team-coverage?version=emerald&team=13-6-25` and the first six selections. The existing analyzer's availability, stats and matchup behavior is retained.

## Files and commands

| Location | Purpose |
| --- | --- |
| `src/tcg/packRules.js` | Per-set slot definitions, special IDs, exclusions, sources and confidence |
| `src/tcg/engine.js` | Seeded generator, weighted pools and validation |
| `src/tcg/storage.js` | Save schema, URL parsing and browser persistence |
| `src/tcg/energyRules.js` | Era-based Energy mappings and special Energy policy |
| `src/tcg/gameIntegration.js` | Early species' historical game types |
| `src/pages/TcgChallengePage.jsx` and `.css` | Setup, reveal, team, collection, journal and saves |
| `scripts/importTcgData.js` | Resumable TCGdex importer |
| `scripts/generateTcgRewards.js` | Per-game TM lists derived from existing movesIndex |
| `public/data/tcg/v1/sets.json` | Lightweight set manifest |
| `public/data/tcg/v1/{setId}.json` | Normalized cards, rules, explicit pools and weights |
| `public/data/tcg/v1/dex-index.json` | National Dex → all imported card IDs |
| `public/data/tcg/rewards/{game}.json` | Small, on-demand TM lists |
| `scripts/prerenderTcgChallengePage.js` | Crawlable production HTML using shared SEO configuration |
| `src/tcg/engine.test.js` | Data, determinism, special cases, rewards and save tests |
| `scripts/testTcgChallengeE2E.js` | Playwright browser workflow checks |

Run `npm run import:tcg` to import English TCGdex set/card endpoints. It uses six concurrent card requests, retries, timeouts and an ignored `.tcg-cache` directory. Re-running resumes from cached upstream responses; `npm run import:tcg -- --refresh` refetches. All datasets validate before normalized files are written. Builds use committed data and **never fetch TCGdex**. `npm run generate:tcg-rewards` runs in prebuild and uses only existing local move data.

The card schema retains ID, number, name, category, original rarity, holo status, image URLs, all dex IDs, Energy type, TCG types, illustrator, text, attacks and abilities. Market prices and vendor variants are omitted. Machamp remains in the species index for future Pokémon → trading cards pages even though it is excluded from Base Set boosters.

TCGdex's asset host timed out during testing. The UI therefore tries its artwork first, then a matching `images.pokemontcg.io/{set}/{number}.png` URL on failure or after five seconds without an image. No second card API is called. If both images fail, a named fallback keeps the card usable. URLs follow the [Pokémon TCG API image format](https://docs.pokemontcg.io/api-reference/cards/card-object/). Card fronts are not hosted locally and require network access. Booster wrappers and the English card back are optimized local WebP images. The artwork manifest loads separately and does not block challenge setup.

## Supported packs and historical model

All packs contain 11 cards. C = non-basic-Energy common; U = uncommon; E = basic Energy. Special Energy remains in its printed rarity pool.

| Set (TCGdex ID) | C / U / E / rare slot | Ordinary rare | Holo | Special |
| --- | --- | --- | --- | --- |
| Base Set (`base1`) | 5 / 3 / 2 / 1 | 2/3 | 1/3 | None; booster-ineligible Machamp excluded |
| Jungle (`base2`) | 7 / 3 / 0 / 1 | 2/3 | 1/3 | None |
| Fossil (`base3`) | 7 / 3 / 0 / 1 | 2/3 | 1/3 | None |
| Base Set 2 (`base4`) | 5 / 3 / 2 / 1 | 2/3 | 1/3 | None |
| Team Rocket (`base5`) | 7 / 3 / 0 / 1 | 2/3 | 104/330 | Dark Raichu: 6/330, about 1:55 |
| Gym Heroes (`gym1`) | 6 / 3 / 1 / 1 | 2/3 | 1/3 | None |
| Gym Challenge (`gym2`) | 6 / 3 / 1 / 1 | 2/3 | 1/3 | None |
| Neo Genesis (`neo1`) | 6 / 3 / 1 / 1 | 2/3 | 1/3 | Darkness/Metal are special Energy, not basic-slot cards |
| Neo Discovery (`neo2`) | 7 / 3 / 0 / 1 | 2/3 | 1/3 | None |
| Neo Revelation (`neo3`) | 7 / 3 / 0 / 1 | 2/3 | 98/330 | Shining: 12/330 total, about 1:27.5 |
| Neo Destiny (`neo4`) | 7 / 3 / 0 / 1 | 2/3 | 1/4 | Shining: 1/12 total |

Composition has separate confidence metadata from collector-estimated odds. Sources: [Base through Neo Discovery, with each set's post linked in configuration](https://www.elitefourum.com/t/the-english-pokemon-card-rarity-guide/39762), and [Neo Revelation/Destiny reconstruction](https://www.elitefourum.com/t/the-english-pokemon-card-rarity-guide/39762?page=2). Independent Base Set composition research: [Pokémon Trading Card Sequences](https://www.cs.sjsu.edu/~stamp/cv/papers/pokemon.pdf). API schema: [TCGdex REST documentation](https://tcgdex.dev/rest).

Dark Raichu shares the holo sheet; its six positions are modeled separately. The remaining Rocket holos use seven positions for Dark Arbok/Dark Weezing and six for the rest. Revelation uses estimated six-position Shinings and seven-position regular holos. Destiny uses the ordinary-print 24:9:3 rare/holo/Shining estimate. These are not official published odds.

Within other pools, cards are uniformly sampled. This deliberately approximates individual sheet multiplicities, including Base Energy differences and the proposed lower frequency of Neo Genesis starter holos. Print-run differences, errors, sheet sequences and box guarantees are deferred. Basic Energy can repeat; other exact IDs are drawn without replacement. This approximates collation constraints without claiming duplicates were universally impossible. Holo/non-holo cards with different numbers remain distinct.

## Pack reveal order and artwork

The selector offers exactly **Suggested** (the default) and **Original Order**. Suggested starts with the historical blocks, moves two non-rare Pokémon to the front, and puts the rare last. If fewer than two non-rare Pokémon were drawn, it deterministically replaces only the missing slots with unused Pokémon from the same common/uncommon pool. This guarantee can change those individual pulls; rarity counts and the rare pull are unchanged. Original Order retains the reconstructed historical arrangements below. Retired reveal settings and URLs map to Suggested for future packs. Already-opened packs and partial reveals keep their saved cards and order. Shared URLs include the selected presentation version.

Representative face-up order before a collector's card trick:

| Sets | Order |
| --- | --- |
| Base Set | 5 common → 2 Energy → rare → 3 uncommon |
| Jungle, Fossil, Team Rocket, Neo Revelation, Neo Destiny | 7 common → rare → 3 uncommon |
| Base Set 2 | 3 uncommon → 5 common → rare → 2 Energy |
| Gym Heroes, Gym Challenge | 6 common → rare → 3 uncommon → Energy |
| Neo Genesis | Energy → rare → 3 uncommon → 6 common |
| Neo Discovery | 3 uncommon → rare → 7 common |

These blocks follow [Justin Keena's reconstruction from pack-opening videos](https://pokemonboosterpack.com/archive/pages/about). This source supplies presentation order only, not our pull odds. Base Set's two Energy cards are within its seven common-sheet cards; their exact positions and the order of blocks can vary. [Stamp and Stamp's study of 153 Base Unlimited packs](https://www.cs.sjsu.edu/~stamp/cv/papers/pokemon.pdf) documents box-to-box variation and common Trainers sharing common sequences. A Trainer-first reveal is therefore possible; there is no universal Pokémon-first rule. Exact sheet sequences, printing differences and every factory arrangement are not simulated.

`src/tcg/packPresentation.js` handles presentation and the Suggested guarantee, using a separate deterministic generator for any required substitutions. The base v1 generator stays unchanged. `src/tcg/packPresentation.test.js` checks all 11 arrangements, save compatibility and asset integrity.

The opener includes **41 original English booster wrapper scans** across all 11 sets, plus the [English card-back scan](https://archives.bulbagarden.net/wiki/File:Cardback.jpg), from Bulbagarden Archives. The curated `src/tcg/artworkSources.json` records original URLs and individual source pages. Run `npm run import:tcg-artwork` to download/cache those sources and create `public/images/tcg/*.webp` and `public/data/tcg/artwork.json`. Normal builds use these committed files without downloading them. Wrapper selection uses a separate seeded generator and does not affect pulls; wrapper editions are artwork variants, not separate odds models. Artwork credits are available in the UI. Original artwork remains the property of its respective rights holders.

## Seeds and saves

Example: `/tcg-challenge?game=emerald&set=neo4&seed=A7D92C18&model=v1`.

The PRNG hashes the JSON tuple `[modelVersion, game, setId, seed, zeroBasedPackIndex]` with 32-bit FNV-1a, then uses Mulberry32 draws. Seeds are case-sensitive ASCII letters, digits, `_` or `-`, up to 64 characters. Blank input receives a random hexadecimal seed. Reveal order, adding teammates and journal edits never consume random draws. Each pack can be regenerated directly from its index.

**Freeze v1's pool order, odds and algorithm.** Future model changes require a new version plus retained old data/engine support. The importer is a maintenance command: review regenerated v1 files before committing. Unsupported model URLs are rejected. Golden and serialization tests guard the existing sequence.

`pokelore:tcg-challenges:v1` stores challenge IDs, settings, seeds, names, ordered card IDs/pools per pack, reveal counts, teams and journals. Every action saves; reloading offers Resume, including partially revealed packs. Rename, delete and seed URL copying are supported. The URL shares the starting sequence, not private journal/team state. Browser deletion clears saves; there is no device sync. Storage failures are visible, and unreadable saved data is preserved rather than overwritten. Avoid editing the same challenge in simultaneous tabs; cross-tab merging is not implemented.

## Energy rewards

These are suggested house rules, using historical TCG assignments:

| Energy | Videogame types |
| --- | --- |
| Grass | Grass, Bug, Poison |
| Fire | Fire |
| Water | Water, Ice |
| Lightning | Electric |
| Fighting | Fighting, Rock, Ground |
| Psychic | Psychic, Ghost |
| Colorless | Normal, Flying, Dragon |
| Darkness (Neo) | Dark |
| Metal (Neo) | Steel |

Poison had not moved to Psychic, Dragon had no separate Energy type, and Fairy did not exist. References: [Grass history](https://bulbapedia.bulbagarden.net/wiki/Grass_(TCG)), [Colorless history](https://bulbapedia.bulbagarden.net/wiki/Colorless_(TCG)), [TCG type history](https://bulbapedia.bulbagarden.net/wiki/Type_(TCG)).

Double Colorless, Full Heal, Potion and Recycle Energy use Colorless. Rocket Rainbow uses the six basic Energy types; Miracle uses all Neo Energy types. These rewards use the types represented by the Energy, not its physical TCG effect. Darkness/Metal yield no matching types in generation-one games. No reward invents a TM: expanding Eligible TMs filters the site's machine records by selected version and mapped type. Empty lists are explicit, and Trainer effects remain Coming Soon.

## SEO, accessibility and testing

The main route uses shared `Seo`/`seoConfig`, is in the sitemap and receives prerendered HTML before the homepage build step. All query variants canonicalize to `/tcg-challenge` and set `noindex,follow` when React loads. Static hosting serves the same canonical for query variants; seed URLs are never generated in the sitemap.

Inputs have labels, card backs are keyboard buttons, announcements use live status, game information receives focus, and CSS honors reduced motion. The responsive collection was checked at 390px without horizontal overflow. No animation library was added.

Validation commands: `npm run test:tcg`, `npm run test:tcg:e2e` (run Vite on port 5187, or set `TCG_TEST_ORIGIN`), targeted ESLint, and `npm run build`. Browser tests include real fallback artwork, partial reveal/reload, seeded replay in a fresh context, teams, journals, learnsets, TM rewards, rename/delete, canonical/robots, mobile layout and reduced motion. No runtime TCGdex API request is permitted by the test.

Full-suite observation: two existing standalone Node test scripts are collected by Vitest but have no Vitest suites. A Pokémon detail test timed out in the full concurrent run; all 14 Pokémon detail tests passed on an isolated rerun. These unrelated test-runner issues were not changed.

## Deferred / next phase

Later TCG sets, Trainer effects, enforced evolution/challenge modes, error-print and box collation, printing/edition selection, save export/sync and Pokémon detail-page card galleries remain deferred. Next, user-test challenge pacing and add a save export/import feature; the existing dex index can then power card galleries without duplicating imported data. No later sets were implemented.


Grid reveal validation: 53 TCG unit tests and 
ode scripts/testTcgGridE2E.js cover initial locking, card two before card one, saved reveal indices, old prefix saves, sequential unlocking, team actions and mobile layout. The reveal helper supports 9/10/11-card packs; current v1 data and save pack-size validation remain 11 cards. Browser checks deliberately abort remote fronts to verify named-image fallback. The external image host timed out during this run.
