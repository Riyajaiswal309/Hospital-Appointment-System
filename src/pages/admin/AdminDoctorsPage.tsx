import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import type { Profile, DoctorProfile, Specialization } from '@/types';
import { addToast } from '@/store/slices/uiSlice';
import { CheckCircle, XCircle, Stethoscope } from 'lucide-react';

interface DoctorWithProfile {
  id: string;
  doctor_id: string;
  bio: string | null;
  consultation_fee: number;
  experience_years: number;
  education: string | null;
  available_days: string[];
  profiles: Profile;
  specializations: Specialization | null;
}

export function AdminDoctorsPage() {
  const dispatch = useAppDispatch();
  const [doctors, setDoctors] = useState<DoctorWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('doctor_profiles')
      .select('*, profiles!inner(*), specializations(*)')
      .order('created_at', { ascending: false });
    setDoctors((data || []) as DoctorWithProfile[]);
    setLoading(false);
  };

  const handleApprove = async (doctorId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: true })
      .eq('id', doctorId);
    if (error) {
      dispatch(addToast({ message: error.message, type: 'error' }));
    } else {
      dispatch(addToast({ message: 'Doctor approved successfully', type: 'success' }));
      fetchDoctors();
    }
  };

  const handleReject = async (doctorId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: false })
      .eq('id', doctorId);
    if (error) {
      dispatch(addToast({ message: error.message, type: 'error' }));
    } else {
      dispatch(addToast({ message: 'Doctor rejected', type: 'info' }));
      fetchDoctors();
    }
  };

  const filtered = filter === 'all'
    ? doctors
    : filter === 'pending'
    ? doctors.filter((d) => !d.profiles.is_approved)
    : doctors.filter((d) => d.profiles.is_approved);

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Manage Doctors</h1>
        <p className="text-slate-500 mt-1">Approve and manage doctor registrations</p>
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'approved'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
            <div key={i} className="h-24 bg-white rounded-xl border border-slate-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No doctors found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((doc) => (
            <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center text-teal-700 font-semibold">
                    {doc.profiles?.full_name?.charAt(0) || 'D'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{doc.profiles?.full_name}</h3>
                    <p className="text-sm text-slate-500">
                      {doc.specializations?.name || 'No specialization'} · ₹{doc.consultation_fee} · {doc.experience_years} yrs exp
                    </p>
                    {doc.education && (
                      <p className="text-xs text-slate-400 mt-0.5">{doc.education}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">{doc.profiles?.email}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      doc.profiles?.is_approved
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {doc.profiles?.is_approved ? 'Approved' : 'Pending'}
                  </span>
                  {!doc.profiles?.is_approved && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(doc.doctor_id)}
                        className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2.5 py-1.5 rounded-lg font-medium hover:bg-green-100"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(doc.doctor_id)}
                        className="flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2.5 py-1.5 rounded-lg font-medium hover:bg-red-100"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
