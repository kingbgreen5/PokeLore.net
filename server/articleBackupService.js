import fs from "node:fs/promises";
import path from "node:path";

function timestamp() {
  return new Date()
    .toISOString()
    .replace(/:/g, "-")
    .replace(/\.\d{3}Z$/, "Z");
}

export async function backupFile({
  sourcePath,
  backupRoot,
  group,
  slug,
  fallbackName = "backup.json"
}) {
  try {
    const text = await fs.readFile(sourcePath, "utf8");
    const backupDir = path.join(
      backupRoot,
      group,
      slug ?? "_shared"
    );
    const fileName =
      slug === "_topic-index"
        ? `${timestamp()}-${fallbackName}`
        : `${timestamp()}.json`;
    const backupPath = path.join(backupDir, fileName);

    await fs.mkdir(backupDir, {
      recursive: true
    });
    await fs.writeFile(backupPath, text, "utf8");

    return backupPath;
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}
