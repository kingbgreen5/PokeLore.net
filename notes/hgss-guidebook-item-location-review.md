# HGSS Guidebook Item Location Review

Status: review only. Do not import this into the curated database until manually approved.

Source photos: `C:/Users/Thebe/Downloads/hgssitemphotos/image0.jpeg` through `image13.jpeg`.

Scope notes:
- This proposal keeps only sources useful inside HeartGold/SoulSilver.
- Entries that only say "obtain by trading or receiving a Pokemon that's holding this item" were intentionally omitted.
- Location slugs are matched to existing local location files where possible. If the exact sub-location does not have a slug, the nearest parent slug is used with a note.
- "Pokeathlon" is normalized to the existing `pokeathlon-dome` slug.
- Route 27 exists locally as `kanto-route-27`, not `johto-route-27`; this needs approval before import.

## Questions To Resolve

1. Resolved: Use the earlier Athlete Shop table for Fire Stone, so the Pokéathlon Dome day is Tuesday.
2. Resolved: General shop rows like "Poke Mart after one Gym Badge" use the generic `johto-pokemart` slug.
3. Resolved: "Goldenrod City Department Store", "Goldenrod City Flower Shop", "Goldenrod Game Corner", and "Goldenrod City Bike Shop" attach to `goldenrod-city`.
4. Resolved: Omit vague Rock Smash "Other Locations" rows for now.
5. Resolved: Include Pokéwalker sources as method-only unmatched entries.

## Poke Balls

| Item | Item slug | Guidebook source | Proposed location slug | Notes |
| --- | --- | --- | --- | --- |
| Poke Ball | `poke-ball` | Poke Mart after learning how to catch Pokemon from Lyra/Ethan on Route 29 | `johto-pokemart` | Price 200; condition: after Route 29 catching lesson |
| Poke Ball | `poke-ball` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 200; sub-location has no slug found |
| Dive Ball | `dive-ball` | Obtain on the Pokewalker | unmatched | Include only if Pokewalker sources are in scope |
| Dusk Ball | `dusk-ball` | Goldenrod City Department Store drawing 2nd prize (Friday) | `goldenrod-city` | Price 1000 elsewhere at Safari Zone Gate |
| Dusk Ball | `dusk-ball` | Safari Zone Gate | `safari-zone-gate` | Price 1000 |
| Fast Ball | `fast-ball` | Made by Kurt for Wht Apricorn | `azalea-town` | Kurt's house is in Azalea Town |
| Fast Ball | `fast-ball` | Receive from Kurt after defeating Team Rocket at Slowpoke Well | `slowpoke-well` | One-time gift |
| Friend Ball | `friend-ball` | Made by Kurt for Grn Apricorn | `azalea-town` |  |
| Great Ball | `great-ball` | Poke Mart after obtaining three Gym Badges | `johto-pokemart` | Price 600 |
| Great Ball | `great-ball` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 600 |
| Heal Ball | `heal-ball` | Cherrygrove City Poke Mart | `cherrygrove-city` | Price 300 |
| Heavy Ball | `heavy-ball` | Made by Kurt for Blk Apricorn | `azalea-town` |  |
| Level Ball | `level-ball` | Made by Kurt for Red Apricorn | `azalea-town` |  |
| Love Ball | `love-ball` | Made by Kurt for Pnk Apricorn | `azalea-town` |  |
| Lure Ball | `lure-ball` | Made by Kurt for Blu Apricorn | `azalea-town` |  |
| Lure Ball | `lure-ball` | Receive from man on Route 32 | `johto-route-32` |  |
| Luxury Ball | `luxury-ball` | Goldenrod City Department Store drawing 2nd prize (Sunday) | `goldenrod-city` |  |
| Master Ball | `master-ball` | Professor Elm in New Bark Town after eight Gym Badges | `new-bark-town` |  |
| Moon Ball | `moon-ball` | Made by Kurt for Ylw Apricorn | `azalea-town` |  |
| Nest Ball | `nest-ball` | Safari Zone Gate | `safari-zone-gate` | Price 1000 |
| Net Ball | `net-ball` | Violet City Poke Mart | `violet-city` | Price 1000 |
| Net Ball | `net-ball` | Azalea Town Poke Mart | `azalea-town` | Price 1000 |
| Premier Ball | `premier-ball` | Buy 10 Poke Balls at once | `johto-pokemart` | Method-only purchase bonus |
| Quick Ball | `quick-ball` | Goldenrod City Department Store drawing 2nd prize (Wednesday) | `goldenrod-city` |  |
| Quick Ball | `quick-ball` | Safari Zone Gate | `safari-zone-gate` | Price 1000 |
| Repeat Ball | `repeat-ball` | Goldenrod City Department Store drawing 2nd prize (Friday) | `goldenrod-city` |  |
| Safari Ball | `safari-ball` | Safari Zone; receive 30 after paying entry fee | `johto-safari-zone` | Entry fee 500 |
| Sport Ball | `sport-ball` | National Park Bug-Catching Contest | `national-park` | Tuesday, Thursday, Saturday |
| Timer Ball | `timer-ball` | Goldenrod City Department Store drawing 2nd prize (Saturday) | `goldenrod-city` |  |
| Ultra Ball | `ultra-ball` | Poke Mart after obtaining five Gym Badges | `johto-pokemart` | Price 1200 |
| Ultra Ball | `ultra-ball` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 1200 |

