import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { itemSeo } from "../src/seo/seoConfig.js";
import { compareVersionGroups } from "../src/constants/versionOrder.js";
import { normalizeDisplayText } from "../src/utils/normalizeText.js";
import { getPokemonUrl } from "../src/utils/pokemonUrls.js";
import { isItemHiddenFromUi } from "../src/utils/itemVisibility.js";
import {
  buildMachineItemDescription,
  capitalizeItemText,
  isMachineItem,
  mergeItemDetailData
} from "../src/utils/itemDetail.js";
import { isTmMaterialItem } from "../src/utils/tmMaterialDetails.js";
import {
  DYNAMAX_CRYSTAL_GUIDE_PATH,
  formatDynamaxPokemonList,
  getDynamaxCrystalData,
  getDynamaxCrystalDisplayName,
  isDynamaxCrystalItem,
  isReleasedDynamaxCrystal,
  isUsableFlavorText
} from "../src/utils/dynamaxCrystals.js";

const __filename = fileURLToPath(
  import.meta.url
);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDataDir = path.join(rootDir, "public", "data");
const distDir = path.join(rootDir, "dist");
const indexPath = path.join(distDir, "index.html");
const itemDistDir = path.join(distDir, "item");
const fallbackPath = path.join(distDir, "item-fallback");

function readJson(filePath) {
  return JSON.parse(
    fs.readFileSync(filePath, "utf8")
  );
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return readJson(filePath);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeJsonForScript(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function renderText(value) {
  return escapeHtml(
    normalizeDisplayText(value) ?? ""
  );
}

function hasValue(value) {
  return (
    value !== null &&
    value !== undefined &&
    value !== ""
  );
}

function itemPocketName(item) {
  return item?.category?.pocket ?? item?.pocket;
}

function isBerryItem(item) {
  return itemPocketName(item) === "berries";
}

function canonicalItemPath(slug) {
  return `/item/${slug}`;
}

function getCanonicalItemEntries({
  dataDir = publicDataDir
} = {}) {
  const itemsDir = path.join(dataDir, "items");

  return fs
    .readdirSync(itemsDir)
    .filter(fileName =>
      fileName.endsWith(".json")
    )
    .map(fileName => {
      const item = readJson(
        path.join(itemsDir, fileName)
      );
      return {
        fileName,
        item
      };
    })
    .filter(({ fileName, item }) => {
      const fileSlug = fileName.replace(
        /\.json$/,
        ""
      );

      return (
        item?.name === fileSlug &&
        !isItemHiddenFromUi(item)
      );
    })
    .sort((a, b) =>
      a.item.name.localeCompare(b.item.name)
    );
}

function getCompactPokemonIndexForItem(
  item,
  pokemonIndex
) {
  const wantedNames = new Set();
  const wantedIds = new Set();

  item?.heldByPokemon?.forEach(entry => {
    if (entry.pokemon) {
      wantedNames.add(entry.pokemon);
    }

    if (entry.pokemonId) {
      wantedIds.add(entry.pokemonId);
    }
  });

  item?.tmMaterialDetail?.relatedPokemon?.forEach(
    entry => {
      if (entry.name) {
        wantedNames.add(entry.name);
      }

      if (entry.id) {
        wantedIds.add(entry.id);
      }
    }
  );

  item?.acquisition?.forEach(method => {
    method.relatedPokemon?.forEach(entry => {
      if (typeof entry === "string") {
        wantedNames.add(entry);
      } else {
        if (entry.name) {
          wantedNames.add(entry.name);
        }

        if (entry.id) {
          wantedIds.add(entry.id);
        }
      }
    });
  });

  getDynamaxCrystalData(item)?.raidPokemon?.forEach(
    name => wantedNames.add(name)
  );

  return pokemonIndex.filter(
    pokemon =>
      wantedIds.has(pokemon.id) ||
      wantedNames.has(pokemon.name)
  );
}

function loadItemPageData(
  itemData,
  {
    dataDir = publicDataDir,
    pokemonIndex = readJson(
      path.join(dataDir, "pokemonIndex.json")
    ),
    tmMaterialDetailsData = null
  } = {}
) {
  const slug = itemData.name;
  const migratedLocationData = readJsonIfExists(
    path.join(
      dataDir,
      "itemLocationsCurated",
      `${slug}.json`
    )
  );
  const materialDetails =
    tmMaterialDetailsData ??
    (isTmMaterialItem(itemData)
      ? readJsonIfExists(
          path.join(dataDir, "tmMaterialDetails.json")
        )
      : null);
  const item = mergeItemDetailData({
    itemData,
    migratedLocationData,
    tmMaterialDetailsData: materialDetails
  });
  const berryData = isBerryItem(item)
    ? readJsonIfExists(
        path.join(
          dataDir,
          "berries",
          "generated",
          "details",
          `${slug}.json`
        )
      )
    : null;
  const oaksNotes = readJsonIfExists(
    path.join(
      dataDir,
      "oaksNotes",
      "items",
      `${slug}.json`
    )
  );
  const pokemonGoNotes = readJsonIfExists(
    path.join(
      dataDir,
      "pokemonGo",
      "items",
      `${slug}.json`
    )
  );
  const relatedLinks = readJsonIfExists(
    path.join(
      dataDir,
      "relatedLinks",
      "items",
      `${slug}.json`
    )
  );
  const compactPokemonIndex =
    getCompactPokemonIndexForItem(
      item,
      pokemonIndex
    );

  return {
    item,
    berryData,
    oaksNotes,
    pokemonGoNotes,
    relatedLinks,
    pokemonIndex: compactPokemonIndex,
    usedCuratedAcquisition:
      Array.isArray(
        migratedLocationData?.acquisition
      )
  };
}

function renderHead(template, seo) {
  const robots =
    seo.robots ?? "max-image-preview:large";
  let html = template
    .replace(
      /<title>[\s\S]*?<\/title>/i,
      `<title>${escapeHtml(seo.title)}</title>`
    )
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${escapeHtml(seo.description)}">`
    );

  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/gi,
    ""
  );
  html = html.replace(
    /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/gi,
    ""
  );
  html = html.replace(
    /<script\s+id="seo-structured-data"[\s\S]*?<\/script>/gi,
    ""
  );

  return html.replace(
    "</head>",
    `  <link rel="canonical" href="${escapeHtml(seo.canonical)}">\n  <meta name="robots" content="${escapeHtml(robots)}">\n</head>`
  );
}

