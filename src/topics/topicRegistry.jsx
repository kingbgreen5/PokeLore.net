import BlueItemLocations from "./itemLocations/Blue";
import FeebasBeautyEvolutionGuide from "./FeebasBeautyEvolutionGuide";
import FossilPokemonGuide from "./FossilPokemonGuide";
import HerbaMysticaGuide from "./HerbaMysticaGuide";
import RedItemLocations from "./itemLocations/Red";
import YellowItemLocations from "./itemLocations/Yellow";
import { itemLocationTopics } from "./topicMetadata";

const itemLocationTopicComponents = {
  "evolving-feebas-into-milotic-via-beauty":
    FeebasBeautyEvolutionGuide,
  "fossil-pokemon-guide":
    FossilPokemonGuide,
  "herba-mystica": HerbaMysticaGuide,
  "pokemon-red-item-locations":
    RedItemLocations,
  "pokemon-blue-item-locations":
    BlueItemLocations,
  "pokemon-yellow-item-locations":
    YellowItemLocations
};

const staticTopics = [
  ...itemLocationTopics
];

export {
  itemLocationTopicComponents,
  staticTopics
};
