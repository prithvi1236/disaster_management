import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card.jsx";
import { fetchDisasters } from "../services/api.js";
import "../styles/disasterList.css";

export default function DisasterList() {
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDisasters = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchDisasters();
        setDisasters(data);
      } catch (err) {
        console.error("Failed to load disasters:", err);
        setError("Failed to load disasters. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadDisasters();
  }, []);

  if (loading) {
    return (
      <div className="disaster-list container">
        <div className="list-header">
          <h2>Active Disasters</h2>
          <p className="list-subtitle">Loading disasters from database...</p>
        </div>
        <div className="loading-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="loading-card">
              <div className="loading-placeholder"></div>
            </div>
          ))}
        </div>
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
          <p className="text-muted">No disasters found in the database.</p>
          <p className="text-muted">
            The system is ready to track disasters when they occur.
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
