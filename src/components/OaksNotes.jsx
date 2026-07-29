import {
  useEffect,
  useMemo,
  useState
} from "react";
import { Link } from "react-router-dom";
import PokemonSummaryCard from "./PokemonSummaryCard";
import { normalizeDisplayText } from "../utils/normalizeText";

function pokemonSlugFromLink(link) {
  const match = String(link?.to ?? "").match(
    /^\/pokemon\/([^/?#]+)/
  );

  return match?.[1] ?? null;
}

function NoteLink({
  link
}) {
  if (!link?.to || !link?.label) {
    return null;
  }

  return (
    <Link to={link.to}>
      {normalizeDisplayText(link.label)}
    </Link>
  );
}

function getParagraphText(paragraph) {
  return typeof paragraph === "string"
    ? paragraph
    : paragraph?.text ?? "";
}

function InlineLinkedText({
  paragraph
}) {
  const text = getParagraphText(paragraph);
  const links = Array.isArray(paragraph?.links)
    ? paragraph.links
    : [];

  if (links.length === 0) {
    return normalizeDisplayText(text);
  }

  const parts = [];
  let remaining = text;

  while (remaining) {
    const nextLink = links
      .map(link => ({
        ...link,
        index: remaining.indexOf(link.label)
      }))
      .filter(link => link.index >= 0)
      .sort(
        (a, b) =>
          a.index - b.index ||
          b.label.length - a.label.length
      )[0];

    if (!nextLink) {
      parts.push(remaining);
      break;
    }

    if (nextLink.index > 0) {
      parts.push(remaining.slice(0, nextLink.index));
    }

    parts.push({
      label: nextLink.label,
      to: nextLink.to
    });

    remaining = remaining.slice(
      nextLink.index + nextLink.label.length
    );
  }

  return parts.map((part, index) =>
    typeof part === "string" ? (
      normalizeDisplayText(part)
    ) : (
      <NoteLink
        key={`${part.to}-${part.label}-${index}`}
        link={part}
      />
    )
  );
}

function PokemonNoteLinks({
  links,
  pokemonByName
}) {
  const pokemonLinks = [];
  const regularLinks = [];

  links.forEach(link => {
    const pokemonSlug =
      pokemonSlugFromLink(link);
    const pokemon =
      pokemonSlug
        ? pokemonByName.get(pokemonSlug)
        : null;

    if (pokemon) {
      pokemonLinks.push(pokemon);
      return;
    }

    regularLinks.push(link);
  });

  return (
    <>
      {pokemonLinks.length > 0 && (
        <div
          style={{
            display: "grid",
            gap: ".75rem",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(135px, 1fr))",
            justifyItems: "center",
            marginTop: ".75rem"
          }}
        >
          {pokemonLinks.map(pokemon => (
            <PokemonSummaryCard
              key={pokemon.name}
              pokemon={pokemon}
              compact={true}
            />
          ))}
        </div>
      )}

      {regularLinks.length > 0 && (
        <p
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: ".75rem",
            marginBottom: 0,
            marginTop:
              pokemonLinks.length > 0
                ? "1rem"
                : 0
          }}
        >
          {regularLinks.map(link => (
            <NoteLink
              key={`${link.to}-${link.label}`}
              link={link}
            />
          ))}
        </p>
      )}
    </>
  );
}

function KeyStats({
  stats
}) {
  if (!Array.isArray(stats) || stats.length === 0) {
    return null;
  }

  return (
    <div>
      <h4
        style={{
          marginBottom: ".35rem"
        }}
      >
        Key Stats
      </h4>

      <ul
        style={{
          margin: 0,
          paddingLeft: "1.25rem"
        }}
      >
        {stats.map(stat => (
          <li key={stat.name}>
            <strong>
              {normalizeDisplayText(stat.name)}
            </strong>
            {stat.description
              ? ` - ${normalizeDisplayText(stat.description)}`
              : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OaksNotes({
  defaultTitle = "Oak's Notes",
  note,
  warningLabel = defaultTitle
}) {
  const [pokemonIndex, setPokemonIndex] =
    useState([]);

  useEffect(() => {
    if (!note) {
      return;
    }

    const hasPokemonLinks =
      note.sections?.some(section =>
        section.links?.some(pokemonSlugFromLink)
      );

    if (!hasPokemonLinks) {
      return;
    }

    let isActive = true;

    fetch("/data/pokemonIndex.json")
      .then(response =>
        response.ok
          ? response.json()
          : []
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
          "Failed to load Pokémon index for Oak's Notes:",
          error
        );
        setPokemonIndex([]);
      });

    return () => {
      isActive = false;
    };
  }, [note, warningLabel]);

  const pokemonByName = useMemo(
    () =>
      new Map(
        pokemonIndex.map(pokemon => [
          pokemon.name,
          pokemon
        ])
      ),
    [pokemonIndex]
  );

  if (!note) {
    return null;
  }

  const sections = Array.isArray(note.sections)
    ? note.sections
    : [];
  const body = Array.isArray(note.body)
    ? note.body
    : [];
  const title =
    note.title ?? defaultTitle;
  const containerAccentStyle =
    title === "Oak's Notes"
      ? {
          backgroundColor: "rgba(0, 202, 219, 0.1)",
          border: "1px solid rgba(0, 202, 219, 0.45)"
        }
      : {};

  if (
    !note.title &&
    sections.length === 0 &&
    body.length === 0
  ) {
    return null;
  }

  return (
    <section
      style={{
        border: "1px solid #666",
        borderRadius: "12px",
        marginBottom: "2rem",
        padding: "1rem",
        textAlign: "left",
        ...containerAccentStyle
      }}
    >
      <h2>{title}</h2>

      {body.map((paragraph, index) => (
        <p key={`${getParagraphText(paragraph)}-${index}`}>
          <InlineLinkedText paragraph={paragraph} />
        </p>
      ))}

      {sections.map((section, index) => (
        <section
          key={`${section.heading ?? "section"}-${index}`}
          style={{
            marginTop: index === 0 ? 0 : "1rem",
            paddingBottom:
              index === sections.length - 1
                ? 0
                : "1.5rem"
          }}
        >
          {section.heading && (
            <h3>{normalizeDisplayText(section.heading)}</h3>
          )}

          {(section.body ?? []).map((paragraph, bodyIndex) => (
            <p key={`${getParagraphText(paragraph)}-${bodyIndex}`}>
              <InlineLinkedText paragraph={paragraph} />
            </p>
          ))}

          <KeyStats stats={section.keyStats} />

          {section.links?.length > 0 && (
            <>
              {section.keyStats?.length > 0 && (
                <h4
                  style={{
                    marginBottom: ".35rem"
                  }}
                >
                  Recommended Pokémon
                </h4>
              )}

              <PokemonNoteLinks
                links={section.links}
                pokemonByName={pokemonByName}
              />
            </>
          )}
        </section>
      ))}
    </section>
  );
}

export default OaksNotes;
