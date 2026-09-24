import { useEffect, useState, type FormEvent } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import type { Specialization, DoctorProfile, Profile, DoctorSlot } from '@/types';
import { Search, Filter, Star, Clock, DollarSign, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { addToast } from '@/store/slices/uiSlice';
import { useNavigate } from 'react-router-dom';

interface DoctorSearchResult {
  id: string;
  doctor_id: string;
  bio: string | null;
  consultation_fee: number;
  experience_years: number;
  education: string | null;
  rating: number;
  available_days: string[];
  profiles: Profile;
  specializations: Specialization | null;
}

export function FindDoctorsPage() {
  const { profile } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [doctors, setDoctors] = useState<DoctorSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specFilter, setSpecFilter] = useState('');
  const [feeRange, setFeeRange] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorSearchResult | null>(null);
  const [slots, setSlots] = useState<DoctorSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    supabase.from('specializations').select('*').order('name').then(({ data }) => {
      setSpecializations(data || []);
    });
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    let query = supabase
      .from('doctor_profiles')
      .select('*, profiles!inner(*), specializations(*)')
      .order('rating', { ascending: false });

    if (specFilter) {
      query = query.eq('specialization_id', specFilter);
    }
    if (feeRange) {
      const [min, max] = feeRange.split('-');
      if (max) {
        query = query.gte('consultation_fee', parseInt(min)).lte('consultation_fee', parseInt(max));
      } else {
        query = query.gte('consultation_fee', parseInt(min.replace('+', '')));
      }
    }

    const { data } = await query;
    let results = (data || []) as DoctorSearchResult[];

    if (search) {
      results = results.filter(
        (d) =>
          d.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          d.specializations?.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setDoctors(results);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchDoctors, 300);
    return () => clearTimeout(timer);
  }, [search, specFilter, feeRange]);

  const handleSelectDoctor = async (doctor: DoctorSearchResult) => {
    setSelectedDoctor(doctor);
    setSlotsLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('doctor_slots')
      .select('*')
      .eq('doctor_id', doctor.doctor_id)
      .eq('is_booked', false)
      .gte('slot_date', today)
      .order('slot_date', { ascending: true })
      .order('slot_time', { ascending: true });
    setSlots(data || []);
    setSlotsLoading(false);
  };

  const handleBookSlot = async (slot: DoctorSlot) => {
    if (!profile || !selectedDoctor) return;
    const { data: existing } = await supabase
      .from('appointments')
      .select('id')
      .eq('slot_id', slot.id)
      .neq('status', 'cancelled')
      .maybeSingle();

    if (existing) {
      dispatch(addToast({ message: 'This slot was just booked. Please choose another.', type: 'error' }));
      setSlots((prev) => prev.filter((s) => s.id !== slot.id));
      return;
    }

    navigate('/payment', {
      state: {
        slot,
        doctor: selectedDoctor,
      },
    });
  };

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.slot_date]) acc[slot.slot_date] = [];
    acc[slot.slot_date].push(slot);
    return acc;
  }, {} as Record<string, DoctorSlot[]>);

  return (
    <DashboardLayout role="patient">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Find Doctors</h1>
        <p className="text-slate-500 mt-1">Search and book appointments with specialists</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="grid md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by doctor or specialization..."
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={specFilter}
            onChange={(e) => setSpecFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Specializations</option>
            {specializations.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value={feeRange}
            onChange={(e) => setFeeRange(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Any Fee</option>
            <option value="0-500">Under ₹500</option>
            <option value="500-1000">₹500 - ₹1000</option>
            <option value="1000-2000">₹1000 - ₹2000</option>
            <option value="2000+">₹2000+</option>
          </select>
        </div>
      </div>

      {selectedDoctor ? (
        /* Slot booking view */
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedDoctor(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{selectedDoctor.profiles.full_name}</h2>
                <p className="text-sm text-slate-500">
                  {selectedDoctor.specializations?.name} · ₹{selectedDoctor.consultation_fee}
                </p>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-slate-800">{monthName}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-1.5 rounded-lg hover:bg-slate-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-1.5 rounded-lg hover:bg-slate-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-slate-400 pb-2">{d}</div>
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const daySlots = slotsByDate[dateStr] || [];
                const hasSlots = daySlots.length > 0;
                const isPast = new Date(dateStr) < new Date(new Date().toDateString());
                return (
                  <div
                    key={day}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm border ${
                      isPast
                        ? 'border-slate-100 text-slate-300'
                        : hasSlots
                        ? 'border-teal-200 bg-teal-50 text-teal-700 font-medium cursor-pointer hover:bg-teal-100'
                        : 'border-slate-100 text-slate-400'
                    }`}
                    title={hasSlots ? `${daySlots.length} slots available` : ''}
                  >
                    {day}
                    {hasSlots && !isPast && (
                      <span className="text-[10px] text-teal-500">{daySlots.length} slots</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Available slots list */}
          {slotsLoading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-lg" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No available slots. Please check back later.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(slotsByDate).map(([date, daySlots]) => (
                <div key={date}>
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {daySlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => handleBookSlot(slot)}
                        className="px-4 py-2 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 text-sm font-medium hover:bg-teal-100 transition-colors"
                      >
                        {slot.slot_time}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Doctor list */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                <div className="h-20 bg-slate-100 rounded-lg mb-3" />
                <div className="h-4 bg-slate-100 rounded mb-2" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))
          ) : doctors.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Filter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No doctors found matching your filters</p>
            </div>
          ) : (
            doctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleSelectDoctor(doc)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center text-teal-700 font-semibold">
                    {doc.profiles?.full_name?.charAt(0) || 'D'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{doc.profiles?.full_name}</h3>
                    <p className="text-sm text-teal-600">{doc.specializations?.name || 'General'}</p>
                  </div>
                  {doc.rating > 0 && (
                    <div className="flex items-center gap-1 text-sm text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {doc.rating}
                    </div>
                  )}
                </div>
                {doc.bio && (
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">{doc.bio}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    ₹{doc.consultation_fee}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {doc.experience_years} yrs exp
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
