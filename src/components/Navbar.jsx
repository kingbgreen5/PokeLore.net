import {
  NavLink,
  useLocation
} from "react-router-dom";
import { useState } from "react";
import GlobalSiteSearch from "./GlobalSiteSearch";

const dragoniteOrange = "#fab856";

const navItems = [
  {
    to: "/",
    label: "Pokémon",
    matches: ["/pokemon"]
  },
  {
    to: "/moves",
    label: "Moves",
    matches: ["/move"]
  },
  {
    to: "/abilities",
    label: "Abilities",
    matches: ["/ability"]
  },
  {
    to: "/items",
    label: "Items",
    matches: ["/item"]
  },
  {
    to: "/locations",
    label: "Locations",
    matches: ["/location"]
  },
  // This Feature is not yet ready for prime time.
  {
    to: "/topics",
    label: "Topics",
    matches: ["/topic"]
  },
  {
    to: "/types",
    label: "Types",
    matches: ["/type"]
  },
  {
    to: "/team-coverage",
    label: "Team Coverage"
  },
  {
    to: "/dex-entries",
    label: "Entries"
  }
];

function Navbar() {
  const [menuOpen, setMenuOpen] =
    useState(false);
  const location = useLocation();

  const currentItem =
    navItems.find(item =>
      item.to === "/"
        ? location.pathname === "/" ||
          item.matches?.some(match =>
            location.pathname.startsWith(
              match
            )
          )
        : location.pathname.startsWith(
            item.to
          ) ||
          item.matches?.some(match =>
            location.pathname.startsWith(
              match
            )
          )
    ) ?? navItems[0];

  return (
    <nav
      style={{
        alignItems: "center",
        display: "grid",
        gap: ".85rem",
        justifyItems: "center",
        paddingLeft:"1rem",
        paddingRight:"1rem"
      }}
    >
      <GlobalSiteSearch />

      <div
        style={{
          position: "relative"
        }}
      >
        <button
          onClick={() =>
            setMenuOpen(open => !open)
          }
          type="button"
          style={{
            backgroundColor: menuOpen
              ? dragoniteOrange
              : "#2c2c2c",
            border: menuOpen
              ? "2px solid #f7df7e"
              : "2px solid #555",
            borderRadius: "12px",
            boxShadow: menuOpen
              ? "0 4px 12px rgba(250, 184, 86, .25)"
              : "none",
            boxSizing: "border-box",
            color: menuOpen
              ? "#1b1b1b"
              : "white",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
            minWidth: "190px",
            padding: ".55rem .85rem",
            textAlign: "center"
          }}
        >
          Menu: {currentItem.label} 
        </button>

        {menuOpen && (
          <div
            style={{
              backgroundColor: "#202020",
              border: "1px solid #555",
              borderRadius: "12px",
              boxShadow:
                "0 12px 28px rgba(0, 0, 0, .35)",
              display: "grid",
              gap: ".25rem",
              left: "50%",
              minWidth: "220px",
              padding: ".4rem",
              position: "absolute",
              top: "calc(100% + .4rem)",
              transform: "translateX(-50%)",
              zIndex: 15
            }}
          >
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() =>
                  setMenuOpen(false)
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive
                    ? dragoniteOrange
                    : "transparent",
                  border: isActive
                    ? "1px solid #f7df7e"
                    : "1px solid transparent",
                  borderRadius: "8px",
                  boxSizing: "border-box",
                  color: isActive
                    ? "#1b1b1b"
                    : "white",
                  display: "block",
                  fontSize: ".95rem",
                  fontWeight: "bold",
                  padding: ".55rem .75rem",
                  textAlign: "left",
                  textDecoration: "none"
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
