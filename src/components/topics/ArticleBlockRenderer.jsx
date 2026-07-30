import {
  useEffect,
  useMemo,
  useState
} from "react";
import { Link } from "react-router-dom";
import ItemSummaryCard from "../ItemSummaryCard";
import PokemonSummaryCard from "../PokemonSummaryCard";
import ArticleCallout from "./ArticleCallout";
import ArticleImage from "./ArticleImage";

function InlineArticleText({
  text
}) {
  const parts = [];
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(String(text ?? "")))) {
    if (match.index > lastIndex) {
      parts.push(
        String(text).slice(lastIndex, match.index)
      );
    }

    const label = match[1];
    const href = match[2];

    if (href.startsWith("/")) {
      parts.push(
        <Link
          key={`${href}-${match.index}`}
          to={href}
        >
          {label}
        </Link>
      );
    } else if (/^https?:\/\//.test(href)) {
      parts.push(
        <a
          key={`${href}-${match.index}`}
          href={href}
          rel="noreferrer"
          target="_blank"
        >
          {label}
        </a>
      );
    } else {
      parts.push(match[0]);
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < String(text ?? "").length) {
    parts.push(String(text ?? "").slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

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
            <p>
              <InlineArticleText text={item.text} />
            </p>
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
        <p key={`${note}-${index}`}>
          <InlineArticleText text={note} />
        </p>
      ))}
      {(block.sections ?? []).map((section, index) => (
        <section key={`${section.heading}-${index}`}>
          {section.heading && <h3>{section.heading}</h3>}
          {(section.body ?? []).map((text, bodyIndex) => (
            <p key={`${text}-${bodyIndex}`}>
              <InlineArticleText text={text} />
            </p>
          ))}
        </section>
      ))}
    </aside>
  );
}

function PokemonCardGrid({
  block
}) {
  const [pokemonIndex, setPokemonIndex] =
    useState([]);

  useEffect(() => {
    let isActive = true;

    fetch("/data/pokemonIndex.json")
      .then(response =>
        response.ok ? response.json() : []
      )
      .then(data => {
        if (!isActive) return;
        setPokemonIndex(
          Array.isArray(data) ? data : []
        );
      })
      .catch(error => {
        if (!isActive) return;
        console.warn(
          "Failed to load Pokemon index for article cards:",
          error
        );
        setPokemonIndex([]);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const pokemonById = useMemo(
    () =>
      new Map(
        pokemonIndex.map(pokemon => [
          Number(pokemon.id),
          pokemon
        ])
      ),
    [pokemonIndex]
  );
  const pokemon = (block.pokemonIds ?? [])
    .map(id => pokemonById.get(Number(id)))
    .filter(Boolean);

  if (pokemon.length === 0) {
    return null;
  }

  return (
    <section className="topic-article-pokemon-card-grid">
      {block.title && <h2>{block.title}</h2>}
      <div>
        {pokemon.map(entry => (
          <PokemonSummaryCard
            key={entry.id}
            pokemon={entry}
            variant={block.cardSize ?? "compact"}
          />
        ))}
      </div>
    </section>
  );
}

function ItemCardGrid({
  block
}) {
  const [itemsIndex, setItemsIndex] =
    useState([]);

  useEffect(() => {
    let isActive = true;

    fetch("/data/itemsIndex.json")
      .then(response =>
        response.ok ? response.json() : []
      )
      .then(data => {
        if (!isActive) return;
        setItemsIndex(
          Array.isArray(data) ? data : []
        );
      })
      .catch(error => {
        if (!isActive) return;
        console.warn(
          "Failed to load item index for article cards:",
          error
        );
        setItemsIndex([]);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const itemsBySlug = useMemo(
    () =>
      new Map(
        itemsIndex.map(item => [
          item.slug ?? item.name,
          item
        ])
      ),
    [itemsIndex]
  );
  const items = (block.itemSlugs ?? [])
    .map(slug => itemsBySlug.get(String(slug)))
    .filter(Boolean);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="topic-article-item-card-grid">
      {block.title && <h2>{block.title}</h2>}
      <div>
        {items.map(item => (
          <ItemSummaryCard
            key={item.slug ?? item.name}
            item={item}
            variant={block.cardSize ?? "compact"}
          />
        ))}
      </div>
    </section>
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
      return (
        <p>
          <InlineArticleText text={block.text} />
        </p>
      );
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
            <li key={`${item}-${index}`}>
              <InlineArticleText text={item} />
            </li>
          ))}
        </ListTag>
      );
    }
    case "quote":
      return (
        <figure className="topic-article-quote">
          <blockquote>
            <InlineArticleText text={block.text} />
          </blockquote>
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
      return (
        <ArticleCallout
          block={block}
          renderText={text => (
            <InlineArticleText text={text} />
          )}
        />
      );
    case "pokemon-card-grid":
      return <PokemonCardGrid block={block} />;
    case "item-card-grid":
      return <ItemCardGrid block={block} />;
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
