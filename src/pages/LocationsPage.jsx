import {
  useEffect,
  useMemo,
  useState
} from "react";
import { Link } from "react-router-dom";
import usePersistedScroll from "../hooks/usePersistedScroll";
import useQueryParamState from "../hooks/useQueryParamState";
import Seo from "../seo/Seo";
import { locationsSeo } from "../seo/seoConfig";

function capitalize(text) {
  return String(text)
    .split("-")
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function LocationsPage() {
  const [locations, setLocations] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [searchTerm, setSearchTerm] =
    useQueryParamState(
      "search",
      ""
    );
  const [selectedRegion, setSelectedRegion] =
    useQueryParamState(
      "region",
      "all"
    );
  const [
    onlyWithEncounters,
    setOnlyWithEncounters
  ] = useQueryParamState(
    "encounters",
    "false"
  );

  usePersistedScroll(
    undefined,
    !loading
  );

  useEffect(() => {
    async function loadLocations() {
      try {
        const response = await fetch(
          "/data/locationsIndex.json"
        );
        const data = await response.json();

        setLocations(data);
      } catch (error) {
        console.error(
          "Failed to load locations:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadLocations();
  }, []);

  const regions = useMemo(
    () => [
      "all",
      ...new Set(
        locations
          .map(location => location.region)
          .filter(Boolean)
      )
    ],
    [locations]
  );

  const filteredLocations = useMemo(() => {
    const term =
      searchTerm.trim().toLowerCase();

    return locations.filter(location => {
      const matchesSearch =
        !term ||
        location.name.includes(term) ||
        location.displayName
          .toLowerCase()
          .includes(term) ||
        location.region
          ?.toLowerCase()
          .includes(term);

      const matchesRegion =
        selectedRegion === "all" ||
        location.region === selectedRegion;

      const matchesEncounterFilter =
        onlyWithEncounters !== "true" ||
        location.hasEncounters;

      return (
        matchesSearch &&
        matchesRegion &&
        matchesEncounterFilter
      );
    });
  }, [
    locations,
    searchTerm,
    selectedRegion,
    onlyWithEncounters
  ]);

  if (loading) {
    return (
      <>
        <Seo {...locationsSeo()} />
        <p>Loading...</p>
      </>
    );
  }

  return (
    <div
      style={{
        padding: "2rem"
      }}
    >
      <Seo {...locationsSeo()} />

      <h1>Location Database</h1>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          justifyContent: "center",
          marginBottom: "2rem"
        }}
      >
        <input
          type="text"
          placeholder="Search locations..."
          value={searchTerm}
          onChange={event =>
            setSearchTerm(
              event.target.value
            )
          }
          style={{
            backgroundColor: "#2c2c2c",
            border: "2px solid #555",
            borderRadius: "12px",
            boxSizing: "border-box",
            color: "white",
            fontSize: "1rem",
            maxWidth: "420px",
            padding: ".8rem 1rem",
            width: "100%"
          }}
        />

        <select
          value={selectedRegion}
          onChange={event =>
            setSelectedRegion(
              event.target.value
            )
          }
          style={{
            backgroundColor: "#2c2c2c",
            border: "2px solid #555",
            borderRadius: "12px",
            color: "white",
            fontSize: "1rem",
            padding: ".75rem 1rem"
          }}
        >
          {regions.map(region => (
            <option
              key={region}
              value={region}
            >
              {region === "all"
                ? "All Regions"
                : capitalize(region)}
            </option>
          ))}
        </select>

        <label
          style={{
            alignItems: "center",
            display: "inline-flex",
            gap: ".5rem"
          }}
        >
        <input
          type="checkbox"
            checked={
              onlyWithEncounters ===
              "true"
            }
            onChange={event =>
              setOnlyWithEncounters(
                event.target.checked
                  ? "true"
                  : "false"
              )
            }
          />
          Has encounters
        </label>
      </div>

      <p>
        Showing {filteredLocations.length} locations
      </p>

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))"
        }}
      >
        {filteredLocations.map(location => (
          <Link
            key={location.name}
            to={`/location/${location.name}`}
            style={{
              backgroundColor: "#2c2c2c",
              border: "1px solid #666",
              borderRadius: "12px",
              color: "inherit",
              cursor: "pointer",
              padding: "1rem",
              textAlign: "left",
              textDecoration: "none"
            }}
          >
            <h2
              style={{
                marginTop: 0
              }}
            >
              {location.displayName}
            </h2>

            <p>
              {location.regionDisplayName}
            </p>

            <p
              style={{
                fontSize: ".9rem",
                opacity: 0.8
              }}
            >
              {location.areaCount} areas
              {" · "}
              {location.hasEncounters
                ? "Encounters"
                : "No encounter data"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default LocationsPage;
