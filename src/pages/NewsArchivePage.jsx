import {
  useEffect,
  useState
} from "react";
import { Link } from "react-router-dom";
import NewsCard from "../components/news/NewsCard";
import "../components/news/NewsCards.css";
import Seo from "../seo/Seo";
import { newsArchiveSeo } from "../seo/seoConfig";
import { getActiveNewsArticles } from "../utils/newsArticles";

function NewsArchivePage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/news/newsIndex.json")
      .then(response =>
        response.ok ? response.json() : { articles: [] }
      )
      .then(index => {
        setArticles(getActiveNewsArticles(index));
      })
      .catch(error => {
        console.warn("Failed to load news index:", error);
        setArticles([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main
      style={{
        margin: "0 auto",
        maxWidth: "1080px",
        padding: "2rem 1rem",
        textAlign: "left"
      }}
    >
      <Seo {...newsArchiveSeo()} />
      <Link to="/" style={{ color: "inherit" }}>
        Back to PokeLore
      </Link>
      <h1>Latest Pokemon News</h1>
      <p
        style={{
          color: "#b6beca",
          lineHeight: 1.5,
          maxWidth: "720px"
        }}
      >
        Official updates, developing stories, analysis, and clearly labeled
        rumors from PokeLore.
      </p>

      {loading ? (
        <p>Loading news...</p>
      ) : articles.length === 0 ? (
        <p>No active news stories yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "1rem",
            marginTop: "1.5rem"
          }}
        >
          {articles.map(article => (
            <NewsCard
              key={article.slug}
              article={article}
            />
          ))}
        </div>
      )}
    </main>
  );
}

export default NewsArchivePage;
