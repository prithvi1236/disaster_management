import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/api';
import { hasRole, clearAuth } from '../utils/auth';
import UnauthorizedAccess from './UnauthorizedAccess';

/**
 * Higher-order component for role-based authorization
 * @param {React.Component} WrappedComponent - Component to wrap
 * @param {string|string[]} requiredRole - Required role(s)
 * @param {string} unauthorizedMessage - Custom message for unauthorized access
 */
export default function withRoleAuth(WrappedComponent, requiredRole, unauthorizedMessage = null) {
  return function AuthorizedComponent(props) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
        } catch (err) {
          console.error('Auth check failed:', err);
          setError(true);
          if (err.message.includes('401') || err.message.includes('authentication')) {
            clearAuth();
            window.location.href = '/login';
          }
        } finally {
          setLoading(false);
        }
      };

      checkAuth();
    }, []);

    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          fontSize: '1.1rem',
          color: '#666'
        }}>
          Loading...
        </div>
      );
    }

    if (error || !user) {
      return (
        <UnauthorizedAccess 
          userRole={null}
          requiredRole={requiredRole}
          message="Authentication required. Please log in."
        />
      );
    }

    // Check if user has required role
    if (requiredRole && !hasRole(user.role, requiredRole)) {
      return (
        <UnauthorizedAccess 
          userRole={user.role}
          requiredRole={requiredRole}
          message={unauthorizedMessage}
        />
      );
    }

    // User is authorized, render the wrapped component
    return <WrappedComponent {...props} user={user} />;
  };
}