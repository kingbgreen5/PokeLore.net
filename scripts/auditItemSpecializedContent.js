// Non-production audit. Reads project data; writes only notes/item-content-audit/.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isItemHiddenFromUi } from "../src/utils/itemVisibility.js";
import { mergeItemDetailData } from "../src/utils/itemDetail.js";
import { fossilItems, standardFossilItems } from "../src/data/fossilItems.js";
import { itemSeo } from "../src/seo/seoConfig.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = path.join(root, "public/data");
const output = path.join(root, "notes/item-content-audit");
const read = relative => {
  const file = path.join(data, relative);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
};
const files = relative => fs.readdirSync(path.join(data, relative)).filter(f => f.endsWith(".json")).sort();
const has = value => value !== null && value !== undefined && value !== "" &&
  (Array.isArray(value) ? value.length > 0 : typeof value === "object" ? Object.keys(value).length > 0 : true);
const tally = values => values.reduce((result, key) => {
  result[key ?? "(missing)"] = (result[key ?? "(missing)"] ?? 0) + 1;
  return result;
}, {});
const materials = read("tmMaterialDetails.json");
const pokemonIndex = read("pokemonIndex.json");
const overrides = read("evolutionMethodOverrides.json");
const evolutionRows = [];
function walk(node, parent, chain) {
  if (parent) evolutionRows.push({ chain, from: parent.pokemon.name, to: node.pokemon.name, ...Object.fromEntries(Object.entries(node).filter(([key]) => !["pokemon", "varieties", "evolvesTo"].includes(key))), varieties: node.varieties?.map(v => v.name) });
  for (const child of node.evolvesTo ?? []) walk(child, node, chain);
}
for (const file of files("evolutionChains")) walk(read(`evolutionChains/${file}`).root, null, file);
const machineProblems = [];
const raw = files("items").map(file => ({ file, item: read(`items/${file}`) }));
const canonical = raw.filter(({ file, item }) => file === `${item.name}.json` && !isItemHiddenFromUi(item));
const records = canonical.map(({ item: source }) => {
  const curated = read(`itemLocationsCurated/${source.name}.json`);
  const item = mergeItemDetailData({ itemData: source, migratedLocationData: curated, tmMaterialDetailsData: materials });
  const berry = read(`berries/generated/details/${item.name}.json`);
  const notes = read(`oaksNotes/items/${item.name}.json`);
  const go = read(`pokemonGo/items/${item.name}.json`);
  const links = read(`relatedLinks/items/${item.name}.json`);
  const acq = item.acquisition ?? [];
  const machines = item.machines ?? [];
  const validMachines = machines.filter(m => m.versionGroup && m.move?.name && fs.existsSync(path.join(data, "moves", `${m.move.name}.json`)));
  const groups = {};
  for (const m of machines) {
    (groups[m.versionGroup] ??= new Set()).add(m.move?.name);
    if (!validMachines.includes(m)) machineProblems.push({ item: item.name, machine: m });
  }
  const conflicts = Object.entries(groups).filter(([, moves]) => moves.size > 1).map(([group, moves]) => ({ group, moves: [...moves] }));
  const directEvolution = evolutionRows.filter(row => row.item === item.name || row.heldItem === item.name);
  const additionalEvolution = Object.entries(overrides).flatMap(([to, override]) => (override.additionalMethods ?? []).filter(m => m.type === "item" && m.slug === item.name).map(method => ({ to, ...method })));
  const linkedEvolution = Object.entries(overrides).filter(([, override]) => (override.primaryMethod?.segments ?? []).some(s => s.type === "item" && s.slug === item.name)).map(([to]) => to);
  const fields = {
    effect: has(item.effect), shortEffect: has(item.shortEffect), rawAcquisition: has(source.acquisition), acquisition: has(acq), flavorText: has(item.flavorTextEntries),
    cost: has(item.cost), positiveCost: item.cost > 0, pocket: has(item.category?.pocket), category: has(item.category?.name), attributes: has(item.attributes), flingPower: has(item.fling?.power), flingEffect: has(item.fling?.effect), heldByPokemon: has(item.heldByPokemon),
    relatedPokemon: acq.some(a => has(a.relatedPokemon)) || has(item.tmMaterialDetail?.relatedPokemon), machines: has(machines), validMachineMapping: validMachines.length > 0, completeMachineRows: machines.length > 0 && machines.length === validMachines.length && conflicts.length === 0,
    tmMaterialData: has(item.tmMaterialDetail), tmRecipes: has(item.tmMaterialDetail?.usedFor), berryFile: has(berry), berryMechanics: has(berry?.mechanics),
    evolutionBase: has(directEvolution), evolutionAdditional: has(additionalEvolution), evolutionLinkedProse: has(linkedEvolution),
    gameIndices: has(item.gameIndices), flavorVersionGroups: item.flavorTextEntries?.some(e => has(e.versionGroups)) ?? false,
    oaksNotes: has(notes), goNotes: has(go), relatedLinks: has(links?.links), curatedAcquisition: has(curated?.acquisition),
    locationLinks: acq.some(a => a.location?.name && a.location?.displayName), repeatability: acq.some(a => typeof a.repeatable === "boolean"), requirements: acq.some(a => has(a.requirements)),
    versionRestrictions: acq.some(a => a.versionExclusive === true), acquisitionGames: acq.some(a => has(a.games)), acquisitionNotes: acq.some(a => has(a.notes)), acquisitionCost: acq.some(a => has(a.cost)), acquisitionArea: acq.some(a => has(a.area))
  };
  const heldRows = (item.heldByPokemon ?? []).flatMap(p => (p.versionDetails ?? []).map(v => ({ pokemon: p.pokemon, pokemonId: p.pokemonId, ...v })));
  const invalidHeldRows = heldRows.filter(h => !pokemonIndex.some(p => p.id === h.pokemonId || p.name === h.pokemon) || !h.version || !Number.isFinite(h.rarity) || h.rarity < 0 || h.rarity > 100);
  return { name: item.name, displayName: item.displayName, category: item.category?.name, pocket: item.category?.pocket, attributes: item.attributes, fields, sourceKeys: Object.keys(source), acquisitionCount: acq.length, acquisition: acq, machines, conflicts, heldRows, invalidHeldRows, berryMechanics: berry?.mechanics, directEvolution, additionalEvolution, linkedEvolution, effect: item.effect, shortEffect: item.shortEffect };
});
const groupRules = {
  "Evolution category plus structured/linked evolution references": r => r.category === "evolution" || r.directEvolution.length || r.additionalEvolution.length || r.linkedEvolution.length,
  TMs: r => /^tm\d+$/.test(r.name), HMs: r => /^hm\d+$/.test(r.name), TRs: r => /^tr\d+$/.test(r.name),
  Berries: r => r.pocket === "berries", "EV training": r => r.category === "effort-training",
  "Held battle core (explicit category union)": r => ["held-items", "choice", "bad-held-items", "species-specific", "type-enhancement"].includes(r.category),
  "Poke Balls": r => r.pocket === "pokeballs", Fossils: r => fossilItems.some(f => f.slug === r.name),
  "Mega Stones": r => r.category === "mega-stones", Plates: r => r.category === "plates", Memories: r => r.category === "memories",
  "Drives (slug suffix)": r => /-drive$/.test(r.name), "Gems (jewels category)": r => r.category === "jewels",
  "Incenses (slug suffix)": r => /-incense$/.test(r.name), "Exp. Candy (slug prefix)": r => /^exp-candy-/.test(r.name),
  "Rotom appliances (explicit audit list)": r => ["rotom-catalog", "cardboard-box", "lawnmower", "microwave", "electric-fan", "washing-machine", "refrigerator"].includes(r.name),
  "Wild held-item sources": r => r.fields.heldByPokemon
};
const semanticGroups = Object.entries(groupRules).map(([group, predicate]) => {
  const members = records.filter(predicate);
  return { group, count: members.length, members: members.map(r => r.name), examples: members.slice(0, 4).map(r => r.displayName), coverage: Object.fromEntries(Object.keys(records[0].fields).map(key => [key, members.filter(r => r.fields[key]).length])) };
});
const categories = [...new Set(records.map(r => r.category))].sort().map(category => {
  const members = records.filter(r => r.category === category);
  return { category, totalRecords: raw.filter(r => r.item.category?.name === category).length, visible: members.length, examples: members.slice(0, 4).map(r => r.displayName), coverage: Object.fromEntries(Object.keys(members[0].fields).map(key => [key, members.filter(r => r.fields[key]).length])) };
});
const index = read("itemsIndex.json");
const visibleIndex = index.filter(i => !isItemHiddenFromUi(i));
const sitemap = fs.readFileSync(path.join(root, "public/sitemap.xml"), "utf8");
const sitemapItems = [...sitemap.matchAll(/<loc>[^<]*\/item\/([^<]+)<\/loc>/g)].map(m => m[1]);
const counts = { totalRecords: raw.length, indexRecords: index.length, hidden: raw.filter(r => isItemHiddenFromUi(r.item)).length, noncanonical: raw.filter(r => r.file !== `${r.item.name}.json`).length, visibleCanonical: records.length, indexableByProjectSeo: canonical.filter(({ item }) => !/noindex/i.test(itemSeo(item).robots ?? "")).length, visibleIndex: visibleIndex.length, sitemapItems: sitemapItems.length };
// Fossil lists contain evolved relatives; verify a unique base within each classic family.
const classicFossilRoots = standardFossilItems.map(f => {
  const slugs = f.restoredPokemon.map(p => p.slug);
  const roots = slugs.filter(s => !evolutionRows.some(e => e.to === s && slugs.includes(e.from)));
  return { item: f.slug, roots, allPokemonResolve: slugs.every(s => pokemonIndex.some(p => p.name === s)), evolutionEdges: evolutionRows.filter(e => slugs.includes(e.from) && slugs.includes(e.to)).map(e => ({ from: e.from, to: e.to, minLevel: e.minLevel, timeOfDay: e.timeOfDay })) };
});
const diagnostics = {
  classicFossilRoots,
  machineRows: records.flatMap(r => r.machines).length,
  machineVersionCounts: tally(records.flatMap(r => r.machines.map(m => m.versionGroup))),
  heldRows: records.flatMap(r => r.heldRows).length,
  heldRowsUnresolvedOrInvalid: records.flatMap(r => r.invalidHeldRows).length,
  heldItemsWithoutInvalidRows: records.filter(r => r.heldRows.length && !r.invalidHeldRows.length).length,
  berryMechanicCoverage: tally(records.flatMap(r => Object.entries(r.berryMechanics ?? {}).filter(([, value]) => has(value)).map(([key]) => key))),
  berryMissingMechanics: records.filter(r => r.pocket === "berries" && !r.fields.berryMechanics).map(r => r.name),
  evolutionCategoryUnmapped: records.filter(r => r.category === "evolution" && !r.directEvolution.length && !r.additionalEvolution.length && !r.linkedEvolution.length).map(r => r.name),
  evolutionReferencedItems: records.filter(r => r.directEvolution.length || r.additionalEvolution.length || r.linkedEvolution.length).length,
  linkedLocationRows: records.flatMap(r => r.acquisition).filter(a => a.location?.name && a.location?.displayName).length,
  brokenLocationRows: records.flatMap(r => r.acquisition).filter(a => a.location?.name && a.location?.displayName && !fs.existsSync(path.join(data, "locations", `${a.location.name}.json`))).length
};
const result = {
  scope: "Audit only; field presence is not factual verification or completeness across games.", counts,
  discrepancies: { visibleNotInIndex: records.filter(r => !visibleIndex.some(i => i.name === r.name)).map(r => r.name), indexWithoutVisibleFile: visibleIndex.filter(i => !records.some(r => r.name === i.name)).map(i => i.name), visibleNotInSitemap: records.filter(r => !sitemapItems.includes(r.name)).map(r => r.name), sitemapWithoutVisibleFile: sitemapItems.filter(s => !records.some(r => r.name === s)) },
  categories, semanticGroups, pockets: tally(records.map(r => r.pocket)), attributes: tally(records.flatMap(r => r.attributes ?? [])), sourceKeys: tally(records.flatMap(r => r.sourceKeys)),
  totalCoverage: Object.fromEntries(Object.keys(records[0].fields).map(key => [key, records.filter(r => r.fields[key]).length])),
  acquisitionRowCoverage: Object.fromEntries([...new Set(records.flatMap(r => r.acquisition.flatMap(a => Object.keys(a))))].sort().map(key => [key, records.flatMap(r => r.acquisition).filter(a => has(a[key])).length])),
  acquisitionRows: records.reduce((sum, r) => sum + r.acquisitionCount, 0), machineProblems, machineConflicts: records.filter(r => r.conflicts.length),
  fossilMappings: fossilItems, standardFossilCount: standardFossilItems.length, diagnostics, evolutionRows, records
};
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, "inventory.json"), `${JSON.stringify(result, null, 2)}\n`);
const table = (headers, rows) => [`| ${headers.join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`, ...rows.map(row => `| ${row.join(" | ")} |`)].join("\n");
const sections = ["# Item Content Audit: Measured Inventory", "Generated by `node scripts/auditItemSpecializedContent.js`. Audit output only. Counts describe this repository snapshot, not Pokemon canon. All category denominators below are visible canonical records. Zero and false count as present for scalar fields; arrays must be nonempty. Acquisition counts use page merge precedence. A field's presence does not establish factual correctness.", "## Population", table(["Metric", "Count"], Object.entries(counts)), "## Explicit Categories", table(["Category", "All records", "Visible", "Examples"], categories.map(c => [c.category, c.totalRecords, c.visible, c.examples.join(", ")])), "## Pockets", table(["Pocket", "Visible"], Object.entries(result.pockets)), "## Attributes", table(["Attribute", "Visible records"], Object.entries(result.attributes)), "## Field Coverage"];
const keys = Object.keys(records[0].fields);
for (let start = 0; start < keys.length; start += 8) {
  const part = keys.slice(start, start + 8);
  sections.push(table(["Category (denominator)", ...part], categories.map(c => [`${c.category} (${c.visible})`, ...part.map(k => c.coverage[k])])));
}
sections.push("## Cross-Category Groups", "Groups overlap and must not be summed. Categories/pockets are explicit; prefix/suffix groups and the Rotom allowlist are audit classifications, not new production taxonomy.", table(["Group", "Visible", "Examples"], semanticGroups.map(g => [g.group, g.count, g.examples.join(", ")])));
for (let start = 0; start < keys.length; start += 8) {
  const part = keys.slice(start, start + 8);
  sections.push(table(["Group (denominator)", ...part], semanticGroups.map(g => [`${g.group} (${g.count})`, ...part.map(k => g.coverage[k])])));
}
sections.push("## Acquisition Row Coverage", `Total effective acquisition rows: ${result.acquisitionRows}. False boolean values count as present.`, table(["Field", "Rows with value"], Object.entries(result.acquisitionRowCoverage)), "## Item Source Schema", table(["Top-level key", "Visible records containing key"], Object.entries(result.sourceKeys)), "## Reconciliation", "```json\n" + JSON.stringify(result.discrepancies, null, 2) + "\n```", "## Specialized Diagnostics", "```json\n" + JSON.stringify(diagnostics, null, 2) + "\n```", "See inventory.json for every visible item, exact machine rows, acquisition records, evolution edges, and per-item coverage flags. Read assessment.md for confidence and rollout decisions; counts alone are not recommendations.");
fs.writeFileSync(path.join(output, "inventory.md"), `${sections.join("\n\n")}\n`);
console.log(JSON.stringify({ counts, totalCoverage: result.totalCoverage, categories: categories.map(c => [c.category, c.visible]), discrepancies: result.discrepancies, machineProblems: machineProblems.length, machineConflicts: result.machineConflicts.length }, null, 2));
