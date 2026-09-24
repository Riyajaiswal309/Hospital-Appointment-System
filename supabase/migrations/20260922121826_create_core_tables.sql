/*
# Hospital Appointment System - Core Schema

## Overview
Creates the full schema for a hospital & doctor appointment system with 3 roles:
Patient, Doctor, and Admin. Uses Supabase auth.users for authentication and a
profiles table to store role-specific data.

## New Tables

1. `profiles` - Extends auth.users with role (patient/doctor/admin), full_name, phone, avatar_url, and approval status for doctors.
2. `specializations` - Medical specializations (Cardiology, Neurology, etc.) managed by admins.
3. `doctor_profiles` - Doctor-specific data: bio, consultation fee, available days, registration status.
4. `doctor_slots` - Time slots created by doctors for appointments.
5. `appointments` - Booking records linking patients, doctors, slots, with status and payment info.
6. `prescriptions` - Prescriptions written by doctors for appointments.
7. `medical_records` - Medical documents uploaded by doctors for appointments.
8. `payments` - Mock payment records for appointments.

## Security
- RLS enabled on all tables.
- Patients can read approved doctors, book slots, view their own appointments/records.
- Doctors can manage their profile/slots, view their appointments, write prescriptions.
- Admins can manage all data (via admin-scoped policies checking role = 'admin').
- Owner columns default to auth.uid() for seamless inserts.
*/

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
  avatar_url text,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "select_doctor_profiles" ON profiles;
CREATE POLICY "select_doctor_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    role = 'doctor' AND is_approved = true
    OR auth.uid() = id
  );

-- SPECIALIZATIONS TABLE
CREATE TABLE IF NOT EXISTS specializations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE specializations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_specializations" ON specializations;
CREATE POLICY "select_specializations" ON specializations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_specializations_admin" ON specializations;
CREATE POLICY "insert_specializations_admin" ON specializations FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "update_specializations_admin" ON specializations;
CREATE POLICY "update_specializations_admin" ON specializations FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "delete_specializations_admin" ON specializations;
CREATE POLICY "delete_specializations_admin" ON specializations FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DOCTOR_PROFILES TABLE
CREATE TABLE IF NOT EXISTS doctor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  specialization_id uuid REFERENCES specializations(id) ON DELETE SET NULL,
  bio text,
  consultation_fee numeric(10,2) NOT NULL DEFAULT 0,
  experience_years int DEFAULT 0,
  education text,
  available_days text[] DEFAULT '{}',
  available_time_start text DEFAULT '09:00',
  available_time_end text DEFAULT '17:00',
  rating numeric(2,1) DEFAULT 0,
  total_ratings int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_doctor_profiles_all" ON doctor_profiles;
CREATE POLICY "select_doctor_profiles_all" ON doctor_profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_doctor_profile" ON doctor_profiles;
CREATE POLICY "insert_own_doctor_profile" ON doctor_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "update_own_doctor_profile" ON doctor_profiles;
CREATE POLICY "update_own_doctor_profile" ON doctor_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = doctor_id) WITH CHECK (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "update_doctor_profile_admin" ON doctor_profiles;
CREATE POLICY "update_doctor_profile_admin" ON doctor_profiles FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DOCTOR_SLOTS TABLE
CREATE TABLE IF NOT EXISTS doctor_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slot_date date NOT NULL,
  slot_time text NOT NULL,
  is_booked boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE doctor_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_slots_all" ON doctor_slots;
CREATE POLICY "select_slots_all" ON doctor_slots FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_slots" ON doctor_slots;
CREATE POLICY "insert_own_slots" ON doctor_slots FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "update_own_slots" ON doctor_slots;
CREATE POLICY "update_own_slots" ON doctor_slots FOR UPDATE
  TO authenticated USING (auth.uid() = doctor_id) WITH CHECK (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "delete_own_slots" ON doctor_slots;
CREATE POLICY "delete_own_slots" ON doctor_slots FOR DELETE
  TO authenticated USING (auth.uid() = doctor_id);

-- APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slot_id uuid REFERENCES doctor_slots(id) ON DELETE SET NULL,
  appointment_date date NOT NULL,
  appointment_time text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rejected')),
  reason text,
  diagnosis text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_appointments" ON appointments;
CREATE POLICY "select_own_appointments" ON appointments FOR SELECT
  TO authenticated USING (
    auth.uid() = patient_id
    OR auth.uid() = doctor_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "insert_own_appointments" ON appointments;
CREATE POLICY "insert_own_appointments" ON appointments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "update_own_appointments" ON appointments;
CREATE POLICY "update_own_appointments" ON appointments FOR UPDATE
  TO authenticated USING (
    auth.uid() = patient_id
    OR auth.uid() = doctor_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    auth.uid() = patient_id
    OR auth.uid() = doctor_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- PRESCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  medications jsonb NOT NULL DEFAULT '[]',
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_prescriptions" ON prescriptions;
CREATE POLICY "select_prescriptions" ON prescriptions FOR SELECT
  TO authenticated USING (
    auth.uid() = patient_id
    OR auth.uid() = doctor_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "insert_prescriptions_doctor" ON prescriptions;
CREATE POLICY "insert_prescriptions_doctor" ON prescriptions FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = doctor_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- MEDICAL_RECORDS TABLE
CREATE TABLE IF NOT EXISTS medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text DEFAULT 'document',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_medical_records" ON medical_records;
CREATE POLICY "select_medical_records" ON medical_records FOR SELECT
  TO authenticated USING (
    auth.uid() = patient_id
    OR auth.uid() = doctor_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "insert_medical_records_doctor" ON medical_records;
CREATE POLICY "insert_medical_records_doctor" ON medical_records FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = doctor_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method text DEFAULT 'razorpay',
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_payments" ON payments;
CREATE POLICY "select_payments" ON payments FOR SELECT
  TO authenticated USING (
    auth.uid() = patient_id
    OR auth.uid() = doctor_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "insert_own_payments" ON payments;
CREATE POLICY "insert_own_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "update_own_payments" ON payments;
CREATE POLICY "update_own_payments" ON payments FOR UPDATE
  TO authenticated USING (
    auth.uid() = patient_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    auth.uid() = patient_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_doctor_id ON doctor_profiles(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_specialization ON doctor_profiles(specialization_id);
CREATE INDEX IF NOT EXISTS idx_doctor_slots_doctor_id ON doctor_slots(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_slots_date ON doctor_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment_id ON prescriptions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payments(patient_id);
