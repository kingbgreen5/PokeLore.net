import { useEffect } from "react";
import { defaultSeo } from "./seoConfig";

function getOrCreateMeta(attribute, key) {
  let element =
    document.head.querySelector(
      `meta[${attribute}="${key}"]`
    );

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  return element;
}

function setMetaName(name, content) {
  if (!content) return;

  getOrCreateMeta("name", name).setAttribute(
    "content",
    content
  );
}

function setMetaProperty(property, content) {
  if (!content) return;

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

  let element =
    document.head.querySelector(
      'link[rel="canonical"]'
    );

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
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
  image,
  structuredData,
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
      canonical || fallback.canonical;

    document.title = pageTitle;

    setMetaName(
      "description",
      pageDescription
    );
    setCanonical(pageCanonical);

    setMetaProperty("og:title", pageTitle);
    setMetaProperty(
      "og:description",
      pageDescription
    );
    setMetaProperty("og:url", pageCanonical);
    setMetaProperty("og:type", type);

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

    setStructuredData(structuredData);
  }, [
    title,
    description,
    canonical,
    image,
    structuredData,
    type
  ]);

  return null;
}

export default Seo;
