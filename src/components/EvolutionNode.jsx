import { useNavigate }
from "react-router-dom";

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

function EvolutionNode({
  node
}) {

  const navigate =
    useNavigate();

  return (







    
    <div
      style={{
        display: "flex",
        flexDirection: "column",
      marginBottom: "2rem",
      marginTop: "2rem",
        alignItems: "center",
        gap: ".5rem",
        // border: "1px solid",
      }}
    >
        






        

{/* //------------------------------- trigger and conditions --------------------------------- */}

      {/* {node.trigger && (
        

        <div
          style={{
            fontSize: ".8rem"
          }}
        >


          {node.minLevel &&
            `Lv. ${node.minLevel}`}

          {node.item &&
            ` ${node.item}`}

          {node.heldItem &&
            ` Hold ${node.heldItem}`}
           
           
        </div>
      )} */}




{/* -------------------- Evolution Conditions -------------------- */}

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









{/* //--------------------------------- pokemon name button --------------------------------- */}


      <button
      style={{
        fontSize: "1.2rem",
        fontWeight: "bold",
        borderradius: "8px",
      }}
        onClick={() =>
          navigate(
            `/pokemon/${node.pokemon.id}`
          )
        }
      >
        {capitalize(
          node.pokemon.name
        )}
      </button>








      {node.evolvesTo.length >
        0 && (

        <div
          style={{
            display: "flex",
            gap: "2rem"
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