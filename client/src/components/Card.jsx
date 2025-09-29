import React from 'react';
import '../styles/card.css';

export default function Card({
  title,
  children,
  variant = 'default',
  elevated = false,
  interactive = false,
  className = ''
}) {
  const classes = [
    'card',
    `card--${variant}`,
    elevated && 'card--elevated',
    interactive && 'card--interactive',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {title && (
        <div className="card-header">
          <h3 className="card-title">{title}</h3>
        </div>
      )}
      <div className="card-content">{children}</div>
    </div>
  );
}
