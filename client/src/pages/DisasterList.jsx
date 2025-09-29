import React, { useEffect, useState } from 'react';
import Card from '../components/Card.jsx';
import { fetchDisasters } from '../services/api';
import '../styles/disasterList.css';

export default function DisasterList() {
  const [disasters, setDisasters] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDisasters() {
      try {
        const data = await fetchDisasters();
        setDisasters(data || []);
      } catch (err) {
        setError(err.message || 'Failed to load disasters');
      }
    }

    loadDisasters();
  }, []);

  return (
    <div className="disaster-list container">
      <h2>Active Disasters</h2>

      {error && <p className="error">{error}</p>}
      {disasters.length === 0 && !error && (
        <p className="text-muted">No disasters found (or backend not available).</p>
      )}

      <div className="list-grid">
        {disasters.map(d => (
          <Card key={d.disaster_id} title={d.name} elevated interactive>
            <p>Type: {d.type}</p>
            <p>Location: {d.location}</p>
            <p>Severity: {d.severity_level}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
