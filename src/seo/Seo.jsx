import { useEffect } from "react";
import { defaultSeo } from "./seoConfig";

function getOrCreateMeta(attribute, key) {
  const elements = Array.from(
    document.head.querySelectorAll(
      `meta[${attribute}="${key}"]`
    )
  );
  let element = elements[0];

  elements
    .slice(1)
    .forEach(duplicate =>
      duplicate.remove()
    );

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  return element;
}

function setMetaName(name, content) {
  if (!content) {
    removeMeta("name", name);
    return;
  }

  getOrCreateMeta("name", name).setAttribute(
    "content",
    content
  );
}

function setMetaProperty(property, content) {
  if (!content) {
    removeMeta("property", property);
    return;
  }

  getOrCreateMeta("property", property).setAttribute(
    "content",
    content
  );
}

function removeMeta(attribute, key) {
  const element =
    document.head.querySelector(
      `meta[${attribute}="${key}"]`
    );

  element?.remove();
}

function setCanonical(href) {
  if (!href) return;

  const elements = Array.from(
    document.head.querySelectorAll(
      'link[rel="canonical"]'
    )
  );
  let element = elements[0];

  elements
    .slice(1)
    .forEach(duplicate =>
      duplicate.remove()
    );

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

function removeCanonical() {
  document.head
    .querySelectorAll('link[rel="canonical"]')
    .forEach(element =>
      element.remove()
    );
}

function setStructuredData(data) {
  const scriptId = "seo-structured-data";
  const existingScript =
    document.head.querySelector(
      `script#${scriptId}`
    );

  if (!data) {
    existingScript?.remove();
    return;
  }

  const script =
    existingScript ??
    document.createElement("script");

  script.id = scriptId;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);

  if (!existingScript) {
    document.head.appendChild(script);
  }
}

function Seo({
  title,
  description,
  canonical,
  canonicalAction = "set",
  image,
  robots,
  structuredData,
  articlePublishedTime,
  articleModifiedTime,
  type = "website"
}) {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const fallback = defaultSeo();
    const pageTitle =
      title || fallback.title;
    const pageDescription =
      description || fallback.description;
    const pageCanonical =
      canonicalAction === "set"
        ? canonical || fallback.canonical
        : null;

    document.title = pageTitle;

    setMetaName(
      "description",
      pageDescription
    );
    if (canonicalAction === "remove") {
      removeCanonical();
    } else if (canonicalAction === "set") {
      setCanonical(pageCanonical);
    }

    setMetaProperty("og:title", pageTitle);
    setMetaProperty(
      "og:description",
      pageDescription
    );
    setMetaProperty("og:url", pageCanonical);
    setMetaProperty("og:type", type);
    setMetaName(
      "robots",
      robots || "max-image-preview:large"
    );

    setMetaName(
      "twitter:card",
      image ? "summary_large_image" : "summary"
    );
    setMetaName("twitter:title", pageTitle);
    setMetaName(
      "twitter:description",
      pageDescription
    );

    if (image) {
      setMetaProperty("og:image", image);
      setMetaName("twitter:image", image);
    } else {
      removeMeta("property", "og:image");
      removeMeta("name", "twitter:image");
    }

    if (articlePublishedTime) {
      setMetaProperty(
        "article:published_time",
        articlePublishedTime
      );
    } else {
      removeMeta(
        "property",
        "article:published_time"
      );
    }

    if (articleModifiedTime) {
      setMetaProperty(
        "article:modified_time",
        articleModifiedTime
      );
    } else {
      removeMeta(
        "property",
        "article:modified_time"
      );
    }

    setStructuredData(structuredData);
  }, [
    title,
    description,
    canonical,
    canonicalAction,
    image,
    robots,
    structuredData,
    articlePublishedTime,
    articleModifiedTime,
    type
  ]);

  return null;
}

export default Seo;
