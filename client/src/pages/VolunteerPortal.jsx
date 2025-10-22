import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/auth.js';
import { fetchVolunteers } from '../services/api.js';
import '../styles/volunteerPortal.css';

export default function VolunteerPortal() {
  const [user, setUser] = useState(null);
  const [volunteerProfile, setVolunteerProfile] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadVolunteerData();
  }, []);

  const loadVolunteerData = async () => {
    try {
      const currentUser = getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        // Find volunteer profile by email
        const volunteers = await fetchVolunteers();
        const profile = volunteers.find(v => v.email === currentUser.email);
        setVolunteerProfile(profile);
        
        // In a real app, you'd fetch assignments for this volunteer
        setAssignments([]);
      }
    } catch (err) {
      setError('Failed to load volunteer data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="volunteer-portal container">
        <h2>Volunteer Portal</h2>
        <p>Loading your volunteer information...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="volunteer-portal container">
        <h2>Volunteer Portal</h2>
        <p>Please <a href="/login">login</a> to access your volunteer portal.</p>
      </div>
    );
  }

  return (
    <div className="volunteer-portal container">
      <div className="portal-header">
        <h2>Volunteer Portal</h2>
        <p>Welcome back, {user.full_name}!</p>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="portal-sections">
        <section className="profile-section">
          <h3>Your Profile</h3>
          {volunteerProfile ? (
            <div className="profile-card">
              <div className="profile-info">
                <p><strong>Name:</strong> {volunteerProfile.name}</p>
                <p><strong>Email:</strong> {volunteerProfile.email}</p>
                <p><strong>Phone:</strong> {volunteerProfile.phone}</p>
                <p><strong>Skills:</strong> {volunteerProfile.skills || 'Not specified'}</p>
                <p><strong>Availability:</strong> {volunteerProfile.availability || 'Not specified'}</p>
                <p><strong>Status:</strong> 
                  <span className={`status ${volunteerProfile.status?.toLowerCase()}`}>
                    {volunteerProfile.status}
                  </span>
                  {volunteerProfile.status === 'PENDING' && (
                    <span className="status-note"> - Awaiting admin approval</span>
                  )}
                  {volunteerProfile.status === 'REJECTED' && volunteerProfile.rejection_reason && (
                    <span className="status-note"> - {volunteerProfile.rejection_reason}</span>
                  )}
                </p>
              </div>
              <div className="profile-actions">
                <a href="/volunteer-signup" className="btn btn-secondary">
                  Update Profile
                </a>
              </div>
            </div>
          ) : (
            <div className="no-profile">
              <p>You haven't registered as a volunteer yet.</p>
              <a href="/volunteer-signup" className="btn btn-primary">
                Register as Volunteer
              </a>
            </div>
          )}
        </section>

        <section className="assignments-section">
          <h3>Your Assignments</h3>
          {assignments.length === 0 ? (
            <div className="no-assignments">
              <p>You don't have any active assignments yet.</p>
              <p>Check back later or contact your coordinator for more information.</p>
            </div>
          ) : (
            <div className="assignments-list">
              {assignments.map((assignment, index) => (
                <div key={index} className="assignment-card">
                  <h4>{assignment.role}</h4>
                  <p><strong>Camp:</strong> {assignment.camp_name}</p>
                  <p><strong>Location:</strong> {assignment.location}</p>
                  <p><strong>Start Date:</strong> {new Date(assignment.start_date).toLocaleDateString()}</p>
                  <p><strong>Status:</strong> 
                    <span className={`status ${assignment.status?.toLowerCase()}`}>
                      {assignment.status}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="opportunities-section">
          <h3>Available Opportunities</h3>
          <div className="opportunities-list">
            <div className="opportunity-card">
              <h4>Medical Support Volunteer</h4>
              <p>Help provide basic medical care at relief camps</p>
              <p><strong>Skills needed:</strong> Medical training, First Aid</p>
              <a href="/volunteer-signup" className="btn btn-primary">Apply</a>
            </div>
            <div className="opportunity-card">
              <h4>Food Distribution Volunteer</h4>
              <p>Assist with meal preparation and distribution</p>
              <p><strong>Skills needed:</strong> Food handling, Organization</p>
              <a href="/volunteer-signup" className="btn btn-primary">Apply</a>
            </div>
            <div className="opportunity-card">
              <h4>Logistics Coordinator</h4>
              <p>Help coordinate supplies and transportation</p>
              <p><strong>Skills needed:</strong> Organization, Communication</p>
              <a href="/volunteer-signup" className="btn btn-primary">Apply</a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}