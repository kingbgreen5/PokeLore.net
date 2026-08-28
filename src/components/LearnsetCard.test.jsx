import {
  afterEach,
  describe,
  expect,
  it
} from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LearnsetCard from "./LearnsetCard";

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  localStorage.clear();
});

const movesData = {
  tackle: {
    type: "normal",
    power: 40,
    accuracy: 100,
    category: "physical"
  },
  growl: {
    type: "normal",
    power: null,
    accuracy: 100,
    category: "status"
  },
  thunderbolt: {
    type: "electric",
    power: 90,
    accuracy: 100,
    category: "special"
  },
  protect: {
    type: "normal",
    power: null,
    accuracy: null,
    category: "status"
  }
};

const learnset = {
  id: 25,
  pokemon: "pikachu",
  moves: [
    {
      move: "tackle",
      method: "level-up",
      level: 5,
      versionGroup: "red-blue"
    },
    {
      move: "growl",
      method: "level-up",
      level: 1,
      versionGroup: "scarlet-violet"
    },
    {
      move: "growl",
      method: "level-up",
      level: 1,
      versionGroup: "scarlet-violet"
    },
    {
      move: "thunderbolt",
      method: "level-up",
      level: 36,
      versionGroup: "scarlet-violet"
    },
    {
      move: "protect",
      method: "machine",
      level: 0,
      versionGroup: "scarlet-violet"
    }
  ]
};

function renderLearnsetCard() {
  return render(
    <MemoryRouter>
      <LearnsetCard
        pokemonData={learnset}
        movesData={movesData}
        titleChevron={true}
      />
    </MemoryRouter>
  );
}

describe("LearnsetCard", () => {
  it("keeps collapsed Learnsets content mounted with current header behavior", () => {
    renderLearnsetCard();

    const button = screen.getByRole(
      "button",
      {
        name: /Learnsets 5 moves/
      }
    );

    expect(button).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(
      screen.getByLabelText(
        "Learnset version"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Level Up"
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Thunderbolt"
      })
    ).toHaveAttribute(
      "href",
      "/move/thunderbolt"
    );
  });

  it("uses shared version filtering, duplicate condensation, and level ordering", () => {
    renderLearnsetCard();

    fireEvent.change(
      screen.getByLabelText(
        "Learnset version"
      ),
      {
        target: {
          value: "scarlet-violet"
        }
      }
    );

    const levelUpSection =
      screen
        .getByRole("heading", {
          name: "Level Up"
        })
        .closest(".learnsetCard");

    expect(
      within(levelUpSection).getByRole(
        "link",
        {
          name: "Growl"
        }
      )
    ).toBeInTheDocument();
    expect(
      within(levelUpSection).getAllByRole(
        "link",
        {
          name: "Growl"
        }
      )
    ).toHaveLength(1);
    expect(levelUpSection).toHaveTextContent(
      "1Growl"
    );
    expect(levelUpSection).toHaveTextContent(
      "36Thunderbolt"
    );
    expect(
      screen.getByRole("heading", {
        name: "Machine"
      })
    ).toBeInTheDocument();
  });
});
