import {
  useEffect,
  useState
} from "react";
import {
  Link,
  useParams
} from "react-router-dom";
import OgCard from "./OgCard";
import { formatName } from "../seo/seoConfig";

function PreviewShell({
  children
}) {
  return (
    <main
      style={{
        alignItems: "center",
        display: "grid",
        gap: "1rem",
        justifyItems: "center",
        padding: "2rem"
      }}
    >
      {children}
    </main>
  );
}

function PreviewLinks() {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: ".75rem",
        justifyContent: "center"
      }}
    >
      {[
        ["/og-preview/pokemon/697", "Pokémon"],
        ["/og-preview/move/thunderbolt", "Move"],
        ["/og-preview/topic/forest-pokemon", "Topic"],
        ["/og-preview/item/master-ball", "Item"]
      ].map(([href, label]) => (
        <Link
          key={href}
          to={href}
          style={{
            border: "1px solid #666",
            borderRadius: "999px",
            color: "inherit",
            padding: ".45rem .8rem",
            textDecoration: "none"
          }}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

function LoadingCard() {
  return <p>Loading OG preview...</p>;
}

function ErrorCard({
  message
}) {
  return (
    <PreviewShell>
      <PreviewLinks />
      <p>{message}</p>
    </PreviewShell>
  );
}

export function OgPreviewHome() {
  return (
    <PreviewShell>
      <PreviewLinks />
      <OgCard />
    </PreviewShell>
  );
}

export function OgPokemonPreview() {
  const { id } = useParams();
  const [pokemon, setPokemon] =
    useState(null);
  const [notFound, setNotFound] =
    useState(false);

  useEffect(() => {
    async function loadPokemon() {
      try {
        setNotFound(false);

        const response = await fetch(
          `/data/pokemonData/${id}.json`
        );

        if (!response.ok) {
          setNotFound(true);
          return;
        }

        setPokemon(await response.json());
      } catch {
        setNotFound(true);
      }
    }

    loadPokemon();
  }, [id]);

  if (notFound) {
    return (
      <ErrorCard message="Pokémon preview not found." />
    );
  }

  if (!pokemon) {
    return <LoadingCard />;
  }

  return (
    <PreviewShell>
      <PreviewLinks />
      <OgCard
        variant="pokemon"
        data={pokemon}
      />
    </PreviewShell>
  );
}

export function OgMovePreview() {
  const { moveName } = useParams();
  const [move, setMove] =
    useState(null);
  const [notFound, setNotFound] =
    useState(false);

  useEffect(() => {
    async function loadMove() {
      try {
        setNotFound(false);

        const response = await fetch(
          "/data/moves.json"
        );
        const moves = await response.json();

        if (!moves[moveName]) {
          setNotFound(true);
          return;
        }

        setMove(moves[moveName]);
      } catch {
        setNotFound(true);
      }
    }

    loadMove();
  }, [moveName]);

  if (notFound) {
    return (
      <ErrorCard message="Move preview not found." />
    );
  }

  if (!move) {
    return <LoadingCard />;
  }

  return (
    <PreviewShell>
      <PreviewLinks />
      <OgCard
        variant="move"
        name={moveName}
        data={move}
      />
    </PreviewShell>
  );
}

export function OgTopicPreview() {
  const { topicSlug } = useParams();
  const [topic, setTopic] =
    useState(null);
  const [notFound, setNotFound] =
    useState(false);

  useEffect(() => {
    async function loadTopic() {
      try {
        setNotFound(false);

        const response = await fetch(
          "/data/pokedexTopics.json"
        );
        const data = await response.json();
        const matchingTopic =
          data.topics?.find(
            currentTopic =>
              currentTopic.slug === topicSlug
          );

        if (!matchingTopic) {
          setNotFound(true);
          return;
        }

        setTopic(matchingTopic);
      } catch {
        setNotFound(true);
      }
    }

    loadTopic();
  }, [topicSlug]);

  if (notFound) {
    return (
      <ErrorCard message="Topic preview not found." />
    );
  }

  if (!topic) {
    return <LoadingCard />;
  }

  return (
    <PreviewShell>
      <PreviewLinks />
      <OgCard
        variant="topic"
        data={topic}
      />
    </PreviewShell>
  );
}

export function OgItemPreview() {
  const { itemName } = useParams();
  const [item, setItem] =
    useState(null);
  const [notFound, setNotFound] =
    useState(false);

  useEffect(() => {
    async function loadItem() {
      try {
        setNotFound(false);

        const response = await fetch(
          `/data/items/${itemName}.json`
        );

        if (!response.ok) {
          setNotFound(true);
          return;
        }

        setItem(await response.json());
      } catch {
        setNotFound(true);
      }
    }

    loadItem();
  }, [itemName]);

  if (notFound) {
    return (
      <ErrorCard
        message={`Item preview not found for ${formatName(itemName)}.`}
      />
    );
  }

  if (!item) {
    return <LoadingCard />;
  }

  return (
    <PreviewShell>
      <PreviewLinks />
      <OgCard
        variant="item"
        data={item}
      />
    </PreviewShell>
  );
}
