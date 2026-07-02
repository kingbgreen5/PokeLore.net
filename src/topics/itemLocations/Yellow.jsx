import ItemLocationTopicPage from "../ItemLocationTopicPage";
import { itemLocationTopics } from "../topicMetadata";

const topic = itemLocationTopics.find(
  currentTopic =>
    currentTopic.slug ===
    "pokemon-yellow-item-locations"
);

function YellowItemLocations() {
  return (
    <ItemLocationTopicPage
      game="Pokémon Yellow"
      topic={topic}
    />
  );
}

export default YellowItemLocations;
