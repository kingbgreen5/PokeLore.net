// Older saves store a revealed prefix; newer saves also allow card two before card one.
export const revealedIndices = pack => pack.revealedIndices ?? Array.from({ length: pack.revealed }, (_, i) => i);
export const isRevealed = (pack, index) => revealedIndices(pack).includes(index);
export function canReveal(pack, index) {
  if (index < 0 || index >= pack.cards.length || isRevealed(pack, index)) return false;
  return index < 2 || Array.from({ length: index }, (_, i) => i).every(i => isRevealed(pack, i));
}
export function revealCard(pack, index) {
  if (!canReveal(pack, index)) return pack;
  const indices = [...revealedIndices(pack), index].sort((a, b) => a - b);
  return { ...pack, revealed: indices.length, revealedIndices: indices };
}
