import { Link } from "react-router-dom";
import ArticleCallout from "./ArticleCallout";
import ArticleImage from "./ArticleImage";

function ArticleTable({
  block
}) {
  return (
    <div className="topic-article-table-wrap">
      <table>
        {block.headers?.length > 0 && (
          <thead>
            <tr>
              {block.headers.map(header => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {(block.rows ?? []).map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ArticleComparison({
  block
}) {
  return (
    <section className="topic-article-comparison">
      {block.title && <h3>{block.title}</h3>}
      <div>
        {(block.items ?? []).map((item, index) => (
          <article key={`${item.label}-${index}`}>
            <h4>{item.label}</h4>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function OakNotesBlock({
  block
}) {
  return (
    <aside className="topic-article-oak-notes">
      <h2>{block.title || "Oak's Notes"}</h2>
      {(block.notes ?? []).map((note, index) => (
        <p key={`${note}-${index}`}>{note}</p>
      ))}
      {(block.sections ?? []).map((section, index) => (
        <section key={`${section.heading}-${index}`}>
          {section.heading && <h3>{section.heading}</h3>}
          {(section.body ?? []).map((text, bodyIndex) => (
            <p key={`${text}-${bodyIndex}`}>{text}</p>
          ))}
        </section>
      ))}
    </aside>
  );
}

function UnknownBlock({
  block
}) {
  return (
    <aside className="topic-article-unknown-block">
      Unsupported article block: {block?.type ?? "missing type"}
    </aside>
  );
}

function ArticleBlockRenderer({
  block
}) {
  if (!block) {
    return null;
  }

  switch (block.type) {
    case "paragraph":
      return <p>{block.text}</p>;
    case "heading": {
      const HeadingTag =
        Number(block.level) === 3 ? "h3" : "h2";
      return (
        <HeadingTag id={block.anchor || undefined}>
          {block.text}
        </HeadingTag>
      );
    }
    case "image":
      return (
        <ArticleImage
          image={block}
          wide={block.wide !== false}
        />
      );
    case "image-grid":
      return (
        <div className="topic-article-image-grid">
          {(block.images ?? []).map((image, index) => (
            <ArticleImage
              key={`${image.src}-${index}`}
              image={image}
            />
          ))}
        </div>
      );
    case "list": {
      const ListTag =
        block.ordered === true ? "ol" : "ul";
      return (
        <ListTag>
          {(block.items ?? []).map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ListTag>
      );
    }
    case "quote":
      return (
        <figure className="topic-article-quote">
          <blockquote>{block.text}</blockquote>
          {block.citation && (
            <figcaption>{block.citation}</figcaption>
          )}
        </figure>
      );
    case "comparison":
      return <ArticleComparison block={block} />;
    case "table":
      return <ArticleTable block={block} />;
    case "callout":
      return <ArticleCallout block={block} />;
    case "pokemon-link":
      return (
        <p className="topic-article-link-card">
          <Link to={`/pokemon/${block.slug}`}>
            {block.label || block.slug}
          </Link>
          {block.text ? ` - ${block.text}` : ""}
        </p>
      );
    case "topic-link":
      return (
        <p className="topic-article-link-card">
          <Link to={`/topic/${block.slug}`}>
            {block.label || block.slug}
          </Link>
          {block.text ? ` - ${block.text}` : ""}
        </p>
      );
    case "oak-notes":
      return <OakNotesBlock block={block} />;
    default:
      return <UnknownBlock block={block} />;
  }
}

export default ArticleBlockRenderer;
