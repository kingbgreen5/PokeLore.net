import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// As on Pokemon pages, Render serves exact files before applying SPA rewrites.
// Move index.html to its extensionless canonical path without changing its bytes.
export async function finalizeLocationRoutes(distDir = path.join(root, 'dist'), slugs) {
  const names = slugs ?? JSON.parse(await fs.readFile(path.join(root, 'public/data/locationsIndex.json'), 'utf8')).map(entry => entry.name);
  for (const slug of names) {
    if (!/^[a-z0-9]+(?:-+[a-z0-9]+)*$/.test(slug)) throw new Error(`Unsafe slug: ${slug}`);
    const target = path.resolve(distDir, 'location', slug);
    const index = path.join(target, 'index.html');
    const html = await fs.readFile(index, 'utf8');
    if (!html.includes(`href="https://pokelore.net/location/${slug}"`) || !/<h1>[^<]+<\/h1>/.test(html) || /Location not found|noindex/.test(html)) throw new Error(`Invalid location HTML: ${slug}`);
    await fs.rename(index, `${target}.html`);
    await fs.rmdir(target); // Only removes the now-empty directory; never recursively deletes.
    await fs.rename(`${target}.html`, target);
  }
  console.log(`Finalized ${names.length} exact location static files.`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  finalizeLocationRoutes().catch(error => { console.error(error); process.exitCode = 1; });
}
