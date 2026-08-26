import {
  useEffect,
  useMemo,
  useState
} from "react";
import CollapsibleSection from "./CollapsibleSection";
import LinkedPokeloreText from "./LinkedPokeloreText";
import useSessionState from "../hooks/useSessionState";
import usePokeloreLinkTargets from "../hooks/usePokeloreLinkTargets";
import { resolvePokeloreAnalysis } from "../utils/pokeloreAnalysis";
import { getPokeloreLinePokemonLabels } from "../utils/pokeloreTextLinks";
import { formatPokemonDisplayName } from "../utils/pokemonNames";

const analysisSections = [
  {
    key: "playthrough",
    title: pokemonName =>
      `Using ${pokemonName} in a Playthrough`
  },
  {
    key: "competitive",
    title: pokemonName =>
      `${pokemonName} in Competitive Pokemon`
  },
  {
    key: "nuzlocke",
    title: pokemonName =>
      `${pokemonName} in Nuzlockes`
  }
];

function PokeloreAnalysis({
  pokemon,
  pokemonId,
  titleColor,
  titleChevron = false
}) {
  const resolvedPokemonId = pokemon?.id ?? pokemonId;
  const [expanded, setExpanded] =
    useSessionState(
      `pokemon:${resolvedPokemonId}:pokelore-analysis-expanded`,
      false
    );
  const [loadState, setLoadState] = useState({
    loaded: false,
    analyses: []
  });
  const linkTargets =
    usePokeloreLinkTargets();
  const pokemonName = formatPokemonDisplayName(
    pokemon?.name
      ? pokemon
      : `Pokemon #${resolvedPokemonId}`
  );

  useEffect(() => {
    let isActive = true;

    fetch("/data/PokeloreAnalysis.json")
      .then(response =>
        response.ok ? response.json() : []
      )
      .then(data => {
        if (!isActive) return;
        setLoadState({
          loaded: true,
          analyses: Array.isArray(data) ? data : []
        });
      })
      .catch(error => {
        if (!isActive) return;
        console.warn(
          "Failed to load PokeLore analysis:",
          error
        );
        setLoadState({
          loaded: true,
          analyses: []
        });
      });

    return () => {
      isActive = false;
    };
  }, []);

  const analysis = useMemo(
    () =>
      resolvePokeloreAnalysis(
        loadState.analyses,
        pokemon ?? pokemonId
      ),
    [
      loadState.analyses,
      pokemon,
      pokemonId
    ]
  );
  const excludedPokemonLabels = useMemo(
    () => getPokeloreLinePokemonLabels(analysis),
    [analysis]
  );

  if (loadState.loaded && !analysis) {
    return null;
  }

  const usedLinkRoutes = new Set();

  return (
    <CollapsibleSection
      id={`pokemon-${resolvedPokemonId}-usage-analysis`}
      title={`${pokemonName} Playthrough, Competitive, and Nuzlocke Usage`}
      expanded={expanded}
      titleColor={titleColor}
      titleChevron={titleChevron}
      seoVisible={true}
      onToggle={() =>
        setExpanded(!expanded)
      }
      contentStyle={{
        display: "grid",
        gap: "1rem",
        marginTop: "1rem"
      }}
    >
      {!loadState.loaded && (
        <p>Loading PokeLore analysis...</p>
      )}

      {analysis &&
        analysisSections.map(section => (
          <article
            key={section.key}
            style={{
              backgroundColor: "#202020",
              border: "1px solid #555",
              borderRadius: "8px",
              padding: "1rem",
              textAlign: "left"
            }}
          >
            <h3
              style={{
                color: "#fab856",
                letterSpacing: 0,
                marginTop: 0
              }}
            >
              {section.title(pokemonName)}
            </h3>
            <p
              style={{
                lineHeight: 1.65,
                margin: 0
              }}
            >
              <LinkedPokeloreText
                text={analysis[section.key]}
                linkTargets={linkTargets}
                currentPokemon={pokemon}
                excludedPokemonLabels={
                  excludedPokemonLabels
                }
                usedRoutes={usedLinkRoutes}
              />
            </p>
          </article>
        ))}
    </CollapsibleSection>
  );
}

export default PokeloreAnalysis;
