import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchCamp } from '../services/api.js';
import '../styles/campDetail.css';

export default function CampDetail() {
  const { id } = useParams();
  const [camp, setCamp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCampData();
  }, [id]);

  const loadCampData = async () => {
    try {
      setLoading(true);
      const campData = await fetchCamp(id);
      setCamp(campData);
    } catch (err) {
      setError(err.message || 'Failed to load camp details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="camp-detail container">
        <p>Loading camp details...</p>
      </div>
    );
  }

  if (error || !camp) {
    return (
      <div className="camp-detail container">
        <h2>Camp Not Found</h2>
        <p className="error">{error || 'The requested camp could not be found.'}</p>
        <Link to="/disasters" className="btn btn-primary">
          ← Back to Disasters
        </Link>
      </div>
    );
  }

  const occupancyPercentage = camp.capacity ? Math.round((camp.occupancy / camp.capacity) * 100) : 0;

  return (
    <div className="camp-detail container">
      <div className="breadcrumb">
        <Link to="/disasters" className="breadcrumb-link">Disasters</Link>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{camp.name}</span>
      </div>

      <div className="camp-header">
        <div className="camp-info">
          <h1>{camp.name}</h1>
          <p className="camp-location">📍 {camp.location}</p>
          {camp.contact_info && (
            <p className="camp-contact">📞 {camp.contact_info}</p>
          )}
        </div>
        
        <div className="camp-stats">
          <div className="stat-item">
            <span className="stat-label">Capacity</span>
            <span className="stat-value">{camp.capacity}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Occupancy</span>
            <span className="stat-value">{camp.occupancy}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Availability</span>
            <span className="stat-value">{occupancyPercentage}% Full</span>
          </div>
        </div>
      </div>

      {camp.facilities && (
        <div className="camp-facilities">
          <h3>Available Facilities</h3>
          <p>{camp.facilities}</p>
        </div>
      )}

      <div className="occupancy-visual">
        <h3>Occupancy Status</h3>
        <div className="occupancy-bar-large">
          <div 
            className="occupancy-fill-large"
            style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
          />
        </div>
        <p className="occupancy-text">
          {camp.occupancy} of {camp.capacity} spaces occupied ({occupancyPercentage}%)
        </p>
      </div>

      <div className="camp-actions">
        <Link to="/volunteer-signup" className="btn btn-primary">
          Volunteer at This Camp
        </Link>
        <Link to="/donate" className="btn btn-secondary">
          Donate Resources
        </Link>
      </div>
    </div>
  );
}