function replaceRoot(template, appHtml, marker) {
  const rootHtml = `<div id="root" data-pokelore-react-prerender="${escapeHtml(marker)}">${appHtml}</div>\n`;

  if (
    /<div id="root"><\/div>/i.test(template)
  ) {
    return template.replace(
      /<div id="root"><\/div>/i,
      rootHtml.trimEnd()
    );
  }

  return template.replace(
    /<div id="root"[\s\S]*<\/div>\s*<\/body>/i,
    `${rootHtml}  </body>`
  );
}

function formatLocation(location) {
  if (!location) {
    return "";
  }

  if (typeof location === "string") {
    return renderText(location);
  }

  const label =
    location.displayName ?? location.name;

  if (
    location.name &&
    location.displayName
  ) {
    return `<a href="/location/${escapeHtml(location.name)}">${renderText(label)}</a>`;
  }

  return renderText(label);
}

function renderPokemonLink(pokemon) {
  if (!pokemon) {
    return "";
  }

  const name =
    typeof pokemon === "string"
      ? pokemon
      : pokemon.name;
  const displayName =
    typeof pokemon === "string"
      ? capitalizeItemText(pokemon)
      : pokemon.displayName ??
        capitalizeItemText(pokemon.name);
  const href =
    typeof pokemon === "object"
      ? getPokemonUrl(pokemon)
      : `/pokemon/${name}`;

  return href
    ? `<a href="${escapeHtml(href)}">${renderText(displayName)}</a>`
    : renderText(displayName);
}

function renderRelatedList(
  title,
  values,
  renderValue
) {
  if (!Array.isArray(values) || values.length === 0) {
    return "";
  }

  return `<div><strong>${escapeHtml(title)}</strong><ul>${values
    .map(
      value =>
        `<li>${renderValue(value)}</li>`
    )
    .join("")}</ul></div>`;
}

function formatCost(cost) {
  if (!cost) {
    return null;
  }

  if (typeof cost === "string") {
    return cost;
  }

  if (!hasValue(cost.amount)) {
    return null;
  }

  return `${Number(cost.amount).toLocaleString()} ${
    cost.currency ?? ""
  }`.trim();
}

