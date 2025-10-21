import React, { useState, useEffect } from 'react';
import { getDashboardStats, getDisasterStats, getRecentActivity } from '../services/api';
import '../styles/statistics.css';

export default function Statistics() {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [disasterStats, setDisasterStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [loadingStates, setLoadingStates] = useState({
    dashboard: false,
    disasters: false,
    activity: false
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError('');
      setLoadingStates({ dashboard: true, disasters: true, activity: true });
      
      const results = await Promise.allSettled([
        getDashboardStats(),
        getDisasterStats(),
        getRecentActivity()
      ]);

      // Handle dashboard stats
      if (results[0].status === 'fulfilled') {
        setDashboardStats(results[0].value);
      } else {
        console.error('Dashboard stats error:', results[0].reason);
      }

      // Handle disaster stats
      if (results[1].status === 'fulfilled') {
        setDisasterStats(results[1].value);
      } else {
        console.error('Disaster stats error:', results[1].reason);
      }

      // Handle recent activity
      if (results[2].status === 'fulfilled') {
        setRecentActivity(results[2].value);
      } else {
        console.error('Recent activity error:', results[2].reason);
      }

      // Check if all requests failed
      const allFailed = results.every(result => result.status === 'rejected');
      if (allFailed) {
        const firstError = results[0].reason;
        setError(firstError?.message || 'Failed to load statistics');
      }

    } catch (err) {
      console.error('Statistics error:', err);
      setError(err?.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
      setLoadingStates({ dashboard: false, disasters: false, activity: false });
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    loadStatistics();
  };

  if (loading && !dashboardStats && !disasterStats && !recentActivity) {
    return (
      <div className="statistics-page">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  const hasAnyData = dashboardStats || disasterStats || recentActivity;
  const hasError = error && !hasAnyData;

  if (hasError) {
    return (
      <div className="statistics-page">
        <div className="error">
          <h2>Unable to Load Statistics</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={handleRetry} className="retry-button">
              {loading ? 'Retrying...' : 'Retry'}
            </button>
            {retryCount > 0 && (
              <p className="retry-info">Retry attempt: {retryCount}</p>
            )}
          </div>
          <div className="error-help">
            <p>If the problem persists, please:</p>
            <ul>
              <li>Check your internet connection</li>
              <li>Refresh the page</li>
              <li>Contact system administrator</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-page">
      <div className="page-header">
        <h1>System Statistics</h1>
        {error && hasAnyData && (
          <div className="partial-error-banner">
            <span>⚠️ Some statistics may be incomplete due to loading errors.</span>
            <button onClick={handleRetry} className="retry-link">
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Dashboard Overview */}
      <section className="stats-section">
        <div className="section-header">
          <h2>Overview</h2>
          {loadingStates.dashboard && <div className="section-loading">Loading...</div>}
        </div>
        {dashboardStats ? (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Disasters</h3>
              <div className="stat-number">{dashboardStats.totals?.disasters || 0}</div>
              <div className="stat-detail">{dashboardStats.active?.disasters || 0} active</div>
            </div>
            <div className="stat-card">
              <h3>Relief Camps</h3>
              <div className="stat-number">{dashboardStats.totals?.camps || 0}</div>
              <div className="stat-detail">{dashboardStats.camps?.occupancy_rate || 0}% occupied</div>
            </div>
            <div className="stat-card">
              <h3>Donations</h3>
              <div className="stat-number">{dashboardStats.totals?.donations || 0}</div>
              <div className="stat-detail">${(dashboardStats.donations?.total_amount || 0).toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <h3>Volunteers</h3>
              <div className="stat-number">{dashboardStats.totals?.volunteers || 0}</div>
              <div className="stat-detail">{dashboardStats.active?.volunteers || 0} active</div>
            </div>
          </div>
        ) : (
          <div className="stats-unavailable">
            <p>Dashboard statistics are currently unavailable.</p>
            <button onClick={handleRetry} className="retry-button-small">
              Try Again
            </button>
          </div>
        )}
      </section>

      {/* Disaster Breakdown */}
      <section className="stats-section">
        <div className="section-header">
          <h2>Disaster Breakdown</h2>
          {loadingStates.disasters && <div className="section-loading">Loading...</div>}
        </div>
        {disasterStats ? (
          <div className="breakdown-grid">
            <div className="breakdown-card">
              <h3>By Status</h3>
              {disasterStats.by_status?.length > 0 ? (
                <ul>
                  {disasterStats.by_status.map((item, index) => (
                    <li key={index}>
                      <span className="label">{item.status || 'Unknown'}:</span>
                      <span className="value">{item.count || 0}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-data">No disaster status data available</p>
              )}
            </div>
            <div className="breakdown-card">
              <h3>By Type</h3>
              {disasterStats.by_type?.length > 0 ? (
                <ul>
                  {disasterStats.by_type.map((item, index) => (
                    <li key={index}>
                      <span className="label">{item.type || 'Unknown'}:</span>
                      <span className="value">{item.count || 0}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-data">No disaster type data available</p>
              )}
            </div>
            <div className="breakdown-card">
              <h3>By Severity</h3>
              {disasterStats.by_severity?.length > 0 ? (
                <ul>
                  {disasterStats.by_severity.map((item, index) => (
                    <li key={index}>
                      <span className="label">{item.severity || 'Unknown'}:</span>
                      <span className="value">{item.count || 0}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-data">No disaster severity data available</p>
              )}
            </div>
          </div>
        ) : (
          <div className="stats-unavailable">
            <p>Disaster breakdown statistics are currently unavailable.</p>
            <button onClick={handleRetry} className="retry-button-small">
              Try Again
            </button>
          </div>
        )}
      </section>

      {/* Recent Activity */}
      <section className="stats-section">
        <div className="section-header">
          <h2>Recent Activity</h2>
          {loadingStates.activity && <div className="section-loading">Loading...</div>}
        </div>
        {recentActivity ? (
          <div className="activity-grid">
            <div className="activity-card">
              <h3>Recent Disasters</h3>
              {recentActivity.disasters?.length > 0 ? (
                <ul>
                  {recentActivity.disasters.slice(0, 3).map((disaster) => (
                    <li key={disaster.id}>
                      <strong>{disaster.name || 'Unnamed Disaster'}</strong>
                      <span>{disaster.type || 'Unknown'} in {disaster.location || 'Unknown Location'}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-data">No recent disasters</p>
              )}
            </div>
            <div className="activity-card">
              <h3>Recent Donations</h3>
              {recentActivity.donations?.length > 0 ? (
                <ul>
                  {recentActivity.donations.slice(0, 3).map((donation) => (
                    <li key={donation.id}>
                      <strong>{donation.donor_name || 'Anonymous'}</strong>
                      <span>
                        {donation.type || 'Unknown'} 
                        {donation.amount ? ` - $${donation.amount}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-data">No recent donations</p>
              )}
            </div>
            <div className="activity-card">
              <h3>Recent Volunteers</h3>
              {recentActivity.volunteers?.length > 0 ? (
                <ul>
                  {recentActivity.volunteers.slice(0, 3).map((volunteer) => (
                    <li key={volunteer.id}>
                      <strong>{volunteer.name || 'Unknown'}</strong>
                      <span>{volunteer.skills || 'General volunteer'}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-data">No recent volunteers</p>
              )}
            </div>
          </div>
        ) : (
          <div className="stats-unavailable">
            <p>Recent activity data is currently unavailable.</p>
            <button onClick={handleRetry} className="retry-button-small">
              Try Again
            </button>
          </div>
        )}
      </section>
    </div>
  );
}