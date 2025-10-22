import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../services/auth.js';
import { getCoordinatorCamps } from '../services/api.js';
import '../styles/globals.css';

export default function CoordinatorCamps() {
  const [user, setUser] = useState(null);
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    console.log('Current user:', currentUser);
    if (!currentUser || currentUser.role !== 'camp_coordinator') {
      console.log('User not authorized or not found, redirecting to dashboard');
      window.location.href = '/dashboard';
      return;
    }
    setUser(currentUser);
    loadCamps(currentUser.user_id);
  }, []);

  const loadCamps = async (userId) => {
    try {
      setLoading(true);
      console.log('Loading camps for user ID:', userId);
      const data = await getCoordinatorCamps(userId);
      console.log('API response:', data);
      // Extract camp data from coordinator assignments
      const campsData = data.map(item => ({
        ...item.camp,
        coordinator_id: item.coordinator_id,
        assigned_date: item.assigned_date,
        responsibilities: item.responsibilities,
        contact_hours: item.contact_hours
      }));
      console.log('Processed camps data:', campsData);
      setCamps(campsData);
    } catch (err) {
      console.error('Error loading camps:', err);
      setError('Failed to load your assigned camps');
    } finally {
      setLoading(false);
    }
  };

  const getOccupancyPercentage = (occupancy, capacity) => {
    if (!capacity) return 0;
    return Math.round((occupancy / capacity) * 100);
  };

  const getOccupancyStatus = (percentage) => {
    if (percentage >= 90) return 'critical';
    if (percentage >= 75) return 'warning';
    if (percentage >= 50) return 'good';
    return 'low';
  };

  if (loading) {
    return (
      <div className="container">
        <h2>My Camp</h2>
        <p>Loading your assigned camp...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center" style={{ margin: 'var(--spacing-4xl) 0 var(--spacing-2xl) 0' }}>
        <div>
          <h1 className="mb-sm">My Camp</h1>
          <p className="text-muted mb-0">Manage and monitor your assigned relief camp</p>
        </div>
        <Link to="/dashboard" className="btn btn-secondary">
          ← Back to Dashboard
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Camp Statistics */}
      {camps.length > 0 && (
        <div className="mb-2xl">
          <h3 className="mb-lg">Camp Overview</h3>
          <div className="grid grid-cols-4 gap-lg">
            <div className="card text-center">
              <h4 className="text-3xl font-bold text-primary mb-sm">{camps[0].occupancy || 0}</h4>
              <p className="text-muted mb-0">Current Occupancy</p>
            </div>
            <div className="card text-center">
              <h4 className="text-3xl font-bold text-warning mb-sm">{camps[0].capacity || 0}</h4>
              <p className="text-muted mb-0">Total Capacity</p>
            </div>
            <div className="card text-center">
              <h4 className="text-3xl font-bold text-success mb-sm">
                {(camps[0].capacity || 0) - (camps[0].occupancy || 0)}
              </h4>
              <p className="text-muted mb-0">Available Spaces</p>
            </div>
            <div className="card text-center">
              <h4 className="text-3xl font-bold text-secondary mb-sm">
                {getOccupancyPercentage(camps[0].occupancy, camps[0].capacity)}%
              </h4>
              <p className="text-muted mb-0">Occupancy Rate</p>
            </div>
          </div>
        </div>
      )}

      {/* Camp Details */}
      <div>
        <h3 className="mb-lg">Camp Details</h3>
        {camps.length === 0 ? (
          <div className="card text-center" style={{ padding: 'var(--spacing-4xl)' }}>
            <p className="text-muted">No camp assigned to you yet.</p>
            <p className="text-muted">Contact your administrator for a camp assignment.</p>
          </div>
        ) : (
          <div className="grid gap-xl">
            {camps.map(camp => {
              const occupancyPercentage = getOccupancyPercentage(camp.occupancy, camp.capacity);
              const occupancyStatus = getOccupancyStatus(occupancyPercentage);
              
              return (
                <div key={camp.camp_id} className="card">
                  <div className="flex justify-between items-start mb-lg">
                    <div>
                      <h4 className="mb-sm">{camp.name}</h4>
                      <p className="text-muted mb-sm">📍 {camp.location}</p>
                      {camp.contact_info && (
                        <p className="text-muted mb-sm">📞 {camp.contact_info}</p>
                      )}
                      {camp.assigned_date && (
                        <p className="text-muted mb-0">👤 Assigned: {new Date(camp.assigned_date).toLocaleDateString()}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`badge badge-${occupancyStatus === 'critical' ? 'danger' : occupancyStatus === 'warning' ? 'warning' : 'success'}`}>
                        {occupancyPercentage}% Full
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-lg mb-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{camp.occupancy || 0}</p>
                      <p className="text-sm text-muted">Current Occupancy</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-secondary">{camp.capacity || 0}</p>
                      <p className="text-sm text-muted">Total Capacity</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-success">{(camp.capacity || 0) - (camp.occupancy || 0)}</p>
                      <p className="text-sm text-muted">Available Spaces</p>
                    </div>
                  </div>

                  {/* Occupancy Bar */}
                  <div className="mb-lg">
                    <div className="flex justify-between items-center mb-sm">
                      <span className="text-sm font-medium">Occupancy Level</span>
                      <span className="text-sm text-muted">{occupancyPercentage}%</span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '8px', 
                      backgroundColor: 'var(--color-bg-tertiary)', 
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min(occupancyPercentage, 100)}%`,
                        height: '100%',
                        backgroundColor: occupancyStatus === 'critical' ? 'var(--color-danger)' : 
                                       occupancyStatus === 'warning' ? 'var(--color-warning)' : 
                                       'var(--color-success)',
                        transition: 'width var(--transition-normal)'
                      }} />
                    </div>
                  </div>

                  {camp.facilities && (
                    <div className="mb-lg">
                      <h5 className="mb-sm">Available Facilities</h5>
                      <p className="text-secondary">{camp.facilities}</p>
                    </div>
                  )}

                  {camp.responsibilities && (
                    <div className="mb-lg">
                      <h5 className="mb-sm">Your Responsibilities</h5>
                      <p className="text-secondary">{camp.responsibilities}</p>
                    </div>
                  )}

                  {camp.contact_hours && (
                    <div className="mb-lg">
                      <h5 className="mb-sm">Contact Hours</h5>
                      <p className="text-secondary">{camp.contact_hours}</p>
                    </div>
                  )}

                  <div className="flex gap-lg">
                    <button className="btn btn-secondary">
                      Update Occupancy
                    </button>
                    <Link to="/coordinator/requests" className="btn btn-warning">
                      Request Resources
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}