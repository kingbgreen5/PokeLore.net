import {
  afterEach,
  describe,
  expect,
  it
} from "vitest";
import {
  cleanup,
  render,
  screen,
  within
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AcquisitionMethods from "./AcquisitionMethods";

function renderAcquisition(acquisition) {
  return render(
    <MemoryRouter>
      <AcquisitionMethods
        acquisition={acquisition}
        storageKey="test-acquisition-expanded"
      />
    </MemoryRouter>
  );
}

describe("AcquisitionMethods", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it("renders game-family H3 headings instead of one generation heading per entry", () => {
    renderAcquisition([
      {
        generation: 4,
        games: [
          "Pokémon Diamond",
          "Pokémon Pearl"
        ],
        location: {
          name: "fuego-ironworks",
          displayName: "Fuego Ironworks"
        },
        method:
          "Collect the two fixed Fire Stones.",
        acquisitionType: "field-item",
        repeatable: false,
        versionExclusive: true,
        requirements: [
          "Two copies are available"
        ]
      },
      {
        generation: 4,
        games: ["Pokémon Platinum"],
        location: {
          name: "solaceon-ruins",
          displayName: "Solaceon Ruins"
        },
        method:
          "Collect the fixed Fire Stone.",
        acquisitionType: "field-item",
        repeatable: false,
        versionExclusive: true,
        requirements: []
      },
      {
        generation: 4,
        games: [
          "Pokémon HeartGold",
          "Pokémon SoulSilver"
        ],
        location: {
          name: "johto-route-36",
          displayName: "Route 36"
        },
        method:
          "School Kid Alan may give one after a rematch.",
        acquisitionType: "battle-reward",
        repeatable: true,
        versionExclusive: false,
        requirements: [
          "Register Alan's phone number"
        ]
      }
    ]);

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Pokémon Diamond, Pearl & Platinum"
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Pokémon HeartGold & SoulSilver"
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        level: 3,
        name: /Generation 4/
      })
    ).not.toBeInTheDocument();

    const platinumEntry = screen
      .getByText("Solaceon Ruins")
      .closest("article");

    expect(platinumEntry).not.toHaveTextContent(
      /Generation\s*4/
    );
    expect(platinumEntry).not.toHaveTextContent(
      /Games/
    );
    expect(platinumEntry).toHaveTextContent(
      "Platinum only"
    );
    expect(platinumEntry).not.toHaveTextContent(
      /Version\s*Exclusive:\s*Yes/
    );
  });

  it("preserves links and acquisition detail fields inside each grouped entry", () => {
    renderAcquisition([
      {
        generation: 3,
        games: [
          "Pokemon Ruby",
          "Pokemon Sapphire",
          "Pokemon Emerald"
        ],
        location: {
          name: "hoenn-route-111",
          displayName: "Route 111"
        },
        area: "Winstrate family house",
        method:
          "Defeat all four members of the Winstrate family.",
        acquisitionType: "npc-gift",
        repeatable: false,
        versionExclusive: false,
        requirements: [
          "Defeat all four Winstrate family members"
        ],
        notes:
          "Speak to Victoria after the battles."
      },
      {
        generation: 4,
        games: [
          "Pokemon HeartGold",
          "Pokemon SoulSilver"
        ],
        location: {
          name: "goldenrod-city",
          displayName: "Goldenrod City"
        },
        area:
          "Goldenrod City Department Store 5F",
        method:
          "Receive held by the Machop traded for a Drowzee.",
        acquisitionType:
          "in-game-trade-held-item",
        repeatable: false,
        versionExclusive: false,
        requirements: [
          "Trade a Drowzee for the Machop"
        ],
        relatedPokemon: [
          {
            name: "machop",
            displayName: "Machop"
          },
          {
            name: "drowzee",
            displayName: "Drowzee"
          }
        ]
      },
      {
        generation: 8,
        games: [
          "Pokemon Sword",
          "Pokemon Shield"
        ],
        location: "Hammerlocke",
        method: "Purchase from the BP Shop.",
        acquisitionType: "purchase",
        repeatable: true,
        versionExclusive: false,
        requirements: ["10 BP"],
        cost: {
          amount: 10,
          currency: "BP"
        }
      }
    ]);

    const routeLink = screen.getByRole("link", {
      name: "Route 111"
    });
    expect(routeLink).toHaveAttribute(
      "href",
      "/location/hoenn-route-111"
    );

    expect(
      screen.getByText("Winstrate family house")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Defeat all four Winstrate family members"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Speak to Victoria after the battles."
      )
    ).toBeInTheDocument();
    expect(screen.getAllByText("10 BP")).toHaveLength(
      2
    );

    const hammerlockeEntry = screen
      .getByText("Hammerlocke")
      .closest("article");

    expect(
      screen.queryByText(
        "Pokemon Ruby, Pokemon Sapphire, Pokemon Emerald"
      )
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Pokemon Sword, Pokemon Shield"
      )
    ).not.toBeInTheDocument();
    expect(hammerlockeEntry).not.toHaveTextContent(
      /Generation\s*8/
    );
    expect(hammerlockeEntry).not.toHaveTextContent(
      /Version\s*Exclusive:\s*No/
    );
    expect(hammerlockeEntry).toHaveTextContent(
      /Repeatable:\s*Yes/
    );
    expect(
      within(hammerlockeEntry).getByText("Purchase")
    ).toBeInTheDocument();
    expect(
      within(hammerlockeEntry).getByText(
        "Purchase from the BP Shop."
      )
    ).toBeInTheDocument();

    const rubyEntry = screen
      .getByText("Route 111")
      .closest("article");

    expect(rubyEntry).toHaveTextContent(
      /Repeatable:\s*No/
    );

    expect(
      screen.getAllByRole("link", {
        name: "Machop"
      })
    ).toHaveLength(2);
    screen
      .getAllByRole("link", {
        name: "Machop"
      })
      .forEach(link =>
        expect(link).toHaveAttribute(
          "href",
          "/pokemon/machop"
        )
      );
    expect(
      screen.getAllByRole("link", {
        name: "Drowzee"
      })
    ).toHaveLength(2);
    screen
      .getAllByRole("link", {
        name: "Drowzee"
      })
      .forEach(link =>
        expect(link).toHaveAttribute(
          "href",
          "/pokemon/drowzee"
        )
      );
  });
});
