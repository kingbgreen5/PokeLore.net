// Optional network audit against the current production React implementation.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '../../node_modules/playwright/index.mjs';
import { loadPokemon } from '../src/lib/pokemonData.js';

const localOrigin = process.argv[2] ?? 'http://127.0.0.1:4321';
const slugs = ['kakuna', 'eevee', 'raichu-alola', 'rotom-heat', 'meowstic-female', 'minior-blue', 'palafin-hero', 'ogerpon-wellspring-mask'];
const normalize = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const browser = await chromium.launch({ headless: true });
const report = [];
try {
  for (const slug of slugs) {
    const data = loadPokemon(slug);
    const pair = {};
    for (const [label, origin, javaScriptEnabled] of [
      ['production', 'https://pokelore.net', true],
      ['astro', localOrigin, false]
    ]) {
      const page = await browser.newPage({ javaScriptEnabled, viewport: { width: 1440, height: 1000 } });
      const response = await page.goto(`${origin}/pokemon/${slug}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      assert.equal(response.status(), 200, `${label} ${slug}`);
      await page.locator('h1').waitFor({ timeout: 30000 });
      if (javaScriptEnabled) {
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1200);
      }
      // textContent includes closed accordion contents, which are present in the
      // document even though innerText correctly excludes them from view.
      const text = normalize(await page.locator('body').textContent());
      const optionalEditorial = ['playthrough', 'competitive', 'nuzlocke', 'biologyAndBehavior']
        .map(key => data.analysis[key])
        .filter(Boolean);
      const firstEncounter = data.encounters?.locations?.[0]?.location?.displayName;
      pair[label] = {
        h1: normalize(await page.locator('h1').innerText()),
        title: await page.title(),
        abilityNamesPresent: data.abilities.every(ability => text.includes(ability.name)),
        typesPresent: (await Promise.all(data.p.types.map(async type =>
          text.toLowerCase().includes(type) || await page.locator(`img[alt*="${type}" i], img[src*="/${type}."]`).count() > 0
        ))).every(Boolean),
        statsPresent: Object.values(data.p.stats).every(value => text.includes(String(value))),
        evolutionHeading: text.includes('Evolution Chain'),
        learnsetHeading: text.includes('Learnsets'),
        encountersHeading: (text.includes('Where To Find') || text.includes('Where to Find')) === data.hasEncounters,
        artworkForRoutePresent: await page.locator(`img[src*="/${data.p.id}."]`).count() > 0,
        dexEntryPresent: data.p.dexEntries.length === 0 || text.includes(normalize(data.p.dexEntries[0].text)),
        editorialContentPresent: optionalEditorial.every(value => text.includes(normalize(value))),
        encounterContentPresent: !firstEncounter || text.includes(normalize(firstEncounter)),
        catchRatePresent: text.includes(String(data.p.catchRate)),
        hatchCounterPresent: text.includes(String(data.p.hatchCounter)),
        heightPresent: text.includes(String(data.p.height / 10)),
        weightPresent: !Number.isFinite(data.p.weight) || data.p.weight <= 0 || text.includes(String(data.p.weight / 10))
      };
      await page.close();
    }
    report.push({ slug, ...pair });
  }
  mkdirSync('evidence/stress', { recursive: true });
  writeFileSync('evidence/stress/production-comparison.json', JSON.stringify(report, null, 2));
  for (const entry of report) {
    for (const [field, passed] of Object.entries(entry.astro)) {
      if (typeof passed === 'boolean') assert(passed, `astro ${entry.slug}: ${field}`);
    }
    for (const field of ['abilityNamesPresent', 'typesPresent', 'statsPresent', 'evolutionHeading', 'learnsetHeading', 'artworkForRoutePresent']) {
      assert(entry.production[field], `production ${entry.slug}: ${field}`);
    }
  }
  console.log(`PASS: production parity sample covers ${report.length} routes and visible identity, types, abilities, stats, evolution, artwork, learnsets, Pokédex text, encounters, editorial content, and biological facts.`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
