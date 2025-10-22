import React, { useState, useEffect } from 'react';
import { postVolunteer, fetchDisasters } from '../services/api.js';
import '../styles/login.css';

export default function VolunteerSignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [skills, setSkills] = useState('');
  const [availability, setAvailability] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [disasterId, setDisasterId] = useState('');
  const [disasters, setDisasters] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDisasters();
  }, []);

  const loadDisasters = async () => {
    try {
      const data = await fetchDisasters();
      setDisasters(data.filter(d => d.status === 'Active'));
    } catch (err) {
      console.error('Failed to load disasters:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    
    try {
      const volunteerData = {
        name,
        email,
        phone,
        address,
        skills,
        availability,
        emergency_contact: emergencyContact,
        disaster_id: disasterId ? parseInt(disasterId) : null
      };
      
      await postVolunteer(volunteerData);
      setMessage('Thank you! Your volunteer application has been submitted successfully. You will be notified once an administrator reviews and approves your application.');
      
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setSkills('');
      setAvailability('');
      setEmergencyContact('');
      setDisasterId('');
    } catch (err) {
      setMessage(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container container-md">
      <div className="card" style={{ marginTop: 'var(--spacing-4xl)', marginBottom: 'var(--spacing-4xl)' }}>
        <div className="text-center mb-xl">
          <h2 className="mb-sm">Volunteer Application</h2>
          <div className="alert alert-info">
            Apply to become a volunteer - no account needed! Once approved by administrators, 
            you'll receive login credentials to access the volunteer portal.
          </div>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email address"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone *</label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="Enter your phone number"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              className="form-textarea"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your address"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Skills & Experience</label>
            <textarea
              className="form-textarea"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Describe your skills (e.g., Medical, Engineering, Cooking, etc.)"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Availability</label>
            <input
              type="text"
              className="form-input"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              placeholder="When are you available? (e.g., Weekends, Evenings, Full-time)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Emergency Contact</label>
            <input
              type="text"
              className="form-input"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="Emergency contact name and phone"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Disaster to Help With (Optional)</label>
            <select
              className="form-select"
              value={disasterId}
              onChange={(e) => setDisasterId(e.target.value)}
            >
              <option value="">Select a disaster (optional)</option>
              {disasters.map(disaster => (
                <option key={disaster.disaster_id} value={disaster.disaster_id}>
                  {disaster.name} - {disaster.location}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? (
              <>
                <span className="spinner" style={{ marginRight: 'var(--spacing-sm)' }}></span>
                Registering...
              </>
            ) : (
              'Register as Volunteer'
            )}
          </button>
        </form>

        {message && (
          <div className="alert alert-success">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
