import {
  describe,
  expect,
  it
} from "vitest";
import {
  getPokemonUrl,
  resolvePokemonRouteIdentifier
} from "./pokemonUrls";

const routes = {
  byId: {
    25: "pikachu",
    177: "natu",
    776: "turtonator"
  },
  byName: {
    pikachu: 25,
    natu: 177,
    turtonator: 776
  }
};

describe("pokemonUrls", () => {
  it("builds canonical name-based Pokemon URLs", () => {
    expect(
      getPokemonUrl({
        id: 776,
        name: "turtonator"
      })
    ).toBe("/pokemon/turtonator");
  });

  it("does not invent numeric Pokemon URLs without a slug", () => {
    expect(getPokemonUrl({ id: 776 })).toBeNull();
    expect(getPokemonUrl("776")).toBeNull();
  });

  it("resolves numeric legacy IDs to canonical slugs", () => {
    expect(
      resolvePokemonRouteIdentifier(
        "776",
        routes
      )
    ).toEqual({
      status: "redirect",
      slug: "turtonator",
      id: 776
    });
  });

  it("resolves canonical names to data IDs", () => {
    expect(
      resolvePokemonRouteIdentifier(
        "natu",
        routes
      )
    ).toEqual({
      status: "found",
      slug: "natu",
      id: 177
    });
  });

  it("returns not found for unknown identifiers", () => {
    expect(
      resolvePokemonRouteIdentifier(
        "999999",
        routes
      )
    ).toEqual({
      status: "not-found"
    });
  });
});
