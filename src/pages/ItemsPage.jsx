import {
  useEffect,
  useMemo,
  useState
} from "react";
import { useNavigate } from "react-router-dom";
import usePersistedScroll from "../hooks/usePersistedScroll";
import useQueryParamState from "../hooks/useQueryParamState";
import Seo from "../seo/Seo";
import { itemsSeo } from "../seo/seoConfig";
import { isItemHiddenFromUi } from "../utils/itemVisibility";

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

function ItemsPage() {
  const navigate = useNavigate();

  const [items, setItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [searchTerm, setSearchTerm] =
    useQueryParamState(
      "search",
      ""
    );

  const [selectedPocket, setSelectedPocket] =
    useQueryParamState(
      "pocket",
      "all"
    );

  usePersistedScroll(
    undefined,
    !loading
  );

  useEffect(() => {
    async function loadItems() {
      try {
        const response =
          await fetch(
            "/data/itemsIndex.json"
          );

        const data =
          await response.json();

        setItems(data);
      } catch (error) {
        console.error(
          "Failed to load items:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadItems();
  }, []);

  const allPockets = [
    "all",
    ...new Set(
      items
        .filter(
          item => !isItemHiddenFromUi(item)
        )
        .map(item => item.pocket)
        .filter(Boolean)
    )
  ];

  const filteredItems = useMemo(() => {
    const term =
      searchTerm
        .trim()
        .toLowerCase();

    return items.filter(item => {
      if (isItemHiddenFromUi(item)) {
        return false;
      }

      const matchesSearch =
        !term ||
        item.name.includes(term) ||
        item.displayName
          ?.toLowerCase()
          .includes(term) ||
        item.shortEffect
          ?.toLowerCase()
          .includes(term);

      const matchesPocket =
        selectedPocket === "all" ||
        item.pocket === selectedPocket;

      return (
        matchesSearch &&
        matchesPocket
      );
    });
  }, [
    items,
    searchTerm,
    selectedPocket
  ]);

  if (loading) {
    return (
      <>
        <Seo {...itemsSeo()} />
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
      <Seo {...itemsSeo()} />

      <h1>Item Database</h1>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          justifyContent: "center",
          marginBottom: "2rem"
        }}
      >
        <input
          type="text"
          placeholder="Search items..."
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
          value={selectedPocket}
          onChange={event =>
            setSelectedPocket(
              event.target.value
            )
          }
          style={{
            fontSize: "1rem",
            padding: ".75rem"
          }}
        >
          {allPockets.map(pocket => (
            <option
              key={pocket}
              value={pocket}
            >
              {pocket === "all"
                ? "All Pockets"
                : capitalize(pocket)}
            </option>
          ))}
        </select>
      </div>

      <p
        style={{
          marginBottom: "1rem"
        }}
      >
        Showing {filteredItems.length} items
      </p>

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))"
        }}
      >
        {filteredItems.map(item => (
          <button
            key={item.name}
            onClick={() =>
              navigate(
                `/item/${item.name}`
              )
            }
            style={{
              backgroundColor: "#2c2c2c",
              border: "1px solid #666",
              borderRadius: "12px",
              color: "inherit",
              cursor: "pointer",
              padding: "1rem",
              textAlign: "left"
            }}
          >
            <div
              style={{
                alignItems: "center",
                display: "flex",
                gap: ".75rem",
                marginBottom: ".75rem"
              }}
            >
              {item.sprite && (
                <img
                  src={item.sprite}
                  alt={item.displayName}
                  loading="lazy"
                  style={{
                    height: "42px",
                    imageRendering:
                      "pixelated",
                    width: "42px"
                  }}
                />
              )}

              <h2
                style={{
                  margin: 0
                }}
              >
                {item.displayName}
              </h2>
            </div>

            <div>
              {item.categoryDisplayName}
            </div>

            <p
              style={{
                fontSize: ".9rem",
                marginTop: ".75rem"
              }}
            >
              {item.shortEffect}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ItemsPage;
