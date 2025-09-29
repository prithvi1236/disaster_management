// src/pages/Landing.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card.jsx';
import '../styles/landing.css';

export default function Landing() {
  return (
    <div className="landing">

      {/* Hero Section */}
      <section className="hero" role="region" aria-label="Hero">
        <div className="hero-container container">
          <h1 className="hero-title">
            Emergency Response.<br />
            <span className="hero-accent">Simplified.</span>
          </h1>
          <p className="hero-description">
            Connecting communities, coordinating resources, and saving lives through streamlined disaster management.
          </p>
          <div className="hero-actions">
            <Link to="/disasters" className="btn btn-primary" aria-label="View active disasters">
              View Active Disasters
            </Link>
            <Link to="/volunteer-signup" className="btn btn-secondary" aria-label="Become a volunteer">
              Become a Volunteer
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works" role="region" aria-label="How it works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps">

            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Disaster Registration</h3>
                <p>Emergency coordinators register active disasters and establish relief camps in affected areas.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Volunteer Deployment</h3>
                <p>Trained volunteers sign up and are strategically assigned to camps based on skills and location.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Resource Coordination</h3>
                <p>Camps request essential resources while donors contribute supplies, creating an efficient aid network.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="impact" role="region" aria-label="Impact">
        <div className="container">
          <div className="impact-grid">
            <div className="impact-stat">
              <div className="stat-number">50+</div>
              <div className="stat-label">Cities Protected</div>
            </div>
            <div className="impact-stat">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Lives Saved</div>
            </div>
            <div className="impact-stat">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Response Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="cta" role="region" aria-label="Call to action">
        <div className="container">
          <Card variant="elevated" className="cta-card">
            <h2>Ready to Make a Difference?</h2>
            <p>Join our network of emergency responders and help build resilient communities.</p>
            <div className="cta-actions">
              <Link to="/signup" className="btn btn-primary" aria-label="Get started">
                Get Started
              </Link>
              <Link to="/donate" className="btn btn-outline" aria-label="Support the cause">
                Support the Cause
              </Link>
            </div>
          </Card>
        </div>
      </section>

    </div>
  );
}
