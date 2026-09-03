import {
  describe,
  expect,
  it
} from "vitest";
import fs from "fs";
import path from "path";
import {
  getCanonicalItemEntries,
  loadItemPageData,
  renderItemFallback,
  renderItemPage
} from "./prerenderItemPages.js";
import { itemSeo } from "../src/seo/seoConfig.js";
import fireStone from "../public/data/items/fire-stone.json";
import machoBrace from "../public/data/items/macho-brace.json";
import prismScale from "../public/data/items/prism-scale.json";
import gooeyMulch from "../public/data/items/gooey-mulch.json";
import rareCandy from "../public/data/items/rare-candy.json";
import oranBerry from "../public/data/items/oran-berry.json";
import tm01 from "../public/data/items/tm01.json";
import snomThread from "../public/data/items/snom-thread.json";
import dynamaxCrystalAnd15 from "../public/data/items/dynamax-crystal-and15.json";

const dataDir = path.resolve("public", "data");
const pokemonIndex = JSON.parse(
  fs.readFileSync(
    path.join(dataDir, "pokemonIndex.json"),
    "utf8"
  )
);
const tmMaterialDetailsData = JSON.parse(
  fs.readFileSync(
    path.join(dataDir, "tmMaterialDetails.json"),
    "utf8"
  )
);
const template = `<!doctype html>
<html>
  <head>
    <title>PokéLore.net | Pokémon Pokédex, Tools & Game Guides</title>
    <meta name="description" content="PokéLore.net is a Pokémon Pokédex...">
    <link rel="canonical" href="https://pokelore.net/">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/index.js"></script>
  </body>
</html>`;
const homepagePrerenderedTemplate = `<!doctype html>
<html>
  <head>
    <title>PokéLore.net | Pokémon Pokédex, Tools & Game Guides</title>
    <meta name="description" content="PokéLore.net is a Pokémon Pokédex...">
    <link rel="canonical" href="https://pokelore.net/">
    <script id="seo-structured-data" type="application/ld+json">{"@type":"WebSite"}</script>
  </head>
  <body>
    <div id="root">
      <main>
        <h1>Pokémon Pokédex, Tools &amp; Game Guides</h1>
        <div>Homepage content</div>
      </main>
    </div>
  </body>
</html>`;

function dataFor(itemData) {
  return loadItemPageData(itemData, {
    dataDir,
    pokemonIndex,
    tmMaterialDetailsData
  });
}

function pageFor(itemData) {
  return renderItemPage(
    template,
    dataFor(itemData)
  );
}

function acquisitionHeadingLabels(html) {
  return [
    ...html.matchAll(
      /<section class="prerender-item-acquisition-group"[^>]*>\s*<h3>(.*?)<\/h3>/g
    )
  ].map(match => match[1]);
}

function getMetaDescriptionTags(html) {
  return (
    html.match(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/gi
    ) ?? []
  );
}

