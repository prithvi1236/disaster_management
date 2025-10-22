import React, { useState, useEffect } from 'react';
import { getCurrentUser, logout } from '../services/auth.js';
import { fetchDashboardStats, fetchRecentActivity } from '../services/api.js';
import '../styles/dashboard.css';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentUser = getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        const [dashboardStats, recentActivity] = await Promise.all([
          fetchDashboardStats(),
          fetchRecentActivity()
        ]);
        setStats(dashboardStats);
        setActivity(recentActivity);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="dashboard container">
        <h2>Dashboard</h2>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard container">
        <h2>Dashboard</h2>
        <p>
          Please <a href="/login">login</a> to access your dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard container">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <div className="user-info">
          <span>Welcome, {user.full_name}</span>
          <span className="user-role">({user.role})</span>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {stats && (
        <div className="dashboard-stats">
          <h3>System Overview</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <h4>{stats.total_disasters}</h4>
              <p>Total Disasters</p>
            </div>
            <div className="stat-card">
              <h4>{stats.active_disasters}</h4>
              <p>Active Disasters</p>
            </div>
            <div className="stat-card">
              <h4>{stats.total_camps}</h4>
              <p>Relief Camps</p>
            </div>
            <div className="stat-card">
              <h4>{stats.total_volunteers}</h4>
              <p>Volunteers</p>
            </div>
            <div className="stat-card">
              <h4>{stats.total_donations}</h4>
              <p>Donations</p>
            </div>
            <div className="stat-card">
              <h4>₹{stats.total_donation_amount.toLocaleString()}</h4>
              <p>Total Amount</p>
            </div>
            <div className="stat-card">
              <h4>{stats.pending_resource_requests}</h4>
              <p>Pending Requests</p>
            </div>
          </div>
        </div>
      )}

      {activity.length > 0 && (
        <div className="dashboard-activity">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {activity.map((item, index) => (
              <div key={index} className="activity-item">
                <span className={`activity-type ${item.type}`}>{item.type}</span>
                <span className="activity-message">{item.message}</span>
                <span className="activity-time">
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          {user.role === 'admin' ? (
            <>
              <a href="/admin/volunteers" className="btn btn-primary">Approve Volunteers</a>
              <a href="/admin/disasters" className="btn btn-primary">Manage Disasters</a>
              <a href="/admin/requests" className="btn btn-primary">Approve Requests</a>
              <a href="/disasters" className="btn btn-secondary">View Disasters</a>
            </>
          ) : user.role === 'camp_coordinator' ? (
            <>
              <a href="/coordinator/camps" className="btn btn-primary">Manage My Camps</a>
              <a href="/coordinator/requests" className="btn btn-primary">My Requests</a>
              <a href="/coordinator/volunteers" className="btn btn-secondary">View Volunteers</a>
              <a href="/disasters" className="btn btn-secondary">View Disasters</a>
            </>
          ) : (
            <>
              <a href="/disasters" className="btn btn-primary">View Disasters</a>
              <a href="/volunteer-portal" className="btn btn-primary">Volunteer Portal</a>
              <a href="/volunteer-signup" className="btn btn-secondary">Register Volunteer</a>
              <a href="/donate" className="btn btn-secondary">Make Donation</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
