import {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  Navigate,
  useNavigate,
  useParams
} from "react-router-dom";
import AcquisitionMethods from "../components/AcquisitionMethods";
import TmMoveDetails from "../components/items/TmMoveDetails";
import PokemonSummaryCard from "../components/PokemonSummaryCard";
import Seo from "../seo/Seo";
import { itemSeo } from "../seo/seoConfig";

function capitalize(text) {
  return String(text ?? "")
    .split("-")
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

async function readJsonFile(
  url,
  {
    warn = false
  } = {}
) {
  try {
    const response = await fetch(url);

    if (!response.ok) return null;

    const text = await response.text();
    const trimmed = text.trim();

    if (
      !trimmed.startsWith("{") &&
      !trimmed.startsWith("[")
    ) {
      if (warn) {
        console.warn(
          `Skipping non-JSON response for ${url}`
        );
      }

      return null;
    }

    return JSON.parse(text);
  } catch (error) {
    if (warn) {
      console.warn(
        `Failed to read JSON from ${url}:`,
        error
      );
    }

    return null;
  }
}

function normalizeItemName(itemName) {
  let normalized = "";

  try {
    normalized = decodeURIComponent(
      String(itemName ?? "")
    );
  } catch {
    normalized = String(itemName ?? "");
  }

  normalized = normalized
    .trim()
    .toLowerCase();

  normalized = normalized.replace(
    /^(tm|hm|tr)-(\d+)$/,
    "$1$2"
  );

  normalized = normalized.replace(
    /^(tm|hm|tr)(\d+)s$/,
    "$1$2"
  );

  return normalized;
}


// item overview details
function DetailRow({
  label,
  value
}) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  return (
    <div>
      <strong>{label}</strong>
      <p>{value}</p>
    </div>
  );
}




