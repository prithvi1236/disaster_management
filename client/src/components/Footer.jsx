import React from 'react';
import { Link } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from '../services/auth.js';
import '../styles/footer.css';

export default function Footer() {
  const user = isAuthenticated() ? getCurrentUser() : null;

  const getFooterLinks = () => {
    if (!user) {
      // Public/unauthenticated users - no signup needed
      return [
        { path: "/disasters", label: "Disaster Reports" },
        { path: "/volunteer-signup", label: "Volunteer Program" },
        { path: "/donate", label: "Emergency Donations" },
        { path: "/login", label: "Staff Login" },
      ];
    }

    // Role-specific footer links
    if (user.role === 'admin') {
      return [
        { path: "/disasters", label: "Disaster Management" },
        { path: "/admin/volunteers", label: "Volunteer Management" },
        { path: "/admin/requests", label: "Resource Requests" },
        { path: "/dashboard", label: "Admin Dashboard" },
      ];
    } else if (user.role === 'camp_coordinator') {
      return [
        { path: "/disasters", label: "Active Disasters" },
        { path: "/coordinator/volunteers", label: "Available Volunteers" },
        { path: "/coordinator/camps", label: "My Camps" },
        { path: "/dashboard", label: "Coordinator Dashboard" },
      ];
    } else {
      // Regular user/volunteer
      return [
        { path: "/disasters", label: "Disaster Reports" },
        { path: "/volunteer-portal", label: "My Volunteer Profile" },
        { path: "/volunteer-signup", label: "Register as Volunteer" },
        { path: "/donate", label: "Make Donation" },
      ];
    }
  };

  const footerLinks = getFooterLinks();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h3>Direma</h3>
          <p>Emergency Response & Disaster Management</p>
          {user && (
            <p className="footer-user-info">
              Logged in as: {user.full_name} ({user.role})
            </p>
          )}
        </div>

        <div className="footer-links">
          <div className="footer-section">
            <h4>{user ? `${user.role === 'admin' ? 'Admin' : user.role === 'camp_coordinator' ? 'Coordinator' : 'User'} Services` : 'Services'}</h4>
            {footerLinks.map(({ path, label }) => (
              <Link key={path} to={path}>{label}</Link>
            ))}
          </div>

          {user && (
            <div className="footer-section">
              <h4>Quick Actions</h4>
              {user.role === 'admin' && (
                <>
                  <Link to="/admin/volunteers">Approve Volunteers</Link>
                  <Link to="/admin/disasters">Add Disaster</Link>
                </>
              )}
              {user.role === 'camp_coordinator' && (
                <>
                  <Link to="/coordinator/requests">Create Request</Link>
                  <Link to="/coordinator/volunteers">Assign Volunteers</Link>
                </>
              )}
              {user.role === 'user' && (
                <>
                  <Link to="/volunteer-portal">My Profile</Link>
                  <Link to="/donate">Donate Now</Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-container">
          <p>© 2025 Direma. All rights reserved.</p>
          <p>
            {user 
              ? `Welcome ${user.full_name} - Making a difference in disaster management.`
              : 'Committed to saving lives and communities worldwide.'
            }
          </p>
        </div>
      </div>
    </footer>
  );
}
