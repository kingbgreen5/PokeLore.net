import {
  useEffect,
  useMemo,
  useState
} from "react";
import { Link } from "react-router-dom";
import ItemLocationCards from "../components/ItemLocationCards";
import Seo from "../seo/Seo";
import { topicSeo } from "../seo/seoConfig";

function getLocationDisplayName(location) {
  if (!location) {
    return "Unknown Location";
  }

  if (typeof location === "string") {
    return location;
  }

  return (
    location.displayName ??
    location.name ??
    "Unknown Location"
  );
}

function getLocationKey(location) {
  if (!location) {
    return "unknown-location";
  }

  if (typeof location === "string") {
    return location;
  }

  return (
    location.name ??
    location.displayName ??
    "unknown-location"
  );
}

function buildRowsForGame(
  sourceItems,
  itemsByName,
  game
) {
  return sourceItems.flatMap(itemRecord => {
    const indexItem =
      itemsByName.get(itemRecord.item);
    const item = {
      name: itemRecord.item,
      displayName:
        itemRecord.displayName ??
        indexItem?.displayName ??
        itemRecord.item,
      sprite: indexItem?.sprite ?? null
    };

    return (
      itemRecord.acquisition ?? []
    )
      .filter(method =>
        method.games?.includes(game)
      )
      .map((method, index) => ({
        item,
        version: game,
        method: {
          type:
            method.acquisitionType,
          area: method.area,
          details: method.method,
          requirements:
            method.requirements ?? [],
          repeatable:
            method.repeatable,
          versionExclusive:
            method.versionExclusive,
          location:
            method.location,
          key: `${item.name}-${getLocationKey(method.location)}-${method.method}-${index}`
        }
      }));
  });
}

function ItemLocationTopicPage({
  game,
  topic
}) {
  const [rows, setRows] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [
    selectedLocation,
    setSelectedLocation
  ] = useState("all");

  useEffect(() => {
    async function loadRows() {
      try {
        setLoading(true);
        const [
          sourceResponse,
          itemsResponse
        ] = await Promise.all([
          fetch(
            "/data/itemLocationsCurated.json"
          ),
          fetch("/data/itemsIndex.json")
        ]);
        const sourceData =
          await sourceResponse.json();
        const itemsIndex =
          await itemsResponse.json();
        const itemsByName = new Map(
          (itemsIndex ?? []).map(item => [
            item.name,
            item
          ])
        );

        setRows(
          buildRowsForGame(
            sourceData.items ?? [],
            itemsByName,
            game
          )
        );
      } catch (error) {
        console.error(
          "Failed to load item location topic:",
          error
        );
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    loadRows();
  }, [game]);

  const locationOptions = useMemo(
    () => [
      {
        key: "all",
        label: "All Locations"
      },
      ...Array.from(
        new Map(
          rows.map(row => [
            getLocationKey(
              row.method.location
            ),
            {
              key: getLocationKey(
                row.method.location
              ),
              label:
                getLocationDisplayName(
                  row.method.location
                )
            }
          ])
        ).values()
      ).sort((a, b) =>
        a.label.localeCompare(b.label)
      )
    ],
    [rows]
  );

  const filteredRows = useMemo(
    () =>
      selectedLocation === "all"
        ? rows
        : rows.filter(
            row =>
              getLocationKey(
                row.method.location
              ) === selectedLocation
          ),
    [rows, selectedLocation]
  );

  const itemCount = useMemo(
    () =>
      new Set(
        filteredRows.map(
          row => row.item.name
        )
      ).size,
    [filteredRows]
  );

  if (loading) {
    return (
      <>
        <Seo {...topicSeo(topic)} />
        <p>Loading item locations...</p>
      </>
    );
  }

  return (
    <main
      style={{
        padding: "2rem"
      }}
    >
      <Seo {...topicSeo(topic)} />

      <Link
        to="/topics"
        style={{
          color: "inherit"
        }}
      >
        Back to topics
      </Link>

      <h1>{topic.title}</h1>

      <p
        style={{
          margin: "0 auto 1rem",
          maxWidth: "780px"
        }}
      >
        {topic.introText}
      </p>

      <p
        style={{
          fontWeight: "bold",
          marginBottom: "1rem"
        }}
      >
        {itemCount} items ·{" "}
        {filteredRows.length} location
        entries
      </p>

      <div
        style={{
          margin: "0 auto 1.5rem",
          maxWidth: "780px",
          textAlign: "left"
        }}
      >
        <label
          htmlFor="item-location-topic-filter"
          style={{
            display: "block",
            fontWeight: 700,
            marginBottom: ".5rem"
          }}
        >
          Filter by location
        </label>

        <select
          id="item-location-topic-filter"
          value={selectedLocation}
          onChange={event =>
            setSelectedLocation(
              event.target.value
            )
          }
          style={{
            backgroundColor: "#2c2c2c",
            border: "2px solid #555",
            borderRadius: "12px",
            color: "white",
            fontSize: "1rem",
            maxWidth: "100%",
            padding: ".75rem 1rem"
          }}
        >
          {locationOptions.map(location => (
            <option
              key={location.key}
              value={location.key}
            >
              {location.label}
            </option>
          ))}
        </select>
      </div>

      <ItemLocationCards
        rows={filteredRows}
        showLocation={true}
      />
    </main>
  );
}

export default ItemLocationTopicPage;
