import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/notfound.css';

export default function NotFound() {
  return (
    <div className="notfound container">
      <div className="notfound-content">
        <h1>404</h1>
        <p>Page not found.</p>
        <Link to="/" className="btn btn-outline">
          Go back home
        </Link>
      </div>
    </div>
  );
}
