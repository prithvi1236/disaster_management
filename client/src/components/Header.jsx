import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { isAuthenticated, getCurrentUser, logout } from "../services/auth.js";
import "../styles/header.css";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Check authentication state on mount and route changes
    const checkAuthState = () => {
      if (isAuthenticated()) {
        setUser(getCurrentUser());
      } else {
        setUser(null);
      }
    };

    checkAuthState();

    // Listen for authentication state changes
    const handleAuthStateChange = (event) => {
      const { user: newUser, authenticated } = event.detail;
      if (authenticated) {
        setUser(newUser);
      } else {
        setUser(null);
      }
    };

    window.addEventListener("authStateChanged", handleAuthStateChange);

    // Cleanup event listener
    return () => {
      window.removeEventListener("authStateChanged", handleAuthStateChange);
    };
  }, [location]); // Re-run when location changes

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    setUser(null);
    closeMenu();
  };

  // Role-based navigation
  const getNavigationLinks = () => {
    if (!user) {
      // Public/unauthenticated users - no signup needed for normal users
      return [
        { path: "/", label: "Home" },
        { path: "/disasters", label: "Disasters" },
        { path: "/volunteer-signup", label: "Volunteer" },
        { path: "/donate", label: "Donate" },
        { path: "/login", label: "Staff Login" },
      ];
    }

    // Common links for all authenticated users
    const commonLinks = [
      { path: "/", label: "Home" },
      { path: "/dashboard", label: "Dashboard" },
    ];

    // Role-specific links
    let roleLinks = [];

    if (user.role === "admin") {
      roleLinks = [
        { path: "/disasters", label: "Disasters" },
        { path: "/admin/volunteers", label: "Manage Volunteers" },
        { path: "/admin/requests", label: "Approve Requests" },
        { path: "/admin/disasters", label: "Manage Disasters" },
      ];
    } else if (user.role === "camp_coordinator") {
      roleLinks = [
        { path: "/disasters", label: "Disasters" },
        { path: "/coordinator/volunteers", label: "Volunteers" },
        { path: "/coordinator/camps", label: "My Camps" },
        { path: "/coordinator/requests", label: "My Requests" },
      ];
    } else {
      // Regular user/volunteer
      roleLinks = [
        { path: "/disasters", label: "Disasters" },
        { path: "/volunteer-portal", label: "Volunteer Portal" },
        { path: "/volunteer-signup", label: "Register" },
        { path: "/donate", label: "Donate" },
      ];
    }

    // Auth links
    const authLinks = [{ action: handleLogout, label: "Logout" }];

    return [...commonLinks, ...roleLinks, ...authLinks];
  };

  const navLinks = getNavigationLinks();

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
          {user && <span className="user-greeting">Hi, {user.full_name}</span>}
          {navLinks.map(({ path, label, primary, action }, index) =>
            action ? (
              <button
                key={index}
                onClick={action}
                className={`nav-link nav-button${
                  primary ? " nav-link--primary" : ""
                }`}
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
          )}
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
