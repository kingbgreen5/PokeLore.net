function ArticleSources({
  sources = []
}) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return null;
  }

  return (
    <section className="topic-article-sources">
      <h2>Sources and Further Reading</h2>

      <ol>
        {sources.map((source, index) => (
          <li key={`${source.title}-${index}`}>
            {source.url ? (
              <a
                href={source.url}
                rel="noreferrer"
                target="_blank"
              >
                {source.title || source.url}
              </a>
            ) : (
              <span>
                {source.title || "Untitled source"}
              </span>
            )}
            {source.publisher && (
              <span> - {source.publisher}</span>
            )}
            {source.accessedDate && (
              <span>
                {" "}
                (accessed {source.accessedDate})
              </span>
            )}
            {source.note && <p>{source.note}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}

export default ArticleSources;
