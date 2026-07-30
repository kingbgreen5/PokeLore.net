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
import EvolutionNode, {
  FormEvolutionPaths
} from "./EvolutionNode";

afterEach(() => {
  cleanup();
});

const meowthRoot = {
  pokemon: {
    id: 52,
    name: "meowth",
    sprite: "meowth.png",
    types: ["normal"]
  },
  varieties: [
    {
      id: 52,
      name: "meowth",
      isDefault: true,
      sprite: "meowth.png",
      types: ["normal"]
    },
    {
      id: 10107,
      name: "meowth-alola",
      isDefault: false,
      sprite: "meowth-alola.png",
      types: ["dark"]
    },
    {
      id: 10161,
      name: "meowth-galar",
      isDefault: false,
      sprite: "meowth-galar.png",
      types: ["steel"]
    }
  ],
  evolvesTo: [
    {
      pokemon: {
        id: 53,
        name: "persian",
        sprite: "persian.png",
        types: ["normal"]
      },
      varieties: [
        {
          id: 53,
          name: "persian",
          isDefault: true,
          sprite: "persian.png",
          types: ["normal"]
        },
        {
          id: 10108,
          name: "persian-alola",
          isDefault: false,
          sprite: "persian-alola.png",
          types: ["dark"]
        }
      ],
      evolvesTo: []
    },
    {
      pokemon: {
        id: 863,
        name: "perrserker",
        sprite: "perrserker.png",
        types: ["steel"]
      },
      varieties: [
        {
          id: 863,
          name: "perrserker",
          isDefault: true,
          sprite: "perrserker.png",
          types: ["steel"]
        }
      ],
      evolvesTo: []
    }
  ]
};

const formEvolutionPaths = [
  {
    basePokemon: "meowth",
    evolvesTo: "persian",
    displayCondition: "Level up at level 28",
    accessibleLabel: "Meowth evolves into Persian at level 28."
  },
  {
    basePokemon: "meowth-alola",
    evolvesTo: "persian-alola",
    displayCondition: "Level up with high friendship",
    accessibleLabel: "Alolan Meowth evolves into Alolan Persian by leveling up with high friendship.",
    versionException: {
      note: "In Pokemon: Let's Go, Pikachu! and Let's Go, Eevee!, Alolan Meowth evolves at level 28."
    }
  },
  {
    basePokemon: "meowth-galar",
    evolvesTo: "perrserker",
    displayCondition: "Level up at level 28",
    accessibleLabel: "Galarian Meowth evolves into Perrserker at level 28."
  }
];

const charmanderRoot = {
  pokemon: {
    id: 4,
    name: "charmander",
    sprite: "charmander.png",
    types: ["fire"]
  },
  varieties: [
    {
      id: 4,
      name: "charmander",
      isDefault: true,
      sprite: "charmander.png",
      types: ["fire"]
    }
  ],
  evolvesTo: [
    {
      pokemon: {
        id: 5,
        name: "charmeleon",
        sprite: "charmeleon.png",
        types: ["fire"]
      },
      varieties: [
        {
          id: 5,
          name: "charmeleon",
          isDefault: true,
          sprite: "charmeleon.png",
          types: ["fire"]
        }
      ],
      trigger: "level-up",
      minLevel: 16,
      evolvesTo: [
        {
          pokemon: {
            id: 6,
            name: "charizard",
            sprite: "charizard.png",
            types: [
              "fire",
              "flying"
            ]
          },
          varieties: [
            {
              id: 6,
              name: "charizard",
              isDefault: true,
              sprite: "charizard.png",
              types: [
                "fire",
                "flying"
              ]
            },
            {
              id: 10034,
              name: "charizard-mega-x",
              isDefault: false,
              sprite: "charizard-mega-x.png",
              types: [
                "fire",
                "dragon"
              ]
            },
            {
              id: 10035,
              name: "charizard-mega-y",
              isDefault: false,
              sprite: "charizard-mega-y.png",
              types: [
                "fire",
                "flying"
              ]
            }
          ],
          trigger: "level-up",
          minLevel: 36,
          evolvesTo: []
        }
      ]
    }
  ]
};

