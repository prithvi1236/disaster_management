import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/header.css";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/disasters", label: "Disasters" },
    { path: "/volunteer-signup", label: "Volunteer" },
    { path: "/donate", label: "Donate" },
    { path: "/login", label: "Login", primary: true },
  ];

  return (
    <header className="header">
      <div className="header-container">
        {/* Brand */}
        <div className="header-brand">
          <Link to="/" onClick={closeMenu}>
            <h1>Direma</h1>
          </Link>
        </div>

        {/* Navigation */}
        <nav className={`header-nav ${menuOpen ? "header-nav--open" : ""}`}>
          {navLinks.map(({ path, label, primary }) => (
            <Link
              key={path}
              to={path}
              className={`nav-link${primary ? " nav-link--primary" : ""}`}
              onClick={closeMenu}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile menu toggle */}
        <button
          className={`menu-toggle ${menuOpen ? "menu-toggle--open" : ""}`}
          onClick={toggleMenu}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          <span className="menu-line" />
          <span className="menu-line" />
          <span className="menu-line" />
        </button>
      </div>
    </header>
  );
}
