import {
  afterEach,
  describe,
  expect,
  it
} from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import {
  finalizeItemPrerenderRoutes
} from "./finalizeItemPrerenderRoutes.js";

let tempRoot = null;

function makeTempRoot() {
  tempRoot = fs.mkdtempSync(
    path.join(
      os.tmpdir(),
      "pokelore-item-finalizer-"
    )
  );
  return tempRoot;
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), {
    recursive: true
  });
  fs.writeFileSync(
    filePath,
    `${JSON.stringify(data, null, 2)}\n`
  );
}

function writeFallback(fallbackPath) {
  fs.mkdirSync(path.dirname(fallbackPath), {
    recursive: true
  });
  fs.writeFileSync(
    fallbackPath,
    [
      "<!doctype html>",
      "<html>",
      "<head>",
      "<title>Pokemon Item Guide | PokéLore</title>",
      '<meta name="description" content="Loading Pokemon item details, effects, locations, game descriptions, and related data on PokeLore.">',
      '<meta name="robots" content="max-image-preview:large">',
      '<script type="module" src="/assets/index.js"></script>',
      "</head>",
      "<body>",
      '<div id="root"><main><p>Loading item details...</p></main></div>',
      "</body>",
      "</html>"
    ].join("\n")
  );
}

afterEach(() => {
  if (tempRoot) {
    fs.rmSync(tempRoot, {
      recursive: true,
      force: true
    });
    tempRoot = null;
  }
});

describe("finalizeItemPrerenderRoutes", () => {
  it("converts canonical item index output to extensionless static files", () => {
    const root = makeTempRoot();
    const dataDir = path.join(root, "data");
    const itemDistDir = path.join(
      root,
      "dist",
      "item"
    );
    const fallbackPath = path.join(
      root,
      "dist",
      "item-fallback.html"
    );

    writeJson(
      path.join(dataDir, "items", "poke-ball.json"),
      {
        name: "poke-ball",
        displayName: "Poke Ball",
        category: {
          name: "standard-balls",
          pocket: "poke-balls"
        }
      }
    );

    fs.mkdirSync(
      path.join(itemDistDir, "poke-ball"),
      {
        recursive: true
      }
    );
    fs.writeFileSync(
      path.join(
        itemDistDir,
        "poke-ball",
        "index.html"
      ),
      '<!doctype html><title>Poke Ball Item Guide | PokéLore</title><meta name="description" content="View Poke Ball details."><link rel="canonical" href="https://pokelore.net/item/poke-ball"><h1>Poke Ball</h1>'
    );
    writeFallback(fallbackPath);

    const result = finalizeItemPrerenderRoutes({
      dataDir,
      itemDistDir,
      fallbackPath
    });

    expect(result.count).toBe(1);
    expect(result.fallbackPath).toBe(
      fallbackPath
    );
    expect(
      fs.existsSync(
        path.join(itemDistDir, "poke-ball")
      )
    ).toBe(true);
    expect(
      fs.statSync(
        path.join(itemDistDir, "poke-ball")
      ).isFile()
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(
          itemDistDir,
          "poke-ball",
          "index.html"
        )
      )
    ).toBe(false);
    expect(
      fs.readFileSync(
        path.join(itemDistDir, "poke-ball"),
        "utf8"
      )
    ).not.toContain("Loading item details...");
    expect(fs.existsSync(fallbackPath)).toBe(true);
  });
});
