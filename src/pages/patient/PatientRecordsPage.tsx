import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import type { MedicalRecord, Profile } from '@/types';
import { FileText, Download, Calendar } from 'lucide-react';

interface RecordWithDetails extends MedicalRecord {
  doctor_profiles: Profile;
  appointments: { appointment_date: string; appointment_time: string };
}

export function PatientRecordsPage() {
  const { profile } = useAppSelector((s) => s.auth);
  const [records, setRecords] = useState<RecordWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('medical_records')
      .select('*, doctor_profiles:doctor_id(*), appointments:appointment_id(appointment_date, appointment_time)')
      .eq('patient_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRecords((data || []) as RecordWithDetails[]);
        setLoading(false);
      });
  }, [profile]);

  return (
    <DashboardLayout role="patient">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Medical Records</h1>
        <p className="text-slate-500 mt-1">Your prescriptions and medical documents</p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-slate-200" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No medical records yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {records.map((rec) => (
            <div key={rec.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{rec.title}</h3>
                  <p className="text-sm text-slate-500">By {rec.doctor_profiles?.full_name}</p>
                </div>
              </div>
              {rec.description && (
                <p className="text-sm text-slate-600 mb-3">{rec.description}</p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(rec.created_at).toLocaleDateString()}
                </div>
                <a
                  href={rec.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-teal-600 hover:underline font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