function ItemDetailPage() {
  const navigate = useNavigate();
  const { itemName } = useParams();
  const normalizedItemName =
    normalizeItemName(itemName);
  const rawItemName =
    String(itemName ?? "");

  const [item, setItem] =
    useState(null);

  const [pokemonIndex, setPokemonIndex] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadItem() {
      try {
        setLoading(true);

        const itemCandidates = [
          normalizedItemName,
          rawItemName
        ]
          .filter(Boolean)
          .filter(
            (candidate, index, all) =>
              all.indexOf(candidate) === index
          );

        let itemData = null;

        for (const candidate of itemCandidates) {
          itemData = await readJsonFile(
            `/data/items/${candidate}.json`,
            {
              warn: true
            }
          );

          if (itemData) break;
        }

        if (!itemData) {
          setItem(null);
          setPokemonIndex([]);
          return;
        }

        const [
          pokemonIndexData,
          migratedLocationData
        ] = await Promise.all([
          readJsonFile(
            "/data/pokemonIndex.json"
          ),
          readJsonFile(
            `/data/itemLocationsMigrated/${normalizedItemName}.json`
          )
        ]);

        setItem({
          ...itemData,
          acquisition:
            migratedLocationData?.acquisition ??
            itemData.acquisition
        });
        setPokemonIndex(
          Array.isArray(pokemonIndexData)
            ? pokemonIndexData
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load item:",
          error
        );
        setItem(null);
      } finally {
        setLoading(false);
      }
    }

    loadItem();
  }, [
    normalizedItemName,
    rawItemName
  ]);

  const pokemonById = useMemo(
    () =>
      new Map(
        pokemonIndex.map(
          pokemon => [
            pokemon.id,
            pokemon
          ]
        )
      ),
    [pokemonIndex]
  );

  const pokemonByName = useMemo(
    () =>
      new Map(
        pokemonIndex.map(
          pokemon => [
            pokemon.name,
            pokemon
          ]
        )
      ),
    [pokemonIndex]
  );


  const wildPokemonHoldingItem = useMemo(
    () =>
      item?.heldByPokemon
        ?.map(heldPokemon =>
          pokemonById.get(
            heldPokemon.pokemonId
          ) ??
          pokemonByName.get(
            heldPokemon.pokemon
          )
        )
        .filter(Boolean) ?? [],
    [
      item,
      pokemonById,
      pokemonByName
    ]
  );

  if (loading) {
    return (
      <>
        <Seo {...itemSeo(normalizedItemName)} />
        <p>Loading...</p>
      </>
    );
  }

  if (
    item &&
    itemName !== item.name
  ) {
    return (
      <Navigate
        to={`/item/${item.name}`}
        replace
      />
    );
  }

  if (!item) {
    return (
      <div
      style={{
        padding: "2rem"
      }}
    >
        <Seo {...itemSeo(normalizedItemName)} />

        <button
          onClick={() =>
            navigate("/items")
          }
        >
          Back To Items
        </button>

        <h1>Item not found</h1>
      </div>
    );
  }

  return (
    <div
      style={{
        margin: "0 auto",
        maxWidth: "900px",
        padding: "2rem"
      }}
    >
      <Seo {...itemSeo(item)} />

      {/* <button
        onClick={() =>
          navigate("/items")
        }
        style={{
          cursor: "pointer",
          marginBottom: "2rem",
          padding: ".5rem 1rem"
        }}
      >
        Back To Items
      </button> */}

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

{/* -----------------------------------------------------Sprite */}


        {item.sprite && (
          <img
            src={item.sprite}
            alt={item.displayName}
            style={{
              height: "72px",
              imageRendering: "pixelated",
              width: "72px"
            }}
          />
        )}

        <div>
          <h1
            style={{
              margin: 0
            }}
          >
            {item.displayName}
          </h1>
{/* 
          <p>
            
            {item.category?.displayName ??
              capitalize(item.name)}
          </p> */}
        </div>
      </div>


{/* --------------------------------------------------------------------------effect */}


      <section
        style={{
          marginBottom: "2rem"
        }}
      >
        <h2>Effect</h2>
        <p>{item.effect}</p>
      </section>

      {item.shortEffect && (
        <section
          style={{
            marginBottom: "2rem"
          }}
        >
          <h2>Short Effect</h2>
          <p>{item.shortEffect}</p>
        </section>
      )}

      <TmMoveDetails item={item} />

      <AcquisitionMethods
        key={item.name}
        acquisition={item.acquisition}
        storageKey={`item:${item.name}:acquisition-expanded`}
      />

      {wildPokemonHoldingItem.length >
        0 && (
        <section
          style={{
            marginBottom: "2rem"
          }}
        >
          <h2>
            Found On
          </h2>

          <div
            style={{
              display: "grid",
              gap: "1rem",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(150px, 1fr))",
              marginTop: "1rem"
            }}
          >
            {wildPokemonHoldingItem.map(
              pokemon => (
                <PokemonSummaryCard
                  key={pokemon.id}
                  pokemon={pokemon}
                  compact={true}
                />
              )
            )}
          </div>
        </section>
      )}


      {item.flavorTextEntries?.length >
        0 && (
        <section>
          <h2>Flavor Text</h2>

          {item.flavorTextEntries.map(
            (entry, index) => (
              <div
                key={`${entry.text}-${index}`}
                style={{
                  borderBottom:
                    "1px solid #444",
                  marginBottom: "1rem",
                  paddingBottom: "1rem",
                  textAlign: "left"
                }}
              >
                <p>{entry.text}</p>

                <div
                  style={{
                    fontSize: ".85rem",
                    opacity: 0.75
                  }}
                >
                  {entry.versionGroups
                    ?.map(capitalize)
                    .join(" / ")}
                </div>
              </div>
            )
          )}
        </section>
      )}



{/*------------------------------------------------------- overview */}
      <section
        style={{
          border: "1px solid #666",
          borderRadius: "12px",
          marginBottom: "2rem",
          padding: "1rem"
        }}
      >
        <h2>Overview</h2>

        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))"
          }}
        >
          <DetailRow
            label="Cost"
            value={`${item.cost}`}
          />

          <DetailRow
            label="Pocket"
            value={
              item.category?.pocket
                ? capitalize(
                    item.category.pocket
                  )
                : null
            }
          />

          <DetailRow
            label="Category"
            value={
              item.category?.displayName
            }
          />

          <DetailRow
            label="Fling Power"
            value={item.fling?.power}
          />
        </div>
      </section>



{/*                                                                    attributes */}


      {item.attributes?.length > 0 && (
        <section
          style={{
            marginBottom: "2rem"
          }}
        >



          <h2>Attributes</h2>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: ".5rem",
              justifyContent: "center"
            }}
          >
            {item.attributes.map(
              attribute => (
                <span
                  key={attribute}
                  style={{
                    border:
                      "1px solid #888",
                    borderRadius:
                      "999px",
                    padding:
                      ".35rem .75rem"
                  }}
                >
                  {capitalize(attribute)}
                </span>
              )
            )}
          </div>
        </section>
      )}





{/* --------------------------flavortext */}










    </div>
  );
}

export default ItemDetailPage;
