import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser } from '../services/api';
import { normalizeRole, clearAuth } from '../utils/auth';
import "../styles/header.css";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated and get role
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('access_token');
      setIsAuthenticated(!!token);
      
      if (token) {
        try {
          // Import getCurrentUser here to avoid circular imports
          const { getCurrentUser } = await import('../services/api');
          const user = await getCurrentUser();
          setUserRole(user.role);
        } catch (error) {
          console.error('Failed to get user role:', error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
    };
    
    checkAuthStatus();
    
    // Listen for storage changes (logout from other tabs)
    window.addEventListener('storage', checkAuthStatus);
    
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    clearAuth();
    setIsAuthenticated(false);
    setUserRole(null);
    navigate('/');
    closeMenu();
  };

  const publicNavLinks = [
    { path: "/", label: "Home" },
    { path: "/disasters", label: "Disasters" },
    { path: "/volunteer-signup", label: "Volunteer" },
    { path: "/donate", label: "Donate" },
  ];

  const getAuthNavLinks = () => {
    const baseLinks = [
      { path: "/dashboard", label: "Dashboard" },
      { path: "/statistics", label: "Statistics" },
      { path: "/profile", label: "Profile" },
    ];

    // Add role-specific links
    const normalizedRole = normalizeRole(userRole);
    if (normalizedRole === 'admin') {
      baseLinks.splice(1, 0, { path: "/admin", label: "Admin Panel" });
      baseLinks.splice(2, 0, { path: "/reports", label: "Reports" });
    } else if (normalizedRole === 'coordinator') {
      baseLinks.splice(1, 0, { path: "/coordinator", label: "Coordinator Panel" });
      baseLinks.splice(2, 0, { path: "/reports", label: "Reports" });
    }

    return baseLinks;
  };

  const authNavLinks = getAuthNavLinks();

  return (
    <header className="header">
      <div className="header-container">
        {/* Brand */}
        <div className="header-brand">
          <Link to="/" onClick={closeMenu} className="brand-link">
            <h1 className="brand-text">Direma</h1>
          </Link>
        </div>

        {/* Navigation */}
        <nav className={`header-nav ${menuOpen ? "header-nav--open" : ""}`}>
          <div className="nav-section">
            {/* Public links */}
            {publicNavLinks.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className="nav-link"
                onClick={closeMenu}
              >
                {label}
              </Link>
            ))}

            {/* Authenticated user links */}
            {isAuthenticated && (
              <div className="nav-divider"></div>
            )}
            {isAuthenticated && authNavLinks.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className="nav-link nav-link--auth"
                onClick={closeMenu}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="nav-auth">
            {isAuthenticated ? (
              <button
                className="nav-link nav-link--logout"
                onClick={handleLogout}
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="nav-link nav-link--login"
                  onClick={closeMenu}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="nav-link nav-link--primary"
                  onClick={closeMenu}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
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
