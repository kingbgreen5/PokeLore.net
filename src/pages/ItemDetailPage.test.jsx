import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";
import {
  Link,
  MemoryRouter,
  Route,
  Routes,
  useLocation
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

const luckyEgg = {
  ...pokeBall,
  id: 215,
  name: "lucky-egg",
  displayName: "Lucky Egg",
  shortEffect: "Boosts experience."
};

const heartScale = {
  ...pokeBall,
  id: 93,
  name: "heart-scale",
  displayName: "Heart Scale",
  shortEffect: "Can be traded for prior level-up moves."
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

function LocationDisplay() {
  const location = useLocation();

  return (
    <div data-testid="location-path">
      {location.pathname}
    </div>
  );
}

function renderItemRouteWithNav(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Link to="/item/heart-scale">
        Heart Scale Link
      </Link>
      <LocationDisplay />
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

function renderItemRouteWithTargetNav({
  path,
  target,
  label
}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Link to={target}>
        {label}
      </Link>
      <LocationDisplay />
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

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise(
    (promiseResolve, promiseReject) => {
      resolve = promiseResolve;
      reject = promiseReject;
    }
  );

  return {
    promise,
    resolve,
    reject
  };
}

describe("ItemDetailPage", () => {
  afterEach(() => {
    cleanup();
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

  it("ignores stale item loads after navigating to another item", async () => {
    const luckyEggResponse =
      createDeferred();

    const fetchMock = vi
      .fn()
      .mockImplementation(url => {
        if (
          url ===
          "/data/items/lucky-egg.json"
        ) {
          return luckyEggResponse.promise;
        }

        if (
          url ===
          "/data/items/heart-scale.json"
        ) {
          return Promise.resolve(
            jsonResponse(heartScale)
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
          url.includes(
            "/data/itemLocationsCurated/"
          )
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

    renderItemRouteWithNav(
      "/item/lucky-egg"
    );

    fireEvent.click(
      screen.getByRole("link", {
        name: "Heart Scale Link"
      })
    );

    expect(
      await screen.findByRole(
        "heading",
        {
          name: "Heart Scale"
        }
      )
    ).toBeInTheDocument();

    luckyEggResponse.resolve(
      jsonResponse(luckyEgg)
    );

    await waitFor(() =>
      expect(
        screen.getByTestId(
          "location-path"
        )
      ).toHaveTextContent(
        "/item/heart-scale"
      )
    );

    expect(
      screen.queryByRole("heading", {
        name: "Lucky Egg"
      })
    ).not.toBeInTheDocument();
  });

  it("does not redirect back to the previous item while the next item starts loading", async () => {
    const heartScaleResponse =
      createDeferred();

    const fetchMock = vi
      .fn()
      .mockImplementation(url => {
        if (
          url ===
          "/data/items/lucky-egg.json"
        ) {
          return Promise.resolve(
            jsonResponse(luckyEgg)
          );
        }

        if (
          url ===
          "/data/items/heart-scale.json"
        ) {
          return heartScaleResponse.promise;
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
          url.includes(
            "/data/itemLocationsCurated/"
          )
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

    renderItemRouteWithTargetNav({
      path: "/item/lucky-egg",
      target: "/item/heart-scale",
      label: "Heart Scale Link"
    });

    expect(
      await screen.findByRole(
        "heading",
        {
          name: "Lucky Egg"
        }
      )
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("link", {
        name: "Heart Scale Link"
      })
    );

    expect(
      screen.getByTestId(
        "location-path"
      )
    ).toHaveTextContent(
      "/item/heart-scale"
    );

    expect(
      screen.queryByRole("heading", {
        name: "Lucky Egg"
      })
    ).not.toBeInTheDocument();

    heartScaleResponse.resolve(
      jsonResponse(heartScale)
    );

    expect(
      await screen.findByRole(
        "heading",
        {
          name: "Heart Scale"
        }
      )
    ).toBeInTheDocument();

    expect(
      screen.getByTestId(
        "location-path"
      )
    ).toHaveTextContent(
      "/item/heart-scale"
    );
  });
});
