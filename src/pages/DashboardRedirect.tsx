import { useAppSelector } from '@/store/hooks';
import { Navigate } from 'react-router-dom';
import { PatientDashboard } from '@/pages/patient/PatientDashboard';
import { DoctorDashboard } from '@/pages/doctor/DoctorDashboard';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';

export function DashboardRedirect() {
  const { profile } = useAppSelector((s) => s.auth);

  if (!profile) return <Navigate to="/login" replace />;

  if (profile.role === 'patient') return <PatientDashboard />;
  if (profile.role === 'doctor') return <DoctorDashboard />;
  if (profile.role === 'admin') return <AdminDashboard />;

  return <Navigate to="/login" replace />;
}
