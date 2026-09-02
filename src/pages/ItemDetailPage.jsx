import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  Link,
  Navigate,
  useParams
} from "react-router-dom";
import AcquisitionMethods from "../components/AcquisitionMethods";
import BerryDetails from "../components/items/BerryDetails";
import TmMoveDetails from "../components/items/TmMoveDetails";
import OaksNotes from "../components/OaksNotes";
import PokemonGoNotes from "../components/PokemonGoNotes";
import PokemonSummaryCard from "../components/PokemonSummaryCard";
import RelatedLinks from "../components/RelatedLinks";
import Seo from "../seo/Seo";
import {
  invalidItemSeo,
  itemSeo,
  unavailableItemSeo,
  unresolvedItemSeo
} from "../seo/seoConfig";
import { readJsonFile } from "../utils/readJsonFile";
import { isItemHiddenFromUi } from "../utils/itemVisibility";
import {
  isTmMaterialItem
} from "../utils/tmMaterialDetails";
import {
  buildMachineItemDescription,
  capitalizeItemText as capitalize,
  isMachineItem,
  mergeItemDetailData,
  normalizeItemName
} from "../utils/itemDetail";
import {
  DYNAMAX_CRYSTAL_GUIDE_PATH,
  formatDynamaxPokemonList,
  formatDynamaxPokemonName,
  getDynamaxCrystalData,
  getDynamaxCrystalDisplayName,
  isDynamaxCrystalItem,
  isReleasedDynamaxCrystal,
  isUsableFlavorText
} from "../utils/dynamaxCrystals";

