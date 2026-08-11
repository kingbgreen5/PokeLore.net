import {
  ARTICLE_BLOCK_TYPES,
  ARTICLE_CONTENT_TYPES,
  ARTICLE_IMAGE_DISPLAY_SIZES,
  DEFAULT_NEWS_LABEL,
  getYouTubeVideoId,
  getArticleContentType,
  isSafeSlug,
  NEWS_CONTENT_TYPE,
  NEWS_LABELS,
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

function isValidIsoDateTime(value) {
  const text = String(value ?? "");

  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      text
    )
  ) {
    return false;
  }

  return !Number.isNaN(new Date(text).getTime());
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

  const contentType = getArticleContentType(article);
  const isNews = contentType === NEWS_CONTENT_TYPE;

  if (
    article.contentType &&
    !ARTICLE_CONTENT_TYPES.includes(article.contentType)
  ) {
    errors.push(
      "Content type must be article or news."
    );
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

  if (isNews) {
    const active = article.active !== false;
    const hasPublishedAt = String(
      article.publishedAt ?? ""
    ).trim();
    const hasUpdatedAt = String(
      article.updatedAt ?? ""
    ).trim();

    if (
      !NEWS_LABELS.includes(
        article.newsLabel || DEFAULT_NEWS_LABEL
      )
    ) {
      errors.push("News label is invalid.");
    }

    if (active && !hasPublishedAt) {
      errors.push(
        "Active News articles require publishedAt."
      );
    }

    if (hasPublishedAt && !isValidIsoDateTime(article.publishedAt)) {
      errors.push(
        "Published At must be a full ISO-8601 date/time with timezone."
      );
    }

    if (hasUpdatedAt && !isValidIsoDateTime(article.updatedAt)) {
      errors.push(
        "Updated At must be a full ISO-8601 date/time with timezone."
      );
    }

    if (
      hasPublishedAt &&
      hasUpdatedAt &&
      isValidIsoDateTime(article.publishedAt) &&
      isValidIsoDateTime(article.updatedAt) &&
      new Date(article.updatedAt).getTime() <
        new Date(article.publishedAt).getTime()
    ) {
      errors.push(
        "Updated At must not be earlier than Published At."
      );
    }

    if (!article.hero?.src) {
      warnings.push(
        "News articles should include a hero image."
      );
    }

    if (
      article.hero?.src &&
      !String(article.hero?.alt ?? "").trim()
    ) {
      warnings.push(
        "News hero image should include alt text."
      );
    }

    if (
      article.hero?.src &&
      Number.isFinite(Number(article.hero.width)) &&
      Number(article.hero.width) < 1200
    ) {
      warnings.push(
        "News hero image should be at least 1200px wide for sharing and search previews."
      );
    }

    if (!String(article.author ?? "").trim()) {
      warnings.push("News articles should include an author.");
    }

    if (!String(article.category ?? "").trim()) {
      warnings.push("News articles should include a category.");
    }

    if (String(article.excerpt ?? "").trim().length < 80) {
      warnings.push(
        "News excerpt is unusually short."
      );
    }

    if (
      !Array.isArray(article.sources) ||
      article.sources.length === 0
    ) {
      warnings.push(
        "News articles should include sources when applicable."
      );
    }

    if (
      /leak|rumou?r/i.test(
        `${article.title ?? ""} ${article.excerpt ?? ""} ${article.category ?? ""}`
      ) &&
      article.newsLabel !== "Leak / Rumor"
    ) {
      warnings.push(
        "Possible leak or rumor story should use the Leak / Rumor label."
      );
    }
  } else {
    if (!isValidDate(article.publishedDate)) {
      errors.push(
        "Published date must be YYYY-MM-DD."
      );
    }

    if (!isValidDate(article.updatedDate)) {
      errors.push(
        "Updated date must be YYYY-MM-DD."
      );
    }
  }

  if (
    article.hero?.src &&
    hasPathTraversal(article.hero.src)
  ) {
    errors.push("Hero image path is unsafe.");
  }

  if (
    article.hero?.src &&
    !isNews &&
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

      if (
        block.type === "youtube" &&
        !getYouTubeVideoId(block.url || block.videoId)
      ) {
        errors.push(
          `${label} YouTube block needs a valid YouTube URL or video ID.`
        );
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

      if (block.type === "item-card-grid") {
        if (!Array.isArray(block.itemSlugs)) {
          errors.push(
            `${label} item card grid must use an item slugs array.`
          );
        } else {
          block.itemSlugs.forEach(value => {
            if (!isSafeSlug(String(value))) {
              errors.push(
                `${label} item card grid slugs must be URL-safe item names.`
              );
            }
          });
        }

        if (!hasValidCardSize(block.cardSize)) {
          errors.push(
            `${label} item card grid size is invalid.`
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
