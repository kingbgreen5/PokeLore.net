import OaksNotes from "./OaksNotes";

function PokemonGoNotes({
  note
}) {
  return (
    <OaksNotes
      defaultTitle={"Pok\u00e9mon Go"}
      note={note}
      warningLabel={"Pok\u00e9mon Go"}
    />
  );
}

export default PokemonGoNotes;
