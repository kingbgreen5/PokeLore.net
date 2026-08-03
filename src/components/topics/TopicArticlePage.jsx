import { Link } from "react-router-dom";
import FeebasGuideBreadcrumbs from "../feebas/FeebasGuideBreadcrumbs";
import { getFeebasGuideBreadcrumbs } from "../feebas/feebasGuideBreadcrumbData";
import Seo from "../../seo/Seo";
import { topicSeo } from "../../seo/seoConfig";
import { calculateReadingTime } from "../../utils/articleReadingTime";
import ArticleBlockRenderer from "./ArticleBlockRenderer";
import ArticleImage from "./ArticleImage";
import ArticleSources from "./ArticleSources";
import ArticleTableOfContents from "./ArticleTableOfContents";
import "./TopicArticlePage.css";

function formatDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium"
  }).format(new Date(`${value}T00:00:00`));
}

function getTableOfContents(article) {
  const usedAnchors = new Set();

  return (article.sections ?? [])
    .filter(
      block =>
        block.type === "heading" &&
        Number(block.level) === 2 &&
        block.text
    )
    .map(block => {
      let anchor =
        block.anchor ||
        String(block.text)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      const baseAnchor = anchor;
      let suffix = 2;

      while (usedAnchors.has(anchor)) {
        anchor = `${baseAnchor}-${suffix}`;
        suffix += 1;
      }

      usedAnchors.add(anchor);

      return {
        anchor,
        text: block.text
      };
    });
}

function RelatedPokemon({
  ids = []
}) {
  if (ids.length === 0) {
    return null;
  }

  return (
    <section className="topic-article-related">
      <h2>Related Pokemon</h2>
      <div>
        {ids.map(id => (
          <Link
            key={id}
            to={`/pokemon/${id}`}
          >
            #{String(id).padStart(3, "0")}
          </Link>
        ))}
      </div>
    </section>
  );
}

function RelatedTopics({
  topics = []
}) {
  if (topics.length === 0) {
    return null;
  }

  return (
    <section className="topic-article-related">
      <h2>Related Topics</h2>
      <div>
        {topics.map(topic => {
          const slug =
            typeof topic === "string"
              ? topic
              : topic.slug;
          const label =
            typeof topic === "string"
              ? topic
              : topic.title ?? topic.slug;

          return (
            <Link
              key={slug}
              to={`/topic/${slug}`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function TopicArticlePage({
  article,
  preview = false
}) {
  if (!article) {
    return null;
  }

  const toc = getTableOfContents(article);
  const readingTime =
    calculateReadingTime(article);
  const updatedDiffers =
    article.updatedDate &&
    article.updatedDate !== article.publishedDate;
  const feebasBreadcrumbs =
    getFeebasGuideBreadcrumbs(article.slug);

  return (
    <main className="topic-article">
      {!preview && <Seo {...topicSeo(article)} />}

      {feebasBreadcrumbs ? (
        <FeebasGuideBreadcrumbs pageId={article.slug} />
      ) : (
        <nav className="topic-article-breadcrumbs">
          <Link to="/topics">Topics</Link>
          <span aria-hidden="true">/</span>
          <span>{article.title}</span>
        </nav>
      )}

      <header className="topic-article-header">
        {article.category && (
          <p className="topic-article-category">
            {article.category}
          </p>
        )}

        <h1>{article.title}</h1>

        {article.subtitle && (
          <p className="topic-article-subtitle">
            {article.subtitle}
          </p>
        )}

        <p className="topic-article-byline">
          {article.author || "PokeLore"} ·{" "}
          {formatDate(article.publishedDate)}
          {updatedDiffers
            ? ` · Updated ${formatDate(article.updatedDate)}`
            : ""}{" "}
          · {readingTime} min read
        </p>
      </header>

      <ArticleImage
        image={article.hero}
        priority={true}
        wide={true}
      />

      <ArticleTableOfContents headings={toc} />

      <div className="topic-article-body">
        {(article.sections ?? []).map(block => (
          <ArticleBlockRenderer
            key={block.id}
            block={block}
          />
        ))}
      </div>

      <ArticleSources sources={article.sources} />

      <RelatedPokemon ids={article.relatedPokemon} />
      <RelatedTopics topics={article.relatedTopics} />
    </main>
  );
}

export default TopicArticlePage;
