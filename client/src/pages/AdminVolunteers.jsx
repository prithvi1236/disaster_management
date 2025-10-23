import { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/auth.js';
import { fetchPendingVolunteers, approveVolunteer, fetchApprovedVolunteers, fetchCampsWithDisasters, assignVolunteerToCamp } from '../services/api.js';
import '../styles/adminVolunteers.css';

export default function AdminVolunteers() {
  const [user, setUser] = useState(null);
  const [pendingVolunteers, setPendingVolunteers] = useState([]);
  const [approvedVolunteers, setApprovedVolunteers] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [camps, setCamps] = useState([]);
  const [assignment, setAssignment] = useState({
    camp_id: '',
    disaster_id: '',
    role: '',
    notes: ''
  });

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
      const [pending, approved, campsData] = await Promise.all([
        fetchPendingVolunteers(),
        fetchApprovedVolunteers(),
        fetchCampsWithDisasters()
      ]);
      setPendingVolunteers(pending);
      setApprovedVolunteers(approved);
      setCamps(campsData);
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

  const handleAssignVolunteer = async (e) => {
    e.preventDefault();
    try {
      await assignVolunteerToCamp({
        volunteer_id: selectedVolunteer.volunteer_id,
        disaster_id: parseInt(assignment.disaster_id),
        camp_id: parseInt(assignment.camp_id),
        role: assignment.role,
        notes: assignment.notes
      });
      
      setSelectedVolunteer(null);
      setAssignment({
        camp_id: '',
        disaster_id: '',
        role: '',
        notes: ''
      });
      loadVolunteers();
    } catch (err) {
      setError('Failed to assign volunteer');
    }
  };

  const handleCampSelection = (campId) => {
    const selectedCamp = camps.find(camp => camp.camp_id === parseInt(campId));
    if (selectedCamp) {
      setAssignment({
        ...assignment,
        camp_id: campId,
        disaster_id: selectedCamp.disaster_id
      });
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
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setSelectedVolunteer(volunteer)}
                    >
                      Assign to Camp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignment Modal */}
      {selectedVolunteer && (
        <div className="modal-overlay" onClick={() => setSelectedVolunteer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Volunteer to Camp</h3>
              <button 
                onClick={() => setSelectedVolunteer(null)}
                className="btn btn-ghost"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAssignVolunteer} className="modal-body">
              <div className="mb-lg">
                <h4>Volunteer: {selectedVolunteer.name}</h4>
                <p className="text-muted">Email: {selectedVolunteer.email}</p>
                {selectedVolunteer.skills && (
                  <p className="text-muted">Skills: {selectedVolunteer.skills}</p>
                )}
              </div>

              <div className="form-group">
                <label>Select Camp</label>
                <select
                  value={assignment.camp_id}
                  onChange={(e) => handleCampSelection(e.target.value)}
                  required
                >
                  <option value="">Choose a camp...</option>
                  {camps.map(camp => (
                    <option key={camp.camp_id} value={camp.camp_id}>
                      {camp.camp_name} - {camp.camp_location} ({camp.disaster_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Role/Position</label>
                <select
                  value={assignment.role}
                  onChange={(e) => setAssignment({...assignment, role: e.target.value})}
                  required
                >
                  <option value="">Select role...</option>
                  <option value="Medical Support">Medical Support</option>
                  <option value="Food Distribution">Food Distribution</option>
                  <option value="Shelter Management">Shelter Management</option>
                  <option value="Logistics Coordinator">Logistics Coordinator</option>
                  <option value="Communication Officer">Communication Officer</option>
                  <option value="Security Personnel">Security Personnel</option>
                  <option value="Transportation">Transportation</option>
                  <option value="General Support">General Support</option>
                  <option value="Rescue Operations">Rescue Operations</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={assignment.notes}
                  onChange={(e) => setAssignment({...assignment, notes: e.target.value})}
                  placeholder="Additional notes about the assignment..."
                  rows="3"
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setSelectedVolunteer(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Assign Volunteer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}