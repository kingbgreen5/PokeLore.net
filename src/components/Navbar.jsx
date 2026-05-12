function Navbar({ setPage }) {
  return (
    <nav
      style={{
        display: "flex",
        gap: "1rem",
        padding: "1rem",
        borderBottom: "1px solid #ccc",
        marginBottom: "2rem"
      }}
    >
      <button onClick={() => setPage("dex")}>
        Pokédex Entries
      </button>

      <button onClick={() => setPage("moves")}>
        Pokémon Learnsets
      </button>
    </nav>
  );
}

export default Navbar;