import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import type { Appointment, Profile } from '@/types';
import { Calendar, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';

interface AppointmentWithPatient extends Appointment {
  patient_profiles: Profile;
}

export function DoctorDashboard() {
  const { profile } = useAppSelector((s) => s.auth);
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('appointments')
      .select('*, patient_profiles:patient_id(*)')
      .eq('doctor_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setAppointments((data || []) as AppointmentWithPatient[]);
        setLoading(false);
      });
  }, [profile]);

  if (!profile) return null;

  const pending = appointments.filter((a) => a.status === 'pending');
  const confirmed = appointments.filter((a) => a.status === 'confirmed');
  const completed = appointments.filter((a) => a.status === 'completed');

  const stats = [
    { label: 'Pending', value: pending.length, icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
    { label: 'Confirmed', value: confirmed.length, icon: Clock, color: 'text-blue-600 bg-blue-50' },
    { label: 'Completed', value: completed.length, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Total', value: appointments.length, icon: Users, color: 'text-teal-600 bg-teal-50' },
  ];

  return (
    <DashboardLayout role="doctor">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Welcome, Dr. {profile.full_name.split(' ').slice(-1)}</h1>
        <p className="text-slate-500 mt-1">Manage your appointments and patients</p>
        {!profile.is_approved && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
            Your account is pending admin approval. Some features may be limited.
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Appointments</h2>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No appointments yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 font-semibold">
                    {apt.patient_profiles?.full_name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{apt.patient_profiles?.full_name}</p>
                    <p className="text-xs text-slate-500">
                      {apt.appointment_date} at {apt.appointment_time}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    apt.status === 'confirmed'
                      ? 'bg-green-100 text-green-700'
                      : apt.status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : apt.status === 'completed'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
