import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/auth.js';
import '../styles/login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login({ username, password });
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message || 'Login failed');
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
      </form>

      <div className="demo-credentials">
        <h4>Demo Credentials:</h4>
        <p><strong>Admin:</strong> username: admin, password: admin123</p>
        <p><strong>Coordinator:</strong> username: coordinator1, password: coord123</p>
        <p><strong>User:</strong> username: volunteer_user, password: user123</p>
      </div>

      <p>
        Or <Link to="/signup">create a new account</Link>
      </p>
    </div>
  );
}
