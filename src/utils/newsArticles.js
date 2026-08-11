import {
  DEFAULT_NEWS_LABEL,
  NEWS_CONTENT_TYPE
} from "./articleSchema";

export function isActiveNewsArticle(article) {
  return (
    article?.contentType === NEWS_CONTENT_TYPE &&
    article.active !== false
  );
}

export function sortNewsNewestFirst(articles = []) {
  return [...articles].sort(
    (a, b) =>
      new Date(b.publishedAt || 0).getTime() -
      new Date(a.publishedAt || 0).getTime()
  );
}

export function getActiveNewsArticles(index) {
  return sortNewsNewestFirst(
    (index?.articles ?? []).filter(isActiveNewsArticle)
  );
}

export function formatNewsDateTime(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZoneName: "short"
  }).format(new Date(value));
}

export function getNewsLabel(article) {
  return article?.newsLabel || DEFAULT_NEWS_LABEL;
}
