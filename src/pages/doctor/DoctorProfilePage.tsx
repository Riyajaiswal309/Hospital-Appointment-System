import { useEffect, useState, type FormEvent } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import type { Specialization, DoctorProfile } from '@/types';
import { addToast } from '@/store/slices/uiSlice';
import { Save, DollarSign, Clock, Calendar } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function DoctorProfilePage() {
  const { profile } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [bio, setBio] = useState('');
  const [specializationId, setSpecializationId] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [education, setEducation] = useState('');
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [timeStart, setTimeStart] = useState('09:00');
  const [timeEnd, setTimeEnd] = useState('17:00');

  useEffect(() => {
    supabase.from('specializations').select('*').order('name').then(({ data }) => {
      setSpecializations(data || []);
    });
    if (profile) {
      supabase
        .from('doctor_profiles')
        .select('*')
        .eq('doctor_id', profile.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setDoctorProfile(data as DoctorProfile);
            setBio(data.bio || '');
            setSpecializationId(data.specialization_id || '');
            setConsultationFee(String(data.consultation_fee));
            setExperienceYears(String(data.experience_years));
            setEducation(data.education || '');
            setAvailableDays(data.available_days || []);
            setTimeStart(data.available_time_start || '09:00');
            setTimeEnd(data.available_time_end || '17:00');
          }
          setLoading(false);
        });
    }
  }, [profile]);

  const toggleDay = (day: string) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    const payload = {
      doctor_id: profile.id,
      specialization_id: specializationId || null,
      bio,
      consultation_fee: parseFloat(consultationFee) || 0,
      experience_years: parseInt(experienceYears) || 0,
      education,
      available_days: availableDays,
      available_time_start: timeStart,
      available_time_end: timeEnd,
    };

    let result;
    if (doctorProfile) {
      result = await supabase.from('doctor_profiles').update(payload).eq('id', doctorProfile.id);
    } else {
      result = await supabase.from('doctor_profiles').insert(payload);
    }

    if (result.error) {
      dispatch(addToast({ message: result.error.message, type: 'error' }));
    } else {
      dispatch(addToast({ message: 'Profile saved successfully', type: 'success' }));
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <DashboardLayout role="doctor">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-100 rounded w-1/4" />
          <div className="h-64 bg-slate-100 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="doctor">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">Manage your professional information</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Specialization</label>
          <select
            value={specializationId}
          onChange={(e) => setSpecializationId(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Select specialization</option>
            {specializations.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
          <textarea
            value={bio}
          onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Tell patients about your expertise..."
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Consultation Fee (₹)
            </label>
            <input
              type="number"
              required
              value={consultationFee}
              onChange={(e) => setConsultationFee(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Experience (years)</label>
            <input
              type="number"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="5"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Education</label>
          <input
            type="text"
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="MBBS, MD - Cardiology, AIIMS"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Available Days
          </label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  availableDays.includes(day)
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <Clock className="w-4 h-4 inline mr-1" />
              Start Time
            </label>
            <input
              type="time"
              value={timeStart}
              onChange={(e) => setTimeStart(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">End Time</label>
            <input
              type="time"
              value={timeEnd}
              onChange={(e) => setTimeEnd(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Profile
            </>
          )}
        </button>
      </form>
    </DashboardLayout>
  );
}
