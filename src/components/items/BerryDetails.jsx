import OaksNotes from "../OaksNotes";
import { normalizeDisplayText } from "../../utils/normalizeText";

const FLAVOR_SCALE_MAX = 40;

const CONTEST_CONDITION_BY_FLAVOR = {
  spicy: "Coolness",
  dry: "Beauty",
  sweet: "Cuteness",
  bitter: "Cleverness",
  sour: "Toughness"
};

const sectionStyle = {
  border: "1px solid #666",
  borderRadius: "12px",
  marginBottom: "2rem",
  padding: "1rem",
  textAlign: "left"
};

function capitalize(text) {
  return String(text ?? "")
    .split("-")
    .filter(Boolean)
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function hasValue(value) {
  return (
    value !== null &&
    value !== undefined &&
    value !== ""
  );
}

function DetailRow({
  label,
  value
}) {
  if (!hasValue(value)) {
    return null;
  }

  return (
    <div>
      <strong>{label}</strong>
      <p>{value}</p>
    </div>
  );
}

function InfoGrid({
  children
}) {
  const rows =
    Array.isArray(children)
      ? children.filter(Boolean)
      : children;

  if (
    Array.isArray(rows) &&
    rows.length === 0
  ) {
    return null;
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "1rem",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(160px, 1fr))"
      }}
    >
      {rows}
    </div>
  );
}

function Badge({
  children
}) {
  if (!children) {
    return null;
  }

  return (
    <span
      style={{
        border: "1px solid #888",
        borderRadius: "999px",
        display: "inline-flex",
        fontSize: ".85rem",
        fontWeight: 700,
        padding: ".3rem .7rem"
      }}
    >
      {children}
    </span>
  );
}

function Section({
  title,
  children
}) {
  if (!children) {
    return null;
  }

  return (
    <section style={sectionStyle}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function getTextSignals(text) {
  const normalized =
    String(text ?? "").toLowerCase();

  return {
    directUse:
      /used on|using it|used for|use it|cures|restores|lowers/.test(
        normalized
      ),
    heldUse:
      /held|holder|holding|if held|when held|consumed when|held in battle/.test(
        normalized
      )
  };
}

function buildPrimaryEffect(item) {
  const summary =
    normalizeDisplayText(
      item?.shortEffect
    );
  const effect =
    normalizeDisplayText(
      item?.effect
    );
  const signals =
    getTextSignals(
      `${summary ?? ""} ${effect ?? ""}`
    );

  return {
    summary,
    effect,
    directUse:
      signals.directUse,
    heldUse:
      signals.heldUse,
    category:
      item?.category?.displayName ??
      item?.categoryDisplayName
  };
}

function classifyUse(text) {
  const normalized =
    String(text ?? "").toLowerCase();
  const uses = [];

  if (/pok.*block|pokeblock/.test(normalized)) {
    uses.push("Pokeblock ingredient");
  }

  if (/poffin/.test(normalized)) {
    uses.push("Poffin ingredient");
  }

  if (/powder|berry crush|crusher/.test(normalized)) {
    uses.push("Berry Powder");
  }

  if (/curry/.test(normalized)) {
    uses.push("Curry ingredient");
  }

  if (/catch|bait|given to them/.test(normalized)) {
    uses.push("Wild Pokemon bait");
  }

  if (
    /held|consumed|recover|restore|heal|cure|weakens|lessen|boost|raises|lowers|friendly|friendship|happiness|base points|effort/.test(
      normalized
    )
  ) {
    uses.push("Battle or direct item effect");
  }

  if (/maniac|buy it/.test(normalized)) {
    uses.push("Maniac sale");
  }

  if (/cooking/.test(normalized)) {
    uses.push("Cooking ingredient");
  }

  return uses;
}

function buildUsesByGame(item) {
  return (
    item?.flavorTextEntries
      ?.map((entry, index) => ({
        id:
          `${entry.versionGroups?.join("-")}-${index}`,
        versionGroups:
          entry.versionGroups ?? [],
        text:
          normalizeDisplayText(
            entry.text
          ),
        uses:
          classifyUse(entry.text)
      }))
      .filter(
        entry =>
          entry.uses.length > 0
      ) ?? []
  );
}

function buildProcessingUses(mechanics) {
  if (!mechanics) {
    return null;
  }

  const flavorPotencies =
    mechanics.flavorPotencies ?? {};
  const flavorEntries =
    Object.entries(
      flavorPotencies
    );

  if (
    flavorEntries.length === 0 &&
    !hasValue(mechanics.smoothness)
  ) {
    return null;
  }

  const maxPotency =
    Math.max(
      FLAVOR_SCALE_MAX,
      ...flavorEntries.map(
        ([, potency]) =>
          Number(potency) || 0
      )
    );

  const flavorProfile =
    mechanics.dominantFlavors
      ?.map(capitalize)
      .join(" / ");

  return {
    flavorEntries,
    flavorProfile,
    maxPotency,
    smoothness:
      mechanics.smoothness
  };
}

function BerrySummary({
  item,
  presentation
}) {
  const summary =
    presentation.primaryEffect.summary;

  if (!summary) {
    return null;
  }

  return (
    <section
      aria-label={`${item.displayName} summary`}
      style={{
        backgroundColor: "#202020",
        border: "1px solid #555",
        borderRadius: "12px",
        margin: "0 auto 2rem",
        maxWidth: "760px",
        padding: "1rem",
        textAlign: "left"
      }}
    >
      <p
        style={{
          color: "#f3f4f6",
          fontSize: "1.05rem",
          lineHeight: 1.45
        }}
      >
        {summary}
      </p>
    </section>
  );
}

function WhatThisBerryDoes({
  presentation
}) {
  const {
    primaryEffect
  } = presentation;

  if (
    !primaryEffect.summary &&
    !primaryEffect.effect
  ) {
    return null;
  }

  return (
    <Section title="What This Berry Does">
      <div
        style={{
          display: "grid",
          gap: "1rem"
        }}
      >
        <p>
          {primaryEffect.effect ??
            primaryEffect.summary}
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: ".5rem"
          }}
        >
    
        </div>
      </div>
    </Section>
  );
}

