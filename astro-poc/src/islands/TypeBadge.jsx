// Adapted from production; see PARITY_PLAN.md.
import bug from "../../../src/assets/Type Badges/BUG.png?url";
import dark from "../../../src/assets/Type Badges/DARK.png?url";
import dragon from "../../../src/assets/Type Badges/DRAGON.png?url";
import electric from "../../../src/assets/Type Badges/ELECTRIC.png?url";
import fairy from "../../../src/assets/Type Badges/FAIRY.png?url";
import fighting from "../../../src/assets/Type Badges/FIGHTING.png?url";
import fire from "../../../src/assets/Type Badges/FIRE.png?url";
import flying from "../../../src/assets/Type Badges/FLYING.png?url";
import ghost from "../../../src/assets/Type Badges/GHOST.png?url";
import grass from "../../../src/assets/Type Badges/GRASS.png?url";
import ground from "../../../src/assets/Type Badges/GROUND.png?url";
import ice from "../../../src/assets/Type Badges/ICE.png?url";
import normal from "../../../src/assets/Type Badges/NORMAL.png?url";
import poison from "../../../src/assets/Type Badges/POISON.png?url";
import psychic from "../../../src/assets/Type Badges/PSYCHIC.png?url";
import rock from "../../../src/assets/Type Badges/ROCK.png?url";
import steel from "../../../src/assets/Type Badges/STEEL.png?url";
import water from "../../../src/assets/Type Badges/WATER.png?url";

const typeBadgeImages = {
  bug,
  dark,
  dragon,
  electric,
  fairy,
  fighting,
  fire,
  flying,
  ghost,
  grass,
  ground,
  ice,
  normal,
  poison,
  psychic,
  rock,
  steel,
  water
};

function TypeBadge({
  alt,
  height = "1.5rem",
  type
}) {
  const normalizedType =
    type?.toLowerCase();
  const src =
    typeBadgeImages[normalizedType];

  if (!src) {
    return null;
  }

  return (
    <img
      alt={alt ?? `${normalizedType} type`}
      src={src}
      style={{
        display: "block",
        height,
        maxWidth: "100%",
        objectFit: "contain",
        width: "auto"
      }}
    />
  );
}

export default TypeBadge;
