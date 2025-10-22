import { Routes, Route, Navigate } from 'react-router-dom';

import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import NetworkStatus from './components/NetworkStatus.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Statistics from './pages/Statistics.jsx';
import UserProfile from './pages/UserProfile.jsx';
import DisasterList from './pages/DisasterList.jsx';
import DisasterDetail from './pages/DisasterDetail.jsx';
import CampDetail from './pages/CampDetail.jsx';
import VolunteerSignup from './pages/VolunteerSignup.jsx';
import DonationForm from './pages/DonationForm.jsx';
import AdminManagement from './pages/AdminManagement.jsx';
import CampCoordinator from './pages/CampCoordinator.jsx';
import Reports from './pages/Reports.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <div className="app-root">
      <NetworkStatus />
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

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/statistics"
            element={
              <ProtectedRoute>
                <Statistics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator"
            element={
              <ProtectedRoute requiredRole={["camp_coordinator", "admin"]}>
                <CampCoordinator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute requiredRole={["camp_coordinator", "admin"]}>
                <Reports />
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
