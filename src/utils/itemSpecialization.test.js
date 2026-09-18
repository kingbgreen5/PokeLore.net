import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { buildItemSpecializedSections, getFossilModel, validateEvolutionRule } from "./itemSpecialization.js";
import { evolutionItemRules, evolutionItemAllowlist, evItemRules, fossilChainIds, mulchMechanics } from "../data/itemSpecializationRules.js";

const read = p => JSON.parse(fs.readFileSync(`public/data/${p}.json`, "utf8"));
const pokemonIndex = read("pokemonIndex");
const itemsIndex = read("itemsIndex");
const item = name => read(`items/${name}`);
const chain = name => read(`evolutionChains/${fossilChainIds[name]}`);
const sections = name => buildItemSpecializedSections({ item: item(name), pokemonIndex, itemsIndex, fossilChain: fossilChainIds[name] ? chain(name) : null });

describe("classic fossil validation", () => {
  it("derives all eleven bases from edges and resolves every family link", () => {
    const expected = ["omanyte", "kabuto", "aerodactyl", "lileep", "anorith", "cranidos", "shieldon", "tirtouga", "archen", "tyrunt", "amaura"];
    Object.keys(fossilChainIds).forEach((name, index) => {
      expect(getFossilModel(item(name), chain(name), pokemonIndex)?.root).toBe(expected[index]);
      expect(sections(name).filter(s => s.id === "fossil-family")).toHaveLength(1);
    });
  });
  it("separates the later evolution and keeps day/night conditions", () => {
    expect(getFossilModel(item("helix-fossil"), chain("helix-fossil"), pokemonIndex).edges).toEqual([{ from: "omanyte", to: "omastar", level: 40, time: null }]);
    expect(getFossilModel(item("jaw-fossil"), chain("jaw-fossil"), pokemonIndex).edges[0].time).toBe("day");
    expect(getFossilModel(item("sail-fossil"), chain("sail-fossil"), pokemonIndex).edges[0].time).toBe("night");
    expect(getFossilModel(item("old-amber"), chain("old-amber"), pokemonIndex).edges).toEqual([]);
  });
  it("suppresses missing links, disconnected families and unknown conditions", () => {
    const helix = item("helix-fossil");
    expect(getFossilModel(helix, chain(helix.name), [])).toBeNull();
    const broken = chain(helix.name);
    broken.root.evolvesTo = [];
    expect(getFossilModel(helix, broken, pokemonIndex)).toBeNull();
    const conditional = chain(helix.name);
    conditional.root.evolvesTo[0].heldItem = "leftovers";
    expect(getFossilModel(helix, conditional, pokemonIndex)).toBeNull();
  });
  it.each(["fossilized-bird", "fossilized-drake", "fossilized-dino", "fossilized-fish"])("excludes %s", name => {
    expect(sections(name)).toEqual([]);
  });
});

describe("reviewed evolution scope", () => {
  it("publishes eight direct-use rules on seven items only for Legends Arceus", () => {
    expect(evolutionItemRules).toHaveLength(8);
    expect(new Set(evolutionItemRules.map(r => r.item)).size).toBe(7);
    for (const rule of evolutionItemRules) {
      expect(validateEvolutionRule(rule, pokemonIndex)).toBe(true);
      expect(rule.role).toBe("used-on");
      expect(rule.games).toEqual(["legends-arceus"]);
    }
    expect(sections("metal-coat")[0].rows).toHaveLength(2);
  });
  it("rejects broken links, unknown forms, missing roles and guessed ranges", () => {
    const base = evolutionItemRules[0];
    for (const patch of [{ sourceSlug: "missing" }, { targetSlug: "missing" }, { sourceForm: null }, { sourceForm: "hisui" }, { role: null }, { role: "held-during-trade" }, { games: [] }, { games: ["scarlet-violet"] }]) {
      expect(validateEvolutionRule({ ...base, ...patch }, pokemonIndex)).toBe(false);
    }
  });
  it("rejects a lost reviewed gender/time condition or collapsed alternative", () => {
    const reviewed = { ...evolutionItemRules[0], conditions: { all: [{ gender: "male" }, { time: "night" }] }, alternateMethods: [{ role: "held-during-trade", games: ["x-y"] }] };
    expect(validateEvolutionRule(reviewed, pokemonIndex, [reviewed])).toBe(true);
    expect(validateEvolutionRule({ ...reviewed, conditions: { all: [] } }, pokemonIndex, [reviewed])).toBe(false);
    expect(validateEvolutionRule({ ...reviewed, alternateMethods: [] }, pokemonIndex, [reviewed])).toBe(false);
  });
  it.each(["fire-stone", "water-stone", "dawn-stone", "prism-scale", "kings-rock", "razor-claw", "cracked-pot", "chipped-pot"])("withholds unresolved %s rather than publishing a partial universal list", name => {
    expect(sections(name)).toEqual([]);
  });
  it("records the full requested review allowlist", () => {
    expect(evolutionItemAllowlist).toHaveLength(23);
  });
});

