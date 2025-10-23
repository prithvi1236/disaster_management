/**
 * API Service for Disaster Management System
 * 
 * Provides a centralized interface for all API communications with the backend.
 * Handles authentication, error handling, and response parsing automatically.
 */

// API base URL configuration with environment variable support
const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Generic HTTP request handler with authentication and error handling
 * @param {string} path - API endpoint path (without base URL)
 * @param {Object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<any>} Parsed response data
 * @throws {Error} Detailed error message for failed requests
 */
async function request(path, options = {}) {
  const url = BASE + path;
  const headers = options.headers || {};
  
  // Set default content type for JSON requests
  if (!headers['Content-Type'] && options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  // Include JWT token if available
  const token = localStorage.getItem('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add request timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const resp = await fetch(url, { 
      ...options, 
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    // Handle different types of errors
    if (!resp.ok) {
      let errorMessage;
      const contentType = resp.headers.get('content-type') || '';
      
      try {
        if (contentType.includes('application/json')) {
          const errorData = await resp.json();
          errorMessage = errorData.detail || errorData.message || `Request failed: ${resp.status}`;
        } else {
          errorMessage = await resp.text() || `Request failed: ${resp.status}`;
        }
      } catch (parseError) {
        errorMessage = `Request failed: ${resp.status} ${resp.statusText}`;
      }

      // Handle specific HTTP status codes
      if (resp.status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('current_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        throw new Error('Session expired. Please log in again.');
      } else if (resp.status === 403) {
        throw new Error('Access denied. You do not have permission to perform this action.');
      } else if (resp.status === 404) {
        throw new Error('The requested resource was not found.');
      } else if (resp.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      throw new Error(errorMessage);
    }

    // Parse response based on content type
    const contentType = resp.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await resp.json();
    } else {
      return await resp.text();
    }
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your connection and try again.');
    }
    
    // Re-throw API errors as-is, wrap network errors
    if (error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    throw error;
  }
}

/**
 * Authentication API endpoints
 */

/**
 * Authenticate user with username and password
 * @param {Object} credentials - {username: string, password: string}
 * @returns {Promise<Object>} Authentication response with access token
 */
export async function login(credentials) {
  if (!credentials?.username || !credentials?.password) {
    throw new Error('Username and password are required');
  }
  
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
}

/**
 * Register new user account (Admin only)
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Created user object
 */
export async function signup(userData) {
  if (!userData?.username || !userData?.email || !userData?.password) {
    throw new Error('Username, email, and password are required');
  }
  
  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

/**
 * Get current authenticated user information
 * @returns {Promise<Object>} Current user object
 */
export async function getCurrentUser() {
  return request('/auth/me', { method: 'GET' });
}

/**
 * Disaster Management API endpoints
 */

/**
 * Fetch all disasters with optional filtering
 * @param {Object} filters - Optional filters {skip, limit, status}
 * @returns {Promise<Array>} List of disasters
 */
export async function fetchDisasters(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.append(key, value);
    }
  });
  
  const queryString = params.toString();
  const url = queryString ? `/disasters?${queryString}` : '/disasters';
  return request(url, { method: 'GET' });
}

/**
 * Fetch specific disaster by ID
 * @param {number} id - Disaster ID
 * @returns {Promise<Object>} Disaster details
 */
export async function fetchDisaster(id) {
  if (!id || isNaN(id)) {
    throw new Error('Valid disaster ID is required');
  }
  return request(`/disasters/${id}`, { method: 'GET' });
}

/**
 * Relief Camp Management API endpoints
 */

/**
 * Fetch camps with optional disaster filtering
 * @param {number|null} disasterId - Optional disaster ID filter
 * @returns {Promise<Array>} List of camps
 */
export async function fetchCamps(disasterId = null) {
  const url = disasterId ? `/camps?disaster_id=${disasterId}` : '/camps';
  return request(url, { method: 'GET' });
}

/**
 * Fetch specific camp by ID
 * @param {number} id - Camp ID
 * @returns {Promise<Object>} Camp details
 */
export async function fetchCamp(id) {
  if (!id || isNaN(id)) {
    throw new Error('Valid camp ID is required');
  }
  return request(`/camps/${id}`, { method: 'GET' });
}

// Volunteers
export async function postVolunteer(volunteer) {
  return request('/volunteers', {
    method: 'POST',
    body: JSON.stringify(volunteer)
  });
}

export async function fetchVolunteers() {
  return request('/volunteers', { method: 'GET' });
}

