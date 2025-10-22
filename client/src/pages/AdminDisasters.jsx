import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/auth.js';
import { fetchDisasters, createDisaster, updateDisaster } from '../services/api.js';
import '../styles/adminDisasters.css';

export default function AdminDisasters() {
  const [user, setUser] = useState(null);
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDisaster, setEditingDisaster] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    severity_level: 'Medium',
    status: 'Active',
    start_date: '',
    end_date: '',
    description: ''
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      window.location.href = '/dashboard';
      return;
    }
    setUser(currentUser);
    loadDisasters();
  }, []);

  const loadDisasters = async () => {
    try {
      setLoading(true);
      const data = await fetchDisasters();
      setDisasters(data);
    } catch (err) {
      setError('Failed to load disasters');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDisaster) {
        await updateDisaster(editingDisaster.disaster_id, formData);
      } else {
        await createDisaster(formData);
      }
      
      setShowForm(false);
      setEditingDisaster(null);
      resetForm();
      await loadDisasters();
    } catch (err) {
      setError(`Failed to ${editingDisaster ? 'update' : 'create'} disaster`);
    }
  };

  const handleEdit = (disaster) => {
    setEditingDisaster(disaster);
    setFormData({
      name: disaster.name,
      type: disaster.type,
      location: disaster.location,
      severity_level: disaster.severity_level,
      status: disaster.status,
      start_date: disaster.start_date ? disaster.start_date.split('T')[0] : '',
      end_date: disaster.end_date ? disaster.end_date.split('T')[0] : '',
      description: disaster.description || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      location: '',
      severity_level: 'Medium',
      status: 'Active',
      start_date: '',
      end_date: '',
      description: ''
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingDisaster(null);
    resetForm();
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#dc2626';
      case 'high': return '#f59e0b';
      case 'medium': return '#2563eb';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return '#10b981';
      case 'ongoing': return '#f59e0b';
      case 'monitoring': return '#2563eb';
      case 'recovery': return '#8b5cf6';
      case 'resolved': return '#6b7280';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="admin-disasters container">
        <h2>Disaster Management</h2>
        <p>Loading disasters...</p>
      </div>
    );
  }

  return (
    <div className="admin-disasters container">
      <div className="page-header">
        <h2>Disaster Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          Add New Disaster
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingDisaster ? 'Edit Disaster' : 'Add New Disaster'}</h3>
              <button className="close-btn" onClick={handleCancel}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="disaster-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Disaster Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="e.g., Kerala Floods 2024"
                  />
                </div>
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Flood">Flood</option>
                    <option value="Earthquake">Earthquake</option>
                    <option value="Cyclone">Cyclone</option>
                    <option value="Landslide">Landslide</option>
                    <option value="Drought">Drought</option>
                    <option value="Wildfire">Wildfire</option>
                    <option value="Heat Wave">Heat Wave</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    required
                    placeholder="e.g., Kochi, Kerala"
                  />
                </div>
                <div className="form-group">
                  <label>Severity Level *</label>
                  <select
                    value={formData.severity_level}
                    onChange={(e) => setFormData({...formData, severity_level: e.target.value})}
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Monitoring">Monitoring</option>
                    <option value="Recovery">Recovery</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>End Date (if applicable)</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="4"
                  placeholder="Describe the disaster situation, impact, and current status..."
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDisaster ? 'Update Disaster' : 'Create Disaster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="disasters-grid">
        {disasters.map(disaster => (
          <div key={disaster.disaster_id} className="disaster-card">
            <div className="disaster-header">
              <h3>{disaster.name}</h3>
              <div className="disaster-badges">
                <span 
                  className="severity-badge"
                  style={{ backgroundColor: getSeverityColor(disaster.severity_level) }}
                >
                  {disaster.severity_level}
                </span>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(disaster.status) }}
                >
                  {disaster.status}
                </span>
              </div>
            </div>

            <div className="disaster-info">
              <p><strong>Type:</strong> {disaster.type}</p>
              <p><strong>Location:</strong> {disaster.location}</p>
              <p><strong>Started:</strong> {new Date(disaster.start_date).toLocaleDateString()}</p>
              {disaster.end_date && (
                <p><strong>Ended:</strong> {new Date(disaster.end_date).toLocaleDateString()}</p>
              )}
              {disaster.description && (
                <p className="description">{disaster.description}</p>
              )}
            </div>

            <div className="disaster-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => handleEdit(disaster)}
              >
                Edit
              </button>
              <a 
                href={`/disasters/${disaster.disaster_id}`}
                className="btn btn-primary"
              >
                View Details
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}