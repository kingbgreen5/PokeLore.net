import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "public", "data");
const pokemonDataDir = path.join(dataDir, "pokemonData");
const outputPath = path.join(
  dataDir,
  "pokemonSpriteBounds.json"
);
const ALPHA_THRESHOLD = 8;

function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);

  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function readChunk(buffer, offset) {
  const length = buffer.readUInt32BE(offset);
  const type = buffer
    .toString("ascii", offset + 4, offset + 8);
  const dataStart = offset + 8;
  const dataEnd = dataStart + length;

  return {
    length,
    type,
    data: buffer.subarray(dataStart, dataEnd),
    nextOffset: dataEnd + 4
  };
}

function bytesPerPixel(colorType) {
  switch (colorType) {
    case 0:
      return 1;
    case 2:
      return 3;
    case 3:
      return 1;
    case 4:
      return 2;
    case 6:
      return 4;
    default:
      throw new Error(
        `Unsupported PNG color type ${colorType}`
      );
  }
}

function alphaAt({
  row,
  x,
  colorType,
  transparentColor,
  paletteAlpha
}) {
  switch (colorType) {
    case 0: {
      const gray = row[x];
      return transparentColor?.gray === gray
        ? 0
        : 255;
    }
    case 2: {
      const index = x * 3;
      const red = row[index];
      const green = row[index + 1];
      const blue = row[index + 2];

      return transparentColor?.red === red &&
        transparentColor?.green === green &&
        transparentColor?.blue === blue
        ? 0
        : 255;
    }
    case 3:
      return paletteAlpha?.[row[x]] ?? 255;
    case 4:
      return row[x * 2 + 1];
    case 6:
      return row[x * 4 + 3];
    default:
      return 255;
  }
}

function parseTransparentColor(data, colorType) {
  if (colorType === 0 && data.length >= 2) {
    return {
      gray: data.readUInt16BE(0) >> 8
    };
  }

  if (colorType === 2 && data.length >= 6) {
    return {
      red: data.readUInt16BE(0) >> 8,
      green: data.readUInt16BE(2) >> 8,
      blue: data.readUInt16BE(4) >> 8
    };
  }

  return null;
}

function parsePngBounds(buffer) {
  const signature = buffer.subarray(0, 8);
  const expectedSignature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47,
    0x0d, 0x0a, 0x1a, 0x0a
  ]);

  if (!signature.equals(expectedSignature)) {
    throw new Error("Not a PNG file");
  }

  let offset = 8;
  let width = null;
  let height = null;
  let bitDepth = null;
  let colorType = null;
  let transparentColor = null;
  let paletteAlpha = null;
  const idatChunks = [];

  while (offset < buffer.length) {
    const chunk = readChunk(buffer, offset);

    if (chunk.type === "IHDR") {
      width = chunk.data.readUInt32BE(0);
      height = chunk.data.readUInt32BE(4);
      bitDepth = chunk.data[8];
      colorType = chunk.data[9];
    }

    if (chunk.type === "tRNS") {
      if (colorType === 3) {
        paletteAlpha = chunk.data;
      } else {
        transparentColor = parseTransparentColor(
          chunk.data,
          colorType
        );
      }
    }

    if (chunk.type === "IDAT") {
      idatChunks.push(chunk.data);
    }

    if (chunk.type === "IEND") break;

    offset = chunk.nextOffset;
  }

  if (
    !width ||
    !height ||
    bitDepth !== 8 ||
    colorType === null
  ) {
    throw new Error(
      "Unsupported or malformed PNG metadata"
    );
  }

  const pixelBytes = bytesPerPixel(colorType);
  const scanlineLength = width * pixelBytes;
  const inflated = zlib.inflateSync(
    Buffer.concat(idatChunks)
  );
  let readOffset = 0;
  const rows = [];

  for (let y = 0; y < height; y += 1) {
    const filterType = inflated[readOffset];
    readOffset += 1;
    const sourceRow = inflated.subarray(
      readOffset,
      readOffset + scanlineLength
    );
    readOffset += scanlineLength;
    const row = Buffer.alloc(scanlineLength);
    const previousRow =
      rows[y - 1] ?? Buffer.alloc(scanlineLength);

    for (
      let index = 0;
      index < scanlineLength;
      index += 1
    ) {
      const left =
        index >= pixelBytes
          ? row[index - pixelBytes]
          : 0;
      const up = previousRow[index] ?? 0;
      const upLeft =
        index >= pixelBytes
          ? previousRow[index - pixelBytes]
          : 0;

      switch (filterType) {
        case 0:
          row[index] = sourceRow[index];
          break;
        case 1:
          row[index] =
            (sourceRow[index] + left) & 0xff;
          break;
        case 2:
          row[index] =
            (sourceRow[index] + up) & 0xff;
          break;
        case 3:
          row[index] =
            (sourceRow[index] +
              Math.floor((left + up) / 2)) &
            0xff;
          break;
        case 4:
          row[index] =
            (sourceRow[index] +
              paethPredictor(left, up, upLeft)) &
            0xff;
          break;
        default:
          throw new Error(
            `Unsupported PNG filter ${filterType}`
          );
      }
    }

    rows.push(row);
  }

  let top = height;
  let bottom = -1;
  let left = width;
  let right = -1;

  rows.forEach((row, y) => {
    for (let x = 0; x < width; x += 1) {
      const alpha = alphaAt({
        row,
        x,
        colorType,
        transparentColor,
        paletteAlpha
      });

      if (alpha <= ALPHA_THRESHOLD) continue;

      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
      left = Math.min(left, x);
      right = Math.max(right, x);
    }
  });

  if (bottom === -1) {
    return {
      width,
      height,
      visibleBounds: null
    };
  }

  return {
    width,
    height,
    visibleBounds: {
      top,
      bottom,
      left,
      right,
      width: right - left + 1,
      height: bottom - top + 1
    },
    transparentPadding: {
      top,
      bottom: height - bottom - 1,
      left,
      right: width - right - 1
    }
  };
}

