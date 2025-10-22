import { useState, useCallback } from 'react';

/**
 * Custom hook for managing loading states
 * @param {Object} initialStates - Initial loading states object
 * @returns {Object} - Loading states and helper functions
 */
export const useLoadingState = (initialStates = {}) => {
  const [loadingStates, setLoadingStates] = useState(initialStates);

  const setLoading = useCallback((key, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  }, []);

  const setMultipleLoading = useCallback((states) => {
    setLoadingStates(prev => ({
      ...prev,
      ...states
    }));
  }, []);

  const isLoading = useCallback((key) => {
    return Boolean(loadingStates[key]);
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const resetLoading = useCallback(() => {
    setLoadingStates(initialStates);
  }, [initialStates]);

  return {
    loadingStates,
    setLoading,
    setMultipleLoading,
    isLoading,
    isAnyLoading,
    resetLoading
  };
};

/**
 * Higher-order function to wrap API calls with loading state management
 * @param {Function} apiCall - The API function to wrap
 * @param {Function} setLoading - Loading state setter function
 * @param {string} loadingKey - Key to identify this loading state
 * @returns {Function} - Wrapped API function
 */
export const withLoadingState = (apiCall, setLoading, loadingKey) => {
  return async (...args) => {
    try {
      setLoading(loadingKey, true);
      const result = await apiCall(...args);
      return result;
    } finally {
      setLoading(loadingKey, false);
    }
  };
};