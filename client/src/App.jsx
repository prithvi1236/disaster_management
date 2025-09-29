import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DisasterList from './pages/DisasterList.jsx';
import DisasterDetail from './pages/DisasterDetail.jsx';
import CampDetail from './pages/CampDetail.jsx';
import VolunteerSignup from './pages/VolunteerSignup.jsx';
import DonationForm from './pages/DonationForm.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <div className="app-root">
      <Header />

      <main>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/disasters" element={<DisasterList />} />
          <Route path="/disasters/:id" element={<DisasterDetail />} />
          <Route path="/camps/:id" element={<CampDetail />} />
          <Route path="/volunteer-signup" element={<VolunteerSignup />} />
          <Route path="/donate" element={<DonationForm />} />

          {/* Protected route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Legacy / convenience */}
          <Route path="/home" element={<Navigate to="/" replace />} />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
