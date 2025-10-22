import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/auth.js';
import { getCoordinatorCamps, updateCamp } from '../services/api.js';
import '../styles/globals.css';

export default function CoordinatorCamps() {
  const [user, setUser] = useState(null);
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [newOccupancy, setNewOccupancy] = useState('');
  const [updating, setUpdating] = useState(false);

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

  const handleLogout = () => {
    logout();
  };

  const handleUpdateOccupancy = (camp) => {
    setSelectedCamp(camp);
    setNewOccupancy(camp.occupancy || 0);
    setShowUpdateModal(true);
  };

  const handleSubmitOccupancy = async (e) => {
    e.preventDefault();
    if (!selectedCamp || updating) return;

    setUpdating(true);
    setError('');

    try {
      const occupancyValue = parseInt(newOccupancy);
      
      // Validate occupancy
      if (isNaN(occupancyValue)) {
        setError('Please enter a valid number');
        return;
      }
      
      if (occupancyValue < 0) {
        setError('Occupancy cannot be negative');
        return;
      }
      
      if (occupancyValue > selectedCamp.capacity) {
        setError(`Occupancy cannot exceed capacity (${selectedCamp.capacity})`);
        return;
      }

      // Check if the value is actually different
      if (occupancyValue === selectedCamp.occupancy) {
        setError('New occupancy is the same as current occupancy');
        return;
      }

      // Update camp occupancy
      await updateCamp(selectedCamp.camp_id, { occupancy: occupancyValue });
      
      // Update local state immediately for better UX
      setCamps(prevCamps => 
        prevCamps.map(camp => 
          camp.camp_id === selectedCamp.camp_id 
            ? { ...camp, occupancy: occupancyValue }
            : camp
        )
      );
      
      // Close modal and reset state
      setShowUpdateModal(false);
      setSelectedCamp(null);
      setNewOccupancy('');
      setError('');
      setSuccess(`Occupancy updated successfully to ${occupancyValue} people`);
      
    } catch (err) {
      console.error('Error updating occupancy:', err);
      setError('Failed to update occupancy. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCloseModal = () => {
    setShowUpdateModal(false);
    setSelectedCamp(null);
    setNewOccupancy('');
    setError('');
  };

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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

      {success && (
        <div className="alert alert-success">
          {success}
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
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleUpdateOccupancy(camp)}
                    >
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

      {/* Update Occupancy Modal */}
      {showUpdateModal && selectedCamp && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Occupancy - {selectedCamp.name}</h3>
              <button 
                onClick={handleCloseModal}
                className="btn btn-secondary"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmitOccupancy}>
              <div className="mb-lg">
                <div className="grid grid-cols-3 gap-lg mb-lg">
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary">{selectedCamp.occupancy || 0}</p>
                    <p className="text-sm text-muted">Current Occupancy</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-secondary">{selectedCamp.capacity || 0}</p>
                    <p className="text-sm text-muted">Total Capacity</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-success">{(selectedCamp.capacity || 0) - (selectedCamp.occupancy || 0)}</p>
                    <p className="text-sm text-muted">Available Spaces</p>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">New Occupancy Count</label>
                <input
                  type="number"
                  className="form-input"
                  value={newOccupancy}
                  onChange={(e) => setNewOccupancy(e.target.value)}
                  min="0"
                  max={selectedCamp.capacity}
                  required
                  placeholder="Enter new occupancy count"
                />
                <div className="flex justify-between items-center mt-sm">
                  <p className="text-sm text-muted">
                    Maximum capacity: {selectedCamp.capacity} people
                  </p>
                  {newOccupancy && !isNaN(parseInt(newOccupancy)) && (
                    <p className="text-sm text-primary">
                      New occupancy rate: {Math.round((parseInt(newOccupancy) / selectedCamp.capacity) * 100)}%
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <div className="alert alert-danger">
                  {error}
                </div>
              )}

              <div className="flex gap-lg">
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  {updating ? (
                    <>
                      <span className="spinner" style={{ marginRight: 'var(--spacing-sm)' }}></span>
                      Updating...
                    </>
                  ) : (
                    'Update Occupancy'
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="btn btn-secondary"
                  disabled={updating}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom logout section */}
      <div className="dashboard-logout-section">
        <p>Ready to sign out?</p>
        <button className="btn btn-outline btn-lg" onClick={handleLogout}>
          <span style={{ marginRight: 'var(--spacing-sm)' }}>👋</span>
          Logout
        </button>
      </div>
    </div>
  );
}