// Donations
export async function postDonation(donation) {
  return request('/donations', {
    method: 'POST',
    body: JSON.stringify(donation)
  });
}

export async function fetchDonations() {
  return request('/donations', { method: 'GET' });
}

// Statistics
export async function fetchDashboardStats() {
  return request('/statistics/dashboard', { method: 'GET' });
}

export async function fetchDisasterStats() {
  return request('/statistics/disasters', { method: 'GET' });
}

export async function fetchRecentActivity() {
  return request('/statistics/recent-activity', { method: 'GET' });
}

// Resource Requests
export async function fetchResourceRequests() {
  return request('/resource-requests', { method: 'GET' });
}

export async function createResourceRequest(request) {
  return request('/resource-requests', {
    method: 'POST',
    body: JSON.stringify(request)
  });
}

// Volunteer Assignments
export async function fetchVolunteerAssignments(volunteerId) {
  return request(`/volunteers/${volunteerId}/assignments`, { method: 'GET' });
}

export async function assignVolunteerToCamp(assignment) {
  return request('/volunteers/assign', {
    method: 'POST',
    body: JSON.stringify(assignment)
  });
}

export async function fetchAvailableVolunteers() {
  return request('/volunteers/available', { method: 'GET' });
}

export async function fetchCampsWithDisasters() {
  return request('/volunteers/camps/with-disasters', { method: 'GET' });
}

// Volunteer Requests (for coordinators)
export async function createVolunteerRequest(volunteerRequest) {
  return request('/volunteer-requests', {
    method: 'POST',
    body: JSON.stringify(volunteerRequest)
  });
}

export async function fetchVolunteerRequests(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.append(key, value);
    }
  });
  
  const queryString = params.toString();
  const url = queryString ? `/volunteer-requests?${queryString}` : '/volunteer-requests';
  
  return request(url, { method: 'GET' });
}

export async function updateVolunteerRequest(requestId, updates) {
  return request(`/volunteer-requests/${requestId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

export async function deleteVolunteerRequest(requestId) {
  return request(`/volunteer-requests/${requestId}`, { method: 'DELETE' });
}

// Admin-specific APIs
export async function fetchPendingVolunteers() {
  return request('/volunteers/pending', { method: 'GET' });
}

export async function approveVolunteer(volunteerId, approval) {
  return request(`/volunteers/${volunteerId}/approve`, {
    method: 'PUT',
    body: JSON.stringify(approval)
  });
}

export async function fetchApprovedVolunteers() {
  return request('/volunteers/approved', { method: 'GET' });
}

export async function fetchPendingResourceRequests() {
  return request('/resource-requests/admin/pending', { method: 'GET' });
}

export async function updateResourceRequestStatus(requestId, statusUpdate) {
  return request(`/resource-requests/${requestId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(statusUpdate)
  });
}

export async function createDisaster(disaster) {
  return request('/disasters', {
    method: 'POST',
    body: JSON.stringify(disaster)
  });
}

export async function updateDisaster(disasterId, disaster) {
  return request(`/disasters/${disasterId}`, {
    method: 'PUT',
    body: JSON.stringify(disaster)
  });
}

// Coordinator-specific APIs
export async function getCoordinatorCamps(userId) {
  return request(`/coordinators/user/${userId}/camps`, { method: 'GET' });
}

export async function getCoordinatorRequests(userId) {
  return request(`/coordinators/user/${userId}/requests`, { method: 'GET' });
}

export async function getMyCamp() {
  return request('/coordinators/my-camp', { method: 'GET' });
}

// Admin coordinator management APIs
export async function getCoordinators() {
  return request('/coordinators', { method: 'GET' });
}

export async function createCoordinator(coordinatorData) {
  return request('/coordinators', {
    method: 'POST',
    body: JSON.stringify(coordinatorData)
  });
}

export async function updateCoordinator(coordinatorId, coordinatorData) {
  return request(`/coordinators/${coordinatorId}`, {
    method: 'PUT',
    body: JSON.stringify(coordinatorData)
  });
}

export async function deactivateCoordinator(coordinatorId) {
  return request(`/coordinators/${coordinatorId}`, { method: 'DELETE' });
}

export async function getAvailableCoordinatorUsers() {
  return request('/coordinators/users/available', { method: 'GET' });
}

export async function getAllCoordinatorUsers() {
  return request('/coordinators/users/all', { method: 'GET' });
}
