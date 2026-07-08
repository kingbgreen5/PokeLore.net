import bannerImage from "../assets/Banner.png";
import TypeBadgeImage from "../components/TypeBadge";
import { formatName } from "../seo/seoConfig";
import { formatPokemonDisplayName }
from "../utils/pokemonNames";

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const accent = "#fab856";
const panel = "rgba(44, 44, 44, 0.82)";
const border = "rgba(250, 184, 86, 0.42)";

function TypeBadge({
  type
}) {
  return (
    <TypeBadgeImage
      height="58px"
      type={type}
    />
  );
}

function Brand() {
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        gap: "22px"
      }}
    >
      <img
        src={bannerImage}
        alt="PokéLore"
        style={{
          height: "86px",
          objectFit: "contain",
          width: "330px"
        }}
      />

      <div
        style={{
          backgroundColor: accent,
          borderRadius: "999px",
          color: "#15151c",
          fontSize: "24px",
          fontWeight: 900,
          padding: "8px 20px"
        }}
      >
        PokéLore
      </div>
    </div>
  );
}

function StatPill({
  label,
  value
}) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor:
          "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.16)",
        borderRadius: "18px",
        minWidth: "132px",
        padding: "14px 18px"
      }}
    >
      <div
        style={{
          color: accent,
          fontSize: "20px",
          fontWeight: 900,
          textTransform: "uppercase"
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: "white",
          fontSize: "34px",
          fontWeight: 900
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SpriteCluster({
  sprites = []
}) {
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        gap: "12px",
        justifyContent: "center",
        minHeight: "190px"
      }}
    >
      {sprites.slice(0, 5).map(sprite => (
        <img
          key={`${sprite.id}-${sprite.name}`}
          src={sprite.sprite}
          alt={sprite.name}
          style={{
            filter:
              "drop-shadow(0 18px 20px rgba(0,0,0,.4))",
            height: "150px",
            objectFit: "contain",
            width: "150px"
          }}
        />
      ))}
    </div>
  );
}

function BaseCard({
  children,
  kicker,
  variant = "default"
}) {
  return (
    <div
      data-og-card={variant}
      style={{
        background:
          "radial-gradient(circle at 88% 18%, rgba(250,184,86,.26), transparent 28%), linear-gradient(135deg, #15151c 0%, #202027 56%, #111117 100%)",
        border: `6px solid ${border}`,
        boxSizing: "border-box",
        color: "#f8f5ef",
        display: "flex",
        flexDirection: "column",
        fontFamily:
          "system-ui, Segoe UI, Roboto, sans-serif",
        height: `${CARD_HEIGHT}px`,
        justifyContent: "space-between",
        overflow: "hidden",
        padding: "54px 64px",
        position: "relative",
        width: `${CARD_WIDTH}px`
      }}
    >
      <div
        style={{
          backgroundColor:
            "rgba(250,184,86,.18)",
          borderRadius: "999px",
          height: "420px",
          position: "absolute",
          right: "-170px",
          top: "-150px",
          width: "420px"
        }}
      />
      <div
        style={{
          backgroundColor:
            "rgba(255,255,255,.045)",
          borderRadius: "999px",
          bottom: "-220px",
          height: "520px",
          left: "-170px",
          position: "absolute",
          width: "520px"
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1
        }}
      >
        <Brand />
      </div>

      <main
        style={{
          position: "relative",
          zIndex: 1
        }}
      >
        {children}
      </main>

      <footer
        style={{
          alignItems: "center",
          color: "rgba(255,255,255,.78)",
          display: "flex",
          fontSize: "26px",
          fontWeight: 800,
          justifyContent: "space-between",
          position: "relative",
          zIndex: 1
        }}
      >
        <span>{kicker}</span>
        <span
          style={{
            color: accent
          }}
        >
          pokelore.net
        </span>
      </footer>
    </div>
  );
}

function PokemonCard({
  data
}) {
  const name =
    formatPokemonDisplayName(data);

  return (
    <BaseCard
      variant="pokemon"
      kicker="Pokédex Entries • Learnset • Evolution"
    >
      <div
        style={{
          alignItems: "center",
          display: "grid",
          gap: "42px",
          gridTemplateColumns: "1fr 420px"
        }}
      >
        <div>
          <div
            style={{
              color: accent,
              fontSize: "42px",
              fontWeight: 900,
              marginBottom: "8px"
            }}
          >
            #{String(data.id).padStart(4, "0")}
          </div>
          <h1
            style={{
              color: "white",
              fontSize: "86px",
              lineHeight: 0.96,
              margin: "0 0 28px"
            }}
          >
            {name}
          </h1>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "14px",
              marginBottom: "28px"
            }}
          >
            {data.types?.map(type => (
              <TypeBadge
                key={type}
                type={type}
              />
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: "14px"
            }}
          >
            <StatPill
              label="Height"
              value={`${(data.height / 10).toFixed(1)}m`}
            />
            <StatPill
              label="Ability"
              value={formatName(data.abilities?.[0])}
            />
          </div>
        </div>

        <div
          style={{
            alignItems: "center",
            backgroundColor: panel,
            border: `2px solid ${border}`,
            borderRadius: "34px",
            display: "flex",
            height: "360px",
            justifyContent: "center"
          }}
        >
          <img
            src={data.sprite}
            alt={name}
            style={{
              filter:
                "drop-shadow(0 24px 24px rgba(0,0,0,.42))",
              height: "330px",
              objectFit: "contain",
              width: "330px"
            }}
          />
        </div>
      </div>
    </BaseCard>
  );
}

