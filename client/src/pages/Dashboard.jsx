import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getCurrentUser, 
  getAvailableCamps, 
  getCampNeeds, 
  getVolunteerAssignments, 
  getDonationHistory, 
  getDonationImpact,
  getUserNotifications
} from '../services/api';
import { normalizeRole, getDashboardRoute, clearAuth, getRoleDisplayName } from '../utils/auth';
import '../styles/dashboard.css';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [availableCamps, setAvailableCamps] = useState([]);
  const [campNeeds, setCampNeeds] = useState([]);
  const [volunteerAssignments, setVolunteerAssignments] = useState([]);
  const [donationHistory, setDonationHistory] = useState([]);
  const [donationImpact, setDonationImpact] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load user data first
      const userData = await getCurrentUser();
      setUser(userData);

      // Redirect admin and coordinator to their specific dashboards
      const userRole = normalizeRole(userData.role);
      if (userRole === 'admin' || userRole === 'coordinator') {
        const dashboardRoute = getDashboardRoute(userData.role);
        navigate(dashboardRoute);
        return;
      }

      // Load user-specific data for volunteers and donors
      const dataPromises = [
        getAvailableCamps(),
        getCampNeeds(),
        getUserNotifications()
      ];

      if (userRole === 'volunteer') {
        dataPromises.push(getVolunteerAssignments());
      }

      if (userRole === 'donor') {
        dataPromises.push(getDonationHistory());
        dataPromises.push(getDonationImpact());
      }

      const results = await Promise.all(dataPromises);
      
      setAvailableCamps(results[0]);
      setCampNeeds(results[1]);
      setNotifications(results[2]);

      if (userRole === 'volunteer') {
        setVolunteerAssignments(results[3]);
      }

      if (userRole === 'donor') {
        setDonationHistory(results[3]);
        setDonationImpact(results[4]);
      }

    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data');
      
      // If authentication failed, redirect to login
      if (err.message.includes('401') || err.message.includes('authentication')) {
        clearAuth();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>{getRoleDisplayName(user?.role)} Dashboard</h2>
        <div className="user-info">
          <span>Welcome, {user?.full_name || user?.username}!</span>
          <span className="user-role">Role: {getRoleDisplayName(user?.role)}</span>
          <div className="header-actions">
            <button className="btn logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Available Camps Section */}
        <div className="section">
          <h3>Available Relief Camps</h3>
          {availableCamps.length === 0 ? (
            <p>No camps currently accepting {normalizeRole(user?.role) === 'volunteer' ? 'volunteers' : 'donations'}.</p>
          ) : (
            <div className="camps-grid">
              {availableCamps.slice(0, 6).map(camp => (
                <div key={camp.camp_id} className="camp-card">
                  <h4>{camp.name}</h4>
                  <p><strong>Location:</strong> {camp.location}</p>
                  <p><strong>Capacity:</strong> {camp.current_occupancy} / {camp.capacity}</p>
                  <p><strong>Status:</strong> {camp.status}</p>
                  <div className="camp-actions">
                    {normalizeRole(user?.role) === 'volunteer' && (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate('/volunteer-signup')}
                      >
                        Apply to Volunteer
                      </button>
                    )}
                    {normalizeRole(user?.role) === 'donor' && (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate('/donate')}
                      >
                        Donate to Camp
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Camp Needs Section */}
        <div className="section">
          <h3>Current Camp Needs</h3>
          {campNeeds.length === 0 ? (
            <p>No urgent needs reported at this time.</p>
          ) : (
            <div className="needs-list">
              {campNeeds.slice(0, 5).map((need, index) => (
                <div key={index} className="need-item">
                  <div className="need-info">
                    <h5>{need.camp_name}</h5>
                    <p><strong>{need.resource_type}:</strong> {need.quantity_needed} units needed</p>
                    <p><strong>Urgency:</strong> <span className={`urgency ${need.urgency.toLowerCase()}`}>{need.urgency}</span></p>
                    <p>{need.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Role-specific sections */}
        {normalizeRole(user?.role) === 'volunteer' && (
          <div className="section">
            <h3>My Volunteer Assignments</h3>
            {volunteerAssignments.length === 0 ? (
              <p>No volunteer assignments yet. <a href="/volunteer-signup">Apply to volunteer</a> at a camp.</p>
            ) : (
              <div className="assignments-list">
                {volunteerAssignments.map(assignment => (
                  <div key={assignment.assignment_id} className="assignment-card">
                    <h5>Assignment #{assignment.assignment_id}</h5>
                    <p><strong>Status:</strong> <span className={`status ${assignment.status.toLowerCase()}`}>{assignment.status}</span></p>
                    <p><strong>Hours Logged:</strong> {assignment.hours_logged}</p>
                    {assignment.assigned_tasks && (
                      <p><strong>Tasks:</strong> {assignment.assigned_tasks.join(', ')}</p>
                    )}
                    <p><strong>Start Date:</strong> {assignment.start_date ? new Date(assignment.start_date).toLocaleDateString() : 'Not set'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {normalizeRole(user?.role) === 'donor' && (
          <>
            <div className="section">
              <h3>My Donation Impact</h3>
              {donationImpact ? (
                <div className="impact-summary">
                  <div className="impact-stats">
                    <div className="impact-stat">
                      <h4>${donationImpact.total_amount_donated.toFixed(2)}</h4>
                      <p>Total Donated</p>
                    </div>
                    <div className="impact-stat">
                      <h4>{donationImpact.total_donations}</h4>
                      <p>Donations Made</p>
                    </div>
                    <div className="impact-stat">
                      <h4>{donationImpact.camps_helped.length}</h4>
                      <p>Camps Helped</p>
                    </div>
                  </div>
                  <p className="impact-message">{donationImpact.impact_summary}</p>
                </div>
              ) : (
                <p>No donations made yet. <a href="/donate">Make your first donation</a> to help disaster relief efforts.</p>
              )}
            </div>

            <div className="section">
              <h3>Recent Donations</h3>
              {donationHistory.length === 0 ? (
                <p>No donation history found.</p>
              ) : (
                <div className="donations-list">
                  {donationHistory.slice(0, 5).map(donation => (
                    <div key={donation.donation_id} className="donation-card">
                      <h5>{donation.donation_type}</h5>
                      {donation.amount && <p><strong>Amount:</strong> ${donation.amount}</p>}
                      {donation.quantity && <p><strong>Quantity:</strong> {donation.quantity}</p>}
                      <p><strong>Date:</strong> {new Date(donation.donation_date).toLocaleDateString()}</p>
                      <p><strong>Status:</strong> {donation.status}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Notifications Section */}
        <div className="section">
          <h3>Recent Notifications</h3>
          {notifications.length === 0 ? (
            <p>No notifications at this time.</p>
          ) : (
            <div className="notifications-list">
              {notifications.slice(0, 3).map(notification => (
                <div key={notification.notification_id} className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
                  <h5>{notification.title}</h5>
                  <p>{notification.message}</p>
                  <small>{new Date(notification.sent_at).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
