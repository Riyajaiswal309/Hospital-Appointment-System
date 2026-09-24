import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { store } from '@/store';
import { AuthProvider } from '@/components/AuthProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ToastContainer } from '@/components/ToastContainer';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardRedirect } from '@/pages/DashboardRedirect';
import { FindDoctorsPage } from '@/pages/patient/FindDoctorsPage';
import { PatientAppointmentsPage } from '@/pages/patient/PatientAppointmentsPage';
import { PatientRecordsPage } from '@/pages/patient/PatientRecordsPage';
import { DoctorProfilePage } from '@/pages/doctor/DoctorProfilePage';
import { DoctorAppointmentsPage } from '@/pages/doctor/DoctorAppointmentsPage';
import { DoctorSlotsPage } from '@/pages/doctor/DoctorSlotsPage';
import { AdminDoctorsPage } from '@/pages/admin/AdminDoctorsPage';
import { AdminSpecializationsPage } from '@/pages/admin/AdminSpecializationsPage';
import { AdminAppointmentsPage } from '@/pages/admin/AdminAppointmentsPage';
import { PaymentPage } from '@/pages/PaymentPage';

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRedirect />
                </ProtectedRoute>
              }
            />
            {/* Patient routes */}
            <Route
              path="/patient/find-doctors"
              element={
                <ProtectedRoute roles={['patient']}>
                  <FindDoctorsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/appointments"
              element={
                <ProtectedRoute roles={['patient']}>
                  <PatientAppointmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/records"
              element={
                <ProtectedRoute roles={['patient']}>
                  <PatientRecordsPage />
                </ProtectedRoute>
              }
            />
            {/* Doctor routes */}
            <Route
              path="/doctor/profile"
              element={
                <ProtectedRoute roles={['doctor']}>
                  <DoctorProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/appointments"
              element={
                <ProtectedRoute roles={['doctor']}>
                  <DoctorAppointmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/slots"
              element={
                <ProtectedRoute roles={['doctor']}>
                  <DoctorSlotsPage />
                </ProtectedRoute>
              }
            />
            {/* Admin routes */}
            <Route
              path="/admin/doctors"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminDoctorsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/specializations"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminSpecializationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/appointments"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminAppointmentsPage />
                </ProtectedRoute>
              }
            />
            {/* Payment */}
            <Route
              path="/payment"
              element={
                <ProtectedRoute roles={['patient']}>
                  <PaymentPage />
                </ProtectedRoute>
              }
            />
          </Routes>
          <ToastContainer />
        </BrowserRouter>
      </AuthProvider>
    </Provider>
  );
}

export default App;
