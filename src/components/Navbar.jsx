import { useState } from "react";
import { NavLink } from "react-router-dom";

const dragoniteOrange = "#fab856";
const cardBackground = "#555555";
const cardBoarder = "#2c2c2c";

const menuSections = [
  {
    title: "Pokédex",
    links: [
      {
        to: "/",
        label: "Pokémon",
        description:
          "Browse by type, name, and National Dex number."
      },
      {
        to: "/DexEntries",
        label: "Entries",
        description:
          "Search flavor text across generations."
      }
    ]
  },
  {
    title: "Battle Data",
    links: [
      {
        to: "/moves",
        label: "Moves",
        description:
          "Power, accuracy, PP, and learnable Pokémon."
      },
      {
        to: "/abilities",
        label: "Abilities",
        description:
          "Effects and Pokémon with each ability."
      }
    ]
  },
  {
    title: "Items",
    links: [
      {
        to: "/items",
        label: "Items",
        description:
          "Held items, evolution stones, TMs, and more."
      }
    ]
  },


  // {
  //   title: "Quick Links",
  //   links: [
  //     {
  //       to: "/type/fire",
  //       label: "Fire Type",
  //       description:
  //         "Jump to a type detail page."
  //     },
  //     {
  //       to: "/type/water",
  //       label: "Water Type",
  //       description:
  //         "Review matchups and Pokémon."
  //     }
  //   ]
  // }



];

function Navbar() {
  const [menuOpen, setMenuOpen] =
    useState(false);

  return (
    <nav
      onMouseLeave={() =>
        setMenuOpen(false)
      }
      style={{
        display: "flex",
        justifyContent: "center",
        padding: ".5rem 1.5rem .5rem",
        position: "relative",
        zIndex: 10,
        textAlign:"left"
      }}
    >
      <div
        style={{
          maxWidth: "980px",
          position: "relative",
          width: "100%"
        }}
      >
        <button
          type="button"
          aria-expanded={menuOpen}
          onClick={() =>
            setMenuOpen(
              isOpen => !isOpen
            )
          }
          onMouseEnter={() =>
            setMenuOpen(true)
          }
          style={{
            alignItems: "center",
            backgroundColor: cardBackground,
            border:"2px solid",
            borderColor:cardBoarder,
            borderRadius: "12px",
            // boxShadow:
            //   "0 4px 12px rgba(242, 201, 76, .25)",
            color: "#f3f4f6",
            cursor: "pointer",
            display: "inline-flex",
            fontSize: "1.05rem",
            fontWeight: "bold",
            gap: ".5rem",
            justifyContent: "center",
            minWidth: "120px",
            padding: ".45rem .25rem"
          }}
        >
          Menu
          <span
            aria-hidden="true"
            style={{
              fontSize: ".85rem"
            }}
          >
            {menuOpen ? "▲" : "▼"}
          </span>
        </button>

        {menuOpen && (
          <div
            style={{
              backgroundColor: "#202127",
              border: "1px solid #555",
              borderRadius: "0 0 14px 14px",
              boxShadow:
                "0 18px 40px rgba(0, 0, 0, .28)",
              left: 0,
              marginTop: ".75rem",
              padding: "1.25rem",
              position: "absolute",
              right: 0,
              textAlign: "left"
            }}
          >
            <div
              style={{
                display: "grid",
                gap: "1rem",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(190px, 1fr))"
              }}
            >
              {menuSections.map(
                section => (
                  <div
                    key={section.title}
                    style={{
                      minWidth: 0
                    }}
                  >
                    <p
                      style={{
                        color:
                          dragoniteOrange,
                        fontSize: ".78rem",
                        fontWeight: "bold",
                        letterSpacing:
                          ".08rem",
                        marginBottom:
                          ".65rem",
                        textTransform:
                          "uppercase"
                      }}
                    >
                      {section.title}
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gap: ".45rem"
                      }}
                    >
                      {section.links.map(
                        link => (
                          <NavLink
                            key={link.to}
                            to={link.to}
                            onClick={() =>
                              setMenuOpen(false)
                            }
                            style={({
                              isActive
                            }) => ({
                              backgroundColor:
                                isActive
                                  ? "rgba(250, 184, 86, .18)"
                                  : "transparent",
                              border:
                                "1px solid transparent",
                              borderColor:
                                isActive
                                  ? "rgba(250, 184, 86, .55)"
                                  : "transparent",
                              borderRadius:
                                "8px",
                              color: "white",
                              display: "block",
                              padding:
                                ".7rem .75rem",
                              textDecoration:
                                "none"
                            })}
                          >
                            <strong>
                              › {link.label}
                            </strong>

                            <span
                              style={{
                                color:
                                  "#b8beca",
                                display:
                                  "block",
                                fontSize:
                                  ".82rem",
                                lineHeight: 1.3,
                                marginTop:
                                  ".25rem"
                              }}
                            >
                              {
                                link.description
                              }
                            </span>
                          </NavLink>
                        )
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
