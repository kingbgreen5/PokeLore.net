import { useNavigate }
from "react-router-dom";


import PokemonSummaryCard from "../components/PokemonSummaryCard";
import typeColors from "../constants/typeColors";

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






function EvolutionNode({
  node,rootRef,isRoot
}) {

  const navigate =
    useNavigate();

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
    {getEvolutionDescription(
      node
    )}
     <div> ↓</div>
  </div>
 
)}
 
{/* -------------------- Evolution Conditions -------------------- */}
{/* 
{node.trigger && (
<div>
I




  <div
    style={{
      fontSize: "1rem",
      display: "flex",
      flexDirection: "column",
    marginBottom: "1rem",
    marginTop: "1rem",
    padding: ".2rem",
      textAlign: "center",
      border: "1px solid",
      borderRadius: "8px",
    }}
  >

    <strong>
     {capitalize(node.trigger)}
    </strong>

    {node.minLevel && (
      <div>
        Lv. {node.minLevel}
      </div>
    )}

    {node.item && (
      <div>
       {capitalize(node.item)}
      </div>
    )}

    {node.heldItem && (
      <div>
        Hold {capitalize(node.heldItem)}
      </div>
    )}

    {node.knownMove && (
      <div>
        Knows {capitalize(node.knownMove)}
      </div>
    )}

    {node.knownMoveType && (
      <div>
        Knows {capitalize(node.knownMoveType)}
        -type move
      </div>
    )}

    {node.minHappiness && (
      <div>
        Happiness ≥ {node.minHappiness}
      </div>
    )}

    {node.minBeauty && (
      <div>
        Beauty ≥ {node.minBeauty}
      </div>
    )}

    {node.minAffection && (
      <div>
        Affection ≥ {node.minAffection}
      </div>
    )}

    {node.gender !== null && (
      <div>
        {node.gender === 1
          ? "Female"
          : "Male"}
      </div>
    )}

    {node.location && (
      <div>
        At {capitalize(node.location)}
      </div>
    )}

    {node.timeOfDay && (
      <div>
        Time: {capitalize(node.timeOfDay)}
      </div>
    )}

    {node.tradeSpecies && (
      <div>
        Trade for{" "}
        {capitalize(
          node.tradeSpecies
        )}
      </div>
    )}

    {node.partySpecies && (
      <div>
        Party:{" "}
        {capitalize(
          node.partySpecies
        )}
      </div>
    )}

    {node.partyType && (
      <div>
        Party Type:{" "}
        {capitalize(
          node.partyType
        )}
      </div>
    )}

    {node.turnUpsideDown && (
      <div>
        Hold console upside down
      </div>
    )}

    {node.relativePhysicalStats !== null && (
      <div>
        {node.relativePhysicalStats === 1 &&
          "Attack > Defense"}

        {node.relativePhysicalStats === 0 &&
          "Attack = Defense"}

        {node.relativePhysicalStats === -1 &&
          "Attack < Defense"}
      </div>
    )}

    {node.needsOverworldRain && (
      <div>
        While raining
      </div>
    )}

  </div>


</div>


)}
 */}








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