import { PACK_RULES } from './packRules.js';
import { VERSION_GROUP_ORDER } from '../constants/versionOrder.js';
import { ORDER_LABELS } from './packPresentation.js';
export const SAVE_KEY = 'pokelore:tcg-challenges:v1';
export const GAMES = VERSION_GROUP_ORDER.filter(g => !['the-isle-of-armor', 'the-crown-tundra', 'the-teal-mask', 'the-indigo-disk', 'brilliant-diamond-and-shining-pearl'].includes(g));
export function validSetup(value) {
  return value && GAMES.includes(value.game) && Object.hasOwn(PACK_RULES, value.set) &&
    typeof value.seed === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value.seed) && value.modelVersion === 'v1' &&
    (value.order === undefined || Object.hasOwn(ORDER_LABELS, value.order));
}
export function readSetup(search) {
  const p = new URLSearchParams(search);
  const setup = { game: p.get('game'), set: p.get('set'), seed: p.get('seed'), modelVersion: p.get('model') ?? 'v1' };
  if (p.has('order')) setup.order = p.get('order');
  return validSetup(setup) ? setup : null;
}
export function challengeUrl(challenge) {
  return `/tcg-challenge?${new URLSearchParams({ game: challenge.game, set: challenge.set, seed: challenge.seed, model: challenge.modelVersion, ...(challenge.order ? { order: challenge.order } : {}) })}`;
}
export function newChallenge(setup) {
  return { ...setup, id: crypto.randomUUID(), name: `${PACK_RULES[setup.set].name} challenge`, packs: [], team: [], progress: '', createdAt: new Date().toISOString() };
}
export function validSave(c) {
  return validSetup(c) && typeof c.id === 'string' && typeof c.name === 'string' &&
    typeof c.progress === 'string' && Array.isArray(c.team) && c.team.every(id => Number.isInteger(id) && id > 0 && id <= 251) &&
    Array.isArray(c.packs) && c.packs.every(p => p && Array.isArray(p.cards) && p.cards.length === 11 &&
      p.cards.every(card => card && typeof card.id === 'string' && card.id.startsWith(`${c.set}-`) && typeof card.pool === 'string') &&
      Number.isInteger(p.revealed) && p.revealed >= 0 && p.revealed <= p.cards.length &&
      (p.revealedIndices === undefined || (Array.isArray(p.revealedIndices) && p.revealedIndices.length === p.revealed &&
        new Set(p.revealedIndices).size === p.revealed && p.revealedIndices.every(i => Number.isInteger(i) && i >= 0 && i < p.cards.length))));
}
export function loadChallenges(storage) {
  try {
    const text = storage.getItem(SAVE_KEY);
    if (!text) return { challenges: [], error: '' };
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed) || !parsed.every(validSave)) throw new Error('Invalid save');
    return { challenges: parsed, error: '' };
  } catch { return { challenges: [], error: 'Saved challenges could not be read. Existing browser data has been left untouched.' }; }
}
export function saveChallenges(storage, challenges) {
  try { storage.setItem(SAVE_KEY, JSON.stringify(challenges)); return ''; }
  catch { return 'Browser saving is unavailable or full. Keep this page open; new progress is only in memory.'; }
}
