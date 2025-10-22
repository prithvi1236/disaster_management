const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

async function request(path, options = {}) {
  const url = BASE + path;
  const headers = options.headers || {};
  headers['Content-Type'] = 'application/json';

  // Include JWT token if available
  const token = localStorage.getItem('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const resp = await fetch(url, { ...options, headers });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `Request failed: ${resp.status}`);
  }
  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return resp.json();
  } else {
    return resp.text();
  }
}

// Authentication
export async function login(credentials) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
}

export async function signup(userData) {
  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

export async function getCurrentUser() {
  return request('/auth/me', { method: 'GET' });
}

// Disasters
export async function fetchDisasters() {
  return request('/disasters', { method: 'GET' });
}

export async function fetchDisaster(id) {
  return request(`/disasters/${id}`, { method: 'GET' });
}

// Camps
export async function fetchCamps(disasterId = null) {
  const url = disasterId ? `/camps?disaster_id=${disasterId}` : '/camps';
  return request(url, { method: 'GET' });
}

export async function fetchCamp(id) {
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
