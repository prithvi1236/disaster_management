import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../styles/disasterDetail.css';

export default function DisasterDetail() {
  const { id } = useParams();
  const [disaster, setDisaster] = useState(null);
  const [camps, setCamps] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const base = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    async function loadDisasterData() {
      setLoading(true);
      try {
        const [dRes, cRes, donRes] = await Promise.all([
          fetch(`${base}/disasters/${id}`).then(r => r.json()),
          fetch(`${base}/camps?disaster_id=${id}`).then(r => r.json()),
          fetch(`${base}/donations?disaster_id=${id}`).then(r => r.json())
        ]);

        setDisaster(dRes);
        setCamps(Array.isArray(cRes) ? cRes : cRes.data || []);
        setDonations(Array.isArray(donRes) ? donRes : donRes.data || []);
      } catch (err) {
        console.error('Failed to load disaster detail', err);
      } finally {
        setLoading(false);
      }
    }

    loadDisasterData();
  }, [id, base]);

  if (loading) return <div className="disaster-detail container"><p>Loading...</p></div>;
  if (!disaster) return <div className="disaster-detail container"><p>Disaster not found.</p></div>;

  return (
    <div className="disaster-detail container">

      <div className="detail-hero">
        <div className="detail-card">
          <h2 className="disaster-title">{disaster.name}</h2>
          <p className="disaster-meta">{disaster.type} • {disaster.location}</p>
          <p className="disaster-meta">Severity: {disaster.severity_level}</p>
          {disaster.start_date && <p className="disaster-meta">Start: {disaster.start_date}</p>}
          {disaster.end_date && <p className="disaster-meta">End: {disaster.end_date}</p>}
        </div>
      </div>

      <section className="section camps">
        <h3 className="section-title">Relief Camps</h3>
        {camps.length === 0 ? (
          <p className="text-muted">No camps found for this disaster.</p>
        ) : (
          <div className="detail-list">
            {camps.map(c => (
              <div key={c.camp_id} className="detail-card">
                <h4>{c.name}</h4>
                <p className="text-muted">{c.location}</p>
                <p className="text-muted">Occupancy: {c.occupancy} / {c.capacity}</p>
                <Link to={`/camps/${c.camp_id}`} className="btn btn-secondary">
                  View Camp
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section donations">
        <h3 className="section-title">Donations</h3>
        {donations.length === 0 ? (
          <p className="text-muted">No donations recorded.</p>
        ) : (
          <div className="detail-list">
            {donations.map(d => (
              <div key={d.donation_id} className="detail-card">
                <p><strong>{d.donor_name || 'Anonymous'}</strong></p>
                <p className="text-muted">{d.donation_type} — {d.amount ?? d.quantity}</p>
                <p className="text-muted">{d.donation_date}</p>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
