import React from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import '../styles/network.css';

const NetworkStatus = () => {
  const { isOnline, isOffline, wasOffline } = useNetworkStatus();

  if (isOnline && !wasOffline) {
    return null; // Don't show anything when online normally
  }

  return (
    <div className={`network-status ${isOffline ? 'offline' : 'reconnected'}`}>
      <div className="network-content">
        {isOffline ? (
          <>
            <span className="network-icon">📡</span>
            <span className="network-message">
              You're offline. Some features may not work properly.
            </span>
          </>
        ) : (
          <>
            <span className="network-icon">✅</span>
            <span className="network-message">
              Connection restored!
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkStatus;