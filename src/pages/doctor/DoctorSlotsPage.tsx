import { useEffect, useState, type FormEvent } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import type { DoctorSlot } from '@/types';
import { addToast } from '@/store/slices/uiSlice';
import { Plus, Trash2, Calendar } from 'lucide-react';

export function DoctorSlotsPage() {
  const { profile } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const [slots, setSlots] = useState<DoctorSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotDate, setSlotDate] = useState('');
  const [slotTime, setSlotTime] = useState('09:00');

  useEffect(() => {
    fetchSlots();
  }, [profile]);

  const fetchSlots = async () => {
    if (!profile) return;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('doctor_slots')
      .select('*')
      .eq('doctor_id', profile.id)
      .gte('slot_date', today)
      .order('slot_date', { ascending: true })
      .order('slot_time', { ascending: true });
    setSlots(data || []);
    setLoading(false);
  };

  const handleAddSlot = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile || !slotDate) return;

    const { data: existing } = await supabase
      .from('doctor_slots')
      .select('id')
      .eq('doctor_id', profile.id)
      .eq('slot_date', slotDate)
      .eq('slot_time', slotTime)
      .maybeSingle();

    if (existing) {
      dispatch(addToast({ message: 'This slot already exists', type: 'error' }));
      return;
    }

    const { error } = await supabase.from('doctor_slots').insert({
      doctor_id: profile.id,
      slot_date: slotDate,
      slot_time: slotTime,
    });

    if (error) {
      dispatch(addToast({ message: error.message, type: 'error' }));
    } else {
      dispatch(addToast({ message: 'Slot added successfully', type: 'success' }));
      setSlotDate('');
      fetchSlots();
    }
  };

  const handleDeleteSlot = async (id: string) => {
    const { error } = await supabase.from('doctor_slots').delete().eq('id', id);
    if (error) {
      dispatch(addToast({ message: error.message, type: 'error' }));
    } else {
      dispatch(addToast({ message: 'Slot deleted', type: 'success' }));
      fetchSlots();
    }
  };

  const handleBulkGenerate = async () => {
    if (!profile) return;
    const start = new Date();
    const newSlots: { doctor_id: string; slot_date: string; slot_time: string }[] = [];
    const times = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

    for (let i = 0; i < 14; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const { data: docProfile } = await supabase
        .from('doctor_profiles')
        .select('available_days')
        .eq('doctor_id', profile.id)
        .maybeSingle();

      if (docProfile?.available_days?.includes(dayName) || !docProfile) {
        const dateStr = date.toISOString().split('T')[0];
        times.forEach((t) => {
          newSlots.push({ doctor_id: profile.id, slot_date: dateStr, slot_time: t });
        });
      }
    }

    if (newSlots.length > 0) {
      const { error } = await supabase.from('doctor_slots').upsert(newSlots, {
        onConflict: 'doctor_id,slot_date,slot_time',
        ignoreDuplicates: true,
      });
      if (error) {
        dispatch(addToast({ message: error.message, type: 'error' }));
      } else {
        dispatch(addToast({ message: `Generated ${newSlots.length} slots for next 2 weeks`, type: 'success' }));
        fetchSlots();
      }
    }
  };

  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.slot_date]) acc[slot.slot_date] = [];
    acc[slot.slot_date].push(slot);
    return acc;
  }, {} as Record<string, DoctorSlot[]>);

  return (
    <DashboardLayout role="doctor">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Manage Slots</h1>
        <p className="text-slate-500 mt-1">Create time slots for patient bookings</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Add Single Slot</h2>
          <form onSubmit={handleAddSlot} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={slotDate}
                onChange={(e) => setSlotDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Time</label>
              <input
                type="time"
                required
                value={slotTime}
                onChange={(e) => setSlotTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Slot
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={handleBulkGenerate}
              className="w-full flex items-center justify-center gap-2 border border-teal-200 text-teal-700 py-2.5 rounded-lg font-medium hover:bg-teal-50 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Auto-generate 2 weeks
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Available Slots</h2>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-lg" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No slots created yet</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {Object.entries(slotsByDate).map(([date, daySlots]) => (
                <div key={date}>
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border ${
                          slot.is_booked
                            ? 'border-slate-200 bg-slate-50 text-slate-400'
                            : 'border-teal-200 bg-teal-50 text-teal-700'
                        }`}
                      >
                        {slot.slot_time}
                        {slot.is_booked ? (
                          <span className="text-xs">Booked</span>
                        ) : (
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
