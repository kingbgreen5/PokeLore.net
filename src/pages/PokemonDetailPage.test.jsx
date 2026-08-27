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
import PokemonDetailPage from "./PokemonDetailPage";
import { pokemonSeo } from "../seo/seoConfig";
import pokemonRoutes from "../../public/data/pokemonRoutes.json";
import bulbasaur from "../../public/data/pokemonData/1.json";
import charizard from "../../public/data/pokemonData/6.json";
import pikachu from "../../public/data/pokemonData/25.json";
import lapras from "../../public/data/pokemonData/131.json";
import celebi from "../../public/data/pokemonData/251.json";
import feebas from "../../public/data/pokemonData/349.json";
import miraidon from "../../public/data/pokemonData/1008.json";

const representativePokemon = [
  {
    slug: "bulbasaur",
    pokemon: bulbasaur
  },
  {
    slug: "pikachu",
    pokemon: pikachu
  },
  {
    slug: "lapras",
    pokemon: lapras
  },
  {
    slug: "celebi",
    pokemon: celebi
  },
  {
    slug: "feebas",
    pokemon: feebas
  },
  {
    slug: "charizard",
    pokemon: charizard
  },
  {
    slug: "miraidon",
    pokemon: miraidon
  }
];

const pokemonDataById = new Map(
  representativePokemon.map(({ pokemon }) => [
    pokemon.id,
    pokemon
  ])
);

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

