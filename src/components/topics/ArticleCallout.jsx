function ArticleCallout({
  block,
  renderText = text => text
}) {
  return (
    <aside
      className={`topic-article-callout topic-article-callout-${block.variant ?? "note"}`}
    >
      {block.title && <h3>{block.title}</h3>}
      {block.text && <p>{renderText(block.text)}</p>}
    </aside>
  );
}

export default ArticleCallout;
