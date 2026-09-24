import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import type { Appointment, Profile, Prescription, MedicalRecord } from '@/types';
import { Calendar, Clock, FileText, Download, Pill, Stethoscope } from 'lucide-react';

interface AppointmentWithDetails extends Appointment {
  doctor_profiles: Profile;
}

export function PatientAppointmentsPage() {
  const { profile } = useAppSelector((s) => s.auth);
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [prescriptions, setPrescriptions] = useState<Record<string, Prescription[]>>({});
  const [records, setRecords] = useState<Record<string, MedicalRecord[]>>({});

  useEffect(() => {
    if (!profile) return;
    fetchAppointments();
  }, [profile]);

  const fetchAppointments = async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('appointments')
      .select('*, doctor_profiles:doctor_id(*)')
      .eq('patient_id', profile.id)
      .order('appointment_date', { ascending: false });

    const appts = (data || []) as unknown as AppointmentWithDetails[];
    setAppointments(appts);

    const aptIds = appts.map((a) => a.id);
    if (aptIds.length > 0) {
      const { data: presc } = await supabase
        .from('prescriptions')
        .select('*')
        .in('appointment_id', aptIds);
      const prescMap: Record<string, Prescription[]> = {};
      (presc || []).forEach((p: Prescription) => {
        if (!prescMap[p.appointment_id]) prescMap[p.appointment_id] = [];
        prescMap[p.appointment_id].push(p);
      });
      setPrescriptions(prescMap);

      const { data: recs } = await supabase
        .from('medical_records')
        .select('*')
        .in('appointment_id', aptIds);
      const recMap: Record<string, MedicalRecord[]> = {};
      (recs || []).forEach((r: MedicalRecord) => {
        if (!recMap[r.appointment_id]) recMap[r.appointment_id] = [];
        recMap[r.appointment_id].push(r);
      });
      setRecords(recMap);
    }
    setLoading(false);
  };

  const handleCancel = async (id: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id);
    if (!error) {
      fetchAppointments();
    }
  };

  const filtered = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  return (
    <DashboardLayout role="patient">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
        <p className="text-slate-500 mt-1">View and manage your appointments</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((f) => (
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
            <div key={i} className="h-32 bg-white rounded-xl border border-slate-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No appointments found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((apt) => (
            <div key={apt.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center text-teal-700 font-semibold">
                    {apt.doctor_profiles?.full_name?.charAt(0) || 'D'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{apt.doctor_profiles?.full_name}</h3>
                    <p className="text-sm text-slate-500">{apt.reason || 'General consultation'}</p>
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

              <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {apt.appointment_date}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {apt.appointment_time}
                </div>
              </div>

              {apt.diagnosis && (
                <div className="mb-3 p-3 rounded-lg bg-slate-50">
                  <p className="text-xs font-medium text-slate-500 mb-1">Diagnosis</p>
                  <p className="text-sm text-slate-700">{apt.diagnosis}</p>
                </div>
              )}

              {/* Prescriptions */}
              {prescriptions[apt.id]?.length > 0 && (
                <div className="mb-3 p-3 rounded-lg bg-teal-50 border border-teal-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className="w-4 h-4 text-teal-600" />
                    <p className="text-sm font-medium text-teal-800">Prescription</p>
                  </div>
                  {prescriptions[apt.id].map((p) => (
                    <div key={p.id} className="space-y-1">
                      {p.medications.map((m, i) => (
                        <div key={i} className="text-sm text-slate-700">
                          <span className="font-medium">{m.name}</span> - {m.dosage}, {m.frequency}, {m.duration}
                        </div>
                      ))}
                      {p.notes && <p className="text-xs text-slate-500 mt-1">{p.notes}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Medical Records */}
              {records[apt.id]?.length > 0 && (
                <div className="mb-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-800">Medical Records</p>
                  </div>
                  {records[apt.id].map((r) => (
                    <a
                      key={r.id}
                      href={r.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {r.title}
                    </a>
                  ))}
                </div>
              )}

              {(apt.status === 'pending' || apt.status === 'confirmed') && (
                <button
                  onClick={() => handleCancel(apt.id)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Cancel Appointment
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
