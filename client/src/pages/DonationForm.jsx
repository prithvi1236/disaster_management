import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getAvailableCamps, makeDonation } from '../services/api';
import '../styles/login.css';

export default function DonationForm() {
  const [user, setUser] = useState(null);
  const [camps, setCamps] = useState([]);
  const [donationType, setDonationType] = useState('Cash');
  const [amount, setAmount] = useState('');
  const [resourceType, setResourceType] = useState('Food');
  const [quantity, setQuantity] = useState('');
  const [campId, setCampId] = useState('');
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

  const validateForm = () => {
    if (donationType === 'Cash') {
      if (!amount || Number(amount) <= 0) {
        setError('Please enter a valid donation amount');
        return false;
      }
    } else if (donationType === 'Resource') {
      if (!resourceType) {
        setError('Please select a resource type');
        return false;
      }
      if (!quantity || Number(quantity) <= 0) {
        setError('Please enter a valid quantity');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!validateForm()) {
      return;
    }

    const payload = {
      donation_type: donationType,
      amount: donationType === 'Cash' ? Number(amount) : null,
      resource_type: donationType === 'Resource' ? resourceType : null,
      quantity: donationType === 'Resource' ? Number(quantity) : null,
      camp_id: campId ? parseInt(campId) : null,
    };

    try {
      await makeDonation(payload);
      setMessage('Thank you for your donation! Your contribution will help those in need.');
      // Reset form
      setAmount('');
      setQuantity('');
      setCampId('');
      setDonationType('Cash');
      setResourceType('Food');
    } catch (err) {
      console.error('Donation error:', err);
      setError(err.message || 'Failed to submit donation. Please try again.');
    }
  };

  if (loading) {
    return <div className="form-container"><div className="loading">Loading...</div></div>;
  }

  return (
    <div className="form-container">
      <h2>Make a Donation</h2>
      
      {user && (
        <div className="user-info">
          <p><strong>Donating as:</strong> {user.full_name} ({user.email})</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label>
          Donation Type
          <select
            value={donationType}
            onChange={(e) => setDonationType(e.target.value)}
          >
            <option value="Cash">Cash Donation</option>
            <option value="Resource">Resource Donation</option>
          </select>
        </label>

        <label>
          Target Camp (Optional)
          <select
            value={campId}
            onChange={(e) => setCampId(e.target.value)}
          >
            <option value="">General Fund (All Camps)</option>
            {camps.map(camp => (
              <option key={camp.camp_id} value={camp.camp_id}>
                {camp.name} - {camp.location}
              </option>
            ))}
          </select>
        </label>

        {donationType === 'Cash' ? (
          <label>
            Amount ($)
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="0.01"
              placeholder="Enter donation amount"
              required
            />
          </label>
        ) : (
          <>
            <label>
              Resource Type
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
              >
                <option value="Food">Food</option>
                <option value="Water">Water</option>
                <option value="Medical">Medical Supplies</option>
                <option value="Clothing">Clothing</option>
                <option value="Blankets">Blankets</option>
                <option value="Equipment">Equipment</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label>
              Quantity
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                placeholder="Number of items"
                required
              />
            </label>
          </>
        )}

        {campId && (
          <div className="camp-details">
            {(() => {
              const camp = camps.find(c => c.camp_id === parseInt(campId));
              return camp ? (
                <div>
                  <h4>Donating to: {camp.name}</h4>
                  <p><strong>Location:</strong> {camp.location}</p>
                  <p><strong>Current Occupancy:</strong> {camp.current_occupancy} / {camp.capacity}</p>
                </div>
              ) : null;
            })()}
          </div>
        )}

        <button type="submit" className="btn">
          Submit Donation
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      
      <div className="info-section">
        <h3>How Your Donation Helps</h3>
        <ul>
          <li><strong>Cash donations</strong> provide flexibility to purchase needed supplies</li>
          <li><strong>Resource donations</strong> directly provide essential items to camps</li>
          <li><strong>Camp-specific donations</strong> help targeted relief efforts</li>
          <li><strong>General fund donations</strong> support overall disaster relief operations</li>
        </ul>
      </div>
    </div>
  );
}
