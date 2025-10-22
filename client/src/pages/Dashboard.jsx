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
    <div className="container">
      <div className="flex justify-between items-center" style={{ margin: 'var(--spacing-4xl) 0 var(--spacing-2xl) 0' }}>
        <div>
          <h1 className="mb-sm">Dashboard</h1>
          <p className="text-muted mb-0">Welcome back, {user.full_name} ({user.role})</p>
        </div>
        <button className="btn btn-secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {stats && (
        <div className="mb-2xl">
          <h3 className="mb-lg">System Overview</h3>
          <div className="grid grid-auto-fit gap-lg">
            <div className="card text-center">
              <h4 className="text-4xl font-bold text-primary mb-sm">{stats.total_disasters}</h4>
              <p className="text-muted mb-0">Total Disasters</p>
            </div>
            <div className="card text-center">
              <h4 className="text-4xl font-bold text-primary mb-sm">{stats.active_disasters}</h4>
              <p className="text-muted mb-0">Active Disasters</p>
            </div>
            <div className="card text-center">
              <h4 className="text-4xl font-bold text-primary mb-sm">{stats.total_camps}</h4>
              <p className="text-muted mb-0">Relief Camps</p>
            </div>
            <div className="card text-center">
              <h4 className="text-4xl font-bold text-primary mb-sm">{stats.total_volunteers}</h4>
              <p className="text-muted mb-0">Volunteers</p>
            </div>
            <div className="card text-center">
              <h4 className="text-4xl font-bold text-primary mb-sm">{stats.total_donations}</h4>
              <p className="text-muted mb-0">Donations</p>
            </div>
            <div className="card text-center">
              <h4 className="text-4xl font-bold text-primary mb-sm">₹{stats.total_donation_amount.toLocaleString()}</h4>
              <p className="text-muted mb-0">Total Amount</p>
            </div>
            <div className="card text-center">
              <h4 className="text-4xl font-bold text-primary mb-sm">{stats.pending_resource_requests}</h4>
              <p className="text-muted mb-0">Pending Requests</p>
            </div>
          </div>
        </div>
      )}

      {activity.length > 0 && (
        <div className="mb-2xl">
          <h3 className="mb-lg">Recent Activity</h3>
          <div className="card">
            {activity.map((item, index) => (
              <div key={index} className="flex items-center gap-lg" style={{ padding: 'var(--spacing-lg)', borderBottom: index < activity.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <span className={`badge badge-${item.type === 'donation' ? 'success' : item.type === 'volunteer' ? 'primary' : 'warning'}`}>
                  {item.type}
                </span>
                <span className="flex-1 text-secondary">{item.message}</span>
                <span className="text-muted text-sm">
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-lg">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-lg">
          {user.role === 'admin' ? (
            <>
              <a href="/admin/volunteers" className="btn btn-primary">Approve Volunteers</a>
              <a href="/admin/disasters" className="btn btn-primary">Manage Disasters</a>
              <a href="/admin/requests" className="btn btn-warning">Approve Requests</a>
              <a href="/disasters" className="btn btn-secondary">View Disasters</a>
            </>
          ) : user.role === 'camp_coordinator' ? (
            <>
              <a href="/coordinator/camps" className="btn btn-primary">Manage My Camps</a>
              <a href="/coordinator/requests" className="btn btn-warning">My Requests</a>
              <a href="/coordinator/volunteers" className="btn btn-secondary">View Volunteers</a>
              <a href="/disasters" className="btn btn-secondary">View Disasters</a>
            </>
          ) : (
            <>
              <a href="/disasters" className="btn btn-primary">View Disasters</a>
              <a href="/volunteer-portal" className="btn btn-success">Volunteer Portal</a>
              <a href="/volunteer-signup" className="btn btn-secondary">Register Volunteer</a>
              <a href="/donate" className="btn btn-warning">Make Donation</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
