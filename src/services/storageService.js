import { supabase } from '../supabase';

/**
 * Service for handling file storage operations using Supabase Storage
 */

/**
 * Upload a file to Supabase Storage
 * @param {string} userId - The ID of the user uploading the file
 * @param {string} fileUri - The URI of the file to upload
 * @param {string} fileName - The name to give the file
 * @param {string} folder - The folder to store the file in (default: 'uploads')
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export const uploadFile = async (userId, fileUri, fileName, folder = 'uploads') => {
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
      console.error('Error uploading to Supabase:', error.message);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
    
    // Get the public URL for the file
    const { data: urlData } = supabase.storage
      .from('medical-files')
      .getPublicUrl(filePath);
    
    console.log('File uploaded successfully to Supabase!');
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadFile:', error);
    throw error;
  }
};

/**
 * Get the public URL for a file in Supabase Storage
 * @param {string} filePath - The path to the file in storage
 * @returns {string} - The public URL of the file
 */
export const getFileUrl = (filePath) => {
  const { data } = supabase.storage
    .from('medical-files')
    .getPublicUrl(filePath);
  
  return data?.publicUrl;
};

/**
 * Delete a file from Supabase Storage
 * @param {string} filePath - The path to the file to delete
 * @returns {Promise<boolean>} - True if deletion was successful
 */
export const deleteFile = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from('medical-files')
      .remove([filePath]);
    
    if (error) {
      console.error('Error deleting from Supabase:', error.message);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
    
    console.log('File deleted successfully from Supabase!');
    return true;
  } catch (error) {
    console.error('Error in deleteFile:', error);
    throw error;
  }
};