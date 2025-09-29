import React from 'react';
import { getCurrentUser, logout } from '../services/mockAuth';
import '../styles/dashboard.css';

export default function Dashboard() {
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>

      {user ? (
        <div className="dashboard-user">
          <p>Welcome, {user.name || user.email}.</p>
          <p>Role: {user.role}</p>
          <button className="btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      ) : (
        <p>
          Please <a href="/login">login</a> to access your dashboard.
        </p>
      )}
    </div>
  );
}
