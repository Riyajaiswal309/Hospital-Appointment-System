import { useEffect, useState, type FormEvent } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import type { Specialization } from '@/types';
import { addToast } from '@/store/slices/uiSlice';
import { Plus, Trash2, Pencil, X } from 'lucide-react';

export function AdminSpecializationsPage() {
  const dispatch = useAppDispatch();
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Specialization | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');

  useEffect(() => {
    fetchSpecializations();
  }, []);

  const fetchSpecializations = async () => {
    setLoading(true);
    const { data } = await supabase.from('specializations').select('*').order('name');
    setSpecializations(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editing) {
      const { error } = await supabase
        .from('specializations')
        .update({ name, description, icon })
        .eq('id', editing.id);
      if (error) {
        dispatch(addToast({ message: error.message, type: 'error' }));
      } else {
        dispatch(addToast({ message: 'Specialization updated', type: 'success' }));
        resetForm();
        fetchSpecializations();
      }
    } else {
      const { error } = await supabase.from('specializations').insert({ name, description, icon });
      if (error) {
        dispatch(addToast({ message: error.message, type: 'error' }));
      } else {
        dispatch(addToast({ message: 'Specialization added', type: 'success' }));
        resetForm();
        fetchSpecializations();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('specializations').delete().eq('id', id);
    if (error) {
      dispatch(addToast({ message: error.message, type: 'error' }));
    } else {
      dispatch(addToast({ message: 'Specialization deleted', type: 'success' }));
      fetchSpecializations();
    }
  };

  const startEdit = (spec: Specialization) => {
    setEditing(spec);
    setName(spec.name);
    setDescription(spec.description || '');
    setIcon(spec.icon || '');
    setShowForm(true);
  };

  const resetForm = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setIcon('');
    setShowForm(false);
  };

  return (
    <DashboardLayout role="admin">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Specializations</h1>
          <p className="text-slate-500 mt-1">Manage medical specializations</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700"
        >
          <Plus className="w-4 h-4" />
          Add New
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">
              {editing ? 'Edit Specialization' : 'New Specialization'}
            </h2>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="e.g. Cardiology"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Heart and cardiovascular system"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Icon name (optional)</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="heart"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700"
          >
            {editing ? 'Update' : 'Create'} Specialization
          </button>
        </form>
      )}

      {loading ? (
        <div className="animate-pulse grid md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-slate-200" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {specializations.map((spec) => (
            <div key={spec.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{spec.name}</h3>
                  {spec.description && (
                    <p className="text-sm text-slate-500 mt-0.5">{spec.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(spec)}
                    className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(spec.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
