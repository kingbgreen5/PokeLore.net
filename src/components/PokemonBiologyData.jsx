import {
  useEffect,
  useMemo,
  useState
} from "react";
import CollapsibleSection from "./CollapsibleSection";
import useSessionState from "../hooks/useSessionState";
import { resolvePokeloreAnalysis } from "../utils/pokeloreAnalysis";

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
        pokemon.id
      ),
    [
      loadState.analyses,
      pokemon.id
    ]
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

  return (
    <CollapsibleSection
      title="Biology and Behavior"
      summary="Species, size, habitat, color, and behavior"
      expanded={expanded}
      titleColor={titleColor}
      titleChevron={titleChevron}
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
          <p
            style={{
              lineHeight: 1.65,
              margin: 0
            }}
          >
            {analysis.biologyAndBehavior}
          </p>
        </article>
      )}

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
              backgroundColor: "#202020",
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
    </CollapsibleSection>
  );
}

export default PokemonBiologyData;
