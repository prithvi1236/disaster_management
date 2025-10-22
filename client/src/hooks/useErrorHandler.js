import { useState, useCallback } from 'react';

/**
 * Custom hook for managing error states and retry logic
 * @param {Object} options - Configuration options
 * @returns {Object} - Error state and helper functions
 */
export const useErrorHandler = (options = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError = null,
    clearErrorOnRetry = true
  } = options;

  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleError = useCallback((err) => {
    const errorMessage = err?.message || err || 'An unexpected error occurred';
    setError(errorMessage);
    
    if (onError) {
      onError(err);
    }
  }, [onError]);

  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  const retry = useCallback(async (retryFunction) => {
    if (retryCount >= maxRetries) {
      handleError(new Error(`Maximum retry attempts (${maxRetries}) exceeded`));
      return;
    }

    try {
      setIsRetrying(true);
      if (clearErrorOnRetry) {
        setError(null);
      }

      // Add delay before retry
      if (retryDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }

      const result = await retryFunction();
      setRetryCount(0);
      setError(null);
      return result;
    } catch (err) {
      setRetryCount(prev => prev + 1);
      handleError(err);
      throw err;
    } finally {
      setIsRetrying(false);
    }
  }, [retryCount, maxRetries, retryDelay, clearErrorOnRetry, handleError]);

  const withErrorHandling = useCallback((asyncFunction) => {
    return async (...args) => {
      try {
        const result = await asyncFunction(...args);
        if (error) {
          clearError();
        }
        return result;
      } catch (err) {
        handleError(err);
        throw err;
      }
    };
  }, [error, clearError, handleError]);

  return {
    error,
    retryCount,
    isRetrying,
    handleError,
    clearError,
    retry,
    withErrorHandling,
    canRetry: retryCount < maxRetries
  };
};

/**
 * Utility function to determine error type
 * @param {Error|string} error - The error to categorize
 * @returns {string} - Error type
 */
export const getErrorType = (error) => {
  const message = typeof error === 'string' ? error : error?.message || '';
  
  if (message.includes('Network error') || message.includes('fetch')) {
    return 'network';
  }
  if (message.includes('401') || message.includes('Authentication')) {
    return 'auth';
  }
  if (message.includes('403') || message.includes('Access denied')) {
    return 'permission';
  }
  if (message.includes('404') || message.includes('not found')) {
    return 'notfound';
  }
  if (message.includes('500') || message.includes('Server error')) {
    return 'server';
  }
  if (message.includes('validation') || message.includes('required')) {
    return 'validation';
  }
  
  return 'error';
};

/**
 * Get user-friendly error message
 * @param {Error|string} error - The error to format
 * @returns {string} - User-friendly error message
 */
export const formatErrorMessage = (error) => {
  const message = typeof error === 'string' ? error : error?.message || '';
  const type = getErrorType(error);
  
  switch (type) {
    case 'network':
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    case 'auth':
      return 'Your session has expired. Please log in again.';
    case 'permission':
      return 'You do not have permission to perform this action.';
    case 'notfound':
      return 'The requested resource was not found.';
    case 'server':
      return 'A server error occurred. Please try again later.';
    case 'validation':
      return message; // Keep validation messages as-is
    default:
      return message || 'An unexpected error occurred. Please try again.';
  }
};