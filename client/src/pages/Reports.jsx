import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getCurrentUser,
  getResourceRequests,
  getVolunteerAssignments,
  updateResourceRequest
} from '../services/api';
import { normalizeRole } from '../utils/auth';
import '../styles/reports.css';

export default function Reports() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('resource-requests');
  const [resourceRequests, setResourceRequests] = useState([]);
  const [volunteerAssignments, setVolunteerAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const userData = await getCurrentUser();
      if (!['admin', 'camp_coordinator'].includes(userData.role)) {
        navigate('/dashboard');
        return;
      }

      setUser(userData);
      
      const [requestsData, assignmentsData] = await Promise.all([
        getResourceRequests(),
        getVolunteerAssignments()
      ]);

      setResourceRequests(requestsData);
      setVolunteerAssignments(assignmentsData);
    } catch (err) {
      console.error('Reports error:', err);
      setError('Failed to load reports data');
      if (err.message.includes('403') || err.message.includes('401')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId, status, notes = '') => {
    try {
      setError('');
      await updateResourceRequest(requestId, { status, notes });
      setSuccess(`Resource request ${status.toLowerCase()} successfully!`);
      loadData();
    } catch (err) {
      setError('Failed to update resource request: ' + err.message);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'priority-critical';
      case 'High': return 'priority-high';
      case 'Medium': return 'priority-medium';
      case 'Low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'fulfilled': return 'status-fulfilled';
      default: return 'status-pending';
    }
  };

  if (loading) {
    return <div className="reports"><div className="loading">Loading reports...</div></div>;
  }

  return (
    <div className="reports">
      <div className="reports-header">
        <h2>Reports & Management</h2>
        <p>Monitor resource requests and volunteer assignments</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="reports-tabs">
        <button 
          className={`tab-button ${activeTab === 'resource-requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('resource-requests')}
        >
          Resource Requests ({resourceRequests.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'volunteer-assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('volunteer-assignments')}
        >
          Volunteer Assignments ({volunteerAssignments.length})
        </button>
      </div>

      <div className="reports-content">
        {activeTab === 'resource-requests' && (
          <div className="resource-requests-report">
            <h3>Resource Requests</h3>
            <div className="requests-grid">
              {resourceRequests.map(request => (
                <div key={request.request_id} className="request-card">
                  <div className="request-header">
                    <h4>{request.title}</h4>
                    <div className="request-badges">
                      <span className={`priority-badge ${getPriorityColor(request.priority_level)}`}>
                        {request.priority_level}
                      </span>
                      <span className={`status-badge ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="request-info">
                    <p><strong>Type:</strong> {request.resource_type}</p>
                    <p><strong>Quantity:</strong> {request.quantity_needed}</p>
                    <p><strong>Requested by:</strong> {request.requested_by || 'Unknown'}</p>
                    <p><strong>Date:</strong> {new Date(request.request_date).toLocaleDateString()}</p>
                    <p><strong>Description:</strong> {request.description}</p>
                    {request.notes && (
                      <p><strong>Notes:</strong> {request.notes}</p>
                    )}
                  </div>

                  {normalizeRole(user?.role) === 'admin' && request.status === 'pending' && (
                    <div className="request-actions">
                      <button 
                        className="btn btn-approve"
                        onClick={() => handleApproveRequest(request.request_id, 'approved')}
                      >
                        Approve
                      </button>
                      <button 
                        className="btn btn-reject"
                        onClick={() => handleApproveRequest(request.request_id, 'rejected', 'Request rejected by admin')}
                      >
                        Reject
                      </button>
                      <button 
                        className="btn btn-fulfill"
                        onClick={() => handleApproveRequest(request.request_id, 'fulfilled', 'Request fulfilled')}
                      >
                        Mark Fulfilled
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              {resourceRequests.length === 0 && (
                <div className="empty-state">
                  <p>No resource requests found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'volunteer-assignments' && (
          <div className="assignments-report">
            <h3>Volunteer Assignments</h3>
            <div className="assignments-grid">
              {volunteerAssignments.map(assignment => (
                <div key={assignment.assignment_id} className="assignment-card">
                  <div className="assignment-header">
                    <h4>Assignment #{assignment.assignment_id}</h4>
                    <span className={`status-badge ${getStatusColor(assignment.status?.toLowerCase() || 'active')}`}>
                      {assignment.status || 'Active'}
                    </span>
                  </div>
                  
                  <div className="assignment-info">
                    <p><strong>Volunteer ID:</strong> {assignment.volunteer_id}</p>
                    <p><strong>Camp ID:</strong> {assignment.camp_id || 'Not specified'}</p>
                    <p><strong>Disaster ID:</strong> {assignment.disaster_id}</p>
                    <p><strong>Role:</strong> {assignment.role || 'General Support'}</p>
                    <p><strong>Assigned:</strong> {new Date(assignment.assignment_date).toLocaleDateString()}</p>
                    {assignment.start_date && (
                      <p><strong>Start Date:</strong> {new Date(assignment.start_date).toLocaleDateString()}</p>
                    )}
                    {assignment.end_date && (
                      <p><strong>End Date:</strong> {new Date(assignment.end_date).toLocaleDateString()}</p>
                    )}
                    {assignment.notes && (
                      <p><strong>Notes:</strong> {assignment.notes}</p>
                    )}
                  </div>
                </div>
              ))}
              
              {volunteerAssignments.length === 0 && (
                <div className="empty-state">
                  <p>No volunteer assignments found.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}