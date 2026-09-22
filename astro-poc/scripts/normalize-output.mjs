import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, realpathSync, renameSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';

// Rename only self-canonical file-format pages. Never rewrite their contents.
export function normalizeOutput(directory, origin = 'https://pokelore.net') {
  const root = realpathSync(directory);
  const files = [];
  function walk(folder) {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      assert(!entry.isSymbolicLink(), `Output must not contain symlinks: ${entry.name}`);
      const path = join(folder, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile()) files.push(path);
    }
  }
  walk(root);

  // Preflight every rename before changing any file (including collisions).
  const changes = [];
  for (const source of files) {
    if (!source.endsWith('.html') || ['index.html', '404.html'].includes(basename(source))) continue;
    const document = parseHTML(readFileSync(source, 'utf8')).document;
    const canonicals = document.querySelectorAll('link[rel="canonical"]');
    if (!canonicals.length) continue;
    assert.equal(canonicals.length, 1, `Multiple canonicals: ${source}`);
    const canonical = new URL(canonicals[0].getAttribute('href'));
    if (canonical.origin !== origin || canonical.search || canonical.hash) continue;
    const localPath = relative(root, source).replaceAll('\\', '/');
    const targetPath = localPath.slice(0, -'.html'.length);
    // Restrict to safe, extensionless slug segments. No traversal, encoded paths,
    // directory indexes, aliases, or asset-shaped canonical URLs are inferred.
    if (!/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(targetPath)) continue;
    if (canonical.pathname !== `/${targetPath}`) continue;
    const target = join(root, targetPath);
    assert(!existsSync(target), `Normalization destination already exists: ${targetPath}`);
    changes.push({ source, target, from: localPath, to: targetPath });
  }

  for (const { source, target } of changes) {
    const original = readFileSync(source);
    renameSync(source, target);
    assert(readFileSync(target).equals(original), `Content changed during rename: ${target}`);
    assert(!existsSync(source), `HTML alias still exists: ${source}`);
  }
  return changes.map(({ from, to }) => ({ from, to }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = fileURLToPath(new URL('../dist/', import.meta.url));
  const changes = normalizeOutput(output);
  for (const { from, to } of changes) console.log(`Normalized ${from} → ${to}`);
  console.log(`Normalized ${changes.length} canonical pages; document bytes preserved.`);
}
