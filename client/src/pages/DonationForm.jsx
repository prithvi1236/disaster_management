import React, { useState, useEffect } from 'react';
import { postDonation, fetchDisasters } from '../services/api.js';
import '../styles/donationForm.css';

export default function DonationForm() {
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donationType, setDonationType] = useState('Monetary');
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState('');
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

    const payload = {
      donor_name: donorName,
      donor_email: donorEmail,
      donor_phone: donorPhone,
      donation_type: donationType,
      amount: donationType === 'Monetary' ? parseFloat(amount) || 0 : null,
      quantity: donationType !== 'Monetary' ? quantity : null,
      disaster_id: disasterId ? parseInt(disasterId) : disasters[0]?.disaster_id || null,
    };

    try {
      await postDonation(payload);
      setMessage('Thank you for your generous donation! Your contribution will help those in need.');
      
      // Reset form
      setDonorName('');
      setDonorEmail('');
      setDonorPhone('');
      setAmount('');
      setQuantity('');
      setDisasterId('');
    } catch (err) {
      setMessage(err.message || 'Failed to submit donation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container container-md">
      <div className="card" style={{ marginTop: 'var(--spacing-4xl)', marginBottom: 'var(--spacing-4xl)' }}>
        <div className="text-center mb-xl">
          <h2 className="mb-sm">Make a Donation</h2>
          <p className="text-muted mb-0">Support disaster relief efforts with your generous contribution</p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label className="form-label">Your Name *</label>
            <input
              type="text"
              className="form-input"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              placeholder="Enter your email address"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-input"
              value={donorPhone}
              onChange={(e) => setDonorPhone(e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Disaster to Support *</label>
            <select
              className="form-select"
              value={disasterId}
              onChange={(e) => setDisasterId(e.target.value)}
              required
            >
              <option value="">Select a disaster to support</option>
              {disasters.map(disaster => (
                <option key={disaster.disaster_id} value={disaster.disaster_id}>
                  {disaster.name} - {disaster.location}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Donation Type *</label>
            <select
              className="form-select"
              value={donationType}
              onChange={(e) => setDonationType(e.target.value)}
              required
            >
              <option value="Monetary">Monetary Donation</option>
              <option value="Food Supplies">Food Supplies</option>
              <option value="Medical Supplies">Medical Supplies</option>
              <option value="Clothing">Clothing & Blankets</option>
              <option value="Water & Sanitation">Water & Sanitation</option>
              <option value="Shelter Materials">Shelter Materials</option>
              <option value="Other">Other Supplies</option>
            </select>
          </div>

          {donationType === 'Monetary' ? (
            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input
                type="number"
                className="form-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1"
                placeholder="Enter donation amount in rupees"
              />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Quantity/Description *</label>
              <textarea
                className="form-textarea"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                placeholder="Describe what you're donating (e.g., '100 kg rice', '50 blankets', '200 water bottles')"
                rows="3"
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? (
              <>
                <span className="spinner" style={{ marginRight: 'var(--spacing-sm)' }}></span>
                Submitting...
              </>
            ) : (
              'Submit Donation'
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
