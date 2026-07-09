import { Link } from "react-router-dom";
import PokemonSummaryCard from "../components/PokemonSummaryCard";

function capitalize(text) {

  return String(text ?? "")
    .split("-")
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");

}

function getEvolutionOverride(
  pokemonName,
  evolutionMethodOverrides
) {
  return evolutionMethodOverrides?.[
    pokemonName
  ] ?? null;
}

function getMethodSlug(method) {
  return (
    method.slug ||
    method.item ||
    method.move ||
    ""
  );
}

function getMethodLabel(method) {
  return (
    method.label ||
    method.text ||
    capitalize(getMethodSlug(method))
  );
}

function shouldSuppressNode(
  node,
  evolutionMethodOverrides
) {
  return Boolean(
    getEvolutionOverride(
      node.pokemon?.name,
      evolutionMethodOverrides
    )?.suppressEvolutionNode
  );
}

function getSourcePokemonName(
  node,
  evolutionMethodOverrides
) {
  return getEvolutionOverride(
    node.pokemon?.name,
    evolutionMethodOverrides
  )?.sourcePokemonName ?? null;
}

function shouldShowChildNode(
  child,
  displayedPokemon,
  evolutionMethodOverrides
) {
  if (
    shouldSuppressNode(
      child,
      evolutionMethodOverrides
    )
  ) {
    return false;
  }

  const sourcePokemonName =
    getSourcePokemonName(
      child,
      evolutionMethodOverrides
    );

  if (!sourcePokemonName) {
    return true;
  }

  return (
    sourcePokemonName ===
    displayedPokemon?.name
  );
}

function findSourceOverrideName(
  node,
  currentPokemonName,
  evolutionMethodOverrides
) {
  if (!currentPokemonName) {
    return null;
  }

  for (const child of node.evolvesTo ?? []) {
    const childNames = [
      child.pokemon?.name,
      ...(child.varieties ?? []).map(
        variety => variety.name
      )
    ].filter(Boolean);

    if (
      childNames.includes(
        currentPokemonName
      )
    ) {
      const matchingOverride =
        getEvolutionOverride(
          currentPokemonName,
          evolutionMethodOverrides
        ) ||
        getEvolutionOverride(
          child.pokemon?.name,
          evolutionMethodOverrides
        );

      if (
        matchingOverride?.sourcePokemonName
      ) {
        return matchingOverride
          .sourcePokemonName;
      }
    }
  }

  return null;
}

