import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/api';
import '../styles/profile.css';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (err) {
      console.error('Profile error:', err);
      setError('Failed to load profile');
      
      // If authentication failed, redirect to login
      if (err.message.includes('401') || err.message.includes('authentication')) {
        localStorage.removeItem('access_token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="error">
          <p>{error}</p>
          <button onClick={loadUserProfile}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>User Profile</h1>
        
        {user && (
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="profile-info">
                <h2>{user.full_name}</h2>
                <p className="username">@{user.username}</p>
                <span className={`role-badge role-${user.role}`}>
                  {user.role}
                </span>
              </div>
            </div>

            <div className="profile-details">
              <div className="detail-row">
                <label>Username:</label>
                <span>{user.username}</span>
              </div>
              <div className="detail-row">
                <label>Email:</label>
                <span>{user.email}</span>
              </div>
              <div className="detail-row">
                <label>Full Name:</label>
                <span>{user.full_name}</span>
              </div>
              <div className="detail-row">
                <label>Role:</label>
                <span className="role-text">{user.role}</span>
              </div>
              <div className="detail-row">
                <label>Status:</label>
                <span className={`status ${user.is_active ? 'active' : 'inactive'}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="detail-row">
                <label>Member Since:</label>
                <span>{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="profile-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => navigate('/dashboard')}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}