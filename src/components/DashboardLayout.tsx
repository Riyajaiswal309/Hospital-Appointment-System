import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { Stethoscope, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAppDispatch } from '@/store/hooks';
import { signOut } from '@/store/slices/authSlice';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const patientNav: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: null },
  { label: 'Find Doctors', path: '/patient/find-doctors', icon: null },
  { label: 'My Appointments', path: '/patient/appointments', icon: null },
  { label: 'Medical Records', path: '/patient/records', icon: null },
];

const doctorNav: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: null },
  { label: 'My Profile', path: '/doctor/profile', icon: null },
  { label: 'Appointments', path: '/doctor/appointments', icon: null },
  { label: 'Slots', path: '/doctor/slots', icon: null },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: null },
  { label: 'Doctors', path: '/admin/doctors', icon: null },
  { label: 'Specializations', path: '/admin/specializations', icon: null },
  { label: 'Appointments', path: '/admin/appointments', icon: null },
];

export function DashboardLayout({ children, role }: { children: ReactNode; role: UserRole }) {
  const { profile } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!profile) return <Navigate to="/login" replace />;

  const navItems = role === 'patient' ? patientNav : role === 'doctor' ? doctorNav : adminNav;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    dispatch(signOut());
  };

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 z-40 transition-transform duration-300 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-800 text-lg">MediBook</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-200">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-slate-800 truncate">{profile.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{profile.email}</p>
            <span className="inline-block mt-1.5 text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
              {roleLabel}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <span className="font-bold text-slate-800">MediBook</span>
          <div className="w-6" />
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
