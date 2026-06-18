// src/components/BaseStatsChart.jsx

function capitalizeStat(stat) {
  const labels = {
    hp: "HP",
    attack: "Attack",
    defense: "Defense",
    specialAttack: "Sp. Atk",
    specialDefense: "Sp. Def",
    speed: "Speed"
  };

  return labels[stat] || stat;
}

function getStatColor(value) {
  if (value >= 120) return "#4caf50";
  if (value >= 90) return "#8bc34a";
  if (value >= 60) return "#ffc107";
  return "#f4ab36";
}

function BaseStatsChart({ stats }) {
  const maxStat = 255;

  const baseStatTotal =
    Object.values(stats).reduce(
      (sum, stat) => sum + stat,
      0
    );

  return (
    <section
      style={{
        maxWidth: "300px",
        width: "100%",
        margin: "1.5rem auto 0",
      
      
      }}
    >
      <h2>Base Stats</h2>

      <div
        style={{
          marginBottom: "1rem",
          fontWeight: "bold",
          fontSize: "1.1rem"
        }}
      >
        Total: {baseStatTotal}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: ".65rem"
        }}
      >
        {Object.entries(stats).map(
          ([stat, value]) => {
            const percent =
              (value / maxStat) * 100;

            return (
              <div key={stat}>
                <div
                  style={{
                    // display: "flex",
                    // justifyContent: "space-between",
                    marginBottom: ".2rem",
                    fontSize: ".9rem",
                 textAlign:"left"
                  }}
                >
                  <span>
                    {capitalizeStat(stat)}: <strong>{value}</strong>
                  </span>

                  {/* <strong>
                     {value}
                  </strong> */}
                </div>

                <div
                  style={{
                    height: "12px",
                    backgroundColor: "#444",
                    borderRadius: "999px",
                    overflow: "hidden"
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${percent}%`,
                      backgroundColor:
                        getStatColor(value),
                      borderRadius: "999px",
                      transition:
                        "width .3s ease"
                    }}
                  />
                </div>
              </div>
            );
          }
        )}
      </div>
    </section>
  );
}

export default BaseStatsChart;
