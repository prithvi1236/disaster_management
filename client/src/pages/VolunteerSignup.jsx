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
    <div className="form-container">
      <h2>Volunteer Signup</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Full Name *
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Enter your full name"
          />
        </label>

        <label>
          Email *
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email address"
          />
        </label>

        <label>
          Phone *
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="Enter your phone number"
          />
        </label>

        <label>
          Address
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your address"
            rows="3"
          />
        </label>

        <label>
          Skills & Experience
          <textarea
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="Describe your skills (e.g., Medical, Engineering, Cooking, etc.)"
            rows="3"
          />
        </label>

        <label>
          Availability
          <input
            type="text"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="When are you available? (e.g., Weekends, Evenings, Full-time)"
          />
        </label>

        <label>
          Emergency Contact
          <input
            type="text"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            placeholder="Emergency contact name and phone"
          />
        </label>

        <label>
          Disaster to Help With (Optional)
          <select
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
        </label>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Registering...' : 'Register as Volunteer'}
        </button>
      </form>

      {message && <p className="info">{message}</p>}
    </div>
  );
}
