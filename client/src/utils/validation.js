/**
 * Form validation utilities
 */

/**
 * Validation rules
 */
export const validationRules = {
  required: (value, fieldName = 'Field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  minLength: (value, minLength, fieldName = 'Field') => {
    if (value && value.length < minLength) {
      return `${fieldName} must be at least ${minLength} characters long`;
    }
    return null;
  },

  maxLength: (value, maxLength, fieldName = 'Field') => {
    if (value && value.length > maxLength) {
      return `${fieldName} must be no more than ${maxLength} characters long`;
    }
    return null;
  },

  email: (value, fieldName = 'Email') => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return `${fieldName} must be a valid email address`;
    }
    return null;
  },

  number: (value, fieldName = 'Field') => {
    if (value && isNaN(Number(value))) {
      return `${fieldName} must be a valid number`;
    }
    return null;
  },

  min: (value, min, fieldName = 'Field') => {
    if (value && Number(value) < min) {
      return `${fieldName} must be at least ${min}`;
    }
    return null;
  },

  max: (value, max, fieldName = 'Field') => {
    if (value && Number(value) > max) {
      return `${fieldName} must be no more than ${max}`;
    }
    return null;
  },

  date: (value, fieldName = 'Date') => {
    if (value && isNaN(Date.parse(value))) {
      return `${fieldName} must be a valid date`;
    }
    return null;
  },

  futureDate: (value, fieldName = 'Date') => {
    if (value) {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date > today) {
        return `${fieldName} cannot be in the future`;
      }
    }
    return null;
  },

  pastDate: (value, fieldName = 'Date') => {
    if (value) {
      const date = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (date < today) {
        return `${fieldName} cannot be in the past`;
      }
    }
    return null;
  }
};

/**
 * Validate a single field with multiple rules
 * @param {any} value - The value to validate
 * @param {Array} rules - Array of validation rule objects
 * @param {string} fieldName - Human-readable field name
 * @returns {string|null} - Error message or null if valid
 */
export const validateField = (value, rules, fieldName) => {
  for (const rule of rules) {
    let error = null;
    
    if (typeof rule === 'function') {
      error = rule(value, fieldName);
    } else if (typeof rule === 'object' && rule.rule) {
      error = rule.rule(value, rule.param, fieldName);
    } else if (typeof rule === 'string' && validationRules[rule]) {
      error = validationRules[rule](value, fieldName);
    }
    
    if (error) {
      return error;
    }
  }
  return null;
};

/**
 * Validate an entire form object
 * @param {Object} formData - Form data object
 * @param {Object} validationSchema - Validation schema
 * @returns {Object} - Object with field errors
 */
export const validateForm = (formData, validationSchema) => {
  const errors = {};
  
  for (const [fieldName, rules] of Object.entries(validationSchema)) {
    const value = formData[fieldName];
    const error = validateField(value, rules.rules, rules.label || fieldName);
    if (error) {
      errors[fieldName] = error;
    }
  }
  
  return errors;
};

/**
 * Check if form has any errors
 * @param {Object} errors - Errors object
 * @returns {boolean} - True if form has errors
 */
export const hasFormErrors = (errors) => {
  return Object.keys(errors).length > 0;
};

/**
 * Get all error messages as an array
 * @param {Object} errors - Errors object
 * @returns {Array} - Array of error messages
 */
export const getErrorMessages = (errors) => {
  return Object.values(errors).filter(Boolean);
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  disaster: {
    name: {
      label: 'Disaster name',
      rules: ['required', { rule: validationRules.minLength, param: 3 }]
    },
    type: {
      label: 'Disaster type',
      rules: ['required']
    },
    location: {
      label: 'Location',
      rules: ['required', { rule: validationRules.minLength, param: 3 }]
    },
    start_date: {
      label: 'Start date',
      rules: ['required', 'date']
    }
  },
  
  camp: {
    name: {
      label: 'Camp name',
      rules: ['required', { rule: validationRules.minLength, param: 3 }]
    },
    location: {
      label: 'Location',
      rules: ['required', { rule: validationRules.minLength, param: 3 }]
    },
    capacity: {
      label: 'Capacity',
      rules: ['required', 'number', { rule: validationRules.min, param: 1 }, { rule: validationRules.max, param: 10000 }]
    },
    disaster_id: {
      label: 'Disaster',
      rules: ['required']
    }
  },
  
  resourceRequest: {
    resource_type: {
      label: 'Resource type',
      rules: ['required']
    },
    quantity_requested: {
      label: 'Quantity',
      rules: ['required', 'number', { rule: validationRules.min, param: 1 }]
    },
    description: {
      label: 'Description',
      rules: ['required', { rule: validationRules.minLength, param: 10 }]
    }
  }
};