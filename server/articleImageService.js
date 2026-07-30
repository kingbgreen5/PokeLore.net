import fs from "node:fs/promises";
import path from "node:path";
import { assertSafeSlug } from "./articleFileService.js";

const maxUploadBytes = 8 * 1024 * 1024;
const allowedTypes = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"]
]);

export function sanitizeImageFilename(value) {
  const parsed = path.parse(String(value ?? "image"));
  const base = parsed.name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return base || "image";
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl).match(
    /^data:([^;]+);base64,(.+)$/s
  );

  if (!match) {
    throw Object.assign(
      new Error("Image upload must use a base64 data URL."),
      {
        statusCode: 400
      }
    );
  }

  const mimeType = match[1].toLowerCase();

  if (!allowedTypes.has(mimeType)) {
    throw Object.assign(
      new Error("Unsupported image type."),
      {
        statusCode: 400
      }
    );
  }

  const buffer = Buffer.from(match[2], "base64");

  if (buffer.byteLength > maxUploadBytes) {
    throw Object.assign(
      new Error("Image exceeds the 8 MB upload limit."),
      {
        statusCode: 413
      }
    );
  }

  return {
    buffer,
    mimeType
  };
}

function readPngDimensions(buffer) {
  if (
    buffer.toString("ascii", 1, 4) !== "PNG" ||
    buffer.byteLength < 24
  ) {
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function readGifDimensions(buffer) {
  if (
    !["GIF87a", "GIF89a"].includes(
      buffer.toString("ascii", 0, 6)
    ) ||
    buffer.byteLength < 10
  ) {
    return null;
  }

  return {
    width: buffer.readUInt16LE(6),
    height: buffer.readUInt16LE(8)
  };
}

function readJpegDimensions(buffer) {
  if (
    buffer[0] !== 0xff ||
    buffer[1] !== 0xd8
  ) {
    return null;
  }

  let offset = 2;

  while (offset < buffer.byteLength) {
    if (buffer[offset] !== 0xff) {
      break;
    }

    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);

    if (
      marker >= 0xc0 &&
      marker <= 0xc3 &&
      offset + 8 < buffer.byteLength
    ) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7)
      };
    }

    offset += 2 + length;
  }

  return null;
}

function readWebpDimensions(buffer) {
  if (
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WEBP"
  ) {
    return null;
  }

  const chunk = buffer.toString("ascii", 12, 16);

  if (chunk === "VP8X" && buffer.byteLength >= 30) {
    return {
      width:
        1 +
        buffer.readUIntLE(24, 3),
      height:
        1 +
        buffer.readUIntLE(27, 3)
    };
  }

  if (chunk === "VP8 " && buffer.byteLength >= 30) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff
    };
  }

  if (chunk === "VP8L" && buffer.byteLength >= 25) {
    const bits = buffer.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1
    };
  }

  return null;
}

function getDimensions(buffer, mimeType) {
  if (mimeType === "image/png") {
    return readPngDimensions(buffer);
  }

  if (mimeType === "image/jpeg") {
    return readJpegDimensions(buffer);
  }

  if (mimeType === "image/webp") {
    return readWebpDimensions(buffer);
  }

  if (mimeType === "image/gif") {
    return readGifDimensions(buffer);
  }

  return null;
}

async function getSharp() {
  try {
    const dynamicImport = new Function(
      "specifier",
      "return import(specifier)"
    );
    const sharp = await dynamicImport("sharp");
    return sharp.default ?? sharp;
  } catch {
    return null;
  }
}

