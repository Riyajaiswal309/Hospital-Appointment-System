export type UserRole = 'patient' | 'doctor' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Specialization {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

export interface DoctorProfile {
  id: string;
  doctor_id: string;
  specialization_id: string | null;
  bio: string | null;
  consultation_fee: number;
  experience_years: number;
  education: string | null;
  available_days: string[];
  available_time_start: string;
  available_time_end: string;
  rating: number;
  total_ratings: number;
  created_at: string;
  updated_at: string;
}

export interface DoctorWithProfile extends DoctorProfile {
  profiles: Profile;
  specializations: Specialization | null;
}

export interface DoctorSlot {
  id: string;
  doctor_id: string;
  slot_date: string;
  slot_time: string;
  is_booked: boolean;
  created_at: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  slot_id: string | null;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  reason: string | null;
  diagnosis: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithDetails extends Appointment {
  doctor_profiles: Profile;
  patient_profiles: Profile;
  doctor_doctor_profiles: DoctorProfile | null;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  medications: Medication[];
  notes: string | null;
  created_at: string;
}

export interface MedicalRecord {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  created_at: string;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  created_at: string;
  updated_at: string;
}
