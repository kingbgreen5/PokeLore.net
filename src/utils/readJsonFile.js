export async function readJsonFile(
  url,
  {
    required = false,
    warn = false
  } = {}
) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (required) {
        throw new Error(
          `Failed to fetch ${url}: ${response.status}`
        );
      }

      return null;
    }

    const text = await response.text();
    const trimmed = text.trim();

    if (
      !trimmed.startsWith("{") &&
      !trimmed.startsWith("[")
    ) {
      if (required) {
        throw new Error(
          `Expected JSON from ${url}`
        );
      }

      if (warn) {
        console.warn(
          `Skipping non-JSON response for ${url}`
        );
      }

      return null;
    }

    return JSON.parse(text);
  } catch (error) {
    if (required) {
      throw error;
    }

    if (warn) {
      console.warn(
        `Failed to read JSON from ${url}:`,
        error
      );
    }

    return null;
  }
}
