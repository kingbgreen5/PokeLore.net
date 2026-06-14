

import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav
      style={{
        display: "flex",
        gap: "1rem",
        padding: "1rem"
      }}
    >

      <Link to="/">
     Pokémon
      </Link>



      <Link to="/Moves">
        Moves
      </Link>

      {/* <Link to="/learnsets">
        Learnsets
      </Link> */}

<Link to="/abilities">
  Abilities
</Link>

      <Link to="/DexEntries">
        Entries
      </Link>

    </nav>
  );
}

export default Navbar;