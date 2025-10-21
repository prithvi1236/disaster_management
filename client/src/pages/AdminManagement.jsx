import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getCurrentUser, 
  createDisaster, 
  createCamp, 
  fetchDisasters,
  fetchCamps,
  getAllUsers,
  getPendingUsers,
  approveUser,
  rejectUser,
  getRejectionReasons,
  updateUserRole,
  deleteDisaster,
  deleteCamp,
  getAdminDashboardStats,
  getDonationReports,
  getVolunteerReports,
  getResourceReports
} from '../services/api';
import { normalizeRole } from '../utils/auth';
import '../styles/admin.css';

export default function AdminManagement() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [disasters, setDisasters] = useState([]);
  const [camps, setCamps] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Form states
  const [disasterForm, setDisasterForm] = useState({
    name: '',
    type: '',
    location: '',
    severity_level: 'Medium',
    status: 'Active',
    start_date: '',
    description: ''
  });

  const [campForm, setCampForm] = useState({
    name: '',
    location: '',
    capacity: '',
    contact_info: '',
    facilities: '',
    disaster_id: ''
  });

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
      if (normalizeRole(userData.role) !== 'admin') {
        navigate('/dashboard');
        return;
      }

      setUser(userData);
      
      const [disastersData, campsData, usersData, pendingUsersData, statsData] = await Promise.all([
        fetchDisasters(),
        fetchCamps(),
        getAllUsers(),
        getPendingUsers(),
        getAdminDashboardStats()
      ]);

      setDisasters(disastersData);
      setCamps(campsData);
      setUsers(usersData);
      setPendingUsers(pendingUsersData);
      setDashboardStats(statsData);
    } catch (err) {
      console.error('Admin management error:', err);
      setError('Failed to load admin data');
      if (err.message.includes('403') || err.message.includes('401')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDisaster = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    // Enhanced validation
    if (!disasterForm.name.trim()) {
      setError('Disaster name is required');
      setLoading(false);
      return;
    }
    if (disasterForm.name.trim().length < 3) {
      setError('Disaster name must be at least 3 characters long');
      setLoading(false);
      return;
    }
    if (!disasterForm.type) {
      setError('Disaster type is required');
      setLoading(false);
      return;
    }
    if (!disasterForm.location.trim()) {
      setError('Location is required');
      setLoading(false);
      return;
    }
    if (disasterForm.location.trim().length < 3) {
      setError('Location must be at least 3 characters long');
      setLoading(false);
      return;
    }
    if (!disasterForm.start_date) {
      setError('Start date is required');
      setLoading(false);
      return;
    }
    
    // Validate start date is not in the future by more than 1 day
    const startDate = new Date(disasterForm.start_date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (startDate > tomorrow) {
      setError('Start date cannot be more than 1 day in the future');
      setLoading(false);
      return;
    }
    
    try {
      await createDisaster({
        ...disasterForm,
        start_date: startDate.toISOString()
      });
      setSuccess('Disaster created successfully!');
      setDisasterForm({
        name: '',
        type: '',
        location: '',
        severity_level: 'Medium',
        status: 'Active',
        start_date: '',
        description: ''
      });
      await loadData();
    } catch (err) {
      console.error('Create disaster error:', err);
      setError('Failed to create disaster: ' + (err.message || 'Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCamp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    // Enhanced validation
    if (!campForm.name.trim()) {
      setError('Camp name is required');
      setLoading(false);
      return;
    }
    if (campForm.name.trim().length < 3) {
      setError('Camp name must be at least 3 characters long');
      setLoading(false);
      return;
    }
    if (!campForm.location.trim()) {
      setError('Location is required');
      setLoading(false);
      return;
    }
    if (campForm.location.trim().length < 3) {
      setError('Location must be at least 3 characters long');
      setLoading(false);
      return;
    }
    if (!campForm.capacity || parseInt(campForm.capacity) < 1) {
      setError('Valid capacity is required (minimum 1)');
      setLoading(false);
      return;
    }
    if (parseInt(campForm.capacity) > 10000) {
      setError('Capacity cannot exceed 10,000 people');
      setLoading(false);
      return;
    }
    if (!campForm.disaster_id) {
      setError('Please select a disaster');
      setLoading(false);
      return;
    }
    
    // Validate disaster exists and is active
    const selectedDisaster = disasters.find(d => d.disaster_id === parseInt(campForm.disaster_id));
    if (!selectedDisaster) {
      setError('Selected disaster not found. Please refresh and try again.');
      setLoading(false);
      return;
    }
    if (selectedDisaster.status === 'Resolved') {
      setError('Cannot create camps for resolved disasters');
      setLoading(false);
      return;
    }
    
    try {
      await createCamp({
        ...campForm,
        capacity: parseInt(campForm.capacity),
        disaster_id: parseInt(campForm.disaster_id)
      });
      setSuccess('Camp created successfully!');
      setCampForm({
        name: '',
        location: '',
        capacity: '',
        contact_info: '',
        facilities: '',
        disaster_id: ''
      });
      await loadData();
    } catch (err) {
      console.error('Create camp error:', err);
      let errorMessage = 'Failed to create camp: ';
      if (err.message.includes('duplicate') || err.message.includes('already exists')) {
        errorMessage += 'A camp with this name already exists for this disaster.';
      } else if (err.message.includes('foreign key constraint')) {
        errorMessage += 'Selected disaster is no longer available. Please refresh and try again.';
      } else {
        errorMessage += (err.message || 'Unknown error occurred');
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDisaster = async (id) => {
    const disaster = disasters.find(d => d.disaster_id === id);
    const disasterName = disaster ? disaster.name : 'this disaster';
    const associatedCamps = camps.filter(camp => camp.disaster_id === id);
    
    // Enhanced confirmation dialog with cascade warning
    let confirmMessage = `Are you sure you want to delete "${disasterName}"?\n\n`;
    confirmMessage += `⚠️ WARNING: This action cannot be undone!\n\n`;
    confirmMessage += `This will permanently delete:\n`;
    confirmMessage += `• The disaster record\n`;
    if (associatedCamps.length > 0) {
      confirmMessage += `• ${associatedCamps.length} associated camp(s):\n`;
      associatedCamps.forEach(camp => {
        confirmMessage += `  - ${camp.name}\n`;
      });
      confirmMessage += `• All volunteer assignments in these camps\n`;
      confirmMessage += `• All resource requests for these camps\n`;
    }
    confirmMessage += `• All related data and history\n\n`;
    confirmMessage += `Type "DELETE" to confirm:`;
    
    const userInput = window.prompt(confirmMessage);
    if (userInput !== 'DELETE') {
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      await deleteDisaster(id);
      setSuccess(`Disaster "${disasterName}" and all associated data deleted successfully!`);
      await loadData();
    } catch (err) {
      console.error('Delete disaster error:', err);
      let errorMessage = 'Failed to delete disaster: ';
      if (err.message.includes('foreign key constraint')) {
        errorMessage += 'Cannot delete disaster because it has associated data. Please remove all camps and related data first.';
      } else {
        errorMessage += (err.message || 'Unknown error occurred');
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCamp = async (id) => {
    const camp = camps.find(c => c.camp_id === id);
    const campName = camp ? camp.name : 'this camp';
    const disaster = disasters.find(d => d.disaster_id === camp?.disaster_id);
    
    // Enhanced confirmation dialog with dependency warning
    let confirmMessage = `Are you sure you want to delete "${campName}"?\n\n`;
    confirmMessage += `⚠️ WARNING: This action cannot be undone!\n\n`;
    confirmMessage += `This will permanently delete:\n`;
    confirmMessage += `• The camp record\n`;
    confirmMessage += `• All volunteer assignments for this camp\n`;
    confirmMessage += `• All resource requests for this camp\n`;
    confirmMessage += `• All related notifications and history\n`;
    if (camp?.coordinator_id) {
      confirmMessage += `• The coordinator assignment (coordinator will be unassigned)\n`;
    }
    if (camp?.current_occupancy > 0) {
      confirmMessage += `\n⚠️ CRITICAL: This camp currently has ${camp.current_occupancy} occupants!\n`;
      confirmMessage += `Please ensure all occupants are relocated before deletion.\n`;
    }
    confirmMessage += `\nCamp Details:\n`;
    confirmMessage += `• Location: ${camp?.location || 'Unknown'}\n`;
    confirmMessage += `• Disaster: ${disaster?.name || 'Unknown'}\n`;
    confirmMessage += `• Capacity: ${camp?.capacity || 0}\n`;
    confirmMessage += `• Current Occupancy: ${camp?.current_occupancy || 0}\n\n`;
    confirmMessage += `Type "DELETE" to confirm:`;
    
    const userInput = window.prompt(confirmMessage);
    if (userInput !== 'DELETE') {
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      await deleteCamp(id);
      setSuccess(`Camp "${campName}" and all associated data deleted successfully!`);
      await loadData();
    } catch (err) {
      console.error('Delete camp error:', err);
      let errorMessage = 'Failed to delete camp: ';
      if (err.message.includes('foreign key constraint')) {
        errorMessage += 'Cannot delete camp because it has associated data that must be removed first.';
      } else if (err.message.includes('occupancy')) {
        errorMessage += 'Cannot delete camp with current occupants. Please relocate all occupants first.';
      } else {
        errorMessage += (err.message || 'Unknown error occurred');
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setSuccess('User role updated successfully!');
      loadData();
    } catch (err) {
      setError('Failed to update user role: ' + err.message);
    }
  };

  const handleApproveUser = async (userId, approved, assignedCampId = null) => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      // Enhanced validation for coordinator approval
      const user = pendingUsers.find(u => u.user_id === userId);
      if (user && normalizeRole(user.role) === 'coordinator' && approved) {
        // Validate coordinator qualifications
        if (!user.skills || user.skills.length === 0) {
          const confirmApproval = window.confirm(
            'This coordinator has not provided skills or experience information. ' +
            'Are you sure you want to approve them? It is recommended to have coordinators ' +
            'provide their qualifications before approval.'
          );
          if (!confirmApproval) {
            setLoading(false);
            return;
          }
        }
        
        // If assigning to a camp, confirm the assignment
        if (assignedCampId) {
          const camp = camps.find(c => c.camp_id === parseInt(assignedCampId));
          const disaster = disasters.find(d => d.disaster_id === camp?.disaster_id);
          const confirmAssignment = window.confirm(
            `Approve ${user.full_name} as coordinator and assign to:\n\n` +
            `Camp: ${camp?.name}\n` +
            `Location: ${camp?.location}\n` +
            `Disaster: ${disaster?.name}\n` +
            `Capacity: ${camp?.capacity}\n\n` +
            'This coordinator will have full management access to this camp.'
          );
          if (!confirmAssignment) {
            setLoading(false);
            return;
          }
        }
      }
      
      await approveUser(userId, { 
        user_id: userId, 
        approved, 
        assigned_camp_id: assignedCampId ? parseInt(assignedCampId) : null
      });
      
      const user = pendingUsers.find(u => u.user_id === userId);
      let successMessage = `User ${user?.full_name || 'Unknown'} ${approved ? 'approved' : 'rejected'} successfully!`;
      
      if (approved && normalizeRole(user?.role) === 'coordinator' && assignedCampId) {
        const camp = camps.find(c => c.camp_id === parseInt(assignedCampId));
        successMessage += ` Assigned to camp: ${camp?.name}`;
      }
      
      setSuccess(successMessage);
      await loadData();
    } catch (err) {
      console.error('User approval error:', err);
      let errorMessage = `Failed to ${approved ? 'approve' : 'reject'} user: `;
      if (err.message.includes('Camp not found')) {
        errorMessage += 'Selected camp is no longer available. Please refresh and try again.';
      } else if (err.message.includes('already assigned')) {
        errorMessage += 'Selected camp already has a coordinator assigned. Please refresh and select another camp.';
      } else {
        errorMessage += (err.message || 'Unknown error occurred');
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectUser = async (userId) => {
    const user = pendingUsers.find(u => u.user_id === userId);
    const userName = user?.full_name || 'this user';
    const userRole = user?.role || 'USER';
    
    try {
      // Get role-specific rejection reasons
      const rejectionReasonsData = await getRejectionReasons();
      let rejectionReasons = [];
      
      switch (userRole) {
        case 'COORDINATOR':
          rejectionReasons = rejectionReasonsData.coordinator_reasons;
          break;
        case 'VOLUNTEER':
          rejectionReasons = rejectionReasonsData.volunteer_reasons;
          break;
        case 'DONOR':
          rejectionReasons = rejectionReasonsData.donor_reasons;
          break;
        default:
          rejectionReasons = [
            'Incomplete application',
            'Does not meet requirements',
            'Other (please specify)'
          ];
      }
      
      let selectedReason = '';
      let customDetails = '';
      
      // Show reason selection dialog
      const reasonSelection = window.prompt(
        `Please select a reason for rejecting ${userName} (${userRole}):\n\n` +
        rejectionReasons.map((reason, index) => `${index + 1}. ${reason}`).join('\n') +
        `\n\nEnter the number (1-${rejectionReasons.length}) of your selected reason:`
      );
      
      if (!reasonSelection) {
        return; // User cancelled
      }
      
      const reasonIndex = parseInt(reasonSelection) - 1;
      if (reasonIndex >= 0 && reasonIndex < rejectionReasons.length) {
        selectedReason = rejectionReasons[reasonIndex];
        
        // If "Other" was selected, ask for custom reason
        if (selectedReason.includes('Other (please specify')) {
          customDetails = window.prompt('Please specify the reason for rejection:');
          if (!customDetails) {
            return; // User cancelled
          }
          selectedReason = customDetails;
        }
      } else {
        setError('Invalid reason selection. Please try again.');
        return;
      }
      
      // Ask for additional details if needed
      if (!selectedReason.includes('Other') && normalizeRole(userRole) === 'coordinator') {
        const additionalDetails = window.prompt(
          `Optional: Provide additional details or suggestions for ${userName}:\n\n` +
          'This will help them understand what they need to improve for future applications.'
        );
        if (additionalDetails) {
          customDetails = additionalDetails;
        }
      }
      
      // Ask about reapplication eligibility
      const canReapply = window.confirm(
        `Should ${userName} be allowed to reapply immediately?\n\n` +
        'Click "OK" if they can reapply after addressing the issues.\n' +
        'Click "Cancel" if they should contact an administrator first.'
      );
      
      // Confirm rejection
      const confirmRejection = window.confirm(
        `Are you sure you want to reject ${userName}?\n\n` +
        `Role: ${userRole}\n` +
        `Reason: ${selectedReason}\n` +
        (customDetails ? `Details: ${customDetails}\n` : '') +
        `Can reapply: ${canReapply ? 'Yes' : 'No (must contact admin)'}\n\n` +
        'This action will:\n' +
        '• Reject the user\'s application\n' +
        '• Send them a detailed notification with the rejection reason\n' +
        '• Set their reapplication status\n\n' +
        'This action cannot be undone.'
      );
      
      if (!confirmRejection) {
        return;
      }
      
      setError('');
      setSuccess('');
      setLoading(true);
      
      // Call the new rejection API
      await rejectUser(userId, {
        reason: selectedReason,
        details: customDetails || null,
        can_reapply: canReapply
      });
      
      setSuccess(
        `User ${userName} rejected successfully. ` +
        `Reason: ${selectedReason}. ` +
        `${canReapply ? 'They can reapply after addressing the issues.' : 'They must contact an admin before reapplying.'}`
      );
      await loadData();
      
    } catch (err) {
      console.error('User rejection error:', err);
      if (err.message.includes('Cannot reject an already approved user')) {
        setError('This user has already been approved and cannot be rejected.');
      } else {
        setError(`Failed to reject user: ${err.message || 'Unknown error occurred'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="admin-management"><div className="loading">Loading admin panel...</div></div>;
  }

  return (
    <div className="admin-management">
      <div className="admin-header">
        <h2>Admin Management Panel</h2>
        <p>Welcome, {user?.full_name}! You have full system access.</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`tab-button ${activeTab === 'approvals' ? 'active' : ''}`}
          onClick={() => setActiveTab('approvals')}
        >
          User Approvals {pendingUsers.length > 0 && <span className="badge">{pendingUsers.length}</span>}
        </button>
        <button 
          className={`tab-button ${activeTab === 'disasters' ? 'active' : ''}`}
          onClick={() => setActiveTab('disasters')}
        >
          Manage Disasters
        </button>
        <button 
          className={`tab-button ${activeTab === 'camps' ? 'active' : ''}`}
          onClick={() => setActiveTab('camps')}
        >
          Manage Camps
        </button>
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Manage Users
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-overview">
            <h3>System Overview</h3>
            {dashboardStats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <h4>Total Disasters</h4>
                  <p className="stat-number">{dashboardStats.total_disasters}</p>
                  <small>{dashboardStats.active_disasters} active</small>
                </div>
                <div className="stat-card">
                  <h4>Total Camps</h4>
                  <p className="stat-number">{dashboardStats.total_camps}</p>
                </div>
                <div className="stat-card">
                  <h4>Total Users</h4>
                  <p className="stat-number">{dashboardStats.total_users}</p>
                </div>
                <div className="stat-card">
                  <h4>Pending Approvals</h4>
                  <p className="stat-number">{dashboardStats.pending_approvals}</p>
                </div>
                <div className="stat-card">
                  <h4>Pending Resource Requests</h4>
                  <p className="stat-number">{dashboardStats.pending_resource_requests}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="approvals-management">
            <h3>Pending User Approvals</h3>
            {pendingUsers.length === 0 ? (
              <div className="empty-state">
                <p>No pending user approvals.</p>
              </div>
            ) : (
              <div className="pending-users-list">
                {pendingUsers.map(pendingUser => (
                  <div key={pendingUser.user_id} className="pending-user-item">
                    <div className="user-info">
                      <div className="user-header">
                        <h4>{pendingUser.full_name}</h4>
                        <span className={`role-badge ${pendingUser.role.toLowerCase()}`}>
                          {pendingUser.role}
                        </span>
                      </div>
                      <div className="user-details">
                        <p><strong>Username:</strong> {pendingUser.username}</p>
                        <p><strong>Email:</strong> {pendingUser.email}</p>
                        <p><strong>Registered:</strong> {new Date(pendingUser.created_at).toLocaleDateString()}</p>
                        
                        {/* Enhanced coordinator-specific information */}
                        {normalizeRole(pendingUser.role) === 'coordinator' && (
                          <div className="coordinator-info">
                            <h5>Coordinator Application Details</h5>
                            {pendingUser.skills && pendingUser.skills.length > 0 ? (
                              <p><strong>Skills & Experience:</strong> {pendingUser.skills.join(', ')}</p>
                            ) : (
                              <p><strong>Skills & Experience:</strong> <em>Not provided</em></p>
                            )}
                            {pendingUser.experience && (
                              <p><strong>Previous Experience:</strong> {pendingUser.experience}</p>
                            )}
                            {pendingUser.qualifications && (
                              <p><strong>Qualifications:</strong> {pendingUser.qualifications}</p>
                            )}
                            {pendingUser.emergency_contact && (
                              <p><strong>Emergency Contact:</strong> {pendingUser.emergency_contact}</p>
                            )}
                            <div className="coordinator-requirements">
                              <p><strong>Coordinator Requirements Check:</strong></p>
                              <ul>
                                <li className={pendingUser.skills && pendingUser.skills.length > 0 ? 'requirement-met' : 'requirement-missing'}>
                                  Skills/Experience provided: {pendingUser.skills && pendingUser.skills.length > 0 ? '✓' : '✗'}
                                </li>
                                <li className={pendingUser.email ? 'requirement-met' : 'requirement-missing'}>
                                  Valid email address: {pendingUser.email ? '✓' : '✗'}
                                </li>
                                <li className="requirement-note">
                                  <em>Review qualifications and experience before approval</em>
                                </li>
                              </ul>
                            </div>
                          </div>
                        )}
                        
                        {/* Regular volunteer/donor information */}
                        {normalizeRole(pendingUser.role) !== 'coordinator' && pendingUser.skills && (
                          <p><strong>Skills:</strong> {pendingUser.skills.join(', ')}</p>
                        )}
                      </div>
                    </div>
                    <div className="approval-actions">
                      {normalizeRole(pendingUser.role) === 'coordinator' && (
                        <div className="coordinator-assignment">
                          <label htmlFor={`camp-select-${pendingUser.user_id}`}>
                            <strong>Assign to Camp:</strong>
                          </label>
                          <select 
                            id={`camp-select-${pendingUser.user_id}`}
                            defaultValue=""
                            className="camp-assignment-select"
                          >
                            <option value="">No camp assignment (can be assigned later)</option>
                            {camps.filter(camp => !camp.coordinator_id).map(camp => {
                              const disaster = disasters.find(d => d.disaster_id === camp.disaster_id);
                              return (
                                <option key={camp.camp_id} value={camp.camp_id}>
                                  {camp.name} - {camp.location} ({disaster?.name || 'Unknown Disaster'})
                                </option>
                              );
                            })}
                          </select>
                          {camps.filter(camp => !camp.coordinator_id).length === 0 && (
                            <p className="no-camps-available">
                              <em>No camps available for assignment. All camps have coordinators.</em>
                            </p>
                          )}
                        </div>
                      )}
                      
                      <div className="action-buttons">
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => {
                            const campSelect = document.getElementById(`camp-select-${pendingUser.user_id}`);
                            const assignedCampId = campSelect ? (campSelect.value || null) : null;
                            handleApproveUser(pendingUser.user_id, true, assignedCampId);
                          }}
                          disabled={loading}
                        >
                          {loading ? 'Approving...' : 'Approve'}
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRejectUser(pendingUser.user_id)}
                          disabled={loading}
                        >
                          {loading ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'disasters' && (
          <div className="disasters-management">
            <div className="create-section">
              <h3>Create New Disaster</h3>
              <form onSubmit={handleCreateDisaster} className="admin-form">
                <div className="form-row">
                  <label>
                    Disaster Name
                    <input
                      type="text"
                      value={disasterForm.name}
                      onChange={(e) => setDisasterForm({...disasterForm, name: e.target.value})}
                      required
                    />
                  </label>
                  <label>
                    Type
                    <select
                      value={disasterForm.type}
                      onChange={(e) => setDisasterForm({...disasterForm, type: e.target.value})}
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="Earthquake">Earthquake</option>
                      <option value="Flood">Flood</option>
                      <option value="Cyclone">Cyclone</option>
                      <option value="Landslide">Landslide</option>
                      <option value="Drought">Drought</option>
                      <option value="Heat Wave">Heat Wave</option>
                      <option value="Fire">Fire</option>
                    </select>
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    Location
                    <input
                      type="text"
                      value={disasterForm.location}
                      onChange={(e) => setDisasterForm({...disasterForm, location: e.target.value})}
                      required
                    />
                  </label>
                  <label>
                    Severity Level
                    <select
                      value={disasterForm.severity_level}
                      onChange={(e) => setDisasterForm({...disasterForm, severity_level: e.target.value})}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    Start Date
                    <input
                      type="datetime-local"
                      value={disasterForm.start_date}
                      onChange={(e) => setDisasterForm({...disasterForm, start_date: e.target.value})}
                      required
                    />
                  </label>
                  <label>
                    Status
                    <select
                      value={disasterForm.status}
                      onChange={(e) => setDisasterForm({...disasterForm, status: e.target.value})}
                    >
                      <option value="Active">Active</option>
                      <option value="Monitoring">Monitoring</option>
                      <option value="Recovery">Recovery</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </label>
                </div>
                <label>
                  Description
                  <textarea
                    value={disasterForm.description}
                    onChange={(e) => setDisasterForm({...disasterForm, description: e.target.value})}
                    rows="3"
                  />
                </label>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Disaster'}
                </button>
              </form>
            </div>

            <div className="list-section">
              <div className="section-header">
                <h3>Existing Disasters ({disasters.length})</h3>
                {loading && <div className="loading-indicator">Loading...</div>}
              </div>
              {disasters.length === 0 ? (
                <div className="empty-state">
                  <p>No disasters found. Create your first disaster above.</p>
                </div>
              ) : (
                <div className="disasters-list">
                  {disasters.map(disaster => {
                    const associatedCamps = camps.filter(camp => camp.disaster_id === disaster.disaster_id);
                    const statusColor = {
                      'Active': '#ef4444',
                      'Monitoring': '#f59e0b', 
                      'Recovery': '#3b82f6',
                      'Resolved': '#10b981'
                    }[disaster.status] || '#6b7280';
                    
                    const severityColor = {
                      'Low': '#10b981',
                      'Medium': '#f59e0b',
                      'High': '#ef4444',
                      'Critical': '#dc2626'
                    }[disaster.severity_level] || '#6b7280';
                    
                    return (
                      <div key={disaster.disaster_id} className="disaster-item">
                        <div className="disaster-info">
                          <div className="disaster-header">
                            <h4>{disaster.name}</h4>
                            <div className="disaster-badges">
                              <span 
                                className="status-badge" 
                                style={{ backgroundColor: statusColor }}
                                title={`Status: ${disaster.status}`}
                              >
                                {disaster.status}
                              </span>
                              <span 
                                className="severity-badge" 
                                style={{ backgroundColor: severityColor }}
                                title={`Severity: ${disaster.severity_level}`}
                              >
                                {disaster.severity_level}
                              </span>
                            </div>
                          </div>
                          <div className="disaster-details">
                            <div className="detail-row">
                              <span className="detail-label">Type:</span>
                              <span className="detail-value">{disaster.type}</span>
                              <span className="detail-separator">|</span>
                              <span className="detail-label">Location:</span>
                              <span className="detail-value">{disaster.location}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Associated Camps:</span>
                              <span className="detail-value camp-count">
                                {associatedCamps.length}
                                {associatedCamps.length > 0 && (
                                  <span className="camp-names">
                                    ({associatedCamps.map(camp => camp.name).join(', ')})
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Start Date:</span>
                              <span className="detail-value">
                                {new Date(disaster.start_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            {disaster.description && (
                              <div className="detail-row description">
                                <span className="detail-label">Description:</span>
                                <span className="detail-value">{disaster.description}</span>
                              </div>
                            )}
                            <div className="detail-row metadata">
                              <span className="detail-label">Created:</span>
                              <span className="detail-value">
                                {new Date(disaster.created_at).toLocaleDateString()}
                              </span>
                              {disaster.updated_at !== disaster.created_at && (
                                <>
                                  <span className="detail-separator">|</span>
                                  <span className="detail-label">Updated:</span>
                                  <span className="detail-value">
                                    {new Date(disaster.updated_at).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="disaster-actions">
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/disasters/${disaster.disaster_id}`)}
                            title="View disaster details"
                            disabled={loading}
                          >
                            View Details
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteDisaster(disaster.disaster_id)}
                            title={`Delete ${disaster.name}`}
                            disabled={loading}
                          >
                            {loading ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'camps' && (
          <div className="camps-management">
            <div className="create-section">
              <h3>Create New Camp</h3>
              <form onSubmit={handleCreateCamp} className="admin-form">
                <div className="form-row">
                  <label>
                    Camp Name
                    <input
                      type="text"
                      value={campForm.name}
                      onChange={(e) => setCampForm({...campForm, name: e.target.value})}
                      required
                      disabled={loading}
                      placeholder="Enter camp name"
                    />
                  </label>
                  <label>
                    Location
                    <input
                      type="text"
                      value={campForm.location}
                      onChange={(e) => setCampForm({...campForm, location: e.target.value})}
                      required
                      disabled={loading}
                      placeholder="Enter camp location"
                    />
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    Capacity
                    <input
                      type="number"
                      value={campForm.capacity}
                      onChange={(e) => setCampForm({...campForm, capacity: e.target.value})}
                      required
                      min="1"
                      max="10000"
                      disabled={loading}
                      placeholder="Maximum capacity"
                    />
                  </label>
                  <label>
                    Disaster
                    <select
                      value={campForm.disaster_id}
                      onChange={(e) => setCampForm({...campForm, disaster_id: e.target.value})}
                      required
                      disabled={loading}
                    >
                      <option value="">Select Disaster</option>
                      {disasters
                        .filter(disaster => disaster.status !== 'Resolved')
                        .map(disaster => (
                        <option key={disaster.disaster_id} value={disaster.disaster_id}>
                          {disaster.name} - {disaster.location} ({disaster.status})
                        </option>
                      ))}
                    </select>
                    {disasters.filter(d => d.status !== 'Resolved').length === 0 && (
                      <small className="form-help">No active disasters available. Create a disaster first.</small>
                    )}
                  </label>
                </div>
                <label>
                  Contact Info
                  <input
                    type="text"
                    value={campForm.contact_info}
                    onChange={(e) => setCampForm({...campForm, contact_info: e.target.value})}
                    placeholder="Phone number or email"
                    disabled={loading}
                  />
                </label>
                <label>
                  Facilities
                  <textarea
                    value={campForm.facilities}
                    onChange={(e) => setCampForm({...campForm, facilities: e.target.value})}
                    rows="3"
                    placeholder="List available facilities..."
                    disabled={loading}
                  />
                </label>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Camp'}
                </button>
              </form>
            </div>

            <div className="list-section">
              <div className="section-header">
                <h3>Existing Camps ({camps.length})</h3>
                {loading && <div className="loading-indicator">Loading...</div>}
              </div>
              {camps.length === 0 ? (
                <div className="empty-state">
                  <p>No camps found. Create your first camp above.</p>
                </div>
              ) : (
                <div className="camps-list">
                  {camps.map(camp => {
                    const disaster = disasters.find(d => d.disaster_id === camp.disaster_id);
                    const occupancy = camp.current_occupancy || 0;
                    const occupancyRate = camp.capacity > 0 ? (occupancy / camp.capacity * 100).toFixed(1) : 0;
                    const coordinator = users.find(u => u.user_id === camp.coordinator_id);
                    
                    // Determine occupancy status color
                    const occupancyColor = occupancyRate >= 90 ? '#ef4444' : 
                                         occupancyRate >= 70 ? '#f59e0b' : 
                                         occupancyRate >= 50 ? '#3b82f6' : '#10b981';
                    
                    // Determine camp status color
                    const statusColor = camp.status === 'ACTIVE' ? '#10b981' : '#6b7280';
                    
                    return (
                      <div key={camp.camp_id} className="camp-item">
                        <div className="camp-info">
                          <div className="camp-header">
                            <h4>{camp.name}</h4>
                            <div className="camp-badges">
                              <span 
                                className="status-badge" 
                                style={{ backgroundColor: statusColor }}
                                title={`Status: ${camp.status || 'ACTIVE'}`}
                              >
                                {camp.status || 'ACTIVE'}
                              </span>
                              <span 
                                className="occupancy-badge" 
                                style={{ backgroundColor: occupancyColor }}
                                title={`Occupancy: ${occupancy}/${camp.capacity} (${occupancyRate}%)`}
                              >
                                {occupancyRate}% Full
                              </span>
                            </div>
                          </div>
                          <div className="camp-details">
                            <div className="detail-row">
                              <span className="detail-label">Location:</span>
                              <span className="detail-value">{camp.location}</span>
                              <span className="detail-separator">|</span>
                              <span className="detail-label">Disaster:</span>
                              <span className="detail-value">
                                {disaster?.name || 'Unknown'}
                                {disaster && (
                                  <span className="disaster-status" style={{ 
                                    color: disaster.status === 'Active' ? '#ef4444' : 
                                           disaster.status === 'Monitoring' ? '#f59e0b' : 
                                           disaster.status === 'Recovery' ? '#3b82f6' : '#10b981'
                                  }}>
                                    ({disaster.status})
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Capacity:</span>
                              <span className="detail-value">
                                {occupancy} / {camp.capacity} people
                                <span className="occupancy-bar-container">
                                  <div className="occupancy-bar">
                                    <div 
                                      className="occupancy-fill" 
                                      style={{ 
                                        width: `${Math.min(occupancyRate, 100)}%`,
                                        backgroundColor: occupancyColor
                                      }}
                                    ></div>
                                  </div>
                                </span>
                              </span>
                            </div>
                            {coordinator && (
                              <div className="detail-row">
                                <span className="detail-label">Coordinator:</span>
                                <span className="detail-value">{coordinator.full_name}</span>
                              </div>
                            )}
                            {!coordinator && (
                              <div className="detail-row">
                                <span className="detail-label">Coordinator:</span>
                                <span className="detail-value no-coordinator">No coordinator assigned</span>
                              </div>
                            )}
                            {camp.contact_info && (
                              <div className="detail-row">
                                <span className="detail-label">Contact:</span>
                                <span className="detail-value">{camp.contact_info}</span>
                              </div>
                            )}
                            {camp.facilities && (
                              <div className="detail-row facilities">
                                <span className="detail-label">Facilities:</span>
                                <span className="detail-value">{camp.facilities}</span>
                              </div>
                            )}
                            <div className="detail-row metadata">
                              <span className="detail-label">Created:</span>
                              <span className="detail-value">
                                {new Date(camp.created_at).toLocaleDateString()}
                              </span>
                              {camp.updated_at !== camp.created_at && (
                                <>
                                  <span className="detail-separator">|</span>
                                  <span className="detail-label">Updated:</span>
                                  <span className="detail-value">
                                    {new Date(camp.updated_at).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="camp-actions">
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/camps/${camp.camp_id}`)}
                            title="View camp details"
                            disabled={loading}
                          >
                            View Details
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteCamp(camp.camp_id)}
                            title={`Delete ${camp.name}`}
                            disabled={loading}
                          >
                            {loading ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-management">
            <h3>User Management</h3>
            <div className="users-list">
              {users.map(user => (
                <div key={user.user_id} className="user-item">
                  <div className="user-info">
                    <h4>{user.full_name}</h4>
                    <p><strong>Username:</strong> {user.username}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Current Role:</strong> {user.role}</p>
                  </div>
                  <div className="user-actions">
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateUserRole(user.user_id, e.target.value)}
                    >
                      <option value="VOLUNTEER">Volunteer</option>
                      <option value="DONOR">Donor</option>
                      <option value="COORDINATOR">Coordinator</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}