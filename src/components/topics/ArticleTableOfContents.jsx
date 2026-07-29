function ArticleTableOfContents({
  headings = []
}) {
  if (headings.length === 0) {
    return null;
  }

  return (
    <nav
      className="topic-article-toc"
      aria-label="Article table of contents"
    >
      <h2>Contents</h2>

      <ol>
        {headings.map(heading => (
          <li key={heading.anchor}>
            <a href={`#${heading.anchor}`}>
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default ArticleTableOfContents;
