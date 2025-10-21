// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Generic request handler with authentication and error handling
 * @param {string} path - API endpoint path
 * @param {object} options - Fetch options
 * @returns {Promise} - Response data
 */
async function request(path, options = {}) {
  const url = API_BASE_URL + path;
  const headers = options.headers || {};
  headers['Content-Type'] = 'application/json';

  // Include JWT token for authentication
  const token = localStorage.getItem('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      let errorMessage = `Request failed: ${response.status}`;
      
      // Handle specific HTTP status codes
      if (response.status === 401) {
        errorMessage = 'Authentication required. Please log in.';
        // Clear invalid token
        localStorage.removeItem('access_token');
      } else if (response.status === 403) {
        errorMessage = 'Access denied. You do not have permission to perform this action.';
      } else if (response.status === 404) {
        errorMessage = 'Resource not found.';
      } else if (response.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.detail || errorMessage;
      } catch {
        const text = await response.text();
        if (text && text.length < 200) {
          errorMessage = text || errorMessage;
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    } else {
      return response.text();
    }
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server');
    }
    throw error;
  }
}

// ============================================================================
// AUTHENTICATION API
// ============================================================================

export async function registerUser(userData) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

export async function loginUser(credentials) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
}

export async function getCurrentUser() {
  return request('/api/auth/me', { method: 'GET' });
}

export async function getAllUsers(pendingOnly = false) {
  const params = pendingOnly ? '?pending_only=true' : '';
  return request(`/api/auth/users${params}`, { method: 'GET' });
}

export async function updateUserRole(userId, newRole) {
  return request(`/api/auth/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify(newRole)
  });
}

// ============================================================================
// ADMIN API
// ============================================================================

export async function getPendingUsers() {
  return request('/api/admin/users/pending', { method: 'GET' });
}

export async function approveUser(userId, approvalData) {
  return request(`/api/admin/users/${userId}/approve`, {
    method: 'POST',
    body: JSON.stringify(approvalData)
  });
}

export async function rejectUser(userId, rejectionData) {
  return request(`/api/admin/users/${userId}/reject`, {
    method: 'POST',
    body: JSON.stringify(rejectionData)
  });
}

export async function getRejectionReasons() {
  return request('/api/admin/rejection-reasons', { method: 'GET' });
}

export async function getAdminDashboardStats() {
  return request('/api/admin/dashboard/stats', { method: 'GET' });
}

export async function getDonationReports() {
  return request('/api/admin/reports/donations', { method: 'GET' });
}

export async function getVolunteerReports() {
  return request('/api/admin/reports/volunteers', { method: 'GET' });
}

export async function getResourceReports() {
  return request('/api/admin/reports/resources', { method: 'GET' });
}

export async function approveResourceRequest(requestId, quantityApproved, notes = null) {
  return request(`/api/admin/resources/approve/${requestId}`, {
    method: 'POST',
    body: JSON.stringify({ quantity_approved: quantityApproved, notes })
  });
}

export async function rejectResourceRequest(requestId, notes) {
  return request(`/api/admin/resources/reject/${requestId}`, {
    method: 'POST',
    body: JSON.stringify({ notes })
  });
}

// ============================================================================
// COORDINATOR API
// ============================================================================

export async function getCoordinatorDashboard() {
  return request('/api/coordinator/dashboard', { method: 'GET' });
}

export async function updateAssignedCamp(campData) {
  return request('/api/coordinator/camp', {
    method: 'PUT',
    body: JSON.stringify(campData)
  });
}

export async function createResourceRequest(requestData) {
  return request('/api/coordinator/resources/request', {
    method: 'POST',
    body: JSON.stringify(requestData)
  });
}

export async function getCampResourceRequests() {
  return request('/api/coordinator/resources/requests', { method: 'GET' });
}

export async function getCampVolunteers() {
  return request('/api/coordinator/volunteers', { method: 'GET' });
}

export async function approveVolunteerAssignment(assignmentId, assignedTasks = null) {
  return request(`/api/coordinator/volunteers/approve/${assignmentId}`, {
    method: 'POST',
    body: JSON.stringify({ assigned_tasks: assignedTasks })
  });
}

export async function rejectVolunteerAssignment(assignmentId) {
  return request(`/api/coordinator/volunteers/reject/${assignmentId}`, {
    method: 'POST'
  });
}

export async function submitDailyReport(reportData) {
  return request('/api/coordinator/reports/daily', {
    method: 'POST',
    body: JSON.stringify(reportData)
  });
}

// ============================================================================
// USER API
// ============================================================================

export async function getAvailableCamps() {
  return request('/api/user/camps/available', { method: 'GET' });
}

export async function getCampNeeds() {
  return request('/api/user/camps/needs', { method: 'GET' });
}

export async function applyToVolunteer(campId) {
  return request('/api/user/volunteer/apply', {
    method: 'POST',
    body: JSON.stringify({ camp_id: campId })
  });
}

export async function getVolunteerAssignments() {
  return request('/api/user/volunteer/assignments', { method: 'GET' });
}

export async function logVolunteerHours(assignmentId, hours) {
  return request(`/api/user/volunteer/hours/${assignmentId}`, {
    method: 'PUT',
    body: JSON.stringify({ hours })
  });
}

export async function makeDonation(donationData) {
  return request('/api/user/donations', {
    method: 'POST',
    body: JSON.stringify(donationData)
  });
}

export async function getDonationHistory() {
  return request('/api/user/donations/history', { method: 'GET' });
}

export async function getDonationImpact() {
  return request('/api/user/donations/impact', { method: 'GET' });
}

export async function getUserNotifications() {
  return request('/api/user/notifications', { method: 'GET' });
}

export async function markNotificationRead(notificationId) {
  return request(`/api/user/notifications/${notificationId}/read`, {
    method: 'PUT'
  });
}

// ============================================================================
// DISASTERS API
// ============================================================================

export async function fetchDisasters() {
  return request('/api/disasters', { method: 'GET' });
}

export async function fetchDisaster(id) {
  return request(`/api/disasters/${id}`, { method: 'GET' });
}

export async function createDisaster(disasterData) {
  return request('/api/disasters/', {
    method: 'POST',
    body: JSON.stringify(disasterData)
  });
}

export async function updateDisaster(id, disasterData) {
  return request(`/api/disasters/${id}`, {
    method: 'PUT',
    body: JSON.stringify(disasterData)
  });
}

export async function deleteDisaster(id) {
  return request(`/api/disasters/${id}`, { method: 'DELETE' });
}

// ============================================================================
// CAMPS API
// ============================================================================

export async function fetchCamps(disasterId = null) {
  const params = disasterId ? `?disaster_id=${disasterId}` : '';
  return request(`/api/camps${params}`, { method: 'GET' });
}

export async function fetchCamp(id) {
  return request(`/api/camps/${id}`, { method: 'GET' });
}

export async function createCamp(campData) {
  return request('/api/camps/', {
    method: 'POST',
    body: JSON.stringify(campData)
  });
}

export async function updateCamp(id, campData) {
  return request(`/api/camps/${id}`, {
    method: 'PUT',
    body: JSON.stringify(campData)
  });
}

export async function deleteCamp(id) {
  return request(`/api/camps/${id}`, { method: 'DELETE' });
}

// ============================================================================
// VOLUNTEERS API
// ============================================================================

export async function fetchVolunteers(disasterId = null) {
  const params = disasterId ? `?disaster_id=${disasterId}` : '';
  return request(`/api/volunteers${params}`, { method: 'GET' });
}

export async function fetchVolunteer(id) {
  return request(`/api/volunteers/${id}`, { method: 'GET' });
}

export async function postVolunteer(volunteer) {
  return request('/api/volunteers', {
    method: 'POST',
    body: JSON.stringify(volunteer)
  });
}

export async function updateVolunteer(id, volunteerData) {
  return request(`/api/volunteers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(volunteerData)
  });
}

