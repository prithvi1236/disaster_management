import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/auth.js';
import { fetchPendingVolunteers, approveVolunteer, fetchApprovedVolunteers } from '../services/api.js';
import '../styles/adminVolunteers.css';

export default function AdminVolunteers() {
  const [user, setUser] = useState(null);
  const [pendingVolunteers, setPendingVolunteers] = useState([]);
  const [approvedVolunteers, setApprovedVolunteers] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      window.location.href = '/dashboard';
      return;
    }
    setUser(currentUser);
    loadVolunteers();
  }, []);

  const loadVolunteers = async () => {
    try {
      setLoading(true);
      const [pending, approved] = await Promise.all([
        fetchPendingVolunteers(),
        fetchApprovedVolunteers()
      ]);
      setPendingVolunteers(pending);
      setApprovedVolunteers(approved);
    } catch (err) {
      setError('Failed to load volunteers');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (volunteerId, status, rejectionReason = null) => {
    try {
      setProcessingId(volunteerId);
      await approveVolunteer(volunteerId, {
        status,
        rejection_reason: rejectionReason
      });
      
      // Reload volunteers
      await loadVolunteers();
      setProcessingId(null);
    } catch (err) {
      setError(`Failed to ${status.toLowerCase()} volunteer`);
      setProcessingId(null);
    }
  };

  const handleReject = (volunteerId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      handleApproval(volunteerId, 'REJECTED', reason);
    }
  };

  if (loading) {
    return (
      <div className="admin-volunteers container">
        <h2>Volunteer Management</h2>
        <p>Loading volunteers...</p>
      </div>
    );
  }

  return (
    <div className="admin-volunteers container">
      <div className="page-header">
        <h2>Volunteer Management</h2>
        <p>Review and approve volunteer applications</p>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approval ({pendingVolunteers.length})
        </button>
        <button 
          className={`tab ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Approved Volunteers ({approvedVolunteers.length})
        </button>
      </div>

      {activeTab === 'pending' && (
        <div className="volunteers-section">
          {pendingVolunteers.length === 0 ? (
            <div className="empty-state">
              <p>No volunteers pending approval</p>
            </div>
          ) : (
            <div className="volunteers-grid">
              {pendingVolunteers.map(volunteer => (
                <div key={volunteer.volunteer_id} className="volunteer-card pending">
                  <div className="volunteer-header">
                    <h3>{volunteer.name}</h3>
                    <span className="pending-badge">Pending</span>
                  </div>
                  
                  <div className="volunteer-info">
                    <p><strong>Email:</strong> {volunteer.email}</p>
                    <p><strong>Phone:</strong> {volunteer.phone}</p>
                    {volunteer.address && (
                      <p><strong>Address:</strong> {volunteer.address}</p>
                    )}
                    {volunteer.skills && (
                      <p><strong>Skills:</strong> {volunteer.skills}</p>
                    )}
                    {volunteer.availability && (
                      <p><strong>Availability:</strong> {volunteer.availability}</p>
                    )}
                    {volunteer.emergency_contact && (
                      <p><strong>Emergency Contact:</strong> {volunteer.emergency_contact}</p>
                    )}
                    <p><strong>Applied:</strong> {new Date(volunteer.created_at).toLocaleDateString()}</p>
                    {volunteer.days_pending && (
                      <p><strong>Days Pending:</strong> {volunteer.days_pending}</p>
                    )}
                  </div>

                  <div className="volunteer-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleApproval(volunteer.volunteer_id, 'APPROVED')}
                      disabled={processingId === volunteer.volunteer_id}
                    >
                      {processingId === volunteer.volunteer_id ? 'Processing...' : 'Approve'}
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleReject(volunteer.volunteer_id)}
                      disabled={processingId === volunteer.volunteer_id}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'approved' && (
        <div className="volunteers-section">
          {approvedVolunteers.length === 0 ? (
            <div className="empty-state">
              <p>No approved volunteers yet</p>
            </div>
          ) : (
            <div className="volunteers-grid">
              {approvedVolunteers.map(volunteer => (
                <div key={volunteer.volunteer_id} className="volunteer-card approved">
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
                    {volunteer.approved_date && (
                      <p><strong>Approved:</strong> {new Date(volunteer.approved_date).toLocaleDateString()}</p>
                    )}
                  </div>

                  <div className="volunteer-actions">
                    <button className="btn btn-secondary">
                      Assign to Camp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}