import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import type { Appointment, Profile } from '@/types';
import { addToast } from '@/store/slices/uiSlice';
import { Calendar } from 'lucide-react';

interface AppointmentWithDetails extends Appointment {
  patient_profiles: Profile;
  doctor_profiles: Profile;
}

export function AdminAppointmentsPage() {
  const dispatch = useAppDispatch();
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('appointments')
      .select('*, patient_profiles:patient_id(*), doctor_profiles:doctor_id(*)')
      .order('created_at', { ascending: false });
    setAppointments((data || []) as AppointmentWithDetails[]);
    setLoading(false);
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) {
      dispatch(addToast({ message: error.message, type: 'error' }));
    } else {
      dispatch(addToast({ message: `Appointment ${status}`, type: 'success' }));
      fetchAppointments();
    }
  };

  const filtered = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">All Appointments</h1>
        <p className="text-slate-500 mt-1">View and manage all appointments on the platform</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-teal-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-slate-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No appointments found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Patient</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Doctor</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Time</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800">{apt.patient_profiles?.full_name}</td>
                    <td className="px-4 py-3 text-slate-800">{apt.doctor_profiles?.full_name}</td>
                    <td className="px-4 py-3 text-slate-500">{apt.appointment_date}</td>
                    <td className="px-4 py-3 text-slate-500">{apt.appointment_time}</td>
                    <td className="px-4 py-3">
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
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={apt.status}
                        onChange={(e) => handleStatusUpdate(apt.id, e.target.value)}
                        className="text-xs border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