async function readPokemonDataFiles() {
  const files = (
    await fs.readdir(pokemonDataDir)
  ).filter(file => file.endsWith(".json"));

  return Promise.all(
    files.map(async file => {
      const pokemon = JSON.parse(
        await fs.readFile(
          path.join(pokemonDataDir, file),
          "utf8"
        )
      );

      return {
        id: pokemon.id,
        name: pokemon.name,
        sprite: pokemon.sprite
      };
    })
  );
}

async function fetchImage(spriteUrl) {
  const response = await fetch(spriteUrl);

  if (!response.ok) {
    throw new Error(
      `Sprite fetch failed: ${response.status}`
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const pokemonList = await readPokemonDataFiles();
  const sprites = {};
  const failures = [];
  const cache = new Map();

  for (const pokemon of pokemonList) {
    if (!pokemon.sprite) {
      failures.push({
        id: pokemon.id,
        name: pokemon.name,
        reason: "missing-sprite"
      });
      continue;
    }

    try {
      if (!cache.has(pokemon.sprite)) {
        const buffer = await fetchImage(
          pokemon.sprite
        );
        cache.set(
          pokemon.sprite,
          parsePngBounds(buffer)
        );
      }

      sprites[pokemon.id] = {
        id: pokemon.id,
        name: pokemon.name,
        sprite: pokemon.sprite,
        ...cache.get(pokemon.sprite)
      };
    } catch (error) {
      failures.push({
        id: pokemon.id,
        name: pokemon.name,
        sprite: pokemon.sprite,
        reason: error.message
      });
    }
  }

  await fs.writeFile(
    outputPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        alphaThreshold: ALPHA_THRESHOLD,
        source: "public/data/pokemonData",
        totalPokemon: pokemonList.length,
        processed: Object.keys(sprites).length,
        failed: failures.length,
        sprites,
        failures
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(
    `Generated sprite bounds for ${Object.keys(sprites).length}/${pokemonList.length} Pokemon.`
  );
  console.log(`Failures: ${failures.length}`);
  console.log(`Output: ${outputPath}`);
}

main().catch(error => {
  console.error(
    "Failed to generate Pokemon sprite bounds:",
    error
  );
  process.exitCode = 1;
});
