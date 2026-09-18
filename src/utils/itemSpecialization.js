import { standardFossilItems } from "../data/fossilItems.js";
import { evolutionItemRules, evItemRules } from "../data/itemSpecializationRules.js";
import { capitalizeItemText } from "./itemDetail.js";

const text = value => ({ text: value });
const pokemonLink = (slug, label = capitalizeItemText(slug)) => ({ text: label, href: `/pokemon/${slug}` });
const resolves = (slug, index) => index.some(p => p.name === slug);

export function getFossilModel(item, chain, pokemonIndex) {
  const family = standardFossilItems.find(f => f.slug === item?.name);
  if (!family || !chain?.root) return null;
  const members = new Map(family.restoredPokemon.map(p => [p.slug, p]));
  if ([...members.keys()].some(s => !resolves(s, pokemonIndex))) return null;
  const found = new Set();
  const edges = [];
  let invalid = false;
  function visit(node, parent) {
    const slug = node?.pokemon?.name;
    if (!slug) { invalid = true; return; }
    if (members.has(slug)) {
      if (found.has(slug)) invalid = true;
      found.add(slug);
      if (parent && members.has(parent)) {
        const extraConditions = ["item", "heldItem", "gender", "location", "minHappiness", "minBeauty", "minAffection", "knownMove", "knownMoveType", "partySpecies", "partyType", "tradeSpecies", "turnUpsideDown", "needsOverworldRain", "relativePhysicalStats"];
        if (node.trigger !== "level-up" || !Number.isInteger(node.minLevel) || node.minLevel < 1 ||
            ![null, undefined, "", "day", "night"].includes(node.timeOfDay) ||
            extraConditions.some(k => node[k] !== null && node[k] !== undefined && node[k] !== false && node[k] !== "")) invalid = true;
        edges.push({ from: parent, to: slug, level: node.minLevel, time: node.timeOfDay });
      }
    }
    for (const child of node.evolvesTo ?? []) visit(child, slug);
  }
  visit(chain.root, null);
  const roots = [...members.keys()].filter(s => !edges.some(e => e.to === s));
  if (invalid || found.size !== members.size || roots.length !== 1 || edges.length !== members.size - 1) return null;
  return { family, root: roots[0], edges };
}

// A normalized rule is publishable only if it still matches a reviewed record.
// This rejects lost gender/time/form/game qualifiers, not just malformed JSON.
export function validateEvolutionRule(rule, pokemonIndex, reviewed = evolutionItemRules) {
  if (!rule || !resolves(rule.sourceSlug, pokemonIndex) || !resolves(rule.targetSlug, pokemonIndex)) return false;
  if (!rule.sourceForm || !rule.targetForm || !rule.sourcePokemon || !rule.targetPokemon || !rule.games?.length || !rule.provenance?.length) return false;
  const triggers = { "used-on": "use-item", "held-during-trade": "trade", "held-while-leveling": "level-up" };
  if (triggers[rule.role] !== rule.trigger || !triggers[rule.role]) return false;
  if (!rule.review || Object.values(rule.review).some(v => v !== true)) return false;
  return reviewed.some(expected => JSON.stringify(rule) === JSON.stringify(expected));
}

export function buildItemSpecializedSections({ item, pokemonIndex = [], fossilChain = null, itemsIndex = [], evolutionRules = evolutionItemRules }) {
  if (!item) return [];
  const sections = [];
  const fossil = getFossilModel(item, fossilChain, pokemonIndex);
  if (fossil) {
    const labels = new Map(fossil.family.restoredPokemon.map(p => [p.slug, p.displayName]));
    const rows = [[text("Revived Pokémon: "), pokemonLink(fossil.root, labels.get(fossil.root))]];
    for (const edge of fossil.edges) rows.push([
      text("Later evolution: "), pokemonLink(edge.from, labels.get(edge.from)), text(" → "),
      pokemonLink(edge.to, labels.get(edge.to)), text(` at level ${edge.level}${edge.time ? ` during the ${edge.time}` : ""}.`)
    ]);
    sections.push({ id: "fossil-family", title: `Pokémon Revived From ${item.name === "old-amber" ? "" : "the "}${item.displayName}`, rows });
  }
  const rules = evolutionRules.filter(r => r.item === item.name);
  // The first release only renders the reviewed, condition-free Arceus rules.
  // New scopes/conditions require a renderer as well as a reviewed data record.
  const canRenderEvolution = r =>
    validateEvolutionRule(r, pokemonIndex) &&
    r.role === "used-on" && r.sourceForm === "default" && r.targetForm === "default" &&
    r.sourceSlug === r.sourcePokemon && r.targetSlug === r.targetPokemon &&
    r.games.length === 1 && r.games[0] === "legends-arceus" &&
    r.conditions?.all?.length === 0 && Object.keys(r.conditions).length === 1 &&
    r.alternateMethods?.length === 0;
  if (rules.length && rules.length === evolutionItemRules.filter(r => r.item === item.name).length && rules.every(canRenderEvolution)) {
    sections.push({
      id: "item-evolutions", title: `Pokémon That Evolve With ${item.displayName}`,
      rows: rules.map(r => [pokemonLink(r.sourceSlug), text(" → "), pokemonLink(r.targetSlug), text(`. Legends: Arceus: use ${item.displayName} directly on ${capitalizeItemText(r.sourceSlug)}.`)])
    });
  }
  const ev = evItemRules[item.name];
  if (ev) {
    const isMachoBrace = item.name === "macho-brace";
    const rows = [
      [
        text(isMachoBrace
          ? "The Macho Brace doubles the EVs the holder earns from battle."
          : `The ${item.displayName} grants additional ${ev.stat} EVs whenever the holder earns EVs from battle.`),
        { break: true },
        text(`While held in battle, it also reduces the holder's Speed to ${ev.speedMultiplier * 100}% of its normal value.`)
      ]
    ];
    if (isMachoBrace) {
      rows.push([{ text: "Applies in:", strong: true }, { break: true }, text(`${ev.scope.label}.`)]);
    } else {
      rows.push(...ev.rules.map(r => [
        { text: `+${r.bonusEVs} ${ev.stat} EVs`, strong: true },
        { break: true },
        text(`Applies in: ${r.label}.`)
      ]));
    }
    rows.push([{ text: "EV Training Routes →", href: "/ev-training-routes" }]);
    sections.push({ id: "ev-training-effect", title: item.name === "macho-brace" ? "How the Macho Brace Works" : `${item.displayName} EV Effect`, rows });
  }
  if (item.category?.name === "mulch") {
    const mulches = itemsIndex.filter(i => (i.category?.name ?? i.category) === "mulch");
    if (mulches.some(i => i.name === item.name)) sections.push({
      id: "related-mulches", title: "Related Mulches",
      rows: mulches.filter(i => i.name !== item.name).map(i => [{ text: i.displayName, href: `/item/${i.name}` }])
    });
  }
  return sections;
}
