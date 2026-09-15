import { expect, it } from 'vitest';
import { canReveal, isRevealed, revealCard } from './reveal';

for (const size of [9, 10, 11]) it(`reveals ${size} cards with two initial choices and sequential unlocking`, () => {
  let pack = { cards: Array(size).fill({ id: 'test' }), revealed: 0 };
  expect(canReveal(pack, 0)).toBe(true);
  expect(canReveal(pack, 1)).toBe(true);
  expect(canReveal(pack, 2)).toBe(false);
  expect(revealCard(pack, 2)).toBe(pack);
  pack = revealCard(pack, 1);
  expect(isRevealed(pack, 0)).toBe(false);
  expect(isRevealed(pack, 1)).toBe(true);
  expect(canReveal(pack, 2)).toBe(false);
  expect(revealCard(pack, 1)).toBe(pack);
  pack = revealCard(JSON.parse(JSON.stringify(pack)), 0);
  for (let i = 2; i < size; i++) {
    expect(canReveal(pack, i)).toBe(true);
    expect(canReveal(pack, i + 1)).toBe(false);
    pack = revealCard(pack, i);
  }
  expect(pack.revealed).toBe(size);
});
it('resumes the revealed prefix in existing saves', () => {
  const pack = { cards: Array(11).fill({ id: 'test' }), revealed: 3 };
  expect(isRevealed(pack, 2)).toBe(true);
  expect(canReveal(pack, 3)).toBe(true);
  expect(revealCard(pack, 3).revealedIndices).toEqual([0, 1, 2, 3]);
});
