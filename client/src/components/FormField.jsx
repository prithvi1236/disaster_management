import React from 'react';
import '../styles/form.css';

const FormField = ({ 
  label, 
  error, 
  required = false, 
  children, 
  className = '',
  helpText = null 
}) => {
  const hasError = Boolean(error);
  const fieldClass = `form-group ${hasError ? 'has-error' : ''} ${className}`;

  return (
    <div className={fieldClass}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="required-indicator">*</span>}
        </label>
      )}
      {children}
      {hasError && <div className="field-error">{error}</div>}
      {helpText && !hasError && <div className="field-help">{helpText}</div>}
    </div>
  );
};

export default FormField;