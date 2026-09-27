# Form semantics audit

Phase 2B audits every non-default canonical route without generating the full catalog. The registry contains 1,352 canonical names. The original source-record flag finds 325 non-default records; `frillish-female` and `jellicent-female` are two additional non-default canonical aliases whose shared source records are default, so the route-level audit correctly covers 327 names.

## Architecture

`src/lib/formSemantics.js` resolves a small page-model contract:

- `category`: `default`, `regional`, `mega`, `gmax`, `battle-state`, `stance`, `gender`, `cosmetic`, `item-form`, `environment-form`, `permanent-alternate`, or `totem`.
- `evolutionBehavior`: `participates`, `replace-node`, `regional-branch`, or `base-relationship`.
- `classificationSource`: deterministic rule name or `explicit-override`.
- `inheritance`: field-level `safe`, `conditional`, or `unsafe` policy.

Deterministic identifiers and form families classify 319 routes. Eight ambiguous intersections are documented in `src/data/formSemanticsOverrides.json`: `basculin-white-striped`, `darmanitan-galar-zen`, `greninja-battle-bond`, both Totem Mimikyu states, `minior-blue`, and both Power Construct Zygarde routes. New material forms must match a deterministic rule or receive a reviewed override; `npm run audit:form-semantics` fails on an unresolved route.

The semantics layer changes interpretation only. Existing evolution-chain data and `evolutionMethodOverrides.json` remain authoritative. Regional forms select their existing branch, permanent/gender forms may replace their species node, and Mega, Gigantamax, stance, battle/state, item, environment, cosmetic, and Totem forms show the base relationship with a clarification. They are never fabricated as evolution stages.

## Audit result

| Measure | Result |
|---|---:|
| Canonical by-name routes | 1,352 |
| Source records flagged non-default | 325 |
| Non-default canonical routes audited | 327 |
| Automatically classified | 319 |
| Explicit overrides | 8 |
| Unresolved material semantics | **0** |

| Category | Routes |
|---|---:|
| Battle state | 27 |
| Cosmetic | 35 |
| Environment form | 4 |
| Gender | 6 |
| Gigantamax | 34 |
| Item form | 27 |
| Mega | 96 |
| Permanent alternate | 28 |
| Regional | 59 |
| Stance | 1 |
| Totem | 10 |

Evolution behavior totals are 235 base relationships, 59 regional branches, and 33 node replacements. Default routes participate normally.

## Inheritance policy

| Field | Policy | Rule |
|---|---|---|
| Analysis, Biology & Behavior | Unsafe | Require an explicit form match; otherwise omit prose and explain the omission. |
| Pokédex entries | Conditional | Use only entries present on the routed record; never add a prose fallback. |
| Evolution | Conditional | Reuse the existing chain through the form's explicit evolution behavior. |
| Learnset | Conditional | Prefer routed ID; permit the existing marked default-variety fallback and report its source. |
| Artwork | Conditional | Prefer routed local art, then routed form sprite; never borrow another form's art silently. |
| Types, abilities, stats, encounters, height, weight, gender | Safe | Read the routed record. Encounters do not fall back and the section is omitted when empty. |
| Size comparison | Safe | Use routed bounds/corrections only; omit when absent. |

The catalog audit lists all 327 routes as protected by the unsafe prose policy. This is an enforced omission rule, not an unresolved error.

## Maintenance

Run:

```sh
npm run audit:form-semantics
npm run audit:catalog-readiness
```

Review `evidence/stress/form-semantics-audit.json` for route-level classifications and `evidence/stress/catalog-readiness.json` for the 1,352 page models. Add a deterministic classifier only when a form identifier or family has stable semantics. Use the override file for an actual ambiguity, include a reason, and add a regression route when the evolution behavior is materially different.
