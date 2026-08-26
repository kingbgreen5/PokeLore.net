import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const testFiles = [
  {
    source: path.join(
      repoRoot,
      "public",
      "render-route-test",
      "999999"
    ),
    destination: path.join(
      repoRoot,
      "dist",
      "pokemon",
      "999999"
    )
  }
];

testFiles.forEach(({ source, destination }) => {
  fs.mkdirSync(path.dirname(destination), {
    recursive: true
  });
  fs.copyFileSync(source, destination);
});

console.log(
  `Copied ${testFiles.length} Render route test file to dist.`
);
