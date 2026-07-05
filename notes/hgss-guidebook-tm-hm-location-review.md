# HGSS Guidebook TM/HM Location Review

Status: review only. Do not import this into the curated database until manually approved.

Source photos: `C:/Users/Thebe/AppData/Local/Temp/image0.jpeg` through `image4.jpeg`.

Scope notes:
- Rows that only say "Obtain by trading or receiving a Pokemon that's holding this item" were intentionally omitted.
- Item slugs are the local TM/HM item slugs, such as `tm01` and `hm01`.
- Goldenrod Department Store and Goldenrod Game Corner are mapped to `goldenrod-city`.
- Route 27 is stored locally as `kanto-route-27`, even though it is a Johto-era HGSS route entry.
- Victory Road appears locally as `kanto-victory-road-1`, `kanto-victory-road-2`, and `kanto-victory-road-3`. I used the floor-specific slug where the floor in the guidebook matched the file name pattern.

## Questions To Resolve

1. Resolved: HM08 Rock Climb is received from Professor Oak after earning all 16 Johto and Kanto Gym Badges.
2. Resolved: Use `kanto-victory-road-2` and `kanto-victory-road-3` for TM26 Earthquake and TM79 Dark Pulse.
3. Resolved: Goldenrod City Department Store drawing rows use `lottery-prize`.
4. Resolved: Pickup Ability rows are included as method-only entries reading "Found with Pickup Ability" and linking to the Pickup ability page.

## Proposed TM Entries

