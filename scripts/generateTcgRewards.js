import fs from 'node:fs/promises';
import path from 'node:path';
import { GAMES } from '../src/tcg/storage.js';
const root = path.resolve(import.meta.dirname, '..');
const moves = JSON.parse(await fs.readFile(path.join(root, 'public/data/movesIndex.json'), 'utf8'));
const output = path.join(root, 'public/data/tcg/rewards');
await fs.mkdir(output, { recursive: true });
for (const game of GAMES) {
  const entries = moves.flatMap(move => (move.machineItems ?? []).filter(m => m.versionGroup === game && m.itemKind === 'TM').map(m => ({ name: move.name, type: move.type, tm: m.itemDisplayName })));
  entries.sort((a, b) => a.tm.localeCompare(b.tm, 'en', { numeric: true }));
  await fs.writeFile(path.join(output, `${game}.json`), JSON.stringify(entries));
}
console.log('Generated per-game TCG reward TM lists from existing PokéLore movesIndex.');
