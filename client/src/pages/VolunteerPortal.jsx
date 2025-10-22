import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/auth.js';
import { fetchVolunteers, fetchVolunteerAssignments, fetchDisasters } from '../services/api.js';
import '../styles/globals.css';

export default function VolunteerPortal() {
  const [user, setUser] = useState(null);
  const [volunteerProfile, setVolunteerProfile] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [disasters, setDisasters] = useState([]);
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
        // Load disasters and volunteer data in parallel
        const [disastersData, volunteers] = await Promise.all([
          fetchDisasters(),
          fetchVolunteers()
        ]);
        
        setDisasters(disastersData);
        
        // Find volunteer profile by email
        const profile = volunteers.find(v => v.email === currentUser.email);
        setVolunteerProfile(profile);
        
        // Fetch assignments if profile exists
        if (profile) {
          try {
            const volunteerAssignments = await fetchVolunteerAssignments(profile.volunteer_id);
            setAssignments(volunteerAssignments);
          } catch (assignmentError) {
            console.warn('Could not load assignments:', assignmentError);
            setAssignments([]);
          }
        }
      }
    } catch (err) {
      setError('Failed to load volunteer data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="container">
        <h2>Volunteer Dashboard</h2>
        <p>Loading your volunteer information...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <h2>Volunteer Dashboard</h2>
        <p>Please <Link to="/login">login</Link> to access your volunteer dashboard.</p>
      </div>
    );
  }

  const activeAssignments = assignments.filter(a => a.status === 'Active');
  const completedAssignments = assignments.filter(a => a.status === 'Completed');
  const activeDisasters = disasters.filter(d => d.status === 'Active');

  return (
    <div className="container">
      <div className="flex justify-between items-center" style={{ margin: 'var(--spacing-4xl) 0 var(--spacing-2xl) 0' }}>
        <div>
          <h1 className="mb-sm">Volunteer Dashboard</h1>
          <p className="text-muted mb-0">Welcome back, {user.full_name}!</p>
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

      {/* Volunteer Status Overview */}
      <div className="mb-2xl">
        <h3 className="mb-lg">Your Status</h3>
        <div className="grid grid-cols-4 gap-lg">
          <div className="card text-center">
            <h4 className="text-3xl font-bold text-primary mb-sm">{assignments.length}</h4>
            <p className="text-muted mb-0">Total Assignments</p>
          </div>
          <div className="card text-center">
            <h4 className="text-3xl font-bold text-success mb-sm">{activeAssignments.length}</h4>
            <p className="text-muted mb-0">Active Assignments</p>
          </div>
          <div className="card text-center">
            <h4 className="text-3xl font-bold text-warning mb-sm">{completedAssignments.length}</h4>
            <p className="text-muted mb-0">Completed</p>
          </div>
          <div className="card text-center">
            <div className={`badge badge-${volunteerProfile?.status === 'APPROVED' ? 'success' : volunteerProfile?.status === 'PENDING' ? 'warning' : 'danger'} mb-sm`}>
              {volunteerProfile?.status || 'Not Registered'}
            </div>
            <p className="text-muted mb-0">Volunteer Status</p>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="mb-2xl">
        <h3 className="mb-lg">Your Profile</h3>
        {volunteerProfile ? (
          <div className="card">
            <div className="grid grid-cols-2 gap-lg">
              <div>
                <h4 className="mb-lg">Personal Information</h4>
                <div className="mb-lg">
                  <p className="text-sm font-medium text-muted">Name</p>
                  <p className="text-secondary">{volunteerProfile.name}</p>
                </div>
                <div className="mb-lg">
                  <p className="text-sm font-medium text-muted">Email</p>
                  <p className="text-secondary">{volunteerProfile.email}</p>
                </div>
                <div className="mb-lg">
                  <p className="text-sm font-medium text-muted">Phone</p>
                  <p className="text-secondary">{volunteerProfile.phone}</p>
                </div>
              </div>
              <div>
                <h4 className="mb-lg">Volunteer Details</h4>
                <div className="mb-lg">
                  <p className="text-sm font-medium text-muted">Skills</p>
                  <p className="text-secondary">{volunteerProfile.skills || 'Not specified'}</p>
                </div>
                <div className="mb-lg">
                  <p className="text-sm font-medium text-muted">Availability</p>
                  <p className="text-secondary">{volunteerProfile.availability || 'Not specified'}</p>
                </div>
                <div className="mb-lg">
                  <p className="text-sm font-medium text-muted">Status</p>
                  <div className="flex items-center gap-sm">
                    <div className={`badge badge-${volunteerProfile.status === 'APPROVED' ? 'success' : volunteerProfile.status === 'PENDING' ? 'warning' : 'danger'}`}>
                      {volunteerProfile.status}
                    </div>
                    {volunteerProfile.status === 'PENDING' && (
                      <span className="text-muted text-sm">Awaiting admin approval</span>
                    )}
                    {volunteerProfile.status === 'REJECTED' && volunteerProfile.rejection_reason && (
                      <span className="text-danger text-sm">{volunteerProfile.rejection_reason}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-lg">
              <Link to="/volunteer-signup" className="btn btn-secondary">
                Update Profile
              </Link>
            </div>
          </div>
        ) : (
          <div className="card text-center" style={{ padding: 'var(--spacing-4xl)' }}>
            <h4 className="mb-lg">Complete Your Volunteer Registration</h4>
            <p className="text-muted mb-lg">You haven't registered as a volunteer yet. Complete your registration to start helping with disaster relief efforts.</p>
            <Link to="/volunteer-signup" className="btn btn-primary">
              Register as Volunteer
            </Link>
          </div>
        )}
      </div>

      {/* Current Assignments */}
      {activeAssignments.length > 0 && (
        <div className="mb-2xl">
          <h3 className="mb-lg">Current Assignments</h3>
          <div className="grid gap-xl">
            {activeAssignments.map((assignment) => (
              <div key={assignment.assignment_id} className="card">
                <div className="flex justify-between items-start mb-lg">
                  <div>
                    <h4 className="mb-sm">{assignment.role || 'Volunteer Assignment'}</h4>
                    <p className="text-muted mb-sm">Assignment #{assignment.assignment_id}</p>
                    <p className="text-secondary mb-0">Camp ID: {assignment.camp_id}</p>
                  </div>
                  <div className="badge badge-success">Active</div>
                </div>
                <div className="grid grid-cols-2 gap-lg mb-lg">
                  <div>
                    <p className="text-sm font-medium text-muted">Start Date</p>
                    <p className="text-secondary">{assignment.start_date ? new Date(assignment.start_date).toLocaleDateString() : 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted">Assigned Date</p>
                    <p className="text-secondary">{new Date(assignment.assignment_date).toLocaleDateString()}</p>
                  </div>
                </div>
                {assignment.notes && (
                  <div className="mb-lg">
                    <p className="text-sm font-medium text-muted">Notes</p>
                    <p className="text-secondary">{assignment.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Disasters */}
      <div className="mb-2xl">
        <h3 className="mb-lg">Active Disasters</h3>
        {activeDisasters.length === 0 ? (
          <div className="card text-center" style={{ padding: 'var(--spacing-4xl)' }}>
            <p className="text-muted">No active disasters at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-xl">
            {activeDisasters.slice(0, 3).map(disaster => (
              <div key={disaster.disaster_id} className="card">
                <div className="flex justify-between items-start mb-lg">
                  <div>
                    <h4 className="mb-sm">{disaster.name}</h4>
                    <p className="text-muted mb-sm">📍 {disaster.location}</p>
                    <p className="text-secondary mb-0">{disaster.type} - {disaster.severity_level} Severity</p>
                  </div>
                  <div className="badge badge-danger">{disaster.status}</div>
                </div>
                <p className="text-secondary mb-lg">{disaster.description}</p>
                <div className="flex gap-lg">
                  <Link to={`/disasters/${disaster.disaster_id}`} className="btn btn-primary">
                    View Details
                  </Link>
                  <Link to="/volunteer-signup" className="btn btn-secondary">
                    Volunteer for This Disaster
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-lg">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-lg">
          <Link to="/disasters" className="btn btn-primary">
            View All Disasters
          </Link>
          <Link to="/volunteer-signup" className="btn btn-success">
            Update Volunteer Profile
          </Link>
          <Link to="/donate" className="btn btn-warning">
            Make a Donation
          </Link>
          {volunteerProfile?.status === 'PENDING' && (
            <div className="btn btn-secondary" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
              Awaiting Approval
            </div>
          )}
          {volunteerProfile?.status === 'APPROVED' && (
            <div className="btn btn-success" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
              Available for Assignment
            </div>
          )}
        </div>
      </div>
    </div>
  );
}