function getEvolutionDescription(node) {

  const parts = [];

  if (node.trigger === "level-up") {
    parts.push("Lvl. up");
  }

  if (node.trigger === "trade") {
    parts.push("Trade");
  }

  if (node.trigger === "use-item") {
    parts.push("");
  }

  if (node.trigger === "use-move") {
    if (
      node.useMove ||
      node.requiredMove
    ) {
      parts.push(
        `use ${capitalize(
          node.useMove ||
            node.requiredMove
        )}`
      );
    } else {
      parts.push("use move");
    }
  }

  if (node.item) {
    parts.push(
      capitalize(node.item)
    );
  }

  if (node.heldItem) {
    parts.push(
      `holding ${capitalize(node.heldItem)}`
    );
  }

  if (node.minLevel) {
    parts.push(
      `at level ${node.minLevel}`
    );
  }

  if (node.minHappiness) {
    parts.push(
      " high friendship"
    );
  }

  if (node.minBeauty) {
    parts.push(
      "with high beauty"
    );
  }

  if (node.minAffection) {
    parts.push(
      "with high affection"
    );
  }

  if (node.timeOfDay) {
    parts.push(
      node.timeOfDay === "full-moon"
        ? "during a full moon"
        : `during the ${node.timeOfDay}`
    );
  }

  if (node.knownMove) {
    parts.push(
      `knowing ${capitalize(
        node.knownMove
      )}`
    );
  }

  if (node.knownMoveType) {
    parts.push(
      `knowing a ${capitalize(
        node.knownMoveType
      )}-type move`
    );
  }

  if (node.location) {
    parts.push(
      `at ${capitalize(
        node.location
      )}`
    );
  }

  if (node.partySpecies) {
    parts.push(
      `with ${capitalize(
        node.partySpecies
      )} in party`
    );
  }

  if (node.partyType) {
    parts.push(
      `with a ${capitalize(
        node.partyType
      )}-type Pokémon in party`
    );
  }

  if (node.tradeSpecies) {
    parts.push(
      `with ${capitalize(
        node.tradeSpecies
      )}`
    );
  }

  if (node.gender === 1) {
    parts.push("female only");
  }

  if (node.gender === 2) {
    parts.push("male only");
  }

  if (node.relativePhysicalStats === 1) {
    parts.push("Attack > Defense");
  }

  if (node.relativePhysicalStats === -1) {
    parts.push("Attack < Defense");
  }

  if (node.relativePhysicalStats === 0) {
    parts.push("Attack = Defense");
  }

  if (node.needsOverworldRain) {
    parts.push("during rain");
  }

  if (node.turnUpsideDown) {
    parts.push(
      "while holding the console upside down"
    );
  }

  return parts.join(" ");
}

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
        {label || capitalize(itemName)}
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
        {label || capitalize(moveName)}
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
        {label || capitalize(locationName)}
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

    return (
      <span key={index}>
        {segment.text ?? ""}
      </span>
    );
  }

  function renderMethod(method) {
    if (method.segments) {
      return (
        <>
          {method.segments.map(
            renderLinkedSegment
          )}
        </>
      );
    }

    if (
      method.type === "item" ||
      method.type === "use-item"
    ) {
      return itemLink(
        getMethodSlug(method),
        getMethodLabel(method)
      );
    }

    if (method.type === "move") {
      return moveLink(
        getMethodSlug(method),
        getMethodLabel(method)
      );
    }

    if (method.type === "location") {
      return locationLink(
        getMethodSlug(method),
        getMethodLabel(method)
      );
    }

    return getMethodLabel(method);
  }

  const override =
    getEvolutionOverride(
      displayedPokemon?.name,
      evolutionMethodOverrides
    ) ||
    getEvolutionOverride(
      node.pokemon?.name,
      evolutionMethodOverrides
    );

  const parts = [];

  if (override?.primaryMethod) {
    parts.push(
      renderMethod(
        override.primaryMethod
      )
    );
  } else {

    if (node.trigger === "level-up") {
      parts.push("Lvl. up");
    }

    if (node.trigger === "trade") {
      parts.push("Trade");
    }

    if (node.item) {
      parts.push(
        itemLink(node.item)
      );
    }

    if (node.heldItem) {
      parts.push(
        <>
          holding{" "}
          {itemLink(node.heldItem)}
        </>
      );
    }

    if (node.trigger === "use-move") {
      const moveName =
        node.useMove ||
        node.requiredMove;

      if (moveName) {
        parts.push(
          <>
            use{" "}
            {moveLink(moveName)}
            {node.requiredMoveUses ||
            node.moveUses
              ? ` ${node.requiredMoveUses || node.moveUses} times`
              : ""}
          </>
        );
      } else {
        parts.push("Use move");
      }
    }

    const remainingDescription =
      getEvolutionDescription({
        ...node,
        item: null,
        heldItem: null,
        trigger: node.trigger === "use-item"
          ? null
          : node.trigger === "use-move"
            ? null
            : undefined
      });

    if (remainingDescription) {
      parts.push(
        remainingDescription
      );
    }

  }

  const additionalItems =
    override?.additionalMethods?.filter(
      method =>
        method.type === "use-item" ||
        method.type === "item"
    ) ?? [];

  additionalItems.forEach(
    method => {
      parts.push(
        <>
          / {renderMethod(method)}
        </>
      );
    }
  );

  return (
    <>
      {parts.map((part, index) => (
        <span key={index}>
          {part}
          {index < parts.length - 1
            ? " "
            : ""}
        </span>
      ))}
    </>
  );
}

function getDisplayedPokemon(
  node,
  activeFormKey,
  currentPokemonName,
  evolutionMethodOverrides
) {
  const matchingCurrentVariety =
    node.varieties?.find(
      variety =>
        variety.name ===
        currentPokemonName
    );

  if (matchingCurrentVariety) {
    return matchingCurrentVariety;
  }

  if (!activeFormKey) {
    const sourceOverrideName =
      findSourceOverrideName(
        node,
        currentPokemonName,
        evolutionMethodOverrides
      );

    const sourceOverrideVariety =
      node.varieties?.find(
        variety =>
          variety.name ===
          sourceOverrideName
      );

    return (
      sourceOverrideVariety ||
      node.pokemon
    );
  }

  const matchingVariety =
    node.varieties?.find(
      variety =>
        variety.name.endsWith(
          `-${activeFormKey}`
        )
    );

  return (
    matchingVariety ||
    node.pokemon
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
    getDisplayedPokemon(
      node,
      activeFormKey,
      currentPokemonName,
      evolutionMethodOverrides
    );

  const visibleChildren =
    (node.evolvesTo ?? []).filter(
      child =>
        shouldShowChildNode(
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
      width: "80px",
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

export default EvolutionNode;
