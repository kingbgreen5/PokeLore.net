import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from "vitest";
import {
  render,
  screen,
  waitFor
} from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes
} from "react-router-dom";
import ItemDetailPage from "./ItemDetailPage";

const pokeBall = {
  id: 4,
  name: "poke-ball",
  displayName: "Poké Ball",
  cost: 200,
  sprite: null,
  category: {
    displayName: "Standard balls",
    pocket: "pokeballs"
  },
  attributes: ["countable"],
  effect: "Used in battle.",
  shortEffect: "Tries to catch a wild Pokémon.",
  flavorTextEntries: [],
  fling: {
    power: null
  },
  heldByPokemon: [],
  machines: []
};

function jsonResponse(data) {
  return {
    ok: true,
    status: 200,
    text: vi.fn().mockResolvedValue(
      JSON.stringify(data)
    )
  };
}

function htmlFallbackResponse() {
  return {
    ok: true,
    status: 200,
    text: vi
      .fn()
      .mockResolvedValue(
        "<!doctype html><div id=\"root\"></div>"
      )
  };
}

function renderItemRoute(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/item/:itemName"
          element={<ItemDetailPage />}
        />
        <Route
          path="/items"
          element={<h1>Items</h1>}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("ItemDetailPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders an item when optional migrated acquisition data is missing", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(url => {
        if (
          url ===
          "/data/items/poke-ball.json"
        ) {
          return Promise.resolve(
            jsonResponse(pokeBall)
          );
        }

        if (
          url ===
          "/data/pokemonIndex.json"
        ) {
          return Promise.resolve(
            jsonResponse([])
          );
        }

        if (
          url ===
          "/data/itemLocationsCurated/poke-ball.json"
        ) {
          return Promise.resolve(
            htmlFallbackResponse()
          );
        }

        return Promise.resolve({
          ok: false,
          status: 404,
          text: vi.fn()
        });
      });

    vi.stubGlobal("fetch", fetchMock);

    renderItemRoute("/item/poke-ball");

    expect(
      await screen.findByRole(
        "heading",
        {
          name: "Poké Ball"
        }
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Item not found")
    ).not.toBeInTheDocument();

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/data/itemLocationsCurated/poke-ball.json"
      )
    );
  });
});
