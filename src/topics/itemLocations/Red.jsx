import ItemLocationTopicPage from "../ItemLocationTopicPage";
import { itemLocationTopics } from "../topicMetadata";

const topic = itemLocationTopics.find(
  currentTopic =>
    currentTopic.slug ===
    "pokemon-red-item-locations"
);

function RedItemLocations() {
  return (
    <ItemLocationTopicPage
      game="Pokémon Red"
      topic={topic}
    />
  );
}

export default RedItemLocations;
