import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getAvailableCamps, applyToVolunteer } from '../services/api';
import '../styles/login.css';

export default function VolunteerSignup() {
  const [user, setUser] = useState(null);
  const [camps, setCamps] = useState([]);
  const [selectedCamp, setSelectedCamp] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const [userData, campsData] = await Promise.all([
        getCurrentUser(),
        getAvailableCamps()
      ]);

      setUser(userData);
      setCamps(campsData);
    } catch (err) {
      setError('Failed to load data: ' + err.message);
      if (err.message.includes('401') || err.message.includes('403')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    if (!selectedCamp) {
      setError('Please select a camp to volunteer at.');
      return;
    }

    try {
      await applyToVolunteer(parseInt(selectedCamp));
      setMessage('Thank you! Your volunteer application has been submitted and is pending coordinator approval.');
      setSelectedCamp('');
    } catch (err) {
      setError(err.message || 'Application failed');
    }
  };

  if (loading) {
    return <div className="form-container"><div className="loading">Loading...</div></div>;
  }

  return (
    <div className="form-container">
      <h2>Apply to Volunteer</h2>
      
      {user && (
        <div className="user-info">
          <p><strong>Applying as:</strong> {user.full_name} ({user.email})</p>
          {user.skills && user.skills.length > 0 && (
            <p><strong>Your Skills:</strong> {user.skills.join(', ')}</p>
          )}
        </div>
      )}

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Select Camp to Volunteer At
          <select
            value={selectedCamp}
            onChange={(e) => setSelectedCamp(e.target.value)}
            required
          >
            <option value="">Choose a camp...</option>
            {camps.map(camp => (
              <option key={camp.camp_id} value={camp.camp_id}>
                {camp.name} - {camp.location} ({camp.current_occupancy}/{camp.capacity} capacity)
              </option>
            ))}
          </select>
        </label>

        {selectedCamp && (
          <div className="camp-details">
            {(() => {
              const camp = camps.find(c => c.camp_id === parseInt(selectedCamp));
              return camp ? (
                <div>
                  <h4>Camp Details:</h4>
                  <p><strong>Name:</strong> {camp.name}</p>
                  <p><strong>Location:</strong> {camp.location}</p>
                  <p><strong>Current Occupancy:</strong> {camp.current_occupancy} / {camp.capacity}</p>
                  <p><strong>Status:</strong> {camp.status}</p>
                  {camp.facilities && <p><strong>Facilities:</strong> {camp.facilities}</p>}
                </div>
              ) : null;
            })()}
          </div>
        )}

        <button type="submit" className="btn" disabled={!selectedCamp}>
          Submit Application
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      
      <div className="info-section">
        <h3>What happens next?</h3>
        <ol>
          <li>Your application will be sent to the camp coordinator</li>
          <li>The coordinator will review your application and skills</li>
          <li>You'll receive a notification about the approval status</li>
          <li>If approved, you'll be assigned specific tasks and schedules</li>
        </ol>
      </div>
    </div>
  );
}
