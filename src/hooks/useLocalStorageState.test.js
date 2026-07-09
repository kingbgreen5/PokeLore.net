import {
  act,
  renderHook
} from "@testing-library/react";
import {
  beforeEach,
  describe,
  expect,
  it
} from "vitest";
import useLocalStorageState
from "./useLocalStorageState";

describe("useLocalStorageState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists a preference across mounts", () => {
    const first = renderHook(() =>
      useLocalStorageState(
        "preferred-version",
        "all"
      )
    );

    act(() => {
      first.result.current[1](
        "scarlet-violet"
      );
    });

    expect(
      localStorage.getItem(
        "preferred-version"
      )
    ).toBe('"scarlet-violet"');

    first.unmount();

    const second = renderHook(() =>
      useLocalStorageState(
        "preferred-version",
        "all"
      )
    );

    expect(second.result.current[0])
      .toBe("scarlet-violet");
  });
});
