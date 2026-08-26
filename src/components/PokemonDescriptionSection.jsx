import {
  useEffect,
  useMemo,
  useState
} from "react";
import LinkedPokeloreText from "./LinkedPokeloreText";
import usePokeloreLinkTargets from "../hooks/usePokeloreLinkTargets";
import { resolvePokeloreAnalysis } from "../utils/pokeloreAnalysis";
import { getPokeloreLinePokemonLabels } from "../utils/pokeloreTextLinks";
import { formatPokemonDisplayName } from "../utils/pokemonNames";

function PokemonDescriptionSection({
  pokemon
}) {
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
          "Failed to load PokeLore descriptions:",
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
  const description =
    analysis?.description?.trim();
  const excludedPokemonLabels = useMemo(
    () => getPokeloreLinePokemonLabels(analysis),
    [analysis]
  );
  const usedLinkRoutes = new Set();

  if (!loadState.loaded || !description) {
    return null;
  }

  return (
    <section
      id={`pokemon-${pokemon.id}-description`}
      aria-label={`${pokemonName}'s Description`}
      style={{
        boxSizing: "border-box",
        margin: "0 auto 1rem",
        maxWidth: "42rem",
        textAlign: "left",
        width: "100%"
      }}
    >
      <p
        style={{
          fontSize: ".9rem",
          lineHeight: 1.6,
          margin: 0
        }}
      >
        <LinkedPokeloreText
          text={description}
          linkTargets={linkTargets}
          currentPokemon={pokemon}
          excludedPokemonLabels={
            excludedPokemonLabels
          }
          usedRoutes={usedLinkRoutes}
        />
      </p>
    </section>
  );
}

export default PokemonDescriptionSection;
