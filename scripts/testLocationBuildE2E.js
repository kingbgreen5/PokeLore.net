// Tests the compiled build using a local exact-file-first static server.
// This models Render routing; deployed HTTP responses must still be verified.
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const root=path.resolve('dist');
const renderYaml = await fs.readFile('render.yaml', 'utf8');
const headerRules = [...renderYaml.matchAll(/- path: (\/\S+)\s+name: Content-Type\s+value: ([^\r\n]+)/g)]
  .map(([, pattern, value]) => ({ prefix: pattern.replace(/\*$/, ''), value: value.trim() }));
const mimeTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
function contentType(file, pathname, rules = headerRules) {
  return rules.find(rule => pathname.startsWith(rule.prefix))?.value
    ?? mimeTypes[path.extname(file)] ?? 'application/octet-stream';
}
// Without the host rule, extensionless HTML is binary even when its body is correct.
assert.equal(contentType('dist/location/pokeathlon-dome', '/location/pokeathlon-dome', []), 'application/octet-stream');
for (const namespace of ['location', 'pokemon', 'item']) {
  const files = await fs.readdir(path.join(root, namespace), { withFileTypes: true });
  for (const file of files) {
    assert(file.isFile() && !path.extname(file.name), `Non-document resource under /${namespace}/: ${file.name}`);
    assert.match((await fs.readFile(path.join(root, namespace, file.name), 'utf8')).slice(0, 200), /<!doctype html>/i);
  }
}
const server=http.createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let file=path.resolve(root,'.'+pathname);
    if(file!==root && !file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    let stat=await fs.stat(file).catch(()=>null);
    if(stat?.isDirectory()){file=path.join(file,'index.html');stat=await fs.stat(file).catch(()=>null);}
    if(!stat?.isFile()) file=path.join(root,pathname.startsWith('/location/')?'location-fallback.html':pathname.startsWith('/item/')?'item-fallback.html':'index.html');
    const type=contentType(file, pathname);
    res.writeHead(200,{'Content-Type':type});res.end(await fs.readFile(file));
  }catch(error){res.writeHead(500).end(String(error));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;
try {
  const assets = await fs.readdir(path.join(root, 'assets'));
  const imageDir = path.join(root, 'assets/type-badges');
  const image = (await fs.readdir(imageDir)).find(file => file.endsWith('.png'));
  const checks = [
    ['/', 'text/html'], ['/pokemon/pikachu', 'text/html'],
    ['/assets/' + assets.find(file => file.endsWith('.css')), 'text/css'],
    ['/assets/' + assets.find(file => file.endsWith('.js')), 'text/javascript'],
    ['/data/locations/pokeathlon-dome.json', 'application/json'],
    ['/assets/type-badges/' + image, 'image/png']
  ];
  for (const [pathname, expected] of checks) {
    const response = await fetch(base + pathname, { method: 'HEAD' });
    assert.equal(response.status, 200);
    assert(response.headers.get('content-type').startsWith(expected), pathname);
    console.log(`MIME regression: ${pathname} -> ${response.headers.get('content-type')}`);
  }
  browser=await chromium.launch();
  const noJs=await browser.newContext({javaScriptEnabled:false});
  await noJs.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  const page=await noJs.newPage();
  for(const slug of ['pokeathlon-dome','kanto-route-2','goldenrod-city','mt-moon','friend-safari','hauoli-city']){
    const location=JSON.parse(await fs.readFile(`public/data/locations/${slug}.json`,'utf8'));
    const response=await fetch(`${base}/location/${slug}`);const html=await response.text();
    assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/text\/html/);
    assert(!/Location not found|noindex/.test(html));
    await page.goto(`${base}/location/${slug}`);
    assert.equal(await page.locator('h1').textContent(),location.displayName);
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),`https://pokelore.net/location/${slug}`);
    if(slug==='pokeathlon-dome') assert((await page.locator('body').innerText()).includes('Athlete Shop'));
    console.log(`Raw HTTP + JavaScript-disabled browser: ${slug} passed`);
  }
  await noJs.close();
  const context=await browser.newContext();
  await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  const interactive=await context.newPage();const errors=[];interactive.on('pageerror',error=>errors.push(error.message));
  await interactive.goto(`${base}/location/pokeathlon-dome`);
  await interactive.locator('#location-item-version-filter').selectOption('Pokémon HeartGold');
  assert.equal(await interactive.locator('h1').textContent(),'Pokéathlon Dome');
  assert.equal(await interactive.locator('link[rel=canonical]').getAttribute('href'),'https://pokelore.net/location/pokeathlon-dome');
  await interactive.getByRole('link',{name:'Back To Locations',exact:true}).click();
  await interactive.waitForURL('**/locations');
  await interactive.goto(`${base}/locations`);
  await interactive.route('**/data/locations/pokeathlon-dome.json',route=>route.abort());
  await interactive.evaluate(()=>{history.pushState({},'', '/location/pokeathlon-dome');window.dispatchEvent(new PopStateEvent('popstate'));});
  await interactive.getByRole('heading',{name:'Location temporarily unavailable',exact:true}).waitFor();
  assert.equal(await interactive.locator('link[rel=canonical]').count(),0);
  assert(!(await interactive.locator('meta[name=robots]').getAttribute('content')).includes('noindex'));
  await interactive.unroute('**/data/locations/pokeathlon-dome.json');
  await interactive.getByRole('button',{name:'Try again'}).click();
  await interactive.getByRole('heading',{name:'Pokéathlon Dome',exact:true}).waitFor();
  await interactive.goto(`${base}/location/not-a-real-location`);
  await interactive.getByRole('heading',{name:'Location not found',exact:true}).waitFor();
  assert.equal(await interactive.locator('link[rel=canonical]').count(),0);
  assert.equal(await interactive.locator('meta[name=robots]').getAttribute('content'),'noindex, follow');
  assert.deepEqual(errors,[]);
  console.log('Compiled client: version filter, navigation, transient failure, retry and genuine 404 passed');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
