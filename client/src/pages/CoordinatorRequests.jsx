import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/auth.js';
import { getCoordinatorRequests, createResourceRequest } from '../services/api.js';
import '../styles/globals.css';

export default function CoordinatorRequests() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    resource_type: 'Food',
    quantity_needed: '',
    priority_level: 'Medium',
    camp_id: '',
    disaster_id: ''
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'camp_coordinator') {
      window.location.href = '/dashboard';
      return;
    }
    setUser(currentUser);
  }, []);

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getCoordinatorRequests(user.user_id);
      setRequests(data);
    } catch (err) {
      setError('Failed to load your resource requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await createResourceRequest(newRequest);
      setShowCreateForm(false);
      setNewRequest({
        title: '',
        description: '',
        resource_type: 'Food',
        quantity_needed: '',
        priority_level: 'Medium',
        camp_id: '',
        disaster_id: ''
      });
      loadRequests();
    } catch (err) {
      setError('Failed to create resource request');
    }
  };

  const handleLogout = () => {
    logout();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'badge-warning';
      case 'APPROVED': return 'badge-success';
      case 'REJECTED': return 'badge-danger';
      case 'FULFILLED': return 'badge-primary';
      default: return 'badge-secondary';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'Critical': return 'badge-danger';
      case 'High': return 'badge-warning';
      case 'Medium': return 'badge-primary';
      case 'Low': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  };

  if (loading) {
    return (
      <div className="container">
        <h2>My Resource Requests</h2>
        <p>Loading your requests...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center" style={{ margin: 'var(--spacing-4xl) 0 var(--spacing-2xl) 0' }}>
        <div>
          <h1 className="mb-sm">My Resource Requests</h1>
          <p className="text-muted mb-0">Manage resource requests for your assigned camps</p>
        </div>
        <div className="flex gap-lg">
          <button 
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            + New Request
          </button>
          <Link to="/dashboard" className="btn btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Request Statistics */}
      <div className="mb-2xl">
        <h3 className="mb-lg">Request Overview</h3>
        <div className="grid grid-cols-4 gap-lg">
          <div className="card text-center">
            <h4 className="text-3xl font-bold text-primary mb-sm">{requests.length}</h4>
            <p className="text-muted mb-0">Total Requests</p>
          </div>
          <div className="card text-center">
            <h4 className="text-3xl font-bold text-warning mb-sm">
              {requests.filter(r => r.status === 'PENDING').length}
            </h4>
            <p className="text-muted mb-0">Pending</p>
          </div>
          <div className="card text-center">
            <h4 className="text-3xl font-bold text-success mb-sm">
              {requests.filter(r => r.status === 'APPROVED').length}
            </h4>
            <p className="text-muted mb-0">Approved</p>
          </div>
          <div className="card text-center">
            <h4 className="text-3xl font-bold text-primary mb-sm">
              {requests.filter(r => r.status === 'FULFILLED').length}
            </h4>
            <p className="text-muted mb-0">Fulfilled</p>
          </div>
        </div>
      </div>

      {/* Create Request Form Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Resource Request</h3>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateRequest}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                  required
                  rows="3"
                />
              </div>
              <div className="grid grid-cols-2 gap-lg">
                <div className="form-group">
                  <label>Resource Type</label>
                  <select
                    value={newRequest.resource_type}
                    onChange={(e) => setNewRequest({...newRequest, resource_type: e.target.value})}
                  >
                    <option value="Food">Food</option>
                    <option value="Medical">Medical</option>
                    <option value="Water">Water</option>
                    <option value="Shelter">Shelter</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority Level</label>
                  <select
                    value={newRequest.priority_level}
                    onChange={(e) => setNewRequest({...newRequest, priority_level: e.target.value})}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Quantity Needed</label>
                <input
                  type="text"
                  value={newRequest.quantity_needed}
                  onChange={(e) => setNewRequest({...newRequest, quantity_needed: e.target.value})}
                  placeholder="e.g., 100 kg rice, 50 blankets, 20 medical kits"
                  required
                />
              </div>
              <div className="flex gap-lg">
                <button type="submit" className="btn btn-primary">
                  Create Request
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowCreateForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requests List */}
      <div>
        <h3 className="mb-lg">Your Resource Requests</h3>
        {requests.length === 0 ? (
          <div className="card text-center" style={{ padding: 'var(--spacing-4xl)' }}>
            <p className="text-muted">No resource requests yet.</p>
            <p className="text-muted">Create your first request to get resources for your camps.</p>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              Create First Request
            </button>
          </div>
        ) : (
          <div className="grid gap-xl">
            {requests.map(request => (
              <div key={request.request_id} className="card">
                <div className="flex justify-between items-start mb-lg">
                  <div>
                    <h4 className="mb-sm">{request.title}</h4>
                    <p className="text-muted mb-sm">📦 {request.resource_type}</p>
                    <p className="text-secondary mb-0">{request.description}</p>
                  </div>
                  <div className="text-right">
                    <div className={`badge ${getStatusBadgeClass(request.status)} mb-sm`}>
                      {request.status}
                    </div>
                    <div className={`badge ${getPriorityBadgeClass(request.priority_level)}`}>
                      {request.priority_level}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-lg mb-lg">
                  <div>
                    <p className="text-sm font-medium text-muted">Quantity Needed</p>
                    <p className="text-secondary">{request.quantity_needed}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted">Request Date</p>
                    <p className="text-secondary">{new Date(request.request_date).toLocaleDateString()}</p>
                  </div>
                </div>

                {request.approved_date && (
                  <div className="mb-lg">
                    <p className="text-sm font-medium text-muted">Approved Date</p>
                    <p className="text-success">{new Date(request.approved_date).toLocaleDateString()}</p>
                  </div>
                )}

                {request.fulfilled_date && (
                  <div className="mb-lg">
                    <p className="text-sm font-medium text-muted">Fulfilled Date</p>
                    <p className="text-primary">{new Date(request.fulfilled_date).toLocaleDateString()}</p>
                  </div>
                )}

                {request.notes && (
                  <div className="mb-lg">
                    <p className="text-sm font-medium text-muted">Admin Notes</p>
                    <p className="text-secondary">{request.notes}</p>
                  </div>
                )}

                <div className="flex gap-lg">
                  {request.status === 'PENDING' && (
                    <button className="btn btn-warning">
                      Edit Request
                    </button>
                  )}
                  <button className="btn btn-secondary">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom logout section */}
      <div className="dashboard-logout-section">
        <p>Ready to sign out?</p>
        <button className="btn btn-outline btn-lg" onClick={handleLogout}>
          <span style={{ marginRight: 'var(--spacing-sm)' }}>👋</span>
          Logout
        </button>
      </div>
    </div>
  );
}