function BerryLocationsSection({
  locationsByGame
}) {
  if (
    !Array.isArray(locationsByGame) ||
    locationsByGame.length === 0
  ) {
    return null;
  }

  return (
    <Section title="Where to Find It">
      <div>
        {locationsByGame.map(group => (
          <article key={group.id}>
            <h3>{group.label}</h3>
          </article>
        ))}
      </div>
    </Section>
  );
}

function UsesByGame({
  usesByGame
}) {
  if (usesByGame.length === 0) {
    return null;
  }

  return (
    <Section title="Uses by Game">
      <div
        style={{
          display: "grid",
          gap: ".85rem"
        }}
      >
        {usesByGame.map(entry => (
          <article
            key={entry.id}
            style={{
              border: "1px solid #555",
              borderRadius: "12px",
              padding: ".85rem"
            }}
          >
            <h3
              style={{
                color: "var(--text-h)",
                fontSize: "1rem",
                margin: "0 0 .5rem"
              }}
            >
              {entry.versionGroups
                .map(capitalize)
                .join(" / ")}
            </h3>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: ".4rem",
                marginBottom: ".65rem"
              }}
            >
              {entry.uses.map(use => (
                <Badge key={use}>
                  {use}
                </Badge>
              ))}
            </div>

            <p>{entry.text}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

function GrowthAndHarvest({
  mechanics
}) {
  if (!mechanics) {
    return null;
  }

  const hasGrowthData =
    hasValue(mechanics.growthTime) ||
    hasValue(mechanics.maxHarvest) ||
    hasValue(mechanics.soilDryness);

  if (!hasGrowthData) {
    return null;
  }

  const fullGrowthCycle =
    hasValue(mechanics.growthTime)
      ? mechanics.growthTime * 4
      : null;

  return (
    <Section title="Growth and Harvest">
      <p
        style={{
          marginBottom: "1rem"
        }}
      >
        Generation IV cultivation data from
        PokeAPI's Berry endpoint. These values
        should not be treated as universal across
        every Pokemon game.
      </p>

      <InfoGrid>
        <DetailRow
          label="Time per growth stage"
          value={
            hasValue(mechanics.growthTime)
              ? `${mechanics.growthTime} hours`
              : null
          }
        />
        <DetailRow
          label="Approximate full growth cycle"
          value={
            hasValue(fullGrowthCycle)
              ? `${fullGrowthCycle} hours`
              : null
          }
        />
        <DetailRow
          label="Maximum harvest"
          value={mechanics.maxHarvest}
        />
        <DetailRow
          label="Soil moisture loss"
          value={
            hasValue(mechanics.soilDryness)
              ? `${mechanics.soilDryness}% per hour`
              : null
          }
        />
      </InfoGrid>
    </Section>
  );
}

function FlavorBars({
  processingUses
}) {
  if (!processingUses) {
    return null;
  }

  return (
    <div
      style={{
        display: "grid",
        gap: ".5rem",
        marginTop: "1rem"
      }}
    >
      {processingUses.flavorEntries.map(
        ([flavor, potency]) => (
          <div
            key={flavor}
            style={{
              alignItems: "center",
              display: "grid",
              gap: ".6rem",
              gridTemplateColumns:
                "150px minmax(0, 1fr) 40px"
            }}
          >
            <span>
              {capitalize(flavor)}
              {CONTEST_CONDITION_BY_FLAVOR[
                flavor
              ]
                ? ` / ${
                    CONTEST_CONDITION_BY_FLAVOR[
                      flavor
                    ]
                  }`
                : ""}
            </span>
            <div
              aria-label={`${capitalize(flavor)} flavor potency`}
              aria-valuemin={0}
              aria-valuemax={
                processingUses.maxPotency
              }
              aria-valuenow={potency}
              role="progressbar"
              style={{
                backgroundColor:
                  "rgba(255, 255, 255, .08)",
                borderRadius: "999px",
                height: "8px",
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  backgroundColor:
                    potency > 0
                      ? "#84cc16"
                      : "transparent",
                  height: "100%",
                  width: `${Math.round(
                    (potency /
                      processingUses.maxPotency) *
                      100
                  )}%`
                }}
              />
            </div>
            <strong
              style={{
                color: "var(--text-h)",
                textAlign: "right"
              }}
            >
              {potency}
            </strong>
          </div>
        )
      )}
    </div>
  );
}

function ContestCookingCrafting({
  processingUses
}) {
  if (!processingUses) {
    return null;
  }

  return (
    <Section title="Contest, Cooking, and Crafting">
      <p
        style={{
          marginBottom: "1rem"
        }}
      >
        Flavor values affect Berry-processing
        systems such as Pokeblocks and Poffins
        when those systems are present.
      </p>

      <InfoGrid>
        <div>
          <strong>Flavor Profile</strong>
        </div>
        <DetailRow
          label="Smoothness"
          value={
            processingUses.smoothness
          }
        />
      </InfoGrid>

      <FlavorBars
        processingUses={processingUses}
      />
    </Section>
  );
}

function LegacyBattleMechanics({
  mechanics,
  item
}) {
  const hasNaturalGift =
    mechanics &&
    (hasValue(
      mechanics.naturalGiftType
    ) ||
      hasValue(
        mechanics.naturalGiftPower
      ));
  const hasFling =
    hasValue(item?.fling?.power) ||
    hasValue(item?.fling?.effect);

  if (
    !hasNaturalGift &&
    !hasFling
  ) {
    return null;
  }

  return (
    <Section title="Legacy Battle Mechanics">
      <p
        style={{
          marginBottom: "1rem"
        }}
      >
        These values come from the current item
        and Berry datasets and should not be read
        as universal modern-game behavior.
      </p>

      <InfoGrid>
        {hasNaturalGift && (
          <>
            <DetailRow
              label="Natural Gift context"
              value="PokeAPI Berry endpoint value; generation-specific Natural Gift changes are not yet modeled."
            />
            <DetailRow
              label="Natural Gift type"
              value={capitalize(
                mechanics.naturalGiftType
              )}
            />
            <DetailRow
              label="Natural Gift power"
              value={
                mechanics.naturalGiftPower
              }
            />
          </>
        )}
        {hasFling && (
          <>
            <DetailRow
              label="Fling power"
              value={item.fling?.power}
            />
            <DetailRow
              label="Fling effect"
              value={capitalize(
                item.fling?.effect
              )}
            />
          </>
        )}
      </InfoGrid>
    </Section>
  );
}

function PhysicalData({
  mechanics,
  item,
  berryData
}) {
  const hasPhysicalData =
    mechanics &&
    (hasValue(mechanics.firmness) ||
      hasValue(mechanics.size) ||
      hasValue(mechanics.pokeApiBerryId));

  if (!hasPhysicalData) {
    return null;
  }

  return (
    <Section title="Physical Properties">
      <InfoGrid>
   
    
  
        <DetailRow
          label="Firmness"
          value={capitalize(
            mechanics.firmness 
          )}
          
        />
        <DetailRow
          label="Size"
          value={
            hasValue(mechanics.size)
              ? `${mechanics.size} mm`
              : null
          }
        />
      </InfoGrid>
    </Section>
  );
}

function ItemOnlyBerryNotice({
  berryData
}) {
  if (
    !berryData ||
    berryData.mechanics
  ) {
    return null;
  }

  return (
    <Section title="Berry Data">
      <p>
        This item is in the berry pocket, but
        PokeAPI does not currently provide a
        dedicated Berry mechanics payload for it.
      </p>
    </Section>
  );
}

function buildBerryPresentation(
  item,
  berryData
) {
  const mechanics =
    berryData?.mechanics ?? null;

  return {
    primaryEffect:
      buildPrimaryEffect(item),
    locationsByGame: [],
    usesByGame:
      buildUsesByGame(item),
    growthByGame:
      mechanics ? [mechanics] : [],
    processingUses:
      buildProcessingUses(mechanics),
    legacyBattleMechanics: {
      naturalGiftByGeneration:
        mechanics
          ? [
              {
                source:
                  "PokeAPI Berry endpoint",
                type:
                  mechanics.naturalGiftType,
                power:
                  mechanics.naturalGiftPower
              }
            ]
          : [],
      fling:
        item?.fling ?? {}
    },
    physicalData:
      mechanics
        ? {
            firmness:
              mechanics.firmness,
            size:
              mechanics.size,
            berryNumber:
              mechanics.pokeApiBerryId,
            itemNumber:
              item?.id
          }
        : {}
  };
}

function BerryDetails({
  item,
  berryData,
  oaksNotes
}) {
  const presentation =
    buildBerryPresentation(
      item,
      berryData
    );
  const mechanics =
    berryData?.mechanics ?? null;

  return (
    <>
      <WhatThisBerryDoes
        presentation={presentation}
      />
      <OaksNotes note={oaksNotes} />
      <BerryLocationsSection
        locationsByGame={
          presentation.locationsByGame
        }
      />
      {/*
        Uses by Game is intentionally hidden for now.
        The generated flavor-text grouping is repetitive and
        hard to keep perfectly accurate until we add curated,
        game-specific Berry usage notes.
        <UsesByGame
          usesByGame={
            presentation.usesByGame
          }
        />
      */}
      <GrowthAndHarvest
        mechanics={mechanics}
      />
      <ContestCookingCrafting
        processingUses={
          presentation.processingUses
        }
      />
      <LegacyBattleMechanics
        mechanics={mechanics}
        item={item}
      />
      <PhysicalData
        mechanics={mechanics}
        item={item}
        berryData={berryData}
      />
      <ItemOnlyBerryNotice
        berryData={berryData}
      />
    </>
  );
}

export {
  BerryLocationsSection,
  buildBerryPresentation
};

export default BerryDetails;
