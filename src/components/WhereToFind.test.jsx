import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import WhereToFind from "./WhereToFind";
import feebasEncounters from "../../public/data/pokemonEncounters/349.json";
import pikachuEncounters from "../../public/data/pokemonEncounters/25.json";

function jsonResponse(data) {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(data)
  };
}

function notFoundResponse() {
  return {
    ok: false,
    status: 404,
    json: vi.fn()
  };
}

function renderWhereToFind(props) {
  return render(
    <MemoryRouter>
      <WhereToFind {...props} />
    </MemoryRouter>
  );
}

describe("WhereToFind", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("shows the Pokemon display name in the section title", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(feebasEncounters)
      )
    );

    renderWhereToFind({
      enabled: true,
      pokemonId: 349,
      pokemonName: "Feebas"
    });

    expect(
      await screen.findByRole("button", {
        name: /Where To Find Feebas/
      })
    ).toBeInTheDocument();
  });

  it("keeps selected-version filtering and adds a compact location summary", async () => {
    localStorage.setItem(
      "pokelore:encounter-version",
      JSON.stringify("emerald")
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(feebasEncounters)
      )
    );

    renderWhereToFind({
      enabled: true,
      pokemonId: 349,
      pokemonName: "Feebas"
    });

    expect(
      await screen.findByRole("combobox", {
        name: "Encounter version"
      })
    ).toHaveValue("emerald");
    expect(
      screen.getByRole("link", {
        name: "Route 119"
      })
    ).toHaveAttribute(
      "href",
      "/location/hoenn-route-119"
    );
    expect(
      screen.getByText(
        (_, element) =>
          element?.textContent ===
          "Route 119 · Hoenn"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Feebas Tile Fishing · Lv. 20–25 · up to 50%"
      )
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Emerald")
        .length
    ).toBeGreaterThan(0);
  });

  it("avoids misleading aggregate level and chance text for All Versions", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(feebasEncounters)
      )
    );

    renderWhereToFind({
      enabled: true,
      pokemonId: 349,
      pokemonName: "Feebas"
    });

    await waitFor(() =>
      expect(
        screen.getAllByText(
          "Feebas Tile Fishing · version details vary"
        ).length
      ).toBeGreaterThan(0)
    );
  });

  it("retains encounter conditions in expanded detail records", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(pikachuEncounters)
      )
    );

    renderWhereToFind({
      enabled: true,
      pokemonId: 25,
      pokemonName: "Pikachu"
    });

    expect(
      (
        await screen.findAllByText(
          /Friend Safari Slot 2/
        )
      ).length
    ).toBeGreaterThan(0);
  });

  it("uses prerender preview counts before encounter JSON loads", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
    );

    renderWhereToFind({
      enabled: false,
      initialPreview: {
        pokemonId: 349,
        locationCount: 5
      },
      pokemonId: 349,
      pokemonName: "Feebas"
    });

    expect(
      screen.getByRole("button", {
        name: /Where To Find Feebas 5 locations/
      })
    ).toBeInTheDocument();
  });

  it("preserves the no encounter data state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        notFoundResponse()
      )
    );

    renderWhereToFind({
      enabled: true,
      initialPreview: {
        pokemonId: 617,
        locationCount: 0
      },
      pokemonId: 617,
      pokemonName: "Accelgor"
    });

    expect(
      await screen.findByText(
        "No encounter location data is available yet."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Where To Find Accelgor No known locations/
      })
    ).toBeInTheDocument();
  });
});
