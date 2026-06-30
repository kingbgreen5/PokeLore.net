import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from "vitest";
import { readJsonFile } from "./readJsonFile";

function mockResponse({
  ok = true,
  status = 200,
  text
}) {
  return {
    ok,
    status,
    text: vi.fn().mockResolvedValue(text)
  };
}

describe("readJsonFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses valid JSON responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockResponse({
          text: "{\"name\":\"poke-ball\"}"
        })
      )
    );

    await expect(
      readJsonFile("/data/items/poke-ball.json")
    ).resolves.toEqual({
      name: "poke-ball"
    });
  });

  it("returns null for optional HTML fallback responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockResponse({
          text: "<!doctype html><div id=\"root\"></div>"
        })
      )
    );

    await expect(
      readJsonFile(
        "/data/itemLocationsCurated/poke-ball.json"
      )
    ).resolves.toBeNull();
  });

  it("throws for required HTML fallback responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockResponse({
          text: "<!doctype html><div id=\"root\"></div>"
        })
      )
    );

    await expect(
      readJsonFile(
        "/data/items/poke-ball.json",
        {
          required: true
        }
      )
    ).rejects.toThrow(
      "Expected JSON"
    );
  });
});