function renderAcquisitionMethod(method, index) {
  const key = `${method.generation ?? "unknown"}-${index}`;

  return `<article class="prerender-item-acquisition-entry" data-key="${escapeHtml(key)}">
    <h3>Generation ${renderText(method.generation ?? "Unknown")}</h3>
    <p><strong>Games:</strong> ${renderText((method.games ?? []).join(", "))}</p>
    <p><strong>Location:</strong> ${formatLocation(method.location)}</p>
    <p><strong>Method:</strong> ${renderText(method.method ?? method.details)}</p>
    ${
      formatCost(method.cost)
        ? `<p><strong>Cost:</strong> ${renderText(formatCost(method.cost))}</p>`
        : ""
    }
    ${renderRelatedList(
      "Requirements",
      method.requirements,
      renderText
    )}
    ${renderRelatedList(
      "Related Items",
      method.relatedItems,
      item =>
        typeof item === "string"
          ? renderText(item)
          : `<a href="/item/${escapeHtml(item.name)}">${renderText(item.displayName ?? item.name)}</a>`
    )}
    ${renderRelatedList(
      "Related Pokemon",
      method.relatedPokemon,
      renderPokemonLink
    )}
    ${renderRelatedList(
      "Related Abilities",
      method.relatedAbilities,
      ability =>
        typeof ability === "string"
          ? renderText(ability)
          : `<a href="/ability/${escapeHtml(ability.name)}">${renderText(ability.displayName ?? ability.name)}</a>`
    )}
    ${renderRelatedList(
      "Related Moves",
      method.relatedMoves,
      move =>
        typeof move === "string"
          ? renderText(move)
          : `<a href="/move/${escapeHtml(move.name)}">${renderText(move.displayName ?? move.name)}</a>`
    )}
    ${renderRelatedList(
      "Related Locations",
      method.relatedLocations,
      formatLocation
    )}
    <p><strong>Repeatable:</strong> ${method.repeatable ? "Yes" : "No"} <strong>Version Exclusive:</strong> ${method.versionExclusive ? "Yes" : "No"}</p>
  </article>`;
}

function renderAcquisition(item) {
  const acquisition = Array.isArray(item.acquisition)
    ? item.acquisition
    : [];

  if (acquisition.length === 0) {
    return "";
  }

  return `<section class="prerender-item-section prerender-item-acquisition">
    <h2>Where To Get ${renderText(item.displayName)}</h2>
    ${acquisition.map(renderAcquisitionMethod).join("")}
  </section>`;
}

function generationForVersionGroup(versionGroup) {
  if (
    ["red-blue", "yellow"].includes(versionGroup)
  ) {
    return "Generation I";
  }

  if (
    ["gold-silver", "crystal"].includes(versionGroup)
  ) {
    return "Generation II";
  }

  if (
    [
      "ruby-sapphire",
      "emerald",
      "firered-leafgreen",
      "colosseum",
      "xd"
    ].includes(versionGroup)
  ) {
    return "Generation III";
  }

  if (
    [
      "diamond-pearl",
      "platinum",
      "heartgold-soulsilver"
    ].includes(versionGroup)
  ) {
    return "Generation IV";
  }

  if (
    ["black-white", "black-2-white-2"].includes(
      versionGroup
    )
  ) {
    return "Generation V";
  }

  if (
    [
      "x-y",
      "omega-ruby-alpha-sapphire"
    ].includes(versionGroup)
  ) {
    return "Generation VI";
  }

  if (
    [
      "sun-moon",
      "ultra-sun-ultra-moon",
      "lets-go-pikachu-lets-go-eevee"
    ].includes(versionGroup)
  ) {
    return "Generation VII";
  }

  if (
    [
      "sword-shield",
      "the-isle-of-armor",
      "the-crown-tundra",
      "brilliant-diamond-shining-pearl",
      "brilliant-diamond-and-shining-pearl",
      "legends-arceus"
    ].includes(versionGroup)
  ) {
    return "Generation VIII";
  }

  if (
    [
      "scarlet-violet",
      "the-teal-mask",
      "the-indigo-disk"
    ].includes(versionGroup)
  ) {
    return "Generation IX";
  }

  return "Other Games";
}