function readPrerenderItemData(normalizedItemName) {
  if (typeof document === "undefined") {
    return null;
  }

  const script = document.getElementById(
    "pokelore-prerender-item-data"
  );

  if (!script?.textContent) {
    return null;
  }

  try {
    const data = JSON.parse(script.textContent);

    if (data?.item?.name !== normalizedItemName) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

async function readItemDataFile(itemSlug) {
  try {
    const url = `/data/items/${itemSlug}.json`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return {
          status: "missing"
        };
      }

      return {
        status: "error",
        error: new Error(
          `Failed to fetch ${url}: ${response.status}`
        )
      };
    }

    const text = await response.text();
    const trimmed = text.trim();

    if (
      !trimmed.startsWith("{") &&
      !trimmed.startsWith("[")
    ) {
      return {
        status: "missing"
      };
    }

    return {
      status: "loaded",
      data: JSON.parse(text)
    };
  } catch (error) {
    return {
      status: "error",
      error
    };
  }
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

function PokemonTextLinks({
  pokemonSlugs
}) {
  return pokemonSlugs.map((slug, index) => {
    const isLast =
      index === pokemonSlugs.length - 1;
    const separator =
      pokemonSlugs.length === 2
        ? isLast
          ? ""
          : " and "
        : isLast
          ? ""
          : index === pokemonSlugs.length - 2
            ? ", and "
            : ", ";

    return (
      <span key={slug}>
        <Link to={`/pokemon/${slug}`}>
          {formatDynamaxPokemonName(slug)}
        </Link>
        {separator}
      </span>
    );
  });
}

function StatusBadge({
  children
}) {
  return (
    <span
      style={{
        border: "1px solid #888",
        borderRadius: "999px",
        display: "inline-flex",
        fontSize: ".85rem",
        fontWeight: 700,
        padding: ".35rem .75rem"
      }}
    >
      {children}
    </span>
  );
}

function DynamaxCrystalDetails({
  crystalData,
  item
}) {
  const crystalName =
    getDynamaxCrystalDisplayName(item);
  const isReleased =
    isReleasedDynamaxCrystal(item);
  const raidPokemonList =
    crystalData
      ? formatDynamaxPokemonList(
          crystalData.raidPokemon
        )
      : "";

  return (
    <>
      <section
        style={{
          marginBottom: "2rem",
          textAlign: "left"
        }}
      >
        <h2>About Dynamax Crystals</h2>
        <p>
          Dynamax Crystals are special event items
          introduced in Pokemon Sword and Shield.
          They were designed to activate a specific
          Max Raid Battle at Watchtower Lair in the
          Watchtower Ruins area of the Wild Area.
          After a usable crystal is selected from
          the Bag, its associated Pokemon becomes
          available at the den until midnight or
          until it is caught.
        </p>
        <p>
          Pokemon Sword and Shield contain data for
          300 differently named Dynamax Crystals.
          However, only 12 crystals were officially
          distributed and made available to players.
          The remaining 288 crystals are unused
          game-data entries and cannot be obtained
          through normal gameplay.
        </p>
        <p>
          <Link to={DYNAMAX_CRYSTAL_GUIDE_PATH}>
            View the Dynamax Crystals guide
          </Link>
          .
        </p>
      </section>

      <section
        style={{
          marginBottom: "2rem",
          textAlign: "left"
        }}
      >
        <h2>
          How To Obtain And Use Dynamax Crystals
        </h2>
        <p>
          Released Dynamax Crystals were obtained
          through limited-time serial-code
          promotions, game purchase bonuses,
          magazines, guidebooks, or participating
          retailers. They were not normally found
          in the overworld or sold in Poke Marts.
        </p>
        <p>
          After receiving a valid crystal through
          Mystery Gift, travel to Watchtower Lair
          in the Watchtower Ruins section of the
          Wild Area. Open the Bag and use the
          crystal while near the den. The crystal
          activates its designated Max Raid Battle
          for the remainder of the day.
        </p>
        <p>
          Most original Dynamax Crystal
          distributions have ended. Crystals marked
          as unused were never officially
          distributed and have no legitimate
          acquisition method in normal gameplay.
        </p>
      </section>

      <section
        style={{
          border: "1px solid #666",
          borderRadius: "12px",
          marginBottom: "2rem",
          padding: "1rem",
          textAlign: "left"
        }}
      >
        <h2>About {crystalName}</h2>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: ".5rem",
            marginBottom: "1rem"
          }}
        >
          <StatusBadge>
            {isReleased
              ? "Officially Released"
              : "Unused Game Data"}
          </StatusBadge>
          {crystalData && (
            <StatusBadge>
              {crystalData.raidType} Raid
            </StatusBadge>
          )}
          {isReleased && (
            <StatusBadge>
              Original Distribution Ended
            </StatusBadge>
          )}
        </div>

        {isReleased && crystalData ? (
          <>
            <p>
              {crystalName} is an officially
              released Dynamax Crystal associated
              with{" "}
              <PokemonTextLinks
                pokemonSlugs={
                  crystalData.raidPokemon
                }
              />
              . When used at Watchtower Lair, it
              activates a {crystalData.raidType} Max
              Raid Battle featuring {raidPokemonList}.
            </p>

            {crystalData.versionNotes && (
              <p>{crystalData.versionNotes}</p>
            )}

            <p>
              <strong>
                Original acquisition:
              </strong>{" "}
              {crystalData.acquisitionSummary}
            </p>

            <p>
              <strong>
                Current availability:
              </strong>{" "}
              {crystalData.currentAvailability}
            </p>
          </>
        ) : (
          <>
            <p>
              {crystalName} is one of the unused
              Dynamax Crystal variants present in
              Pokemon Sword and Shield's game data.
              Although Dynamax Crystals were
              designed to activate Pokemon
              encounters at Watchtower Lair, this
              crystal was never officially
              distributed.
            </p>
            <p>
              It has no legitimate acquisition
              method and cannot be used during
              normal gameplay.
            </p>
          </>
        )}
      </section>
    </>
  );
}




