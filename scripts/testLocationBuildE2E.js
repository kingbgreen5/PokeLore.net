// Tests the compiled build using a local exact-file-first static server.
// This models Render routing; deployed HTTP responses must still be verified.
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const root=path.resolve('dist');
const server=http.createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let file=path.resolve(root,'.'+pathname);
    if(file!==root && !file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    let stat=await fs.stat(file).catch(()=>null);
    if(stat?.isDirectory()){file=path.join(file,'index.html');stat=await fs.stat(file).catch(()=>null);}
    if(!stat?.isFile()) file=path.join(root,pathname.startsWith('/location/')?'location-fallback.html':pathname.startsWith('/item/')?'item-fallback.html':'index.html');
    const type={'.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'}[path.extname(file)]??'text/html; charset=utf-8';
    res.writeHead(200,{'Content-Type':type});res.end(await fs.readFile(file));
  }catch(error){res.writeHead(500).end(String(error));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;
try {
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
