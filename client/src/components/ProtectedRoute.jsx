import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../services/api';
import { hasRole, isAuthenticated, clearAuth } from '../utils/auth';

// Protected route using Person 3's JWT authentication with role-based access
export default function ProtectedRoute({ children, requiredRole = null }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        setLoading(false);
        return;
      }
      
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error('Auth check failed:', err);
        setError(true);
        clearAuth(); // Clear invalid token
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
  
  if (!isAuthenticated() || error || !user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check role-based access
  if (requiredRole && !hasRole(user.role, requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}
