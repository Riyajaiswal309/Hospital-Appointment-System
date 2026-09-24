import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, Mail, Lock, User, Phone, ArrowRight, UserCircle, Stethoscope as Steth, ShieldCheck } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { signUp, clearError } from '@/store/slices/authSlice';
import { addToast } from '@/store/slices/uiSlice';
import type { UserRole } from '@/types';

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('patient');

  const roles: { value: UserRole; label: string; icon: typeof User; desc: string }[] = [
    { value: 'patient', label: 'Patient', icon: UserCircle, desc: 'Book appointments and manage health' },
    { value: 'doctor', label: 'Doctor', icon: Steth, desc: 'Manage patients and appointments' },
  { value: 'admin', label: 'Admin', icon: ShieldCheck, desc: 'Manage the entire platform' },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(signUp({ email, password, fullName, phone, role }));
    if (signUp.fulfilled.match(result)) {
      dispatch(
        addToast({
          message: role === 'doctor' ? 'Account created! Waiting for admin approval.' : 'Welcome to MediBook!',
          type: 'success',
        })
      );
      navigate('/dashboard');
    } else {
      dispatch(addToast({ message: (result.payload as string) || 'Sign up failed', type: 'error' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-800 text-xl">MediBook</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Create account</h1>
          <p className="text-slate-500 text-sm mb-6">Join MediBook and manage your healthcare</p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">I am a</label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                      role === r.value
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <r.icon className={`w-5 h-5 ${role === r.value ? 'text-teal-600' : 'text-slate-400'}`} />
                    <span className={`text-xs font-medium ${role === r.value ? 'text-teal-700' : 'text-slate-600'}`}>
                      {r.label}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1.5">{roles.find((r) => r.value === role)?.desc}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="+1 234 567 890"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