function ItemDetailPage() {
  const { itemName } = useParams();
  const normalizedItemName =
    normalizeItemName(itemName);
  const rawItemName =
    String(itemName ?? "");
  const prerenderItemData =
    readPrerenderItemData(
      normalizedItemName
    );

  const [item, setItem] =
    useState(
      () => prerenderItemData?.item ?? null
    );

  const [pokemonIndex, setPokemonIndex] =
    useState(
      () =>
        prerenderItemData?.pokemonIndex ?? []
    );
  const [oaksNotes, setOaksNotes] =
    useState(
      () => prerenderItemData?.oaksNotes ?? null
    );
  const [
    pokemonGoNotes,
    setPokemonGoNotes
  ] = useState(
    () => prerenderItemData?.pokemonGoNotes ?? null
  );
  const [relatedLinks, setRelatedLinks] =
    useState(
      () =>
        prerenderItemData?.relatedLinks ?? null
    );
  const [berryData, setBerryData] =
    useState(
      () => prerenderItemData?.berryData ?? null
    );

  const [loading, setLoading] =
    useState(
      () => !prerenderItemData?.item
    );
  const [loadStatus, setLoadStatus] =
    useState(
      () =>
        prerenderItemData?.item
          ? "loaded"
          : "loading"
    );
  const hasVisibleItemRef = useRef(
    Boolean(prerenderItemData?.item)
  );

  useEffect(() => {
    let isActive = true;

    async function loadItem() {
      const keepVisibleDuringRefresh =
        hasVisibleItemRef.current;

      try {
        if (!keepVisibleDuringRefresh) {
          setLoading(true);
          setLoadStatus("loading");
        }

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

        let itemDataFailure = null;

        for (const candidate of itemCandidates) {
          const result =
            await readItemDataFile(candidate);

          if (result.status === "loaded") {
            itemData = result.data;
            break;
          }

          if (result.status === "error") {
            itemDataFailure =
              result.error ?? new Error(
                "Failed to load item data."
              );
          }
        }

        if (!itemData && itemDataFailure) {
          throw itemDataFailure;
        }

        if (
          !itemData ||
          isItemHiddenFromUi(itemData)
        ) {
          if (!isActive) {
            return;
          }

          setItem(null);
          setPokemonIndex([]);
          setOaksNotes(null);
          setPokemonGoNotes(null);
          setRelatedLinks(null);
          setBerryData(null);
          setLoadStatus("not-found");
          return;
        }

        const [
          pokemonIndexData,
          migratedLocationData,
          oaksNotesData,
          pokemonGoNotesData,
          relatedLinksData,
          berryDetailData,
          tmMaterialDetailsData
        ] = await Promise.all([
          readJsonFile(
            "/data/pokemonIndex.json"
          ),
          readJsonFile(
            `/data/itemLocationsCurated/${normalizedItemName}.json`
          ),
          readJsonFile(
            `/data/oaksNotes/items/${itemData.name}.json`
          ),
          readJsonFile(
            `/data/pokemonGo/items/${itemData.name}.json`
          ),
          readJsonFile(
            `/data/relatedLinks/items/${itemData.name}.json`
          ),
          itemData.category?.pocket ===
          "berries"
            ? readJsonFile(
                `/data/berries/generated/details/${itemData.name}.json`
              )
            : Promise.resolve(null),
          isTmMaterialItem(itemData)
            ? readJsonFile(
                "/data/tmMaterialDetails.json"
              )
            : Promise.resolve(null)
        ]);

        if (!isActive) {
          return;
        }

        setItem(
          mergeItemDetailData({
            itemData,
            migratedLocationData,
            tmMaterialDetailsData
          })
        );
        hasVisibleItemRef.current = true;
        setPokemonIndex(
          Array.isArray(pokemonIndexData)
            ? pokemonIndexData
            : []
        );
        setOaksNotes(oaksNotesData);
        setPokemonGoNotes(pokemonGoNotesData);
        setRelatedLinks(relatedLinksData);
        setBerryData(berryDetailData);
        setLoadStatus("loaded");
      } catch (error) {
        if (!isActive) {
          return;
        }

        console.error(
          "Failed to load item:",
          error
        );
        if (!keepVisibleDuringRefresh) {
          setItem(null);
          setOaksNotes(null);
          setPokemonGoNotes(null);
          setRelatedLinks(null);
          setBerryData(null);
        }
        setLoadStatus("error");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadItem();

    return () => {
      isActive = false;
    };
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
  const tmMaterialPokemon = useMemo(
    () =>
      item?.tmMaterialDetail?.relatedPokemon
        ?.map(
          pokemon =>
            pokemonById.get(
              pokemon.id
            ) ??
            pokemonByName.get(
              pokemon.name
            ) ??
            pokemon
        )
        .filter(Boolean) ?? [],
    [
      item,
      pokemonById,
      pokemonByName
    ]
  );

  const machineItemDescription = useMemo(
    () =>
      isMachineItem(item)
        ? buildMachineItemDescription(item)
        : null,
    [item]
  );
  const isDynamaxCrystal =
    isDynamaxCrystalItem(item);
  const dynamaxCrystalData =
    isDynamaxCrystal
      ? getDynamaxCrystalData(item)
      : null;
  const isBerryItem =
    item?.category?.pocket === "berries";
  const effectText =
    machineItemDescription ?? item?.effect;
  const showEffect =
    effectText &&
    !isBerryItem;
  const showShortEffect =
    item?.shortEffect &&
    !machineItemDescription &&
    !isBerryItem;
  const usableFlavorTextEntries =
    item?.flavorTextEntries?.filter(entry =>
      isUsableFlavorText(entry.text)
    ) ?? [];
  const loadedItemMatchesRoute =
    item?.name === normalizedItemName;

  if (
    loading ||
    (item && !loadedItemMatchesRoute)
  ) {
    return (
      <>
        <Seo {...unresolvedItemSeo()} />
        <p>Loading...</p>
      </>
    );
  }

  if (
    item &&
    loadedItemMatchesRoute &&
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
    const seo =
      loadStatus === "error"
        ? unavailableItemSeo()
        : invalidItemSeo();

    return (
      <div
      style={{
        padding: "2rem"
      }}
    >
        <Seo {...seo} />

        <Link to="/items">
          Back To Items
        </Link>

        <h1>
          {loadStatus === "error"
            ? "Item temporarily unavailable"
            : "Item not found"}
        </h1>
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
        </div>
      </div>


{/* --------------------------------------------------------------------------effect */}


      {showEffect && (
        <section
          style={{
            marginBottom: "2rem"
          }}
        >
          <h2>Effect</h2>
          <p>{effectText}</p>
        </section>
      )}

      {isDynamaxCrystal && (
        <DynamaxCrystalDetails
          crystalData={dynamaxCrystalData}
          item={item}
        />
      )}

      {showShortEffect && (
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

      {isBerryItem && (
        <BerryDetails
          item={item}
          berryData={berryData}
          oaksNotes={oaksNotes}
        />
      )}

      {tmMaterialPokemon.length > 0 && (
        <section
          style={{
            marginBottom: "2rem"
          }}
        >
          <h2>Dropped By</h2>
          <p
            style={{
              color: "#d1d5db",
              margin: "0 auto 1rem",
              maxWidth: "720px"
            }}
          >
            This TM Material is associated with the matching Pokemon
            evolutionary line in Pokemon Scarlet and Violet.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              justifyContent: "center"
            }}
          >
            {tmMaterialPokemon.map(pokemon => (
              <PokemonSummaryCard
                key={pokemon.id}
                pokemon={pokemon}
                variant="compact"
              />
            ))}
          </div>
        </section>
      )}

      <RelatedLinks data={relatedLinks} />

      {!isBerryItem && (
        <OaksNotes note={oaksNotes} />
      )}

      <PokemonGoNotes note={pokemonGoNotes} />

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


      {!isBerryItem &&
        usableFlavorTextEntries.length >
        0 && (
        <section>
          <h2>Flavor Text</h2>

          {usableFlavorTextEntries.map(
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
      {!isBerryItem && (
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
            value={
              isDynamaxCrystal
                ? null
                : `${item.cost}`
            }
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
      )}



{/*                                                                    attributes */}


      {!isBerryItem &&
        item.attributes?.length > 0 && (
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

      {isBerryItem &&
        usableFlavorTextEntries.length >
        0 && (
        <section
          style={{
            marginBottom: "3rem",
            paddingBottom: "2rem"
          }}
        >
          <h2>Game Descriptions</h2>

          {usableFlavorTextEntries.map(
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
                    color: "#c9cdd6",
                    fontSize: ".85rem",
                    marginTop: ".35rem"
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





{/* --------------------------flavortext */}










    </div>
  );
}

export default ItemDetailPage;
