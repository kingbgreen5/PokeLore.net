// @vitest-environment node
import fs from 'node:fs/promises';
import os from 'node:os';
import React from 'react';
import { renderToString } from 'react-dom/server';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { prerenderLocations, locationHtml } from './prerenderLocationPages.js';
import { finalizeLocationRoutes } from './finalizeLocationPrerenderRoutes.js';

const slugs = ['pokeathlon-dome', 'kanto-route-2', 'goldenrod-city', 'mt-moon', 'friend-safari', 'hauoli-city'];
describe('Location static build and hosting', () => {
  it('renders real pages and preserves their HTML at exact Render paths', async () => {
    const distDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pokelore-location-test-'));
    try {
      await fs.writeFile(path.join(distDir, 'index.html'), '<!doctype html><html><head><title>Home</title><meta name="description" content="Home"><link rel="canonical" href="https://pokelore.net/"><script type="module" src="/assets/app.js"></script></head><body><div id="root"><h1>Homepage</h1></div></body></html>');
      await prerenderLocations({ distDir, slugs });
      const pages = new Map();
      for (const slug of slugs) {
        const location = JSON.parse(await fs.readFile(`public/data/locations/${slug}.json`, 'utf8'));
        const html = await fs.readFile(path.join(distDir, 'location', slug, 'index.html'), 'utf8');
        pages.set(slug, html);
        expect(html).toContain(renderToString(React.createElement("h1", null, location.displayName)));
        expect(html).toContain(`<title>${location.displayName.replaceAll("'", "&#39;")} Guide`);
        expect(html).toContain(`href="https://pokelore.net/location/${slug}"`);
        expect(html).toContain('<meta name="description"');
        expect(html).toContain('Pokémon Encounters');
        expect(html).not.toMatch(/Location not found|noindex|<h1>Homepage/);
        expect(html.match(/rel="canonical"/g)).toHaveLength(1);
        expect(html.match(/name="description"/g)).toHaveLength(1);
      }
      expect(pages.get('pokeathlon-dome')).toContain('Athlete Shop');
      expect(pages.get('pokeathlon-dome')).toContain('Pokémon HeartGold');
      expect(pages.get('pokeathlon-dome')).toContain('Johto');
      await finalizeLocationRoutes(distDir, slugs);
      for (const slug of slugs) expect(await fs.readFile(path.join(distDir, 'location', slug), 'utf8')).toBe(pages.get(slug));
      const fallback = await fs.readFile(path.join(distDir, 'location-fallback.html'), 'utf8');
      expect(fallback).not.toMatch(/canonical|noindex|Location not found|Homepage/);
      expect(fallback).toContain('/assets/app.js');
      const yaml = await fs.readFile('render.yaml', 'utf8');
      expect(yaml).toContain('path: /location/*\n        name: Content-Type\n        value: text/html; charset=utf-8');
      expect(yaml.indexOf('source: /location/*')).toBeLessThan(yaml.indexOf('source: /*'));
      expect(yaml).toContain('source: /location/*\n        destination: /location-fallback.html');
    } finally {
      // The path is exclusively created by mkdtemp inside the OS temporary directory.
      if (path.dirname(distDir) === path.resolve(os.tmpdir())) {
        await fs.rm(distDir, { recursive: true, force: true });
      }
    }
  }, 120000);
  it('clears duplicate stale head metadata and safely embeds data', () => {
    const html = locationHtml('<html><head><title>Home</title><meta content="old" property="og:url"><meta property="og:url" content="old"><link href="old" rel="canonical"></head><body></body></html>', { title: 'Location', description: 'Details' }, '<h1>Location</h1>', { text: '</script><script>bad</script>' });
    expect(html).not.toContain('old');
    expect(html).toContain('\\u003c/script>');
  });
  it('sitemap location URLs exactly match canonical data with no aliases or missing files', async () => {
    const entries = JSON.parse(await fs.readFile('public/data/locationsIndex.json', 'utf8'));
    const sitemap = await fs.readFile('public/sitemap.xml', 'utf8');
    const urls = [...sitemap.matchAll(/<loc>https:\/\/pokelore.net\/location\/([^<]+)<\/loc>/g)].map(match => match[1]);
    expect(urls.sort()).toEqual(entries.map(entry => entry.name).sort());
    const files = (await fs.readdir('public/data/locations')).filter(file => file.endsWith('.json')).map(file => file.slice(0, -5));
    expect(files.sort()).toEqual([...urls].sort());
  });
});
