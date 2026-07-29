function ArticleCallout({
  block
}) {
  return (
    <aside
      className={`topic-article-callout topic-article-callout-${block.variant ?? "note"}`}
    >
      {block.title && <h3>{block.title}</h3>}
      {block.text && <p>{block.text}</p>}
    </aside>
  );
}

export default ArticleCallout;
