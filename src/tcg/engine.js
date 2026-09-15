export function seededRandom(seed) {
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = Math.imul(state ^ state >>> 15, 1 | state);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function generatePack(data, { game, seed, modelVersion = 'v1' }, packIndex) {
  if (modelVersion !== data.rules.modelVersion) throw new Error('This challenge needs a different pack model.');
  if (!Number.isSafeInteger(packIndex) || packIndex < 0) throw new Error('Invalid pack number');
  const random = seededRandom(JSON.stringify([modelVersion, game, data.id, seed, packIndex]));
  const result = [];
  const used = new Set();
  for (const slot of data.rules.slots) {
    for (let i = 0; i < slot.count; i++) {
      let pool = slot.pool;
      if (slot.distribution) {
        let roll = random();
        pool = slot.distribution.at(-1).pool;
        for (const option of slot.distribution) {
          roll -= option.probability;
          if (roll < 0) { pool = option.pool; break; }
        }
      }
      const candidates = data.pools[pool].filter(id => !slot.unique || !used.has(id));
      if (!candidates.length) throw new Error(`Empty pool: ${pool}`);
      const weights = candidates.map(id => data.weights?.[id] ?? 1);
      let roll = random() * weights.reduce((a, b) => a + b, 0);
      let id = candidates.at(-1);
      for (let j = 0; j < candidates.length; j++) {
        roll -= weights[j];
        if (roll < 0) { id = candidates[j]; break; }
      }
      used.add(id);
      result.push({ id, pool });
    }
  }
  return result;
}

export function validateSet(data) {
  const { rules, cards, pools } = data;
  const errors = [];
  const ids = new Set(cards.map(c => c.id));
  if (ids.size !== cards.length) errors.push('Duplicate card IDs');
  if (rules.slots.reduce((n, s) => n + s.count, 0) !== rules.cardsPerPack) errors.push('Pack size');
  for (const slot of rules.slots) {
    if (!Number.isInteger(slot.count) || slot.count < 1) errors.push('Invalid slot count');
    if (slot.distribution && (Math.abs(slot.distribution.reduce((n, d) => n + d.probability, 0) - 1) > 1e-12 || slot.distribution.some(d => d.probability <= 0))) errors.push('Probabilities');
    for (const pool of slot.distribution?.map(d => d.pool) ?? [slot.pool]) {
      if (!pools[pool]?.length || pools[pool].some(id => !ids.has(id))) errors.push(`Invalid pool ${pool}`);
      if (slot.unique && new Set(pools[pool]).size < slot.count) errors.push(`Insufficient pool ${pool}`);
    }
  }
  for (const card of cards) {
    if (card.dexIds.some(id => !Number.isInteger(id) || id < 1 || id > 251)) errors.push(`Dex mapping ${card.id}`);
  }
  for (const id of rules.specialIds) if (!ids.has(id) || !Object.values(pools).some(p => p.includes(id))) errors.push(`Special ${id}`);
  for (const id of rules.excludedIds) if (Object.values(pools).some(p => p.includes(id))) errors.push(`Excluded ${id}`);
  return errors;
}
