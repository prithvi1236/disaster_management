import { useState } from 'react';
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

    // Basic client-side validation
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    try {
      const result = await login({ username: username.trim(), password });
      if (result.success) {
        // Redirect based on user role with proper navigation
        const redirectPath = result.user.role === 'user' ? '/volunteer-portal' : '/dashboard';
        navigate(redirectPath, { replace: true });
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      // Handle different types of errors
      const errorMessage = err.message.includes('Network') 
        ? 'Unable to connect to server. Please check your internet connection.'
        : err.message || 'Login failed. Please try again.';
      setError(errorMessage);
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
            <p className="mb-sm"><strong>Volunteer:</strong> username: dr_arjun, password: volunteer123</p>
            <p className="mb-0"><strong>Volunteer:</strong> username: nurse_rekha, password: volunteer123</p>
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
