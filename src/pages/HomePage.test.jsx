import {
  afterEach,
  beforeEach,
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
import {
  homepageToolLinks
} from "../data/homepageContent";
import HomePage from "./HomePage.jsx";

const pokemonIndex = [
  {
    id: 1,
    name: "bulbasaur",
    types: ["grass", "poison"],
    sprite: "/sprites/bulbasaur.png"
  },
  {
    id: 25,
    name: "pikachu",
    types: ["electric"],
    sprite: "/sprites/pikachu.png"
  }
];

function renderHomePage() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <HomePage />
    </MemoryRouter>
  );
}

describe("HomePage", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockImplementation(url => {
      if (String(url).includes("pokemonIndex")) {
        return Promise.resolve({
          json: () => Promise.resolve(pokemonIndex)
        });
      }

      if (String(url).includes("newsIndex")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ articles: [] })
        });
      }

      return Promise.reject(
        new Error(`Unexpected fetch: ${url}`)
      );
    });

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    document.head.innerHTML = "";
    document.title = "";
  });

  it("renders one homepage H1 and the major resource links", async () => {
    renderHomePage();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Pokémon Pokédex, Tools & Game Guides"
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        level: 1,
        name: "PokéLore"
      })
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", {
        level: 1
      })
    ).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Pokémon Tools & Resources"
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /PokéLore\.net is a game-focused Pokémon reference/
      )
    ).toBeInTheDocument();

    homepageToolLinks.forEach(tool => {
      const link = screen.getByRole("link", {
        name: new RegExp(tool.title)
      });

      expect(link).toHaveAttribute(
        "href",
        tool.path
      );
    });

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Explore the National Pokédex"
      })
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.getByText(/Showing 1-2 of 2 Pokémon/)
      ).toBeInTheDocument()
    );
  });
});
