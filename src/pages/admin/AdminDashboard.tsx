import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { Users, Stethoscope, DollarSign, Calendar, TrendingUp } from 'lucide-react';

export function AdminDashboard() {
  const { profile } = useAppSelector((s) => s.auth);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    pendingDoctors: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    completedAppointments: 0,
  });
  const [revenueData, setRevenueData] = useState<{ date: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [profile]);

  const fetchStats = async () => {
    const [patients, doctors, pendingDocs, appointments, payments] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'patient'),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'doctor'),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'doctor').eq('is_approved', false),
      supabase.from('appointments').select('id, status'),
      supabase.from('payments').select('amount, created_at').eq('status', 'completed'),
    ]);

    const totalRevenue = (payments.data || []).reduce((sum, p) => sum + Number(p.amount), 0);
    const completed = (appointments.data || []).filter((a) => a.status === 'completed').length;

    setStats({
      totalPatients: patients.count || 0,
      totalDoctors: doctors.count || 0,
      pendingDoctors: pendingDocs.count || 0,
      totalAppointments: appointments.data?.length || 0,
      totalRevenue,
      completedAppointments: completed,
    });

    // Revenue by date (last 7 days)
    const last7Days: { date: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayRevenue = (payments.data || [])
        .filter((p) => p.created_at.startsWith(dateStr))
        .reduce((sum, p) => sum + Number(p.amount), 0);
      last7Days.push({ date: dateStr, revenue: dayRevenue });
    }
    setRevenueData(last7Days);
    setLoading(false);
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-100 rounded w-1/4" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    { label: 'Total Patients', value: stats.totalPatients, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Doctors', value: stats.totalDoctors, icon: Stethoscope, color: 'text-teal-600 bg-teal-50' },
    { label: 'Pending Approvals', value: stats.pendingDoctors, icon: Calendar, color: 'text-amber-600 bg-amber-50' },
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600 bg-green-50' },
  ];

  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue), 1);

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Platform overview and statistics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Revenue (Last 7 Days)</h2>
          <div className="flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="w-4 h-4" />
            ₹{stats.totalRevenue.toLocaleString()} total
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 h-48">
          {revenueData.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full bg-gradient-to-t from-teal-500 to-teal-300 rounded-t-lg transition-all hover:from-teal-600 hover:to-teal-400"
                  style={{ height: `${(d.revenue / maxRevenue) * 100}%`, minHeight: d.revenue > 0 ? '8px' : '2px' }}
                  title={`₹${d.revenue}`}
                />
              </div>
              <span className="text-xs text-slate-400">
                {new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-3">Appointments Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Appointments</span>
              <span className="font-medium text-slate-900">{stats.totalAppointments}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Completed</span>
              <span className="font-medium text-green-600">{stats.completedAppointments}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Pending Approvals</span>
              <span className="font-medium text-amber-600">{stats.pendingDoctors}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-3">Quick Actions</h3>
          <div className="space-y-2 text-sm">
            <a href="/admin/doctors" className="block text-teal-600 hover:underline">Review pending doctors →</a>
            <a href="/admin/specializations" className="block text-teal-600 hover:underline">Manage specializations →</a>
            <a href="/admin/appointments" className="block text-teal-600 hover:underline">View all appointments →</a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
