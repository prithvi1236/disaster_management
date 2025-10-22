import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/auth.js';
import { fetchApprovedVolunteers } from '../services/api.js';
import '../styles/coordinatorVolunteers.css';

export default function CoordinatorVolunteers() {
  const [user, setUser] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'camp_coordinator') {
      window.location.href = '/dashboard';
      return;
    }
    setUser(currentUser);
    loadVolunteers();
  }, []);

  const loadVolunteers = async () => {
    try {
      setLoading(true);
      const data = await fetchApprovedVolunteers();
      setVolunteers(data);
    } catch (err) {
      setError('Failed to load volunteers');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="coordinator-volunteers container">
        <h2>Available Volunteers</h2>
        <p>Loading volunteers...</p>
      </div>
    );
  }

  return (
    <div className="coordinator-volunteers container">
      <div className="page-header">
        <h2>Available Volunteers</h2>
        <p>Approved volunteers ready for assignment</p>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="volunteers-stats">
        <div className="stat-card">
          <h3>{volunteers.length}</h3>
          <p>Total Available</p>
        </div>
        <div className="stat-card">
          <h3>{volunteers.filter(v => v.status === 'APPROVED').length}</h3>
          <p>Ready for Assignment</p>
        </div>
        <div className="stat-card">
          <h3>{volunteers.filter(v => v.status === 'ASSIGNED').length}</h3>
          <p>Currently Assigned</p>
        </div>
      </div>

      {volunteers.length === 0 ? (
        <div className="empty-state">
          <p>No approved volunteers available</p>
          <p>Check back later for new volunteer approvals</p>
        </div>
      ) : (
        <div className="volunteers-grid">
          {volunteers.map(volunteer => (
            <div key={volunteer.volunteer_id} className="volunteer-card">
              <div className="volunteer-header">
                <h3>{volunteer.name}</h3>
                <span className={`status-badge ${volunteer.status.toLowerCase()}`}>
                  {volunteer.status}
                </span>
              </div>
              
              <div className="volunteer-info">
                <p><strong>Email:</strong> {volunteer.email}</p>
                <p><strong>Phone:</strong> {volunteer.phone}</p>
                {volunteer.skills && (
                  <p><strong>Skills:</strong> {volunteer.skills}</p>
                )}
                {volunteer.availability && (
                  <p><strong>Availability:</strong> {volunteer.availability}</p>
                )}
                {volunteer.emergency_contact && (
                  <p><strong>Emergency Contact:</strong> {volunteer.emergency_contact}</p>
                )}
                {volunteer.approved_date && (
                  <p><strong>Approved:</strong> {new Date(volunteer.approved_date).toLocaleDateString()}</p>
                )}
              </div>

              <div className="volunteer-actions">
                {volunteer.status === 'APPROVED' ? (
                  <button className="btn btn-primary">
                    Request Assignment
                  </button>
                ) : (
                  <button className="btn btn-secondary" disabled>
                    Currently Assigned
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}