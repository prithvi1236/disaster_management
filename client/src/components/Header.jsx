import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { isAuthenticated, getCurrentUser, logout } from "../services/auth.js";
import "../styles/header.css";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getCurrentUser());
    }
  }, []);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    setUser(null);
    closeMenu();
  };

  const publicLinks = [
    { path: "/", label: "Home" },
    { path: "/disasters", label: "Disasters" },
    { path: "/volunteer-signup", label: "Volunteer" },
    { path: "/donate", label: "Donate" },
  ];

  const authLinks = user ? [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/volunteer-portal", label: "Volunteer Portal" },
    { action: handleLogout, label: "Logout" },
  ] : [
    { path: "/login", label: "Login" },
    { path: "/signup", label: "Sign Up", primary: true },
  ];

  const navLinks = [...publicLinks, ...authLinks];

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
          {user && (
            <span className="user-greeting">
              Hi, {user.full_name}
            </span>
          )}
          {navLinks.map(({ path, label, primary, action }, index) => (
            action ? (
              <button
                key={index}
                onClick={action}
                className={`nav-link nav-button${primary ? " nav-link--primary" : ""}`}
              >
                {label}
              </button>
            ) : (
              <Link
                key={path}
                to={path}
                className={`nav-link${primary ? " nav-link--primary" : ""}`}
                onClick={closeMenu}
              >
                {label}
              </Link>
            )
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
