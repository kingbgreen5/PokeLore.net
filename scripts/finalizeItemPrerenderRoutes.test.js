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
      '<!doctype html><title>Poke Ball Item Guide | PokéLore</title><link rel="canonical" href="https://pokelore.net/item/poke-ball"><h1>Poke Ball</h1>'
    );

    const result = finalizeItemPrerenderRoutes({
      dataDir,
      itemDistDir
    });

    expect(result.count).toBe(1);
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
  });
});
