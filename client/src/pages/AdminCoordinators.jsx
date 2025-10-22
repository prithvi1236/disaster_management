import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../services/auth.js';
import { 
  fetchCamps, 
  getCoordinators, 
  createCoordinator, 
  updateCoordinator,
  deactivateCoordinator,
  getAvailableCoordinatorUsers,
  getAllCoordinatorUsers
} from '../services/api.js';


import '../styles/globals.css';

export default function AdminCoordinators() {
  const [user, setUser] = useState(null);
  const [camps, setCamps] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [coordinatorUsers, setCoordinatorUsers] = useState([]);
  const [availableCoordinators, setAvailableCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    user_id: '',
    camp_id: '',
    responsibilities: '',
    contact_hours: ''
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      window.location.href = '/dashboard';
      return;
    }
    setUser(currentUser);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [campsData, coordinatorsData, allUsersData, availableUsersData] = await Promise.all([
        fetchCamps(),
        getCoordinators(),
        getAllCoordinatorUsers(),
        getAvailableCoordinatorUsers()
      ]);
      
      setCamps(campsData);
      setCoordinators(coordinatorsData);
      setCoordinatorUsers(allUsersData);
      setAvailableCoordinators(availableUsersData);
    } catch (err) {
      setError('Failed to load coordinator data');
    } finally {
      setLoading(false);
    }
  };



  const handleAssignCoordinator = async (e) => {
    e.preventDefault();
    try {
      await createCoordinator(newAssignment);
      setShowAssignForm(false);
      setNewAssignment({
        user_id: '',
        camp_id: '',
        responsibilities: '',
        contact_hours: ''
      });
      loadData();
    } catch (err) {
      setError('Failed to assign coordinator: ' + err.message);
    }
  };

  const handleDeactivateCoordinator = async (coordinatorId) => {
    if (window.confirm('Are you sure you want to remove this coordinator assignment?')) {
      try {
        await deactivateCoordinator(coordinatorId);
        loadData();
      } catch (err) {
        setError('Failed to deactivate coordinator');
      }
    }
  };

  const getUnassignedCamps = () => {
    const assignedCampIds = coordinators.map(c => c.camp_id);
    return camps.filter(camp => !assignedCampIds.includes(camp.camp_id));
  };

  const getUnassignedCoordinators = () => {
    return availableCoordinators;
  };

  const getCampName = (campId) => {
    const camp = camps.find(c => c.camp_id === campId);
    return camp ? camp.name : 'Unknown Camp';
  };

  const getCoordinatorName = (userId) => {
    const coordinator = coordinatorUsers.find(u => u.user_id === userId);
    return coordinator ? coordinator.full_name : 'Unknown User';
  };

  if (loading) {
    return (
      <div className="container">
        <h2>Coordinator Management</h2>
        <p>Loading coordinator assignments...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center" style={{ margin: 'var(--spacing-4xl) 0 var(--spacing-2xl) 0' }}>
        <div>
          <h1 className="mb-sm">Coordinator Management</h1>
          <p className="text-muted mb-0">Assign coordinators to camps (one-to-one relationship)</p>
        </div>
        <div className="flex gap-lg">
          <button 
            onClick={() => setShowAssignForm(true)}
            className="btn btn-primary"
            disabled={getUnassignedCamps().length === 0 || getUnassignedCoordinators().length === 0}
          >
            + Assign Coordinator
          </button>
          <Link to="/dashboard" className="btn btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Assignment Statistics */}
      <div className="mb-2xl">
        <h3 className="mb-lg">Assignment Overview</h3>
        <div className="grid grid-cols-4 gap-lg">
          <div className="card text-center">
            <h4 className="text-3xl font-bold text-primary mb-sm">{coordinators.length}</h4>
            <p className="text-muted mb-0">Active Assignments</p>
          </div>
          <div className="card text-center">
            <h4 className="text-3xl font-bold text-warning mb-sm">{getUnassignedCamps().length}</h4>
            <p className="text-muted mb-0">Unassigned Camps</p>
          </div>
          <div className="card text-center">
            <h4 className="text-3xl font-bold text-secondary mb-sm">{getUnassignedCoordinators().length}</h4>
            <p className="text-muted mb-0">Available Coordinators</p>
          </div>
          <div className="card text-center">
            <h4 className="text-3xl font-bold text-success mb-sm">{camps.length}</h4>
            <p className="text-muted mb-0">Total Camps</p>
          </div>
        </div>
      </div>

      {/* Assignment Form Modal */}
      {showAssignForm && (
        <div className="modal-overlay" onClick={() => setShowAssignForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Coordinator to Camp</h3>
              <button 
                onClick={() => setShowAssignForm(false)}
                className="btn btn-secondary"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAssignCoordinator}>
              <div className="form-group">
                <label>Coordinator</label>
                <select
                  value={newAssignment.user_id}
                  onChange={(e) => setNewAssignment({...newAssignment, user_id: e.target.value})}
                  required
                >
                  <option value="">Select a coordinator...</option>
                  {getUnassignedCoordinators().map(coordinator => (
                    <option key={coordinator.user_id} value={coordinator.user_id}>
                      {coordinator.full_name} ({coordinator.username})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Camp</label>
                <select
                  value={newAssignment.camp_id}
                  onChange={(e) => setNewAssignment({...newAssignment, camp_id: e.target.value})}
                  required
                >
                  <option value="">Select a camp...</option>
                  {getUnassignedCamps().map(camp => (
                    <option key={camp.camp_id} value={camp.camp_id}>
                      {camp.name} - {camp.location}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Responsibilities</label>
                <textarea
                  value={newAssignment.responsibilities}
                  onChange={(e) => setNewAssignment({...newAssignment, responsibilities: e.target.value})}
                  placeholder="Describe the coordinator's responsibilities..."
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Contact Hours</label>
                <input
                  type="text"
                  value={newAssignment.contact_hours}
                  onChange={(e) => setNewAssignment({...newAssignment, contact_hours: e.target.value})}
                  placeholder="e.g., 9 AM - 6 PM, Emergency contact available"
                />
              </div>
              <div className="flex gap-lg">
                <button type="submit" className="btn btn-primary">
                  Assign Coordinator
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAssignForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Current Assignments */}
      <div className="mb-2xl">
        <h3 className="mb-lg">Current Assignments</h3>
        {coordinators.length === 0 ? (
          <div className="card text-center" style={{ padding: 'var(--spacing-4xl)' }}>
            <p className="text-muted">No coordinator assignments yet.</p>
            <p className="text-muted">Assign coordinators to camps to get started.</p>
          </div>
        ) : (
          <div className="grid gap-xl">
            {coordinators.map(coordinator => (
              <div key={coordinator.coordinator_id} className="card">
                <div className="flex justify-between items-start mb-lg">
                  <div>
                    <h4 className="mb-sm">{getCoordinatorName(coordinator.user_id)}</h4>
                    <p className="text-muted mb-sm">📍 {getCampName(coordinator.camp_id)}</p>
                    <p className="text-secondary mb-0">Assigned: {new Date(coordinator.assigned_date).toLocaleDateString()}</p>
                  </div>
                  <div className="badge badge-success">Active</div>
                </div>

                {coordinator.responsibilities && (
                  <div className="mb-lg">
                    <p className="text-sm font-medium text-muted">Responsibilities</p>
                    <p className="text-secondary">{coordinator.responsibilities}</p>
                  </div>
                )}

                {coordinator.contact_hours && (
                  <div className="mb-lg">
                    <p className="text-sm font-medium text-muted">Contact Hours</p>
                    <p className="text-secondary">{coordinator.contact_hours}</p>
                  </div>
                )}

                <div className="flex gap-lg">
                  <button 
                    onClick={() => handleDeactivateCoordinator(coordinator.coordinator_id)}
                    className="btn btn-danger"
                  >
                    Remove Assignment
                  </button>
                  <Link 
                    to={`/camps/${coordinator.camp_id}`} 
                    className="btn btn-secondary"
                  >
                    View Camp
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unassigned Items */}
      {(getUnassignedCamps().length > 0 || getUnassignedCoordinators().length > 0) && (
        <div>
          <h3 className="mb-lg">Unassigned Items</h3>
          <div className="grid grid-cols-2 gap-xl">
            {getUnassignedCamps().length > 0 && (
              <div className="card">
                <h4 className="mb-lg">Camps Without Coordinators</h4>
                {getUnassignedCamps().map(camp => (
                  <div key={camp.camp_id} className="mb-lg">
                    <p className="font-medium">{camp.name}</p>
                    <p className="text-muted text-sm">{camp.location}</p>
                  </div>
                ))}
              </div>
            )}
            
            {getUnassignedCoordinators().length > 0 && (
              <div className="card">
                <h4 className="mb-lg">Available Coordinators</h4>
                {getUnassignedCoordinators().map(coordinator => (
                  <div key={coordinator.user_id} className="mb-lg">
                    <p className="font-medium">{coordinator.full_name}</p>
                    <p className="text-muted text-sm">{coordinator.email}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}