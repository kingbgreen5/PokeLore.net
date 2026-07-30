export const ARTICLE_CONTENT_TYPE = "article";

export const ARTICLE_BLOCK_TYPES = [
  "paragraph",
  "heading",
  "image",
  "image-grid",
  "list",
  "quote",
  "comparison",
  "table",
  "callout",
  "pokemon-card-grid",
  "item-card-grid",
  "pokemon-link",
  "topic-link",
  "oak-notes"
];

export const ARTICLE_IMAGE_DISPLAY_SIZES = [
  "small",
  "medium",
  "large",
  "wide",
  "full"
];

export const slugPattern =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isSafeSlug(value) {
  return (
    typeof value === "string" &&
    slugPattern.test(value) &&
    !value.includes("..") &&
    !value.includes("/") &&
    !value.includes("\\")
  );
}

export function slugify(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function createBlockId() {
  if (globalThis.crypto?.randomUUID) {
    return `block-${globalThis.crypto.randomUUID()}`;
  }

  return `block-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function createEmptyArticle({
  title = "Untitled article",
  slug
} = {}) {
  const date = todayIsoDate();
  const safeSlug =
    slug && isSafeSlug(slug)
      ? slug
      : slugify(title) || "untitled-article";

  return {
    slug: safeSlug,
    contentType: ARTICLE_CONTENT_TYPE,
    title,
    subtitle: "",
    excerpt: "",
    publishedDate: date,
    updatedDate: date,
    author: "PokeLore",
    category: "",
    tags: [],
    hero: {
      src: "",
      alt: "",
      caption: "",
      width: null,
      height: null
    },
    relatedPokemon: [],
    sections: [
      {
        id: createBlockId(),
        type: "paragraph",
        text: ""
      }
    ],
    sources: [],
    relatedTopics: []
  };
}

export function createArticleIndexEntry(article) {
  return {
    slug: article.slug,
    contentType: ARTICLE_CONTENT_TYPE,
    active: article.active ?? true,
    subgroup: article.subgroup ?? "lore",
    title: article.title,
    shortDescription:
      article.excerpt || article.subtitle || "",
    excerpt: article.excerpt || "",
    thumbnail:
      article.thumbnail ||
      article.hero?.thumbnail ||
      article.hero?.src ||
      "",
    category: article.category || "",
    publishedDate: article.publishedDate,
    updatedDate: article.updatedDate,
    relatedPokemon: Array.isArray(
      article.relatedPokemon
    )
      ? article.relatedPokemon
      : [],
    featured: article.featured ?? false,
    countLabel: "Article"
  };
}

export function cloneArticleWithNewBlockIds(article) {
  return {
    ...article,
    sections: (article.sections ?? []).map(block => ({
      ...block,
      id: createBlockId()
    }))
  };
}

export function normalizeDelimitedList(value) {
  if (Array.isArray(value)) {
    return value
      .map(entry => String(entry).trim())
      .filter(Boolean);
  }

  return String(value ?? "")
    .split(",")
    .map(entry => entry.trim())
    .filter(Boolean);
}

export function normalizeNumericList(value) {
  return normalizeDelimitedList(value)
    .map(entry => Number(entry))
    .filter(entry => Number.isInteger(entry));
}
