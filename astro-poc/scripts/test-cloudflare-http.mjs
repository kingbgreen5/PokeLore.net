// Run against `npx wrangler dev --local --port 8787`, or pass a deployed origin.
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
const origin = process.argv[2] ?? 'http://127.0.0.1:8787';
const registry = JSON.parse(readFileSync('../public/data/pokemonRoutes.json','utf8'));
const results = [];
async function check(path, status, location, html = false) {
  for(const method of ['HEAD','GET']) {
    const response = await fetch(new URL(path, origin), {method, redirect:'manual'});
    const result = {path,method,status:response.status,location:response.headers.get('location'),type:response.headers.get('content-type'),robots:response.headers.get('x-robots-tag')};
    results.push(result);
    assert.equal(response.status,status,`${method} ${path}`);
    if(location) {
      assert.equal(new URL(result.location, origin).pathname,location,`${path}: Location`);
    } else assert.equal(result.location,null,`${path}: no unnecessary redirect`);
    if(html) {
      assert.match(result.type,/^text\/html/);
      assert.match(result.robots,/noindex/);
    }
    if(method==='GET') {
      const body=await response.text();
      if(status===404) assert.match(body,/Page not found/);
      if(status===200 && path.startsWith('/pokemon/')) {
        const document=parseHTML(body).document;
        assert.equal(document.querySelector('link[rel="canonical"]').getAttribute('href'),`https://pokelore.net${path}`);
        assert(document.querySelector('#abilities'));
      }
    }
  }
}
await check('/',200,null,true);
for(const slug of ['kakuna','pikachu','charizard','raichu-alola']) {
  await check(`/pokemon/${slug}`,200,null,true);
  await check(`/pokemon/${slug}/`,301,`/pokemon/${slug}`);
  await check(`/pokemon/${slug}.html`,301,`/pokemon/${slug}`);
}
// Check all authoritative legacy IDs, including unmigrated destinations.
const entries=Object.entries(registry.byId);
for(let i=0;i<entries.length;i+=25) {
  await Promise.all(entries.slice(i,i+25).map(([id,slug])=>check(`/pokemon/${id}`,301,`/pokemon/${slug}`)));
}
await check('/pokemon/14/',301,'/pokemon/14');
const followed=await fetch(new URL('/pokemon/14/',origin));
assert.equal(followed.status,200);
assert.equal(new URL(followed.url).pathname,'/pokemon/kakuna');
await check('/pokemon/not-a-real-pokemon',404,null,true);
await check('/random-garbage-path',404,null,true);
await check('/pokemon/999999',404,null,true);
await check('/pokemon/baxcalibur-mega',404,null,true); // Correct destination, not migrated.
const page=await (await fetch(new URL('/pokemon/kakuna',origin))).text();
const document=parseHTML(page).document;
const css=document.querySelector('link[rel="stylesheet"]').getAttribute('href');
for(const [path,mime] of [[css,/text\/css/],['/data/search.json',/application\/json/],['/images/pokemon/official/detail/14.webp',/image\/webp/]]) {
  const response=await fetch(new URL(path,origin));
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-type'),mime);
  assert.match(response.headers.get('x-robots-tag'),/noindex/);
}
mkdirSync('evidence/cloudflare',{recursive:true});
writeFileSync('evidence/cloudflare/http-results.json',JSON.stringify({origin,checkedAt:new Date().toISOString(),results},null,2));
console.log(`PASS: ${entries.length} numeric redirects; canonical 200s; slash/.html 301s; two-hop numeric slash; custom 404s; MIME; noindex; assets (HEAD and GET).`);
