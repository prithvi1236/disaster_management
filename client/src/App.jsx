import { Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import DisasterList from "./pages/DisasterList.jsx";
import DisasterDetail from "./pages/DisasterDetail.jsx";
import CampDetail from "./pages/CampDetail.jsx";
import VolunteerSignup from "./pages/VolunteerSignup.jsx";
import VolunteerPortal from "./pages/VolunteerPortal.jsx";
import DonationForm from "./pages/DonationForm.jsx";
import AdminVolunteers from "./pages/AdminVolunteers.jsx";
import AdminRequests from "./pages/AdminRequests.jsx";
import AdminDisasters from "./pages/AdminDisasters.jsx";
import AdminCoordinators from "./pages/AdminCoordinators.jsx";
import CoordinatorVolunteers from "./pages/CoordinatorVolunteers.jsx";
import CoordinatorCamps from "./pages/CoordinatorCamps.jsx";
import CoordinatorRequests from "./pages/CoordinatorRequests.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <div className="app-root">
      <Header />

      <main>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          <Route path="/disasters" element={<DisasterList />} />
          <Route path="/disasters/:id" element={<DisasterDetail />} />
          <Route path="/camps/:id" element={<CampDetail />} />
          <Route path="/volunteer-signup" element={<VolunteerSignup />} />
          <Route
            path="/volunteer-portal"
            element={
              <ProtectedRoute>
                <VolunteerPortal />
              </ProtectedRoute>
            }
          />
          <Route path="/donate" element={<DonationForm />} />

          {/* Admin routes */}
          <Route
            path="/admin/volunteers"
            element={
              <ProtectedRoute>
                <AdminVolunteers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/requests"
            element={
              <ProtectedRoute>
                <AdminRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/disasters"
            element={
              <ProtectedRoute>
                <AdminDisasters />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/coordinators"
            element={
              <ProtectedRoute>
                <AdminCoordinators />
              </ProtectedRoute>
            }
          />

          {/* Coordinator routes */}
          <Route
            path="/coordinator/volunteers"
            element={
              <ProtectedRoute>
                <CoordinatorVolunteers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/camps"
            element={
              <ProtectedRoute>
                <CoordinatorCamps />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/requests"
            element={
              <ProtectedRoute>
                <CoordinatorRequests />
              </ProtectedRoute>
            }
          />

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
