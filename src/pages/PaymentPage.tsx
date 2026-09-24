import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { supabase } from '@/lib/supabase';
import { addToast } from '@/store/slices/uiSlice';
import type { DoctorSlot, DoctorProfile, Profile, Specialization } from '@/types';
import { CreditCard, Shield, CheckCircle, ArrowLeft, Lock } from 'lucide-react';

interface PaymentState {
  slot: DoctorSlot;
  doctor: {
    id: string;
    doctor_id: string;
    consultation_fee: number;
    profiles: Profile;
    specializations: Specialization | null;
  };
}

export function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((s) => s.auth);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');

  const state = location.state as PaymentState | null;
  if (!state) return <Navigate to="/dashboard" replace />;
  if (!profile) return <Navigate to="/login" replace />;

  const { slot, doctor } = state;
  const amount = doctor.consultation_fee;

  const handlePayment = async (e: FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setStep('processing');

    // Check for double-booking race condition
    const { data: existing } = await supabase
      .from('appointments')
      .select('id')
      .eq('slot_id', slot.id)
      .neq('status', 'cancelled')
      .maybeSingle();

    if (existing) {
      dispatch(addToast({ message: 'This slot was just booked by someone else.', type: 'error' }));
      navigate('/patient/find-doctors');
      return;
    }

    // Create appointment
    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .insert({
        patient_id: profile.id,
        doctor_id: doctor.doctor_id,
        slot_id: slot.id,
        appointment_date: slot.slot_date,
        appointment_time: slot.slot_time,
        status: 'confirmed',
      })
      .select()
      .maybeSingle();

    if (aptError || !appointment) {
      dispatch(addToast({ message: 'Failed to create appointment', type: 'error' }));
      setProcessing(false);
      setStep('details');
      return;
    }

    // Mark slot as booked
    await supabase.from('doctor_slots').update({ is_booked: true }).eq('id', slot.id);

    // Mock Razorpay order creation
    const orderId = `order_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock payment verification
    const paymentId = `pay_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
    const signature = `sig_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;

    // Save payment record
    const { error: paymentError } = await supabase.from('payments').insert({
      appointment_id: appointment.id,
      patient_id: profile.id,
      doctor_id: doctor.doctor_id,
      amount,
      currency: 'INR',
      status: 'completed',
      payment_method: 'razorpay',
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    });

    if (paymentError) {
      dispatch(addToast({ message: 'Payment recorded with issues. Contact support.', type: 'error' }));
    } else {
      setStep('success');
      dispatch(addToast({ message: 'Payment successful! Appointment confirmed.', type: 'success' }));
    }
    setProcessing(false);
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
          <p className="text-slate-500 mb-6">
            Your appointment with {doctor.profiles.full_name} on {slot.slot_date} at {slot.slot_time} has been confirmed.
          </p>
          <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500">Amount Paid</span>
              <span className="font-semibold text-slate-900">₹{amount}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500">Doctor</span>
              <span className="font-medium text-slate-700">{doctor.profiles.full_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Date & Time</span>
              <span className="font-medium text-slate-700">{slot.slot_date} {slot.slot_time}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/patient/appointments')}
            className="w-full bg-teal-600 text-white py-2.5 rounded-lg font-medium hover:bg-teal-700"
          >
            View My Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/patient/find-doctors')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to doctors
        </button>

        <div className="grid md:grid-cols-5 gap-6">
          {/* Order Summary */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center text-teal-700 font-semibold">
                    {doctor.profiles.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{doctor.profiles.full_name}</p>
                    <p className="text-xs text-slate-500">{doctor.specializations?.name || 'General'}</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Date</span>
                  <span className="font-medium text-slate-700">{slot.slot_date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Time</span>
                  <span className="font-medium text-slate-700">{slot.slot_time}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Consultation Fee</span>
                  <span className="font-semibold text-slate-900">₹{amount}</span>
                </div>
                <div className="flex justify-between text-sm pt-3 border-t border-slate-100">
                  <span className="text-slate-500">Platform Fee</span>
                  <span className="font-medium text-slate-700">₹0</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-100">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="font-bold text-teal-600 text-lg">₹{amount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="md:col-span-3">
            <form onSubmit={handlePayment} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-5">
                <CreditCard className="w-5 h-5 text-teal-600" />
                <h2 className="font-semibold text-slate-900">Payment Details</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Card Number</label>
                  <input
                    type="text"
                    required
                    placeholder="4111 1111 1111 1111"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Expiry</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">CVV</label>
                    <input
                      type="text"
                      required
                      placeholder="123"
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Name on Card</label>
                  <input
                    type="text"
                    required
                    placeholder={profile.full_name}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors mt-6 disabled:opacity-70"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Pay ₹{amount}
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-slate-400">
                <Shield className="w-3.5 h-3.5" />
                Secured by Razorpay (mock)
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