describe("EV rules", () => {
  it("uses exactly seven items and the six explicit stat mappings", () => {
    expect(Object.keys(evItemRules).sort()).toEqual(["macho-brace", "power-anklet", "power-band", "power-belt", "power-bracer", "power-lens", "power-weight"]);
    expect(["power-weight", "power-bracer", "power-belt", "power-lens", "power-band", "power-anklet"].map(n => evItemRules[n].stat)).toEqual(["HP", "Attack", "Defense", "Special Attack", "Special Defense", "Speed"]);
  });
  it("keeps +4/+8 scopes separate and excludes non-EV games", () => {
    for (const name of Object.keys(evItemRules).filter(n => n !== "macho-brace")) {
      const rules = evItemRules[name].rules;
      expect(rules.map(r => r.bonusEVs)).toEqual([4, 8]);
      expect(rules[0].games).toContain("x-y");
      expect(rules[1].games).toContain("scarlet-violet");
      expect(rules.flatMap(r => r.games)).not.toContain("legends-arceus");
      expect(rules.flatMap(r => r.games)).not.toContain("lets-go-pikachu-lets-go-eevee");
      expect(evItemRules[name].speedMultiplier).toBe(0.5);
    }
    expect(evItemRules["macho-brace"].evMultiplier).toBe(2);
    expect(evItemRules["macho-brace"].speedMultiplier).toBe(0.5);
    expect(evItemRules["macho-brace"].scope.games).not.toContain("scarlet-violet");
  });
  it("does not derive facts from effect or flavor text", () => {
    const changed = { ...item("power-bracer"), effect: "gives 999 EVs", shortEffect: null, flavorTextEntries: [] };
    expect(buildItemSpecializedSections({ item: changed })).toEqual(sections("power-bracer"));
  });
});

describe("mulch stop condition", () => {
  it("has exactly eight canonical members and seven non-self links per page", () => {
    const members = itemsIndex.filter(i => i.category === "mulch");
    expect(members).toHaveLength(8);
    for (const member of members) {
      const result = sections(member.name);
      expect(result.map(s => s.id)).toEqual(["related-mulches"]);
      expect(result[0].rows).toHaveLength(7);
      for (const [link] of result[0].rows) expect(fs.existsSync(`public/data/items/${link.href.split("/").pop()}.json`)).toBe(true);
    }
  });
  it("does not equate unknown functionality with inactive or parse prose", () => {
    expect(mulchMechanics["gooey-mulch"].pending.active).toBeNull();
    expect(mulchMechanics["gooey-mulch"].rules).toEqual([]);
    expect(buildItemSpecializedSections({ item: { ...item("gooey-mulch"), effect: "Active in all games, 999%", flavorTextEntries: [] }, itemsIndex })).toEqual(sections("gooey-mulch"));
  });
  it.each(["leftovers", "master-ball", "rare-candy", "tm26", "sitrus-berry", "dynamax-crystal-and15"])("does not add modules to %s", name => {
    expect(sections(name)).toEqual([]);
  });
});