function renderPokemonRoute(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/pokemon/:identifier"
          element={<PokemonDetailPage />}
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

function renderPokemonRouteWithNav(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Link to="/pokemon/lapras">
        Go to Lapras
      </Link>
      <LocationDisplay />
      <Routes>
        <Route
          path="/pokemon/:identifier"
          element={<PokemonDetailPage />}
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

function stubPokemonFetch({
  failRoutes = false,
  failPokemonIds = []
} = {}) {
  const failedPokemonIds = new Set(
    failPokemonIds.map(Number)
  );

  const fetchMock = vi
    .fn()
    .mockImplementation(url => {
      if (url === "/data/pokemonRoutes.json") {
        return Promise.resolve(
          failRoutes
            ? notFoundResponse()
            : jsonResponse(pokemonRoutes)
        );
      }

      const pokemonMatch = String(url).match(
        /^\/data\/pokemonData\/(\d+)\.json$/
      );

      if (pokemonMatch) {
        const id = Number(pokemonMatch[1]);
        const pokemon = pokemonDataById.get(id);

        return Promise.resolve(
          pokemon && !failedPokemonIds.has(id)
            ? jsonResponse(pokemon)
            : notFoundResponse()
        );
      }

      return Promise.resolve(notFoundResponse());
    });

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

function robotsMetaTags() {
  return Array.from(
    document.head.querySelectorAll(
      'meta[name="robots"]'
    )
  );
}

function robotsContent() {
  return robotsMetaTags()
    .map(tag => tag.getAttribute("content"))
    .join(" ");
}

function canonicalTags() {
  return Array.from(
    document.head.querySelectorAll(
      'link[rel="canonical"]'
    )
  );
}

function canonicalHref() {
  return document.head
    .querySelector('link[rel="canonical"]')
    ?.getAttribute("href");
}

function metaContent(selector) {
  return document.head
    .querySelector(selector)
    ?.getAttribute("content");
}

function getAbilityDisplayName(ability) {
  return typeof ability === "string"
    ? ability
        .split("-")
        .map(
          word =>
            word.charAt(0).toUpperCase() +
            word.slice(1)
        )
        .join(" ")
    : ability.name;
}

function baseStatTotal(pokemon) {
  return Object.values(pokemon.stats).reduce(
    (sum, value) => sum + value,
    0
  );
}

function seedStaleRobotsTag() {
  document.head.insertAdjacentHTML(
    "beforeend",
    '<meta name="robots" content="noindex, follow">'
  );
}

function seedStaleCanonicalTag() {
  document.head.insertAdjacentHTML(
    "beforeend",
    '<link rel="canonical" href="https://pokelore.net/pokemon/pikachu">'
  );
}

function seedStaleRobotsTags() {
  document.head.insertAdjacentHTML(
    "beforeend",
    '<meta name="robots" content="noindex, follow"><meta name="robots" content="noindex, nofollow">'
  );
}

async function expectResolvedPokemonPage(
  slug,
  pokemon
) {
  const expectedSeo = pokemonSeo(pokemon);

  expect(
    await screen.findByRole("heading", {
      name: expectedSeo.structuredData["@graph"][2]
        .name
    })
  ).toBeInTheDocument();

  await waitFor(() =>
    expect(document.title).toBe(
      expectedSeo.title
    )
  );
  await waitFor(() =>
    expect(
      metaContent('meta[property="og:title"]')
    ).toBe(expectedSeo.title)
  );
  expect(
    metaContent('meta[name="twitter:title"]')
  ).toBe(expectedSeo.title);
  await waitFor(() =>
    expect(
      metaContent('meta[name="description"]')
    ).toBe(expectedSeo.description)
  );
  expect(
    metaContent('meta[property="og:description"]')
  ).toBe(expectedSeo.description);
  expect(
    metaContent('meta[name="twitter:description"]')
  ).toBe(expectedSeo.description);
  expect(canonicalTags()).toHaveLength(1);
  expect(canonicalHref()).toBe(
    `https://pokelore.net/pokemon/${slug}`
  );
  expect(robotsMetaTags()).toHaveLength(1);
  expect(robotsContent()).not.toMatch(
    /noindex/i
  );
  expect(
    screen.getByRole("heading", {
      name: "Base Stats"
    })
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      `Total: ${baseStatTotal(pokemon)}`
    )
  ).toBeInTheDocument();
  expect(
    screen.getAllByRole("img", {
      name: `${pokemon.types[0]} type`
    }).length
  ).toBeGreaterThan(0);
  expect(
    screen.getByRole("link", {
      name: new RegExp(
        getAbilityDisplayName(
          pokemon.abilities[0]
        )
      )
    })
  ).toBeInTheDocument();
  expect(
    screen.queryByText("Pokemon Not Found")
  ).not.toBeInTheDocument();
}

describe("PokemonDetailPage SEO indexing", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.head.innerHTML = "";
    document.title = "";
  });

  it("removes the previous Pokemon canonical while the next Pokemon is loading", async () => {
    const laprasResponse =
      createDeferred();
    const fetchMock = vi
      .fn()
      .mockImplementation(url => {
        if (url === "/data/pokemonRoutes.json") {
          return Promise.resolve(
            jsonResponse(pokemonRoutes)
          );
        }

        if (
          url ===
          "/data/pokemonData/25.json"
        ) {
          return Promise.resolve(
            jsonResponse(pikachu)
          );
        }

        if (
          url ===
          "/data/pokemonData/131.json"
        ) {
          return laprasResponse.promise;
        }

        return Promise.resolve(
          notFoundResponse()
        );
      });

    vi.stubGlobal("fetch", fetchMock);

    renderPokemonRouteWithNav(
      "/pokemon/pikachu"
    );

    await expectResolvedPokemonPage(
      "pikachu",
      pikachu
    );

    fireEvent.click(
      screen.getByRole("link", {
        name: "Go to Lapras"
      })
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("location-path")
      ).toHaveTextContent("/pokemon/lapras")
    );
    expect(
      await screen.findByText("Loading...")
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(document.title).toBe(
        "Loading Pokemon | PokeLore"
      )
    );

    expect(canonicalTags()).toHaveLength(0);

    laprasResponse.resolve(
      jsonResponse(lapras)
    );

    await expectResolvedPokemonPage(
      "lapras",
      lapras
    );
  });

  it("removes the previous Pokemon canonical after a transient data failure", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(url => {
        if (url === "/data/pokemonRoutes.json") {
          return Promise.resolve(
            jsonResponse(pokemonRoutes)
          );
        }

        if (
          url ===
          "/data/pokemonData/25.json"
        ) {
          return Promise.resolve(
            jsonResponse(pikachu)
          );
        }

        if (
          url ===
          "/data/pokemonData/131.json"
        ) {
          return Promise.resolve(
            notFoundResponse()
          );
        }

        return Promise.resolve(
          notFoundResponse()
        );
      });

    vi.stubGlobal("fetch", fetchMock);

    renderPokemonRouteWithNav(
      "/pokemon/pikachu"
    );

    await expectResolvedPokemonPage(
      "pikachu",
      pikachu
    );

    fireEvent.click(
      screen.getByRole("link", {
        name: "Go to Lapras"
      })
    );

    expect(
      await screen.findByRole("heading", {
        name: "Pokemon Temporarily Unavailable"
      })
    ).toBeInTheDocument();

    expect(canonicalTags()).toHaveLength(0);
    expect(robotsMetaTags()).toHaveLength(1);
    expect(robotsContent()).toBe(
      "max-image-preview:large"
    );
    expect(
      screen.queryByText("Pokemon Not Found")
    ).not.toBeInTheDocument();
  });

  it("changes a stale noindex robots tag to neutral robots during loading", async () => {
    const routesResponse =
      createDeferred();
    const fetchMock = vi
      .fn()
      .mockImplementation(url => {
        if (url === "/data/pokemonRoutes.json") {
          return routesResponse.promise;
        }

        return Promise.resolve(
          notFoundResponse()
        );
      });

    seedStaleRobotsTag();
    vi.stubGlobal("fetch", fetchMock);

    renderPokemonRoute("/pokemon/lapras");

    expect(
      await screen.findByText("Loading...")
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(robotsContent()).toBe(
        "max-image-preview:large"
      )
    );
    expect(robotsMetaTags()).toHaveLength(1);
  });

  it("removes a manually stale canonical tag during loading", async () => {
    const routesResponse =
      createDeferred();
    const fetchMock = vi
      .fn()
      .mockImplementation(url => {
        if (url === "/data/pokemonRoutes.json") {
          return routesResponse.promise;
        }

        return Promise.resolve(
          notFoundResponse()
        );
      });

    seedStaleCanonicalTag();
    vi.stubGlobal("fetch", fetchMock);

    renderPokemonRoute("/pokemon/lapras");

    expect(
      await screen.findByText("Loading...")
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(canonicalTags()).toHaveLength(0)
    );
  });

  it("does not create a canonical while a numeric Pokemon ID is unresolved", async () => {
    const routesResponse =
      createDeferred();
    const fetchMock = vi
      .fn()
      .mockImplementation(url => {
        if (url === "/data/pokemonRoutes.json") {
          return routesResponse.promise;
        }

        return Promise.resolve(
          notFoundResponse()
        );
      });

    vi.stubGlobal("fetch", fetchMock);

    renderPokemonRoute("/pokemon/131");

    expect(
      await screen.findByText("Loading...")
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(canonicalTags()).toHaveLength(0)
    );
  });

  it("repeatedly loads representative Pokemon pages without noindex", async () => {
    for (const {
      slug,
      pokemon
    } of representativePokemon) {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        cleanup();
        document.head.innerHTML = "";
        seedStaleRobotsTags();
        stubPokemonFetch();

        renderPokemonRoute(`/pokemon/${slug}`);

        await expectResolvedPokemonPage(
          slug,
          pokemon
        );
      }
    }
  });

  it("keeps numeric Pokemon IDs redirecting to canonical slugs", async () => {
    const numericRoutes = [
      {
        path: "/pokemon/25",
        slug: "pikachu",
        pokemon: pikachu
      },
      {
        path: "/pokemon/131",
        slug: "lapras",
        pokemon: lapras
      }
    ];

    for (const {
      path,
      slug,
      pokemon
    } of numericRoutes) {
      cleanup();
      document.head.innerHTML = "";
      seedStaleRobotsTags();
      stubPokemonFetch();

      renderPokemonRoute(path);

      await expectResolvedPokemonPage(
        slug,
        pokemon
      );
    }
  });

  it("only emits noindex for a confirmed invalid Pokemon route", async () => {
    seedStaleCanonicalTag();
    stubPokemonFetch();

    renderPokemonRoute(
      "/pokemon/definitely-not-a-pokemon"
    );

    expect(
      await screen.findByRole("heading", {
        name: "Pokemon Not Found"
      })
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(robotsContent()).toBe(
        "noindex, follow"
      )
    );
    expect(robotsMetaTags()).toHaveLength(1);
    expect(canonicalTags()).toHaveLength(0);
  });

  it("does not emit noindex when route lookup temporarily fails", async () => {
    seedStaleRobotsTags();
    seedStaleCanonicalTag();
    stubPokemonFetch({
      failRoutes: true
    });

    renderPokemonRoute("/pokemon/lapras");

    expect(
      await screen.findByRole("heading", {
        name: "Pokemon Temporarily Unavailable"
      })
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Pokemon Not Found")
    ).not.toBeInTheDocument();
    expect(robotsMetaTags()).toHaveLength(1);
    expect(robotsContent()).not.toMatch(
      /noindex/i
    );
    expect(canonicalTags()).toHaveLength(0);
  });

  it("does not emit noindex when confirmed route data temporarily fails", async () => {
    seedStaleRobotsTag();
    seedStaleCanonicalTag();
    stubPokemonFetch({
      failPokemonIds: [lapras.id]
    });

    renderPokemonRoute("/pokemon/lapras");

    expect(
      await screen.findByRole("heading", {
        name: "Pokemon Temporarily Unavailable"
      })
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Pokemon Not Found")
    ).not.toBeInTheDocument();
    expect(robotsMetaTags()).toHaveLength(1);
    expect(robotsContent()).toBe(
      "max-image-preview:large"
    );
    expect(canonicalTags()).toHaveLength(0);
  });
});
