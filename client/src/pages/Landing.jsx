// src/pages/Landing.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from '../services/auth.js';
import Card from '../components/Card.jsx';
import '../styles/landing.css';

export default function Landing() {
  const user = isAuthenticated() ? getCurrentUser() : null;

  const getHeroActions = () => {
    if (!user) {
      // Public users
      return (
        <div className="hero-actions">
          <Link to="/disasters" className="btn btn-primary" aria-label="View active disasters">
            View Active Disasters
          </Link>
          <Link to="/volunteer-signup" className="btn btn-secondary" aria-label="Become a volunteer">
            Become a Volunteer
          </Link>
        </div>
      );
    }

    // Role-specific actions
    if (user.role === 'admin') {
      return (
        <div className="hero-actions">
          <Link to="/dashboard" className="btn btn-primary">
            Admin Dashboard
          </Link>
          <Link to="/admin/disasters" className="btn btn-secondary">
            Manage Disasters
          </Link>
        </div>
      );
    } else if (user.role === 'camp_coordinator') {
      return (
        <div className="hero-actions">
          <Link to="/dashboard" className="btn btn-primary">
            Coordinator Dashboard
          </Link>
          <Link to="/coordinator/volunteers" className="btn btn-secondary">
            Manage Volunteers
          </Link>
        </div>
      );
    } else {
      // Regular user
      return (
        <div className="hero-actions">
          <Link to="/volunteer-portal" className="btn btn-primary">
            My Volunteer Portal
          </Link>
          <Link to="/disasters" className="btn btn-secondary">
            View Disasters
          </Link>
        </div>
      );
    }
  };

  const getHeroContent = () => {
    if (user) {
      const roleTitle = user.role === 'admin' ? 'Administrator' : 
                       user.role === 'camp_coordinator' ? 'Camp Coordinator' : 'Volunteer';
      
      return {
        title: `Welcome back, ${roleTitle}.`,
        subtitle: `Continue your important work in disaster management.`,
        description: user.role === 'admin' 
          ? "Manage disasters, approve volunteers, and coordinate relief efforts across the system."
          : user.role === 'camp_coordinator'
          ? "Coordinate your camps, manage volunteers, and request resources for effective disaster response."
          : "Access your volunteer profile, view assignments, and contribute to disaster relief efforts."
      };
    }

    return {
      title: "Emergency Response.",
      subtitle: "Simplified.",
      description: "Connecting communities, coordinating resources, and saving lives through streamlined disaster management."
    };
  };

  const heroContent = getHeroContent();

  return (
    <div className="landing">

      {/* Hero Section */}
      <section className="hero" role="region" aria-label="Hero">
        <div className="hero-container container">
          <h1 className="hero-title">
            {user ? (
              heroContent.title
            ) : (
              <>
                {heroContent.title}<br />
                <span className="hero-accent">{heroContent.subtitle}</span>
              </>
            )}
            {user && <span className="hero-accent">{heroContent.subtitle}</span>}
          </h1>
          <p className="hero-description">
            {heroContent.description}
          </p>
          {getHeroActions()}
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
            {user ? (
              <>
                <h2>Continue Your Impact</h2>
                <p>
                  {user.role === 'admin' 
                    ? "Manage the system effectively and ensure smooth disaster response operations."
                    : user.role === 'camp_coordinator'
                    ? "Coordinate your camps and volunteers to maximize relief efforts."
                    : "Stay engaged with your volunteer activities and help save lives."
                  }
                </p>
                <div className="cta-actions">
                  {user.role === 'admin' ? (
                    <>
                      <Link to="/admin/volunteers" className="btn btn-primary">
                        Review Volunteers
                      </Link>
                      <Link to="/admin/requests" className="btn btn-outline">
                        Approve Requests
                      </Link>
                    </>
                  ) : user.role === 'camp_coordinator' ? (
                    <>
                      <Link to="/coordinator/volunteers" className="btn btn-primary">
                        Manage Volunteers
                      </Link>
                      <Link to="/coordinator/requests" className="btn btn-outline">
                        Create Request
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/volunteer-portal" className="btn btn-primary">
                        My Profile
                      </Link>
                      <Link to="/donate" className="btn btn-outline">
                        Make Donation
                      </Link>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2>Ready to Make a Difference?</h2>
                <p>Help save lives and support communities during disasters. No account needed - start helping today!</p>
                <div className="cta-actions">
                  <Link to="/volunteer-signup" className="btn btn-primary" aria-label="Become a volunteer">
                    Become a Volunteer
                  </Link>
                  <Link to="/donate" className="btn btn-outline" aria-label="Support the cause">
                    Donate Now
                  </Link>
                </div>
              </>
            )}
          </Card>
        </div>
      </section>

    </div>
  );
}
