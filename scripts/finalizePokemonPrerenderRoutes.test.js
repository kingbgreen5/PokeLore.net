import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildNumericRedirectShell,
  finalizePokemonPrerenderRoutes,
  validateRoutesData
} from "./finalizePokemonPrerenderRoutes.js";

function makeTempDir() {
  return fs.mkdtempSync(
    path.join(os.tmpdir(), "pokelore-route-finalizer-")
  );
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), {
    recursive: true
  });
  fs.writeFileSync(
    filePath,
    `${JSON.stringify(value, null, 2)}\n`
  );
}

function writePrerender(pokemonDistDir, slug) {
  const routeDir = path.join(pokemonDistDir, slug);
  const displayName = slug
    .split("-")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  fs.mkdirSync(routeDir, {
    recursive: true
  });
  fs.writeFileSync(
    path.join(routeDir, "index.html"),
    [
      "<!doctype html>",
      "<html lang=\"en\">",
      "<head>",
      `<title>${displayName} - PokeLore</title>`,
      `<link rel="canonical" href="https://pokelore.net/pokemon/${slug}">`,
      "<link rel=\"stylesheet\" href=\"/assets/index.css\">",
      `<script type="module" src="/assets/${slug}.js"></script>`,
      "</head>",
      "<body>",
      `<h1>${displayName}</h1>`,
      "<h2>Base Stats</h2>",
      "<section class=\"prerender-analysis-card\">Rich content</section>",
      "</body>",
      "</html>"
    ].join("\n")
  );
}

{
  const root = makeTempDir();
  const pokemonDistDir = path.join(root, "dist", "pokemon");
  const routesPath = path.join(root, "pokemonRoutes.json");
  const routes = {
    byName: {
      bulbasaur: 1,
      raichu: 26
    },
    byId: {
      1: "bulbasaur",
      26: "raichu"
    }
  };

  writeJson(routesPath, routes);
  writePrerender(pokemonDistDir, "bulbasaur");
  writePrerender(pokemonDistDir, "raichu");

  const result = finalizePokemonPrerenderRoutes({
    pokemonDistDir,
    routesPath
  });

  assert.equal(result.canonicalCount, 2);
  assert.equal(result.numericCount, 2);
  assert.equal(
    fs.statSync(path.join(pokemonDistDir, "bulbasaur")).isFile(),
    true
  );
  assert.equal(
    fs.existsSync(path.join(pokemonDistDir, "bulbasaur", "index.html")),
    false
  );
  assert.match(
    fs.readFileSync(path.join(pokemonDistDir, "1"), "utf8"),
    /content="0; url=\/pokemon\/bulbasaur"/
  );

  fs.rmSync(root, {
    force: true,
    recursive: true
  });
}

{
  const shell = buildNumericRedirectShell("131", "lapras");

  assert.match(
    shell,
    /<link rel="canonical" href="https:\/\/pokelore\.net\/pokemon\/lapras">/
  );
  assert.match(
    shell,
    /<meta http-equiv="refresh" content="0; url=\/pokemon\/lapras">/
  );
  assert.match(shell, /<a href="\/pokemon\/lapras">Lapras<\/a>/);
  assert.doesNotMatch(shell, /noindex/i);
}

assert.throws(
  () =>
    validateRoutesData(
      {
        byName: {
          "../escape": 1
        },
        byId: {
          1: "../escape"
        }
      },
      path.join(makeTempDir(), "dist", "pokemon")
    ),
  /single safe path segment/
);

assert.throws(
  () =>
    validateRoutesData(
      {
        byName: {
          "1": 1
        },
        byId: {
          1: "1"
        }
      },
      path.join(makeTempDir(), "dist", "pokemon")
    ),
  /collides with canonical slug/
);

assert.throws(
  () =>
    validateRoutesData(
      {
        byName: {
          pikachu: 25
        },
        byId: {
          0: "pikachu"
        }
      },
      path.join(makeTempDir(), "dist", "pokemon")
    ),
  /not a positive integer/
);

console.log(
  "Pokemon prerender route finalizer tests passed."
);
