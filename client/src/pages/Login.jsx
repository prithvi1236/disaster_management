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
    <div className="container container-sm">
      <div className="card" style={{ marginTop: 'var(--spacing-4xl)', marginBottom: 'var(--spacing-4xl)' }}>
        <div className="text-center mb-xl">
          <h2 className="mb-sm">Staff Login</h2>
          <p className="text-muted mb-0">For administrators, coordinators, and registered volunteers only</p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? (
              <>
                <span className="spinner" style={{ marginRight: 'var(--spacing-sm)' }}></span>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}
        </form>

        <div className="alert alert-info">
          <h4 className="font-semibold mb-sm">Demo Credentials:</h4>
          <div className="text-sm">
            <p className="mb-sm"><strong>Admin:</strong> username: admin, password: admin123</p>
            <p className="mb-sm"><strong>Coordinator:</strong> username: coordinator1, password: coord123</p>
            <p className="mb-0"><strong>Volunteer:</strong> username: volunteer_user, password: user123</p>
          </div>
        </div>

        <div className="alert alert-success">
          <p className="mb-sm">
            <strong>Public Users:</strong> No account needed! You can <Link to="/disasters">view disasters</Link>, 
            <Link to="/volunteer-signup"> volunteer</Link>, or <Link to="/donate"> donate</Link> without signing in.
          </p>
          <p className="mb-0 text-sm">
            Staff accounts are created by administrators. Contact your system administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  );
}
