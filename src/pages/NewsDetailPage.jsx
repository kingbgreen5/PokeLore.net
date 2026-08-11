import {
  useEffect,
  useState
} from "react";
import { useParams } from "react-router-dom";
import TopicArticlePage from "../components/topics/TopicArticlePage";
import NotFoundPage from "./NotFoundPage";

function NewsDetailPage() {
  const { newsSlug } = useParams();
  const [loadState, setLoadState] =
    useState({
      slug: "",
      article: null,
      checked: false
    });
  const currentState =
    loadState.slug === newsSlug
      ? loadState
      : {
          slug: newsSlug,
          article: null,
          checked: false
        };

  useEffect(() => {
    let isActive = true;

    fetch(`/data/news/articles/${newsSlug}.json`)
      .then(response =>
        response.ok ? response.json() : null
      )
      .then(data => {
        if (!isActive) return;
        setLoadState({
          slug: newsSlug,
          article:
            data?.contentType === "news" &&
            (import.meta.env.DEV ||
              data.active !== false)
              ? data
              : null,
          checked: true
        });
      })
      .catch(error => {
        if (!isActive) return;
        console.warn("Failed to load news article:", error);
        setLoadState({
          slug: newsSlug,
          article: null,
          checked: true
        });
      });

    return () => {
      isActive = false;
    };
  }, [newsSlug]);

  if (!currentState.checked) {
    return <p>Loading news...</p>;
  }

  if (!currentState.article) {
    return <NotFoundPage />;
  }

  return (
    <TopicArticlePage article={currentState.article} />
  );
}

export default NewsDetailPage;
