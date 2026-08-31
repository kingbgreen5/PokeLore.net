import {
  describe,
  expect,
  it
} from "vitest";
import {
  ALL_ENCOUNTER_VERSIONS,
  filterEncounterLocationsByVersion,
  formatEncounterConditions,
  formatEncounterLevelRange,
  formatEncounterMethodName,
  formatEncounterSummary,
  formatEncounterVersionName,
  getEncounterLevelRange,
  getEncounterVersions,
  getGroupedEncounterVersions,
  getLocationEncounterSummary,
  getMaximumEncounterChance,
  getSelectedEncounterVersion,
  getUniqueEncounterRecords
} from "./encounterDisplay";

const sampleEncounterData = {
  locations: [
    {
      location: {
        name: "kanto-route-2",
        displayName: "Route 2",
        region: "kanto"
      },
      areas: [
        {
          name: "kanto-route-2-area",
          displayName: "Route 2",
          versions: [
            {
              version: "red",
              maxChance: 25,
              encounters: [
                {
                  method: "walk",
                  minLevel: 3,
                  maxLevel: 7,
                  chance: 20,
                  conditions: []
                },
                {
                  method: "walk",
                  minLevel: 5,
                  maxLevel: 5,
                  chance: 5,
                  conditions: []
                },
                {
                  method: "old-rod",
                  minLevel: null,
                  maxLevel: null,
                  chance: 10,
                  conditions: [
                    "time-morning"
                  ]
                }
              ]
            },
            {
              version: "blue",
              maxChance: 30,
              encounters: [
                {
                  method: "surf",
                  minLevel: 20,
                  maxLevel: 25,
                  chance: 30,
                  conditions: []
                },
                {
                  method: "surf",
                  minLevel: 20,
                  maxLevel: 25,
                  chance: 30,
                  conditions: []
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

describe("encounterDisplay", () => {
  it("extracts sorted encounter versions with All Versions first", () => {
    expect(
      getEncounterVersions(
        sampleEncounterData
      )
    ).toEqual([
      ALL_ENCOUNTER_VERSIONS,
      "red",
      "blue"
    ]);
  });

  it("falls back to All Versions for unavailable preferences", () => {
    expect(
      getSelectedEncounterVersion(
        sampleEncounterData,
        "emerald"
      )
    ).toBe(ALL_ENCOUNTER_VERSIONS);
  });

  it("filters locations by selected version without changing location structure", () => {
    const [location] =
      filterEncounterLocationsByVersion(
        sampleEncounterData,
        "red"
      );

    expect(
      location.location.name
    ).toBe("kanto-route-2");
    expect(
      location.areas[0].versions
    ).toHaveLength(1);
    expect(
      location.areas[0].versions[0].version
    ).toBe("red");
  });

  it("deduplicates methods and derives level range plus max chance for one version", () => {
    const [location] =
      filterEncounterLocationsByVersion(
        sampleEncounterData,
        "red"
      );
    const summary =
      getLocationEncounterSummary(
        location,
        "red"
      );

    expect(summary.methods).toEqual([
      "walk",
      "old-rod"
    ]);
    expect(summary.levelRange).toEqual({
      minLevel: 3,
      maxLevel: 7
    });
    expect(summary.maxChance).toBe(25);
    expect(
      formatEncounterSummary(summary)
    ).toBe(
      "Walking, Old Rod · Lv. 3–7 · up to 25%"
    );
  });

  it("omits misleading level and chance aggregates in All Versions mode", () => {
    const [location] =
      filterEncounterLocationsByVersion(
        sampleEncounterData,
        "all"
      );

    expect(
      formatEncounterSummary(
        getLocationEncounterSummary(
          location,
          "all"
        )
      )
    ).toBe(
      "Walking, Old Rod, Surf · version details vary"
    );
  });

  it("omits missing level data from summary ranges", () => {
    const version =
      sampleEncounterData.locations[0]
        .areas[0].versions[0];

    expect(
      formatEncounterLevelRange(
        version.encounters[2]
      )
    ).toBe("-");
    expect(
      getEncounterLevelRange({
        encounters: [
          version.encounters[2]
        ]
      })
    ).toBeNull();
  });

  it("uses version maxChance before raw encounter chances", () => {
    const version =
      sampleEncounterData.locations[0]
        .areas[0].versions[0];

    expect(
      getMaximumEncounterChance(version)
    ).toBe(25);
  });

  it("formats method, version, and condition labels", () => {
    expect(
      formatEncounterMethodName(
        "sos-encounter"
      )
    ).toBe("SOS Encounter");
    expect(
      formatEncounterVersionName(
        "heartgold"
      )
    ).toBe("HeartGold");
    expect(
      formatEncounterConditions([
        "time-morning",
        "friend-safari-slot-2"
      ])
    ).toBe(
      "Time Morning, Friend Safari Slot 2"
    );
  });

  it("groups identical version records for compact prerender output", () => {
    const blueVersion =
      sampleEncounterData.locations[0]
        .areas[0].versions[1];
    const groups =
      getGroupedEncounterVersions({
        versions: [
          blueVersion,
          {
            ...blueVersion,
            version: "green-japan"
          }
        ]
      });

    expect(groups).toHaveLength(1);
    expect(groups[0].versions).toEqual([
      "green-japan",
      "blue"
    ]);
    expect(
      getUniqueEncounterRecords(groups[0])
    ).toHaveLength(1);
  });
});
