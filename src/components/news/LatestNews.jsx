import {
  useEffect,
  useState
} from "react";
import { Link } from "react-router-dom";
import {
  getActiveNewsArticles
} from "../../utils/newsArticles";
import NewsCard from "./NewsCard";
import "./NewsCards.css";

function LatestNews({
  limit = 4
}) {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    fetch("/data/news/newsIndex.json")
      .then(response =>
        response.ok ? response.json() : { articles: [] }
      )
      .then(index => {
        setArticles(
          getActiveNewsArticles(index).slice(0, limit)
        );
      })
      .catch(error => {
        console.warn("Failed to load latest news:", error);
        setArticles([]);
      });
  }, [limit]);

  if (articles.length === 0) {
    return null;
  }

  return (
    <section
      style={{
        margin: "0 auto 1.5rem",
        maxWidth: "1040px",
        padding: "0 1rem",
        textAlign: "left"
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: "1rem",
          justifyContent: "space-between",
          marginBottom: ".75rem"
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            letterSpacing: 0,
            margin: 0
          }}
        >
          Latest Pokemon News
        </h2>
        <Link to="/news">All News</Link>
      </div>
      <div
        style={{
          display: "grid",
          gap: ".75rem"
        }}
      >
        {articles.map(article => (
          <NewsCard
            key={article.slug}
            article={article}
            compact={true}
          />
        ))}
      </div>
    </section>
  );
}

export default LatestNews;
