# Generation I–III learnset categories

The shared Astro LearnsetCard applies type-based categories to all methods (level-up, machine, tutor and egg) when the selected game group belongs to Generations I–III. This includes Japanese Red/Green/Blue, international Red/Blue/Yellow, Gold/Silver/Crystal, Ruby/Sapphire/Emerald, FireRed/LeafGreen, Colosseum and XD. No production React files are modified.

| Category | Types |
|---|---|
| Physical | Normal, Fighting, Flying, Poison, Ground, Rock, Bug, Ghost, Steel |
| Special | Fire, Water, Grass, Electric, Psychic, Ice, Dragon, Dark |

Status is checked before applying the type rule. Null/zero power does not imply Status: fixed-damage moves still have a damage category. Unknown types (including Shadow moves with individual categories) retain their source category. Later games and All Generations retain the existing modern categories; this change does not claim complete historical power/accuracy/category support for later generations.

Build-time move detail data supplies compact past-type changes from pastValues. The selected legacy game's type is displayed in both the Type and Cat. columns, preventing mistakes such as calling Generation I Bite Dark/Special. Hidden Power and Weather Ball show Varies with an accessible explanation, because their actual battle type determines the category. No runtime API request is needed.

Research:
- [Type-based category table and status behavior](https://bulbapedia.bulbagarden.net/wiki/Damage_category)
- [Hidden Power: Generation II/III category depends on its actual type](https://bulbapedia.bulbagarden.net/wiki/Hidden_Power_(move))
- [Weather Ball: Generation III type and category depend on weather](https://bulbapedia.bulbagarden.net/wiki/Weather_Ball_(move))

Implementation: src/lib/moveCategory.js, src/lib/pokemonData.js and src/islands/LearnsetCard.jsx.

Validation: `node --test scripts/move-category.test.mjs`, build/static verifier, and browser game-switch checks. Tests cover all 17 types, every supported legacy group, status moves, damage with null power, type changes, variable types, later-generation remakes and unchanged source data.

Browser regression: start preview on port 4336, then run node scripts/test-category-browser.mjs from astro-poc. Verified game switching, level-up/machine/tutor badges, unchanged Status, variable category, modern reset and saved selection after reload.
