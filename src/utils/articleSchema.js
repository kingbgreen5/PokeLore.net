export const ARTICLE_CONTENT_TYPE = "article";
export const NEWS_CONTENT_TYPE = "news";

export const ARTICLE_CONTENT_TYPES = [
  ARTICLE_CONTENT_TYPE,
  NEWS_CONTENT_TYPE
];

export const NEWS_LABELS = [
  "News",
  "Leak / Rumor",
  "Official",
  "Update",
  "Analysis"
];

export const DEFAULT_NEWS_LABEL = "News";

export const LEAK_RUMOR_WARNING =
  "This information has not been officially confirmed by The Pokemon Company or Game Freak. Details may change or prove inaccurate.";

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
  "youtube",
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

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

export function toLocalIsoDateTime(date = new Date()) {
  const timezoneOffsetMinutes = -date.getTimezoneOffset();
  const offsetSign =
    timezoneOffsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(
    timezoneOffsetMinutes
  );
  const offsetHours = Math.floor(
    absoluteOffset / 60
  );
  const offsetMinutes = absoluteOffset % 60;

  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}:00${offsetSign}${padDatePart(offsetHours)}:${padDatePart(offsetMinutes)}`;
}

export function isoToLocalInputValue(value = "") {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
}

export function localInputValueToIso(value = "") {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return toLocalIsoDateTime(date);
}

export function getArticleContentType(article) {
  return article?.contentType === NEWS_CONTENT_TYPE
    ? NEWS_CONTENT_TYPE
    : ARTICLE_CONTENT_TYPE;
}

export function isNewsArticle(article) {
  return getArticleContentType(article) === NEWS_CONTENT_TYPE;
}

export function getYouTubeVideoId(value = "") {
  const text = String(value ?? "").trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(text)) {
    return text;
  }

  try {
    const url = new URL(text);
    const hostname = url.hostname
      .replace(/^www\./, "")
      .toLowerCase();
    const pathParts = url.pathname
      .split("/")
      .filter(Boolean);

    if (hostname === "youtu.be") {
      return /^[a-zA-Z0-9_-]{11}$/.test(pathParts[0])
        ? pathParts[0]
        : "";
    }

    if (
      hostname === "youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname === "music.youtube.com"
    ) {
      const watchId = url.searchParams.get("v");

      if (/^[a-zA-Z0-9_-]{11}$/.test(watchId ?? "")) {
        return watchId;
      }

      if (
        ["embed", "shorts", "live"].includes(pathParts[0]) &&
        /^[a-zA-Z0-9_-]{11}$/.test(pathParts[1] ?? "")
      ) {
        return pathParts[1];
      }
    }
  } catch {
    return "";
  }

  return "";
}

export function getYouTubeEmbedUrl(value = "") {
  const videoId = getYouTubeVideoId(value);

  return videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}`
    : "";
}

export function createEmptyArticle({
  title = "Untitled article",
  slug,
  contentType = ARTICLE_CONTENT_TYPE
} = {}) {
  const date = todayIsoDate();
  const safeSlug =
    slug && isSafeSlug(slug)
      ? slug
      : slugify(title) || "untitled-article";

  const resolvedContentType =
    contentType === NEWS_CONTENT_TYPE
      ? NEWS_CONTENT_TYPE
      : ARTICLE_CONTENT_TYPE;
  const article = {
    slug: safeSlug,
    contentType: resolvedContentType,
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

  if (resolvedContentType === NEWS_CONTENT_TYPE) {
    return {
      ...article,
      newsLabel: DEFAULT_NEWS_LABEL,
      featured: false,
      publishedAt: "",
      updatedAt: ""
    };
  }

  return article;
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

export function createNewsIndexEntry(article) {
  const heroImage =
    article.hero?.thumbnail ||
    article.thumbnail ||
    article.hero?.src ||
    "";

  return {
    slug: article.slug,
    contentType: NEWS_CONTENT_TYPE,
    active: article.active ?? true,
    title: article.title,
    subtitle: article.subtitle || "",
    excerpt: article.excerpt || "",
    thumbnail: heroImage,
    hero: article.hero?.src || "",
    author: article.author || "",
    category: article.category || "",
    tags: Array.isArray(article.tags)
      ? article.tags
      : [],
    publishedAt: article.publishedAt || "",
    updatedAt: article.updatedAt || "",
    relatedPokemon: Array.isArray(
      article.relatedPokemon
    )
      ? article.relatedPokemon
      : [],
    featured: article.featured ?? false,
    newsLabel: article.newsLabel || DEFAULT_NEWS_LABEL
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
