import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/auth.js';
import { fetchPendingResourceRequests, updateResourceRequestStatus } from '../services/api.js';
import '../styles/adminRequests.css';

export default function AdminRequests() {
  const [user, setUser] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
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
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const requests = await fetchPendingResourceRequests();
      setPendingRequests(requests);
    } catch (err) {
      setError('Failed to load resource requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, status, notes = '') => {
    try {
      setProcessingId(requestId);
      await updateResourceRequestStatus(requestId, {
        status,
        notes
      });
      
      // Reload requests
      await loadRequests();
      setProcessingId(null);
    } catch (err) {
      setError(`Failed to ${status.toLowerCase()} request`);
      setProcessingId(null);
    }
  };

  const handleReject = (requestId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      handleStatusUpdate(requestId, 'REJECTED', reason);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return '#dc2626';
      case 'high': return '#f59e0b';
      case 'medium': return '#2563eb';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="admin-requests container">
        <h2>Resource Request Management</h2>
        <p>Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="admin-requests container">
      <div className="page-header">
        <h2>Resource Request Management</h2>
        <p>Review and approve resource requests from camps</p>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="requests-stats">
        <div className="stat-card">
          <h3>{pendingRequests.length}</h3>
          <p>Pending Requests</p>
        </div>
        <div className="stat-card">
          <h3>{pendingRequests.filter(r => r.priority_level === 'Critical').length}</h3>
          <p>Critical Priority</p>
        </div>
        <div className="stat-card">
          <h3>{pendingRequests.filter(r => r.priority_level === 'High').length}</h3>
          <p>High Priority</p>
        </div>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="empty-state">
          <p>No pending resource requests</p>
          <p>All requests have been processed!</p>
        </div>
      ) : (
        <div className="requests-list">
          {pendingRequests.map(request => (
            <div key={request.request_id} className="request-card">
              <div className="request-header">
                <div className="request-title">
                  <h3>{request.title}</h3>
                  <span 
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(request.priority_level) }}
                  >
                    {request.priority_level}
                  </span>
                </div>
                <div className="request-meta">
                  <span className="request-date">
                    {new Date(request.request_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="request-content">
                <p className="request-description">{request.description}</p>
                
                <div className="request-details">
                  <div className="detail-item">
                    <strong>Resource Type:</strong> {request.resource_type}
                  </div>
                  <div className="detail-item">
                    <strong>Quantity Needed:</strong> {request.quantity_needed}
                  </div>
                  {request.camp_id && (
                    <div className="detail-item">
                      <strong>Camp ID:</strong> {request.camp_id}
                    </div>
                  )}
                  {request.disaster_id && (
                    <div className="detail-item">
                      <strong>Disaster ID:</strong> {request.disaster_id}
                    </div>
                  )}
                </div>
              </div>

              <div className="request-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => handleStatusUpdate(request.request_id, 'APPROVED')}
                  disabled={processingId === request.request_id}
                >
                  {processingId === request.request_id ? 'Processing...' : 'Approve'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleStatusUpdate(request.request_id, 'FULFILLED')}
                  disabled={processingId === request.request_id}
                >
                  Mark Fulfilled
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleReject(request.request_id)}
                  disabled={processingId === request.request_id}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}