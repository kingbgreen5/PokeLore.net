import { Link } from "react-router-dom";
import TypeBadge from "./TypeBadge";

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
  return (
    <Link
      className="move-summary-card"
      to={`/move/${name}`}
      style={{
        alignItems: "center",
        backgroundColor: "#2c2c2c",
        border: "2px solid #555",
        borderRadius: "18px",
        boxSizing: "border-box",
        color: "inherit",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        // maxHeight: "200px",
        // maxWidth: "200px",
        // minHeight: "130px",
        height:"120px",
                width: "120px",
        padding: ".35rem",
        textDecoration: "none",
        transition:
          "transform 0.15s ease",

      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform =
          "translateY(-4px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform =
          "translateY(0px)";
      }}
    >
      <h3
        style={{
          fontSize: ".82rem",
          lineHeight: 1.15,
          margin:
            "0 0 .5rem 0",
          maxWidth: "100%",
          overflowWrap:
            "anywhere",
          textAlign: "center"
        }}
      >
        {capitalize(name)}
      </h3>

      <TypeBadge
        height="1.35rem"
        type={move.type}
      />

      <div
        style={{
          display: "grid",
          fontSize: ".72rem",
          gap: ".15rem",
          lineHeight: 1.2,
          marginTop: ".55rem",
          textAlign: "center"
        }}
      >
        <div>
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
    </Link>
  );
}

export default MoveSummaryCard;
