import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';
import { normalizeRole } from '../utils/auth';
import '../styles/login.css';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('VOLUNTEER');
  const [skills, setSkills] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    if (!username.trim()) {
      setError('Username is required');
      return false;
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }
    if (!fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const userData = {
        username: username.trim(),
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role
      };
      
      // Add skills for volunteers
      if (normalizeRole(role) === 'volunteer' && skills.trim()) {
        userData.skills = skills.split(',').map(skill => skill.trim()).filter(skill => skill);
      }
      
      await registerUser(userData);
      
      // Registration successful, redirect to login
      navigate('/login', { 
        state: { message: 'Account created successfully! Please wait for admin approval before logging in.' }
      });
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Create an Account</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Choose a username"
          />
        </label>

        <label>
          Full Name
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Enter your full name"
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Choose a password"
            minLength="6"
          />
        </label>

        <label>
          Role
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="VOLUNTEER">Volunteer</option>
            <option value="DONOR">Donor</option>
            <option value="COORDINATOR">Camp Coordinator</option>
          </select>
        </label>

        {normalizeRole(role) === 'volunteer' && (
          <label>
            Skills (optional)
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g., Medical Aid, Food Distribution, Translation"
            />
            <small>Separate multiple skills with commas</small>
          </label>
        )}

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>

        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
