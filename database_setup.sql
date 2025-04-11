-- MEDVORTEX PRODUCTION DATABASE SETUP
-- Version 1.0
-- Last Updated: 2023-11-15

-------------------------------
-- 1. EXTENSIONS AND PREREQUISITES
-------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-------------------------------
-- 2. CORE TABLES WITH VALIDATION
-------------------------------

-- USERS TABLE (Authentication Hub)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE 
    CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
  name TEXT NOT NULL 
    CHECK (length(name) BETWEEN 2 AND 100),
  phone TEXT 
    CHECK (phone ~* '^\+?[0-9]{10,15}$'),
  role TEXT NOT NULL 
    CHECK (role IN ('patient', 'doctor', 'labOwner', 'admin')),
  license_number TEXT,
  specialization TEXT,
  user_friendly_uid TEXT NOT NULL UNIQUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MEDICAL RECORDS (Patient Health Data)
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 5 AND 200),
  description TEXT,
  diagnosis_code TEXT,
  treatment_plan TEXT,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_confidential BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TEST RESULTS (Lab Reports)
CREATE TABLE IF NOT EXISTS public.test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL CHECK (length(test_type) > 0),
  result_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL 
    CHECK (status IN ('pending', 'completed', 'cancelled', 'reviewed')) 
    DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  CONSTRAINT valid_result_data CHECK (
    result_data::text ~ '^{.*}$' AND 
    (status != 'completed' OR completed_at IS NOT NULL)
  )
);

-- APPOINTMENTS (Scheduling System)
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  appointment_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL 
    CHECK (duration_minutes BETWEEN 15 AND 240) 
    DEFAULT 30,
  status TEXT NOT NULL 
    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show'))
    DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_appointment_time CHECK (
    (status = 'scheduled' AND appointment_time > NOW()) OR
    (status IN ('completed', 'cancelled', 'no_show'))
  )
);

-- MEDICAL FILES (Document Management)
CREATE TABLE IF NOT EXISTS public.medical_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id UUID REFERENCES public.medical_records(id) ON DELETE CASCADE,
  test_id UUID REFERENCES public.test_results(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_reference CHECK (
    (record_id IS NOT NULL)::integer + 
    (test_id IS NOT NULL)::integer + 
    (appointment_id IS NOT NULL)::integer = 1
  )
);

-------------------------------
-- 3. INDEXES FOR PERFORMANCE
-------------------------------
-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Medical records indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON public.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON public.medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_date ON public.medical_records(record_date);

-- Test results indexes
CREATE INDEX IF NOT EXISTS idx_test_results_patient_id ON public.test_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_test_results_lab_id ON public.test_results(lab_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON public.test_results(status);
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON public.test_results(created_at);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_time_status ON public.appointments(appointment_time, status);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON public.appointments(created_at);

-- Medical files indexes
CREATE INDEX IF NOT EXISTS idx_medical_files_uploaded_by ON public.medical_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_medical_files_created_at ON public.medical_files(created_at);
CREATE INDEX IF NOT EXISTS idx_medical_files_type ON public.medical_files(file_type);

-------------------------------
-- 4. ROW LEVEL SECURITY
-------------------------------
-- Enable RLS for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_files ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage users"
ON public.users FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Medical records policies
CREATE POLICY "Patients can view their medical records"
ON public.medical_records FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view their patients' records"
ON public.medical_records FOR SELECT
USING (
  auth.uid() = doctor_id OR
  EXISTS (
    SELECT 1 FROM public.appointments
    WHERE appointments.doctor_id = auth.uid()
    AND appointments.patient_id = medical_records.patient_id
  )
);

CREATE POLICY "Doctors can create medical records"
ON public.medical_records FOR INSERT
WITH CHECK (
  auth.uid() = doctor_id AND
  EXISTS (
    SELECT 1 FROM public.appointments
    WHERE appointments.doctor_id = auth.uid()
    AND appointments.patient_id = medical_records.patient_id
  )
);

-- [Additional policies continue...]
