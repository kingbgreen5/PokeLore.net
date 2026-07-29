function ArticleImage({
  image,
  priority = false,
  wide = false
}) {
  if (!image?.src) {
    return null;
  }

  return (
    <figure
      className={[
        "topic-article-figure",
        wide ? "topic-article-figure-wide" : "",
        image.displaySize
          ? `topic-article-figure-${image.displaySize}`
          : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <img
        src={image.src}
        alt={image.decorative ? "" : image.alt ?? ""}
        width={image.width || undefined}
        height={image.height || undefined}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? undefined : "async"}
        fetchPriority={priority ? "high" : undefined}
        sizes={
          wide
            ? "(min-width: 900px) 960px, 100vw"
            : "(min-width: 900px) 760px, 100vw"
        }
      />

      {image.caption && (
        <figcaption>{image.caption}</figcaption>
      )}
    </figure>
  );
}

export default ArticleImage;
