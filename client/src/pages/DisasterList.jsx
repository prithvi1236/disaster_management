import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card.jsx";
import "../styles/disasterList.css";

// Mock data for demo purposes
const mockDisasters = [
  {
    disaster_id: 1,
    name: "Hurricane Maria",
    type: "Hurricane",
    location: "Miami-Dade County, Florida",
    severity_level: "High",
    status: "Active",
    start_date: "2024-09-15",
    description:
      "Category 4 hurricane causing widespread flooding and power outages across South Florida.",
  },
  {
    disaster_id: 2,
    name: "Wildfire Emergency",
    type: "Wildfire",
    location: "Riverside County, California",
    severity_level: "Medium",
    status: "Monitoring",
    start_date: "2024-09-20",
    description:
      "Fast-moving wildfire threatening residential areas and forcing evacuations.",
  },
];

export default function DisasterList() {
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Simulate API loading for demo
    const loadDisasters = () => {
      setLoading(true);
      setTimeout(() => {
        setDisasters(mockDisasters);
        setLoading(false);
      }, 800);
    };

    loadDisasters();
  }, []);

  if (loading) {
    return (
      <div className="disaster-list container">
        <h2>Active Disasters</h2>
        <p className="text-muted">Loading disasters...</p>
      </div>
    );
  }

  return (
    <div className="disaster-list container">
      <div className="list-header">
        <h2>Active Disasters</h2>
        <p className="list-subtitle">
          Click on any disaster to view details, relief camps, and donations
        </p>
      </div>

      {error && <p className="error">{error}</p>}

      {disasters.length === 0 && !error && (
        <div className="empty-state">
          <p className="text-muted">No disasters found.</p>
          <p className="text-muted">
            Check back later or contact support if this seems incorrect.
          </p>
        </div>
      )}

      <div className="list-grid">
        {disasters.map((disaster) => (
          <Link
            key={disaster.disaster_id}
            to={`/disasters/${disaster.disaster_id}`}
            className="disaster-link"
          >
            <Card title={disaster.name} elevated interactive>
              <div className="disaster-info">
                <p>
                  <strong>Type:</strong> {disaster.type}
                </p>
                <p>
                  <strong>Location:</strong> {disaster.location}
                </p>
                <p>
                  <strong>Severity:</strong> {disaster.severity_level}
                </p>
                {disaster.start_date && (
                  <p>
                    <strong>Started:</strong>{" "}
                    {new Date(disaster.start_date).toLocaleDateString()}
                  </p>
                )}
                {disaster.status && (
                  <p
                    className={`status status-${disaster.status.toLowerCase()}`}
                  >
                    <strong>Status:</strong> {disaster.status}
                  </p>
                )}
              </div>
              <div className="card-actions">
                <span className="view-details">View Details →</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
