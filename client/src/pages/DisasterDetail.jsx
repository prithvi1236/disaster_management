import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchDisaster, fetchCamps, fetchDonations } from '../services/api.js';
import '../styles/disasterDetail.css';



export default function DisasterDetail() {
  const { id } = useParams();
  const [disaster, setDisaster] = useState(null);
  const [camps, setCamps] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDisasterData();
  }, [id]);

  const loadDisasterData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const disasterId = parseInt(id);
      
      // Load disaster details
      const disasterData = await fetchDisaster(disasterId);
      setDisaster(disasterData);
      
      // Load camps for this disaster
      const campsData = await fetchCamps(disasterId);
      setCamps(campsData);
      
      // Load donations for this disaster
      try {
        const donationsData = await fetchDonations();
        const disasterDonations = donationsData.filter(d => d.disaster_id === disasterId);
        setDonations(disasterDonations);
      } catch (err) {
        // Donations might not be available, continue without them
        console.warn('Could not load donations:', err);
        setDonations([]);
      }
      
    } catch (err) {
      setError(err.message || 'Failed to load disaster details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="disaster-detail container">
        <div className="loading-state">
          <p>Loading disaster details...</p>
        </div>
      </div>
    );
  }

  if (error || !disaster) {
    return (
      <div className="disaster-detail container">
        <div className="error-state">
          <h2>Disaster Not Found</h2>
          <p className="error">{error || 'The requested disaster could not be found.'}</p>
          <Link to="/disasters" className="btn btn-primary">
            ← Back to Disasters
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSeverityClass = (level) => {
    const levelLower = level?.toLowerCase();
    if (levelLower === 'high' || levelLower === 'critical') return 'severity-high';
    if (levelLower === 'medium' || levelLower === 'moderate') return 'severity-medium';
    return 'severity-low';
  };

  return (
    <div className="disaster-detail container">
      <div className="breadcrumb">
        <Link to="/disasters" className="breadcrumb-link">Disasters</Link>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{disaster.name}</span>
      </div>

      <div className="detail-hero">
        <div className="detail-card hero-card">
          <div className="disaster-header">
            <h1 className="disaster-title">{disaster.name}</h1>
            <div className="disaster-badges">
              <span className="disaster-type">{disaster.type}</span>
              <span className={`severity-badge ${getSeverityClass(disaster.severity_level)}`}>
                {disaster.severity_level}
              </span>
            </div>
          </div>
          
          <div className="disaster-details">
            <div className="detail-item">
              <strong>Location:</strong> {disaster.location}
            </div>
            {disaster.start_date && (
              <div className="detail-item">
                <strong>Started:</strong> {formatDate(disaster.start_date)}
              </div>
            )}
            {disaster.end_date && (
              <div className="detail-item">
                <strong>Ended:</strong> {formatDate(disaster.end_date)}
              </div>
            )}
            {disaster.status && (
              <div className="detail-item">
                <strong>Status:</strong> 
                <span className={`status status-${disaster.status.toLowerCase()}`}>
                  {disaster.status}
                </span>
              </div>
            )}
            {disaster.description && (
              <div className="detail-item description">
                <strong>Description:</strong>
                <p>{disaster.description}</p>
              </div>
            )}
          </div>

          <div className="action-buttons">
            <Link to={`/donate?disaster_id=${id}`} className="btn btn-primary">
              Make Donation
            </Link>
            <Link to={`/volunteer?disaster_id=${id}`} className="btn btn-secondary">
              Volunteer
            </Link>
          </div>
        </div>
      </div>

      <div className="detail-sections">
        <section className="section camps">
          <div className="section-header">
            <h3 className="section-title">Relief Camps ({camps.length})</h3>
          </div>
          {camps.length === 0 ? (
            <div className="empty-section">
              <p className="text-muted">No relief camps have been established for this disaster yet.</p>
            </div>
          ) : (
            <div className="detail-list">
              {camps.map(camp => (
                <div key={camp.camp_id} className="detail-card camp-card">
                  <div className="card-header">
                    <h4 className="camp-name">{camp.name}</h4>
                    <div className="occupancy-indicator">
                      <span className="occupancy-text">
                        {camp.occupancy || 0} / {camp.capacity || 'N/A'}
                      </span>
                      {camp.capacity && (
                        <div className="occupancy-bar">
                          <div 
                            className="occupancy-fill"
                            style={{ 
                              width: `${Math.min((camp.occupancy || 0) / camp.capacity * 100, 100)}%` 
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="camp-details">
                    <p className="camp-location">📍 {camp.location}</p>
                    {camp.contact_info && (
                      <p className="camp-contact">📞 {camp.contact_info}</p>
                    )}
                    {camp.facilities && (
                      <p className="camp-facilities">🏥 {camp.facilities}</p>
                    )}
                  </div>
                  <div className="card-actions">
                    <Link to={`/camps/${camp.camp_id}`} className="btn btn-secondary">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="section donations">
          <div className="section-header">
            <h3 className="section-title">Recent Donations ({donations.length})</h3>
            <Link to={`/donate?disaster_id=${id}`} className="btn btn-primary btn-small">
              Donate Now
            </Link>
          </div>
          {donations.length === 0 ? (
            <div className="empty-section">
              <p className="text-muted">No donations have been recorded for this disaster yet.</p>
              <p className="text-muted">Be the first to help by making a donation.</p>
            </div>
          ) : (
            <div className="detail-list">
              {donations.slice(0, 12).map(donation => (
                <div key={donation.donation_id} className="detail-card donation-card">
                  <div className="donation-header">
                    <strong className="donor-name">
                      {donation.donor_name || 'Anonymous Donor'}
                    </strong>
                    <span className="donation-date">
                      {formatDate(donation.donation_date)}
                    </span>
                  </div>
                  <div className="donation-details">
                    <p className="donation-type">{donation.donation_type}</p>
                    <p className="donation-amount">
                      {donation.amount ? `₹${donation.amount.toLocaleString()}` : donation.quantity}
                    </p>
                  </div>
                </div>
              ))}
              {donations.length > 12 && (
                <div className="show-more">
                  <p className="text-muted">And {donations.length - 12} more donations...</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
