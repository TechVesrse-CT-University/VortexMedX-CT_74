
import { supabase } from '../supabase';












// Create user profile with role (to be called from Supabase RPC)
export const createUserProfile = async (userData) => {
  const { user_id, user_email, user_role, user_phone, user_uid, user_name } = userData;
  
  return await supabase
    .from('users')
    .insert({
      id: user_id,
      email: user_email,
      role: user_role,
      phone: user_phone,
      user_friendly_uid: user_uid,
      name: user_name || user_email.split('@')[0]
    })
    .select();
};

// Database Connection Check
export const checkDatabaseConnection = async () => {
  try {
    // Use a simple RPC call that bypasses RLS
    const { data, error } = await supabase.rpc('version');
    
    if (error) throw error;
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
};

// User Operations
export const getUser = async (userId) => {
  return await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
};

// Medical Records Operations
export const getMedicalRecords = async (patientId) => {
  return await supabase
    .from('medical_records')
    .select('*')
    .eq('patient_id', patientId);
};

// Test Results Operations
export const getTestResults = async (patientId) => {
  return await supabase
    .from('test_results')
    .select('*')
    .eq('patient_id', patientId);
};

// Appointments Operations
export const getAppointments = async (userId) => {
  return await supabase
    .from('appointments')
    .select('*')
    .or(`patient_id.eq.${userId},doctor_id.eq.${userId}`);
};

// File Operations
export const getMedicalFiles = async (userId) => {
  return await supabase
    .from('medical_files')
    .select('*')
    .eq('uploaded_by', userId);
};
