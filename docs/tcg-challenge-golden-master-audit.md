# TCG Challenge production golden-master audit

## Authority and scope

The production authority is `src/pages/TcgChallengePage.jsx`, with pure game
logic in `src/tcg/`. This audit freezes that behavior before Astro integration;
the production component and its pack logic are not changed by the migration.

## Production files

- Page and CSS: `src/pages/TcgChallengePage.jsx`, `src/pages/TcgChallengePage.css`.
- Pack model: `src/tcg/engine.js`, `src/tcg/packRules.js`,
  `src/tcg/packPresentation.js`, and `src/tcg/reveal.js`.
- Game-specific challenge rules: `src/tcg/gameIntegration.js` and
  `src/tcg/energyRules.js`.
- URL and persistence: `src/tcg/storage.js`.
- Runtime data: `public/data/tcg/v1/sets.json`, eleven set files under
  `public/data/tcg/v1/`, `public/data/tcg/artwork.json`, reward files under
  `public/data/tcg/rewards/`, plus `/data/pokemonIndex.json` and per-Pokémon
  learnsets. Wrapper artwork and card back are local `/images/tcg/*.webp`.

## User-visible contract

The user selects a videogame, English vintage set, optional seed, and one of
two reveal presentations. Starting a run loads exactly the selected set and
the Pokémon index. A pack is 11 cards. The user reveals either of the first
two positions, then cards sequentially; another pack is locked until the
current one is fully revealed. Pokémon pulls may be added once each to an
unbounded saved team; the first six link to Team Coverage. There is no score
or win condition. The journal and collection/pagination UI are presently
commented out, so they have no live state contract.

"Saved challenges / New run" returns to the saved-runs screen without
deleting saves. Saved runs can resume, copy their canonical challenge URL,
rename, or delete after confirmation. Selecting another set applies only when
starting another challenge; a run retains its saved set.

## Set inventory and data identity

Canonical cards are identified by their set-prefixed `id` (for example
`base1-70`), not display name. Each file records `number`, `name`, category,
rarity, `dexIds`, and image/fallback URLs. All committed datasets validate
against their configured pools. Counts are: Base Set 102; Jungle 64; Fossil
62; Base Set 2 130; Team Rocket 83; Gym Heroes 132; Gym Challenge 132; Neo
Genesis 111; Neo Discovery 75; Neo Revelation 66; Neo Destiny 113.

Each set has seven common, three uncommon, and one rare-position slot; Base
Set and Base Set 2 replace two commons with repeatable basic Energy, and Gym
Heroes/Gym Challenge/Neo Genesis replace one. Non-Energy exact IDs are unique
within a pack. Trainers share their printed rarity pools. The rare position is
2/3 rare and 1/3 holo minus any special chance; Team Rocket has a 6/330 secret
chance, Neo Revelation 12/330 shining, and Neo Destiny 1/12 shining.

## Randomness and presentation

New blank seeds use `crypto.getRandomValues`; each run then records that seed.
Every pack is deterministic from FNV/mulberry-style `seededRandom` over model,
game, set, seed and pack index. Wrapper choice is independently deterministic
and cannot affect pulls. The default presentation is `suggested-v1`: two
Pokémon are placed first (substituting same-rarity Pokémon only for
trainer-heavy openings) and the rare position is last. `historical-v1` uses
the configured set blocks. Retired/unknown selectable modes map to Suggested;
older saved `legacy-v1` data remains valid.

## Custom rules

Energy grants a suggested WotC-era type-matched TM reward; it is not literal
TCG legality. Trainer effect is explicitly "Coming Soon". The game selection
changes learnsets and vintage type display, not pulls. Error print runs and
box guarantees are not simulated.

## URL, storage, loading, and responsive contract

Valid share query fields are `game`, `set`, `seed`, optional `model=v1`, and
optional `order`. Missing/invalid fields make the link invalid; no aliases are
accepted. Starting/resuming replaces the URL with the canonical ordered query;
returning to saved challenges navigates to `/tcg-challenge`. Seeded URLs use
`noindex,follow`; the clean route is indexable.

`localStorage` key `pokelore:tcg-challenges:v1` stores an array of validated
challenge objects. Malformed or unreadable storage is retained but ignored,
with an error message. Saving failures retain in-tab state. There is no
storage-event listener. The production page fetches set manifest and artwork
on entry, exactly one selected set and Pokémon index on start/resume, then
learnsets/TM rewards only on request. Card artwork uses its primary URL then
fallback; failed images render a text fallback.

The responsive functional contract is a single interactive flow at desktop and
mobile: no horizontal overflow, cards remain revealable, and reduced-motion
disables card animation. Existing production Playwright coverage records both
viewports.

## Golden evidence

`src/test/fixtures/tcgChallenge/packGoldenMaster.json` pins normal Energy,
historical, secret, and both shining outcomes across two eras. The independent
fixture assertions are in `src/tcg/goldenMaster.test.js`; broader production
invariants remain in `engine.test.js`, `packPresentation.test.js`,
`reveal.test.js`, and the production browser harness
`scripts/testTcgChallengeE2E.js`.
