import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../services/mockAuth';
import '../styles/login.css';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signup(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Signup failed');
    }
  };

  return (
    <div className="form-container">
      <h2>Create an Account</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Full Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit" className="btn">
          Sign Up
        </button>

        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
