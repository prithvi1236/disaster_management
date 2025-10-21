import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { loginUser, getCurrentUser } from '../services/api';
import { getDashboardRoute } from '../utils/auth';
import '../styles/login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for success message from signup
    if (location.state?.message) {
      setSuccess(location.state.message);
    }
  }, [location]);

  const validateForm = () => {
    if (!username.trim()) {
      setError('Username is required');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    return true;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      const response = await loginUser({ 
        username: username.trim(), 
        password 
      });
      
      // Store the JWT token
      localStorage.setItem('access_token', response.access_token);
      
      // Get user info to determine role-based redirect
      try {
        const userInfo = await getCurrentUser();
        
        // Role-based redirect
        const dashboardRoute = getDashboardRoute(userInfo.role);
        navigate(dashboardRoute);
      } catch (userErr) {
        // Fallback to dashboard if user info fetch fails
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Invalid username or password';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-container">
      <h2>Sign in to your account</h2>

      <form onSubmit={handleSubmit} className="form">
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            placeholder="Enter your username"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />
        </label>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </form>

      <div className="demo-credentials">
        <h4>Demo Credentials:</h4>
        <p><strong>Admin:</strong> username: admin, password: admin123</p>
        <p><strong>Camp Coordinator:</strong> username: coordinator1, password: coord123</p>
        <p><strong>Volunteer User:</strong> username: volunteer_user, password: user123</p>
      </div>

      <p>
        Or <Link to="/signup">create a new account</Link>
      </p>
    </div>
  );
}
