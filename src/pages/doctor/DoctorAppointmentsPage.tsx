import { useEffect, useState, type FormEvent } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import type { Appointment, Profile, Prescription, MedicalRecord } from '@/types';
import { addToast } from '@/store/slices/uiSlice';
import { CheckCircle, XCircle, Pill, FileText, Plus, Trash2, Stethoscope } from 'lucide-react';

interface AppointmentWithPatient extends Appointment {
  patient_profiles: Profile;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export function DoctorAppointmentsPage() {
  const { profile } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedApt, setSelectedApt] = useState<AppointmentWithPatient | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [medications, setMedications] = useState<Medication[]>([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' },
  ]);
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState<Record<string, Prescription[]>>({});
  const [savingPresc, setSavingPresc] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [profile]);

  const fetchAppointments = async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('appointments')
      .select('*, patient_profiles:patient_id(*)')
      .eq('doctor_id', profile.id)
      .order('appointment_date', { ascending: false });
    setAppointments((data || []) as AppointmentWithPatient[]);

    const aptIds = (data || []).map((a: Appointment) => a.id);
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
    }
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

  const handleSaveDiagnosis = async (id: string) => {
    const { error } = await supabase.from('appointments').update({ diagnosis }).eq('id', id);
    if (error) {
      dispatch(addToast({ message: error.message, type: 'error' }));
    } else {
      dispatch(addToast({ message: 'Diagnosis saved', type: 'success' }));
      fetchAppointments();
    }
  };

  const handleSavePrescription = async (e: FormEvent, aptId: string) => {
    e.preventDefault();
    if (!profile || !selectedApt) return;
    setSavingPresc(true);

    const validMeds = medications.filter((m) => m.name.trim());
    if (validMeds.length === 0) {
      dispatch(addToast({ message: 'Add at least one medication', type: 'error' }));
      setSavingPresc(false);
      return;
    }

    const { error } = await supabase.from('prescriptions').insert({
      appointment_id: aptId,
      patient_id: selectedApt.patient_id,
      doctor_id: profile.id,
      medications: validMeds,
      notes: prescriptionNotes,
    });

    if (error) {
      dispatch(addToast({ message: error.message, type: 'error' }));
    } else {
      dispatch(addToast({ message: 'Prescription saved', type: 'success' }));
      setMedications([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
      setPrescriptionNotes('');
      setSelectedApt(null);
      fetchAppointments();
    }
    setSavingPresc(false);
  };

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    setMedications(medications.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const filtered = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  return (
    <DashboardLayout role="doctor">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
        <p className="text-slate-500 mt-1">Manage patient appointments and prescriptions</p>
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
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No appointments found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((apt) => (
            <div key={apt.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center text-teal-700 font-semibold">
                    {apt.patient_profiles?.full_name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{apt.patient_profiles?.full_name}</h3>
                    <p className="text-sm text-slate-500">
                      {apt.appointment_date} at {apt.appointment_time} · {apt.reason || 'Consultation'}
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

              {apt.diagnosis && (
                <div className="mb-3 p-3 rounded-lg bg-slate-50">
                  <p className="text-xs font-medium text-slate-500 mb-1">Diagnosis</p>
                  <p className="text-sm text-slate-700">{apt.diagnosis}</p>
                </div>
              )}

              {prescriptions[apt.id]?.length > 0 && (
                <div className="mb-3 p-3 rounded-lg bg-teal-50 border border-teal-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Pill className="w-4 h-4 text-teal-600" />
                    <p className="text-sm font-medium text-teal-800">Prescription</p>
                  </div>
                  {prescriptions[apt.id].map((p) => (
                    <div key={p.id} className="text-sm text-slate-700">
                      {p.medications.map((m, i) => (
                        <span key={i}>
                          {m.name} ({m.dosage}, {m.frequency}){i < p.medications.length - 1 ? '; ' : ''}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {apt.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(apt.id, 'confirmed')}
                      className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg font-medium hover:bg-green-100"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Confirm
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(apt.id, 'rejected')}
                      className="flex items-center gap-1.5 text-sm text-red-700 bg-red-50 px-3 py-1.5 rounded-lg font-medium hover:bg-red-100"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}
                {apt.status === 'confirmed' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(apt.id, 'completed')}
                      className="flex items-center gap-1.5 text-sm text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark Completed
                    </button>
                    <button
                      onClick={() => {
                        setSelectedApt(apt);
                        setDiagnosis(apt.diagnosis || '');
                      }}
                      className="flex items-center gap-1.5 text-sm text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg font-medium hover:bg-teal-100"
                    >
                      <Stethoscope className="w-4 h-4" />
                      Add Diagnosis & Prescription
                    </button>
                  </>
                )}
                {apt.status === 'completed' && !prescriptions[apt.id]?.length && (
                  <button
                    onClick={() => {
                      setSelectedApt(apt);
                      setDiagnosis(apt.diagnosis || '');
                    }}
                    className="flex items-center gap-1.5 text-sm text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg font-medium hover:bg-teal-100"
                  >
                    <Pill className="w-4 h-4" />
                    Add Prescription
                  </button>
                )}
              </div>

              {/* Diagnosis + Prescription form */}
              {selectedApt?.id === apt.id && (
                <form
                  onSubmit={(e) => handleSavePrescription(e, apt.id)}
                  className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Diagnosis</label>
                    <textarea
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      onBlur={() => handleSaveDiagnosis(apt.id)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Enter diagnosis..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700">Medications</label>
                      <button
                        type="button"
                        onClick={addMedication}
                        className="flex items-center gap-1 text-xs text-teal-600 font-medium hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Medication
                      </button>
                    </div>
                    <div className="space-y-2">
                      {medications.map((med, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-start">
                          <input
                            type="text"
                            placeholder="Medicine name"
                            value={med.name}
                            onChange={(e) => updateMedication(i, 'name', e.target.value)}
                            className="col-span-12 md:col-span-3 px-2 py-1.5 rounded border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                          <input
                            type="text"
                            placeholder="Dosage (500mg)"
                            value={med.dosage}
                            onChange={(e) => updateMedication(i, 'dosage', e.target.value)}
                            className="col-span-6 md:col-span-2 px-2 py-1.5 rounded border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                          <input
                            type="text"
                            placeholder="Frequency (2x/day)"
                            value={med.frequency}
                            onChange={(e) => updateMedication(i, 'frequency', e.target.value)}
                            className="col-span-6 md:col-span-2 px-2 py-1.5 rounded border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                          <input
                            type="text"
                            placeholder="Duration (7 days)"
                            value={med.duration}
                            onChange={(e) => updateMedication(i, 'duration', e.target.value)}
                            className="col-span-6 md:col-span-2 px-2 py-1.5 rounded border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                          <input
                            type="text"
                            placeholder="Instructions"
                            value={med.instructions}
                            onChange={(e) => updateMedication(i, 'instructions', e.target.value)}
                            className="col-span-10 md:col-span-2 px-2 py-1.5 rounded border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                          {medications.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMedication(i)}
                              className="col-span-2 md:col-span-1 text-red-400 hover:text-red-600 flex items-center justify-center py-1.5"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                    <textarea
                      value={prescriptionNotes}
                      onChange={(e) => setPrescriptionNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Additional notes for the patient..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={savingPresc}
                      className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
                    >
                      {savingPresc ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <>
                          <FileText className="w-4 h-4" />
                          Save Prescription
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedApt(null)}
                      className="text-sm text-slate-500 px-4 py-2 rounded-lg hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
