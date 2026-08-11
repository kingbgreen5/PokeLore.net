import {
  useEffect,
  useMemo,
  useState
} from "react";
import CollapsibleSection from "./CollapsibleSection";
import useSessionState from "../hooks/useSessionState";
import { resolvePokeloreAnalysis } from "../utils/pokeloreAnalysis";

const analysisSections = [
  {
    key: "playthrough",
    title: "Playthrough"
  },
  {
    key: "competitive",
    title: "Competitive"
  },
  {
    key: "nuzlocke",
    title: "Nuzlocke"
  }
];

function PokeloreAnalysis({
  pokemonId,
  titleColor,
  titleChevron = false
}) {
  const [expanded, setExpanded] =
    useSessionState(
      `pokemon:${pokemonId}:pokelore-analysis-expanded`,
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
        pokemonId
      ),
    [
      loadState.analyses,
      pokemonId
    ]
  );

  if (loadState.loaded && !analysis) {
    return null;
  }

  return (
    <CollapsibleSection
      title="Playthrough, Competitive, and Nuzlocke Usage"
      summary={
        loadState.loaded
          ? "Playthrough, competitive, and Nuzlocke"
          : "Loading analysis"
      }
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
              {section.title}
            </h3>
            <p
              style={{
                lineHeight: 1.65,
                margin: 0
              }}
            >
              {analysis[section.key]}
            </p>
          </article>
        ))}
    </CollapsibleSection>
  );
}

export default PokeloreAnalysis;
