import { NavLink } from "react-router-dom";

const dragoniteOrange = "#fab856";

const navItems = [
  {
    to: "/",
    label: "Pokémon"
  },
  {
    to: "/moves",
    label: "Moves"
  },
  {
    to: "/abilities",
    label: "Abilities"
  },
  {
    to: "/items",
    label: "Items"
  },
  {
    to: "/DexEntries",
    label: "Entries"
  }
];

function Navbar() {
  return (
    <nav
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: ".75rem",
        justifyContent: "center",
        padding: ".75rem 1rem 1.25rem"
      }}
    >
      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          style={({ isActive }) => ({
            backgroundColor: isActive
              ? dragoniteOrange
              : "#2c2c2c",
            border: isActive
              ? "2px solid #f7df7e"
              : "2px solid #555",
            borderRadius: "12px",
            boxShadow: isActive
              ? "0 4px 12px rgba(250, 184, 86, .25)"
              : "none",
            boxSizing: "border-box",
            color: isActive
              ? "#1b1b1b"
              : "white",
            fontSize: "1rem",
            fontWeight: "bold",
            minWidth: "110px",
            padding: ".55rem .85rem",
            textAlign: "center",
            textDecoration: "none",
            transition:
              "transform .15s ease, border-color .15s ease, background-color .15s ease"
          })}
          onMouseEnter={event => {
            event.currentTarget.style.transform =
              "translateY(-2px)";
          }}
          onMouseLeave={event => {
            event.currentTarget.style.transform =
              "translateY(0)";
          }}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default Navbar;
