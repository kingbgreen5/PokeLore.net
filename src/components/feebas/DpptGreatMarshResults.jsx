import {
  useEffect,
  useMemo,
  useState
} from "react";
import { Link } from "react-router-dom";
import CollapsibleSection from "../CollapsibleSection";
import {
  calculateDpptGreatMarshCandidateResults,
  DPPT_GREAT_MARSH_GAME_TABLES
} from "../../utils/dpptGreatMarsh";
import { formatPokemonDisplayName } from "../../utils/pokemonNames";
import { getPokemonUrl } from "../../utils/pokemonUrls";
import "./DpptGreatMarshResults.css";

const GAME_ORDER = ["platinum", "diamondPearl"];
const SAVE_GAME_TO_MARSH_GAME = {
  platinum: "platinum",
  "diamond-pearl": "diamondPearl"
};

function getPokemonFallback(pokemonId) {
  return {
    id: pokemonId,
    name: String(pokemonId),
    sprite: "",
    types: []
  };
}

function getPokemonDetailPath(pokemon) {
  return getPokemonUrl(pokemon);
}

function MarshPokemonCard({
  entry,
  pokemon
}) {
  const resolvedPokemon =
    pokemon ?? getPokemonFallback(entry.pokemonId);
  const displayName = pokemon
    ? formatPokemonDisplayName(resolvedPokemon)
    : `Pokemon #${entry.pokemonId}`;
  const detailPath = getPokemonDetailPath(resolvedPokemon);

  return (
    <Link
      className="dppt-great-marsh-card"
      to={detailPath ?? "#"}
      aria-disabled={!detailPath}
      onClick={event => {
        if (!detailPath) {
          event.preventDefault();
        }
      }}
    >
      <span className="dppt-great-marsh-area">
        Area {entry.area}
      </span>
      {resolvedPokemon.sprite ? (
        <img
          alt={displayName}
          loading="lazy"
          src={resolvedPokemon.sprite}
        />
      ) : (
        <span
          aria-hidden="true"
          className="dppt-great-marsh-fallback-sprite"
        />
      )}
      <strong>{displayName}</strong>
    </Link>
  );
}

function MarshGameSection({
  game,
  result,
  pokemonById
}) {
  const table = DPPT_GREAT_MARSH_GAME_TABLES[game];
  const entries = result[game] ?? [];

  return (
    <section className="dppt-great-marsh-version">
      <h4>{table.label}</h4>
      <div className="dppt-great-marsh-grid">
        {entries.map(entry => (
          <MarshPokemonCard
            entry={entry}
            key={`${game}-${entry.area}`}
            pokemon={pokemonById.get(entry.pokemonId)}
          />
        ))}
      </div>
    </section>
  );
}

function getGameOrder(preferredGame) {
  const preferredMarshGame =
    SAVE_GAME_TO_MARSH_GAME[preferredGame];

  if (!preferredMarshGame) {
    return GAME_ORDER;
  }

  return [
    preferredMarshGame,
    ...GAME_ORDER.filter(game => game !== preferredMarshGame)
  ];
}

function DpptGreatMarshResults({
  candidates = [],
  preferredGame
}) {
  const [expanded, setExpanded] = useState(false);
  const [pokemonIndex, setPokemonIndex] = useState([]);
  const candidateResults = useMemo(
    () => calculateDpptGreatMarshCandidateResults(candidates),
    [candidates]
  );
  const pokemonById = useMemo(
    () =>
      new Map(
        pokemonIndex.map(pokemon => [pokemon.id, pokemon])
      ),
    [pokemonIndex]
  );
  const gameOrder = useMemo(
    () => getGameOrder(preferredGame),
    [preferredGame]
  );

  useEffect(() => {
    let isActive = true;

    fetch("/data/pokemonIndex.json")
      .then(response => (response.ok ? response.json() : []))
      .then(data => {
        if (!isActive) return;
        setPokemonIndex(Array.isArray(data) ? data : []);
      })
      .catch(error => {
        if (import.meta.env.DEV) {
          console.warn(
            "Failed to load Pokemon index for Great Marsh results:",
            error
          );
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV || pokemonIndex.length === 0) {
      return;
    }

    const missingIds = [
      ...new Set(
        candidateResults.flatMap(candidate =>
          [
            ...candidate.results.platinum,
            ...candidate.results.diamondPearl
          ]
            .map(entry => entry.pokemonId)
            .filter(id => !pokemonById.has(id))
        )
      )
    ];

    if (missingIds.length > 0) {
      console.warn(
        `Missing Pokemon metadata for Great Marsh IDs: ${missingIds.join(", ")}`
      );
    }
  }, [candidateResults, pokemonById, pokemonIndex.length]);

  if (candidateResults.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection
      className="dppt-great-marsh-results"
      title="Today's Great Marsh Pokemon"
      summary="Post-National Dex daily Pokemon"
      expanded={expanded}
      onToggle={() => setExpanded(current => !current)}
      titleChevron
      titleColor="#bae6fd"
      summaryColor="#7dd3fc"
      contentStyle={{
        marginTop: "0.8rem"
      }}
      style={{
        background: "rgba(14, 165, 233, 0.12)",
        border: "1px solid rgba(125, 211, 252, 0.58)",
        borderRadius: "8px",
        boxShadow: "inset 0 0 0 1px rgba(14, 165, 233, 0.08)"
      }}
    >
      <div className="dppt-great-marsh-body">
        <p>
          Each day, one special Pokemon is assigned to each of the
          Great Marsh's six areas.
        </p>
        <p>
          Use the binoculars upstairs in the Great Marsh entrance to
          preview Pokemon and identify their areas. A daily Pokemon is
          not guaranteed in every encounter, so search the grass in
          the listed area until it appears.
        </p>
        <p className="dppt-great-marsh-note">
          Before obtaining the National Dex, some Pokemon are replaced
          by species from the Sinnoh Pokedex.
        </p>

        <div className="dppt-great-marsh-candidates">
          {candidateResults.map(candidate => (
            <section
              className={`dppt-great-marsh-candidate ${candidate.colorRole}`}
              key={candidate.groupSeedUnsigned}
            >
              {candidateResults.length > 1 && (
                <h3>Possible Result {candidate.candidateNumber}</h3>
              )}
              {gameOrder.map(game => (
                <MarshGameSection
                  game={game}
                  key={`${candidate.groupSeedUnsigned}-${game}`}
                  pokemonById={pokemonById}
                  result={candidate.results}
                />
              ))}
            </section>
          ))}
        </div>
      </div>
    </CollapsibleSection>
  );
}

export default DpptGreatMarshResults;
