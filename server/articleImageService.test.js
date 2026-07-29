import {
  describe,
  expect,
  it
} from "vitest";
import { sanitizeImageFilename } from "./articleImageService";

describe("article image service", () => {
  it("sanitizes image filenames", () => {
    expect(
      sanitizeImageFilename("../Hero Image!!.PNG")
    ).toBe("hero-image");
    expect(sanitizeImageFilename("")).toBe("image");
  });
});
