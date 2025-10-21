import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getRoleDisplayName } from '../utils/auth';

export default function UnauthorizedAccess({ 
  userRole, 
  requiredRole, 
  message = null 
}) {
  const navigate = useNavigate();

  const getDefaultMessage = () => {
    if (Array.isArray(requiredRole)) {
      const roleNames = requiredRole.map(role => getRoleDisplayName(role)).join(' or ');
      return `Access denied. This page requires ${roleNames} privileges.`;
    } else {
      return `Access denied. This page requires ${getRoleDisplayName(requiredRole)} privileges.`;
    }
  };

  const displayMessage = message || getDefaultMessage();

  return (
    <div className="unauthorized-access">
      <div className="unauthorized-content">
        <h2>Access Denied</h2>
        <p>{displayMessage}</p>
        <p>Your current role: {getRoleDisplayName(userRole)}</p>
        
        <div className="unauthorized-actions">
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .unauthorized-access {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          padding: 2rem;
        }
        
        .unauthorized-content {
          text-align: center;
          max-width: 500px;
          padding: 2rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          background-color: #f9f9f9;
        }
        
        .unauthorized-content h2 {
          color: #d32f2f;
          margin-bottom: 1rem;
        }
        
        .unauthorized-content p {
          margin-bottom: 1rem;
          color: #666;
        }
        
        .unauthorized-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
        }
        
        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          text-decoration: none;
          font-size: 1rem;
        }
        
        .btn-primary {
          background-color: #1976d2;
          color: white;
        }
        
        .btn-primary:hover {
          background-color: #1565c0;
        }
        
        .btn-secondary {
          background-color: #757575;
          color: white;
        }
        
        .btn-secondary:hover {
          background-color: #616161;
        }
      `}</style>
    </div>
  );
}