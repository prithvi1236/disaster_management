/**
 * Authentication and role utilities
 */

/**
 * Normalize role string to lowercase for consistent comparison
 * @param {string} role - User role
 * @returns {string} - Normalized role
 */
export function normalizeRole(role) {
  return role?.toLowerCase() || '';
}

/**
 * Check if user has required role
 * @param {string} userRole - User's role
 * @param {string|string[]} requiredRole - Required role(s)
 * @returns {boolean} - Whether user has required role
 */
export function hasRole(userRole, requiredRole) {
  const normalizedUserRole = normalizeRole(userRole);
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.some(role => normalizeRole(role) === normalizedUserRole);
  }
  
  return normalizeRole(requiredRole) === normalizedUserRole;
}

/**
 * Get appropriate dashboard route for user role
 * @param {string} userRole - User's role
 * @returns {string} - Dashboard route
 */
export function getDashboardRoute(userRole) {
  const normalizedRole = normalizeRole(userRole);
  
  switch (normalizedRole) {
    case 'admin':
      return '/admin';
    case 'coordinator':
      return '/coordinator';
    default:
      return '/dashboard';
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean} - Whether user has valid token
 */
export function isAuthenticated() {
  const token = localStorage.getItem('access_token');
  return !!token;
}

/**
 * Clear authentication data
 */
export function clearAuth() {
  localStorage.removeItem('access_token');
}

/**
 * Role display names
 */
export const ROLE_DISPLAY_NAMES = {
  admin: 'Administrator',
  coordinator: 'Camp Coordinator',
  volunteer: 'Volunteer',
  donor: 'Donor'
};

/**
 * Get display name for role
 * @param {string} role - User role
 * @returns {string} - Display name
 */
export function getRoleDisplayName(role) {
  const normalizedRole = normalizeRole(role);
  return ROLE_DISPLAY_NAMES[normalizedRole] || role;
}