| TM | Move | Item slug | Guidebook source | Proposed location slug | Notes |
| --- | --- | --- | --- | --- | --- |
| TM01 | Focus Punch | `tm01` | Win at Cianwood Gym | `cianwood-city` | Gym reward |
| TM02 | Dragon Claw | `tm02` | Route 27 | `kanto-route-27` |  |
| TM02 | Dragon Claw | `tm02` | Goldenrod City Department Store drawing 1st prize (Sunday) | `goldenrod-city` | Drawing prize; Sunday |
| TM05 | Roar | `tm05` | Receive from young man on Route 32 (HM Cut required) | `johto-route-32` | Requires Cut |
| TM07 | Hail | `tm07` | Win at Mahogany Gym | `mahogany-town` | Gym reward |
| TM09 | Bullet Seed | `tm09` | Route 32 | `johto-route-32` |  |
| TM10 | Hidden Power | `tm10` | Receive from a man at the house northwest of the Lake of Rage | `lake-of-rage` |  |
| TM11 | Sunny Day | `tm11` | Receive from a girl on Radio Tower 3F (after freeing the tower) | `radio-tower` | Requires freeing Radio Tower |
| TM11 | Sunny Day | `tm11` | Obtain on the Pokewalker | unmatched | Method-only Pokewalker source |
| TM12 | Taunt | `tm12` | Burned Tower B1F (HM Strength required) | `burned-tower` | Requires Strength |
| TM13 | Ice Beam | `tm13` | Game Corner prize (10,000 Coins) | `goldenrod-city` | Game Corner prize |
| TM14 | Blizzard | `tm14` | Goldenrod City Department Store 5F | `goldenrod-city` | Price 5,500 |
| TM15 | Hyper Beam | `tm15` | Goldenrod City Department Store 5F | `goldenrod-city` | Price 7,500 |
| TM16 | Light Screen | `tm16` | Goldenrod City Department Store 5F | `goldenrod-city` | Price 2,000 |
| TM17 | Protect | `tm17` | Goldenrod City Department Store 5F | `goldenrod-city` | Price 2,000 |
| TM18 | Rain Dance | `tm18` | Slowpoke Well B2F (HM Strength required) | `slowpoke-well` | Requires Strength |
| TM18 | Rain Dance | `tm18` | Obtain on the Pokewalker | unmatched | Method-only Pokewalker source |
| TM21 | Frustration | `tm21` | Receive from a girl on Goldenrod City Department Store 5F if lead Pokemon has a low friendship level | `goldenrod-city` | Friendship condition |
| TM22 | SolarBeam | `tm22` | Goldenrod City Department Store 5F | `goldenrod-city` | Price 3,000 |
| TM23 | Iron Tail | `tm23` | Win at Olivine Gym | `olivine-city` | Gym reward |
| TM24 | Thunderbolt | `tm24` | Game Corner prize (10,000 Coins) | `goldenrod-city` | Game Corner prize |
| TM25 | Thunder | `tm25` | Goldenrod City Department Store 5F | `goldenrod-city` | Price 5,500 |
| TM26 | Earthquake | `tm26` | Victory Road 2F | `kanto-victory-road-2` | Please confirm slug |
| TM26 | Earthquake | `tm26` | Pickup Ability | unmatched | Method-only source; include? |
| TM27 | Return | `tm27` | Receive from a girl on Goldenrod City Department Store 5F if lead Pokemon has a high friendship level | `goldenrod-city` | Friendship condition |
| TM28 | Dig | `tm28` | National Park | `national-park` |  |
| TM30 | Shadow Ball | `tm30` | Win at Ecruteak Gym | `ecruteak-city` | Gym reward |
| TM33 | Reflect | `tm33` | Goldenrod City Department Store 5F | `goldenrod-city` | Price 2,000 |
| TM35 | Flamethrower | `tm35` | Game Corner prize (10,000 Coins) | `goldenrod-city` | Game Corner prize |
| TM36 | Sludge Bomb | `tm36` | Receive from Route 43 gate attendant after defeating Team Rocket | `johto-route-43` | Requires defeating Team Rocket |
| TM37 | Sandstorm | `tm37` | Receive from an old lady in a house on Route 27 if the lead Pokemon has a high friendship level | `kanto-route-27` | Friendship condition |
| TM37 | Sandstorm | `tm37` | Obtain on the Pokewalker | unmatched | Method-only Pokewalker source |
| TM38 | Fire Blast | `tm38` | Goldenrod City Department Store 5F | `goldenrod-city` | Price 5,500 |
| TM39 | Rock Tomb | `tm39` | Union Cave B1F | `union-cave` |  |
| TM42 | Facade | `tm42` | Goldenrod City Department Store drawing 1st prize (Friday) | `goldenrod-city` | Drawing prize; Friday |
| TM43 | Secret Power | `tm43` | Lake of Rage | `lake-of-rage` |  |
| TM44 | Rest | `tm44` | Deliver Spearow to the large boy on Route 31 | `johto-route-31` | Delivery reward |
| TM44 | Rest | `tm44` | Game Corner prize (6,000 Coins) | `goldenrod-city` | Game Corner prize |
| TM45 | Attract | `tm45` | Win at Goldenrod City Gym | `goldenrod-city` | Gym reward |
| TM46 | Thief | `tm46` | Team Rocket HQ B2F | `team-rocket-hq` |  |
| TM49 | Snatch | `tm49` | Team Rocket HQ B3F | `team-rocket-hq` |  |
| TM51 | Roost | `tm51` | Win at Violet City Gym | `violet-city` | Gym reward |
| TM52 | Focus Blast | `tm52` | Goldenrod City Department Store 5F | `goldenrod-city` | Price appears to be 5,500 |
| TM54 | False Swipe | `tm54` | Goldenrod City Department Store 5F | `goldenrod-city` | Price 2,000 |
| TM54 | False Swipe | `tm54` | Dark Cave (Blackthorn City side) | `dark-cave` |  |
| TM56 | Fling | `tm56` | Pickup Ability | unmatched | Method-only source; include? |
| TM57 | Charge Beam | `tm57` | Olivine City | `olivine-city` |  |
| TM57 | Charge Beam | `tm57` | Goldenrod City Department Store drawing 1st prize (Wednesday) | `goldenrod-city` | Drawing prize; Wednesday |
| TM59 | Dragon Pulse | `tm59` | Receive from Clair at Dragon's Den after winning at Blackthorn Gym | `dragons-den` | Requires winning at Blackthorn Gym |
| TM60 | Drain Punch | `tm60` | Route 39 | `johto-route-39` |  |
| TM60 | Drain Punch | `tm60` | Goldenrod City Department Store drawing 1st prize (Thursday) | `goldenrod-city` | Drawing prize; Thursday |
| TM62 | Silver Wind | `tm62` | Goldenrod City Department Store drawing 1st prize (Saturday) | `goldenrod-city` | Drawing prize; Saturday |
| TM63 | Embargo | `tm63` | Route 34 | `johto-route-34` |  |
| TM65 | Shadow Claw | `tm65` | Route 42 | `johto-route-42` |  |
| TM65 | Shadow Claw | `tm65` | Goldenrod City Department Store drawing 1st prize (Monday) | `goldenrod-city` | Drawing prize; Monday |
| TM66 | Payback | `tm66` | Route 35 | `johto-route-35` |  |
| TM70 | Flash | `tm70` | Defeat the Elder on Bellsprout Tower 3F | `sprout-tower` | Existing local slug is `sprout-tower` |
| TM70 | Flash | `tm70` | Goldenrod City Department Store 5F | `goldenrod-city` | Price 1,000 |
| TM72 | Avalanche | `tm72` | Ice Path B2F | `ice-path` |  |
| TM75 | Swords Dance | `tm75` | Goldenrod City Game Corner prize (4,000 Coins) | `goldenrod-city` | Game Corner prize |
| TM79 | Dark Pulse | `tm79` | Victory Road 3F | `kanto-victory-road-3` | Please confirm slug |
| TM82 | Sleep Talk | `tm82` | Goldenrod Tunnel B2F | `goldenrod-tunnel` |  |
| TM83 | Natural Gift | `tm83` | Goldenrod City Department Store 5F | `goldenrod-city` | Price 2,000 |
| TM83 | Natural Gift | `tm83` | Receive from farmer lady at Moomoo Farm on Route 39 after helping Miltank | `johto-route-39` | Requires helping Miltank |
| TM86 | Grass Knot | `tm86` | Pickup Ability | unmatched | Method-only source; include? |
| TM87 | Swagger | `tm87` | Lighthouse in Olivine City | `olivine-city` |  |
| TM88 | Pluck | `tm88` | Route 40 | `johto-sea-route-40` |  |
| TM89 | U-turn | `tm89` | Win at Azalea Gym | `azalea-town` | Gym reward |
| TM90 | Substitute | `tm90` | Goldenrod City Game Corner prize (2,000 Coins) | `goldenrod-city` | Game Corner prize |
| TM91 | Flash Cannon | `tm91` | Goldenrod City Department Store drawing 1st prize (Tuesday) | `goldenrod-city` | Drawing prize; Tuesday |

