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

function formatEvYield(evYield) {
  const entries = Object.entries(
    evYield ?? {}
  )
    .filter(
      ([, value]) => Number(value) > 0
    )
    .map(
      ([stat, value]) =>
        `${Number(value)} ${capitalizeStat(stat)}`
    );

  return entries.length
    ? entries.join(", ")
    : null;
}

function getStatColor(value) {


     if (value >= 130) return "#09ff00";
  if (value >= 120) return "#3ce80d";
   if (value >= 110) return "#68e80d";
  if (value >= 100) return "#7be80d"
 if (value >= 90) return "#a3e80d"
  if (value >= 80) return "#bae718";
  if (value >= 70) return "#ebce11";
  if (value >= 60) return "#ffad08";
  if (value >= 50) return "#ff5900";
   if (value >= 40) return "#db3e1a";
 if (value >= 30) return "#db201a";
 if (value >= 20) return "#aa1818";

 





  return "#974242";
}

function BaseStatsChart({
  stats,
  evYield
}) {
  const maxStat = 255;
  const evYieldText =
    formatEvYield(evYield);

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
      <h2
      style={{
        marginBottom:"0rem"
        }
      }>Base Stats</h2>

      <div
        style={{
          // marginBottom: "0rem",
          fontWeight: "bold",
          fontSize: "1.1rem"
        }}
      >
        Total: {baseStatTotal}
      </div>

      {evYieldText && (
        <div
          style={{
            margin: ".2rem 0 .55rem",
            fontSize: ".95rem"
          }}
        >
          EV Yield: <strong>{evYieldText}</strong>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: ".25rem"
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