function renderMachineDetails(item) {
  const rows = (item.machines ?? [])
    .filter(
      machine =>
        machine.move?.name ||
        machine.versionGroup
    )
    .map(machine => ({
      generation: generationForVersionGroup(
        machine.versionGroup
      ),
      move: machine.move?.name,
      versionGroup: machine.versionGroup
    }))
    .filter(row => row.move)
    .sort((a, b) =>
      compareVersionGroups(
        a.versionGroup,
        b.versionGroup
      )
    );

  if (rows.length === 0) {
    return "";
  }

  return `<section class="prerender-item-section">
    <h2>Machine Moves</h2>
    <ul class="prerender-item-list">${rows
      .map(
        row =>
          `<li>${renderText(row.generation)} - ${renderText(capitalizeItemText(row.versionGroup))}: <a href="/move/${escapeHtml(row.move)}">${renderText(capitalizeItemText(row.move))}</a></li>`
      )
      .join("")}</ul>
  </section>`;
}

function renderBerryDetails(item, berryData) {
  if (!isBerryItem(item)) {
    return "";
  }

  const mechanics = berryData?.mechanics;
  const sections = [];

  if (item.effect || item.shortEffect) {
    sections.push(`<section class="prerender-item-section">
      <h2>What This Berry Does</h2>
      <p>${renderText(item.effect ?? item.shortEffect)}</p>
    </section>`);
  }

  if (
    mechanics &&
    (hasValue(mechanics.growthTime) ||
      hasValue(mechanics.maxHarvest) ||
      hasValue(mechanics.soilDryness))
  ) {
    sections.push(`<section class="prerender-item-section">
      <h2>Growth and Harvest</h2>
      <dl class="prerender-item-grid">
        ${renderDetail("Time per growth stage", `${mechanics.growthTime} hours`)}
        ${renderDetail("Approximate full growth cycle", `${mechanics.growthTime * 4} hours`)}
        ${renderDetail("Maximum harvest", mechanics.maxHarvest)}
        ${renderDetail("Soil moisture loss", `${mechanics.soilDryness}% per hour`)}
      </dl>
    </section>`);
  }

  if (mechanics?.flavorPotencies) {
    sections.push(`<section class="prerender-item-section">
      <h2>Contest, Cooking, and Crafting</h2>
      <p>Flavor values affect Berry-processing systems such as Pokeblocks and Poffins when those systems are present.</p>
      <dl class="prerender-item-grid">
        ${renderDetail("Flavor Profile", mechanics.dominantFlavors?.map(capitalizeItemText).join(" / "))}
        ${renderDetail("Smoothness", mechanics.smoothness)}
        ${Object.entries(mechanics.flavorPotencies)
          .map(([flavor, potency]) =>
            renderDetail(capitalizeItemText(flavor), potency)
          )
          .join("")}
      </dl>
    </section>`);
  }

  if (
    mechanics &&
    (hasValue(mechanics.firmness) ||
      hasValue(mechanics.size))
  ) {
    sections.push(`<section class="prerender-item-section">
      <h2>Physical Properties</h2>
      <dl class="prerender-item-grid">
        ${renderDetail("Firmness", capitalizeItemText(mechanics.firmness))}
        ${renderDetail("Size", hasValue(mechanics.size) ? `${mechanics.size} mm` : null)}
      </dl>
    </section>`);
  }

  return sections.join("");
}

