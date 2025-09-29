import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../services/mockAuth.js'; // if you use real auth, swap import

// Simple protected route: if user exists render children, otherwise redirect to /login
export default function ProtectedRoute({ children }) {
  const user = getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