describe("prerenderItemPages", () => {
  it("enumerates canonical public item routes without hidden unused Dynamax data", () => {
    const slugs = getCanonicalItemEntries({
      dataDir
    }).map(entry => entry.item.name);

    expect(slugs).toContain("fire-stone");
    expect(slugs).toContain("prism-scale");
    expect(slugs).toContain("macho-brace");
    expect(slugs).toContain("dynamax-crystal-and15");
    expect(slugs).not.toContain(
      "dynamax-crystal-aql7235"
    );
    expect(slugs).not.toContain("tm-01");
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("renders item-specific SEO and content instead of homepage metadata", () => {
    const data = dataFor(fireStone);
    const html = renderItemPage(
      template,
      data
    );
    const seo = itemSeo(data.item);
    const descriptionTags =
      getMetaDescriptionTags(html);

    expect(html).toContain(
      "<title>Fire Stone Locations, Uses &amp; Details | PokéLore</title>"
    );
    expect(descriptionTags).toEqual([
      `<meta name="description" content="${seo.description}">`
    ]);
    expect(html).toContain(
      '<link rel="canonical" href="https://pokelore.net/item/fire-stone">'
    );
    expect(html).toContain("<h1>Fire Stone</h1>");
    expect(html).toContain("<h2>Effect</h2>");
    expect(html).toContain(
      "<h2>Where To Get Fire Stone</h2>"
    );
    expect(html).toContain(
      "<h3>Pokémon Ruby, Sapphire &amp; Emerald</h3>"
    );
    expect(html).toContain(
      "<h3>Pokémon FireRed &amp; LeafGreen</h3>"
    );
    expect(html).toContain(
      "<h3>Pokémon Diamond, Pearl &amp; Platinum</h3>"
    );
    expect(html).toContain(
      "<h3>Pokémon HeartGold &amp; SoulSilver</h3>"
    );
    expect(html).not.toContain(
      "<h3>Generation 4</h3>"
    );
    expect(html).toContain("Celadon Department Store");
    expect(html).not.toContain(
      "<h1>Pokémon Pokédex, Tools & Game Guides</h1>"
    );
    expect(html).not.toContain(
      '<link rel="canonical" href="https://pokelore.net/">'
    );
  });

  it("inserts item SEO descriptions when the Vite shell has no existing description", () => {
    const shellWithoutDescription =
      template.replace(
        /\s*<meta name="description"[^>]+>/,
        ""
      );
    const data = dataFor(machoBrace);
    const html = renderItemPage(
      shellWithoutDescription,
      data
    );

    expect(getMetaDescriptionTags(html)).toEqual([
      `<meta name="description" content="${
        itemSeo(data.item).description
      }">`
    ]);
  });

  it("replaces homepage prerender content when the template already contains it", () => {
    const html = renderItemPage(
      homepagePrerenderedTemplate,
      loadItemPageData(fireStone, {
        dataDir,
        pokemonIndex,
        tmMaterialDetailsData
      })
    );

    expect(html).toContain("<h1>Fire Stone</h1>");
    expect(html).toContain(
      "<h2>Where To Get Fire Stone</h2>"
    );
    expect(html).not.toContain("Homepage content");
    expect(html).not.toContain(
      "Pokémon Pokédex, Tools &amp; Game Guides"
    );
    expect(html).not.toContain(
      'href="https://pokelore.net/"'
    );
    expect(html).not.toContain(
      'id="seo-structured-data"'
    );
  });

  it("uses curated acquisition data before source item acquisition data", () => {
    const data = loadItemPageData(machoBrace, {
      dataDir,
      pokemonIndex,
      tmMaterialDetailsData
    });

    expect(data.usedCuratedAcquisition).toBe(true);
    expect(data.item.acquisition[0].location).toEqual({
      name: "hoenn-route-111",
      displayName: "Route 111"
    });

    const html = renderItemPage(template, data);

    expect(html).toContain(
      '<a href="/location/hoenn-route-111">Route 111</a>'
    );
    expect(html).toContain(
      "<h3>Pokémon Ruby, Sapphire &amp; Emerald</h3>"
    );
    expect(html).toContain(
      "Defeat all four members of the Winstrate family"
    );
    expect(html).toContain(
      "<strong>Area:</strong> Winstrate family house"
    );
    expect(html).toContain(
      "<strong>Repeatable:</strong> No <strong>Version Exclusive:</strong> No"
    );
    expect(html).toContain(
      '<a href="/pokemon/machop">Machop</a>'
    );
    expect(html).toContain(
      '<a href="/pokemon/drowzee">Drowzee</a>'
    );
  });

  it("renders acquisition headings by game family in raw prerender HTML", () => {
    const fireStoneHtml = pageFor(fireStone);
    const machoBraceHtml = pageFor(machoBrace);
    const prismScaleHtml = pageFor(prismScale);
    const gooeyMulchHtml = pageFor(gooeyMulch);

    expect(
      acquisitionHeadingLabels(fireStoneHtml)
    ).toEqual([
      "Pokémon Red, Blue &amp; Yellow",
      "Pokémon Gold, Silver &amp; Crystal",
      "Pokémon Ruby, Sapphire &amp; Emerald",
      "Pokémon FireRed &amp; LeafGreen",
      "Pokémon Diamond, Pearl &amp; Platinum",
      "Pokémon HeartGold &amp; SoulSilver",
      "Pokémon Black &amp; White",
      "Pokémon Black 2 &amp; White 2",
      "Pokémon X &amp; Y",
      "Pokémon Omega Ruby &amp; Alpha Sapphire",
      "Pokémon Sun &amp; Moon",
      "Pokémon Ultra Sun &amp; Ultra Moon",
      "Pokémon: Let&#39;s Go, Pikachu! &amp; Let&#39;s Go, Eevee!",
      "Pokémon Sword &amp; Shield",
      "Pokémon Brilliant Diamond &amp; Shining Pearl",
      "Pokémon Legends: Arceus",
      "Pokémon Scarlet &amp; Violet",
      "Pokémon Legends: Z-A"
    ]);

    expect(
      acquisitionHeadingLabels(machoBraceHtml)
    ).toContain(
      "Pokémon Black, White, Black 2 &amp; White 2"
    );
    expect(
      acquisitionHeadingLabels(prismScaleHtml)
    ).toContain(
      "Pokémon Sun, Moon, Ultra Sun &amp; Ultra Moon"
    );
    expect(
      acquisitionHeadingLabels(gooeyMulchHtml)
    ).toEqual([
      "Pokémon HeartGold &amp; SoulSilver"
    ]);

    expect(fireStoneHtml).not.toContain(
      "<h3>Generation 4</h3>"
    );
  });

  it("renders every acquisition record once in each prerendered item page", () => {
    const cases = [
      fireStone,
      machoBrace,
      prismScale,
      gooeyMulch,
      rareCandy
    ];

    for (const item of cases) {
      const data = dataFor(item);
      const html = renderItemPage(
        template,
        data
      );
      const entryCount = (
        html.match(
          /class="prerender-item-acquisition-entry"/g
        ) ?? []
      ).length;

      expect(entryCount).toBe(
        data.item.acquisition.length
      );
    }
  });

  it("renders representative specialized item content", () => {
    expect(pageFor(tm01)).toContain(
      "<h2>Machine Moves</h2>"
    );
    expect(pageFor(tm01)).toContain(
      '<a href="/move/mega-punch">Mega Punch</a>'
    );

    const berryHtml = pageFor(oranBerry);
    expect(berryHtml).toContain(
      "<h2>What This Berry Does</h2>"
    );
    expect(berryHtml).toContain(
      "<h2>Growth and Harvest</h2>"
    );
    expect(berryHtml).toContain(
      "<h2>Game Descriptions</h2>"
    );

    const materialHtml = pageFor(snomThread);
    expect(materialHtml).toContain(
      "<h2>Dropped By</h2>"
    );
    expect(materialHtml).toContain(
      '<a href="/pokemon/snom">Snom</a>'
    );

    const crystalHtml = pageFor(
      dynamaxCrystalAnd15
    );
    expect(crystalHtml).toContain(
      "<h2>About Dynamax Crystals</h2>"
    );
    expect(crystalHtml).toContain(
      "officially released"
    );
    expect(crystalHtml).toContain(
      '<a href="/pokemon/larvitar">Larvitar</a>'
    );
  });

  it("renders a neutral real fallback shell for invalid item URLs", () => {
    const html = renderItemFallback(template);

    expect(html).toContain(
      "<title>Pokemon Item Guide | PokéLore</title>"
    );
    expect(html).toContain(
      '<meta name="description" content="Loading Pokemon item details, effects, locations, game descriptions, and related data on PokeLore.">'
    );
    expect(getMetaDescriptionTags(html)).toHaveLength(
      1
    );
    expect(html).toContain(
      '<meta name="robots" content="max-image-preview:large">'
    );
    expect(html).toContain(
      '<script type="module" src="/assets/index.js"></script>'
    );
    expect(html).toContain(
      "Loading item details..."
    );
    expect(html).not.toContain(
      '<link rel="canonical" href="https://pokelore.net/">'
    );
    expect(html).not.toMatch(
      /<link\s+rel="canonical"/i
    );
    expect(html).not.toContain(
      "<h1>Pokémon Pokédex, Tools & Game Guides</h1>"
    );
    expect(html).not.toContain(
      'id="seo-structured-data"'
    );
  });
});
