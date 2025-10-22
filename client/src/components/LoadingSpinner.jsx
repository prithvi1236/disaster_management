import React from 'react';
import '../styles/loading.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  message = 'Loading...', 
  inline = false,
  overlay = false 
}) => {
  const sizeClass = `spinner-${size}`;
  const containerClass = `loading-container ${inline ? 'inline' : ''} ${overlay ? 'overlay' : ''}`;

  return (
    <div className={containerClass}>
      <div className={`loading-spinner ${sizeClass}`}>
        <div className="spinner"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;