function renderDynamaxCrystalDetails(item) {
  if (!isDynamaxCrystalItem(item)) {
    return "";
  }

  const crystalData = getDynamaxCrystalData(item);
  const crystalName =
    getDynamaxCrystalDisplayName(item) ||
    item.displayName;
  const isReleased =
    isReleasedDynamaxCrystal(item);

  return `<section class="prerender-item-section">
    <h2>About Dynamax Crystals</h2>
    <p>Dynamax Crystals are special event items introduced in Pokemon Sword and Shield. They were designed to activate a specific Max Raid Battle at Watchtower Lair in the Watchtower Ruins area of the Wild Area.</p>
    <p><a href="${escapeHtml(DYNAMAX_CRYSTAL_GUIDE_PATH)}">View the Dynamax Crystals guide</a>.</p>
  </section>
  <section class="prerender-item-section">
    <h2>About ${renderText(crystalName)}</h2>
    ${
      isReleased && crystalData
        ? `<p>${renderText(crystalName)} is an officially released Dynamax Crystal associated with ${crystalData.raidPokemon.map(renderPokemonLink).join(", ")}. When used at Watchtower Lair, it activates a ${renderText(crystalData.raidType)} Max Raid Battle featuring ${renderText(formatDynamaxPokemonList(crystalData.raidPokemon))}.</p>
          ${crystalData.versionNotes ? `<p>${renderText(crystalData.versionNotes)}</p>` : ""}
          <p><strong>Original acquisition:</strong> ${renderText(crystalData.acquisitionSummary)}</p>
          <p><strong>Current availability:</strong> ${renderText(crystalData.currentAvailability)}</p>`
        : `<p>${renderText(crystalName)} is one of the unused Dynamax Crystal variants present in Pokemon Sword and Shield's game data. It was never officially distributed.</p>`
    }
  </section>`;
}

function renderDetail(label, value) {
  if (!hasValue(value)) {
    return "";
  }

  return `<div><dt>${escapeHtml(label)}</dt><dd>${renderText(value)}</dd></div>`;
}

function renderOverview(item) {
  if (isBerryItem(item)) {
    return "";
  }

  const html = [
    renderDetail(
      "Cost",
      isDynamaxCrystalItem(item)
        ? null
        : item.cost
    ),
    renderDetail(
      "Pocket",
      item.category?.pocket
        ? capitalizeItemText(item.category.pocket)
        : null
    ),
    renderDetail(
      "Category",
      item.category?.displayName
    ),
    renderDetail("Fling Power", item.fling?.power)
  ].join("");

  if (!html) {
    return "";
  }

  return `<section class="prerender-item-section">
    <h2>Overview</h2>
    <dl class="prerender-item-grid">${html}</dl>
  </section>`;
}

function renderAttributes(item) {
  if (
    isBerryItem(item) ||
    !Array.isArray(item.attributes) ||
    item.attributes.length === 0
  ) {
    return "";
  }

  return `<section class="prerender-item-section">
    <h2>Attributes</h2>
    <ul class="prerender-item-pill-list">${item.attributes
      .map(
        attribute =>
          `<li>${renderText(capitalizeItemText(attribute))}</li>`
      )
      .join("")}</ul>
  </section>`;
}

function getUsableFlavorTextEntries(item) {
  return (
    item.flavorTextEntries?.filter(entry =>
      isUsableFlavorText(entry.text)
    ) ?? []
  );
}

function renderFlavorText(item) {
  const entries = getUsableFlavorTextEntries(item);

  if (entries.length === 0) {
    return "";
  }

  return `<section class="prerender-item-section">
    <h2>${isBerryItem(item) ? "Game Descriptions" : "Flavor Text"}</h2>
    ${entries
      .map(
        entry =>
          `<article class="prerender-item-flavor"><p>${renderText(entry.text)}</p><small>${renderText((entry.versionGroups ?? []).map(capitalizeItemText).join(" / "))}</small></article>`
      )
      .join("")}
  </section>`;
}

function renderPokemonRelationships(
  item,
  pokemonIndex
) {
  const byId = new Map(
    pokemonIndex.map(pokemon => [
      pokemon.id,
      pokemon
    ])
  );
  const byName = new Map(
    pokemonIndex.map(pokemon => [
      pokemon.name,
      pokemon
    ])
  );
  const wildPokemon =
    item.heldByPokemon
      ?.map(
        held =>
          byId.get(held.pokemonId) ??
          byName.get(held.pokemon)
      )
      .filter(Boolean) ?? [];
  const tmMaterialPokemon =
    item.tmMaterialDetail?.relatedPokemon
      ?.map(
        pokemon =>
          byId.get(pokemon.id) ??
          byName.get(pokemon.name) ??
          pokemon
      )
      .filter(Boolean) ?? [];
  const sections = [];

  if (tmMaterialPokemon.length > 0) {
    sections.push(`<section class="prerender-item-section">
      <h2>Dropped By</h2>
      <p>This TM Material is associated with the matching Pokemon evolutionary line in Pokemon Scarlet and Violet.</p>
      <ul class="prerender-item-list">${tmMaterialPokemon
        .map(
          pokemon =>
            `<li>${renderPokemonLink(pokemon)}</li>`
        )
        .join("")}</ul>
    </section>`);
  }

  if (wildPokemon.length > 0) {
    sections.push(`<section class="prerender-item-section">
      <h2>Found On</h2>
      <ul class="prerender-item-list">${wildPokemon
        .map(
          pokemon =>
            `<li>${renderPokemonLink(pokemon)}</li>`
        )
        .join("")}</ul>
    </section>`);
  }

  return sections.join("");
}

function renderRelatedLinks(data) {
  const links = Array.isArray(data?.links)
    ? data.links
    : [];

  if (links.length === 0) {
    return "";
  }

  return `<section class="prerender-item-section">
    <h2>${renderText(data.title ?? "Related Guides")}</h2>
    <ul class="prerender-item-list">${links
      .map(
        link =>
          `<li><a href="${escapeHtml(link.to)}">${renderText(link.label)}</a>${link.description ? ` - ${renderText(link.description)}` : ""}</li>`
      )
      .join("")}</ul>
  </section>`;
}

function renderNoteSection(
  note,
  defaultTitle
) {
  if (!note) {
    return "";
  }

  const title = note.title ?? defaultTitle;
  const body = Array.isArray(note.body)
    ? note.body
    : [];
  const sections = Array.isArray(note.sections)
    ? note.sections
    : [];

  if (body.length === 0 && sections.length === 0) {
    return "";
  }

  return `<section class="prerender-item-section">
    <h2>${renderText(title)}</h2>
    ${body
      .map(paragraph =>
        `<p>${renderText(typeof paragraph === "string" ? paragraph : paragraph.text)}</p>`
      )
      .join("")}
    ${sections
      .map(
        section =>
          `<section><h3>${renderText(section.heading)}</h3>${(section.body ?? [])
            .map(paragraph =>
              `<p>${renderText(typeof paragraph === "string" ? paragraph : paragraph.text)}</p>`
            )
            .join("")}</section>`
      )
      .join("")}
  </section>`;
}

function renderEffectSections(item) {
  const machineDescription =
    isMachineItem(item)
      ? buildMachineItemDescription(item)
      : null;
  const isBerry = isBerryItem(item);
  const effectText =
    machineDescription ?? item.effect;
  const showShortEffect =
    item.shortEffect &&
    !machineDescription &&
    !isBerry &&
    item.shortEffect !== item.effect;
  const sections = [];

  if (effectText && !isBerry) {
    sections.push(`<section class="prerender-item-section">
      <h2>Effect</h2>
      <p>${renderText(effectText)}</p>
    </section>`);
  }

  if (showShortEffect) {
    sections.push(`<section class="prerender-item-section">
      <h2>Short Effect</h2>
      <p>${renderText(item.shortEffect)}</p>
    </section>`);
  }

  return sections.join("");
}

function renderItemMain({
  item,
  berryData,
  oaksNotes,
  pokemonGoNotes,
  relatedLinks,
  pokemonIndex
}) {
  const itemName = item.displayName;

  return `<style data-pokelore-item-prerender>
    .prerender-item-shell { box-sizing: border-box; color: #f5f7fb; margin: 0 auto; max-width: 900px; padding: 2rem; }
    .prerender-item-hero { align-items: center; display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; margin-bottom: 2rem; text-align: center; }
    .prerender-item-hero img { height: 72px; image-rendering: pixelated; width: 72px; }
    .prerender-item-hero h1 { margin: 0; }
    .prerender-item-section { border: 1px solid #666; border-radius: 12px; margin-bottom: 2rem; padding: 1rem; text-align: left; }
    .prerender-item-section h2 { margin-top: 0; }
    .prerender-item-acquisition-entry, .prerender-item-flavor { border-bottom: 1px solid #444; margin-bottom: 1rem; padding-bottom: 1rem; }
    .prerender-item-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); margin: 0; }
    .prerender-item-grid dt { font-weight: 700; }
    .prerender-item-grid dd { margin: .35rem 0 0; }
    .prerender-item-list, .prerender-item-pill-list { margin: .5rem 0 0; padding-left: 1.25rem; }
    .prerender-item-pill-list { display: flex; flex-wrap: wrap; gap: .5rem; list-style: none; padding-left: 0; }
    .prerender-item-pill-list li { border: 1px solid #888; border-radius: 999px; padding: .35rem .75rem; }
    .prerender-item-shell a { color: #7dd3fc; }
  </style>
  <main class="prerender-item-shell">
    <header class="prerender-item-hero">
      ${
        item.sprite
          ? `<img src="${escapeHtml(item.sprite)}" alt="${renderText(itemName)} item sprite" width="72" height="72" loading="eager" decoding="async">`
          : ""
      }
      <h1>${renderText(itemName)}</h1>
    </header>
    ${renderEffectSections(item)}
    ${renderDynamaxCrystalDetails(item)}
    ${renderMachineDetails(item)}
    ${renderAcquisition(item)}
    ${renderBerryDetails(item, berryData)}
    ${renderPokemonRelationships(item, pokemonIndex)}
    ${renderRelatedLinks(relatedLinks)}
    ${!isBerryItem(item) ? renderNoteSection(oaksNotes, "Oak's Notes") : ""}
    ${renderNoteSection(pokemonGoNotes, "Pokémon Go")}
    ${renderFlavorText(item)}
    ${renderOverview(item)}
    ${renderAttributes(item)}
  </main>`;
}

function renderItemPage(template, data) {
  const seo = itemSeo(data.item);
  const payload = {
    item: data.item,
    berryData: data.berryData,
    oaksNotes: data.oaksNotes,
    pokemonGoNotes: data.pokemonGoNotes,
    relatedLinks: data.relatedLinks,
    pokemonIndex: data.pokemonIndex
  };
  const appHtml = `${renderItemMain(data)}
  <script id="pokelore-prerender-item-data" type="application/json">${escapeJsonForScript(payload)}</script>`;

  return replaceRoot(
    renderHead(template, seo),
    appHtml,
    "item-detail"
  );
}

function renderItemFallback(template) {
  let html = template
    .replace(
      /<title>[\s\S]*?<\/title>/i,
      "<title>Pokemon Item Lookup | PokéLore</title>"
    )
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      '<meta name="description" content="Look up Pokemon item details, effects, locations, game descriptions, and related data on PokeLore.">'
    );

  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/gi,
    ""
  );
  html = html.replace(
    /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/gi,
    ""
  );
  html = html.replace(
    /<script\s+id="seo-structured-data"[\s\S]*?<\/script>/gi,
    ""
  );
  html = html.replace(
    "</head>",
    '  <meta name="robots" content="noindex, follow">\n</head>'
  );

  return replaceRoot(
    html,
    '<main class="prerender-item-shell"><h1>Pokemon Item Lookup</h1></main>',
    "item-fallback"
  );
}

function writeItemPages({
  dataDir = publicDataDir,
  outputDir = itemDistDir,
  templatePath = indexPath
} = {}) {
  if (!fs.existsSync(templatePath)) {
    throw new Error(
      "dist/index.html not found. Run this after vite build."
    );
  }

  const template = fs.readFileSync(
    templatePath,
    "utf8"
  );
  const entries = getCanonicalItemEntries({
    dataDir
  });
  const pokemonIndex = readJson(
    path.join(dataDir, "pokemonIndex.json")
  );
  const tmMaterialDetailsData = readJsonIfExists(
    path.join(dataDir, "tmMaterialDetails.json")
  );
  let curatedAcquisitionCount = 0;

  fs.rmSync(outputDir, {
    recursive: true,
    force: true
  });
  fs.mkdirSync(outputDir, {
    recursive: true
  });

  for (const { item: itemData } of entries) {
    const data = loadItemPageData(itemData, {
      dataDir,
      pokemonIndex,
      tmMaterialDetailsData
    });
    const routeDir = path.join(
      outputDir,
      data.item.name
    );

    if (data.usedCuratedAcquisition) {
      curatedAcquisitionCount += 1;
    }

    fs.mkdirSync(routeDir, {
      recursive: true
    });
    fs.writeFileSync(
      path.join(routeDir, "index.html"),
      renderItemPage(template, data)
    );
  }

  fs.writeFileSync(
    fallbackPath,
    renderItemFallback(template)
  );

  return {
    count: entries.length,
    curatedAcquisitionCount,
    outputDir,
    fallbackPath
  };
}

if (process.argv[1] === __filename) {
  try {
    const result = writeItemPages();
    console.log(
      `Prerendered ${result.count} item pages at ${result.outputDir}.`
    );
    console.log(
      `Used curated acquisition data for ${result.curatedAcquisitionCount} item pages.`
    );
    console.log(
      `Wrote neutral item fallback at ${result.fallbackPath}.`
    );
  } catch (error) {
    console.error(
      "Failed to prerender item pages:",
      error
    );
    process.exitCode = 1;
  }
}

export {
  canonicalItemPath,
  getCanonicalItemEntries,
  getUsableFlavorTextEntries,
  loadItemPageData,
  renderAcquisition,
  renderItemFallback,
  renderItemMain,
  renderItemPage,
  writeItemPages
};
