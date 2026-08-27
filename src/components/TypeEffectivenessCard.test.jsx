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
import TypeEffectivenessCard from "./TypeEffectivenessCard";

afterEach(() => {
  cleanup();
});

function renderCard(props) {
  return render(
    <MemoryRouter>
      <TypeEffectivenessCard {...props} />
    </MemoryRouter>
  );
}

describe("TypeEffectivenessCard", () => {
  it("renders a formatted Pokemon weakness and resistance heading", () => {
    renderCard({
      pokemonName: "Ivysaur",
      types: ["grass", "poison"]
    });

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Ivysaur's Weaknesses and Resistances"
      })
    ).toBeInTheDocument();
  });

  it("renders exact multipliers before meaningful type badge images without duplicate visible type text", () => {
    renderCard({
      pokemonName: "Ivysaur",
      types: ["grass", "poison"]
    });

    const weaknessGroup = screen
      .getByRole("heading", {
        name: "Weak To"
      })
      .closest("section");
    const resistanceGroup = screen
      .getByRole("heading", {
        name: "Resists"
      })
      .closest("section");

    const fireLink =
      within(weaknessGroup).getByRole(
        "link",
        {
          name: "Fire attacking moves deal 2× damage"
        }
      );

    expect(
      within(fireLink).queryByText("Fire")
    ).not.toBeInTheDocument();
    expect(
      fireLink.children[0]
    ).toHaveTextContent("2×");
    expect(fireLink.children[0].tagName).toBe(
      "STRONG"
    );
    expect(fireLink.children[1].tagName).toBe(
      "IMG"
    );
    expect(
      within(fireLink).getByRole("img", {
        name: "Fire type"
      })
    ).toBeInTheDocument();
    expect(
      within(weaknessGroup).getAllByText("2×")
    ).toHaveLength(4);
    expect(
      within(resistanceGroup).getByRole(
        "img",
        {
          name: "Grass type"
        }
      )
    ).toBeInTheDocument();
    expect(
      within(resistanceGroup).getByText("¼×")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Fire attacking moves deal 2× damage"
      })
    ).toHaveAttribute("href", "/type/fire");
  });

  it("renders immunities with meaningful image alt text when present", () => {
    renderCard({
      pokemonName: "Gyarados",
      types: ["water", "flying"]
    });

    const immunityGroup = screen
      .getByRole("heading", {
        name: "Immune To"
      })
      .closest("section");

    expect(
      within(immunityGroup).getByRole(
        "img",
        {
          name: "Ground type"
        }
      )
    ).toBeInTheDocument();
    expect(
      within(immunityGroup).getByText("0×")
    ).toBeInTheDocument();
  });
});
