import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../services/auth.js';
import { fetchVolunteerRequests, createVolunteerRequest, updateVolunteerRequest, deleteVolunteerRequest, getMyCamp } from '../services/api.js';
import '../styles/globals.css';

export default function CoordinatorVolunteerRequests() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    volunteer_type: 'Medical',
    skills_required: '',
    number_needed: 1,
    priority_level: 'Medium',
    duration_days: 7,
    disaster_id: null,
    camp_id: null
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'camp_coordinator') {
      window.location.href = '/dashboard';
      return;
    }
    setUser(currentUser);
    loadCoordinatorInfo();
    loadRequests();
  }, []);

  const loadCoordinatorInfo = async () => {
    try {
      const campData = await getMyCamp();
      setNewRequest(prev => ({
        ...prev,
        disaster_id: campData.disaster_id,
        camp_id: campData.camp_id
      }));
    } catch (err) {
      console.error('Failed to load coordinator info:', err);
      setError('Failed to load coordinator camp information');
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await fetchVolunteerRequests();
      setRequests(data);
    } catch (err) {
      setError('Failed to load volunteer requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await createVolunteerRequest(newRequest);
      setShowCreateForm(false);
      setNewRequest({
        title: '',
        description: '',
        volunteer_type: 'Medical',
        skills_required: '',
        number_needed: 1,
        priority_level: 'Medium',
        duration_days: 7,
        disaster_id: null,
        camp_id: null
      });
      loadRequests();
    } catch (err) {
      setError('Failed to create volunteer request');
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this volunteer request?')) {
      try {
        await deleteVolunteerRequest(requestId);
        loadRequests();
      } catch (err) {
        setError('Failed to delete volunteer request');
      }
    }
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
        <div style={{ marginTop: 'var(--spacing-4xl)' }}>
          <h2>Volunteer Requests</h2>
          <p>Loading volunteer requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center" style={{ margin: 'var(--spacing-4xl) 0 var(--spacing-2xl) 0' }}>
        <div>
          <h1 className="mb-sm">Volunteer Requests</h1>
          <p className="text-muted mb-0">Request volunteers with specific skills for your camp</p>
        </div>
        <div className="flex gap-lg">
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            + Request Volunteers
          </button>
          <Link to="/dashboard" className="btn btn-secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-lg">
          {error}
        </div>
      )}

      {/* Create Request Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request Volunteers</h3>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="btn btn-ghost"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateRequest} className="modal-body">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                  placeholder="e.g., Medical Staff Needed for Emergency Care"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                  placeholder="Detailed description of volunteer needs and responsibilities"
                  rows="3"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-lg">
                <div className="form-group">
                  <label>Volunteer Type</label>
                  <select
                    value={newRequest.volunteer_type}
                    onChange={(e) => setNewRequest({...newRequest, volunteer_type: e.target.value})}
                  >
                    <option value="Medical">Medical</option>
                    <option value="Rescue">Rescue</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Food Distribution">Food Distribution</option>
                    <option value="Shelter Management">Shelter Management</option>
                    <option value="Communication">Communication</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Security">Security</option>
                    <option value="General Support">General Support</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Number Needed</label>
                  <input
                    type="number"
                    min="1"
                    value={newRequest.number_needed}
                    onChange={(e) => setNewRequest({...newRequest, number_needed: parseInt(e.target.value)})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Skills Required (Optional)</label>
                <input
                  type="text"
                  value={newRequest.skills_required}
                  onChange={(e) => setNewRequest({...newRequest, skills_required: e.target.value})}
                  placeholder="e.g., First Aid Certified, CPR Training, Heavy Vehicle License"
                />
              </div>

              <div className="grid grid-cols-2 gap-lg">
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
                <div className="form-group">
                  <label>Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={newRequest.duration_days}
                    onChange={(e) => setNewRequest({...newRequest, duration_days: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requests List */}
      <div className="grid gap-lg">
        {requests.length === 0 ? (
          <div className="card text-center" style={{ padding: 'var(--spacing-4xl)' }}>
            <p className="text-muted">No volunteer requests yet.</p>
            <p className="text-muted">Create your first request to get started.</p>
          </div>
        ) : (
          requests.map(request => (
            <div key={request.request_id} className="card">
              <div className="flex justify-between items-start mb-lg">
                <div>
                  <h4 className="mb-sm">{request.title}</h4>
                  <p className="text-muted mb-sm">👥 {request.volunteer_type} • {request.number_needed} volunteers needed</p>
                  <p className="text-secondary mb-0">{request.description}</p>
                </div>
                <div className="flex gap-sm">
                  <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                    {request.status}
                  </span>
                  <span className={`badge ${getPriorityBadgeClass(request.priority_level)}`}>
                    {request.priority_level}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-lg mb-lg">
                {request.skills_required && (
                  <div>
                    <strong>Skills Required:</strong>
                    <p className="text-muted mb-0">{request.skills_required}</p>
                  </div>
                )}
                <div>
                  <strong>Duration:</strong>
                  <p className="text-muted mb-0">{request.duration_days} days</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-muted">
                  Requested: {new Date(request.request_date).toLocaleDateString()}
                  {request.approved_date && (
                    <span> • Approved: {new Date(request.approved_date).toLocaleDateString()}</span>
                  )}
                </div>
                
                {request.status === 'PENDING' && (
                  <div className="flex gap-sm">
                    <button 
                      onClick={() => handleDeleteRequest(request.request_id)}
                      className="btn btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {request.notes && (
                <div className="mt-lg p-lg bg-muted rounded">
                  <strong>Admin Notes:</strong>
                  <p className="mb-0 mt-sm">{request.notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}