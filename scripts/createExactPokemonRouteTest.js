import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const pokemonDistDir = path.join(repoRoot, "dist", "pokemon");
const numericRaichuPath = path.join(pokemonDistDir, "26");

const numericRedirectShell = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Raichu - PokeLore</title>
  <link rel="canonical" href="https://pokelore.net/pokemon/raichu">
  <meta http-equiv="refresh" content="0; url=/pokemon/raichu">
</head>
<body>
  <p>
    Redirecting to
    <a href="/pokemon/raichu">Raichu</a>.
  </p>
</body>
</html>
`;

function assertRegularFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} does not exist: ${filePath}`);
  }

  if (!fs.statSync(filePath).isFile()) {
    throw new Error(`${label} is not a regular file: ${filePath}`);
  }
}

function createExtensionlessCanonicalPrerender(slug, label) {
  const routeDir = path.join(pokemonDistDir, slug);
  const indexPath = path.join(routeDir, "index.html");
  const extensionlessPath = path.join(pokemonDistDir, slug);

  assertRegularFile(
    indexPath,
    `Expected ${label} prerender output`
  );

  const html = fs.readFileSync(indexPath, "utf8");

  fs.rmSync(routeDir, {
    force: true,
    recursive: true
  });
  fs.writeFileSync(extensionlessPath, html);
}

createExtensionlessCanonicalPrerender("raichu", "Raichu");
createExtensionlessCanonicalPrerender("pikachu", "Pikachu");
fs.writeFileSync(numericRaichuPath, numericRedirectShell);

console.log(
  "Created extensionless route test files at dist/pokemon/26, dist/pokemon/raichu, and dist/pokemon/pikachu."
);