// ============================================================================
// DONATIONS API
// ============================================================================

export async function fetchDonations(disasterId = null) {
  const params = disasterId ? `?disaster_id=${disasterId}` : '';
  return request(`/api/donations${params}`, { method: 'GET' });
}

export async function postDonation(donation) {
  return request('/api/donations', {
    method: 'POST',
    body: JSON.stringify(donation)
  });
}

// ============================================================================
// STATISTICS API
// ============================================================================

export async function getDashboardStats() {
  return request('/api/statistics/dashboard', { method: 'GET' });
}

export async function getDisasterStats() {
  return request('/api/statistics/disasters', { method: 'GET' });
}

export async function getRecentActivity() {
  return request('/api/statistics/recent-activity', { method: 'GET' });
}

// ============================================================================
// RESOURCE REQUESTS API
// ============================================================================

export async function createResourceRequestGeneral(requestData) {
  return request('/api/resource-requests/', {
    method: 'POST',
    body: JSON.stringify(requestData)
  });
}

export async function getResourceRequests() {
  return request('/api/resource-requests/', { method: 'GET' });
}

export async function updateResourceRequest(id, requestData) {
  return request(`/api/resource-requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(requestData)
  });
}

// ============================================================================
// VOLUNTEER ASSIGNMENTS API
// ============================================================================

export async function createVolunteerAssignment(assignmentData) {
  return request('/api/volunteer-assignments/', {
    method: 'POST',
    body: JSON.stringify(assignmentData)
  });
}

export async function getVolunteerAssignmentsGeneral() {
  return request('/api/volunteer-assignments/', { method: 'GET' });
}
