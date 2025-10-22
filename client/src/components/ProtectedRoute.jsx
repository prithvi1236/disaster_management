import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../services/auth.js';

// Simple protected route: if user is authenticated render children, otherwise redirect to /login
export default function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
