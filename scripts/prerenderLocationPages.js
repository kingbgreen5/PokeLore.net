import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const escapeHtml = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const scriptJson = value => JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('&', '\\u0026').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
async function readJson(file, optional = false) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { if (optional && error.code === 'ENOENT') return null; throw error; }
}

export async function readLocationBundle(dataDir, slug) {
  const [location, locationItems, oaksNotes, pokemonGoNotes] = await Promise.all([
    readJson(path.join(dataDir, 'locations', `${slug}.json`)),
    readJson(path.join(dataDir, 'locationItems', `${slug}.json`), true),
    readJson(path.join(dataDir, 'oaksNotes', 'locations', `${slug}.json`), true),
    readJson(path.join(dataDir, 'pokemonGo', 'locations', `${slug}.json`), true)
  ]);
  const pokemonDetailsById = {};
  if (slug === 'friend-safari') {
    const ids = [...new Set(location.areas.flatMap(area => area.pokemonEncounters.map(entry => entry.pokemon.id)))];
    for (const id of ids) pokemonDetailsById[id] = await readJson(path.join(dataDir, 'pokemonData', `${id}.json`));
  }
  return { location, locationItems, oaksNotes, pokemonGoNotes, pokemonDetailsById };
}

export function locationHtml(template, seo, body, bundle) {
  // Remove every existing SEO tag, including duplicate tags or a prerendered homepage.
  const head = template.slice(0, template.indexOf('</head>'))
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*(?:name|property)\s*=\s*["'](?:description|robots|og:[^"']*|twitter:[^"']*|article:[^"']*)["'][^>]*>/gi, '')
    .replace(/<link\b[^>]*rel\s*=\s*["']canonical["'][^>]*>/gi, '')
    .replace(/<script\b[^>]*id=["']seo-structured-data["'][^>]*>[\s\S]*?<\/script>/gi, '');
  const tags = `<title>${escapeHtml(seo.title)}</title>
<meta name="description" content="${escapeHtml(seo.description)}">
<meta name="robots" content="${escapeHtml(seo.robots ?? 'max-image-preview:large')}">
${seo.canonical ? `<link rel="canonical" href="${escapeHtml(seo.canonical)}">\n<meta property="og:url" content="${escapeHtml(seo.canonical)}">` : ''}
<meta property="og:title" content="${escapeHtml(seo.title)}">
<meta property="og:description" content="${escapeHtml(seo.description)}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${escapeHtml(seo.title)}">
<meta name="twitter:description" content="${escapeHtml(seo.description)}">`;
  return `${head}${tags}</head><body><div id="root">${body}</div>${bundle ? `<script>window.__POKELORE_LOCATION__=${scriptJson(bundle)};</script>` : ''}</body></html>`;
}

export async function prerenderLocations({ distDir = path.join(root, 'dist'), dataDir = path.join(root, 'public/data'), slugs } = {}) {
  const template = await fs.readFile(path.join(distDir, 'index.html'), 'utf8');
  if (!/<script[^>]+src=["']\/assets\//.test(template)) throw new Error('Build template is missing application scripts');
  const entries = await readJson(path.join(dataDir, 'locationsIndex.json'));
  const names = entries.map(entry => entry.name);
  if (new Set(names).size !== names.length || names.some(name => !/^[a-z0-9]+(?:-+[a-z0-9]+)*$/.test(name))) throw new Error('Invalid or duplicate location slugs');
  const vite = await createServer({ appType: 'custom', logLevel: 'error', server: { middlewareMode: true } });
  try {
    const { default: Page } = await vite.ssrLoadModule('/src/pages/LocationDetailPage.jsx');
    const { locationSeo } = await vite.ssrLoadModule('/src/seo/seoConfig.js');
    const { validateLocation } = await vite.ssrLoadModule('/src/utils/locationData.js');
    for (const slug of slugs ?? names) {
      if (!names.includes(slug)) throw new Error(`Unknown location ${slug}`);
      const bundle = await readLocationBundle(dataDir, slug);
      validateLocation(bundle.location, slug);
      const body = renderToString(React.createElement(MemoryRouter, { initialEntries: [`/location/${slug}`] },
        React.createElement(Routes, null, React.createElement(Route, { path: '/location/:locationName', element: React.createElement(Page, { initialData: bundle }) }))));
      const html = locationHtml(template, locationSeo(bundle.location, bundle.locationItems), body, bundle);
      if (!body.includes(renderToString(React.createElement("h1", null, bundle.location.displayName))) || /Location not found|noindex/.test(html)) throw new Error(`Invalid prerender: ${slug}`);
      const directory = path.join(distDir, 'location', slug);
      // A previous finalized build may have left the exact extensionless file.
      const existing = await fs.stat(directory).catch(error => { if (error.code !== 'ENOENT') throw error; });
      if (existing?.isFile()) await fs.unlink(directory);
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(path.join(directory, 'index.html'), html);
    }
    await fs.writeFile(path.join(distDir, 'location-fallback.html'), locationHtml(template, {
      title: 'Loading location | PokéLore', description: 'Loading location details.'
    }, '<main><h1>Loading location</h1><p>Location details are loading. Please try again if they remain unavailable.</p><a href="/locations">Back To Locations</a></main>'));
    console.log(`Prerendered ${(slugs ?? names).length} location pages.`);
  } finally { await vite.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  prerenderLocations().catch(error => { console.error(error); process.exitCode = 1; });
}