function MoveCard({
  name,
  data
}) {
  return (
    <BaseCard
      variant="move"
      kicker="Move details, effects, and learnset data"
    >
      <div
        style={{
          backgroundColor: panel,
          border: `2px solid ${border}`,
          borderRadius: "34px",
          padding: "42px"
        }}
      >
        <div
          style={{
            marginBottom: "26px"
          }}
        >
          <TypeBadge type={data.type} />
        </div>

        <h1
          style={{
            color: "white",
            fontSize: "92px",
            lineHeight: 0.95,
            margin: "0 0 34px"
          }}
        >
          {formatName(name)}
        </h1>

        <div
          style={{
            display: "flex",
            gap: "16px"
          }}
        >
          <StatPill
            label="Power"
            value={data.power ?? "-"}
          />
          <StatPill
            label="Accuracy"
            value={
              data.accuracy
                ? `${data.accuracy}%`
                : "-"
            }
          />
          <StatPill
            label="PP"
            value={data.pp ?? "-"}
          />
        </div>
      </div>
    </BaseCard>
  );
}

function TopicCard({
  data
}) {
  return (
    <BaseCard
      variant="topic"
      kicker="Explore Pokémon habitats, behaviors, and lore"
    >
      <div
        style={{
          alignItems: "center",
          display: "grid",
          gap: "36px",
          gridTemplateColumns: "1.12fr .88fr"
        }}
      >
        <div>
          <div
            style={{
              color: accent,
              fontSize: "34px",
              fontWeight: 900,
              marginBottom: "14px"
            }}
          >
            {data.pokemonCount ?? 0} Pokémon
          </div>
          <h1
            style={{
              color: "white",
              fontSize: "74px",
              lineHeight: 0.96,
              margin: "0 0 24px"
            }}
          >
            {data.title}
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,.82)",
              fontSize: "32px",
              fontWeight: 700,
              lineHeight: 1.18,
              margin: 0
            }}
          >
            {data.shortDescription}
          </p>
        </div>

        <div
          style={{
            backgroundColor: panel,
            border: `2px solid ${border}`,
            borderRadius: "34px",
            padding: "24px"
          }}
        >
          <SpriteCluster
            sprites={
              data.results?.map(result =>
                result.pokemon
              ) ?? []
            }
          />
        </div>
      </div>
    </BaseCard>
  );
}

function ItemCard({
  data
}) {
  return (
    <BaseCard
      variant="item"
      kicker="Item details, acquisition methods, and related Pokémon"
    >
      <div
        style={{
          alignItems: "center",
          display: "grid",
          gap: "44px",
          gridTemplateColumns: "1fr 300px"
        }}
      >
        <div>
          <div
            style={{
              color: accent,
              fontSize: "34px",
              fontWeight: 900,
              marginBottom: "12px"
            }}
          >
            {data.category?.displayName ??
              formatName(data.category?.name)}
          </div>
          <h1
            style={{
              color: "white",
              fontSize: "90px",
              lineHeight: 0.96,
              margin: "0 0 28px"
            }}
          >
            {data.displayName ??
              formatName(data.name)}
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,.82)",
              fontSize: "34px",
              fontWeight: 700,
              lineHeight: 1.18,
              margin: 0
            }}
          >
            {data.shortEffect ??
              data.effect ??
              "Explore item effects and acquisition data."}
          </p>
        </div>

        <div
          style={{
            alignItems: "center",
            backgroundColor: panel,
            border: `2px solid ${border}`,
            borderRadius: "34px",
            display: "flex",
            height: "300px",
            justifyContent: "center"
          }}
        >
          {data.sprite ? (
            <img
              src={data.sprite}
              alt={data.displayName ?? data.name}
              style={{
                imageRendering: "pixelated",
                height: "180px",
                width: "180px"
              }}
            />
          ) : (
            <span
              style={{
                color: accent,
                fontSize: "110px",
                fontWeight: 900
              }}
            >
              ?
            </span>
          )}
        </div>
      </div>
    </BaseCard>
  );
}

function DefaultCard() {
  return (
    <BaseCard
      variant="default"
      kicker="Pokémon lore, moves, items, locations, and data"
    >
      <div
        style={{
          backgroundColor: panel,
          border: `2px solid ${border}`,
          borderRadius: "34px",
          padding: "48px"
        }}
      >
        <h1
          style={{
            color: "white",
            fontSize: "96px",
            lineHeight: 0.95,
            margin: "0 0 26px"
          }}
        >
          Pokémon Lore Database
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,.84)",
            fontSize: "38px",
            fontWeight: 800,
            lineHeight: 1.16,
            margin: 0
          }}
        >
          Search Pokédex entries, learnsets,
          evolutions, type matchups, item
          acquisition, and wild encounters.
        </p>
      </div>
    </BaseCard>
  );
}

function OgCard({
  variant = "default",
  data,
  name
}) {
  if (variant === "pokemon") {
    return <PokemonCard data={data} />;
  }

  if (variant === "move") {
    return (
      <MoveCard
        name={name}
        data={data}
      />
    );
  }

  if (variant === "topic") {
    return <TopicCard data={data} />;
  }

  if (variant === "item") {
    return <ItemCard data={data} />;
  }

  return <DefaultCard />;
}

export default OgCard;
