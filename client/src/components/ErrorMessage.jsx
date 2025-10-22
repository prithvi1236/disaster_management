import React from 'react';
import '../styles/error.css';

const ErrorMessage = ({ 
  error, 
  onRetry, 
  onDismiss,
  type = 'error',
  showRetry = true,
  retryText = 'Try Again',
  className = ''
}) => {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message || 'An unexpected error occurred';
  const errorClass = `error-message ${type} ${className}`;

  return (
    <div className={errorClass}>
      <div className="error-content">
        <div className="error-icon">
          {type === 'warning' ? '⚠️' : type === 'info' ? 'ℹ️' : '❌'}
        </div>
        <div className="error-text">
          <p>{errorMessage}</p>
        </div>
        <div className="error-actions">
          {showRetry && onRetry && (
            <button 
              onClick={onRetry} 
              className="btn btn-sm btn-outline-primary retry-btn"
            >
              {retryText}
            </button>
          )}
          {onDismiss && (
            <button 
              onClick={onDismiss} 
              className="btn btn-sm btn-outline-secondary dismiss-btn"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;