export async function saveArticleImage(paths, {
  slug,
  filename,
  dataUrl
}) {
  assertSafeSlug(slug);

  const {
    buffer,
    mimeType
  } = parseDataUrl(dataUrl);
  const safeBase =
    sanitizeImageFilename(filename);
  const articleImageDir = path.join(
    paths.imageDir,
    slug
  );
  const relativeDir = path.relative(
    paths.imageDir,
    articleImageDir
  );

  if (
    relativeDir.startsWith("..") ||
    path.isAbsolute(relativeDir)
  ) {
    throw Object.assign(
      new Error("Image path escapes allowed directory."),
      {
        statusCode: 400
      }
    );
  }

  await fs.mkdir(articleImageDir, {
    recursive: true
  });

  const sharp = await getSharp();
  const targetExt = sharp ? ".webp" : allowedTypes.get(mimeType);
  const targetPath = path.join(
    articleImageDir,
    `${safeBase}${targetExt}`
  );
  const thumbnailPath = path.join(
    articleImageDir,
    `${safeBase}-400${targetExt}`
  );
  let outputBuffer = buffer;
  let dimensions = getDimensions(buffer, mimeType);
  let thumbnail = null;
  let optimized = false;

  if (sharp) {
    const image = sharp(buffer, {
      failOn: "none"
    }).rotate();
    const metadata = await image.metadata();
    const resizeWidth =
      metadata.width && metadata.width > 1600
        ? 1600
        : metadata.width;

    outputBuffer = await image
      .resize({
        width: resizeWidth,
        withoutEnlargement: true
      })
      .webp({
        quality: 82
      })
      .toBuffer();
    dimensions = await sharp(outputBuffer).metadata();

    const thumbnailBuffer = await sharp(buffer)
      .rotate()
      .resize({
        width: 400,
        withoutEnlargement: true
      })
      .webp({
        quality: 78
      })
      .toBuffer();

    await fs.writeFile(thumbnailPath, thumbnailBuffer);
    thumbnail = `/images/topics/${slug}/${safeBase}-400${targetExt}`;
    optimized = true;
  }

  await fs.writeFile(targetPath, outputBuffer);

  return {
    src: `/images/topics/${slug}/${safeBase}${targetExt}`,
    thumbnail,
    width: dimensions?.width ?? null,
    height: dimensions?.height ?? null,
    optimized,
    note: optimized
      ? "Converted to WebP at quality 82 and capped at 1600px wide."
      : "Saved original format. Install sharp to enable WebP conversion and thumbnails."
  };
}

export async function listArticleImages(paths, slug) {
  assertSafeSlug(slug);

  const articleImageDir = path.join(
    paths.imageDir,
    slug
  );

  try {
    const entries = await fs.readdir(articleImageDir, {
      withFileTypes: true
    });

    return entries
      .filter(entry => entry.isFile())
      .filter(entry =>
        /\.(png|jpe?g|webp|gif)$/i.test(entry.name)
      )
      .map(entry => ({
        src: `/images/topics/${slug}/${entry.name}`,
        filename: entry.name
      }))
      .sort((a, b) =>
        a.filename.localeCompare(b.filename)
      );
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

function escapeRegExp(value) {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

export function collectReferencedArticleImageFilenames(
  slug,
  value,
  filenames = new Set()
) {
  assertSafeSlug(slug);

  if (typeof value === "string") {
    const prefix = `/images/topics/${slug}/`;
    const pattern = new RegExp(
      `${escapeRegExp(prefix)}([^\\s"'?#)]+)`,
      "g"
    );
    let match;

    while ((match = pattern.exec(value))) {
      if (
        match[1] &&
        !match[1].includes("/") &&
        /\.(png|jpe?g|webp|gif)$/i.test(match[1])
      ) {
        filenames.add(match[1]);
      }
    }

    return filenames;
  }

  if (Array.isArray(value)) {
    value.forEach(entry =>
      collectReferencedArticleImageFilenames(
        slug,
        entry,
        filenames
      )
    );
    return filenames;
  }

  if (value && typeof value === "object") {
    Object.values(value).forEach(entry =>
      collectReferencedArticleImageFilenames(
        slug,
        entry,
        filenames
      )
    );
  }

  return filenames;
}

export async function cleanupUnusedArticleImages(paths, {
  slug,
  article
}) {
  assertSafeSlug(slug);

  if (
    article?.slug &&
    article.slug !== slug
  ) {
    throw Object.assign(
      new Error("Cleanup article slug must match the image folder slug."),
      {
        statusCode: 400
      }
    );
  }

  const articleImageDir = path.join(
    paths.imageDir,
    slug
  );
  const relativeDir = path.relative(
    paths.imageDir,
    articleImageDir
  );

  if (
    relativeDir.startsWith("..") ||
    path.isAbsolute(relativeDir)
  ) {
    throw Object.assign(
      new Error("Image path escapes allowed directory."),
      {
        statusCode: 400
      }
    );
  }

  const usedFilenames =
    collectReferencedArticleImageFilenames(
      slug,
      article ?? {}
    );
  const images = await listArticleImages(paths, slug);
  const deleted = [];
  const kept = [];

  for (const image of images) {
    if (usedFilenames.has(image.filename)) {
      kept.push(image);
      continue;
    }

    await fs.unlink(
      path.join(articleImageDir, image.filename)
    );
    deleted.push(image);
  }

  return {
    slug,
    deleted,
    kept,
    deletedCount: deleted.length,
    keptCount: kept.length
  };
}
