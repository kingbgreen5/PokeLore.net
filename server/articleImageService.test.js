import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  writeFile
} from "node:fs/promises";
import {
  join
} from "node:path";
import {
  tmpdir
} from "node:os";
import {
  describe,
  expect,
  it
} from "vitest";
import {
  cleanupUnusedArticleImages,
  collectReferencedArticleImageFilenames,
  sanitizeImageFilename
} from "./articleImageService";

describe("article image service", () => {
  it("sanitizes image filenames", () => {
    expect(
      sanitizeImageFilename("../Hero Image!!.PNG")
    ).toBe("hero-image");
    expect(sanitizeImageFilename("")).toBe("image");
  });

  it("collects referenced article image filenames", () => {
    const filenames =
      collectReferencedArticleImageFilenames(
        "feebas-guide",
        {
          hero: {
            src: "/images/topics/feebas-guide/hero.webp",
            thumbnail:
              "/images/topics/feebas-guide/hero-400.webp"
          },
          sections: [
            {
              text: "See /images/topics/feebas-guide/inline.png"
            },
            {
              src: "/images/topics/other-guide/wrong.webp"
            }
          ]
        }
      );

    expect([...filenames].sort()).toEqual([
      "hero-400.webp",
      "hero.webp",
      "inline.png"
    ]);
  });

  it("deletes unused image files for an article", async () => {
    const root = await mkdtemp(
      join(tmpdir(), "article-images-")
    );
    const imageDir = join(
      root,
      "public",
      "images",
      "topics"
    );
    const articleDir = join(imageDir, "feebas-guide");

    await mkdir(articleDir, {
      recursive: true
    });
    await writeFile(
      join(articleDir, "hero.webp"),
      "used"
    );
    await writeFile(
      join(articleDir, "old.webp"),
      "unused"
    );

    const result = await cleanupUnusedArticleImages(
      {
        imageDir
      },
      {
        slug: "feebas-guide",
        article: {
          slug: "feebas-guide",
          hero: {
            src: "/images/topics/feebas-guide/hero.webp"
          }
        }
      }
    );

    expect(result.deleted.map(image => image.filename)).toEqual([
      "old.webp"
    ]);
    expect(await readdir(articleDir)).toEqual([
      "hero.webp"
    ]);
    expect(
      await readFile(join(articleDir, "hero.webp"), "utf8")
    ).toBe("used");
  });
});