## Key Items

| Item | Item slug | Guidebook source | Proposed location slug | Notes |
| --- | --- | --- | --- | --- |
| Apricorn Box | `apricorn-box` | Receive from man on Route 30 | `johto-route-30` | Parenthetical also mentions Apriblender from Pokeathlon Dome employee at Aprijuice stand |
| Basement Key | `basement-key--goldenrod` | Radio Tower 5F after defeating Team Rocket Executive Petrel | `radio-tower` | Use versioned slug if preferred over generic `basement-key` |
| Berry Pots | `berry-pots` | Flower Shop's Floria on Route 36 after battling Sudowoodo | `johto-route-36` |  |
| Bicycle | `bicycle` | Borrow from manager at Goldenrod City Bike Shop | `goldenrod-city` |  |
| Blue Card | `blue-card` | Buena on Goldenrod City's Radio Tower 2F | `radio-tower` |  |
| Card Key | `card-key` | Captured Director in Goldenrod Tunnel | `goldenrod-tunnel` |  |
| Clear Bell | `clear-bell` | After battling five Kimono Girls at Ecruteak Dance Theatre | `ecruteak-city` | HeartGold only |
| Coin Case | `coin-case` | Mr. Game at Goldenrod Game Corner | `goldenrod-city` |  |
| Dowsing MCHN | `dowsing-machine` | Man in an Ecruteak City house | `ecruteak-city` | Confirm slug; item may not be `dowsing-machine` locally |
| Fashion Case | `fashion-case` | Lyra/Ethan at the Goldenrod Tunnel entrance | `goldenrod-tunnel` |  |
| Good Rod | `good-rod` | Fisherman in a house in Olivine City | `olivine-city` |  |
| Gracidea | `gracidea` | Goldenrod City Flower Shop while walking with Shaymin | `goldenrod-city` |  |
| Mystery Egg | `mystery-egg` | Mr. Pokemon's house on Route 30 | `johto-route-30` |  |
| Old Rod | `old-rod` | Fisherman at the Pokemon Center on Route 32 | `johto-route-32` |  |
| Pal Pad | `pal-pad` | Pokemon Center B1F after reaching Violet City | unmatched | Needs location decision |
| RageCandyBar | `rage-candy-bar` | Buy from a man in Mahogany Town | `mahogany-town` | Price 300 |
| Rainbow Wing | `rainbow-wing` | Director once the Radio Tower is freed | `radio-tower` | HeartGold only |
| Red Scale | `red-scale` | Obtain after battling red Gyarados at Lake of Rage | `lake-of-rage` |  |
| Seal Case | `seal-case` | Girl at Moomoo Farm on Route 39 after treating Miltank | `johto-route-39` |  |
| SecretPotion | `secret-potion` | Cianwood City Pharmacy | `cianwood-city` |  |
| Silver Wing | `silver-wing` | Director at Radio Tower opening | `radio-tower` | SoulSilver only |
| SquirtBottle | `squirt-bottle` | Goldenrod City Flower Shop after winning at Goldenrod City Gym | `goldenrod-city` |  |
| Tidal Bell | `tidal-bell` | After battling five Kimono Girls in Ecruteak Dance Theater | `ecruteak-city` | SoulSilver only |
| Unown Report | `unown-report` | Researcher at Ruins of Alph after solving stone-panel puzzle | `ruins-of-alph` |  |
| Vs. Recorder | `vs-recorder` | Lyra/Ethan at the Route 31 gate | `johto-route-31` |  |

