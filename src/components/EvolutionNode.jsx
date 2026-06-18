import { useNavigate } from "react-router-dom";
import PokemonSummaryCard from "../components/PokemonSummaryCard";

function capitalize(text) {

  return text
    .split("-")
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");

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
      `during the ${node.timeOfDay}`
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

  if (node.turnUpsideDown) {
    parts.push(
      "while holding the console upside down"
    );
  }

  return parts.join(" ");
}

function EvolutionDescription({
  node
}) {
  const navigate = useNavigate();

  function itemLink(itemName) {
    return (
      <button
        onClick={() =>
          navigate(
            `/item/${itemName}`
          )
        }
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
        {capitalize(itemName)}
      </button>
    );
  }

  const parts = [];

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

  const remainingDescription =
    getEvolutionDescription({
      ...node,
      item: null,
      heldItem: null,
      trigger: node.trigger === "use-item"
        ? null
        : undefined
    });

  if (remainingDescription) {
    parts.push(
      remainingDescription
    );
  }

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






function EvolutionNode({
  node,rootRef,isRoot
}) {
  return (







    
    <div
      style={{
        display: "flex",
        width: "100%",
        flexDirection: "column",
      marginBottom: "2rem",
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
    />
     <div> ↓</div>
  </div>
 
)}
 




{/* //--------------------------------- pokemon name button --------------------------------- */}



<div ref={isRoot ? rootRef : null}>
  <PokemonSummaryCard
    pokemon={node.pokemon}
    compact={true}
  />
</div>


      {node.evolvesTo.length >
        0 && (

        <div
          style={{
            display: "flex",
            gap: "1rem"
          }}
        >

          {node.evolvesTo.map(
            child => (

              <EvolutionNode
                key={
                  child.pokemon.id
                }
                node={child}
              />

            )
          )}

        </div>

      )}

    </div>

  );

}

export default EvolutionNode;
