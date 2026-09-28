# Move stress-test manifest

Phase 4A generates only these 19 canonical Move routes through `src/pages/move/[slug].astro`. Learner counts are unique canonical Pokémon across every recorded version.

| Slug | Move | Why selected | Edge case | Learners |
|---|---|---|---|---:|
| `10-000-000-volt-thunderbolt` | 10,000,000 Volt Thunderbolt | Long canonical name with no generated learner file | Missing optional learner source; Z-Move | 0 |
| `thunderbolt` | Thunderbolt | Ordinary damaging baseline with broad historical availability | Common special move; past values | 343 |
| `protect` | Protect | Largest learner set in the dataset | Status, +4 priority, null power/accuracy, payload maximum | 1,246 |
| `eruption` | Eruption | Power depends on remaining HP | Variable power | 10 |
| `population-bomb` | Population Bomb | New multi-hit accuracy interaction | Multi-hit, Generation IX | 3 |
| `fissure` | Fissure | OHKO semantics cannot be represented as ordinary fixed power | OHKO, null power, 30 accuracy | 67 |
| `seismic-toss` | Seismic Toss | Damage depends on the user's level | Fixed/special damage, null power | 157 |
| `quick-attack` | Quick Attack | Straightforward positive-priority move | +1 priority | 206 |
| `trick-room` | Trick Room | Extreme negative priority and unusual field effect | −7 priority, status | 185 |
| `tackle` | Tackle | Multiple historical power/accuracy changes | Generation-changed baseline | 479 |
| `leech-life` | Leech Life | Major historical power change | Generation-changed draining move | 84 |
| `knock-off` | Knock Off | Power and mechanics changed across generations | Historical value/effect | 370 |
| `curse` | Curse | Type-dependent user/target behavior and broad learners | Unusual targeting/effect, null facts | 473 |
| `aura-wheel` | Aura Wheel | Restricted learner set and form-dependent type behavior | Signature/form-specific | 2 |
| `sketch` | Sketch | Smallest learner presentation | One learner; unusual copying mechanic | 1 |
| `swift` | Swift | Always-hit behavior must not render `0%` | Null accuracy, very common learner list | 602 |
| `earthquake` | Earthquake | Broad learner list and multi-target battle behavior | Unusual targeting/common damaging Move | 384 |
| `flower-trick` | Flower Trick | Modern always-hit signature Move | Null accuracy, one learner, Generation IX | 1 |
| `tera-starstorm` | Tera Starstorm | Recent transformation-linked Move | Very new, form/transformation mechanics | 3 |

## Expected assertions

Every page must have one H1, one production canonical, static metadata and JSON-LD, type/category/facts, resolved effect text, generation context, and canonical learner links in the initial HTML. Null accuracy and power render as `—`. The static learner preview never exceeds 80 links. Complete latest and historical learner groups are fetched only after interaction. No raw `$effect_chance`, `undefined`, object stringification, NaN, empty href, numeric Pokémon href, staging hostname, or missing required asset is permitted.

Responsive checks cover all 19 pages at 390 px and representative difficult pages at 768 and 1,440 px. Production parity checks cover Thunderbolt, Protect, Fissure, Swift, Tackle, and Tera Starstorm. `/move/not-a-real-move` must return 404. Full Move generation remains disabled until review.
