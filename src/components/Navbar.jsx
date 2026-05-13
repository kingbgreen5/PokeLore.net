function Navbar({ setPage }) {
  return (
    <nav
      style={{
        display: "flex",
        gap: "1rem",
        padding: "1rem",
        borderBottom: "1px solid #ccc"
        
      }}
    >
      <button onClick={() => setPage("dex")}>
        Pokédex Entries
      </button>

      <button onClick={() => setPage("learnsets")}>
        Pokémon Learnsets
      </button>

      <button onClick={() => setPage("moves")}>
        Moves
      </button>

    </nav>
  );
}

export default Navbar;