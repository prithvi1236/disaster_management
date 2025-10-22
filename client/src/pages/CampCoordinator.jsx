import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getCurrentUser, 
  getCoordinatorDashboard,
  updateAssignedCamp,
  createResourceRequest,
  getCampResourceRequests,
  getCampVolunteers,
  approveVolunteerAssignment,
  rejectVolunteerAssignment,
  submitDailyReport
} from '../services/api';
import { normalizeRole } from '../utils/auth';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import FormField from '../components/FormField';
import { useLoadingState } from '../hooks/useLoadingState';
import { useErrorHandler, formatErrorMessage } from '../hooks/useErrorHandler';
import { validateForm, commonSchemas, hasFormErrors } from '../utils/validation';
import '../styles/coordinator.css';
import '../styles/form.css';

export default function CampCoordinator() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [resourceRequests, setResourceRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Enhanced loading and error handling
  const { loadingStates, setLoading, isLoading, isAnyLoading } = useLoadingState({
    initial: true,
    createResourceRequest: false,
    updateCamp: false,
    approveVolunteer: false,
    rejectVolunteer: false,
    submitReport: false
  });

  const { 
    error, 
    handleError, 
    clearError, 
    retry,
    withErrorHandling 
  } = useErrorHandler({
    maxRetries: 2,
    retryDelay: 1000
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState({
    resourceRequest: {},
    campUpdate: {},
    dailyReport: {}
  });

  // Resource request form
  const [resourceRequest, setResourceRequest] = useState({
    resource_type: 'Food',
    quantity_requested: '',
    urgency: 'medium',
    description: '',
    camp_id: ''
  });

  // Daily report form
  const [dailyReport, setDailyReport] = useState({
    date: new Date().toISOString().split('T')[0],
    population: '',
    medical_needs: '',
    resource_status: '',
    notes: ''
  });

  // Camp update form
  const [campUpdate, setCampUpdate] = useState({
    current_occupancy: '',
    status: 'ACTIVE',
    resources_needed: {},
    contact_info: '',
    facilities: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading('initial', true);
      clearError();
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const userData = await getCurrentUser();
      if (normalizeRole(userData.role) !== 'coordinator') {
        navigate('/dashboard');
        return;
      }

      setUser(userData);
      
      const [dashboardInfo, resourceRequestsData, volunteersData] = await Promise.all([
        getCoordinatorDashboard(),
        getCampResourceRequests(),
        getCampVolunteers()
      ]);

      setDashboardData(dashboardInfo);
      setResourceRequests(resourceRequestsData);
      setVolunteers(volunteersData);
      
      // Set camp_id for resource requests
      if (dashboardInfo.camp) {
        setResourceRequest(prev => ({
          ...prev,
          camp_id: dashboardInfo.camp.camp_id
        }));
        
        setCampUpdate({
          current_occupancy: dashboardInfo.camp.current_occupancy || 0,
          status: dashboardInfo.camp.status || 'ACTIVE',
          resources_needed: dashboardInfo.camp.resources_needed || {},
          contact_info: dashboardInfo.camp.contact_info || '',
          facilities: dashboardInfo.camp.facilities || ''
        });
      }
      
    } catch (err) {
      console.error('Camp coordinator error:', err);
      handleError(err);
      if (err.message.includes('403') || err.message.includes('401')) {
        navigate('/login');
      }
    } finally {
      setLoading('initial', false);
    }
  };

  const handleResourceRequest = async (e) => {
    e.preventDefault();
    clearError();
    setSuccess('');
    
    // Validate form
    const errors = validateForm(resourceRequest, commonSchemas.resourceRequest);
    
    // Additional custom validation
    if (!dashboardData?.camp?.camp_id) {
      errors.general = 'No camp assigned. Cannot create resource request.';
    }
    
    setFormErrors(prev => ({ ...prev, resourceRequest: errors }));
    
    if (hasFormErrors(errors)) {
      return;
    }
    
    try {
      setLoading('createResourceRequest', true);
      
      await createResourceRequest({
        ...resourceRequest,
        quantity_requested: parseInt(resourceRequest.quantity_requested),
        camp_id: dashboardData.camp.camp_id
      });
      
      setSuccess('Resource request submitted successfully!');
      setResourceRequest({
        resource_type: 'Food',
        quantity_requested: '',
        urgency: 'medium',
        description: '',
        camp_id: dashboardData.camp.camp_id
      });
      setFormErrors(prev => ({ ...prev, resourceRequest: {} }));
      
      // Reload data to show the new request
      await loadData();
    } catch (err) {
      console.error('Resource request error:', err);
      handleError(new Error(`Failed to submit resource request: ${formatErrorMessage(err)}`));
    } finally {
      setLoading('createResourceRequest', false);
    }
  };

  const handleApproveVolunteer = async (assignmentId) => {
    try {
      clearError();
      setSuccess('');
      setLoading('approveVolunteer', true);
      
      await approveVolunteerAssignment(assignmentId);
      setSuccess('Volunteer approved successfully!');
      await loadData();
    } catch (err) {
      handleError(new Error(`Failed to approve volunteer: ${formatErrorMessage(err)}`));
    } finally {
      setLoading('approveVolunteer', false);
    }
  };

  const handleRejectVolunteer = async (assignmentId) => {
    try {
      clearError();
      setSuccess('');
      setLoading('rejectVolunteer', true);
      
      await rejectVolunteerAssignment(assignmentId);
      setSuccess('Volunteer application rejected.');
      await loadData();
    } catch (err) {
      handleError(new Error(`Failed to reject volunteer: ${formatErrorMessage(err)}`));
    } finally {
      setLoading('rejectVolunteer', false);
    }
  };

  const handleUpdateCamp = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      await updateAssignedCamp({
        ...campUpdate,
        current_occupancy: parseInt(campUpdate.current_occupancy)
      });
      
      setSuccess('Camp information updated successfully!');
      loadData();
    } catch (err) {
      setError('Failed to update camp: ' + err.message);
    }
  };

  const handleDailyReport = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      await submitDailyReport(dailyReport);
      
      setSuccess('Daily report submitted successfully!');
      setDailyReport({
        date: new Date().toISOString().split('T')[0],
        population: '',
        medical_needs: '',
        resource_status: '',
        notes: ''
      });
    } catch (err) {
      setError('Failed to submit daily report: ' + err.message);
    }
  };

  if (loadingStates.initial) {
    return (
      <div className="coordinator-panel">
        <LoadingSpinner size="large" message="Loading coordinator panel..." />
      </div>
    );
  }

  return (
    <div className="coordinator-panel">
      <div className="coordinator-header">
        <h2>Camp Coordinator Panel</h2>
        <p>Welcome, {user?.full_name}! Manage camps and coordinate resources.</p>
      </div>

      {error && (
        <ErrorMessage
          error={error}
          onRetry={() => retry(loadData)}
          onDismiss={clearError}
        />
      )}
      {success && <div className="success-message">{success}</div>}

      <div className="coordinator-tabs">
        <button 
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`tab-button ${activeTab === 'camp' ? 'active' : ''}`}
          onClick={() => setActiveTab('camp')}
        >
          Manage Camp
        </button>
        <button 
          className={`tab-button ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          Resource Requests
        </button>
        <button 
          className={`tab-button ${activeTab === 'volunteers' ? 'active' : ''}`}
          onClick={() => setActiveTab('volunteers')}
        >
          Manage Volunteers
        </button>
        <button 
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Daily Reports
        </button>
      </div>

      <div className="coordinator-content">
        {activeTab === 'dashboard' && (
          <div className="coordinator-dashboard">
            <h3>Camp Dashboard</h3>
            {dashboardData ? (
              <div>
                <div className="camp-overview">
                  <h4>{dashboardData.camp.name}</h4>
                  <p><strong>Location:</strong> {dashboardData.camp.location}</p>
                  <p><strong>Capacity:</strong> {dashboardData.camp.current_occupancy} / {dashboardData.camp.capacity}</p>
                  <p><strong>Occupancy Rate:</strong> {dashboardData.statistics.occupancy_rate.toFixed(1)}%</p>
                  <p><strong>Status:</strong> {dashboardData.camp.status}</p>
                </div>
                
                <div className="stats-grid">
                  <div className="stat-card">
                    <h4>Total Volunteers</h4>
                    <p className="stat-number">{dashboardData.statistics.total_volunteers}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Pending Volunteers</h4>
                    <p className="stat-number">{dashboardData.statistics.pending_volunteers}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Pending Resource Requests</h4>
                    <p className="stat-number">{dashboardData.statistics.pending_resource_requests}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p>No camp assigned. Please contact an administrator.</p>
            )}
          </div>
        )}

        {activeTab === 'camp' && (
          <div className="camp-management">
            <h3>Update Camp Information</h3>
            {dashboardData?.camp ? (
              <form onSubmit={handleUpdateCamp} className="camp-form">
                <div className="form-row">
                  <label>
                    Current Occupancy
                    <input
                      type="number"
                      value={campUpdate.current_occupancy}
                      onChange={(e) => setCampUpdate({...campUpdate, current_occupancy: e.target.value})}
                      min="0"
                      max={dashboardData.camp.capacity}
                    />
                  </label>
                  <label>
                    Status
                    <select
                      value={campUpdate.status}
                      onChange={(e) => setCampUpdate({...campUpdate, status: e.target.value})}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="FULL">Full</option>
                    </select>
                  </label>
                </div>
                
                <label>
                  Contact Information
                  <input
                    type="text"
                    value={campUpdate.contact_info}
                    onChange={(e) => setCampUpdate({...campUpdate, contact_info: e.target.value})}
                    placeholder="Phone number or email"
                  />
                </label>
                
                <label>
                  Facilities
                  <textarea
                    value={campUpdate.facilities}
                    onChange={(e) => setCampUpdate({...campUpdate, facilities: e.target.value})}
                    rows="3"
                    placeholder="List available facilities..."
                  />
                </label>
                
                <button type="submit" className="btn btn-primary">Update Camp</button>
              </form>
            ) : (
              <p>No camp assigned.</p>
            )}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="resource-requests">
            <h3>Resource Requests</h3>
            
            {dashboardData?.camp ? (
              <div className="create-request">
                <h4>Create New Request</h4>
                <form onSubmit={handleResourceRequest} className={`resource-form ${isLoading('createResourceRequest') ? 'form-submitting' : ''}`}>
                  {formErrors.resourceRequest.general && (
                    <ErrorMessage 
                      error={formErrors.resourceRequest.general} 
                      type="warning" 
                      className="inline"
                    />
                  )}
                  
                  <div className="form-row">
                    <FormField 
                      label="Resource Type" 
                      required 
                      error={formErrors.resourceRequest.resource_type}
                    >
                      <select
                        value={resourceRequest.resource_type}
                        onChange={(e) => setResourceRequest({...resourceRequest, resource_type: e.target.value})}
                        disabled={isLoading('createResourceRequest')}
                      >
                        <option value="Food">Food</option>
                        <option value="Water">Water</option>
                        <option value="Medical">Medical</option>
                        <option value="Shelter">Shelter</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Equipment">Equipment</option>
                        <option value="Other">Other</option>
                      </select>
                    </FormField>
                    <FormField 
                      label="Quantity" 
                      required 
                      error={formErrors.resourceRequest.quantity_requested}
                    >
                      <input
                        type="number"
                        value={resourceRequest.quantity_requested}
                        onChange={(e) => setResourceRequest({...resourceRequest, quantity_requested: e.target.value})}
                        min="1"
                        placeholder="Number of units needed"
                        disabled={isLoading('createResourceRequest')}
                      />
                    </FormField>
                    <FormField 
                      label="Urgency" 
                      required 
                      error={formErrors.resourceRequest.urgency}
                    >
                      <select
                        value={resourceRequest.urgency}
                        onChange={(e) => setResourceRequest({...resourceRequest, urgency: e.target.value})}
                        disabled={isLoading('createResourceRequest')}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </FormField>
                  </div>

                  <FormField 
                    label="Description" 
                    required 
                    error={formErrors.resourceRequest.description}
                    helpText="Provide detailed description of the resource need"
                  >
                    <textarea
                      value={resourceRequest.description}
                      onChange={(e) => setResourceRequest({...resourceRequest, description: e.target.value})}
                      rows="3"
                      placeholder="Detailed description of the resource need..."
                      disabled={isLoading('createResourceRequest')}
                    />
                  </FormField>

                  <button 
                    type="submit" 
                    className={`btn btn-primary ${isLoading('createResourceRequest') ? 'loading' : ''}`}
                    disabled={isLoading('createResourceRequest')}
                  >
                    {isLoading('createResourceRequest') ? 'Submitting...' : 'Submit Request'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="no-camp-message">
                <h4>No Camp Assigned</h4>
                <p>You must be assigned to a camp before you can create resource requests. Please contact an administrator to assign you to a camp.</p>
              </div>
            )}

            <div className="requests-list">
              <h4>Resource Request History</h4>
              {dashboardData?.camp ? (
                resourceRequests.length === 0 ? (
                  <div className="empty-state">
                    <p>No resource requests found for your camp.</p>
                    <p>Create your first request using the form above.</p>
                  </div>
                ) : (
                  <div className="requests-grid">
                    {resourceRequests.map(request => (
                      <div key={request.request_id} className="request-card">
                        <div className="request-header">
                          <h5>{request.resource_type}</h5>
                          <span className={`status-badge ${request.status?.toLowerCase() || 'pending'}`}>
                            {request.status?.charAt(0).toUpperCase() + request.status?.slice(1) || 'Pending'}
                          </span>
                        </div>
                        <div className="request-details">
                          <p><strong>Quantity Requested:</strong> {request.quantity_requested}</p>
                          <p><strong>Urgency:</strong> <span className={`urgency-${request.urgency || 'medium'}`}>{request.urgency?.charAt(0).toUpperCase() + request.urgency?.slice(1) || 'Medium'}</span></p>
                          <p><strong>Description:</strong> {request.description}</p>
                          <p><strong>Requested:</strong> {new Date(request.requested_at).toLocaleDateString()}</p>
                          {request.quantity_approved && request.quantity_approved > 0 && (
                            <p><strong>Approved Quantity:</strong> <span className="approved-quantity">{request.quantity_approved}</span></p>
                          )}
                          {request.notes && (
                            <div className="request-notes">
                              <strong>Admin Notes:</strong>
                              <p>{request.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="no-camp-message">
                  <p>No camp assigned. Resource request history is not available.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'volunteers' && (
          <div className="volunteer-management">
            <h3>Volunteer Management</h3>
            
            {volunteers.length === 0 ? (
              <p>No volunteer applications found.</p>
            ) : (
              <div className="volunteers-grid">
                {volunteers.map(assignment => (
                  <div key={assignment.assignment_id} className="volunteer-card">
                    <div className="volunteer-header">
                      <h5>Assignment #{assignment.assignment_id}</h5>
                      <span className={`status-badge ${assignment.status.toLowerCase()}`}>
                        {assignment.status}
                      </span>
                    </div>
                    <p><strong>Volunteer ID:</strong> {assignment.volunteer_id}</p>
                    <p><strong>Hours Logged:</strong> {assignment.hours_logged}</p>
                    {assignment.assigned_tasks && (
                      <p><strong>Tasks:</strong> {assignment.assigned_tasks.join(', ')}</p>
                    )}
                    <p><strong>Start Date:</strong> {assignment.start_date ? new Date(assignment.start_date).toLocaleDateString() : 'Not set'}</p>
                    <p><strong>Created:</strong> {new Date(assignment.created_at).toLocaleDateString()}</p>
                    
                    {assignment.status === 'PENDING' && (
                      <div className="volunteer-actions">
                        <button 
                          className={`btn btn-success btn-sm ${isLoading('approveVolunteer') ? 'loading' : ''}`}
                          onClick={() => handleApproveVolunteer(assignment.assignment_id)}
                          disabled={isLoading('approveVolunteer') || isLoading('rejectVolunteer')}
                        >
                          {isLoading('approveVolunteer') ? 'Approving...' : 'Approve'}
                        </button>
                        <button 
                          className={`btn btn-danger btn-sm ${isLoading('rejectVolunteer') ? 'loading' : ''}`}
                          onClick={() => handleRejectVolunteer(assignment.assignment_id)}
                          disabled={isLoading('approveVolunteer') || isLoading('rejectVolunteer')}
                        >
                          {isLoading('rejectVolunteer') ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="daily-reports">
            <h3>Daily Situation Report</h3>
            
            <form onSubmit={handleDailyReport} className="report-form">
              <div className="form-row">
                <label>
                  Date
                  <input
                    type="date"
                    value={dailyReport.date}
                    onChange={(e) => setDailyReport({...dailyReport, date: e.target.value})}
                    required
                  />
                </label>
                <label>
                  Camp Population
                  <input
                    type="number"
                    value={dailyReport.population}
                    onChange={(e) => setDailyReport({...dailyReport, population: e.target.value})}
                    placeholder="Number of people in camp"
                  />
                </label>
              </div>
              
              <label>
                Medical Needs
                <textarea
                  value={dailyReport.medical_needs}
                  onChange={(e) => setDailyReport({...dailyReport, medical_needs: e.target.value})}
                  rows="3"
                  placeholder="Current medical needs and situations..."
                />
              </label>
              
              <label>
                Resource Status
                <textarea
                  value={dailyReport.resource_status}
                  onChange={(e) => setDailyReport({...dailyReport, resource_status: e.target.value})}
                  rows="3"
                  placeholder="Current resource levels and needs..."
                />
              </label>
              
              <label>
                Additional Notes
                <textarea
                  value={dailyReport.notes}
                  onChange={(e) => setDailyReport({...dailyReport, notes: e.target.value})}
                  rows="3"
                  placeholder="Any additional observations or notes..."
                />
              </label>
              
              <button type="submit" className="btn btn-primary">Submit Daily Report</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}