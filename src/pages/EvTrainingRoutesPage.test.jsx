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
  screen
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EvTrainingRoutesPage from "./EvTrainingRoutesPage";

vi.mock("../utils/readJsonFile", () => ({
  readJsonFile: vi.fn(() =>
    Promise.resolve(testEvTrainingData)
  )
}));

const testEvTrainingData = {
  stats: [
    {
      key: "hp",
      label: "HP"
    }
  ],
  versions: [
    {
      version: "platinum",
      displayName: "Platinum"
    }
  ],
  routesByVersion: {
    platinum: {
      hp: [
        {
          rank: 1,
          locationName: "route-205",
          locationDisplayName: "Route 205",
          regionDisplayName: "Sinnoh",
          areaName:
            "road-205-south-towards-floaroma-town",
          areaDisplayName:
            "Road 205 (south, towards Floaroma Town)",
          method: "surf",
          conditions: [],
          encounterRate: 30,
          targetChance: 100,
          cleanTargetChance: 100,
          expectedEvPerEncounter: 1,
          pokemon: [
            {
              id: 422,
              name: "shellos",
              displayName: "Shellos",
              sprite: "",
              evYieldBreakdown: [
                {
                  stat: "hp",
                  label: "HP",
                  value: 1
                }
              ],
              chance: 60,
              minLevel: 20,
              maxLevel: 30
            },
            {
              id: 423,
              name: "gastrodon",
              displayName: "Gastrodon",
              sprite: "",
              evYieldBreakdown: [
                {
                  stat: "hp",
                  label: "HP",
                  value: 2
                }
              ],
              chance: 40,
              minLevel: 20,
              maxLevel: 30
            }
          ]
        }
      ]
    }
  }
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderEvTrainingRoutesPage() {
  return render(
    <MemoryRouter initialEntries={["/ev-training-routes"]}>
      <EvTrainingRoutesPage
        initialData={testEvTrainingData}
        initialLinkTargets={[]}
      />
    </MemoryRouter>
  );
}

describe("EvTrainingRoutesPage", () => {
  it("uses canonical name-based Pokemon links in encounter rows", () => {
    const { container } =
      renderEvTrainingRoutesPage();

    expect(
      screen.getByText("Shellos").closest("a")
    ).toHaveAttribute(
      "href",
      "/pokemon/shellos"
    );
    expect(
      screen.getByText("Gastrodon").closest("a")
    ).toHaveAttribute(
      "href",
      "/pokemon/gastrodon"
    );
    expect(
      container.querySelector(
        'a[href="/pokemon/422"]'
      )
    ).not.toBeInTheDocument();
    expect(
      container.querySelector(
        'a[href="/pokemon/423"]'
      )
    ).not.toBeInTheDocument();
  });
});
