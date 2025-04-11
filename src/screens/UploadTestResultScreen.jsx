import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  TextInput,
  FlatList
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { uploadFile } from '../services/storageService';
import * as DocumentPicker from 'expo-document-picker';

export default function UploadTestResultScreen({ user, navigation }) {
  const [testRequests, setTestRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRequests, setFilteredRequests] = useState([]);

  useEffect(() => {
    fetchTestRequests();
  }, []);

  useEffect(() => {
    if (testRequests.length > 0) {
      setFilteredRequests(
        testRequests.filter(request => 
          request.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.testType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.doctorName?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, testRequests]);

  const fetchTestRequests = async () => {
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch pending test requests for lab owner
      const testRequestsQuery = query(
        collection(db, 'testRequests'),
        where('labId', '==', user.uid),
        where('status', '==', 'pending')
      );
      
      const testRequestsSnapshot = await getDocs(testRequestsQuery);
      const testRequestsData = testRequestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTestRequests(testRequestsData);
      setFilteredRequests(testRequestsData);
    } catch (error) {
      console.error('Error fetching test requests:', error);
      Alert.alert('Error', 'Failed to load test requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadTestResult = async (patientId) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });
      
      if (result.canceled === false || result.type === 'success') {
        setUploading(true);
        
        // Get file URI and name
        const fileUri = result.uri || result.assets[0].uri;
        const fileName = result.name || result.assets[0].name;
        
        // Upload file to Firebase Storage
        await uploadFile(patientId, fileUri, fileName, 'Test Result');
        
        // Find the test request
        const testRequest = testRequests.find(req => req.patientId === patientId);
        
        if (testRequest) {
          // Update test request status
          await updateDoc(doc(db, 'testRequests', testRequest.id), {
            status: 'completed',
            resultUploadedAt: serverTimestamp()
          });
          
          // Add to test results collection
          await addDoc(collection(db, 'testResults'), {
            patientId: patientId,
            patientName: testRequest.patientName || 'Unknown Patient',
            labId: user.uid,
            testName: testRequest.testType || 'Unknown Test',
            fileName,
            fileType: fileName.split('.').pop().toLowerCase(),
            date: serverTimestamp(),
            uploadedAt: serverTimestamp()
          });
          
          Alert.alert('Success', 'Test result uploaded successfully');
          
          // Refresh data
          fetchTestRequests();
        }
      }
    } catch (error) {
      console.error('Error uploading test result:', error);
      Alert.alert('Error', 'Failed to upload test result. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateTime) => {
    if (!dateTime) return 'N/A';
    
    try {
      // Handle both Firestore timestamps and ISO strings
      const date = dateTime.toDate ? dateTime.toDate() : new Date(dateTime);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Upload Test Results</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#A0AEC0" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by patient, test type or doctor"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="clear" size={20} color="#A0AEC0" />
          </TouchableOpacity>
        )}
      </View>

      {/* Test requests list */}
      {loading ? (
        <ActivityIndicator size="large" color="#4E73DF" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="assignment" size={64} color="#E2E8F0" />
              <Text style={styles.emptyStateText}>No pending test requests</Text>
              <Text style={styles.emptyStateSubText}>All test requests will appear here</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <MaterialIcons name="assignment" size={24} color="#4E73DF" />
                <Text style={styles.requestTitle}>{item.testType || 'Unknown Test'}</Text>
                <View style={styles.urgencyBadge}>
                  <Text style={styles.urgencyText}>
                    {item.urgency === 'high' ? 'Urgent' : 'Normal'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.requestDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Patient:</Text>
                  <Text style={styles.detailValue}>{item.patientName || 'Unknown'}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Doctor:</Text>
                  <Text style={styles.detailValue}>{item.doctorName || 'Unknown'}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Requested:</Text>
                  <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                onPress={() => handleUploadTestResult(item.patientId)}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <MaterialIcons name="file-upload" size={18} color="white" />
                    <Text style={styles.uploadButtonText}>Upload Result</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    marginRight: 15,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#4A5568',
  },
  loader: {
    marginTop: 50,
  },
  listContent: {
    padding: 15,
    paddingBottom: 30,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1,
    color: '#333',
  },
  urgencyBadge: {
    backgroundColor: '#FED7D7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  urgencyText: {
    color: '#E53E3E',
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#4A5568',
  },
  uploadButton: {
    backgroundColor: '#4E73DF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  uploadButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A5568',
    marginTop: 15,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#A0AEC0',
    marginTop: 5,
    textAlign: 'center',
  },
});