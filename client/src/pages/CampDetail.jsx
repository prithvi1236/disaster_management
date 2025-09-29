import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/campDetail.css';

export default function CampDetail() {
  const { id } = useParams();
  const [camp, setCamp] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const base = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    async function loadCampData() {
      setLoading(true);
      try {
        const [cRes, aRes, rRes] = await Promise.all([
          fetch(`${base}/camps/${id}`).then(r => r.json()),
          fetch(`${base}/assignments?camp_id=${id}`).then(r => r.json()),
          fetch(`${base}/requests?camp_id=${id}`).then(r => r.json())
        ]);

        setCamp(cRes);
        setAssignments(Array.isArray(aRes) ? aRes : aRes.data || []);
        setRequests(Array.isArray(rRes) ? rRes : rRes.data || []);
      } catch (err) {
        console.error('Failed to load camp data', err);
      } finally {
        setLoading(false);
      }
    }

    loadCampData();
  }, [id, base]);

  if (loading) return <div className="camp-detail container"><p>Loading...</p></div>;
  if (!camp) return <div className="camp-detail container"><p>Camp not found.</p></div>;

  return (
    <div className="camp-detail container">
      <div className="camp-header">
        <div>
          <h2>{camp.name}</h2>
          <p className="text-muted">{camp.location}</p>
        </div>
        <div>
          <p className="text-muted">Capacity: {camp.capacity}</p>
          <p className="text-muted">Occupancy: {camp.occupancy}</p>
          <p className="text-muted">Contact: {camp.contact_number}</p>
        </div>
      </div>

      <section className="section">
        <h3 className="section-title">Assigned Volunteers</h3>
        {assignments.length === 0 ? (
          <p className="text-muted">No volunteers assigned yet.</p>
        ) : (
          <div className="assign-list">
            {assignments.map(a => (
              <div key={a.assignment_id} className="card">
                <div className="flex-between">
                  <div>
                    <strong>{a.name || a.volunteer_name || 'Volunteer'}</strong>
                    <div className="text-muted">{a.role} • {a.assigned_date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <h3 className="section-title">Resource Requests</h3>
        {requests.length === 0 ? (
          <p className="text-muted">No requests submitted.</p>
        ) : (
          <div className="detail-list">
            {requests.map(r => (
              <div key={r.request_id} className="detail-card">
                <p><strong>{r.resource_type}</strong> — Qty: {r.quantity}</p>
                <p className="text-muted">Status: {r.status}</p>
                <p className="text-muted">Requested: {r.requested_date}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
