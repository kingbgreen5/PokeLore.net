export const ABILITY_STRESS_CASES = Object.freeze([
  ['sturdy', 'largest routed holder population'],
  ['swift-swim', 'joint-largest population across many generations'],
  ['sheer-force', 'Hidden-Ability-heavy population'],
  ['levitate', 'large all-regular population and many forms'],
  ['wonder-guard', 'rare signature Ability with a complex effect'],
  ['protean', 'normal and Hidden holders, forms, and Oak’s Notes'],
  ['water-absorb', 'regional/form coverage and routed female-form expansion'],
  ['cursed-body', 'regular/Hidden split and routed female-form expansion'],
  ['mold-breaker', 'longest class of detailed battle effects'],
  ['stench', 'chance text and explicit overworld effect'],
  ['run-away', 'simple battle effect plus overworld behavior'],
  ['battle-bond', 'unusual form mechanic'],
  ['power-construct', 'multiple forms of the same Pokémon'],
  ['as-one-glastrier', 'long name and explicit source-data limitation'],
  ['neutralizing-gas', 'long in-game description'],
  ['supreme-overlord', 'new-generation long effect'],
  ['embody-aspect', 'canonical zero-holder Ability'],
  ['dragonize', 'new Generation IX Ability']
]);

export const ABILITY_STRESS_SLUGS = Object.freeze(ABILITY_STRESS_CASES.map(([slug]) => slug));
export const ABILITY_STRESS_SLUG_SET = new Set(ABILITY_STRESS_SLUGS);
