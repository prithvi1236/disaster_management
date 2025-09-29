import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h3>Direma</h3>
          <p>Emergency Response & Disaster Management</p>
        </div>

        <div className="footer-links">
          <div className="footer-section">
            <h4>Services</h4>
            <Link to="/disasters">Disaster Reports</Link>
            <Link to="/volunteer-signup">Volunteer Program</Link>
            <Link to="/donate">Emergency Donations</Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-container">
          <p>© 2025 Direma. All rights reserved.</p>
          <p>Committed to saving lives and communities worldwide.</p>
        </div>
      </div>
    </footer>
  );
}
