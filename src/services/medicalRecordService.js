import { supabase } from '../supabase';
import { uploadFile } from './storageService';

export const createMedicalRecord = async (recordData) => {
  try {
    const { data, error } = await supabase
      .from('medical_records')
      .insert([
        {
          ...recordData,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error creating medical record:', error);
    return null;
  }
};

export const getMedicalRecords = async (patientId) => {
  try {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(record => ({
      id: record.id,
      ...record,
      date: new Date(record.created_at)
    }));
  } catch (error) {
    console.error('Error getting medical records:', error);
    return [];
  }
};

export const uploadMedicalFile = async (fileUri, fileName) => {
  try {
    // Use a generic user ID for medical files or pass the actual user ID
    const userId = 'medical-system';
    const publicUrl = await uploadFile(userId, fileUri, fileName, 'medical-files');
    return publicUrl;
  } catch (error) {
    console.error('Error uploading medical file:', error);
    return null;
  }
};

export const getRecordById = async (recordId) => {
  try {
    const docRef = doc(db, 'medicalRecords', recordId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? {
      id: docSnap.id,
      ...docSnap.data(),
      date: docSnap.data().createdAt.toDate()
    } : null;
  } catch (error) {
    console.error('Error getting medical record:', error);
    return null;
  }
};
