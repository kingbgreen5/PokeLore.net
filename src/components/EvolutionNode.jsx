import { Link } from "react-router-dom";
import PokemonSummaryCard from "../components/PokemonSummaryCard";
import { formatPokemonDisplayName }
from "../utils/pokemonNames";
import {
  capitalizeEvolutionText,
  collectPokemonSummaries,
  getDisplayedEvolutionPokemon,
  getEvolutionMethodOverride,
  getEvolutionMethodParts,
  getFallbackPokemonSummary,
  getVersionNotes,
  getVisibleFormEvolutionPaths,
  shouldShowEvolutionChildNode
} from "../utils/evolutionDisplay";

function EvolutionDescription({
  node,
  displayedPokemon,
  evolutionMethodOverrides
}) {
  function itemLink(
    itemName,
    label = null
  ) {
    return (
      <Link
        to={`/item/${itemName}`}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          font: "inherit",
          fontWeight: "bold",
          padding: 0,
          textDecoration:
            "underline"
        }}
      >
        {label ||
          capitalizeEvolutionText(
            itemName
          )}
      </Link>
    );
  }

  function moveLink(
    moveName,
    label = null
  ) {
    return (
      <Link
        to={`/move/${moveName}`}
        style={{
          background: "none",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          font: "inherit",
          fontWeight: "bold",
          padding: 0,
          textDecoration:
            "underline"
        }}
      >
        {label ||
          capitalizeEvolutionText(
            moveName
          )}
      </Link>
    );
  }

  function locationLink(
    locationName,
    label = null
  ) {
    return (
      <Link
        to={`/location/${locationName}`}
        style={{
          background: "none",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          font: "inherit",
          fontWeight: "bold",
          padding: 0,
          textDecoration:
            "underline"
        }}
      >
        {label ||
          capitalizeEvolutionText(
            locationName
          )}
      </Link>
    );
  }

  function topicLink(
    topicSlug,
    label = null
  ) {
    return (
      <Link
        to={`/topic/${topicSlug}`}
        style={{
          background: "none",
          border: "none",
          color: "var(--link-unvisited)",
          cursor: "pointer",
          font: "inherit",
          fontWeight: "bold",
          padding: 0,
          textDecoration:
            "underline"
        }}
      >
        {label ||
          capitalizeEvolutionText(
            topicSlug
          )}
      </Link>
    );
  }

  function renderLinkedSegment(
    segment,
    index
  ) {
    if (typeof segment === "string") {
      return (
        <span key={index}>
          {segment}
        </span>
      );
    }

    if (segment.type === "item") {
      return (
        <span key={index}>
          {itemLink(
            segment.slug,
            segment.text
          )}
        </span>
      );
    }

    if (segment.type === "move") {
      return (
        <span key={index}>
          {moveLink(
            segment.slug,
            segment.text
          )}
        </span>
      );
    }

    if (segment.type === "location") {
      return (
        <span key={index}>
          {locationLink(
            segment.slug,
            segment.text
          )}
        </span>
      );
    }

    if (segment.type === "topic") {
      return (
        <span key={index}>
          {topicLink(
            segment.slug,
            segment.text
          )}
        </span>
      );
    }

    return (
      <span key={index}>
        {segment.text ?? ""}
      </span>
    );
  }

  const override =
    getEvolutionMethodOverride(
      node,
      displayedPokemon,
      evolutionMethodOverrides
    );
  const parts =
    getEvolutionMethodParts(
      node,
      displayedPokemon,
      evolutionMethodOverrides
    ).map(renderLinkedSegment);

  return (
    <>
      {parts}
      {override?.note && (
        <span
          style={{
            display: "block",
            fontSize: ".72rem",
            marginTop: ".25rem",
            opacity: 0.8
          }}
        >
          {override.note}
        </span>
      )}
    </>
  );
}