function renderFormEvolutionPaths(
  currentPokemonName
) {
  return render(
    <MemoryRouter>
      <FormEvolutionPaths
        root={meowthRoot}
        paths={formEvolutionPaths}
        currentPokemonName={
          currentPokemonName
        }
      />
    </MemoryRouter>
  );
}

describe("FormEvolutionPaths", () => {
  it("renders Meowth regional form evolutions as separate paths", () => {
    renderFormEvolutionPaths();

    const kantoPath =
      screen.getByLabelText(
        "Meowth evolves into Persian at level 28."
      );
    const alolaPath =
      screen.getByLabelText(
        "Alolan Meowth evolves into Alolan Persian by leveling up with high friendship."
      );
    const galarPath =
      screen.getByLabelText(
        "Galarian Meowth evolves into Perrserker at level 28."
      );

    expect(
      within(kantoPath).getByRole(
        "link",
        { name: /Meowth/i }
      )
    ).toHaveAttribute(
      "href",
      "/pokemon/meowth"
    );
    expect(
      within(kantoPath).getByRole(
        "link",
        { name: /Persian/i }
      )
    ).toHaveAttribute(
      "href",
      "/pokemon/persian"
    );
    expect(
      within(kantoPath).queryByText(
        "Perrserker"
      )
    ).not.toBeInTheDocument();

    expect(
      within(alolaPath).getByRole(
        "link",
        { name: /Alolan Meowth/i }
      )
    ).toHaveAttribute(
      "href",
      "/pokemon/meowth-alola"
    );
    expect(
      within(alolaPath).getByRole(
        "link",
        { name: /Alolan Persian/i }
      )
    ).toHaveAttribute(
      "href",
      "/pokemon/persian-alola"
    );
    expect(alolaPath).toHaveTextContent(
      "Level up with high friendship"
    );
    expect(alolaPath).toHaveTextContent(
      "Alolan Meowth evolves at level 28"
    );

    expect(
      within(galarPath).getByRole(
        "link",
        { name: /Galarian Meowth/i }
      )
    ).toHaveAttribute(
      "href",
      "/pokemon/meowth-galar"
    );
    expect(
      within(galarPath).getByRole(
        "link",
        { name: /Perrserker/i }
      )
    ).toHaveAttribute(
      "href",
      "/pokemon/perrserker"
    );
  });

  it("filters to Kanto Meowth's Kanto Persian path", () => {
    renderFormEvolutionPaths("meowth");

    expect(
      screen.getByLabelText(
        "Meowth evolves into Persian at level 28."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(
        "Alolan Meowth evolves into Alolan Persian by leveling up with high friendship."
      )
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(
        "Galarian Meowth evolves into Perrserker at level 28."
      )
    ).not.toBeInTheDocument();
  });

  it("filters to Alolan Meowth's Alolan Persian path", () => {
    renderFormEvolutionPaths(
      "meowth-alola"
    );

    expect(
      screen.getByLabelText(
        "Alolan Meowth evolves into Alolan Persian by leveling up with high friendship."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(
        "Meowth evolves into Persian at level 28."
      )
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(
        "Galarian Meowth evolves into Perrserker at level 28."
      )
    ).not.toBeInTheDocument();
  });
});

describe("EvolutionNode", () => {
  it("does not replace a species evolution node with the current mega form", () => {
    render(
      <MemoryRouter>
        <EvolutionNode
          node={charmanderRoot}
          currentPokemonName="charizard-mega-y"
          evolutionMethodOverrides={{}}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("link", {
        name: /Charizard/i
      })
    ).toHaveAttribute(
      "href",
      "/pokemon/charizard"
    );
    expect(
      screen.queryByText(
        "Mega Charizard Y"
      )
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("img", {
        name: "Mega Charizard Y"
      })
    ).not.toBeInTheDocument();
  });
});