## Rock Smash

| Item | Item slug | Guidebook source | Proposed location slug | Notes |
| --- | --- | --- | --- | --- |
| Blue Shard | `blue-shard` | Rock Smash: Ruins of Alph exterior | `ruins-of-alph` | HeartGold; also SoulSilver in a different row |
| Green Shard | `green-shard` | Rock Smash: Ruins of Alph exterior | `ruins-of-alph` | HeartGold; also SoulSilver in a different row |
| Red Shard | `red-shard` | Rock Smash: Ruins of Alph exterior | `ruins-of-alph` | HeartGold and SoulSilver, version rows differ |
| Yellow Shard | `yellow-shard` | Rock Smash: Ruins of Alph exterior | `ruins-of-alph` | HeartGold and SoulSilver, version rows differ |
| Helix Fossil | `helix-fossil` | Rock Smash: Ruins of Alph exterior | `ruins-of-alph` | HeartGold only |
| Dome Fossil | `dome-fossil` | Rock Smash: Ruins of Alph exterior | `ruins-of-alph` | SoulSilver only |
| Old Amber | `old-amber` | Rock Smash: Ruins of Alph exterior | `ruins-of-alph` | Both versions |
| Max Ether | `max-ether` | Rock Smash: Ruins of Alph exterior | `ruins-of-alph` | Both versions |
| Max Revive | `max-revive` | Rock Smash: Ruins of Alph exterior | `ruins-of-alph` | Both versions |
| Big Pearl | `big-pearl` | Rock Smash: Cliff Cave | `cliff-cave` | Rocks appear after National Pokedex |
| Claw Fossil | `claw-fossil` | Rock Smash: Cliff Cave | `cliff-cave` | HeartGold only; rocks after National Pokedex |
| Root Fossil | `root-fossil` | Rock Smash: Cliff Cave | `cliff-cave` | SoulSilver only; rocks after National Pokedex |
| Max Ether | `max-ether` | Rock Smash: Cliff Cave | `cliff-cave` | Rocks after National Pokedex |
| Pearl | `pearl` | Rock Smash: Cliff Cave | `cliff-cave` | Rocks after National Pokedex |
| Rare Bone | `rare-bone` | Rock Smash: Cliff Cave | `cliff-cave` | Rocks after National Pokedex |
| Red Shard | `red-shard` | Rock Smash: Cliff Cave | `cliff-cave` | HeartGold; rocks after National Pokedex |
| Yellow Shard | `yellow-shard` | Rock Smash: Cliff Cave | `cliff-cave` | HeartGold; rocks after National Pokedex |
| Blue Shard | `blue-shard` | Rock Smash: Cliff Cave | `cliff-cave` | SoulSilver; rocks after National Pokedex |
| Green Shard | `green-shard` | Rock Smash: Cliff Cave | `cliff-cave` | SoulSilver; rocks after National Pokedex |
Vague Rock Smash "Other Locations" rows are omitted until specific maps are confirmed.

## Useful Alphabetical Item Sources

