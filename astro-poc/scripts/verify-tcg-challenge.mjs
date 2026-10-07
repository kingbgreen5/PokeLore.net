import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const dist = join(process.cwd(), 'dist');
const required = ['tcg-challenge.html', 'data/tcg/v1/sets.json', 'data/tcg/v1/base1.json', 'data/tcg/v1/neo4.json', 'data/tcg/artwork.json', 'images/tcg/card-back.webp'];
for (const file of required) if (!existsSync(join(dist, file))) throw new Error(`Missing TCG Challenge artifact: ${file}`);
const html = readFileSync(join(dist, 'tcg-challenge.html'), 'utf8');
for (const text of ['Pokémon Card Challenge Run Generator', 'How the One Pack Challenge Works', 'interactive pack opener requires JavaScript']) if (!html.includes(text)) throw new Error(`Missing static shell text: ${text}`);
if (!html.includes('https://pokelore.net/tcg-challenge')) throw new Error('Missing canonical URL');
for (const dataName of ['base1.json', 'neo4.json', 'pokemonIndex.json']) if (html.includes(dataName)) throw new Error(`Runtime data serialized into HTML: ${dataName}`);
const assets = readdirSync(join(dist, '_astro'));
const island = assets.find(file => file.startsWith('TcgChallengeTool.') && file.endsWith('.js'));
if (!island) throw new Error('Missing TCG Challenge island bundle');
console.log(JSON.stringify({ route: 'tcg-challenge.html', html: { raw: Buffer.byteLength(html), gzip: gzipSync(html).length }, island: { path: `_astro/${island}`, bytes: statSync(join(dist, '_astro', island)).size }, hydrationPropsBytes: 0, requiredAssets: required }, null, 2));
