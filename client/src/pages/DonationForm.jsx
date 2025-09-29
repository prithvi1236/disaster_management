import React, { useState } from 'react';
import { postDonation } from '../services/api';
import '../styles/login.css';

export default function DonationForm() {
  const [donorName, setDonorName] = useState('');
  const [contact, setContact] = useState('');
  const [donationType, setDonationType] = useState('Cash');
  const [amount, setAmount] = useState('');
  const [resourceType, setResourceType] = useState('Food');
  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const payload = {
      donor_name: donorName,
      donor_contact: contact,
      donation_type: donationType,
      amount: donationType === 'Cash' ? Number(amount) || 0 : null,
      resource_type: donationType === 'Resource' ? resourceType : null,
      quantity: donationType === 'Resource' ? Number(quantity) || 0 : null,
      disaster_id: null,
      camp_id: null,
    };

    try {
      await postDonation(payload);
      setMessage('Thank you for your donation!');
      setDonorName('');
      setContact('');
      setAmount('');
      setQuantity('');
    } catch (err) {
      setMessage(err.message || 'Failed to submit donation');
    }
  };

  return (
    <div className="form-container">
      <h2>Donation Form</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Donor Name
          <input
            type="text"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            required
          />
        </label>

        <label>
          Contact
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </label>

        <label>
          Donation Type
          <select
            value={donationType}
            onChange={(e) => setDonationType(e.target.value)}
          >
            <option value="Cash">Cash</option>
            <option value="Resource">Resource</option>
          </select>
        </label>

        {donationType === 'Cash' ? (
          <label>
            Amount
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
                <option>Food</option>
                <option>Water</option>
                <option>Medical Kits</option>
                <option>Blankets</option>
                <option>Fuel</option>
                <option>Other</option>
              </select>
            </label>

            <label>
              Quantity
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>
          </>
        )}

        <button type="submit" className="btn">
          Submit Donation
        </button>
      </form>

      {message && <p className="info">{message}</p>}
    </div>
  );
}
