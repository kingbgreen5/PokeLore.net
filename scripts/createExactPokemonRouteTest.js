import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const pokemonDistDir = path.join(repoRoot, "dist", "pokemon");
const raichuDir = path.join(pokemonDistDir, "raichu");
const raichuIndexPath = path.join(raichuDir, "index.html");
const raichuExtensionlessPath = path.join(
  pokemonDistDir,
  "raichu"
);
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

assertRegularFile(
  raichuIndexPath,
  "Expected Raichu prerender output"
);

const raichuHtml = fs.readFileSync(raichuIndexPath, "utf8");

fs.rmSync(raichuDir, {
  force: true,
  recursive: true
});
fs.writeFileSync(raichuExtensionlessPath, raichuHtml);
fs.writeFileSync(numericRaichuPath, numericRedirectShell);

console.log(
  "Created extensionless Raichu route test files at dist/pokemon/26 and dist/pokemon/raichu."
);
