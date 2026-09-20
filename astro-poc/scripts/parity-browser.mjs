import { chromium } from '../../node_modules/playwright/index.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
mkdirSync('evidence/phase1b', {recursive:true});
const browser = await chromium.launch({headless:true});
const errors=[];
try {
  for(const [label,origin] of [['production','https://pokelore.net'],['source','http://127.0.0.1:5180'],['astro','http://127.0.0.1:4321']]) {
    for(const width of [1440,390]) {
      const page=await browser.newPage({viewport:{width,height:1000}});
      page.on('pageerror',e=>errors.push({label,width,error:e.message}));
      try {
        await page.goto(`${origin}/pokemon/kakuna`,{waitUntil:'domcontentloaded',timeout:45000});
        await page.locator('h1').waitFor();
        await page.waitForTimeout(4000);
        await page.screenshot({path:`evidence/phase1b/${label}-${width}-hero.png`});
        const evolution=page.getByRole('heading',{name:'Evolution Chain',exact:true});
        await evolution.scrollIntoViewIfNeeded();
        await page.screenshot({path:`evidence/phase1b/${label}-${width}-sections.png`});
        if(label==='astro') {
          await page.locator('#learnset summary').click();
          await page.waitForTimeout(500);
          await page.locator('#learnset').screenshot({path:`evidence/phase1b/${label}-${width}-learnset.png`});
          assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}: overflow`);
        }
      } catch(e) { if(label==='astro') throw e; console.log(`${label}: capture unavailable: ${e.message}`); }
      await page.close();
    }
  }
  writeFileSync('evidence/phase1b/browser-errors.json',JSON.stringify(errors,null,2));
  console.log(JSON.stringify(errors));
} finally { await browser.close(); }
