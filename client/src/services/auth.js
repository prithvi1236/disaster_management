/**
 * Authentication service for the Disaster Management System
 * 
 * Handles user authentication, token management, and session persistence.
 * Provides a clean interface for login, logout, and user state management.
 */

import { login as apiLogin, signup as apiSignup, getCurrentUser as apiGetCurrentUser } from './api.js';

/**
 * Token management functions
 * Handles secure storage and retrieval of JWT tokens
 */

/**
 * Get the current authentication token from localStorage
 * @returns {string|null} JWT token or null if not found
 */
export function getToken() {
  return localStorage.getItem('access_token');
}

/**
 * Store authentication token in localStorage
 * @param {string} token - JWT token to store
 */
export function setToken(token) {
  if (!token) {
    throw new Error('Token cannot be empty');
  }
  localStorage.setItem('access_token', token);
}

/**
 * Remove authentication token and user data from localStorage
 * Clears all authentication-related data
 */
export function removeToken() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('current_user');
}

/**
 * User management functions
 * Handle user data persistence and authentication state
 */

/**
 * Get current user data from localStorage
 * @returns {Object|null} User object or null if not found
 */
export function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('current_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    // Clear corrupted data
    localStorage.removeItem('current_user');
    return null;
  }
}

/**
 * Store current user data in localStorage
 * @param {Object} user - User object to store
 */
export function setCurrentUser(user) {
  if (!user) {
    throw new Error('User data cannot be empty');
  }
  try {
    localStorage.setItem('current_user', JSON.stringify(user));
  } catch (error) {
    console.error('Error storing user data:', error);
    throw new Error('Failed to store user data');
  }
}

/**
 * Check if user is currently authenticated
 * @returns {boolean} True if user has valid token
 */
export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;
  
  // Basic token validation (check if it's not expired)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (error) {
    // Invalid token format
    removeToken();
    return false;
  }
}

/**
 * Authentication actions
 * Handle login, logout, and session management
 */

/**
 * Authenticate user with credentials
 * @param {Object} credentials - Login credentials {username, password}
 * @returns {Promise<Object>} Result object with success status and user data or error
 */
export async function login(credentials) {
  if (!credentials?.username || !credentials?.password) {
    return { success: false, error: 'Username and password are required' };
  }

  try {
    const response = await apiLogin(credentials);
    
    if (!response?.access_token) {
      throw new Error('Invalid response from server');
    }
    
    setToken(response.access_token);
    
    // Fetch user details
    const user = await apiGetCurrentUser();
    setCurrentUser(user);
    
    return { success: true, user };
  } catch (error) {
    // Clean up any partial state
    removeToken();
    return { 
      success: false, 
      error: error.message || 'Login failed. Please try again.' 
    };
  }
}

/**
 * Register new user account
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Result object with success status and user data or error
 */
export async function signup(userData) {
  if (!userData?.username || !userData?.password || !userData?.email) {
    return { success: false, error: 'Username, password, and email are required' };
  }

  try {
    await apiSignup(userData);
    
    // Auto-login after successful signup
    const loginResult = await login({
      username: userData.username,
      password: userData.password
    });
    
    return loginResult;
  } catch (error) {
    return { 
      success: false, 
      error: error.message || 'Registration failed. Please try again.' 
    };
  }
}

/**
 * Log out current user and redirect to home page
 * Clears all authentication data and redirects user
 */
export function logout() {
  try {
    removeToken();
    // Use replace to prevent back button issues
    window.location.replace('/');
  } catch (error) {
    console.error('Error during logout:', error);
    // Force redirect even if cleanup fails
    window.location.replace('/');
  }
}

/**
 * Initialize authentication state on application load
 * Validates existing tokens and restores user session
 * @returns {Promise<Object|null>} User object if session is valid, null otherwise
 */
export async function initializeAuth() {
  const token = getToken();
  if (!token) {
    return null;
  }

  // Check if token is expired before making API call
  if (!isAuthenticated()) {
    removeToken();
    return null;
  }

  try {
    const user = await apiGetCurrentUser();
    setCurrentUser(user);
    return user;
  } catch (error) {
    console.warn('Session validation failed:', error.message);
    // Token is invalid or expired, clear it
    removeToken();
    return null;
  }
}