| Item | Item slug | Guidebook source | Proposed location slug | Notes |
| --- | --- | --- | --- | --- |
| Air Mail | `air-mail` | Cherrygrove City Poke Mart | `cherrygrove-city` | Price 50 |
| Air Mail | `air-mail` | Blackthorn City Poke Mart | `blackthorn-city` | Price 50 |
| Amulet Coin | `amulet-coin` | Goldenrod City Department Store B1F | `goldenrod-city` |  |
| Antidote | `antidote` | Poke Mart from beginning | `johto-pokemart` | Price 100 |
| Antidote | `antidote` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 100 |
| Awakening | `awakening` | Poke Mart after one Gym Badge | `johto-pokemart` | Price 250 |
| Awakening | `awakening` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 250 |
| Berry Juice | `berry-juice` | Shuckle you take care of in Cianwood City | `cianwood-city` | Also always held by wild Shuckle |
| Big Mushroom | `big-mushroom` | Obtain on the Pokewalker | unmatched | Include only if Pokewalker sources are in scope |
| Big Pearl | `big-pearl` | Sometimes held by wild Shellder | unmatched | Wild-held source; no fixed location from this row |
| Black Belt | `black-belt` | Day-of-week sibling Wesley at Lake of Rage | `lake-of-rage` | Wednesday |
| Black Flute | `black-flute` | Dark Cave, Violet City side | `dark-cave` |  |
| BlackGlasses | `black-glasses` | Man in sunglasses in Dark Cave, Blackthorn City side | `dark-cave` |  |
| Bloom Mail | `bloom-mail` | Azalea Town Poke Mart | `azalea-town` | Price 50 |
| Blue Shard | `blue-shard` | Smash rocks using Rock Smash | unmatched | See Rock Smash section for specific locations |
| Bright Powder | `bright-powder` | Mary at Radio Tower 4F once Radio Tower is freed | `radio-tower` |  |
| Bubble Mail | `bubble-mail` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 50 |
| Burn Heal | `burn-heal` | Poke Mart after one Gym Badge | `johto-pokemart` | Price 250 |
| Burn Heal | `burn-heal` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 250 |
| Calcium | `calcium` | Goldenrod City Department Store 4F | `goldenrod-city` | Price 9800 |
| Carbos | `carbos` | Goldenrod City Department Store 4F | `goldenrod-city` | Price 9800 |
| Charcoal | `charcoal` | Charcoal Man's apprentice in Azalea Town after catching both Farfetch'd | `azalea-town` |  |
| Charcoal | `charcoal` | Ruins of Alph upper-left entrance 2 | `ruins-of-alph` |  |
| Choice Specs | `choice-specs` | Lake of Rage | `lake-of-rage` | Corrected from the first pass; this was not Claw Fossil |
| Damp Mulch | `damp-mulch` | Goldenrod City Flower Shop | `goldenrod-city` | Price 200 |
| Destiny Knot | `destiny-knot` | Route 27 | `kanto-route-27` | Confirm this slug is desired for HGSS Route 27 |
| Dire Hit | `dire-hit` | Goldenrod City Department Store 3F | `goldenrod-city` | Price 650 |
| Dome Fossil | `dome-fossil` | Smash a rock at Ruins of Alph using Rock Smash | `ruins-of-alph` | SoulSilver only |
| Dragon Fang | `dragon-fang` | Dragon's Den B1F | `dragons-den` |  |
| Dragon Scale | `dragon-scale` | Back of Mt. Mortar 2F | `mt-mortar` |  |
| Elixir | `elixir` | Union Cave B2F | `union-cave` |  |
| Energy Root | `energy-root` | Goldenrod Tunnel herbalist | `goldenrod-tunnel` | Saturday, Sunday; price 800 |
| EnergyPowder | `energy-powder` | Goldenrod Tunnel herbalist | `goldenrod-tunnel` | Saturday, Sunday; price 500 |
| Escape Rope | `escape-rope` | Poke Mart after one Gym Badge | `johto-pokemart` | Price 550 |
| Escape Rope | `escape-rope` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 550 |
| Ether | `ether` | Ilex Forest | `ilex-forest` |  |
| Ether | `ether` | Lake of Rage biggest Magikarp competition | `lake-of-rage` |  |
| Everstone | `everstone` | National Park Bug-Catching Contest 2nd prize | `national-park` |  |
| Exp. Share | `exp-share` | Trade Red Scale at Mr. Pokemon's house on Route 30 | `johto-route-30` | In-game trade, not cross-game |
| Exp. Share | `exp-share` | Lucky-number drawing at Radio Tower, 2nd prize | `radio-tower` |  |
| Fire Stone | `fire-stone` | Pokeathlon prize | `pokeathlon-dome` | `image12.jpeg` says Friday; earlier Athlete Shop image says Tuesday |
| Flame Mail | `flame-mail` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 50 |
| Fresh Water | `fresh-water` | Goldenrod City Department Store | `goldenrod-city` | Price 200 |
| Fresh Water | `fresh-water` | Pokeathlon Dome vending machine | `pokeathlon-dome` | Price 200 |
| Full Heal | `full-heal` | Poke Mart after five Gym Badges | `johto-pokemart` | Price 600 |
| Full Heal | `full-heal` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 600 |
| Full Restore | `full-restore` | Poke Mart after eight Gym Badges | `johto-pokemart` | Price 3000 |
| Gooey Mulch | `gooey-mulch` | Goldenrod City Flower Shop | `goldenrod-city` | Price 200 |
| Grass Mail | `grass-mail` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 50 |
| Green Shard | `green-shard` | Smash rocks using Rock Smash | unmatched | See Rock Smash section for specific locations |
| Growth Mulch | `growth-mulch` | Goldenrod City Flower Shop | `goldenrod-city` | Price 200 |
| Guard Spec. | `guard-spec` | Goldenrod City Department Store 3F | `goldenrod-city` | Price 700 |
| Hard Stone | `hard-stone` | Day-of-week sibling Arthur on Route 36 | `johto-route-36` | Thursday |
| Hard Stone | `hard-stone` | Obtain on the Pokewalker | unmatched | Include only if Pokewalker sources are in scope |
| Heal Powder | `heal-powder` | Goldenrod Tunnel herbalist | `goldenrod-tunnel` | Saturday, Sunday; price 450 |
| Heart Mail | `heart-mail` | Olivine City Poke Mart | `olivine-city` | Price 50 |
| Heart Scale | `heart-scale` | Pokeathlon prize | `pokeathlon-dome` | Wednesday |
| Heart Scale | `heart-scale` | Smash rocks using Rock Smash | unmatched | See Rock Smash section for specific locations |
| Helix Fossil | `helix-fossil` | Crush a rock in the Ruins of Alph using Rock Smash | `ruins-of-alph` | HeartGold only |
| HP Up | `hp-up` | Goldenrod City Department Store 4F | `goldenrod-city` | Price 9800 |
| Hyper Potion | `hyper-potion` | Poke Mart after five Gym Badges | `johto-pokemart` | Price 1200 |
| Hyper Potion | `hyper-potion` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 1200 |
| Ice Heal | `ice-heal` | Poke Mart after one Gym Badge | `johto-pokemart` | Price 250 |
| Ice Heal | `ice-heal` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 250 |
| Iron | `iron` | Goldenrod City Department Store 4F | `goldenrod-city` | Price 9800 |
| Iron Ball | `iron-ball` | Back of Mt. Mortar 1F | `mt-mortar` | Also Pickup Ability |
| King's Rock | `kings-rock` | Man with glasses at Slowpoke Well B1F | `slowpoke-well` |  |
| King's Rock | `kings-rock` | Pokeathlon prize | `pokeathlon-dome` | Sunday |
| Lagging Tail | `lagging-tail` | Route 47 | `johto-route-47` |  |
| Leaf Stone | `leaf-stone` | Pokeathlon prize | `pokeathlon-dome` | Saturday |
| Lemonade | `lemonade` | Goldenrod City Department Store | `goldenrod-city` | Price 350 |
| Lemonade | `lemonade` | Pokeathlon Dome vending machine | `pokeathlon-dome` | Price 350 |
| Life Orb | `life-orb` | Ruins of Alph upper-left entrance 2 | `ruins-of-alph` |  |
| Macho Brace | `macho-brace` | Held by the Machop traded for a Drowzee at Goldenrod City Department Store 5F | `goldenrod-city` | In-game trade |
| Magnet | `magnet` | Day-of-week sibling Sunny on Route 37 | `johto-route-37` | Sunday |
| Max Elixir | `max-elixir` | Bell Tower 8F | `bell-tower` |  |
| Max Ether | `max-ether` | Goldenrod Tunnel B2F | `goldenrod-tunnel` |  |
| Max Potion | `max-potion` | Poke Mart after seven Gym Badges | `johto-pokemart` | Price 2500 |
| Max Potion | `max-potion` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 2500 |
| Max Repel | `max-repel` | Poke Mart after five Gym Badges | `johto-pokemart` | Price 700 |
| Max Repel | `max-repel` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 700 |
| Max Revive | `max-revive` | Bell Tower 7F | `bell-tower` |  |
| Metal Coat | `metal-coat` | Pokeathlon prize | `pokeathlon-dome` | Friday |
| Metal Powder | `metal-powder` | Sometimes held by wild Ditto | unmatched | Wild-held source; no fixed location from this row |
| Metronome | `metronome` | Game Corner prize | `goldenrod-city` | 1000 coins |
| Miracle Seed | `miracle-seed` | Receive from man on Route 32 | `johto-route-32` |  |
| Moomoo Milk | `moomoo-milk` | Moomoo Farm on Route 39 after treating Miltank | `johto-route-39` | Price 500 in item list |
| Moomoo Milk | `moomoo-milk` | Pokeathlon prize | `pokeathlon-dome` | Earlier Athlete Shop table says 100 points and every day |
| Moon Stone | `moon-stone` | Pokeathlon prize | `pokeathlon-dome` | Monday |
| Moon Stone | `moon-stone` | Ruins of Alph lower-right entrance 2 | `ruins-of-alph` |  |
| Muscle Band | `muscle-band` | Bought by your mom with your savings | unmatched | Method-only |
| Mystic Water | `mystic-water` | Receive from a large man in Cherrygrove City | `cherrygrove-city` |  |
| Mystic Water | `mystic-water` | Ruins of Alph lower-left entrance 2 | `ruins-of-alph` |  |
| NeverMeltIce | `never-melt-ice` | Ice Path B3F | `ice-path` |  |
| Nugget | `nugget` | Route 34 | `johto-route-34` |  |
| Nugget | `nugget` | Pokeathlon prize | `pokeathlon-dome` | Friday |
| Old Amber | `old-amber` | Smash a rock in Ruins of Alph using Rock Smash | `ruins-of-alph` |  |
| Parlyz Heal | `paralyze-heal` | Poke Mart from beginning | `johto-pokemart` | Price 200; confirm slug is `paralyze-heal` |
| Parlyz Heal | `paralyze-heal` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 200; confirm slug |
| Pearl | `pearl` | Olivine City using the Dowsing MCHN | `olivine-city` |  |
| Pearl | `pearl` | Obtain on the Pokewalker | unmatched | Include only if Pokewalker sources are in scope |
| Poison Barb | `poison-barb` | Day-of-week sibling Frieda on Route 32 | `johto-route-32` | Friday |
| Poke Doll | `poke-doll` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 1000 |
| Potion | `potion` | Poke Mart from the beginning | `johto-pokemart` | Price 300 in image; verify because standard price is often 300 in HGSS |
| Potion | `potion` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 300 |
| Power Herb | `power-herb` | Defeat Kate, Jenn, and Irene on Route 34 | `johto-route-34` |  |
| PP Up | `pp-up` | Violet City | `violet-city` |  |
| PP Up | `pp-up` | Pokeathlon prize | `pokeathlon-dome` | Tuesday, Thursday |
| Protein | `protein` | Goldenrod City Department Store 4F | `goldenrod-city` | Price 9800 |
| Quick Claw | `quick-claw` | Teacher on the bench at National Park | `national-park` |  |
| Quick Powder | `quick-powder` | Often held by wild Ditto | unmatched | Wild-held source; no fixed location from this row |
| Rare Candy | `rare-candy` | Violet City | `violet-city` |  |
| Rare Candy | `rare-candy` | Pokeathlon prize | `pokeathlon-dome` | Monday, Saturday |
| Red Flute | `red-flute` | Lake of Rage | `lake-of-rage` |  |
| Red Shard | `red-shard` | Smash rocks using Rock Smash | unmatched | See Rock Smash section for specific locations |
| Repel | `repel` | Poke Mart after one Gym Badge | `johto-pokemart` | Price 350 |
| Repel | `repel` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 350 |
| Revival Herb | `revival-herb` | Goldenrod Tunnel herbalist | `goldenrod-tunnel` | Saturday, Sunday; price 2800 |
| Revive | `revive` | Poke Mart after three Gym Badges | `johto-pokemart` | Price 1500 |
| Revive | `revive` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 1500 |
| Sacred Ash | `sacred-ash` | Held by Ho-Oh | unmatched | HeartGold only; no fixed item-location slug proposed |
| Shed Shell | `shed-shell` | Day-of-week sibling Monica on Route 40 | `johto-sea-route-40` | Monday |
| Shell Bell | `shell-bell` | Door prize for National Park Bug-Catching Contest | `national-park` |  |
| Shell Bell | `shell-bell` | Route 32 | `johto-route-32` |  |
| Silk Scarf | `silk-scarf` | Game Corner prize | `goldenrod-city` | 1000 coins |
| SilverPowder | `silver-powder` | Obtain on the Pokewalker | unmatched | Include only if Pokewalker sources are in scope |
| Smoke Ball | `smoke-ball` | Goldenrod Tunnel B1F | `goldenrod-tunnel` |  |
| Smoke Ball | `smoke-ball` | Held by Dodrio received in trade for Dragonair in Blackthorn City | `blackthorn-city` | In-game trade |
| Soda Pop | `soda-pop` | Goldenrod City Department Store | `goldenrod-city` | Price 300 |
| Soda Pop | `soda-pop` | Pokeathlon Dome vending machine | `pokeathlon-dome` | Price 300 |
| Soft Sand | `soft-sand` | Day-of-week sibling Santos in Blackthorn | `blackthorn-city` | Saturday |
| Soothe Bell | `soothe-bell` | National Park | `national-park` |  |
| Space Mail | `space-mail` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 50 |
| Stable Mulch | `stable-mulch` | Goldenrod City Flower Shop | `goldenrod-city` | Price 200 |
| Star Piece | `star-piece` | Ruins of Alph lower-left entrance 2 | `ruins-of-alph` |  |
| Star Piece | `star-piece` | Smash rocks using Rock Smash | unmatched | See Rock Smash section |
| Stardust | `stardust` | Ruins of Alph lower-right entrance 2 | `ruins-of-alph` |  |
| Stardust | `stardust` | Smash rocks using Rock Smash | unmatched | See Rock Smash section |
| Steel Mail | `steel-mail` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 50 |
| Stick | `stick` | Sometimes held by wild Farfetch'd | unmatched | Wild-held source; no fixed location from this row |
| Sun Stone | `sun-stone` | National Park Bug-Catching Contest 1st prize | `national-park` |  |
| Super Potion | `super-potion` | Poke Mart after one Gym Badge | `johto-pokemart` | Price 700 |
| Super Potion | `super-potion` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 700 |
| Super Repel | `super-repel` | Poke Mart after three Gym Badges | `johto-pokemart` | Price 500 |
| Super Repel | `super-repel` | Goldenrod City Department Store 2F | `goldenrod-city` | Price 500 |
| Thick Club | `thick-club` | Sometimes held by wild Cubone and Marowak | unmatched | Wild-held source; no fixed location from this row |
| Thunderstone | `thunder-stone` | Pokeathlon prize | `pokeathlon-dome` | Thursday |
| TinyMushroom | `tiny-mushroom` | Mahogany Souvenir Shop while under Team Rocket control | `mahogany-town` | Price 500 |
| Tunnel Mail | `tunnel-mail` | Violet City Poke Mart | `violet-city` | Price 50 |
| TwistedSpoon | `twisted-spoon` | Day-of-week sibling Tuscany on Route 29 | `johto-route-29` | Tuesday |
| Water Stone | `water-stone` | Pokeathlon prize | `pokeathlon-dome` | Wednesday |
| White Flute | `white-flute` | Route 47 | `johto-route-47` |  |
| Wide Lens | `wide-lens` | Game Corner prize | `goldenrod-city` | 1000 coins |
| Yellow Shard | `yellow-shard` | Smash rocks using Rock Smash | unmatched | See Rock Smash section for specific locations |
| Zinc | `zinc` | Goldenrod City Department Store 4F | `goldenrod-city` | Price 9800 |
| Zoom Lens | `zoom-lens` | Game Corner prize | `goldenrod-city` | 1000 coins |

## Omitted By Rule

The following kinds of rows were seen in the photos but intentionally omitted from the proposal:
- "Obtain by trading or receiving a Pokemon that's holding this item."
- Items that only appear via cross-game trade transfer with no useful HGSS location.
