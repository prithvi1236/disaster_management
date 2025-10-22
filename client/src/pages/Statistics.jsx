import React, { useState, useEffect } from 'react';
import { getDashboardStats, getDisasterStats, getRecentActivity } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useLoadingState } from '../hooks/useLoadingState';
import { useErrorHandler, formatErrorMessage } from '../hooks/useErrorHandler';
import '../styles/statistics.css';

export default function Statistics() {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [disasterStats, setDisasterStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState(null);
  
  const { loadingStates, setLoading, isAnyLoading } = useLoadingState({
    dashboard: false,
    disasters: false,
    activity: false,
    initial: true
  });

  const { 
    error, 
    handleError, 
    clearError, 
    retry, 
    retryCount,
    canRetry 
  } = useErrorHandler({
    maxRetries: 3,
    retryDelay: 1000
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading('initial', true);
      setLoading('dashboard', true);
      setLoading('disasters', true);
      setLoading('activity', true);
      clearError();
      
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
      setLoading('dashboard', false);

      // Handle disaster stats
      if (results[1].status === 'fulfilled') {
        setDisasterStats(results[1].value);
      } else {
        console.error('Disaster stats error:', results[1].reason);
      }
      setLoading('disasters', false);

      // Handle recent activity
      if (results[2].status === 'fulfilled') {
        setRecentActivity(results[2].value);
      } else {
        console.error('Recent activity error:', results[2].reason);
      }
      setLoading('activity', false);

      // Check if all requests failed
      const allFailed = results.every(result => result.status === 'rejected');
      if (allFailed) {
        const firstError = results[0].reason;
        handleError(firstError || new Error('Failed to load statistics'));
      }

    } catch (err) {
      console.error('Statistics error:', err);
      handleError(err);
    } finally {
      setLoading('initial', false);
    }
  };

  const handleRetry = async () => {
    try {
      await retry(loadStatistics);
    } catch (err) {
      // Error is already handled by the retry function
      console.error('Retry failed:', err);
    }
  };

  if (loadingStates.initial && !dashboardStats && !disasterStats && !recentActivity) {
    return (
      <div className="statistics-page">
        <LoadingSpinner 
          size="large" 
          message="Loading statistics..." 
        />
      </div>
    );
  }

  const hasAnyData = dashboardStats || disasterStats || recentActivity;
  const hasError = error && !hasAnyData;

  if (hasError) {
    return (
      <div className="statistics-page">
        <div className="page-header">
          <h1>System Statistics</h1>
        </div>
        <ErrorMessage
          error={formatErrorMessage(error)}
          onRetry={canRetry ? handleRetry : null}
          retryText={isAnyLoading() ? 'Retrying...' : 'Retry'}
          showRetry={canRetry}
        />
        {retryCount > 0 && (
          <div className="retry-info">
            <p>Retry attempt: {retryCount}</p>
          </div>
        )}
        <div className="error-help">
          <p>If the problem persists, please:</p>
          <ul>
            <li>Check your internet connection</li>
            <li>Refresh the page</li>
            <li>Contact system administrator</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-page">
      <div className="page-header">
        <h1>System Statistics</h1>
        {error && hasAnyData && (
          <ErrorMessage
            error="Some statistics may be incomplete due to loading errors."
            type="warning"
            onRetry={canRetry ? handleRetry : null}
            retryText={isAnyLoading() ? 'Retrying...' : 'Retry'}
            showRetry={canRetry}
            className="partial-error-banner"
          />
        )}
      </div>

      {/* Dashboard Overview */}
      <section className="stats-section">
        <div className="section-header">
          <h2>Overview</h2>
          {loadingStates.dashboard && (
            <LoadingSpinner size="small" message="Loading..." inline />
          )}
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
            <ErrorMessage
              error="Dashboard statistics are currently unavailable."
              type="info"
              onRetry={canRetry ? handleRetry : null}
              retryText={isAnyLoading() ? 'Loading...' : 'Try Again'}
              showRetry={canRetry}
              className="inline"
            />
          </div>
        )}
      </section>

      {/* Disaster Breakdown */}
      <section className="stats-section">
        <div className="section-header">
          <h2>Disaster Breakdown</h2>
          {loadingStates.disasters && (
            <LoadingSpinner size="small" message="Loading..." inline />
          )}
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
            <ErrorMessage
              error="Disaster breakdown statistics are currently unavailable."
              type="info"
              onRetry={canRetry ? handleRetry : null}
              retryText={isAnyLoading() ? 'Loading...' : 'Try Again'}
              showRetry={canRetry}
              className="inline"
            />
          </div>
        )}
      </section>

      {/* Recent Activity */}
      <section className="stats-section">
        <div className="section-header">
          <h2>Recent Activity</h2>
          {loadingStates.activity && (
            <LoadingSpinner size="small" message="Loading..." inline />
          )}
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
            <ErrorMessage
              error="Recent activity data is currently unavailable."
              type="info"
              onRetry={canRetry ? handleRetry : null}
              retryText={isAnyLoading() ? 'Loading...' : 'Try Again'}
              showRetry={canRetry}
              className="inline"
            />
          </div>
        )}
      </section>
    </div>
  );
}