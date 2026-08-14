import { useMemo } from "react";
import { Link } from "react-router-dom";
import useLocalStorageState from "../hooks/useLocalStorageState";
import Seo from "../seo/Seo";
import {
  DEFAULT_TEAM_RECOMMENDATION_WEIGHTS,
  TEAM_RECOMMENDATION_WEIGHTS_STORAGE_KEY,
  normalizeRecommendationWeights
} from "../utils/teamCoverage";

const scoreWeightControls = [
  {
    key: "coverageType",
    label: "Coverage Type"
  },
  {
    key: "normalTypeQualifier",
    label: "Normal Type Qualifier"
  },
  {
    key: "stabIceTypeBonus",
    label: "STAB Ice Type Bonus"
  },
  {
    key: "regionalDex",
    label: "Regional Dex"
  },
  {
    key: "notRegionalDex",
    label: "Not Regional Dex"
  },
  {
    key: "tradeEvolution",
    label: "Trade Evolution"
  },
  {
    key: "sTier",
    label: "S Tier"
  },
  {
    key: "aTier",
    label: "A Tier"
  },
  {
    key: "veryLowBst",
    label: "BST < 380"
  },
  {
    key: "lowBst",
    label: "BST < 410"
  },
  {
    key: "highBst",
    label: "BST > 490"
  }
];

function isLocalHost() {
  if (typeof window === "undefined") {
    return false;
  }

  return [
    "localhost",
    "127.0.0.1",
    "::1"
  ].includes(window.location.hostname);
}

function WeightInput({
  control,
  value,
  onChange
}) {
  return (
    <label
      className="team-coverage-weight-control"
    >
      <span
        className="team-coverage-weight-control-label"
      >
        {control.label}
      </span>
      <span
        aria-hidden="true"
        className="team-coverage-weight-control-colon"
      >
        :
      </span>
      <input
        className="team-coverage-weight-control-input"
        type="number"
        step="0.05"
        value={value}
        onChange={event => {
          onChange(
            control.key,
            event.target.value
          );
        }}
      />
    </label>
  );
}

function TeamCoverageScoringDevPage() {
  const [
    preferredWeights,
    setPreferredWeights
  ] = useLocalStorageState(
    TEAM_RECOMMENDATION_WEIGHTS_STORAGE_KEY,
    DEFAULT_TEAM_RECOMMENDATION_WEIGHTS
  );
  const weights = useMemo(
    () =>
      normalizeRecommendationWeights(
        preferredWeights
      ),
    [preferredWeights]
  );

  function updateWeight(key, value) {
    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue)) {
      return;
    }

    setPreferredWeights(current => ({
      ...normalizeRecommendationWeights(
        current
      ),
      [key]: parsedValue
    }));
  }

  if (!isLocalHost()) {
    return (
      <main
        style={{
          margin: "0 auto",
          maxWidth: "760px",
          padding: "2rem"
        }}
      >
        <Seo
          title="Team Coverage Scoring | PokeLore"
          description="Private local team coverage scoring tools."
          canonical="https://pokelore.net/dev/team-coverage-scoring"
          robots="noindex, nofollow"
        />
        <h1>Team Coverage Scoring</h1>
        <p>
          This page is only available on localhost.
        </p>
      </main>
    );
  }

  return (
    <main
      style={{
        margin: "0 auto",
        maxWidth: "1100px",
        padding: "2rem 1rem 3rem"
      }}
    >
      <Seo
        title="Team Coverage Scoring | PokeLore"
        description="Private local team coverage scoring tools."
        canonical="https://pokelore.net/dev/team-coverage-scoring"
        robots="noindex, nofollow"
      />

      <header
        style={{
          marginBottom: "1.25rem"
        }}
      >
        <Link
          to="/dev"
          style={{
            color: "var(--link-unvisited)",
            display: "inline-block",
            marginBottom: ".75rem"
          }}
        >
          Back to Developer Tools
        </Link>
        <h1
          style={{
            margin: "0 0 .45rem"
          }}
        >
          Team Coverage Scoring
        </h1>
        <p
          style={{
            lineHeight: 1.6,
            margin: 0,
            maxWidth: "760px",
            opacity: 0.86
          }}
        >
          Tune the Custom Score values used by suggested teammates in
          the Team Coverage calculator.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gap: "1rem"
        }}
      >
        <section
          style={{
            backgroundColor:
              "rgba(63, 81, 181, 0.18)",
            border:
              "1px solid rgba(147, 197, 253, 0.34)",
            borderRadius: "8px",
            padding: "1rem"
          }}
        >
          <div
            style={{
              alignItems: "start",
              display: "flex",
              gap: "1rem",
              justifyContent: "space-between",
              marginBottom: ".9rem"
            }}
          >
            <div>
              <h2
                style={{
                  margin: "0 0 .35rem"
                }}
              >
                Suggested Teammate Weights
              </h2>
              <p
                style={{
                  lineHeight: 1.5,
                  margin: 0,
                  opacity: 0.86
                }}
              >
                Coverage should explain the recommendation; these
                playthrough values decide which useful candidates rise.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setPreferredWeights(
                  DEFAULT_TEAM_RECOMMENDATION_WEIGHTS
                );
              }}
              style={{
                backgroundColor: "#2c2c2c",
                border: "2px solid #555",
                borderRadius: "8px",
                color: "white",
                cursor: "pointer",
                fontWeight: 700,
                padding: ".55rem .8rem",
                whiteSpace: "nowrap"
              }}
            >
              Reset
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gap: ".85rem",
              margin: "0 auto",
              maxWidth: "620px",
              width: "100%"
            }}
          >
            {scoreWeightControls.map(control => (
              <WeightInput
                key={control.key}
                control={control}
                value={weights[control.key]}
                onChange={updateWeight}
              />
            ))}
          </div>
        </section>

        <section
          style={{
            backgroundColor: "#202124",
            border: "1px solid #454950",
            borderRadius: "8px",
            padding: "1rem"
          }}
        >
          <h2
            style={{
              margin: "0 0 .5rem"
            }}
          >
            Scoring Inputs
          </h2>
          <p
            style={{
              lineHeight: 1.5,
              margin: 0,
              opacity: 0.86
            }}
          >
            Regional dex, trade evolution, exception, and tier data are
            precomputed into the generated team coverage indexes. Weight
            changes are instant; data changes require regenerating team
            coverage.
          </p>
        </section>
      </div>
    </main>
  );
}

export default TeamCoverageScoringDevPage;
