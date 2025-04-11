import { supabase } from '../supabase';

export const createTestRequest = async (testData) => {
  try {
    const { data, error } = await supabase
      .from('test_requests')
      .insert([
        {
          ...testData,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error creating test request:', error);
    return null;
  }
};

export const getTestsByPatient = async (patientId) => {
  try {
    const { data, error } = await supabase
      .from('test_requests')
      .select('*')
      .eq('patient_id', patientId);

    if (error) throw error;
    return data.map(record => ({
      id: record.id,
      ...record
    }));
  } catch (error) {
    console.error('Error getting patient tests:', error);
    return [];
  }
};

export const getTestsByLab = async (labId) => {
  try {
    const { data, error } = await supabase
      .from('test_requests')
      .select('*')
      .eq('lab_id', labId);

    if (error) throw error;
    return data.map(record => ({
      id: record.id,
      ...record
    }));
  } catch (error) {
    console.error('Error getting lab tests:', error);
    return [];
  }
};

export const updateTestStatus = async (testId, status) => {
  try {
    await updateDoc(doc(db, 'testRequests', testId), {
      status,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error updating test status:', error);
    return false;
  }
};
