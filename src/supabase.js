import { createClient } from '@supabase/supabase-js';
import 'react-native-polyfill-globals';

// Supabase configuration
const supabaseUrl = 'https://smyhroniahhqvvxwqsss.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNteWhyb25pYWhocXZ2eHdxc3NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzUxNDQsImV4cCI6MjA1OTcxMTE0NH0.atJmlAtLo673VyUQheYrHwo4EzaAt9unIFkNh6FW_YM';

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to upload a file to Supabase Storage
export const uploadFileToSupabase = async (userId, fileUri, fileName, folder = 'uploads') => {
  try {
    // Create a unique path for the file
    const filePath = `${folder}/${userId}/${fileName}`;
    
    // Fetch the file content
    const response = await fetch(fileUri);
    const blob = await response.blob();
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('medical-files')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      throw error;
    }
    
    // Get the public URL for the file
    const { data: urlData } = supabase.storage
      .from('medical-files')
      .getPublicUrl(filePath);
    
    console.log('File uploaded successfully to Supabase!');
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading file to Supabase:', error);
    throw error;
  }
};

// Function to download a file from Supabase Storage
export const getFileUrl = (filePath) => {
  const { data } = supabase.storage
    .from('medical-files')
    .getPublicUrl(filePath);
  
  return data?.publicUrl;
};

// Function to delete a file from Supabase Storage
export const deleteFile = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from('medical-files')
      .remove([filePath]);
    
    if (error) {
      throw error;
    }
    
    console.log('File deleted successfully from Supabase!');
    return true;
  } catch (error) {
    console.error('Error deleting file from Supabase:', error);
    throw error;
  }
};