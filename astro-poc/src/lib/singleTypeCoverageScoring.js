export const SINGLE_TYPE_RECOMMENDATION_WEIGHTS_STORAGE_KEY =
  'pokelore:single-type-coverage-recommendation-score-weights:v1';

export const DEFAULT_SINGLE_TYPE_RECOMMENDATION_WEIGHTS = {
  regionalDex: 0.5,
  notRegionalDex: -0.5,
  tradeEvolution: -0.5,
  sTier: 0.3,
  aTier: 0.2,
  veryLowBst: -1.5,
  lowBst: -0.3,
  highBst: 0.3,
  defensiveResistance: 0.1,
  selectedTypeResistance: 0.1,
  stabCoverage: 3
};

export const SINGLE_TYPE_SCORE_WEIGHT_CONTROLS = [
  ['regionalDex', 'Regional Dex'],
  ['notRegionalDex', 'Not Regional Dex'],
  ['tradeEvolution', 'Trade Evolution'],
  ['sTier', 'S Tier'],
  ['aTier', 'A Tier'],
  ['veryLowBst', 'BST < 380'],
  ['lowBst', 'BST < 410'],
  ['highBst', 'BST > 490'],
  ['defensiveResistance', 'Each Resistance or Immunity'],
  ['selectedTypeResistance', 'Resists Selected Type'],
  ['stabCoverage', 'Super-effective STAB Move']
].map(([key, label]) => ({ key, label }));

export function normalizeSingleTypeRecommendationWeights(value = {}) {
  return Object.fromEntries(
    Object.entries(DEFAULT_SINGLE_TYPE_RECOMMENDATION_WEIGHTS).map(
      ([key, defaultValue]) => {
        const parsed = Number(value?.[key]);
        return [key, Number.isFinite(parsed) ? parsed : defaultValue];
      }
    )
  );
}
