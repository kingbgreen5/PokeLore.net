import {
  ARTICLE_BLOCK_TYPES,
  ARTICLE_CONTENT_TYPE,
  ARTICLE_IMAGE_DISPLAY_SIZES,
  isSafeSlug,
  slugify
} from "./articleSchema";

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime());
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(
      url.protocol
    );
  } catch {
    return false;
  }
}

function isValidAnchor(value) {
  return isSafeSlug(value);
}

function hasPathTraversal(value) {
  return /(^|[\\/])\.\.([\\/]|$)/.test(
    String(value ?? "")
  );
}

function hasValidDisplaySize(value) {
  return (
    !value ||
    ARTICLE_IMAGE_DISPLAY_SIZES.includes(value)
  );
}

function hasValidCardSize(value) {
  return (
    !value ||
    ["compact", "full", "subcompact"].includes(value)
  );
}

export function validateArticle(article) {
  const errors = [];
  const warnings = [];
  const blockIds = new Set();
  const anchors = new Map();

  if (!article || typeof article !== "object") {
    return {
      errors: ["Article data is missing."],
      warnings: []
    };
  }

  if (article.contentType !== ARTICLE_CONTENT_TYPE) {
    errors.push("Content type must be article.");
  }

  if (!String(article.title ?? "").trim()) {
    errors.push("Title is required.");
  }

  if (!String(article.slug ?? "").trim()) {
    errors.push("Slug is required.");
  } else if (!isSafeSlug(article.slug)) {
    errors.push(
      "Slug must use lowercase letters, numbers, and hyphens only."
    );
  }

  if (
    article.slug &&
    slugify(article.slug) !== article.slug
  ) {
    errors.push("Slug is not URL-safe.");
  }

  if (!String(article.excerpt ?? "").trim()) {
    errors.push("Excerpt is required.");
  }

  if (!isValidDate(article.publishedDate)) {
    errors.push("Published date must be YYYY-MM-DD.");
  }

  if (!isValidDate(article.updatedDate)) {
    errors.push("Updated date must be YYYY-MM-DD.");
  }

  if (
    article.hero?.src &&
    hasPathTraversal(article.hero.src)
  ) {
    errors.push("Hero image path is unsafe.");
  }

  if (
    article.hero?.src &&
    !String(article.hero?.alt ?? "").trim()
  ) {
    errors.push("Hero image requires alt text.");
  }

  if (
    article.hero?.src &&
    (!Number.isFinite(Number(article.hero.width)) ||
      !Number.isFinite(Number(article.hero.height)))
  ) {
    warnings.push(
      "Hero image should include width and height to prevent layout shift."
    );
  }

  if (
    article.hero?.displaySize &&
    !hasValidDisplaySize(article.hero.displaySize)
  ) {
    errors.push("Hero image display size is invalid.");
  }

  if (!Array.isArray(article.relatedPokemon)) {
    errors.push("Related Pokemon must be an array.");
  } else {
    article.relatedPokemon.forEach(value => {
      if (
        !Number.isInteger(Number(value)) ||
        Number(value) <= 0
      ) {
        errors.push(
          "Related Pokemon values must be positive numeric IDs."
        );
      }
    });
  }

  if (
    !Array.isArray(article.sections) ||
    article.sections.length === 0
  ) {
    errors.push(
      "Article must have at least one content block."
    );
  } else {
    article.sections.forEach((block, index) => {
      const label = `Block ${index + 1}`;

      if (!block?.id) {
        errors.push(`${label} needs a stable ID.`);
      } else if (blockIds.has(block.id)) {
        errors.push(
          `${label} duplicates block ID ${block.id}.`
        );
      } else {
        blockIds.add(block.id);
      }

      if (
        !ARTICLE_BLOCK_TYPES.includes(block?.type)
      ) {
        warnings.push(
          `${label} has unknown type "${block?.type}".`
        );
        return;
      }

      if (block.type === "heading") {
        if (Number(block.level) === 2) {
          if (!block.anchor) {
            warnings.push(
              `${label} level-two heading should have an anchor.`
            );
          } else if (!isValidAnchor(block.anchor)) {
            errors.push(
              `${label} heading anchor must be URL-safe.`
            );
          } else if (anchors.has(block.anchor)) {
            errors.push(
              `${label} duplicates heading anchor "${block.anchor}".`
            );
          } else {
            anchors.set(block.anchor, block.id);
          }
        }
      }

      if (
        block.type === "image" &&
        block.src &&
        hasPathTraversal(block.src)
      ) {
        errors.push(`${label} image path is unsafe.`);
      }

      if (
        block.type === "image" &&
        block.src &&
        !block.decorative &&
        !String(block.alt ?? "").trim()
      ) {
        errors.push(
          `${label} image requires alt text or decorative=true.`
        );
      }

      if (
        block.type === "image" &&
        block.displaySize &&
        !hasValidDisplaySize(block.displaySize)
      ) {
        errors.push(
          `${label} image display size is invalid.`
        );
      }

      if (block.type === "image-grid") {
        (block.images ?? []).forEach((image, imageIndex) => {
          if (
            image?.src &&
            hasPathTraversal(image.src)
          ) {
            errors.push(
              `${label} image ${imageIndex + 1} path is unsafe.`
            );
          }

          if (
            image?.src &&
            !image.decorative &&
            !String(image.alt ?? "").trim()
          ) {
            errors.push(
              `${label} image ${imageIndex + 1} requires alt text or decorative=true.`
            );
          }

          if (
            image?.displaySize &&
            !hasValidDisplaySize(image.displaySize)
          ) {
            errors.push(
              `${label} image ${imageIndex + 1} display size is invalid.`
            );
          }
        });
      }

      if (block.type === "pokemon-card-grid") {
        if (!Array.isArray(block.pokemonIds)) {
          errors.push(
            `${label} Pokemon card grid must use a Pokemon IDs array.`
          );
        } else {
          block.pokemonIds.forEach(value => {
            if (
              !Number.isInteger(Number(value)) ||
              Number(value) <= 0
            ) {
              errors.push(
                `${label} Pokemon card grid IDs must be positive numbers.`
              );
            }
          });
        }

        if (!hasValidCardSize(block.cardSize)) {
          errors.push(
            `${label} Pokemon card grid size is invalid.`
          );
        }
      }
    });
  }

  if (!Array.isArray(article.sources)) {
    errors.push("Sources must be an array.");
  } else {
    article.sources.forEach((source, index) => {
      if (source.url && !isValidUrl(source.url)) {
        errors.push(
          `Source ${index + 1} URL must be a valid http or https URL.`
        );
      }

      if (
        source.accessedDate &&
        !isValidDate(source.accessedDate)
      ) {
        warnings.push(
          `Source ${index + 1} accessed date should be YYYY-MM-DD.`
        );
      }
    });
  }

  return {
    errors,
    warnings
  };
}

export function assertValidArticle(article) {
  const result = validateArticle(article);

  if (result.errors.length > 0) {
    const error = new Error(
      result.errors.join(" ")
    );
    error.validation = result;
    throw error;
  }

  return result;
}

export { hasPathTraversal };
