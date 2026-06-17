import { useNavigate } from "react-router-dom";
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

function MoveSummaryCard({
  name,
  move
}) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() =>
        navigate(`/move/${name}`)
      }
      style={{
        border: "1px solid #666",
        borderRadius: "12px",
        cursor: "pointer",
        padding: ".1rem"
      }}
    >
      <h3>
        {capitalize(name)}
      </h3>

      <span
        style={{
          backgroundColor:
            typeColors[move.type],
          borderRadius: "999px",
          color: "white",
          padding: ".25rem .75rem"
        }}
      >
        {move.type}
      </span>

      <div
        style={{
          marginTop: "1rem"
        }}
      >
        Power: {move.power ?? "-"}
      </div>

      <div>
        Accuracy:{" "}
        {move.accuracy ?? "-"}
      </div>

      <div>
        PP: {move.pp ?? "-"}
      </div>
    </div>
  );
}

export default MoveSummaryCard;
