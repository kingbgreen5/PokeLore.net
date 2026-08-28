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
  evolutionMethodOverrides,
  horizontalLayout = false
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
      className={`evolution-node${
        horizontalLayout
          ? " evolution-node-horizontal"
          : ""
      }`}
    >
        





        

{/* //------------------------------- trigger and conditions --------------------------------- */}


{node.trigger && (
  <div
    className="evolution-method"
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
     <span
       aria-hidden="true"
       className="evolution-method-arrow"
     />
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

        <div className="evolution-children">

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
                horizontalLayout={
                  horizontalLayout
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
