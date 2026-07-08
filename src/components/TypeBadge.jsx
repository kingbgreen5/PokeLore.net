import bug from "../assets/Type Badges/BUG.png";
import dark from "../assets/Type Badges/DARK.png";
import dragon from "../assets/Type Badges/DRAGON.png";
import electric from "../assets/Type Badges/ELECTRIC.png";
import fairy from "../assets/Type Badges/FAIRY.png";
import fighting from "../assets/Type Badges/FIGHTING.png";
import fire from "../assets/Type Badges/FIRE.png";
import flying from "../assets/Type Badges/FLYING.png";
import ghost from "../assets/Type Badges/GHOST.png";
import grass from "../assets/Type Badges/GRASS.png";
import ground from "../assets/Type Badges/GROUND.png";
import ice from "../assets/Type Badges/ICE.png";
import normal from "../assets/Type Badges/NORMAL.png";
import poison from "../assets/Type Badges/POISON.png";
import psychic from "../assets/Type Badges/PSYCHIC.png";
import rock from "../assets/Type Badges/ROCK.png";
import steel from "../assets/Type Badges/STEEL.png";
import water from "../assets/Type Badges/WATER.png";

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
      alt={`${normalizedType} type`}
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
