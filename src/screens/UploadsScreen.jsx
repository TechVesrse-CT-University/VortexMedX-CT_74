import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput,
  Animated,
  ActivityIndicator
} from 'react-native';
import { uploadFile } from '../services/storageService';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialIcons } from '@expo/vector-icons';

export default function UploadsScreen() {
  const [fileDescription, setFileDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [patientUID, setPatientUID] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Run entry animation when component mounts
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file to upload.");
      return;
    }
    
    if (!patientUID) {
      alert("Please enter a Patient UID.");
      return;
    }
    
    setUploading(true);
    
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false
    }).start();
    
    try {
      // Check if we're using the new or old DocumentPicker API
      const fileUri = selectedFile.uri || selectedFile.assets[0].uri;
      const fileName = selectedFile.name || selectedFile.assets[0].name;
      
      await uploadFile(patientUID, fileUri, fileName, fileDescription);
      setUploadComplete(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setUploadComplete(false);
        setSelectedFile(null);
        setFileDescription('');
        progressAnim.setValue(0);
      }, 3000);
    } catch (error) {
      alert("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const pickFile = async () => {
    try {
      // Using the latest Expo DocumentPicker API
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });
      
      // Handle both old and new API return formats
      if (result.canceled === false || result.type === 'success') {
        // Button press animation
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 100,
            useNativeDriver: true
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true
          })
        ]).start();
        
        setSelectedFile(result);
      }
    } catch (err) {
      alert("Error selecting file: " + err.message);
    }
  };

  // Get file icon based on file type
  const getFileIcon = () => {
    if (!selectedFile) return null;
    
    // Handle both API formats
    const fileName = selectedFile.name || 
                    (selectedFile.assets && selectedFile.assets[0]?.name) || 
                    "unknown.file";
    
    const fileType = fileName.split('.').pop().toLowerCase();
    
    switch (fileType) {
      case 'pdf':
        return <MaterialIcons name="picture-as-pdf" size={24} color="#E74C3C" />;
      case 'doc':
      case 'docx':
        return <MaterialIcons name="description" size={24} color="#3498DB" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <MaterialIcons name="image" size={24} color="#2ECC71" />;
      default:
        return <MaterialIcons name="insert-drive-file" size={24} color="#95A5A6" />;
    }
  };

  // Get file name safely with new or old API
  const getFileName = () => {
    if (!selectedFile) return "";
    
    if (selectedFile.assets && selectedFile.assets.length > 0) {
      return selectedFile.assets[0].name;
    }
    
    return selectedFile.name || "Selected File";
  };

  // Check if file is selected with either API format
  const hasFileSelected = () => {
    return selectedFile && (
      selectedFile.type === 'success' || 
      (selectedFile.assets && selectedFile.assets.length > 0)
    );
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Upload Patient Documents</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Patient UID</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter patient identifier"
            value={patientUID}
            onChangeText={setPatientUID}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>File Description</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter file description"
            value={fileDescription}
            onChangeText={setFileDescription}
            multiline={true}
            numberOfLines={2}
          />
        </View>
        
        {hasFileSelected() ? (
          <View style={styles.fileInfoContainer}>
            <View style={styles.fileInfo}>
              {getFileIcon()}
              <Text style={styles.fileName} numberOfLines={1}>{getFileName()}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedFile(null)}>
              <MaterialIcons name="close" size={24} color="#777" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.filePicker}
            onPress={pickFile}
            activeOpacity={0.7}
          >
            <MaterialIcons name="cloud-upload" size={36} color="#3498DB" />
            <Text style={styles.filePickerText}>Select Document</Text>
          </TouchableOpacity>
        )}
        
        {uploading && (
          <View style={styles.progressContainer}>
            <Animated.View 
              style={[
                styles.progressBar,
                { width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })}
              ]}
            />
          </View>
        )}
        
        {uploadComplete ? (
          <View style={styles.successContainer}>
            <MaterialIcons name="check-circle" size={24} color="#2ECC71" />
            <Text style={styles.successText}>Upload Complete!</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={[
              styles.uploadButton, 
              (!hasFileSelected() || !patientUID) && styles.disabledButton
            ]}
            onPress={handleUpload}
            disabled={!hasFileSelected() || !patientUID || uploading}
            activeOpacity={0.8}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.uploadButtonText}>Upload Document</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7F8C8D',
    marginBottom: 6,
  },
  input: {
    height: 50,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  filePicker: {
    height: 120,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#3498DB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FBFF',
    marginVertical: 16,
  },
  filePickerText: {
    color: '#3498DB',
    fontSize: 16,
    marginTop: 8,
    fontWeight: '500',
  },
  fileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    color: '#2C3E50',
    marginLeft: 8,
    flex: 1,
  },
  uploadButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#BDC3C7',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginVertical: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3498DB',
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F0FFF4',
    borderRadius: 8,
  },
  successText: {
    color: '#2ECC71',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  }
});