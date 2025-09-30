import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../styles/disasterDetail.css';

// Mock data for demo purposes
const mockData = {
  disasters: {
    1: {
      disaster_id: 1,
      name: "Hurricane Maria",
      type: "Hurricane",
      location: "Miami-Dade County, Florida",
      severity_level: "High",
      status: "Active",
      start_date: "2024-09-15",
      description: "Category 4 hurricane causing widespread flooding and power outages across South Florida. Emergency services are working around the clock to provide assistance to affected communities."
    },
    2: {
      disaster_id: 2,
      name: "Wildfire Emergency",
      type: "Wildfire",
      location: "Riverside County, California",
      severity_level: "Medium",
      status: "Monitoring",
      start_date: "2024-09-20",
      description: "Fast-moving wildfire threatening residential areas and forcing evacuations. Firefighters are working to contain the blaze with aerial support."
    }
  },
  camps: {
    1: [
      {
        camp_id: 101,
        name: "Miami Central Relief Center",
        location: "Downtown Miami Convention Center",
        capacity: 500,
        occupancy: 342,
        contact_info: "(305) 555-0123",
        facilities: "Medical care, food service, temporary housing"
      },
      {
        camp_id: 102,
        name: "Homestead Emergency Shelter",
        location: "Homestead High School",
        capacity: 300,
        occupancy: 187,
        contact_info: "(305) 555-0124",
        facilities: "Basic shelter, meals, family services"
      },
      {
        camp_id: 103,
        name: "Coral Gables Community Center",
        location: "Coral Gables Recreation Center",
        capacity: 200,
        occupancy: 156,
        contact_info: "(305) 555-0125",
        facilities: "Pet-friendly shelter, medical station"
      }
    ],
    2: [
      {
        camp_id: 201,
        name: "Riverside Evacuation Center",
        location: "Riverside Community College",
        capacity: 400,
        occupancy: 278,
        contact_info: "(951) 555-0201",
        facilities: "Emergency housing, medical care, pet shelter"
      },
      {
        camp_id: 202,
        name: "Moreno Valley Relief Station",
        location: "Moreno Valley Civic Center",
        capacity: 250,
        occupancy: 134,
        contact_info: "(951) 555-0202",
        facilities: "Temporary housing, food distribution"
      }
    ]
  },
  donations: {
    1: [
      {
        donation_id: 1001,
        donor_name: "Sarah Johnson",
        donation_type: "Monetary",
        amount: "$5,000",
        donation_date: "2024-09-16"
      },
      {
        donation_id: 1002,
        donor_name: "Miami Food Bank",
        donation_type: "Food Supplies",
        quantity: "2,000 meals",
        donation_date: "2024-09-16"
      },
      {
        donation_id: 1003,
        donor_name: "Anonymous",
        donation_type: "Medical Supplies",
        quantity: "First aid kits, medications",
        donation_date: "2024-09-17"
      },
      {
        donation_id: 1004,
        donor_name: "Local Business Coalition",
        donation_type: "Monetary",
        amount: "$15,000",
        donation_date: "2024-09-17"
      },
      {
        donation_id: 1005,
        donor_name: "Red Cross Florida",
        donation_type: "Emergency Supplies",
        quantity: "Blankets, water, hygiene kits",
        donation_date: "2024-09-18"
      },
      {
        donation_id: 1006,
        donor_name: "Maria Rodriguez",
        donation_type: "Monetary",
        amount: "$2,500",
        donation_date: "2024-09-18"
      }
    ],
    2: [
      {
        donation_id: 2001,
        donor_name: "California Fire Foundation",
        donation_type: "Monetary",
        amount: "$10,000",
        donation_date: "2024-09-21"
      },
      {
        donation_id: 2002,
        donor_name: "Riverside Community",
        donation_type: "Clothing",
        quantity: "500 clothing items",
        donation_date: "2024-09-21"
      },
      {
        donation_id: 2003,
        donor_name: "Anonymous",
        donation_type: "Monetary",
        amount: "$3,000",
        donation_date: "2024-09-22"
      },
      {
        donation_id: 2004,
        donor_name: "Local Grocery Stores",
        donation_type: "Food Supplies",
        quantity: "1,200 meals",
        donation_date: "2024-09-22"
      }
    ]
  }
};

export default function DisasterDetail() {
  const { id } = useParams();
  const [disaster, setDisaster] = useState(null);
  const [camps, setCamps] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDisasterData = () => {
      setLoading(true);
      setError('');
      
      // Simulate API loading
      setTimeout(() => {
        const disasterId = parseInt(id);
        const disasterData = mockData.disasters[disasterId];
        
        if (!disasterData) {
          setError('Disaster not found');
          setLoading(false);
          return;
        }
        
        setDisaster(disasterData);
        setCamps(mockData.camps[disasterId] || []);
        setDonations(mockData.donations[disasterId] || []);
        setLoading(false);
      }, 600);
    };

    loadDisasterData();
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
                      {donation.amount ? `$${donation.amount}` : donation.quantity}
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
