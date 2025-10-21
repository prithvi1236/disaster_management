import { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/api';
import { hasRole, isAuthenticated, clearAuth } from '../utils/auth';

/**
 * Custom hook for authentication and authorization
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        const userData = await getCurrentUser();
        setUser(userData);
        setError(null);
      } catch (err) {
        console.error('Auth check failed:', err);
        setError(err.message);
        if (err.message.includes('401') || err.message.includes('authentication')) {
          clearAuth();
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const checkRole = (requiredRole) => {
    return user && hasRole(user.role, requiredRole);
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    checkRole,
    logout
  };
}

/**
 * Hook for role-based authorization
 * @param {string|string[]} requiredRole - Required role(s)
 */
export function useRoleAuth(requiredRole) {
  const { user, loading, error, isAuthenticated } = useAuth();
  
  const hasRequiredRole = user && hasRole(user.role, requiredRole);
  const isAuthorized = isAuthenticated && hasRequiredRole;

  return {
    user,
    loading,
    error,
    isAuthenticated,
    hasRequiredRole,
    isAuthorized
  };
}