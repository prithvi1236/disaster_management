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
    const loadDisasterData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Load disaster details
        const disasterData = await fetchDisaster(id);
        setDisaster(disasterData);
        
        // Load related camps and donations
        const [campsData, donationsData] = await Promise.all([
          fetchCamps(id),
          fetchDonations(id)
        ]);
        
        setCamps(campsData);
        setDonations(donationsData);
        
      } catch (err) {
        console.error('Failed to load disaster data:', err);
        setError('Failed to load disaster details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadDisasterData();
    }
  }, [id]);

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

  const formatAmount = (amount) => {
    if (typeof amount === 'number') {
      return `$${amount.toLocaleString()}`;
    }
    return amount;
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
            <div className="detail-grid">
              <div className="detail-item">
                <strong>Location:</strong>
                <span>{disaster.location}</span>
              </div>
              <div className="detail-item">
                <strong>Status:</strong>
                <span className={`status status-${disaster.status?.toLowerCase()}`}>
                  {disaster.status}
                </span>
              </div>
              {disaster.start_date && (
                <div className="detail-item">
                  <strong>Started:</strong>
                  <span>{formatDate(disaster.start_date)}</span>
                </div>
              )}
              {disaster.end_date && (
                <div className="detail-item">
                  <strong>Ended:</strong>
                  <span>{formatDate(disaster.end_date)}</span>
                </div>
              )}
            </div>
            
            {disaster.description && (
              <div className="disaster-description">
                <h3>Description</h3>
                <p>{disaster.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="detail-sections">
        {/* Relief Camps Section */}
        <section className="detail-section">
          <div className="section-header">
            <h2>Relief Camps</h2>
            <span className="section-count">{camps.length} camps</span>
          </div>
          
          {camps.length === 0 ? (
            <div className="empty-state">
              <p>No relief camps have been set up for this disaster yet.</p>
            </div>
          ) : (
            <div className="camps-grid">
              {camps.map((camp) => (
                <div key={camp.camp_id} className="detail-card camp-card">
                  <div className="camp-header">
                    <h3 className="camp-name">
                      <Link to={`/camps/${camp.camp_id}`} className="camp-link">
                        {camp.name}
                      </Link>
                    </h3>
                    <div className="occupancy-badge">
                      {camp.occupancy || 0}/{camp.capacity || 0}
                    </div>
                  </div>
                  
                  <div className="camp-details">
                    <p><strong>Location:</strong> {camp.location}</p>
                    {camp.contact_info && (
                      <p><strong>Contact:</strong> {camp.contact_info}</p>
                    )}
                    {camp.facilities && (
                      <p><strong>Facilities:</strong> {camp.facilities}</p>
                    )}
                    
                    {camp.capacity && (
                      <div className="occupancy-bar">
                        <div className="occupancy-label">
                          Occupancy: {Math.round(((camp.occupancy || 0) / camp.capacity) * 100)}%
                        </div>
                        <div className="occupancy-progress">
                          <div 
                            className="occupancy-fill"
                            style={{ width: `${Math.min(((camp.occupancy || 0) / camp.capacity) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Donations Section */}
        <section className="detail-section">
          <div className="section-header">
            <h2>Recent Donations</h2>
            <span className="section-count">{donations.length} donations</span>
          </div>
          
          {donations.length === 0 ? (
            <div className="empty-state">
              <p>No donations have been recorded for this disaster yet.</p>
              <Link to="/donate" className="btn btn-primary">
                Make a Donation
              </Link>
            </div>
          ) : (
            <div className="donations-list">
              {donations.slice(0, 10).map((donation) => (
                <div key={donation.donation_id} className="detail-card donation-card">
                  <div className="donation-header">
                    <div className="donor-info">
                      <h4 className="donor-name">{donation.donor_name || 'Anonymous'}</h4>
                      <span className="donation-type">{donation.donation_type}</span>
                    </div>
                    <div className="donation-amount">
                      {donation.amount ? formatAmount(donation.amount) : donation.quantity}
                    </div>
                  </div>
                  
                  {donation.donation_date && (
                    <div className="donation-date">
                      {formatDate(donation.donation_date)}
                    </div>
                  )}
                </div>
              ))}
              
              {donations.length > 10 && (
                <div className="show-more">
                  <p>Showing 10 of {donations.length} donations</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="detail-actions">
        <Link to="/volunteer-signup" className="btn btn-primary">
          Volunteer for This Disaster
        </Link>
        <Link to="/donate" className="btn btn-secondary">
          Make a Donation
        </Link>
        <Link to="/disasters" className="btn btn-outline">
          ← Back to All Disasters
        </Link>
      </div>
    </div>
  );
}