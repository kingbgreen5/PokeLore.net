import fs from 'node:fs/promises';
import path from 'node:path';
import { tcgChallengeSeo } from '../src/seo/seoConfig.js';
const root = path.resolve(import.meta.dirname, '..');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const seo = tcgChallengeSeo();
const template = await fs.readFile(path.join(root, 'dist/index.html'), 'utf8');
if (!template.includes('<div id="root"></div>')) throw new Error('Prerender TCG before the homepage.');
const tags = `<title>${escape(seo.title)}</title><meta name="description" content="${escape(seo.description)}"><link rel="canonical" href="${seo.canonical}"><meta name="robots" content="${seo.robots}">`;
const shell = `<main style="max-width:1000px;margin:auto;padding:2rem;font-family:system-ui;color:#d1d5db;background:#16171d"><h1>Pokémon Card Challenge Run Generator &amp; Virtual Pack Opener</h1><p>Choose a Pokémon videogame, choose a historical English TCG set, and virtually open booster packs to build your challenge team. No physical vintage packs required.</p><p>Support includes Base Set, Jungle, Fossil, Base Set 2, Team Rocket, Gym Heroes, Gym Challenge, Neo Genesis, Neo Discovery, Neo Revelation and Neo Destiny.</p><h2>How card challenge runs work</h2><p>Use the Pokémon depicted on your pulled cards in your videogame playthrough. Try one starting pack and another after each badge, or choose your own rules. Energy offers optional TM rewards. Save progress in this browser and share a seed to reproduce the same packs.</p><p>Historical pull rates are modeled from known pack composition and collector-documented box collation. Exact odds may vary by print run and were not always officially published.</p><noscript>Enable JavaScript to open packs and save your challenge.</noscript><p><a href="/tools">Explore Pokémon tools</a></p></main>`;
const html = template.replace(/<title>[\s\S]*?<\/title>/i, '')
  .replace(/<meta\s+name=["'](?:description|robots)["'][^>]*>/gi, '')
  .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '')
  .replace('</head>', `${tags}</head>`).replace('<div id="root"></div>', `<div id="root">${shell}</div>`);
await fs.mkdir(path.join(root, 'dist/tcg-challenge'), { recursive: true });
await fs.writeFile(path.join(root, 'dist/tcg-challenge/index.html'), html);
console.log('Prerendered /tcg-challenge with canonical SEO and crawlable content.');
