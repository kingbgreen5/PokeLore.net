import { Link } from "react-router-dom";
import {
  formatNewsDateTime,
  getNewsLabel
} from "../../utils/newsArticles";

function NewsCard({
  article,
  compact = false
}) {
  const image =
    article.thumbnail || article.hero || "";

  return (
    <article className={compact ? "news-card news-card-compact" : "news-card"}>
      {image && (
        <Link
          className="news-card-image-link"
          to={`/news/${article.slug}`}
        >
          <img
            alt=""
            loading="lazy"
            src={image}
          />
        </Link>
      )}
      <div>
        <p className="news-card-meta">
          <span>{getNewsLabel(article)}</span>
          {article.category && (
            <span>{article.category}</span>
          )}
        </p>
        <h2>
          <Link to={`/news/${article.slug}`}>
            {article.title}
          </Link>
        </h2>
        {article.excerpt && <p>{article.excerpt}</p>}
        <small>
          {article.author
            ? `By ${article.author} - `
            : ""}
          {formatNewsDateTime(article.publishedAt)}
        </small>
      </div>
    </article>
  );
}

export default NewsCard;
