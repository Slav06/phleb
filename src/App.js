import React from 'react';
import { ChakraProvider, CSSReset } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';

// Landing Page
import NewLandingPage from './components/NewLandingPage';

// Patient Routes
import PatientLayout from './layouts/PatientLayout';
import PhlebotomistList from './components/patient/PhlebotomistList';
import PhlebotomistProfile from './components/patient/PhlebotomistProfile';
import BookingForm from './components/patient/BookingForm';

// Phlebotomist Routes
import PhlebotomistLayout from './layouts/PhlebotomistLayout';
import PhlebotomistDashboard from './components/phlebotomist/PhlebotomistDashboard';
import WorkingHoursForm from './components/phlebotomist/WorkingHoursForm';
import BloodDrawForm from './BloodDrawForm';
import LabDrawSummary from './components/phlebotomist/LabDrawSummary';
import AgreementSign from './components/phlebotomist/AgreementSign';

// Admin Routes
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import PhlebotomistManagement from './components/admin/PhlebotomistManagement';
import LabManagement from './components/admin/LabManagement';
import SubmissionsList from './components/admin/SubmissionsList';
import SubmissionDetail from './components/admin/SubmissionDetail';
import AdminLogin from './components/admin/AdminLogin';
import DoctorManagement from './components/admin/DoctorManagement';

// Shared Components
import Navigation from './components/shared/Navigation';

// Add this component before the App component
function AdminRouteGuard({ children }) {
  const location = useLocation();
  const adminUser = JSON.parse(localStorage.getItem('adminUser'));

  // If not logged in and not on login page, redirect to login
  if (!adminUser && location.pathname !== '/admin/login') {
    return <Navigate to="/admin/login" replace />;
  }

  // If logged in and on login page, redirect to admin dashboard
  if (adminUser && location.pathname === '/admin/login') {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function App() {
  return (
    <ChakraProvider>
      <CSSReset />
      <Router>
        <Routes>
          <Route path="/" element={<NewLandingPage />} />

          {/* Patient Routes */}
          <Route path="/patient/*" element={<PatientLayout />}>
            <Route index element={<PhlebotomistList />} />
            <Route path="phlebotomist/:id" element={<PhlebotomistProfile />} />
            <Route path="book/:phlebotomistId" element={<BookingForm />} />
          </Route>

          {/* Phlebotomist Routes (scoped by lab id) */}
          <Route path="/lab/:id/*" element={<PhlebotomistLayout />}> 
            <Route index element={<PhlebotomistDashboard />} />
            <Route path="new-blood-draw" element={<BloodDrawForm />} />
            <Route path="working-hours" element={<WorkingHoursForm />} />
            <Route path="patient" element={<BloodDrawForm isPatientMode={true} />} />
            <Route path="patient/:patientEmail" element={<BloodDrawForm isPatientMode={true} />} />
            <Route path="summary/:submissionId" element={<LabDrawSummary />} />
            <Route path="agreement" element={<AgreementSign />} />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <AdminRouteGuard>
                <AdminLayout />
              </AdminRouteGuard>
            }
          >
            <Route path="login" element={<AdminLogin />} />
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="phlebotomists" element={<PhlebotomistManagement />} />
            <Route path="labs" element={<LabManagement />} />
            <Route path="submissions" element={<SubmissionsList />} />
            <Route path="submissions/:id" element={<SubmissionDetail />} />
            <Route path="doctors" element={<DoctorManagement />} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App;