## Proposed HM Entries

| HM | Move | Item slug | Guidebook source | Proposed location slug | Notes |
| --- | --- | --- | --- | --- | --- |
| HM01 | Cut | `hm01` | Receive from the Charcoal Man in Ilex Forest after catching both Farfetch'd | `ilex-forest` |  |
| HM02 | Fly | `hm02` | Receive from Chuck's wife in Cianwood City after winning in Cianwood Gym | `cianwood-city` | Requires Cianwood Gym win |
| HM03 | Surf | `hm03` | Receive from the Gentleman in Ecruteak Dance Theater after saving the Kimono Girl from a Team Rocket Grunt | `ecruteak-city` |  |
| HM04 | Strength | `hm04` | Receive from the Hiker who comes out of Mt. Mortar on Route 42 | `johto-route-42` |  |
| HM05 | Whirlpool | `hm05` | Receive from Lance at Team Rocket HQ after the Double Battle | `team-rocket-hq` |  |
| HM06 | Rock Smash | `hm06` | Receive from the large boy on Route 36 | `johto-route-36` |  |
| HM07 | Waterfall | `hm07` | Obtain on Ice Path 1F | `ice-path` |  |
| HM08 | Rock Climb | `hm08` | Receive from Professor Oak after earning all 16 Johto and Kanto Gym Badges | `pallet-town` | Professor Oak's Lab |

## Omitted Trade-Only Rows

The following rows were omitted because the guidebook only lists trading/receiving a Pokemon holding the item:

TM03 Water Pulse, TM04 Calm Mind, TM06 Toxic, TM08 Bulk Up, TM19 Giga Drain, TM20 Safeguard, TM29 Psychic, TM31 Brick Break, TM32 Double Team, TM34 Shock Wave, TM40 Aerial Ace, TM41 Torment, TM47 Steel Wing, TM48 Skill Swap, TM50 Overheat, TM53 Energy Ball, TM55 Brine, TM58 Endure, TM61 Will-O-Wisp, TM64 Explosion, TM67 Recycle, TM68 Giga Impact, TM69 Rock Polish, TM71 Stone Edge, TM73 Thunder Wave, TM74 Gyro Ball, TM76 Stealth Rock, TM77 Psych Up, TM78 Captivate, TM80 Rock Slide, TM81 X-Scissor, TM84 Poison Jab, TM85 Dream Eater, TM92 Trick Room.