function EvolutionNode({
  node,
  rootRef,
  isRoot,
  activeFormKey,
  currentPokemonName,
  evolutionMethodOverrides
}) {
  const displayedPokemon =
    getDisplayedEvolutionPokemon(
      node,
      activeFormKey,
      currentPokemonName,
      evolutionMethodOverrides
    );

  const visibleChildren =
    (node.evolvesTo ?? []).filter(
      child =>
        shouldShowEvolutionChildNode(
          child,
          displayedPokemon,
          evolutionMethodOverrides
        )
    );

  return (







    
    <div
      style={{
        display: "flex",
        width: "100%",
        flexDirection: "column",
      marginBottom: "1rem",
      marginTop: "auto",
        alignItems: "center",

        // gap: ".1rem",
        // border: "1px solid",
      }}
    >
        





        

{/* //------------------------------- trigger and conditions --------------------------------- */}


{node.trigger && (
  <div
    style={{
      fontSize: ".8rem",
      textAlign: "center",
      width: "clamp(80px, 12vw, 170px)",
     lineHeight: 1.1,
     marginBottom: "1rem",
     marginTop: "1rem",

    }}
  >
    <EvolutionDescription
      node={node}
      displayedPokemon={
        displayedPokemon
      }
      evolutionMethodOverrides={
        evolutionMethodOverrides
      }
    />
     <div> ↓</div>
  </div>
 
)}
 




{/* //--------------------------------- pokemon name button --------------------------------- */}



<div ref={isRoot ? rootRef : null}>
  <PokemonSummaryCard
    pokemon={displayedPokemon}
    compact={true}
  />
</div>


      {visibleChildren.length >
        0 && (

        <div
          style={{
            display: "flex",
            gap: "1rem"
          }}
        >

          {visibleChildren.map(
            child => (

              <EvolutionNode
                key={
                  child.pokemon.id
                }
                node={child}
                activeFormKey={
                  activeFormKey
                }
                currentPokemonName={
                  currentPokemonName
                }
                evolutionMethodOverrides={
                  evolutionMethodOverrides
                }
              />

            )
          )}

        </div>

      )}

    </div>

  );

}

function FormEvolutionPath({
  path,
  pokemonSummaries
}) {
  const basePokemon =
    pokemonSummaries[path.basePokemon] ||
    getFallbackPokemonSummary(
      path.basePokemon
    );
  const evolvedPokemon =
    pokemonSummaries[path.evolvesTo] ||
    getFallbackPokemonSummary(
      path.evolvesTo
    );
  const condition =
    path.displayCondition ||
    path.condition ||
    "Evolution method varies";
  const versionNotes =
    getVersionNotes(path);
  const accessibleLabel =
    path.accessibleLabel ||
    `${formatPokemonDisplayName(
      basePokemon
    )} evolves into ${formatPokemonDisplayName(
      evolvedPokemon
    )}. ${condition}.`;

  return (
    <section
      aria-label={accessibleLabel}
      className="form-evolution-path"
    >
      <PokemonSummaryCard
        pokemon={basePokemon}
        compact={true}
      />

      <div
        className="form-evolution-condition"
      >
        <span>{condition}</span>
        <span aria-hidden="true">
          ↓
        </span>
        {versionNotes.map(
          note => (
            <small key={note}>
              {note}
            </small>
          )
        )}
      </div>

      <PokemonSummaryCard
        pokemon={evolvedPokemon}
        compact={true}
      />
    </section>
  );
}

export function FormEvolutionPaths({
  root,
  paths,
  currentPokemonName
}) {
  const pokemonSummaries =
    collectPokemonSummaries(root);
  const matchingPaths =
    getVisibleFormEvolutionPaths(
      paths,
      currentPokemonName
    );

  return (
    <div className="form-evolution-paths">
      {matchingPaths.map(path => (
        <FormEvolutionPath
          key={`${path.basePokemon}-${path.evolvesTo}`}
          path={path}
          pokemonSummaries={
            pokemonSummaries
          }
        />
      ))}
    </div>
  );
}

export default EvolutionNode;
