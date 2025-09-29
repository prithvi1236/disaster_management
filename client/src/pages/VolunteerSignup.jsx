import React, { useState } from 'react';
import { postVolunteer } from '../services/api';
import '../styles/login.css';

export default function VolunteerSignup() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [skillset, setSkillset] = useState('Other');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await postVolunteer({ name, phone, skillset });
      setMessage('Thank you! Your volunteer profile has been created.');
      setName('');
      setPhone('');
      setSkillset('Other');
    } catch (err) {
      setMessage(err.message || 'Submission failed');
    }
  };

  return (
    <div className="form-container">
      <h2>Volunteer Signup</h2>
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
          Phone
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </label>

        <label>
          Skillset
          <select
            value={skillset}
            onChange={(e) => setSkillset(e.target.value)}
          >
            <option>Medical</option>
            <option>Logistics</option>
            <option>Food Supply</option>
            <option>Search & Rescue</option>
            <option>Other</option>
          </select>
        </label>

        <button type="submit" className="btn">
          Sign Up
        </button>
      </form>

      {message && <p className="info">{message}</p>}
    </div>
  );
}
