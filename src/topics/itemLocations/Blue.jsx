import ItemLocationTopicPage from "../ItemLocationTopicPage";
import { itemLocationTopics } from "../topicMetadata";

const topic = itemLocationTopics.find(
  currentTopic =>
    currentTopic.slug ===
    "pokemon-blue-item-locations"
);

function BlueItemLocations() {
  return (
    <ItemLocationTopicPage
      game="Pokémon Blue"
      topic={topic}
    />
  );
}

export default BlueItemLocations;
