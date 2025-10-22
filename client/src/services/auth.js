import { login as apiLogin, signup as apiSignup, getCurrentUser as apiGetCurrentUser } from './api.js';

// Token management
export function getToken() {
  return localStorage.getItem('access_token');
}

export function setToken(token) {
  localStorage.setItem('access_token', token);
}

export function removeToken() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('current_user');
}

// User management
export function getCurrentUser() {
  const userStr = localStorage.getItem('current_user');
  return userStr ? JSON.parse(userStr) : null;
}

export function setCurrentUser(user) {
  localStorage.setItem('current_user', JSON.stringify(user));
}

export function isAuthenticated() {
  return !!getToken();
}

// Auth actions
export async function login(credentials) {
  try {
    const response = await apiLogin(credentials);
    setToken(response.access_token);
    
    // Fetch user details
    const user = await apiGetCurrentUser();
    setCurrentUser(user);
    
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function signup(userData) {
  try {
    const user = await apiSignup(userData);
    
    // Auto-login after signup
    const loginResult = await login({
      username: userData.username,
      password: userData.password
    });
    
    return loginResult;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function logout() {
  removeToken();
  window.location.href = '/';
}

// Initialize auth state on app load
export async function initializeAuth() {
  const token = getToken();
  if (token) {
    try {
      const user = await apiGetCurrentUser();
      setCurrentUser(user);
      return user;
    } catch (error) {
      // Token is invalid, clear it
      removeToken();
      return null;
    }
  }
  return null;
}