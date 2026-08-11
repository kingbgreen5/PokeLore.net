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

function capitalize(text) {
  return String(text)
    .split("-")
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function formatHeightEnglish(height) {
  const totalInches = Math.round(
    (height / 10) * 39.3701
  );
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;

  return `${feet}' ${inches}"`;
}

function formatHeightMetric(height) {
  return `${(height / 10).toFixed(1)} m`;
}

function formatWeightEnglish(weight) {
  const pounds = (weight / 10) * 2.20462;
  return `${pounds.toFixed(1)} lbs`;
}

function formatWeightMetric(weight) {
  return `${(weight / 10).toFixed(1)} kg`;
}

function PokemonBiologyData({
  pokemon,
  titleColor,
  titleChevron = false
}) {
  const [expanded, setExpanded] =
    useSessionState(
      `pokemon:${pokemon.id}:biology-and-behavior-expanded`,
      false
    );
  const [loadState, setLoadState] = useState({
    loaded: false,
    analyses: []
  });
  const linkTargets =
    usePokeloreLinkTargets();
  const pokemonName =
    formatPokemonDisplayName(pokemon);

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
          "Failed to load PokeLore biology:",
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
        pokemon
      ),
    [
      loadState.analyses,
      pokemon
    ]
  );
  const excludedPokemonLabels = useMemo(
    () => getPokeloreLinePokemonLabels(analysis),
    [analysis]
  );

  const biologicalFacts = [
    {
      label: "Species",
      value: pokemon.genus
    },
    {
      label: "Height",
      value: `${formatHeightEnglish(
        pokemon.height
      )} (${formatHeightMetric(
        pokemon.height
      )})`
    },
    {
      label: "Weight",
      value: `${formatWeightEnglish(
        pokemon.weight
      )} (${formatWeightMetric(
        pokemon.weight
      )})`
    },
    {
      label: "Habitat",
      value: pokemon.habitat
        ? capitalize(pokemon.habitat)
        : "Currently Unknown"
    },
    {
      label: "Color",
      value: capitalize(pokemon.color)
    },
    {
      label: "Body Style",
      value: capitalize(pokemon.shape)
    }
  ];
  const usedLinkRoutes = new Set();

  return (
    <CollapsibleSection
      id={`pokemon-${pokemon.id}-biology-and-behavior`}
      title={`${pokemonName} Biology and Behavior`}
      summary="Species, size, habitat, color, and behavior"
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
        <p>Loading PokeLore biology...</p>
      )}

      {analysis?.biologyAndBehavior && (
        <article
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
            {pokemonName} Biology and Behavior
          </h3>
          <p
            style={{
              lineHeight: 1.65,
              margin: 0
            }}
          >
            <LinkedPokeloreText
              text={analysis.biologyAndBehavior}
              linkTargets={linkTargets}
              currentPokemon={pokemon}
              excludedPokemonLabels={
                excludedPokemonLabels
              }
              usedRoutes={usedLinkRoutes}
            />
          </p>
        </article>
      )}

      <section
        aria-labelledby={`pokemon-${pokemon.id}-biological-data-heading`}
        style={{
          backgroundColor: "#202020",
          border: "1px solid #555",
          borderRadius: "8px",
          padding: "1rem",
          textAlign: "left"
        }}
      >
        <h3
          id={`pokemon-${pokemon.id}-biological-data-heading`}
          style={{
            color: "#fab856",
            letterSpacing: 0,
            marginTop: 0
          }}
        >
          {pokemonName} Biological Data
        </h3>
        <div
          style={{
            display: "grid",
            gap: ".75rem",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(170px, 1fr))",
            textAlign: "left"
          }}
        >
          {biologicalFacts.map(fact => (
            <div
              key={fact.label}
              style={{
                backgroundColor: "#17171d",
                border: "1px solid #555",
                borderRadius: "8px",
                padding: ".85rem 1rem"
              }}
            >
              <div
                style={{
                  color: "#fab856",
                  fontSize: ".8rem",
                  fontWeight: 700,
                  letterSpacing: 0,
                  marginBottom: ".25rem"
                }}
              >
                {fact.label}
              </div>
              <div>{fact.value}</div>
            </div>
          ))}
        </div>
      </section>
    </CollapsibleSection>
  );
}

export default PokemonBiologyData;
